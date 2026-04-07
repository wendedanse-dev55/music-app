import { useState, useEffect } from 'react';
import { useMusicStore } from '../store';
import type { Track } from '../types';
import { Search as SearchIcon, Download, Play, Check, Loader2 } from 'lucide-react';
import { API_URL } from '../config';

export default function Search() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [showFolderSelect, setShowFolderSelect] = useState<string | null>(null);
  const { searchResults, setSearchResults, setCurrentTrack, downloadTrack, folders, savedTracks } = useMusicStore();

  // Дебаунс для автопоиска
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      try {
        // Вызов нашего кастомного Node.js сервера, который тянет полные треки (аудио-стриминг)
        const response = await fetch(`${API_URL}/api/search?q=${encodeURIComponent(query)}`);

        if (!response.ok) throw new Error('Network error');

        const results: Track[] = await response.json();
        setSearchResults(results);
      } catch (error) {
        console.error("Ошибка при поиске:", error);
      } finally {
        setLoading(false);
      }
    }, 500); // 500мс задержка после последнего нажатия клавиши

    return () => clearTimeout(delayDebounceFn);
  }, [query, setSearchResults]);

  const handleDownload = async (track: Track, folderId?: string) => {
    setDownloadingId(track.id);
    setDownloadProgress(0);
    console.log('Starting download for:', track.title, 'URL:', track.url);

    try {
      const videoId = track.url.split('/').pop();
      if (!videoId) throw new Error('Invalid track URL');

      const downloadUrl = `${API_URL}/api/download/${videoId}`;

      // Fetch with progress tracking
      const response = await fetch(downloadUrl);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let receivedLength = 0;

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        chunks.push(value);
        receivedLength += value.length;

        if (total > 0) {
          const progress = Math.round((receivedLength / total) * 100);
          setDownloadProgress(progress);
        }
      }

      // Combine chunks into blob
      const blob = new Blob(chunks);
      console.log('Download completed, blob size:', blob.size);

      // Save to IndexedDB with blob
      const { downloadAndSaveTrack } = await import('../db');
      await downloadAndSaveTrack(track, folderId, blob);

      // Update store to refresh UI
      await downloadTrack(track, folderId);

      console.log('Download completed successfully');

      // Показываем уведомление об успешном скачивании
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Трек скачан', {
          body: `${track.title} - ${track.artist}`,
          icon: track.coverUrl
        });
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('Ошибка скачивания: ' + (error as Error).message);
    } finally {
      setDownloadingId(null);
      setDownloadProgress(0);
      setShowFolderSelect(null);
    }
  };

  const isTrackSaved = (trackId: string) => savedTracks.some(t => t.id === trackId);

  return (
    <div style={{ padding: '16px', paddingBottom: '100px' }}>
      <div style={{ position: 'relative', marginBottom: '24px' }}>
        <input 
          type="search" 
          placeholder="Поиск реальных треков (как в Spotify)..." 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ paddingLeft: '40px' }}
        />
        <SearchIcon 
          size={20} 
          style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} 
          className="text-hint" 
        />
      </div>

      {loading && <p style={{ textAlign: 'center' }} className="text-hint">Ищем музыку...</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {searchResults.map((track) => {
          const isSaved = isTrackSaved(track.id);
          const isDownloading = downloadingId === track.id;
          const showFolder = showFolderSelect === track.id;

          return (
            <div key={track.id} className="glass-panel" style={{ padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--secondary-bg-color)', overflow: 'hidden' }}>
                  {track.coverUrl ? (
                    <img src={track.coverUrl} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🎶</div>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 className="ellipsis" style={{ margin: 0, fontSize: '14px' }}>{track.title}</h4>
                  <p className="text-hint ellipsis" style={{ margin: 0, fontSize: '12px' }}>{track.artist}</p>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setCurrentTrack(track)}
                    style={{ padding: '8px', background: 'var(--button-color)', borderRadius: '50%', color: '#fff' }}
                  >
                    <Play size={16} fill="currentColor" />
                  </button>
                  <button
                    onClick={() => isSaved ? null : setShowFolderSelect(showFolder ? null : track.id)}
                    disabled={isDownloading || isSaved}
                    style={{
                      padding: '8px',
                      background: isSaved ? 'var(--button-color)' : 'var(--glass-border)',
                      borderRadius: '50%',
                      color: isSaved ? '#fff' : 'inherit',
                      opacity: isDownloading ? 0.5 : 1,
                      cursor: isDownloading || isSaved ? 'default' : 'pointer',
                      position: 'relative'
                    }}
                    title={isSaved ? 'Уже скачано' : isDownloading ? `Скачивание ${downloadProgress}%` : 'Скачать для оффлайн'}
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                        {downloadProgress > 0 && (
                          <span style={{
                            position: 'absolute',
                            top: '-20px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            fontSize: '10px',
                            whiteSpace: 'nowrap',
                            background: 'var(--button-color)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            color: '#fff'
                          }}>
                            {downloadProgress}%
                          </span>
                        )}
                      </>
                    ) : isSaved ? (
                      <Check size={16} />
                    ) : (
                      <Download size={16} />
                    )}
                  </button>
                </div>
              </div>

              {showFolder && !isSaved && (
                <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handleDownload(track)}
                    className="glass-panel"
                    style={{ padding: '8px 12px', fontSize: '12px' }}
                  >
                    Без папки
                  </button>
                  {folders.map(folder => (
                    <button
                      key={folder.id}
                      onClick={() => handleDownload(track, folder.id)}
                      className="glass-panel"
                      style={{ padding: '8px 12px', fontSize: '12px' }}
                    >
                      {folder.name}
                    </button>
                  ))}
                </div>
              )}

              {isDownloading && downloadProgress > 0 && (
                <div style={{ marginTop: '12px' }}>
                  <div style={{
                    width: '100%',
                    height: '4px',
                    background: 'var(--glass-border)',
                    borderRadius: '2px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${downloadProgress}%`,
                      height: '100%',
                      background: 'var(--button-color)',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                  <p style={{
                    fontSize: '11px',
                    color: 'var(--hint-color)',
                    marginTop: '4px',
                    textAlign: 'center'
                  }}>
                    Скачивание... {downloadProgress}%
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
