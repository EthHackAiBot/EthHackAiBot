const express = require('express');
const path = require('path');
const app = express();

// Parse JSON and form bodies (needed for Telegram webhook)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve the bot page (your HTML/CSS/JS)
app.use(express.static(path.join(__dirname, 'public')));

// Root → show the bot page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check (Railway loves it)
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// TELEGRAM WEBHOOK – this is the missing piece
app.post('/webhook', (req, res) => {
  console.log('Telegram update received:', req.body);

  const message = req.body.message || req.body.channel_post;
  if (message && message.text) {
    const chatId = message.chat.id;
    const text = message.text.trim();

    if (text === '/start') {
      const welcome = `
Welcome to EthHack Alerts!

Lifetime access activated
You are now protected against rugs, honeypots & phishing on 50+ EVM chains.

Monitoring will start as soon as you add wallet(s) on https://bot.ethhack.com

Questions? Just reply /help
      `.trim();

      fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: welcome,
          parse_mode: 'Markdown'
        })
      }).catch(err => console.error('Send message error:', err));
    }
  }

  // Always answer 200 so Telegram is happy
  res.sendStatus(200);
});

// 404 fallback
app.use((req, res) => {
  res.status(404).send('<h1>404 – Not Found</h1>');
});

// Railway-compatible start
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`EthHack AI Bot LIVE on port ${PORT}`);
  console.log(`→ https://bot.ethhack.com`);
  console.log(`Webhook ready at https://bot.ethhack.com/webhook`);
});
