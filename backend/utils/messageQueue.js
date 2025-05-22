const queue = [];

export const enqueueMessage = {
  addMessages(messages) {
    queue.push(...messages);
  },

  async processQueue(client) {
    if (queue.length === 0) return;

    const { phone, message } = queue.shift();
    try {
      await client.sendText(`${phone}@c.us`, message);
      console.log(`✅ Отправлено: ${phone}`);
    } catch (err) {
      console.error(`❌ Ошибка отправки ${phone}:`, err.message);
    }
  }
};
