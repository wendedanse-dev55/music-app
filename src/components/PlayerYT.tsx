import { useEffect, useRef, useState } from 'react';
import { useMusicStore } from '../store';
import { Play, Pause, Volume2 } from 'lucide-react';

// Declare YouTube API types
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export default function Player() {
  const { currentTrack, isPlaying, setIsPlaying } = useMusicStore();
  const playerRef = useRef<any>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isReady, setIsReady] = useState(false);

  // Load YouTube IFrame API
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        setIsReady(true);
      };
    } else {
      setIsReady(true);
    }
  }, []);

  // Create player when track changes
  useEffect(() => {
    if (!isReady || !currentTrack) return;

    const videoId = currentTrack.url.split('v=')[1]?.split('&')[0];
    if (!videoId) return;

    if (playerRef.current) {
      playerRef.current.loadVideoById(videoId);
      playerRef.current.playVideo();
    } else {
      playerRef.current = new window.YT.Player('youtube-player', {
        height: '0',
        width: '0',
        videoId: videoId,
        playerVars: {
          autoplay: 1,
          controls: 0,
        },
        events: {
          onReady: () => {
            playerRef.current.playVideo();
          },
          onStateChange: (event: any) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              setDuration(playerRef.current.getDuration());
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              setIsPlaying(false);
            } else if (event.data === window.YT.PlayerState.ENDED) {
              setIsPlaying(false);
            }
          },
        },
      });
    }

    // Update progress
    const interval = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        const current = playerRef.current.getCurrentTime();
        const total = playerRef.current.getDuration();
        setCurrentTime(current);
        setDuration(total);
        setProgress((current / total) * 100);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentTrack, isReady, setIsPlaying]);

  // Control playback
  useEffect(() => {
    if (!playerRef.current) return;

    if (isPlaying) {
      playerRef.current.playVideo?.();
    } else {
      playerRef.current.pauseVideo?.();
    }
  }, [isPlaying]);

  const togglePlay = () => setIsPlaying(!isPlaying);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!playerRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    playerRef.current.seekTo(percent * duration);
  };

  const formatTime = (s: number) => {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (!currentTrack) return null;

  return (
    <>
      <div id="youtube-player" style={{ display: 'none' }}></div>
      <div className="glass-panel" style={{
        position: 'fixed',
        bottom: '16px',
        left: '16px',
        right: '16px',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        zIndex: 1000
      }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: 'var(--glass-bg)', overflow: 'hidden', flexShrink: 0 }}>
          {currentTrack.coverUrl ? (
            <img src={currentTrack.coverUrl} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Volume2 size={24} color="var(--hint-color)" />
            </div>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h4 className="ellipsis" style={{ fontSize: '14px', marginBottom: '2px' }}>{currentTrack.title}</h4>
          <p className="text-hint ellipsis" style={{ fontSize: '12px', margin: 0 }}>{currentTrack.artist}</p>

          <div
            onClick={handleSeek}
            style={{
              height: '4px',
              background: 'var(--glass-border)',
              marginTop: '8px',
              borderRadius: '2px',
              cursor: 'pointer'
            }}
          >
            <div style={{
              height: '100%',
              width: `${progress}%`,
              background: 'var(--button-color)',
              borderRadius: '2px',
              transition: 'width 0.1s linear'
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
            <span className="text-hint" style={{ fontSize: '10px' }}>{formatTime(currentTime)}</span>
            <span className="text-hint" style={{ fontSize: '10px' }}>{formatTime(duration)}</span>
          </div>
        </div>

        <button onClick={togglePlay} style={{ background: 'var(--button-color)', borderRadius: '50%', padding: '10px', color: '#fff', flexShrink: 0 }}>
          {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" style={{ marginLeft: '2px' }} />}
        </button>
      </div>
    </>
  );
}
