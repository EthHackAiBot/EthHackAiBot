const express = require('express');
const path = require('path');
const app = express();

// Parse JSON + form bodies (needed for Telegram)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve your beautiful bot page
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check for Railway
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// TELEGRAM WEBHOOK – FINAL BULLETPROOF VERSION
app.post('/webhook', (req, res) => {
  console.log('Telegram update received:', req.body);

  const message = req.body.message || req.body.channel_post;
  if (!message?.text) {
    return res.sendStatus(200);
  }

  const chatId = message.chat.id;
  let text = message.text.trim();

  const welcome = `
Welcome to EthHack Alerts! 

Lifetime access activated
You are now protected against rugs, honeypots & phishing on 50+ EVM chains.

Add your wallet(s) here → https://bot.ethhack.com

Need help? Just type /help
  `.trim();

  // Reply on /start (with or without payload) OR any message
  if (text.startsWith('/start') || text.length > 0) {
    fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: welcome,
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      })
    }).catch(err => console.error('Failed to send reply:', err));
  }

  res.sendStatus(200);
});

// 404 fallback
app.use((req, res) => {
  res.status(404).send('<h1>404 – Not Found</h1>');
});

// Start server – Railway compatible
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`EthHack AI Bot is LIVE on port ${PORT}`);
  console.log(`Visit: https://bot.ethhack.com`);
  console.log(`Webhook: https://bot.ethhack.com/webhook`);
});
