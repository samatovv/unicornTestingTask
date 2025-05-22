import express from 'express';
import cors from 'cors';
import { create } from 'venom-bot';
import { enqueueMessage } from './utils/messageQueue.js';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

let clientInstance = null;

create({
  session: 'whatsapp-session',
  multidevice: true
})
  .then((client) => {
    clientInstance = client;
    console.log('WhatsApp клиент готов');

    setInterval(() => {
      enqueueMessage.processQueue(clientInstance);
    }, 2000);
  })
  .catch((error) => console.error('Ошибка venom-bot:', error));

  app.post('/send-message', (req, res) => {
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
  

app.listen(3001, () => console.log('Сервер на http://localhost:3001'));
