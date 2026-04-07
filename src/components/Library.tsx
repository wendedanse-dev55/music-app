import { useState } from 'react';
import { useMusicStore } from '../store';
import { Folder, Trash2, Play, FolderPlus } from 'lucide-react';

export default function Library() {
  const { folders, savedTracks, createFolder, removeTrack, setCurrentTrack, moveTrackToFolder } = useMusicStore();
  const [newFolderName, setNewFolderName] = useState('');
  const [activeFolder, setActiveFolder] = useState<string | null>(null);

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      createFolder(newFolderName.trim());
      setNewFolderName('');
    }
  };

  const filteredTracks = activeFolder 
    ? savedTracks.filter(t => t.folderId === activeFolder)
    : savedTracks;

  return (
    <div style={{ padding: '16px', paddingBottom: '100px' }}>
      <h2 style={{ marginBottom: '16px' }}>Моя Музыка</h2>
      
      {/* Folders Section */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '16px', scrollbarWidth: 'none' }}>
        <button 
          onClick={() => setActiveFolder(null)}
          className="glass-panel"
          style={{ 
            padding: '8px 16px', 
            whiteSpace: 'nowrap',
            background: activeFolder === null ? 'var(--button-color)' : 'var(--glass-bg)'
          }}
        >
          Все треки
        </button>
        {folders.map(folder => (
          <button 
            key={folder.id}
            onClick={() => setActiveFolder(folder.id)}
            className="glass-panel"
            style={{ 
              padding: '8px 16px', 
              whiteSpace: 'nowrap',
              background: activeFolder === folder.id ? 'var(--button-color)' : 'var(--glass-bg)'
            }}
          >
            <Folder size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} />
            {folder.name}
          </button>
        ))}
      </div>

      <form onSubmit={handleCreateFolder} style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <input 
          type="text" 
          placeholder="Новая папка..." 
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
        />
        <button type="submit" className="btn-primary" style={{ padding: '12px' }}>
          <FolderPlus size={20} />
        </button>
      </form>

      {/* Tracks Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredTracks.length === 0 ? (
          <p className="text-hint" style={{ textAlign: 'center', marginTop: '20px' }}>Нет сохраненных треков</p>
        ) : (
          filteredTracks.map((track) => (
            <div key={track.id} className="glass-panel" style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 className="ellipsis" style={{ margin: 0, fontSize: '14px' }}>
                  {track.isOffline && <span style={{ color: 'var(--button-color)', marginRight: '6px' }}>✓</span>}
                  {track.title}
                </h4>
                <p className="text-hint ellipsis" style={{ margin: 0, fontSize: '12px' }}>{track.artist}</p>
              </div>

              {folders.length > 0 && activeFolder === null && (
                <select 
                  onChange={(e) => moveTrackToFolder(track.id, e.target.value || null)}
                  value={track.folderId || ''}
                  style={{ 
                    background: 'var(--secondary-bg-color)', 
                    color: 'var(--text-color)', 
                    border: '1px solid var(--glass-border)',
                    borderRadius: '8px',
                    padding: '4px'
                  }}
                >
                  <option value="">Без папки</option>
                  {folders.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              )}

              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => setCurrentTrack(track)}
                  style={{ padding: '8px', background: 'var(--button-color)', borderRadius: '50%', color: '#fff' }}
                >
                  <Play size={16} fill="currentColor" />
                </button>
                <button 
                  onClick={() => removeTrack(track.id)}
                  style={{ padding: '8px', background: 'rgba(255, 0, 0, 0.2)', borderRadius: '50%', color: '#ff4444' }}
                  title="Удалить"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
