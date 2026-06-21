const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws/speech/';

export interface WebSocketHandlers {
  onOpen?: () => void;
  onClose?: (event: CloseEvent) => void;
  onMessage?: (data: unknown) => void;
  onError?: (event: Event) => void;
}

export class SpeechWebSocketClient {
  private socket: WebSocket | null = null;
  private url: string;

  constructor(urlSuffix = '') {
    this.url = `${WS_URL}${urlSuffix}`;
  }

  connect(handlers: WebSocketHandlers): void {
    this.socket = new WebSocket(this.url);

    this.socket.onopen = () => {
      handlers.onOpen?.();
    };

    this.socket.onclose = (event) => {
      handlers.onClose?.(event);
    };

    this.socket.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        handlers.onMessage?.(parsed);
      } catch {
        handlers.onMessage?.(event.data);
      }
    };

    this.socket.onerror = (error) => {
      handlers.onError?.(error);
    };
  }

  send(data: string | ArrayBuffer | Blob): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(data);
    } else {
      throw new Error('WebSocket connection is not open.');
    }
  }

  close(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}
export default SpeechWebSocketClient;
