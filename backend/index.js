import express from 'express';
import cors from 'cors';
import { create } from 'venom-bot';
import { enqueueMessage } from './utils/messageQueue.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';


dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
const __dirname = path.dirname(fileURLToPath(import.meta.url));

let clientInstance = null;
let isClientReady = false;
let qrCodeImage = '';

create({
  session: 'whatsapp-session',
  multidevice: true,
  headless: 'new',
  logQR: false,
  browserPath: '/snap/bin/chromium',
  catchQR: (base64Qrimg, asciiQR, attempts, urlCode) => {
    qrCodeImage = base64Qrimg;
    console.log('\n========= QR Code (ASCII) =========');
    console.log(asciiQR);
    console.log('===================================\n');
  }
})
  .then((client) => {
    clientInstance = client;
    isClientReady = true;
    console.log('WhatsApp клиент готов');

    setInterval(() => {
    if (isClientReady) {
      enqueueMessage.processQueue(clientInstance);
    }
  }, 2000);
})
  .catch((error) => console.error('Ошибка venom-bot:', error));

// 📦 API маршрут для фронта — можно использовать на клиенте
app.get('/qr', (req, res) => {
  if (!qrCodeImage) {
    return res.status(404).json({ error: 'QR-код еще не готов' });
  }
  res.json({ qr: qrCodeImage });
});


  app.post('/send-message', (req, res) => {
    if (!isClientReady) {
   	 return res.status(503).json({ error: 'WhatsApp клиент ещё не готов. Попробуйте позже.' });
    }
    console.log('Получено тело запроса:', req.body);
    const { messages } = req.body;
  
    if (!clientInstance) {
      return res.status(500).json({ error: 'Клиент не готов' });
    }
  
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
        return res.status(400).json({ error: 'Неверный формат данных' });
      }
    }
  
    enqueueMessage.addMessages(messages);
    res.json({ status: 'в очереди', count: messages.length });
  });
app.listen(3000, '0.0.0.0', () => console.log('Сервер на http://0.0.0.0:3000'));