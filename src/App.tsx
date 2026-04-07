import { useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk';
import { useMusicStore } from './store';
import Search from './components/Search';
import Library from './components/Library';
import PlayerYT from './components/PlayerYT';
import { Search as SearchIcon, Library as LibraryIcon } from 'lucide-react';
import './App.css';

function App() {
  const { loadLibrary } = useMusicStore();
  const [activeTab, setActiveTab] = useState<'search' | 'library'>('search');

  useEffect(() => {
    try {
      // Initialize Telegram Mini App
      if (WebApp.initData) {
        WebApp.ready();
        WebApp.expand();
      }
    } catch (error) {
      console.warn("Telegram SDK is not fully available in this environment", error);
    }

    // Load offline tracks from IndexedDB
    loadLibrary();

    // Request notification permission for download notifications
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [loadLibrary]);

  return (
    <>
      {/* Header/Tabs */}
      <div style={{ 
        display: 'flex', 
        padding: '12px', 
        gap: '12px',
        background: 'var(--secondary-bg-color)',
        borderBottom: '1px solid var(--glass-border)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <button 
          onClick={() => setActiveTab('search')}
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: '12px',
            background: activeTab === 'search' ? 'var(--button-color)' : 'transparent',
            color: activeTab === 'search' ? '#fff' : 'var(--hint-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontWeight: 600
          }}
        >
          <SearchIcon size={18} />
          Поиск
        </button>
        <button 
          onClick={() => setActiveTab('library')}
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: '12px',
            background: activeTab === 'library' ? 'var(--button-color)' : 'transparent',
            color: activeTab === 'library' ? '#fff' : 'var(--hint-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontWeight: 600
          }}
        >
          <LibraryIcon size={18} />
          Папки
        </button>
      </div>

      {/* Main Content Area */}
      <main>
        {activeTab === 'search' ? <Search /> : <Library />}
      </main>

      {/* Global Player anchored to bottom */}
      <PlayerYT />
    </>
  );
}

export default App;
