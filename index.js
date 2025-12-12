const express = require('express');
const app = express();

app.use(express.json());

// Token from Render env (safe)
const TOKEN = process.env.BOT_TOKEN;

console.log('Bot started - Token loaded:', TOKEN ? 'YES' : 'NO - FIX ENV VAR NOW');

app.get('/', (req, res) => {
  res.send('EthHackAiBot is alive and secure');
});

// THIS IS THE MISSING PART - handles Telegram POSTs
app.post('/webhook', (req, res) => {
  console.log('WEBHOOK RECEIVED:', JSON.stringify(req.body));  // Debug log

  res.sendStatus(200);  // Instant OK to Telegram

  const message = req.body.message;
  if (message?.text === '/start') {
    console.log('Got /start from chat:', message.chat.id);  // Debug

    fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: message.chat.id,
        text: 'EthHack AI Bot 🐺\n\nWelcome! I\'m online and ready.\nChoose an option:',
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
    .then(data => console.log('Reply sent:', data))
    .catch(err => console.log('Send error:', err));
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('Bot listening on port', port));
