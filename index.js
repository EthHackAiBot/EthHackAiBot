const express = require('express');
const app = express();

app.use(express.json());

// Serve your landing page
app.use(express.static('public'));

// Telegram webhook
app.post('/webhook', async (req, res) => {
  res.sendStatus(200);

  if (req.body.message?.text === '/start') {
    const chatId = req.body.message.chat.id;
    const TOKEN = process.env.BOT_TOKEN;

    const message = {
      chat_id: chatId,
      text: 'EthHack AI Bot 🐺\n\nLifetime access ready!\nAdd wallets on the site:',
      reply_markup: {
        inline_keyboard: [[{ text: 'Open Site', url: 'https://bot.ethhack.com' }]]
      }
    };

    await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    });
  }
});

// For Telegram health checks
app.get('/webhook', (req, res) => res.send('OK'));

app.listen(process.env.PORT || 3000);
