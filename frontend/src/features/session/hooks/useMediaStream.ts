import { useState, useRef, useCallback, useEffect } from 'react';

export function useMediaStream() {
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const originalVideoTrackRef = useRef<MediaStreamTrack | null>(null);

  const startMedia = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    localStreamRef.current = stream;
    originalVideoTrackRef.current = stream.getVideoTracks()[0];
    return stream;
  }, []);

  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
    setIsMuted((prev) => !prev);
  }, []);

  const toggleCamera = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getVideoTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
    setIsCameraOn((prev) => !prev);
  }, []);

  const toggleScreenShare = useCallback(async (
    onTrackSwitch?: (oldTrack: MediaStreamTrack, newTrack: MediaStreamTrack) => void
  ) => {
    if (isScreenSharing) {
      // Stop screen sharing, restore camera
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
      const cameraTrack = originalVideoTrackRef.current;
      const currentVideoTrack = localStreamRef.current?.getVideoTracks()[0];
      if (cameraTrack && currentVideoTrack && onTrackSwitch) {
        localStreamRef.current?.removeTrack(currentVideoTrack);
        localStreamRef.current?.addTrack(cameraTrack);
        onTrackSwitch(currentVideoTrack, cameraTrack);
      }
      setIsScreenSharing(false);
    } else {
      // Start screen sharing
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      screenStreamRef.current = screenStream;
      const screenTrack = screenStream.getVideoTracks()[0];
      const cameraTrack = localStreamRef.current?.getVideoTracks()[0];
      if (cameraTrack && onTrackSwitch) {
        originalVideoTrackRef.current = cameraTrack;
        localStreamRef.current?.removeTrack(cameraTrack);
        localStreamRef.current?.addTrack(screenTrack);
        onTrackSwitch(cameraTrack, screenTrack);
      }
      // When user stops screen share via browser UI
      screenTrack.onended = () => {
        toggleScreenShare(onTrackSwitch);
      };
      setIsScreenSharing(true);
    }
  }, [isScreenSharing]);

  const stopMedia = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    screenStreamRef.current = null;
  }, []);

  useEffect(() => {
    return () => stopMedia();
  }, [stopMedia]);

  return {
    localStreamRef,
    isMuted,
    isCameraOn,
    isScreenSharing,
    startMedia,
    toggleMute,
    toggleCamera,
    toggleScreenShare,
    stopMedia,
  };
}
