import { useState, useRef, useCallback, useEffect } from 'react';
import { SignalingClient } from '../../../shared/lib/signaling';
import { PeerConnection } from '../../../shared/lib/webrtc';

export function useWebRTC(roomId: string) {
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>('new');
  const [isInitiator, setIsInitiator] = useState(false);

  const signalingRef = useRef<SignalingClient | null>(null);
  const peerRef = useRef<PeerConnection | null>(null);

  const connect = useCallback(async (localStream: MediaStream) => {
    const signaling = new SignalingClient(roomId);
    signalingRef.current = signaling;

    const peer = new PeerConnection();
    peerRef.current = peer;

    // Add local tracks to peer connection
    peer.addLocalStream(localStream);

    // Handle remote stream
    peer.onRemoteStream((stream) => {
      setRemoteStream(stream);
    });

    // Handle connection state changes
    peer.onConnectionState((state) => {
      setConnectionState(state);
    });

    // Send ICE candidates via signaling
    peer.onIceCandidate((candidate) => {
      signaling.send({ type: 'ice_candidate', candidate });
    });

    // Handle signaling messages
    signaling.onMessage(async (message) => {
      switch (message.type) {
        case 'room_info': {
          // If there are already peers, we are the initiator (we create the offer)
          if (message.peerCount > 0) {
            setIsInitiator(true);
            const offer = await peer.createOffer();
            signaling.send({ type: 'offer', sdp: offer });
          }
          break;
        }
        case 'offer': {
          const answer = await peer.handleOffer(message.sdp);
          signaling.send({ type: 'answer', sdp: answer });
          break;
        }
        case 'answer': {
          await peer.handleAnswer(message.sdp);
          break;
        }
        case 'ice_candidate': {
          await peer.addIceCandidate(message.candidate);
          break;
        }
        case 'peer_left': {
          setRemoteStream(null);
          setConnectionState('disconnected');
          break;
        }
      }
    });

    await signaling.connect();
  }, [roomId]);

  const replaceTrack = useCallback((oldTrack: MediaStreamTrack, newTrack: MediaStreamTrack) => {
    peerRef.current?.replaceTrack(oldTrack, newTrack);
  }, []);

  const disconnect = useCallback(() => {
    peerRef.current?.close();
    signalingRef.current?.close();
    peerRef.current = null;
    signalingRef.current = null;
    setRemoteStream(null);
    setConnectionState('new');
  }, []);

  useEffect(() => {
    return () => disconnect();
  }, [disconnect]);

  return {
    remoteStream,
    connectionState,
    isInitiator,
    connect,
    replaceTrack,
    disconnect,
  };
}
