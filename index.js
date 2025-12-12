const express = require('express');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const app = express();

app.use(express.json());

// Serve your perfect landing page
app.use(express.static('public'));

// Telegram webhook – now fully handles /start with welcome + buttons
app.post('/webhook', async (req, res) => {
  res.sendStatus(200); // Instant OK

  const message = req.body.message;
  if (message && message.text === '/start') {
    const chatId = message.chat.id;
    const TOKEN = process.env.BOT_TOKEN;

    await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: '🚀 EthHack AI Bot – Lifetime Access Activated!\n\nProtect your wallets with real-time alerts.\nAdd addresses on the website:',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🌐 Open Website', url: 'https://bot.ethhack.com' }],
            [{ text: '❓ Help', callback_data: 'help' }]
          ]
        }
      })
    });
  }
});

// Optional: Make /webhook show "OK" when visited (Telegram checks sometimes)
app.get('/webhook', (req, res) => res.send('OK'));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('Site + Telegram bot fully running'));
