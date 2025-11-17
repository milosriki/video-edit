import React, { useState, useRef, useEffect } from 'react';
import { PlayIcon, PauseIcon } from './icons';

interface VideoPlayerProps {
  src: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setProgress(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (event: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current && progressRef.current) {
      const rect = progressRef.current.getBoundingClientRect();
      const pos = (event.clientX - rect.left) / rect.width;
      videoRef.current.currentTime = pos * duration;
    }
  };
  
  const formatTime = (time: number) => {
    if (isNaN(time) || time === 0) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
        const handleEnd = () => setIsPlaying(false);
        video.addEventListener('ended', handleEnd);
        return () => {
            video.removeEventListener('ended', handleEnd);
        }
    }
  }, []);

  return (
    <div className="relative group w-full max-w-2xl mx-auto rounded-lg overflow-hidden bg-black shadow-lg border border-gray-700">
      <video
        ref={videoRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onClick={togglePlay}
        className="w-full h-auto aspect-video cursor-pointer"
      />
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center pointer-events-none">
        {!isPlaying && (
            <div className="p-4 bg-indigo-600/70 rounded-full text-white transition-transform transform scale-0 group-hover:scale-100 duration-300">
                <PlayIcon className="w-10 h-10" />
            </div>
        )}
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="flex items-center gap-4 text-white">
            <button onClick={togglePlay} aria-label={isPlaying ? 'Pause' : 'Play'}>
                {isPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />}
            </button>
            <span className="text-sm font-mono" aria-label="Current time">{formatTime(progress)}</span>
            <div ref={progressRef} onClick={handleSeek} className="w-full h-2 bg-gray-600/80 rounded-full cursor-pointer flex items-center group/progress">
                <div 
                    style={{ width: `${(progress / duration) * 100}%` }}
                    className="h-2 bg-indigo-500 rounded-full relative"
                >
                   <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 bg-white rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity"></div>
                </div>
            </div>
            <span className="text-sm font-mono" aria-label="Total duration">{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;