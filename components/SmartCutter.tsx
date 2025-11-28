/**
 * SmartCutter Component
 * AI-powered video cutting with detected key moments
 */

import React, { useState, useRef, useEffect } from 'react';
import { titanApi, CutSuggestion } from '../services/titanApi';
import { ScissorsIcon, PlayIcon, PauseIcon, DownloadIcon, SparklesIcon } from './icons';

interface SmartCutterProps {
  videoFile: File;
  videoId: string;
  onClose: () => void;
}

interface TimelineMarker {
  time: number;
  type: string;
  note: string;
  color: string;
}

const MARKER_COLORS: Record<string, string> = {
  hook: '#ef4444',      // Red
  problem: '#f59e0b',   // Amber
  solution: '#10b981',  // Emerald
  proof: '#3b82f6',     // Blue
  transformation: '#8b5cf6', // Purple
  cta: '#ec4899',       // Pink
};

export const SmartCutter: React.FC<SmartCutterProps> = ({ videoFile, videoId, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [suggestions, setSuggestions] = useState<CutSuggestion[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<CutSuggestion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [markers, setMarkers] = useState<TimelineMarker[]>([]);
  const [videoUrl, setVideoUrl] = useState<string>('');

  useEffect(() => {
    // Create object URL for video
    const url = URL.createObjectURL(videoFile);
    setVideoUrl(url);
    
    return () => URL.revokeObjectURL(url);
  }, [videoFile]);

  useEffect(() => {
    loadCutSuggestions();
  }, [videoId]);

  const loadCutSuggestions = async () => {
    setIsLoading(true);
    try {
      const response = await titanApi.generateCuts(videoId, [15, 30, 60]);
      setSuggestions(response.suggestions);
      
      // Extract markers from all suggestions
      const allMarkers: TimelineMarker[] = [];
      response.suggestions.forEach(s => {
        s.key_moments.forEach(m => {
          if (!allMarkers.find(existing => existing.time === m.time)) {
            allMarkers.push({
              time: m.time,
              type: m.type,
              note: m.note,
              color: MARKER_COLORS[m.type] || '#6b7280',
            });
          }
        });
      });
      
      setMarkers(allMarkers.sort((a, b) => a.time - b.time));
    } catch (err) {
      console.error('Failed to load cut suggestions:', err);
      // Mock suggestions for demo
      setSuggestions([
        {
          duration: 15,
          start_time: 0,
          end_time: 15,
          key_moments: [
            { time: 0, type: 'hook', note: 'Opening hook' },
            { time: 12, type: 'cta', note: 'Call to action' },
          ],
          reasoning: 'Short format: Strong hook directly to CTA',
        },
        {
          duration: 30,
          start_time: 0,
          end_time: 30,
          key_moments: [
            { time: 0, type: 'hook', note: 'Opening hook' },
            { time: 5, type: 'problem', note: 'Pain point' },
            { time: 15, type: 'solution', note: 'Solution intro' },
            { time: 27, type: 'cta', note: 'Call to action' },
          ],
          reasoning: 'Standard format: Hook-Problem-Solution-CTA arc',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current && duration > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = x / rect.width;
      const newTime = percentage * duration;
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleMarkerClick = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleApplyCut = (suggestion: CutSuggestion) => {
    setSelectedSuggestion(suggestion);
    if (videoRef.current) {
      videoRef.current.currentTime = suggestion.start_time;
      setCurrentTime(suggestion.start_time);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col border border-gray-700">
        {/* Header */}
        <header className="p-4 border-b border-gray-700 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <ScissorsIcon className="w-6 h-6 text-indigo-400" />
            <h2 className="text-xl font-bold">Smart Cutter</h2>
            <span className="text-sm text-gray-400">{videoFile.name}</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </header>

        <div className="flex-1 overflow-auto p-4">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Video Player */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-black rounded-lg overflow-hidden aspect-video">
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className="w-full h-full object-contain"
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onEnded={() => setIsPlaying(false)}
                />
              </div>

              {/* Controls */}
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <button
                    onClick={handlePlayPause}
                    className="p-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg"
                  >
                    {isPlaying ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
                  </button>
                  <span className="text-sm font-mono">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                  {selectedSuggestion && (
                    <span className="text-sm text-indigo-400">
                      Cut: {selectedSuggestion.duration}s version selected
                    </span>
                  )}
                </div>

                {/* Timeline */}
                <div 
                  className="relative h-12 bg-gray-800 rounded-lg cursor-pointer"
                  onClick={handleTimelineClick}
                >
                  {/* Progress bar */}
                  <div 
                    className="absolute top-0 left-0 h-full bg-indigo-600/30 rounded-l-lg"
                    style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                  />
                  
                  {/* Selected cut range */}
                  {selectedSuggestion && duration > 0 && (
                    <div
                      className="absolute top-0 h-full bg-green-500/30 border-x-2 border-green-500"
                      style={{
                        left: `${(selectedSuggestion.start_time / duration) * 100}%`,
                        width: `${((selectedSuggestion.end_time - selectedSuggestion.start_time) / duration) * 100}%`,
                      }}
                    />
                  )}
                  
                  {/* Markers */}
                  {markers.map((marker, i) => (
                    <button
                      key={i}
                      className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow-lg z-10 hover:scale-125 transition-transform"
                      style={{ 
                        left: `${duration > 0 ? (marker.time / duration) * 100 : 0}%`,
                        backgroundColor: marker.color,
                        marginLeft: '-8px',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkerClick(marker.time);
                      }}
                      title={`${marker.type}: ${marker.note}`}
                    />
                  ))}

                  {/* Playhead */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-white z-20"
                    style={{ left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                  />
                </div>

                {/* Marker Legend */}
                <div className="flex flex-wrap gap-3 text-xs">
                  {Object.entries(MARKER_COLORS).map(([type, color]) => (
                    <div key={type} className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                      <span className="capitalize">{type}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Cut Suggestions */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <SparklesIcon className="w-5 h-5 text-purple-400" />
                AI Cut Suggestions
              </h3>

              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-32 bg-gray-800 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {suggestions.map((suggestion, i) => (
                    <div
                      key={i}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedSuggestion?.duration === suggestion.duration
                          ? 'border-indigo-500 bg-indigo-900/30'
                          : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
                      }`}
                      onClick={() => handleApplyCut(suggestion)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-lg font-bold">{suggestion.duration}s</span>
                        <span className="text-xs text-gray-500">
                          {formatTime(suggestion.start_time)} - {formatTime(suggestion.end_time)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mb-3">{suggestion.reasoning}</p>
                      <div className="flex flex-wrap gap-1">
                        {suggestion.key_moments.map((moment, j) => (
                          <span
                            key={j}
                            className="text-xs px-2 py-0.5 rounded-full text-white"
                            style={{ backgroundColor: MARKER_COLORS[moment.type] || '#6b7280' }}
                          >
                            {moment.type}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Export Button */}
              {selectedSuggestion && (
                <button
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
                  onClick={() => {
                    // In a real implementation, this would trigger FFmpeg export
                    alert(`Export ${selectedSuggestion.duration}s cut (${formatTime(selectedSuggestion.start_time)} - ${formatTime(selectedSuggestion.end_time)})`);
                  }}
                >
                  <DownloadIcon className="w-5 h-5" />
                  Export {selectedSuggestion.duration}s Version
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartCutter;
