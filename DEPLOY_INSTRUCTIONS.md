# 🚀 Пошаговая инструкция по деплою

## ✅ Что уже сделано:

1. ✅ Создан Procfile для Railway
2. ✅ Добавлен railway.json с конфигурацией
3. ✅ Создан vercel.json для frontend
4. ✅ Обновлен .gitignore
5. ✅ Добавлен .env файл
6. ✅ Настроен PORT в server.js

## 📦 Шаг 1: Деплой Backend на Railway

### 1.1 Создай аккаунт на Railway

1. Открой https://railway.app
2. Нажми "Start a New Project"
3. Войди через GitHub

### 1.2 Задеплой backend

**Вариант A: Через GitHub (рекомендуется)**

1. Создай репозиторий на GitHub:
   ```bash
   cd C:\projects\pet-projects\music
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/music-app.git
   git push -u origin main
   ```

2. В Railway:
   - Нажми "New Project"
   - Выбери "Deploy from GitHub repo"
   - Выбери свой репозиторий
   - Railway автоматически обнаружит Node.js проект

3. Настрой переменные окружения в Railway:
   - Открой проект
   - Перейди в "Variables"
   - Добавь: `PORT=3001` (опционально, Railway сам установит)

4. Получи URL:
   - Railway автоматически создаст URL типа: `https://music-app-production.up.railway.app`
   - Скопируй этот URL - он понадобится для frontend

**Вариант B: Через Railway CLI**

1. Установи Railway CLI:
   ```bash
   npm install -g @railway/cli
   ```

2. Войди в аккаунт:
   ```bash
   railway login
   ```

3. Инициализируй проект:
   ```bash
   cd C:\projects\pet-projects\music
   railway init
   ```

4. Задеплой:
   ```bash
   railway up
   ```

5. Получи URL:
   ```bash
   railway domain
   ```

### 1.3 Проверь работу backend

Открой в браузере:
```
https://your-railway-url.railway.app/api/search?q=music
```

Должен вернуться JSON с треками.

---

## 🎨 Шаг 2: Обновить URL в Frontend

Замени `http://localhost:3001` на URL твоего Railway backend:

### 2.1 Обнови .env файл

```bash
# C:\projects\pet-projects\music\.env
VITE_API_URL=https://your-railway-url.railway.app
```

### 2.2 Обнови код для использования переменной окружения

Я сделаю это за тебя автоматически после того, как ты дашь мне Railway URL.

---

## 🌐 Шаг 3: Деплой Frontend на Vercel

### 3.1 Создай аккаунт на Vercel

1. Открой https://vercel.com
2. Нажми "Sign Up"
3. Войди через GitHub

### 3.2 Задеплой frontend

**Вариант A: Через Vercel Dashboard (проще)**

1. Нажми "Add New Project"
2. Импортируй свой GitHub репозиторий
3. Vercel автоматически обнаружит Vite проект
4. Настрой переменные окружения:
   - Добавь: `VITE_API_URL=https://your-railway-url.railway.app`
5. Нажми "Deploy"
6. Получи URL: `https://music-app.vercel.app`

**Вариант B: Через Vercel CLI**

1. Установи Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Войди в аккаунт:
   ```bash
   vercel login
   ```

3. Задеплой:
   ```bash
   cd C:\projects\pet-projects\music
   vercel --prod
   ```

4. Следуй инструкциям в терминале

### 3.3 Проверь работу frontend

Открой URL от Vercel в браузере и проверь что приложение работает.

---

## 🤖 Шаг 4: Создать Telegram Mini App

### 4.1 Создай бота

1. Открой Telegram
2. Найди @BotFather
3. Отправь команду: `/newbot`
4. Введи имя бота: `Music Player`
5. Введи username: `your_music_player_bot`
6. Сохрани токен (понадобится позже)

### 4.2 Создай Mini App

1. В чате с @BotFather отправь: `/newapp`
2. Выбери своего бота
3. Введи название: `Music Player`
4. Введи описание: `Listen to music with offline support`
5. Загрузи иконку (512x512 PNG)
6. Введи URL твоего Vercel приложения: `https://music-app.vercel.app`
7. Выбери "Web App" как тип
8. Готово!

### 4.3 Протестируй

1. Открой своего бота в Telegram
2. Нажми на кнопку с названием Mini App
3. Приложение откроется внутри Telegram
4. Включи музыку и заблокируй телефон
5. Музыка должна продолжать играть!

---

## 🔧 Важные настройки

### CORS на Backend

Убедись что в `server.js` настроен CORS для Vercel:

```javascript
app.use(cors({
  origin: [
    'https://music-app.vercel.app',
    'https://web.telegram.org',
    'http://localhost:5173',
    'http://localhost:5174'
  ],
  credentials: true
}));
```

### Telegram WebApp Settings

В коде уже настроено:
- ✅ `WebApp.ready()` - инициализация
- ✅ `WebApp.expand()` - полноэкранный режим
- ✅ `enableClosingConfirmation()` - предупреждение при закрытии
- ✅ Media Session API - управление с экрана блокировки
- ✅ Wake Lock API - предотвращение засыпания

---

## 📝 Чеклист

- [ ] Backend задеплоен на Railway
- [ ] Backend URL получен
- [ ] Frontend обновлен с новым API URL
- [ ] Frontend задеплоен на Vercel
- [ ] Vercel URL получен
- [ ] Telegram бот создан через @BotFather
- [ ] Mini App настроен с Vercel URL
- [ ] Протестировано в Telegram
- [ ] Музыка играет при блокировке экрана

---

## 🆘 Если что-то не работает

### Backend не отвечает
- Проверь логи в Railway Dashboard
- Убедись что yt-dlp.exe загружен (может потребоваться другой подход для Linux)

### Frontend не подключается к Backend
- Проверь CORS настройки
- Убедись что VITE_API_URL правильный
- Проверь в DevTools Console ошибки

### Музыка не играет в фоне
- Убедись что используешь HTTPS (Vercel предоставляет автоматически)
- Проверь что Media Session API поддерживается (работает на Android)
- На iOS может потребоваться взаимодействие пользователя

---

## 🎉 Готово!

После выполнения всех шагов у тебя будет:
- ✅ Рабочий музыкальный плеер в Telegram
- ✅ Фоновое воспроизведение при блокировке
- ✅ Скачивание треков для офлайн
- ✅ Управление через уведомления

**Дай мне знать когда получишь Railway URL, и я обновлю код автоматически!**
