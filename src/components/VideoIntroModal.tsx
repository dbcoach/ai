import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Play, Volume2, VolumeX } from 'lucide-react';

interface VideoIntroModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VideoIntroModal({ isOpen, onClose }: VideoIntroModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = React.useState(false);
  const [isPlaying, setIsPlaying] = React.useState(false);

  // Auto-play when modal opens
  useEffect(() => {
    if (isOpen && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(error => {
        console.log('Auto-play prevented:', error);
      });
    }
  }, [isOpen]);

  // Pause video when modal closes
  useEffect(() => {
    if (!isOpen && videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const handleVideoClick = () => {
    togglePlayPause();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60000] flex items-center justify-center p-4">
      {/* Backdrop with blur effect */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-4xl mx-auto">
        {/* Video Container with elegant border */}
        <div className="relative bg-slate-900/95 rounded-2xl border border-purple-500/30 shadow-2xl shadow-purple-500/10 overflow-hidden backdrop-blur-xl">
          
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
            <div>
              <h2 className="text-2xl font-bold text-white">Welcome to DB.Coach</h2>
              <p className="text-slate-300 text-sm mt-1">Discover how AI transforms database design</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors text-slate-400 hover:text-white"
              aria-label="Close video"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Video Player */}
          <div className="relative aspect-video bg-black">
            <video
              ref={videoRef}
              className="w-full h-full cursor-pointer"
              onClick={handleVideoClick}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
              muted={isMuted}
              playsInline
              preload="metadata"
            >
              <source src="/videos/dbcoach_intro.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>

            {/* Video Overlay Controls */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300">
              
              {/* Center Play Button (when paused) */}
              {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <button
                    onClick={togglePlayPause}
                    className="w-16 h-16 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30 transition-all duration-200 hover:scale-110"
                  >
                    <Play className="w-8 h-8 text-white ml-1" />
                  </button>
                </div>
              )}

              {/* Bottom Controls */}
              <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-between">
                <button
                  onClick={togglePlayPause}
                  className="p-2 bg-black/50 hover:bg-black/70 rounded-lg transition-colors text-white"
                >
                  {isPlaying ? (
                    <div className="w-4 h-4 flex space-x-1">
                      <div className="w-1.5 h-4 bg-white rounded"></div>
                      <div className="w-1.5 h-4 bg-white rounded"></div>
                    </div>
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </button>

                <button
                  onClick={toggleMute}
                  className="p-2 bg-black/50 hover:bg-black/70 rounded-lg transition-colors text-white"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 bg-gradient-to-r from-purple-600/10 via-blue-600/10 to-purple-600/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Ready to get started?</p>
                <p className="text-slate-300 text-sm">Try our live demo or sign up for free</p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    onClose();
                    // Navigate to demo - you can add navigation logic here
                    window.location.href = '/demo';
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
                >
                  Try Demo
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}