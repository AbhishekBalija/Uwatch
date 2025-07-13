import React, { useState } from 'react';
import { HomePage } from './components/HomePage';
import { RoomPage } from './components/RoomPage';
import { useRoom } from './hooks/useRoom';

export default function App() {
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const {
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
  } = useRoom(currentRoomId || undefined);

  const handleCreateRoom = (name: string, hostName: string) => {
    try {
      const roomId = createRoom(name, hostName, 20);
      setCurrentRoomId(roomId);
      setError(null);
    } catch (error) {
      setError('Failed to create room. Please try again.');
    }
  };

  const handleJoinRoom = (roomId: string, userName: string) => {
    try {
      const result = joinRoom(roomId, userName);
      if (result.success) {
        setCurrentRoomId(roomId);
        setError(null);
      } else {
        setError(result.error || 'Failed to join room');
      }
    } catch (error) {
      setError('Failed to join room. Please try again.');
    }
  };

  const handleLeaveRoom = () => {
    leaveRoom();
    setCurrentRoomId(null);
    setError(null);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-red-600/10 border border-red-600/20 rounded-lg p-6 max-w-md mx-auto text-center">
          <h2 className="text-red-400 font-semibold mb-2">Error</h2>
          <p className="text-gray-300 mb-4">{error}</p>
          <button
            onClick={() => setError(null)}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (currentRoomId && room && currentUser && isConnected) {
    return (
      <RoomPage
        room={room}
        currentUser={currentUser}
        messages={messages}
        onLeaveRoom={handleLeaveRoom}
        onVideoChange={updateVideo}
        onVideoControl={controlVideo}
        onSendMessage={sendMessage}
      />
    );
  }

  return (
    <HomePage
      onCreateRoom={handleCreateRoom}
      onJoinRoom={handleJoinRoom}
    />
  );
}
