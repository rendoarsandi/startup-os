import { useEffect, useRef, useState } from 'react';

type Props = {
  src: string;
  className?: string;
};

export function BoomerangVideoBg({ src, className }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  const [framesReady, setFramesReady] = useState(false);
  const framesRef = useRef<HTMLCanvasElement[]>([]);
  const scrollFractionRef = useRef(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const frames: HTMLCanvasElement[] = [];
    let capturing = true;
    let lastTime = -1;
    const MAX_WIDTH = 960;
    const TARGET_FRAMES = 80; // Capture at most 80 frames for smooth performance & low memory
    let minTimeDelta = 0.05; // Default safe fallback (seconds)

    const captureFrame = () => {
      if (!capturing || video.readyState < 2) return;
      
      const currentTime = video.currentTime;
      // Skip if video time hasn't changed or hasn't advanced enough
      if (currentTime === lastTime || (lastTime !== -1 && currentTime - lastTime < minTimeDelta)) {
        return;
      }
      lastTime = currentTime;

      const vw = video.videoWidth;
      const vh = video.videoHeight;
      if (!vw || !vh) return;

      const scale = Math.min(1, MAX_WIDTH / vw);
      const w = Math.round(vw * scale);
      const h = Math.round(vh * scale);

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, w, h);
      frames.push(canvas);
      framesRef.current = frames; // Expose frames in real-time

      // Redraw the canvas immediately to match the scroll position using the newly captured frame
      drawCurrentFrame();
    };

    const drawCurrentFrame = () => {
      const canvas = displayCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const currentFrames = framesRef.current;
      if (currentFrames.length === 0) return;

      // Ensure canvas size is set to the first frame size
      if (canvas.width !== currentFrames[0].width) {
        canvas.width = currentFrames[0].width;
        canvas.height = currentFrames[0].height;
      }

      const fraction = scrollFractionRef.current;
      const index = Math.min(currentFrames.length - 1, Math.floor(fraction * currentFrames.length));
      if (index >= 0) {
        ctx.drawImage(currentFrames[index], 0, 0);
      }
    };

    type VFCVideo = HTMLVideoElement & {
      requestVideoFrameCallback?: (cb: () => void) => number;
    };

    const vfcVideo = video as VFCVideo;
    const hasVFC = typeof vfcVideo.requestVideoFrameCallback === 'function';
    let rafId = 0;

    const rafLoop = () => {
      captureFrame();
      if (capturing) rafId = requestAnimationFrame(rafLoop);
    };

    const vfcLoop = () => {
      captureFrame();
      if (capturing && vfcVideo.requestVideoFrameCallback) {
        vfcVideo.requestVideoFrameCallback(vfcLoop);
      }
    };

    const onEnded = () => {
      capturing = false;
      if (frames.length > 0) {
        framesRef.current = frames;
        setFramesReady(true);
      }
    };

    const onLoaded = () => {
      // Calculate optimal frame interval based on duration
      if (video.duration && video.duration > 0) {
        minTimeDelta = video.duration / TARGET_FRAMES;
      }

      // Draw first frame immediately to canvas so user doesn't see a blank background
      const canvas = displayCanvasRef.current;
      if (canvas && video.videoWidth && video.videoHeight) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const scale = Math.min(1, MAX_WIDTH / video.videoWidth);
          canvas.width = Math.round(video.videoWidth * scale);
          canvas.height = Math.round(video.videoHeight * scale);
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        }
      }

      // Play at normal or slightly elevated rate (1.5x instead of 3.0x to avoid heavy lag)
      video.playbackRate = 1.5;
      video.play().catch(() => {});
      if (hasVFC) {
        vfcVideo.requestVideoFrameCallback!(vfcLoop);
      } else {
        rafId = requestAnimationFrame(rafLoop);
      }
    };

    video.addEventListener('loadedmetadata', onLoaded);
    video.addEventListener('ended', onEnded);
    if (video.readyState >= 1) onLoaded();

    return () => {
      capturing = false;
      cancelAnimationFrame(rafId);
      video.removeEventListener('loadedmetadata', onLoaded);
      video.removeEventListener('ended', onEnded);
    };
  }, [src]);

  useEffect(() => {
    const canvas = displayCanvasRef.current;
    if (!canvas) return;

    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      
      // Calculate fraction of page scrolled (bound between 0 and 1)
      const scrollFraction = scrollHeight > 0 ? Math.max(0, Math.min(1, scrollTop / scrollHeight)) : 0;
      scrollFractionRef.current = scrollFraction;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const frames = framesRef.current;
      if (frames.length === 0) return;

      // Draw the selected frame
      const index = Math.min(frames.length - 1, Math.floor(scrollFraction * frames.length));
      ctx.drawImage(frames[index], 0, 0);
    };

    // Draw initial frame based on current scroll position
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  return (
    <div className={className ?? 'absolute inset-0 w-full h-full'}>
      <video
        ref={videoRef}
        src={src}
        style={{ display: 'none' }}
        muted
        playsInline
        preload="auto"
        crossOrigin="anonymous"
        loop={false}
      />
      <canvas
        ref={displayCanvasRef}
        className="w-full h-full object-cover"
      />
    </div>
  );
}

