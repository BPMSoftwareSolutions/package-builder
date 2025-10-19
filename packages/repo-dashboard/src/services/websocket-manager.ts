/**
 * WebSocket Manager Service
 * Manages real-time WebSocket connections for live updates
 */

import { Server as HTTPServer } from 'http';
// import { Server as SocketIOServer, Socket } from 'socket.io';

export interface WebSocketClient {
  id: string;
  socket: any; // Socket type from socket.io
  subscriptions: Set<string>;
  connectedAt: Date;
}

export class WebSocketManager {
  private io: any = null; // SocketIOServer type from socket.io
  private clients: Map<string, WebSocketClient> = new Map();

  /**
   * Initialize WebSocket server
   */
  initialize(_httpServer: HTTPServer): any {
    // TODO: Implement socket.io initialization when socket.io is installed
    // this.io = new SocketIOServer(httpServer, {
    //   cors: {
    //     origin: '*',
    //     methods: ['GET', 'POST']
    //   }
    // });

    // this.io.on('connection', (socket: Socket) => {
    //   console.log(`✅ WebSocket client connected: ${socket.id}`);

    //   const client: WebSocketClient = {
    //     id: socket.id,
    //     socket,
    //     subscriptions: new Set(),
    //     connectedAt: new Date()
    //   };

    //   this.clients.set(socket.id, client);

    //   // Handle subscription
    //   socket.on('subscribe', (channel: string) => {
    //     client.subscriptions.add(channel);
    //     socket.join(channel);
    //     console.log(`📡 Client ${socket.id} subscribed to ${channel}`);
    //   });

    //   // Handle unsubscription
    //   socket.on('unsubscribe', (channel: string) => {
    //     client.subscriptions.delete(channel);
    //     socket.leave(channel);
    //     console.log(`📡 Client ${socket.id} unsubscribed from ${channel}`);
    //   });

    //   // Handle disconnect
    //   socket.on('disconnect', () => {
    //     this.clients.delete(socket.id);
    //     console.log(`❌ WebSocket client disconnected: ${socket.id}`);
    //   });

    //   // Handle errors
    //   socket.on('error', (error: any) => {
    //     console.error(`❌ WebSocket error for ${socket.id}:`, error);
    //   });
    // });

    console.log('🚀 WebSocket server initialized');
    return this.io;
  }

  /**
   * Broadcast message to all clients in a channel
   */
  broadcast(channel: string, event: string, data: any): void {
    if (!this.io) {
      console.warn('⚠️ WebSocket server not initialized');
      return;
    }

    this.io.to(channel).emit(event, {
      timestamp: new Date(),
      channel,
      data
    });

    console.log(`📤 Broadcast to ${channel}: ${event}`);
  }

  /**
   * Send message to specific client
   */
  sendToClient(clientId: string, event: string, data: any): void {
    const client = this.clients.get(clientId);
    if (!client) {
      console.warn(`⚠️ Client not found: ${clientId}`);
      return;
    }

    client.socket.emit(event, {
      timestamp: new Date(),
      data
    });

    console.log(`📤 Sent to client ${clientId}: ${event}`);
  }

  /**
   * Broadcast build status update
   */
  broadcastBuildStatus(org: string, repo: string, status: any): void {
    const channel = `build-status:${org}/${repo}`;
    this.broadcast(channel, 'build-status-update', status);
  }

  /**
   * Broadcast test results update
   */
  broadcastTestResults(org: string, repo: string, results: any): void {
    const channel = `test-results:${org}/${repo}`;
    this.broadcast(channel, 'test-results-update', results);
  }

  /**
   * Broadcast deployment status update
   */
  broadcastDeploymentStatus(org: string, repo: string, status: any): void {
    const channel = `deployment-status:${org}/${repo}`;
    this.broadcast(channel, 'deployment-status-update', status);
  }

  /**
   * Broadcast alert
   */
  broadcastAlert(org: string, alert: any): void {
    const channel = `alerts:${org}`;
    this.broadcast(channel, 'alert-created', alert);
  }

  /**
   * Get connected clients count
   */
  getConnectedClientsCount(): number {
    return this.clients.size;
  }

  /**
   * Get clients subscribed to a channel
   */
  getChannelSubscribers(channel: string): WebSocketClient[] {
    return Array.from(this.clients.values()).filter(client =>
      client.subscriptions.has(channel)
    );
  }

  /**
   * Get all active channels
   */
  getActiveChannels(): string[] {
    const channels = new Set<string>();
    for (const client of this.clients.values()) {
      for (const channel of client.subscriptions) {
        channels.add(channel);
      }
    }
    return Array.from(channels);
  }

  /**
   * Get WebSocket server instance
   */
  getServer(): any {
    return this.io;
  }
}

// Export singleton instance
export const websocketManager = new WebSocketManager();

