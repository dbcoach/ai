import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface VideoIntroModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VideoIntroModal({ isOpen, onClose }: VideoIntroModalProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

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

  // YouTube video ID extracted from the provided URL
  const youtubeVideoId = 'Ak7HrkdkHVE';
  
  // YouTube embed URL with proper parameters for embedding
  const youtubeEmbedUrl = `https://www.youtube-nocookie.com/embed/${youtubeVideoId}?autoplay=1&rel=0&modestbranding=1&controls=1&fs=1&iv_load_policy=3&playsinline=1`;

  // Stop video when modal closes by reloading the iframe
  useEffect(() => {
    if (!isOpen && iframeRef.current) {
      // Reset the iframe src to stop the video
      const currentSrc = iframeRef.current.src;
      iframeRef.current.src = '';
      setTimeout(() => {
        if (iframeRef.current) {
          iframeRef.current.src = currentSrc;
        }
      }, 100);
    }
  }, [isOpen]);

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

          {/* YouTube Video Player */}
          <div className="relative aspect-video bg-black">
            <iframe
              ref={iframeRef}
              className="w-full h-full"
              src={isOpen ? youtubeEmbedUrl : ''}
              title="DB.Coach Introduction Video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              style={{
                border: 'none',
                borderRadius: '0'
              }}
            />
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