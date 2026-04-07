import { useEffect, useRef, useState } from 'react';
import { useMusicStore } from '../store';
import { getLocalAudioUrl } from '../db';
import { Play, Pause, Volume2 } from 'lucide-react';

export default function Player() {
  const { currentTrack, isPlaying, setIsPlaying } = useMusicStore();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const wakeLockRef = useRef<any>(null);

  // Когда меняется трек — загружаем новый URL и начинаем воспроизведение
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    const loadAndPlay = async () => {
      let url = currentTrack.url;

      // Если трек скачан оффлайн — берём из IndexedDB
      if (currentTrack.isOffline) {
        const localUrl = await getLocalAudioUrl(currentTrack.id);
        if (localUrl) url = localUrl;
      }

      audio.src = url;
      audio.load();
      audio.play().catch(e => console.warn("Autoplay blocked:", e));

      // Media Session API для фонового воспроизведения
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: currentTrack.title,
          artist: currentTrack.artist,
          artwork: currentTrack.coverUrl ? [
            { src: currentTrack.coverUrl, sizes: '512x512', type: 'image/jpeg' }
          ] : []
        });

        navigator.mediaSession.setActionHandler('play', () => setIsPlaying(true));
        navigator.mediaSession.setActionHandler('pause', () => setIsPlaying(false));
        navigator.mediaSession.setActionHandler('seekbackward', () => {
          if (audio) audio.currentTime = Math.max(0, audio.currentTime - 10);
        });
        navigator.mediaSession.setActionHandler('seekforward', () => {
          if (audio) audio.currentTime = Math.min(audio.duration, audio.currentTime + 10);
        });
      }

      // Telegram WebApp: предотвращаем закрытие при блокировке
      try {
        if (window.Telegram?.WebApp) {
          window.Telegram.WebApp.enableClosingConfirmation();
        }
      } catch (e) {
        console.warn('Telegram WebApp API not available:', e);
      }
    };

    loadAndPlay();
  }, [currentTrack, setIsPlaying]);

  // Управление play/pause
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audio.src) return;

    if (isPlaying) {
      audio.play().catch(e => console.warn("Play blocked:", e));

      // Запрашиваем Wake Lock для предотвращения блокировки экрана
      requestWakeLock();
    } else {
      audio.pause();

      // Освобождаем Wake Lock при паузе
      releaseWakeLock();
    }
  }, [isPlaying]);

  // Wake Lock API для предотвращения засыпания
  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        console.log('Wake Lock активирован');
      }
    } catch (err) {
      console.warn('Wake Lock не поддерживается:', err);
    }
  };

  const releaseWakeLock = async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        console.log('Wake Lock освобожден');
      } catch (err) {
        console.warn('Ошибка освобождения Wake Lock:', err);
      }
    }
  };

  // Освобождаем Wake Lock при размонтировании
  useEffect(() => {
    return () => {
      releaseWakeLock();
    };
  }, []);

  const togglePlay = () => setIsPlaying(!isPlaying);

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (audio) {
      setCurrentTime(audio.currentTime);
      setDuration(audio.duration || 0);
      setProgress((audio.currentTime / (audio.duration || 1)) * 100);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audio.currentTime = percent * audio.duration;
  };

  const formatTime = (s: number) => {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (!currentTrack) return null;

  return (
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
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

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

        {/* Clickable Progress bar */}
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
  );
}
