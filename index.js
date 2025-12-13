const express = require('express');
const app = express();

app.use(express.json());

// Serve your landing page
app.use(express.static('public'));

// Telegram webhook – sends welcome on /start
app.post('/webhook', async (req, res) => {
  res.sendStatus(200); // Instant OK

  if (req.body.message?.text === '/start') {
    const chatId = req.body.message.chat.id;
    const TOKEN = process.env.BOT_TOKEN;

    await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: 'EthHack AI Bot 🐺\n\nLifetime protection activated!\nAdd your wallets on the site for real-time alerts:',
        reply_markup: {
          inline_keyboard: [[{ text: 'Open Site', url: 'https://bot.ethhack.com' }]]
        }
      })
    });
  }
});

app.get('/webhook', (req, res) => res.send('OK'));

app.listen(process.env.PORT || 3000);
