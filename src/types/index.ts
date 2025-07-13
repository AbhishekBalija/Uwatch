export interface User {
  id: string;
  name: string;
  isHost: boolean;
  joinedAt: Date;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: Date;
}

export interface Room {
  id: string;
  name: string;
  hostId: string;
  users: User[];
  videoId: string | null;
  videoState: {
    playing: boolean;
    currentTime: number;
    lastUpdated: Date;
  };
  maxUsers: number;
  createdAt: Date;
}

export interface VideoControlEvent {
  type: 'play' | 'pause' | 'seek';
  timestamp: number;
  currentTime?: number;
}
