// services/webSocketService.ts
// This is a MOCK WebSocket service to simulate real-time updates in a frontend-only environment.
// It uses a simple event emitter pattern.

type WebSocketCallback = (data: any) => void;

class MockWebSocketService {
    private listeners: { [event: string]: WebSocketCallback[] } = {};

    public on(event: string, callback: WebSocketCallback): () => void {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
        
        // Return an unsubscribe function
        return () => {
            this.listeners[event] = this.listeners[event].filter(l => l !== callback);
        };
    }

    public emit(event: string, data: any): void {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in WebSocket listener for event "${event}":`, error);
                }
            });
        }
    }
}

// Export a singleton instance
export const webSocketService = new MockWebSocketService();
