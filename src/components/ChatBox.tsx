import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Crown } from 'lucide-react';
import { ChatMessage, User } from '../types';

interface ChatBoxProps {
  messages: ChatMessage[];
  currentUser: User;
  onSendMessage: (message: string) => void;
  users: User[];
}

export const ChatBox: React.FC<ChatBoxProps> = ({ messages, currentUser, onSendMessage, users }) => {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      onSendMessage(newMessage);
      setNewMessage('');
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getUserById = (userId: string) => {
    return users.find(user => user.id === userId);
  };

  return (
    <div className="bg-gray-800 rounded-lg flex flex-col h-96">
      {/* Users List */}
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-white font-medium mb-2 flex items-center gap-2">
          <span>Viewers ({users.length})</span>
        </h3>
        <div className="flex flex-wrap gap-2">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-1 bg-gray-700 px-2 py-1 rounded-full text-sm"
            >
              {user.isHost && <Crown className="w-3 h-3 text-yellow-400" />}
              <span className={user.isHost ? 'text-yellow-400' : 'text-gray-300'}>
                {user.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <AnimatePresence>
          {messages.map((message) => {
            const user = getUserById(message.userId);
            const isOwnMessage = message.userId === currentUser.id;
            
            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'bg-red-600' : 'bg-gray-700'} rounded-lg p-3`}>
                  <div className="flex items-center gap-2 mb-1">
                    {user?.isHost && <Crown className="w-3 h-3 text-yellow-400" />}
                    <span className={`text-xs font-medium ${user?.isHost ? 'text-yellow-400' : 'text-gray-300'}`}>
                      {message.userName}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                  <p className="text-white text-sm">{message.message}</p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500"
            maxLength={500}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </div>
      </form>
    </div>
  );
};
