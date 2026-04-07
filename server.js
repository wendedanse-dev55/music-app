import express from 'express';
import cors from 'cors';
import ytSearch from 'yt-search';
import ytdl from '@distube/ytdl-core';

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

// Кэш прямых ссылок
const urlCache = new Map();

async function getDirectAudioUrl(videoId) {
  try {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const info = await ytdl.getInfo(url);

    // Получаем лучший аудио формат
    const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
    if (audioFormats.length === 0) {
      throw new Error('No audio formats found');
    }

    // Выбираем формат с лучшим качеством
    const bestAudio = audioFormats.reduce((best, format) => {
      return (format.audioBitrate || 0) > (best.audioBitrate || 0) ? format : best;
    });

    return bestAudio.url;
  } catch (error) {
    console.error('ytdl error:', error.message);
    throw error;
  }
}

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
      url: `${BASE_URL}/api/stream/${video.videoId}`,
      coverUrl: video.thumbnail,
      duration: video.seconds
    }));

    res.json(tracks);

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Проксирование аудио: получаем прямую ссылку и редиректим
app.get('/api/stream/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).send('No id provided');

    let directUrl = urlCache.get(id);

    if (!directUrl) {
      directUrl = await getDirectAudioUrl(id);
      urlCache.set(id, directUrl);
      // Кэш на 3 часа (ссылки YouTube протухают)
      setTimeout(() => urlCache.delete(id), 3 * 60 * 60 * 1000);
    }

    // Редирект на прямую ссылку
    res.redirect(directUrl);

  } catch (err) {
    console.error('Stream error:', err.message);
    res.status(500).send('Error getting audio URL');
  }
});

// Endpoint для скачивания (проксирует аудио через сервер для избежания CORS)
app.get('/api/download/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).send('No id provided');

    let directUrl = urlCache.get(id);

    if (!directUrl) {
      directUrl = await getDirectAudioUrl(id);
      urlCache.set(id, directUrl);
      setTimeout(() => urlCache.delete(id), 3 * 60 * 60 * 1000);
    }

    // Проксируем файл через наш сервер
    const response = await fetch(directUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch audio: ${response.status}`);
    }

    // Копируем заголовки
    res.setHeader('Content-Type', response.headers.get('content-type') || 'audio/webm');
    const contentLength = response.headers.get('content-length');
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }
    res.setHeader('Accept-Ranges', 'bytes');

    // Конвертируем ReadableStream в Node.js stream и пайпим
    const reader = response.body.getReader();

    const pump = async () => {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
      res.end();
    };

    await pump();

  } catch (err) {
    console.error('Download error:', err.message);
    res.status(500).send('Error downloading audio');
  }
});

app.listen(PORT, () => {
  console.log(`Backend proxy server running on http://localhost:${PORT}`);
});
