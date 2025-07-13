import { useState, useEffect, useCallback } from 'react';
import { Room, User, ChatMessage, VideoControlEvent } from '../types';
import { faker } from '@faker-js/faker';

// Mock storage service (in a real app, this would be WebSocket/Socket.io)
class MockRoomService {
  private rooms: Map<string, Room> = new Map();
  private listeners: Map<string, (event: any) => void> = new Map();

  createRoom(name: string, hostName: string, maxUsers: number = 20): Room {
    const roomId = faker.string.alphanumeric(8).toUpperCase();
    const hostId = faker.string.uuid();
    
    const room: Room = {
      id: roomId,
      name,
      hostId,
      users: [{
        id: hostId,
        name: hostName,
        isHost: true,
        joinedAt: new Date()
      }],
      videoId: null,
      videoState: {
        playing: false,
        currentTime: 0,
        lastUpdated: new Date()
      },
      maxUsers,
      createdAt: new Date()
    };
    
    this.rooms.set(roomId, room);
    return room;
  }

  joinRoom(roomId: string, userName: string): { success: boolean; room?: Room; userId?: string; error?: string } {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { success: false, error: 'Room not found' };
    }
    
    if (room.users.length >= room.maxUsers) {
      return { success: false, error: 'Room is full' };
    }
    
    const userId = faker.string.uuid();
    const newUser: User = {
      id: userId,
      name: userName,
      isHost: false,
      joinedAt: new Date()
    };
    
    room.users.push(newUser);
    this.rooms.set(roomId, room);
    
    // Notify all listeners
    setTimeout(() => {
      this.emit(roomId, { type: 'user_joined', user: newUser, room: this.cloneRoom(room) });
    }, 100);
    
    return { success: true, room: this.cloneRoom(room), userId };
  }

  leaveRoom(roomId: string, userId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;
    
    room.users = room.users.filter(user => user.id !== userId);
    
    if (room.users.length === 0) {
      this.rooms.delete(roomId);
    } else {
      this.rooms.set(roomId, room);
      setTimeout(() => {
        this.emit(roomId, { type: 'user_left', userId, room: this.cloneRoom(room) });
      }, 100);
    }
  }

  updateVideo(roomId: string, videoId: string | null, userId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room || room.hostId !== userId) {
      console.log('Cannot update video:', !room ? 'Room not found' : 'User is not host');
      return false;
    }
    
    console.log('Updating video in room service:', { roomId, videoId, userId });
    
    // Update the room data
    room.videoId = videoId;
    room.videoState.currentTime = 0;
    room.videoState.playing = false;
    room.videoState.lastUpdated = new Date();
    
    // Save updated room
    this.rooms.set(roomId, room);
    
    console.log('Room updated successfully, emitting event...');
    
    // Emit video change event immediately - no timeout needed
    this.emit(roomId, { 
      type: 'video_changed', 
      videoId, 
      room: this.cloneRoom(room)
    });
    
    return true;
  }

  controlVideo(roomId: string, event: VideoControlEvent, userId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room || room.hostId !== userId) return false;
    
    room.videoState.playing = event.type === 'play';
    if (event.currentTime !== undefined) {
      room.videoState.currentTime = event.currentTime;
    }
    room.videoState.lastUpdated = new Date();
    
    this.rooms.set(roomId, room);
    this.emit(roomId, { 
      type: 'video_control', 
      event, 
      room: this.cloneRoom(room) 
    });
    return true;
  }

  sendMessage(roomId: string, message: ChatMessage): void {
    setTimeout(() => {
      this.emit(roomId, { type: 'chat_message', message });
    }, 50);
  }

  subscribe(roomId: string, callback: (event: any) => void): () => void {
    const key = `${roomId}_${faker.string.uuid()}`;
    this.listeners.set(key, callback);
    
    return () => {
      this.listeners.delete(key);
    };
  }

  private emit(roomId: string, event: any): void {
    console.log('🔄 Emitting event:', event.type, 'for room:', roomId, event);
    this.listeners.forEach((callback, key) => {
      if (key.startsWith(roomId)) {
        try {
          callback(event);
        } catch (error) {
          console.error('Error in event callback:', error);
        }
      }
    });
  }

  private cloneRoom(room: Room): Room {
    return {
      ...room,
      users: [...room.users],
      videoState: { ...room.videoState }
    };
  }

  getRoom(roomId: string): Room | undefined {
    const room = this.rooms.get(roomId);
    return room ? this.cloneRoom(room) : undefined;
  }
}

const roomService = new MockRoomService();

export const useRoom = (roomId?: string) => {
  const [room, setRoom] = useState<Room | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!roomId) return;

    console.log('🔌 Setting up room subscription for:', roomId);
    
    const unsubscribe = roomService.subscribe(roomId, (event) => {
      console.log('📨 Received event:', event.type, event);
      
      switch (event.type) {
        case 'user_joined':
        case 'user_left':
          console.log('👥 Updating room state for user event');
          setRoom(event.room);
          break;
        case 'video_changed':
          console.log('🎥 Video changed event received, updating room state');
          setRoom(event.room);
          break;
        case 'video_control':
          console.log('🎮 Video control event received, updating room state');
          setRoom(event.room);
          break;
        case 'chat_message':
          console.log('💬 Chat message received');
          setMessages(prev => [...prev, event.message]);
          break;
      }
    });

    setIsConnected(true);
    
    return () => {
      console.log('🔌 Unsubscribing from room:', roomId);
      unsubscribe();
      setIsConnected(false);
    };
  }, [roomId]);

  const createRoom = useCallback((name: string, hostName: string, maxUsers?: number) => {
    const newRoom = roomService.createRoom(name, hostName, maxUsers);
    setRoom(newRoom);
    setCurrentUser(newRoom.users[0]);
    console.log('🏠 Created room:', newRoom.id);
    return newRoom.id;
  }, []);

  const joinRoom = useCallback((roomId: string, userName: string) => {
    const result = roomService.joinRoom(roomId, userName);
    if (result.success && result.room && result.userId) {
      setRoom(result.room);
      const user = result.room.users.find(u => u.id === result.userId);
      if (user) setCurrentUser(user);
      console.log('🚪 Joined room:', roomId);
    }
    return result;
  }, []);

  const leaveRoom = useCallback(() => {
    if (room && currentUser) {
      roomService.leaveRoom(room.id, currentUser.id);
      setRoom(null);
      setCurrentUser(null);
      setMessages([]);
      console.log('🚪 Left room:', room.id);
    }
  }, [room, currentUser]);

  const updateVideo = useCallback((videoId: string | null) => {
    if (room && currentUser) {
      console.log('🎥 Requesting video update to:', videoId);
      const result = roomService.updateVideo(room.id, videoId, currentUser.id);
      console.log('🎥 Update video result:', result);
      
      if (result) {
        // Optimistically update local state
        console.log('🎥 Optimistically updating local room state');
        setRoom(prevRoom => {
          if (!prevRoom) return prevRoom;
          return {
            ...prevRoom,
            videoId,
            videoState: {
              ...prevRoom.videoState,
              playing: false,
              currentTime: 0,
              lastUpdated: new Date()
            }
          };
        });
      }
      
      return result;
    }
    return false;
  }, [room, currentUser]);

  const controlVideo = useCallback((event: VideoControlEvent) => {
    if (room && currentUser) {
      return roomService.controlVideo(room.id, event, currentUser.id);
    }
    return false;
  }, [room, currentUser]);

  const sendMessage = useCallback((text: string) => {
    if (room && currentUser && text.trim()) {
      const message: ChatMessage = {
        id: faker.string.uuid(),
        userId: currentUser.id,
        userName: currentUser.name,
        message: text.trim(),
        timestamp: new Date()
      };
      roomService.sendMessage(room.id, message);
      setMessages(prev => [...prev, message]);
    }
  }, [room, currentUser]);

  return {
    room,
    currentUser,
    messages,
    isConnected,
    createRoom,
    joinRoom,
    leaveRoom,
    updateVideo,
    controlVideo,
    sendMessage
  };
};
