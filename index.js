const express = require('express');
const app = express();

app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/', (req, res) => {
  res.send('EthHackAiBot is running on Render');
});

// Telegram webhook
app.post('/webhook', async (req, res) => {
  console.log('Webhook received:', JSON.stringify(req.body, null, 2));

  // Immediately acknowledge so Telegram doesn't retry
  res.status(200).send('OK');

  const message = req.body?.message?.text;
  const chatId = req.body?.message?.chat?.id;

  if (message === '/start' && chatId) {
    const token = process.env.TELEGRAM_TOKEN;
    try {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: "You're all set! You'll now get instant alerts for the wallets you added on the website."
        })
      });
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  }
});

// Render requires PORT from env and binding to 0.0.0.0
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Bot LIVE on port ${PORT}`);
  console.log(`Webhook ready at /webhook`);
});
