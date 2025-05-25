import express from 'express';
import cors from 'cors';
import { create } from 'venom-bot';
import { enqueueMessage } from './utils/messageQueue.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { rm } from 'fs/promises';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:5173");
  res.header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, '../frontend/dist')));

app.get('*', (req, res, next) => {
  if (
    req.path.startsWith('/api') ||
    req.path.startsWith('/qr') ||
    req.path.startsWith('/send-message') ||
    req.path.startsWith('/session') ||
    req.path.startsWith('/status')
  ) {
    return next();
  }
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// Объекты для хранения клиентов, статусов и QR кодов по companyId
const clients = {};
const readyStatus = {};
const qrCodes = {};
const maxRetries = 3;
const retryDelay = 5000;
const retryCounts = {};
const clientStatus = {};

/**
 * Запуск клиента для компании
 * @param {string} companyId
 */
async function startClient(companyId) {
  if (clients[companyId]) {
    console.log(`Клиент для компании ${companyId} уже запущен`);
    return;
  }

  retryCounts[companyId] = retryCounts[companyId] || 0;
  clientStatus[companyId] = 'starting';

  try {
    const client = await create({
      session: companyId,
      multidevice: true,
      headless: 'new',
      logQR: false,
      catchQR: (base64Qrimg, asciiQR) => {
        const cleanedBase64 = base64Qrimg.replace(/^data:image\/png;base64,/, '');
        qrCodes[companyId] = `data:image/png;base64,${cleanedBase64}`;
        console.log(`[${companyId}] QR Code:`);
        console.log(asciiQR);

        clientStatus[companyId] = 'ready';

        setTimeout(() => {
          if (qrCodes[companyId]) {
            delete qrCodes[companyId];
            clientStatus[companyId] = null;
            console.log(`⌛ QR-код для ${companyId} удалён`);
          }
        }, 5 * 60 * 1000);
      },
    });

    clients[companyId] = client;
    readyStatus[companyId] = true;
    clientStatus[companyId] = 'ready';
    retryCounts[companyId] = 0;
    console.log(`✅ WhatsApp клиент для компании ${companyId} готов`);

    setInterval(() => {
      if (readyStatus[companyId]) {
        enqueueMessage.processQueue(client);
      }
    }, 2000);

  } catch (error) {
    console.error(`❌ Ошибка venom-bot для компании ${companyId}:`, error);
    readyStatus[companyId] = false;
    clientStatus[companyId] = 'error';

    if (retryCounts[companyId] < maxRetries) {
      retryCounts[companyId]++;
      console.log(`🔄 Попытка перезапуска клиента для ${companyId} (${retryCounts[companyId]}/${maxRetries}) через ${retryDelay}мс`);
      await rm(`./tokens/${companyId}`, { recursive: true, force: true }).catch(() => {});
      setTimeout(() => startClient(companyId), retryDelay);
    } else {
      console.log(`❌ Превышено максимальное число попыток для ${companyId}. Клиент не будет перезапущен автоматически.`);
    }
  }
}

app.get('/api/:companyId/qr', async (req, res) => {
  const companyId = req.params.companyId;
  const status = clientStatus[companyId];

  if (!status) {
    console.log(`📲 Запуск клиента для ${companyId} по запросу QR-кода...`);
    clientStatus[companyId] = 'starting';
    startClient(companyId).catch((err) => {
      console.error('Ошибка при запуске клиента:', err);
      clientStatus[companyId] = 'error';
    });

    return res.status(202).json({ message: 'Клиент запускается, попробуйте снова через несколько секунд' });
  }

  if (status === 'starting') {
    return res.status(202).json({ message: 'Клиент все еще запускается, подождите немного' });
  }

  if (status === 'error') {
    return res.status(500).json({ error: 'Ошибка запуска клиента' });
  }

  const qr = qrCodes[companyId];
  if (!qr) {
    return res.status(404).json({ error: 'QR-код еще не готов' });
  }

  return res.json({ qr });
});



app.get('/api/:companyId/status', (req, res) => {
  const companyId = req.params.companyId;

  if (!clients[companyId]) {
    return res.json({ ready: false, message: 'Клиент ещё не запускался' });
  }

  res.json({ ready: readyStatus[companyId] === true });
});


// API: Сброс сессии и перезапуск клиента компании
app.delete('/api/:companyId/session', async (req, res) => {
  const companyId = req.params.companyId;

  try {
    await rm(`./tokens/${companyId}`, { recursive: true, force: true });
    console.log(`🗑️ Сессия для компании ${companyId} удалена. Перезапускаем клиента...`);

    if (clients[companyId]) {
      // Если есть метод закрытия клиента, его стоит вызвать
      if (clients[companyId].close) {
        await clients[companyId].close();
      }
      delete clients[companyId];
    }

    qrCodes[companyId] = '';
    readyStatus[companyId] = false;

    // await startClient(companyId);

    res.json({ status: 'ok', message: `Сессия для компании ${companyId} сброшена и клиент перезапускается` });
  } catch (err) {
    console.error(`Ошибка при удалении сессии для компании ${companyId}:`, err);
    res.status(500).json({ error: 'Не удалось удалить сессию' });
  }
});

// API: Отправка сообщений от имени компании
app.post('/api/:companyId/send-message', (req, res) => {
  const companyId = req.params.companyId;

  if (!readyStatus[companyId]) {
    return res.status(503).json({ error: 'WhatsApp клиент ещё не готов. Попробуйте позже.' });
  }

  const client = clients[companyId];
  if (!client) {
    return res.status(500).json({ error: 'Клиент не найден' });
  }

  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Неверный формат данных' });
  }

  for (const msg of messages) {
    if (
      typeof msg.phone !== 'string' ||
      !msg.phone.match(/^\d+$/) ||
      typeof msg.message !== 'string' ||
      msg.message.trim().length === 0
    ) {
      return res.status(400).json({ error: 'Неверный формат сообщения' });
    }
  }

  enqueueMessage.addMessages(messages, client);

  res.json({ status: 'в очереди', count: messages.length });
});


app.listen(8080, 'localhost', () => {
  console.log('🚀 Сервер работает на http://localhost:8080');
});
