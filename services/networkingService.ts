
import { RemotePlayer, ChatMessage } from '../types';

export interface NetworkCallbacks {
  onPlayerUpdate: (player: RemotePlayer) => void;
  onChatMessage: (msg: ChatMessage) => void;
  onPeerJoin: (peerId: string) => void;
  onPeerLeave: (peerId: string) => void;
}

class NetworkingService {
  private static instance: NetworkingService;

  private constructor() {}

  static getInstance() {
    if (!NetworkingService.instance) {
      NetworkingService.instance = new NetworkingService();
    }
    return NetworkingService.instance;
  }

  // Initialize connection
  init(_callbacks: NetworkCallbacks) {
    return false;
  }

  // Broadcast my current stats to the room
  broadcastSelf(_player: { name: string, avatar: string, money: number, rankId: number }) {}

  // Broadcast a chat message
  broadcastMessage(_msg: Partial<ChatMessage>) {}
  
  getPeerId(): string[] {
    return [];
  }
}

export const networking = NetworkingService.getInstance();
