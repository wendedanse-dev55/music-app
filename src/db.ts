import localforage from 'localforage';
import type { Track } from './types';
import { API_URL } from './config';

// Initialize core storage instances
const audioDB = localforage.createInstance({
  name: 'MusicApp_Audio',
  storeName: 'audio_blobs'
});

const metadataDB = localforage.createInstance({
  name: 'MusicApp_Meta',
  storeName: 'tracks_metadata'
});

/**
 * Download track from URL and save context to IndexedDB
 */
export async function downloadAndSaveTrack(track: Track, folderId?: string | null, blob?: Blob): Promise<boolean> {
  try {
    let audioBlob: Blob;

    if (blob) {
      // Use provided blob
      audioBlob = blob;
      console.log('Using provided blob, size:', blob.size);
    } else {
      // Extract video ID from URL (format: http://localhost:3001/api/stream/VIDEO_ID)
      const videoId = track.url.split('/').pop();
      if (!videoId) {
        throw new Error('Invalid track URL');
      }

      // Use download endpoint instead of stream to avoid CORS issues
      const downloadUrl = `${API_URL}/api/download/${videoId}`;
      console.log('Downloading from:', downloadUrl);

      // 1. Fetch the audio data as a Blob
      const response = await fetch(downloadUrl);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      audioBlob = await response.blob();
      console.log('Downloaded blob size:', audioBlob.size, 'bytes');
    }

    // Check if we actually got audio data
    if (audioBlob.size === 0) {
      throw new Error('Empty audio file received');
    }

    // 2. Save blob to audioDB
    await audioDB.setItem(track.id, audioBlob);
    console.log('Saved to IndexedDB');

    // 3. Mark track as offline and save metadata with folder info
    const savedTrack = { ...track, isOffline: true, folderId: folderId || null };
    await metadataDB.setItem(track.id, savedTrack);

    return true;
  } catch (error) {
    console.error('Download failed:', error);
    throw error;
  }
}

/**
 * Remove track from local storage
 */
export async function removeTrackLocally(trackId: string): Promise<void> {
  await audioDB.removeItem(trackId);
  await metadataDB.removeItem(trackId);
}

/**
 * Update track metadata (e.g., folder assignment)
 */
export async function updateTrackMetadata(trackId: string, updates: Partial<Track>): Promise<void> {
  const existingTrack = await metadataDB.getItem<Track>(trackId);
  if (existingTrack) {
    await metadataDB.setItem(trackId, { ...existingTrack, ...updates });
  }
}

/**
 * Retrieve a local audio Blob URL
 */
export async function getLocalAudioUrl(trackId: string): Promise<string | null> {
  const blob = await audioDB.getItem<Blob>(trackId);
  if (blob) {
    return URL.createObjectURL(blob);
  }
  return null;
}

/**
 * Get all saved tracks metadata
 */
export async function getAllSavedTracks(): Promise<Track[]> {
  const tracks: Track[] = [];
  await metadataDB.iterate((value: Track) => {
    tracks.push(value);
  });
  return tracks;
}
