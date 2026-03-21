const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

export class PeerConnection {
  private pc: RTCPeerConnection;
  private onRemoteStreamCallback: ((stream: MediaStream) => void) | null = null;
  private onIceCandidateCallback: ((candidate: RTCIceCandidateInit) => void) | null = null;
  private onConnectionStateCallback: ((state: RTCPeerConnectionState) => void) | null = null;

  constructor() {
    this.pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    this.pc.ontrack = (event) => {
      if (event.streams[0] && this.onRemoteStreamCallback) {
        this.onRemoteStreamCallback(event.streams[0]);
      }
    };

    this.pc.onicecandidate = (event) => {
      if (event.candidate && this.onIceCandidateCallback) {
        this.onIceCandidateCallback(event.candidate.toJSON());
      }
    };

    this.pc.onconnectionstatechange = () => {
      this.onConnectionStateCallback?.(this.pc.connectionState);
    };
  }

  addLocalStream(stream: MediaStream) {
    stream.getTracks().forEach((track) => {
      this.pc.addTrack(track, stream);
    });
  }

  replaceTrack(oldTrack: MediaStreamTrack, newTrack: MediaStreamTrack) {
    const sender = this.pc.getSenders().find((s) => s.track === oldTrack);
    if (sender) {
      sender.replaceTrack(newTrack);
    }
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    return offer;
  }

  async handleOffer(sdp: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    await this.pc.setRemoteDescription(new RTCSessionDescription(sdp));
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    return answer;
  }

  async handleAnswer(sdp: RTCSessionDescriptionInit) {
    await this.pc.setRemoteDescription(new RTCSessionDescription(sdp));
  }

  async addIceCandidate(candidate: RTCIceCandidateInit) {
    await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
  }

  onRemoteStream(callback: (stream: MediaStream) => void) {
    this.onRemoteStreamCallback = callback;
  }

  onIceCandidate(callback: (candidate: RTCIceCandidateInit) => void) {
    this.onIceCandidateCallback = callback;
  }

  onConnectionState(callback: (state: RTCPeerConnectionState) => void) {
    this.onConnectionStateCallback = callback;
  }

  getConnectionState(): RTCPeerConnectionState {
    return this.pc.connectionState;
  }

  close() {
    this.pc.close();
  }
}
