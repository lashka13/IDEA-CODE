import { useRef, useEffect, useCallback } from 'react';
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import type { editor } from 'monaco-editor';

export function useCollaborativeEditor(roomId: string) {
  const yDocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebrtcProvider | null>(null);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const isRemoteChangeRef = useRef(false);

  const bindEditor = useCallback((monacoEditor: editor.IStandaloneCodeEditor) => {
    editorRef.current = monacoEditor;

    // Create Yjs document and WebRTC provider
    const yDoc = new Y.Doc();
    yDocRef.current = yDoc;

    const provider = new WebrtcProvider(`idea-code-${roomId}`, yDoc, {
      signaling: ['wss://signaling.yjs.dev', 'wss://y-webrtc-signaling-eu.herokuapp.com'],
    });
    providerRef.current = provider;

    const yText = yDoc.getText('monaco');

    // Sync Yjs -> Monaco
    yText.observe((event) => {
      if (isRemoteChangeRef.current) return;
      isRemoteChangeRef.current = true;

      const model = monacoEditor.getModel();
      if (!model) {
        isRemoteChangeRef.current = false;
        return;
      }

      // Build edits from Yjs delta
      let index = 0;
      const edits: editor.IIdentifiedSingleEditOperation[] = [];

      for (const op of event.delta) {
        if (op.retain !== undefined) {
          index += op.retain;
        } else if (op.insert !== undefined) {
          const pos = model.getPositionAt(index);
          edits.push({
            range: {
              startLineNumber: pos.lineNumber,
              startColumn: pos.column,
              endLineNumber: pos.lineNumber,
              endColumn: pos.column,
            },
            text: op.insert as string,
          });
          index += (op.insert as string).length;
        } else if (op.delete !== undefined) {
          const startPos = model.getPositionAt(index);
          const endPos = model.getPositionAt(index + op.delete);
          edits.push({
            range: {
              startLineNumber: startPos.lineNumber,
              startColumn: startPos.column,
              endLineNumber: endPos.lineNumber,
              endColumn: endPos.column,
            },
            text: '',
          });
        }
      }

      if (edits.length > 0) {
        monacoEditor.executeEdits('yjs-sync', edits);
      }

      isRemoteChangeRef.current = false;
    });

    // Sync Monaco -> Yjs
    monacoEditor.onDidChangeModelContent((event) => {
      if (isRemoteChangeRef.current) return;
      isRemoteChangeRef.current = true;

      yDoc.transact(() => {
        // Sort changes in reverse order to maintain correct indices
        const sortedChanges = [...event.changes].sort(
          (a, b) => b.rangeOffset - a.rangeOffset
        );

        for (const change of sortedChanges) {
          if (change.rangeLength > 0) {
            yText.delete(change.rangeOffset, change.rangeLength);
          }
          if (change.text) {
            yText.insert(change.rangeOffset, change.text);
          }
        }
      });

      isRemoteChangeRef.current = false;
    });

    // Set initial content if Yjs doc already has content
    const initialContent = yText.toString();
    if (initialContent) {
      monacoEditor.setValue(initialContent);
    }
  }, [roomId]);

  useEffect(() => {
    return () => {
      providerRef.current?.destroy();
      yDocRef.current?.destroy();
    };
  }, []);

  return { bindEditor };
}
