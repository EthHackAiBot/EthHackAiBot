require('dotenv').config();
const express = require('express');
const app = express();

app.use(express.json());

// Health endpoint (Railway needs this to keep container alive)
app.get('/', (req, res) => res.send('EthHackAiBot is alive'));

// Webhook endpoint – super simple, no Telegraf yet
app.post('/webhook', (req, res) => {
  console.log('Webhook hit! Raw body:', JSON.stringify(req.body, null, 2));
  
  // Always reply 200 instantly so Telegram doesn't retry
  res.status(200).send('OK');
  
  // Simple /start detection (we'll add real logic later)
  const message = req.body?.message?.text;
  const chatId = req.body?.message?.chat?.id;
  
  if (message === '/start' && chatId) {
    const reply = "You're all set! You'll now get instant alerts for the wallets you added on the website.";
    fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: reply })
    }).catch(err => console.log('Send error:', err));
  }
});

// CRITICAL RAILWAY FIX – use their port and bind to 0.0.0.0
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Bot LIVE on port ${PORT}`);
  console.log(`Webhook ready at /webhook`);
});
