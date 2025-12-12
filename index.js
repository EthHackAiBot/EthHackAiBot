const express = require('express');
const app = express();
app.use(express.json());

const TOKEN = 'YOUR_BOT_TOKEN_HERE'; // ← change this to your real bot token

app.get('/', (req, res) => res.send('Bot alive'));

app.post('/webhook', (req, res) => {
  res.sendStatus(200); // answer Telegram instantly

  if (req.body.message?.text === '/start') {
    const chatId = req.body.message.chat.id;

    fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        chat_id: chatId,
        text: 'EthHack AI Bot is working!\nChoose:',
        reply_markup: {
          inline_keyboard: [
            [{text: 'Crack Private Key', callback_data: 'crack'}],
            [{text: 'Check Balance', callback_data: 'balance'}],
            [{text: 'Generate Wallet', callback_data: 'generate'}]
          ]
        }
      })
    });
  }
});

const port = process.env.PORT || 3000;
app.listen(port);
