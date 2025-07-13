import React, { useRef, useEffect, useState } from 'react';
import YouTube, { YouTubeProps } from 'react-youtube';
import { Room, VideoControlEvent } from '../types';
import { Play, AlertCircle } from 'lucide-react';

interface VideoPlayerProps {
  room: Room;
  isHost: boolean;
  onVideoControl: (event: VideoControlEvent) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ room, isHost, onVideoControl }) => {
  const playerRef = useRef<any>(null);
  const lastEventRef = useRef<number>(0);
  const [playerReady, setPlayerReady] = useState(false);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const opts: YouTubeProps['opts'] = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 0,
      controls: isHost ? 1 : 0,
      disablekb: !isHost ? 1 : 0,
      modestbranding: 1,
      rel: 0,
      enablejsapi: 1,
    },
  };

  // Reset states when video changes
  useEffect(() => {
    console.log('🎥 VideoPlayer: Video ID changed to:', room.videoId);
    if (room.videoId) {
      setIsLoading(true);
      setPlayerReady(false);
      setPlayerError(null);
    } else {
      setIsLoading(false);
      setPlayerReady(false);
      setPlayerError(null);
    }
  }, [room.videoId]);

  // Sync video state when room updates
  useEffect(() => {
    if (!playerRef.current || !room.videoState.lastUpdated || !playerReady || isLoading) return;
    
    const timeDiff = Date.now() - lastEventRef.current;
    if (timeDiff < 1000) return; // Prevent feedback loops
    
    const player = playerRef.current.getInternalPlayer();
    if (!player || !player.getPlayerState) return;

    try {
      const currentTime = room.videoState.currentTime;
      const isPlaying = room.videoState.playing;
      
      if (isPlaying) {
        player.playVideo();
      } else {
        player.pauseVideo();
      }
      
      const playerCurrentTime = player.getCurrentTime();
      if (Math.abs(playerCurrentTime - currentTime) > 2) {
        player.seekTo(currentTime, true);
      }
    } catch (error) {
      console.error('Error syncing video:', error);
    }
  }, [room.videoState, playerReady, isLoading]);

  const onReady: YouTubeProps['onReady'] = (event) => {
    console.log('🎥 VideoPlayer: YouTube player ready');
    playerRef.current = event.target;
    setPlayerReady(true);
    setIsLoading(false);
    setPlayerError(null);
  };

  const onStateChange: YouTubeProps['onStateChange'] = (event) => {
    console.log('🎥 VideoPlayer: State change:', event.data);
    
    // YouTube player states:
    // -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (video cued)
    if (event.data === 3) { // buffering
      setIsLoading(true);
    } else if (event.data === 1 || event.data === 2) { // playing or paused
      setIsLoading(false);
    } else if (event.data === 5) { // video cued
      setIsLoading(false);
      setPlayerReady(true);
    }
  };

  const onPlay: YouTubeProps['onPlay'] = () => {
    if (isHost) {
      lastEventRef.current = Date.now();
      onVideoControl({
        type: 'play',
        timestamp: Date.now(),
        currentTime: playerRef.current?.getInternalPlayer()?.getCurrentTime() || 0
      });
    }
  };

  const onPause: YouTubeProps['onPause'] = () => {
    if (isHost) {
      lastEventRef.current = Date.now();
      onVideoControl({
        type: 'pause',
        timestamp: Date.now(),
        currentTime: playerRef.current?.getInternalPlayer()?.getCurrentTime() || 0
      });
    }
  };

  const onError: YouTubeProps['onError'] = (event) => {
    console.error('🎥 VideoPlayer: YouTube player error:', event.data);
    setPlayerError('Failed to load video. Please check the URL and try again.');
    setPlayerReady(false);
    setIsLoading(false);
  };

  if (!room.videoId) {
    return (
      <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-700">
        <div className="text-center text-gray-400">
          <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Play className="w-8 h-8" />
          </div>
          <p className="text-lg font-medium">No video selected</p>
          <p className="text-sm">
            {isHost ? 'Paste a YouTube URL above to get started' : 'Host will add a YouTube video to watch together'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
      {playerError && (
        <div className="absolute inset-0 bg-red-900/50 flex items-center justify-center z-10">
          <div className="text-center text-white p-4">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-400" />
            <p className="font-medium mb-2">Video Error</p>
            <p className="text-sm text-red-200">{playerError}</p>
          </div>
        </div>
      )}
      
      {/* Loading overlay */}
      {(isLoading || (!playerReady && room.videoId && !playerError)) && (
        <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center z-20">
          <div className="text-center text-gray-400">
            <div className="animate-spin w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full mx-auto mb-3"></div>
            <p className="text-sm">Loading video...</p>
          </div>
        </div>
      )}
      
      <YouTube
        key={`youtube-${room.videoId}-${Date.now()}`} // Force complete re-mount
        videoId={room.videoId}
        opts={opts}
        onReady={onReady}
        onStateChange={onStateChange}
        onPlay={onPlay}
        onPause={onPause}
        onError={onError}
        className="w-full h-full"
        iframeClassName="w-full h-full"
      />
    </div>
  );
};
