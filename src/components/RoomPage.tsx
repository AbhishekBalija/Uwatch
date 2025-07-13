import React from 'react';
import { motion } from 'framer-motion';
import { LogOut } from 'lucide-react';
import { Room, User, ChatMessage, VideoControlEvent } from '../types';
import { VideoPlayer } from './VideoPlayer';
import { ChatBox } from './ChatBox';
import { VideoControls } from './VideoControls';

interface RoomPageProps {
  room: Room;
  currentUser: User;
  messages: ChatMessage[];
  onLeaveRoom: () => void;
  onVideoChange: (videoId: string | null) => void;
  onVideoControl: (event: VideoControlEvent) => void;
  onSendMessage: (message: string) => void;
}

export const RoomPage: React.FC<RoomPageProps> = ({
  room,
  currentUser,
  messages,
  onLeaveRoom,
  onVideoChange,
  onVideoControl,
  onSendMessage
}) => {
  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-4">
            <div className="bg-red-600 p-2 rounded-lg">
              <span className="text-white font-bold text-lg">UW</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">UWatch</h1>
              <p className="text-gray-400 text-sm">Watching together</p>
            </div>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onLeaveRoom}
            className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Leave Room
          </motion.button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <VideoPlayer
                room={room}
                isHost={currentUser.isHost}
                onVideoControl={onVideoControl}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <VideoControls
                roomId={room.id}
                roomName={room.name}
                isHost={currentUser.isHost}
                onVideoChange={onVideoChange}
              />
            </motion.div>
          </div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-1"
          >
            <ChatBox
              messages={messages}
              currentUser={currentUser}
              onSendMessage={onSendMessage}
              users={room.users}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
};
