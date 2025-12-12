const express = require('express');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const app = express();

app.use(express.json());

// Serve your beautiful website
app.use(express.static('public'));

// Telegram webhook – this makes the bot reply!
app.post('/webhook', (req, res) => {
  res.sendStatus(200); // Instant OK to Telegram

  const message = req.body.message;
  if (message && message.text === '/start') {
    const chatId = message.chat.id;
    const TOKEN = process.env.BOT_TOKEN;

    fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: 'Welcome to EthHack AI Bot 🐺\n\nLifetime protection activated!\nEnter wallet addresses on the website:\nhttps://bot.ethhack.com',
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Open Website', url: 'https://bot.ethhack.com' }],
            [{ text: 'Help', callback_data: 'help' }]
          ]
        }
      })
    });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('Site + Bot running'));
