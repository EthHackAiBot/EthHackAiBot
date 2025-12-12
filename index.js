const express = require('express');
const app = express();

app.use(express.json());

// Token is taken safely from Render environment (never in code)
const TOKEN = process.env.BOT_TOKEN;

app.get('/', (req, res) => {
  res.send('EthHackAiBot is alive and secure');
});

app.post('/webhook', (req, res) => {
  // Answer Telegram instantly so it doesn’t time out
  res.sendStatus(200);

  const message = req.body.message;
  if (!message) return;

  if (message.text === '/start') {
    fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: message.chat.id,
        text: 'EthHack AI Bot\n\nI’m online and ready.\nChoose an option:',
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Crack Private Key', callback_data: 'crack' }],
            [{ text: 'Check Balance', callback_data: 'balance' }],
            [{ text: 'Generate Wallet', callback_data: 'generate' }],
            [{ text: 'Help', callback_data: 'help' }]
          ]
        }
      })
    });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('Bot running on port', port));
