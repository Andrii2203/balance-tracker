# Balance Tracker

Мобільний додаток для відстеження фінансів та спілкування.

## 🏠 Структура проекту

```
balance-tracker/
├── frontend/                  # React додаток
│   ├── src/
│   │   ├── components/        # UI компоненти
│   │   ├── pages/             # Сторінки
│   │   ├── services/          # API та бази даних
│   │   ├── hooks/             # Custom React hooks
│   │   ├── contexts/          # React Context
│   │   ├── locales/           # Переклади (i18n)
│   │   └── utils/             # Утиліти
│   ├── public/                # Статичні файли
│   └── sql/                   # SQL міграції
└── supabase/                  # Supabase конфігурація
```

## 🚀 Швидкий старт

### 1. Встановлення залежностей

```bash
cd frontend
npm install
```

### 2. Налаштування .env.local

Створи файл `.env.local`:

```env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Запуск

```bash
npm start
```

Додаток відкриється на http://localhost:3000

## 🛠 Технології

| Технологія | Призначення |
|------------|-------------|
| **React 18** | UI фреймворк |
| **TypeScript** | Типізація |
| **React Router** | Навігація |
| **Supabase** | Backend (DB + Auth + Realtime) |
| **Dexie.js** | IndexedDB (offline storage) |
| **React Query** | Server state management |
| **i18next** | Локалізація |
| **Chart.js** | Графіки |

## 📱 Сторінки

| Сторінка | Маршрут | Опис |
|----------|---------|------|
| Welcome | `/` | Вхід / реєстрація |
| Chat | `/chat` | Чат з повідомленнями |
| Home | `/home` | Головна сторінка |
| DataViewer | `/data` | Перегляд даних |
| News | `/news` | Новини |
| Quotes | `/quotes` | Котирування |
| Settings | `/settings` | Налаштування |

## 💾 Бази даних

### Supabase (Cloud)

Таблиці:
- `chat_messages` - повідомлення чату
- `statistics` - статистика
- `news` - новини
- `quotes` - котирування

### IndexedDB (Local)

База: `BalanceTrackerDB`

Stores:
- `messages` - локальні повідомлення
- `sync` - синхронізаційні метадані
- `settings` - налаштування

## 🔌 API

### Відправка повідомлення

```typescript
import { sendChatMessage } from './services/chatService';

const result = await sendChatMessage({
  userId: 'uuid',
  message: 'Hello!',
  createdAt: new Date().toISOString(),
  clientId: crypto.randomUUID()
});
```

### Отримання повідомлень

```typescript
import { getAllMessages } from './services/db';

const messages = await getAllMessages();
```

## 🌐 Локалізація

Підтримувані мови:
- 🇺🇦 **UA** (Українська)
- 🇬🇧 **EN** (Англійська)
- 🇵🇱 **PL** (Польська)

Зміна мови: кнопка в нижній навігації

## 📦 Збірка

```bash
# Development
npm start

# Production build
npm run build

# Тести
npm test
```

## 📄 Документація

| Документ | Опис |
|----------|------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Архітектура проекту |
| [DECISIONS.md](DECISIONS.md) | Архітектурні рішення (ADR) |
| [FUTURE_FEATURES.md](FUTURE_FEATURES.md) | Ідеї та питання |

## 🔧 Розробка

### Створення нової сторінки

1. Створи папку в `src/pages/MyPage/`
2. Додай компонент в `src/AppRoutes.tsx`
3. Додай навігацію в `src/data/navItems.ts`

### Створення нового компонента

1. Створи папку в `src/components/MyComponent/`
2. Експортуй компонент
3. Використовуй в сторінках

### SQL міграції

1. Створи файл в `sql/migrations/XXX_name.sql`
2. Запусти в Supabase SQL Editor
3. Документуй зміни

## 📝 Логування

Використовуємо `logger.ts` для debug:

```typescript
import { logger } from './utils/logger';

logger.info('[component] Action happened', { data });
logger.debug('[component] Detailed info', { debug });
logger.warn('[component] Warning', { warning });
logger.error('[component] Error', { error });
```

## 📱 PWA

Додаток підтримує PWA:
- Service Worker для офлайн режиму
- Manifest для встановлення на пристрій
- Адаптивний дизайн для мобільних

## 📄 Ліцензія

MIT
