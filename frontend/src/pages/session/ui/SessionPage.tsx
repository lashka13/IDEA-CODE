import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, MicOff, Video, VideoOff, Monitor, Code2, PhoneOff,
  Copy, Check, Users, Clock, Maximize2, Minimize2,
} from 'lucide-react';
import Editor from '@monaco-editor/react';
import { useMediaStream } from '../../../features/session/hooks/useMediaStream';
import { useWebRTC } from '../../../features/session/hooks/useWebRTC';
import { useCollaborativeEditor } from '../../../features/session/hooks/useCollaborativeEditor';
import { cn } from '../../../shared/lib';

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
];

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function SessionPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  // Media
  const {
    isMuted, isCameraOn, isScreenSharing,
    startMedia, toggleMute, toggleCamera, toggleScreenShare, stopMedia,
  } = useMediaStream();

  // WebRTC
  const {
    remoteStream, connectionState, connect, replaceTrack, disconnect,
  } = useWebRTC(roomId || '');

  // Collaborative editor
  const { bindEditor } = useCollaborativeEditor(roomId || '');

  // UI state
  const [isCodingOpen, setIsCodingOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize connection
  useEffect(() => {
    if (!roomId) return;

    const init = async () => {
      try {
        const stream = await startMedia();
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        await connect(stream);
        setIsConnecting(false);
        // Start timer
        timerRef.current = setInterval(() => {
          setElapsedSeconds((s) => s + 1);
        }, 1000);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Не удалось подключиться');
        setIsConnecting(false);
      }
    };

    init();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [roomId]);

  // Update remote video when stream arrives
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const handleScreenShare = useCallback(() => {
    toggleScreenShare(replaceTrack);
  }, [toggleScreenShare, replaceTrack]);

  const handleLeave = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    stopMedia();
    disconnect();
    navigate('/');
  }, [stopMedia, disconnect, navigate]);

  const copyRoomLink = useCallback(() => {
    const url = `${window.location.origin}/session/${roomId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [roomId]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  if (!roomId) {
    return (
      <div className="h-screen flex items-center justify-center bg-surface-950">
        <p className="text-white/40">Комната не найдена</p>
      </div>
    );
  }

  const connectionLabel = {
    new: 'Подключение...',
    connecting: 'Подключение...',
    connected: 'Подключено',
    disconnected: 'Отключено',
    failed: 'Ошибка соединения',
    closed: 'Соединение закрыто',
  }[connectionState] || connectionState;

  const connectionColor = {
    connected: 'text-accent-green',
    connecting: 'text-yellow-400',
    new: 'text-yellow-400',
    disconnected: 'text-red-400',
    failed: 'text-red-400',
    closed: 'text-white/30',
  }[connectionState] || 'text-white/40';

  return (
    <div className="h-screen flex flex-col bg-surface-950 overflow-hidden select-none">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-surface-900/80 border-b border-white/[0.06]">
        <div className="flex items-center gap-4">
          {/* Room ID */}
          <button
            onClick={copyRoomLink}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
          >
            <span className="text-xs text-white/50 font-mono">{roomId}</span>
            {copied ? <Check size={12} className="text-accent-green" /> : <Copy size={12} className="text-white/30" />}
          </button>

          {/* Timer */}
          <div className="flex items-center gap-1.5 text-white/40">
            <Clock size={12} />
            <span className="text-xs font-mono">{formatTime(elapsedSeconds)}</span>
          </div>

          {/* Connection status */}
          <div className="flex items-center gap-1.5">
            <span className={cn('w-1.5 h-1.5 rounded-full', connectionState === 'connected' ? 'bg-accent-green' : 'bg-yellow-400 animate-pulse')} />
            <span className={cn('text-[10px]', connectionColor)}>{connectionLabel}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {remoteStream && (
            <div className="flex items-center gap-1.5 text-white/30">
              <Users size={12} />
              <span className="text-[10px]">2 участника</span>
            </div>
          )}
          <button onClick={toggleFullscreen} className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/[0.06] transition-all">
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Video Area */}
        <div className={cn('flex-1 relative flex items-center justify-center p-4 transition-all duration-300', isCodingOpen && 'w-1/2')}>
          {/* Remote Video (or waiting state) */}
          {remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover rounded-2xl bg-surface-900"
            />
          ) : (
            <div className="w-full h-full rounded-2xl bg-surface-900 border border-white/[0.06] flex flex-col items-center justify-center gap-4">
              {isConnecting ? (
                <>
                  <div className="w-12 h-12 rounded-full border-2 border-accent-cyan/30 border-t-accent-cyan animate-spin" />
                  <p className="text-white/30 text-sm">Подключение...</p>
                </>
              ) : error ? (
                <>
                  <p className="text-red-400 text-sm">{error}</p>
                  <button onClick={() => window.location.reload()} className="px-4 py-2 rounded-xl bg-white/[0.06] text-white/60 text-sm hover:bg-white/[0.1] transition-colors">
                    Попробовать снова
                  </button>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center">
                    <Users size={24} className="text-white/20" />
                  </div>
                  <div className="text-center">
                    <p className="text-white/40 text-sm">Ожидание участника...</p>
                    <p className="text-white/20 text-xs mt-1">Отправьте ссылку коллеге</p>
                  </div>
                  <button
                    onClick={copyRoomLink}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-cyan/10 border border-accent-cyan/20 text-accent-cyan text-sm hover:bg-accent-cyan/20 transition-colors"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Скопировано!' : 'Копировать ссылку'}
                  </button>
                </>
              )}
            </div>
          )}

          {/* Local Video (PIP) */}
          <motion.div
            drag
            dragMomentum={false}
            className="absolute bottom-6 right-6 w-48 h-36 rounded-xl overflow-hidden border border-white/[0.1] shadow-2xl cursor-grab active:cursor-grabbing z-10"
          >
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover bg-surface-800"
            />
            {!isCameraOn && (
              <div className="absolute inset-0 bg-surface-900 flex items-center justify-center">
                <VideoOff size={20} className="text-white/20" />
              </div>
            )}
            {isMuted && (
              <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500/80 flex items-center justify-center">
                <MicOff size={10} className="text-white" />
              </div>
            )}
          </motion.div>
        </div>

        {/* Code Editor Panel */}
        <AnimatePresence>
          {isCodingOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: '50%', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="border-l border-white/[0.06] flex flex-col overflow-hidden"
            >
              {/* Editor Header */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06] bg-surface-900/50">
                <div className="flex items-center gap-2">
                  <Code2 size={14} className="text-accent-cyan" />
                  <span className="text-xs font-medium text-white/60">Live Coding</span>
                </div>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1 text-[11px] text-white/60 outline-none"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.value} value={lang.value} className="bg-surface-900">
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Monaco Editor */}
              <div className="flex-1 min-h-0">
                <Editor
                  height="100%"
                  language={selectedLanguage}
                  theme="vs-dark"
                  onMount={bindEditor}
                  options={{
                    fontSize: 13,
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    minimap: { enabled: false },
                    padding: { top: 12 },
                    scrollBeyondLastLine: false,
                    renderLineHighlight: 'line',
                    lineNumbers: 'on',
                    tabSize: 2,
                    wordWrap: 'on',
                    automaticLayout: true,
                    cursorBlinking: 'smooth',
                    smoothScrolling: true,
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls Bar */}
      <div className="flex items-center justify-center gap-3 px-4 py-3 bg-surface-900/80 border-t border-white/[0.06]">
        {/* Mic */}
        <button
          onClick={toggleMute}
          className={cn(
            'p-3 rounded-xl transition-all duration-200',
            isMuted
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
              : 'bg-white/[0.06] text-white/70 hover:bg-white/[0.1] hover:text-white'
          )}
        >
          {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
        </button>

        {/* Camera */}
        <button
          onClick={toggleCamera}
          className={cn(
            'p-3 rounded-xl transition-all duration-200',
            !isCameraOn
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
              : 'bg-white/[0.06] text-white/70 hover:bg-white/[0.1] hover:text-white'
          )}
        >
          {isCameraOn ? <Video size={20} /> : <VideoOff size={20} />}
        </button>

        {/* Screen Share */}
        <button
          onClick={handleScreenShare}
          className={cn(
            'p-3 rounded-xl transition-all duration-200',
            isScreenSharing
              ? 'bg-accent-cyan/20 text-accent-cyan hover:bg-accent-cyan/30'
              : 'bg-white/[0.06] text-white/70 hover:bg-white/[0.1] hover:text-white'
          )}
        >
          <Monitor size={20} />
        </button>

        {/* Code Editor Toggle */}
        <button
          onClick={() => setIsCodingOpen(!isCodingOpen)}
          className={cn(
            'p-3 rounded-xl transition-all duration-200',
            isCodingOpen
              ? 'bg-accent-green/20 text-accent-green hover:bg-accent-green/30'
              : 'bg-white/[0.06] text-white/70 hover:bg-white/[0.1] hover:text-white'
          )}
        >
          <Code2 size={20} />
        </button>

        {/* Separator */}
        <div className="w-px h-8 bg-white/[0.08] mx-1" />

        {/* Leave */}
        <button
          onClick={handleLeave}
          className="p-3 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all duration-200"
        >
          <PhoneOff size={20} />
        </button>
      </div>
    </div>
  );
}
