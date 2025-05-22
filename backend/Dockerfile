# 1. Базовый образ
FROM node:20

# 2. Рабочая директория
WORKDIR /app

# 3. Копируем backend и frontend
COPY backend ./backend
COPY frontend ./frontend

# 4. Устанавливаем зависимости backend
WORKDIR /app/backend
RUN npm install

# 5. Собираем frontend
WORKDIR /app/frontend
RUN npm install && npm run build

# 6. Возвращаемся в backend и запускаем сервер
WORKDIR /app/backend
CMD ["node", "index.js"]
