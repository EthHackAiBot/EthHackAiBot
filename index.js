const express = require('express');
const app = express();

app.use(express.json());

// Serve your beautiful site
app.use(express.static('public'));

// Telegram webhook – replies to /start with welcome + button to site
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
        text: 'EthHack AI Bot 🐺\n\nLifetime access ready!\nAdd your wallets on the site for real-time protection:',
        reply_markup: {
          inline_keyboard: [[{ text: 'Open Site', url: 'https://bot.ethhack.com' }]]
        }
      })
    });
  }
});

// Optional: Make /webhook show "OK" for checks
app.get('/webhook', (req, res) => res.send('OK'));

app.listen(process.env.PORT || 3000);
