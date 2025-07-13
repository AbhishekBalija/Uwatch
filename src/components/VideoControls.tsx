import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, Crown, Copy, Check, AlertCircle, Trash2 } from 'lucide-react';
import { extractVideoId, isValidYouTubeUrl } from '../utils/youtube';

interface VideoControlsProps {
  roomId: string;
  roomName: string;
  isHost: boolean;
  onVideoChange: (videoId: string | null) => void;
}

export const VideoControls: React.FC<VideoControlsProps> = ({ 
  roomId, 
  roomName, 
  isHost, 
  onVideoChange 
}) => {
  const [videoUrl, setVideoUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVideoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('🎥 VideoControls: Processing URL:', videoUrl);
      
      if (isValidYouTubeUrl(videoUrl)) {
        const videoId = extractVideoId(videoUrl);
        console.log('🎥 VideoControls: Extracted video ID:', videoId);
        
        if (videoId) {
          console.log('🎥 VideoControls: Calling onVideoChange with:', videoId);
          const success = onVideoChange(videoId);
          
          if (success !== false) {
            setVideoUrl('');
            console.log('🎥 VideoControls: Video change initiated successfully');
          } else {
            setError('Failed to update video. Please try again.');
          }
        } else {
          setError('Could not extract video ID from URL');
        }
      } else {
        setError('Please enter a valid YouTube URL (e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ)');
      }
    } catch (err) {
      console.error('Error updating video:', err);
      setError('An error occurred while updating the video');
    } finally {
      setLoading(false);
    }
  };

  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy room ID:', error);
    }
  };

  const clearVideo = () => {
    console.log('🎥 VideoControls: Clearing video');
    setLoading(true);
    onVideoChange(null);
    setVideoUrl('');
    setError(null);
    setTimeout(() => setLoading(false), 500);
  };

  return (
    <div className="space-y-4">
      {/* Room Info */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              {isHost && <Crown className="w-5 h-5 text-yellow-400" />}
              {roomName}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-gray-400 text-sm">Room ID: {roomId}</span>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={copyRoomId}
                className="text-gray-400 hover:text-white transition-colors"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </motion.button>
            </div>
          </div>
        </div>
        
        {isHost && (
          <div className="space-y-3">
            <form onSubmit={handleVideoSubmit} className="space-y-3">
              <div className="flex gap-2">
                <div className="flex-1">
                  <input
                    type="text"
                    value={videoUrl}
                    onChange={(e) => {
                      setVideoUrl(e.target.value);
                      setError(null);
                    }}
                    placeholder="Paste YouTube URL here (e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ)"
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                    disabled={loading}
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading || !videoUrl.trim()}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <Link className="w-4 h-4" />
                  {loading ? 'Loading...' : 'Load Video'}
                </motion.button>
              </div>
            </form>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-900/50 border border-red-600/50 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span className="text-red-400 text-sm">{error}</span>
              </div>
            )}

            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={clearVideo}
                disabled={loading}
                className="text-gray-400 hover:text-white text-sm flex items-center gap-1 disabled:opacity-50"
              >
                <Trash2 className="w-3 h-3" />
                Clear Video
              </motion.button>
            </div>

            <div className="text-xs text-gray-500">
              💡 Tip: Try this example URL: https://www.youtube.com/watch?v=dQw4w9WgXcQ
            </div>
          </div>
        )}
        
        {!isHost && (
          <p className="text-gray-400 text-sm">
            Only the host can control the video. Share this room ID with friends to invite them!
          </p>
        )}
      </div>
    </div>
  );
};
