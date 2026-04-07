import express from 'express';
import cors from 'cors';
import ytSearch from 'yt-search';

const app = express();
const PORT = process.env.PORT || 3001;
const BASE_URL = process.env.RAILWAY_PUBLIC_DOMAIN
  ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
  : `http://localhost:${PORT}`;

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

// Поиск музыки через YouTube
app.get('/api/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Query parameter q is required' });
    }

    const searchResult = await ytSearch(String(q));
    const videos = searchResult.videos.slice(0, 15);

    const tracks = videos.map(video => ({
      id: video.videoId,
      title: video.title,
      artist: video.author.name,
      // Используем прямую YouTube ссылку - браузер сам разберется
      url: `https://www.youtube.com/watch?v=${video.videoId}`,
      coverUrl: video.thumbnail,
      duration: video.seconds
    }));

    res.json(tracks);

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Music API Server' });
});

app.listen(PORT, () => {
  console.log(`Backend server running on ${BASE_URL}`);
});
