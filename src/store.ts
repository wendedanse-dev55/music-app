import { create } from 'zustand';
import type { Track, Folder } from './types';
import { getAllSavedTracks, downloadAndSaveTrack, removeTrackLocally, updateTrackMetadata } from './db';

interface MusicState {
  currentTrack: Track | null;
  isPlaying: boolean;
  folders: Folder[];
  savedTracks: Track[];
  searchResults: Track[];
  
  // Actions
  setCurrentTrack: (track: Track | null) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setSearchResults: (results: Track[]) => void;
  
  // Library Actions
  loadLibrary: () => Promise<void>;
  createFolder: (name: string) => void;
  downloadTrack: (track: Track, folderId?: string) => Promise<void>;
  removeTrack: (trackId: string) => Promise<void>;
  moveTrackToFolder: (trackId: string, folderId: string | null) => void;
}

export const useMusicStore = create<MusicState>((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  folders: JSON.parse(localStorage.getItem('music_folders') || '[]'),
  savedTracks: [],
  searchResults: [],

  setCurrentTrack: (track) => set({ currentTrack: track, isPlaying: !!track }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setSearchResults: (results) => set({ searchResults: results }),

  loadLibrary: async () => {
    const tracks = await getAllSavedTracks();
    set({ savedTracks: tracks });
  },

  createFolder: (name) => {
    const newFolder: Folder = { id: Date.now().toString(), name, createdAt: Date.now() };
    const newFolders = [...get().folders, newFolder];
    set({ folders: newFolders });
    localStorage.setItem('music_folders', JSON.stringify(newFolders));
  },

  downloadTrack: async (track, folderId) => {
    const success = await downloadAndSaveTrack(track, folderId);
    if (success) {
      const savedTrack = { ...track, isOffline: true, folderId: folderId || null };

      // Update local state avoiding duplicates
      const existingFilter = get().savedTracks.filter(t => t.id !== savedTrack.id);
      set({ savedTracks: [...existingFilter, savedTrack] });
    }
  },

  removeTrack: async (trackId) => {
    await removeTrackLocally(trackId);
    set({ savedTracks: get().savedTracks.filter((t) => t.id !== trackId) });
  },

  moveTrackToFolder: async (trackId, folderId) => {
    const tracks = get().savedTracks;
    const trackIndex = tracks.findIndex(t => t.id === trackId);
    if (trackIndex > -1) {
      const updatedTrack = { ...tracks[trackIndex], folderId };
      const updatedTracks = [...tracks];
      updatedTracks[trackIndex] = updatedTrack;
      set({ savedTracks: updatedTracks });

      // Update metadata in IndexedDB
      await updateTrackMetadata(trackId, { folderId });
    }
  }
}));
