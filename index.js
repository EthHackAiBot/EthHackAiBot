const express = require('express');
const app = express();

app.use(express.json());

const TOKEN = process.env.BOT_TOKEN || 'NO_TOKEN_SET';

console.log('Bot started - Token loaded:', TOKEN !== 'NO_TOKEN_SET' ? 'YES' : 'NO - CHECK RENDER ENV');

app.get('/', (req, res) => {
  res.send('EthHackAiBot is alive and secure');
});

app.all('/webhook', (req, res) => {
  console.log('WEBHOOK HIT:', req.method, JSON.stringify(req.body));

  res.sendStatus(200);  // Always reply 200 instantly to Telegram

  if (req.body.message && req.body.message.text === '/start') {
    const chatId = req.body.message.chat.id;
    console.log('Processing /start from chat ID:', chatId);

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
    .then(response => response.json())
    .then(data => console.log('Telegram API response:', data))
    .catch(err => console.error('Error sending message:', err));
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Bot listening on port ${port}`);
});
