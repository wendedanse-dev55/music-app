export interface Track {
  id: string;
  title: string;
  artist: string;
  url: string;      // Stream URL or proxy generic endpoint
  coverUrl?: string;
  duration?: number;
  folderId?: string | null;
  isOffline?: boolean;
}

export interface Folder {
  id: string;
  name: string;
  createdAt: number;
}
