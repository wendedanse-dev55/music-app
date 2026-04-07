import express from 'express';
import cors from 'cors';
import ytSearch from 'yt-search';
import { Client as SoundCloud } from 'soundcloud-scraper';

const app = express();
const PORT = process.env.PORT || 3001;
const BASE_URL = process.env.RAILWAY_PUBLIC_DOMAIN
  ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
  : `http://localhost:${PORT}`;

const soundcloud = new SoundCloud();

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://web.telegram.org',
    /\.vercel\.app$/,
    /\.railway\.app$/
  ],
  credentials: true
}));

// Поиск музыки через SoundCloud (работает в фоне на iOS!)
app.get('/api/search', async (req, res) => {
  try {
    const { q, source = 'soundcloud' } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Query parameter q is required' });
    }

    if (source === 'soundcloud') {
      // SoundCloud search
      const results = await soundcloud.search(String(q), 'track');
      const tracks = results.slice(0, 15).map(track => ({
        id: track.id.toString(),
        title: track.title,
        artist: track.author?.name || track.author?.username || 'Unknown',
        url: track.url, // Прямая ссылка на аудио
        coverUrl: track.thumbnail,
        duration: Math.floor(track.duration / 1000),
        source: 'soundcloud'
      }));

      res.json(tracks);
    } else {
      // YouTube search (fallback)
      const searchResult = await ytSearch(String(q));
      const videos = searchResult.videos.slice(0, 15);

      const tracks = videos.map(video => ({
        id: video.videoId,
        title: video.title,
        artist: video.author.name,
        url: `https://www.youtube.com/watch?v=${video.videoId}`,
        coverUrl: video.thumbnail,
        duration: video.seconds,
        source: 'youtube'
      }));

      res.json(tracks);
    }

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Получить прямую ссылку на аудио из SoundCloud
app.get('/api/stream/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).send('No id provided');

    const song = await soundcloud.getSongInfo(id);
    const stream = await song.downloadProgressive();

    res.setHeader('Content-Type', 'audio/mpeg');
    stream.pipe(res);

  } catch (err) {
    console.error('Stream error:', err.message);
    res.status(500).send('Error getting audio stream');
  }
});

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Music API Server with SoundCloud' });
});

app.listen(PORT, () => {
  console.log(`Backend server running on ${BASE_URL}`);
});
