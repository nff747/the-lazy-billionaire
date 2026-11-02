
import React, { useEffect, useRef, useState } from 'react';

export const Intro: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [fade, setFade] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const playVideo = async () => {
      if (videoRef.current) {
        try {
          // Force load and play
          videoRef.current.load();
          await videoRef.current.play();
          setHasStarted(true);
        } catch (err) {
          console.warn("Video autoplay failed, waiting for user interaction or skipping...", err);
          // If it really can't play, we'll let the failsafe handle it
        }
      }
    };

    playVideo();

    // Fail-safe: transition after 6s as requested
    const failSafe = setTimeout(() => {
      setFade(true);
      setTimeout(onComplete, 1000);
    }, 6000);

    return () => clearTimeout(failSafe);
  }, [onComplete]);

  const handleVideoEnd = () => {
    setFade(true);
    setTimeout(onComplete, 1000);
  };

  return (
    <div className={`fixed inset-0 z-[5000] bg-black flex items-center justify-center transition-opacity duration-1000 ${fade ? 'opacity-0' : 'opacity-100'} overflow-hidden select-none`}>
      <div className="relative w-full max-w-[440px] h-full max-h-[85vh] flex items-center justify-center p-4">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          onEnded={handleVideoEnd}
          className="w-full h-full object-contain pointer-events-none"
          style={{ 
            opacity: hasStarted ? 1 : 0, 
            mixBlendMode: 'screen',
            filter: 'contrast(1.2) brightness(0.9)',
            transition: 'opacity 0.6s ease-in' 
          }}
        >
          {/* Bundled local cinematic video */}
          <source src="/assets/video/INTRO.mp4" type="video/mp4" />
          <source src="intro.mp4" type="video/mp4" />
        </video>
      </div>
      
      {!hasStarted && (
        <div className="absolute inset-0 flex items-center justify-center bg-black pointer-events-none">
           <div className="w-12 h-12 border-2 border-white/10 border-t-amber-500 rounded-full animate-spin"></div>
        </div>
      )}

      <div className="absolute bottom-10 left-0 right-0 text-center pointer-events-none px-4">
        <p className="text-white/40 font-black text-[10px] uppercase tracking-[0.5em] md:tracking-[0.8em] animate-pulse">
          Establishing Imperial Connection
        </p>
      </div>
    </div>
  );
};
