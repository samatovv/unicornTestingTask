const queue = [];

export const enqueueMessage = {
  addMessages(messages, client) {
    for (const msg of messages) {
      queue.push({ ...msg, client });
    }
  },

  async processQueue() {
    if (queue.length === 0) return;

    const { phone, message, client } = queue.shift();

    try {
      await client.sendText(`${phone}@c.us`, message);
      console.log(`✅ Отправлено: ${phone}`);
    } catch (err) {
      console.error(`❌ Ошибка отправки ${phone}:`, err.message);
    }
  },
};
