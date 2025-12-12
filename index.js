const express = require('express');
const app = express();

app.use(express.json());

const TOKEN = process.env.BOT_TOKEN;

console.log('Bot started - Token:', TOKEN ? 'loaded' : 'MISSING!');

app.get('/', (req, res) => {
  res.send('EthHackAiBot is alive and secure');
});

app.post('/webhook', (req, res) => {
  console.log('Webhook received:', JSON.stringify(req.body));

  res.sendStatus(200); // Instant OK to Telegram

  const message = req.body.message;
  if (message && message.text === '/start') {
    const chatId = message.chat.id;
    console.log('/start from:', chatId);

    fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: 'EthHack AI Bot 🐺\n\nWelcome! I\'m online and ready.\nChoose an option below:',
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Crack Private Key', callback_data: 'crack' }],
            [{ text: 'Check Balance', callback_data: 'balance' }],
            [{ text: 'Generate Wallet', callback_data: 'generate' }],
            [{ text: 'Help / Tutorial', callback_data: 'help' }]
          ]
        }
      })
    })
    .then(r => r.json())
    .then(data => console.log('Message sent:', data))
    .catch(err => console.log('Send error:', err));
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log('Bot listening');
});
