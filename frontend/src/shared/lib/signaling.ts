export type SignalMessage =
  | { type: 'offer'; sdp: RTCSessionDescriptionInit }
  | { type: 'answer'; sdp: RTCSessionDescriptionInit }
  | { type: 'ice_candidate'; candidate: RTCIceCandidateInit }
  | { type: 'room_info'; peerCount: number }
  | { type: 'peer_left' };

type MessageHandler = (message: SignalMessage) => void;

const SIGNAL_SERVER_URL = import.meta.env.VITE_SIGNAL_URL || 'ws://localhost:8001';

export class SignalingClient {
  private ws: WebSocket | null = null;
  private handlers: MessageHandler[] = [];
  private roomId: string;

  constructor(roomId: string) {
    this.roomId = roomId;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(`${SIGNAL_SERVER_URL}/ws/signal/${this.roomId}`);

      this.ws.onopen = () => resolve();
      this.ws.onerror = (e) => reject(e);

      this.ws.onmessage = (event) => {
        const message = JSON.parse(event.data) as SignalMessage;
        this.handlers.forEach((h) => h(message));
      };

      this.ws.onclose = () => {
        this.ws = null;
      };
    });
  }

  send(message: Omit<SignalMessage, 'type' | 'peerCount'> & { type: string; [key: string]: unknown }) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  onMessage(handler: MessageHandler) {
    this.handlers.push(handler);
    return () => {
      this.handlers = this.handlers.filter((h) => h !== handler);
    };
  }

  close() {
    this.ws?.close();
    this.ws = null;
    this.handlers = [];
  }
}
