const express = require('express');
const app = express();

app.use(express.json());

// Serve your landing page
app.use(express.static('public'));

// Telegram webhook
app.post('/webhook', async (req, res) => {
  console.log('Update received:', JSON.stringify(req.body)); // Log for proof

  res.sendStatus(200);

  if (req.body.message?.text === '/start') {
    const chatId = req.body.message.chat.id;
    const TOKEN = process.env.BOT_TOKEN;

    console.log(' /start received from', chatId); // Log

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
    }).then(r => r.json()).then(data => console.log('Reply:', data)).catch(err => console.log('Error:', err));
  }
});

app.get('/webhook', (req, res) => res.send('OK'));

app.listen(process.env.PORT || 3000, () => console.log('Ready'));
