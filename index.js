require('dotenv').config();
const express = require('express');
const { Telegraf } = require('telegraf');

const app = express();
app.use(express.json());

// Your bot token (make sure it's in Railway Variables as TELEGRAM_TOKEN)
const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

// Basic /start command — this will reply instantly
bot.start((ctx) => {
  ctx.reply("You're all set! You'll now get instant alerts for the wallets you added on the website.");
});

// Optional: reply to any message (for testing)
bot.on('text', (ctx) => {
  ctx.reply('Bot is alive! Use /start to activate alerts.');
});

// Webhook endpoint — Telegram will POST here
app.post('/webhook', (req, res) => {
  bot.handleUpdate(req.body, res);
  res.status(200).send('OK');
});

// Health check (optional but nice)
app.get('/', (req, res) => {
  res.send('EthHackAiBot is running!');
});

// ←←← THIS IS THE CRITICAL PART FOR RAILWAY ←←←
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Bot LIVE on port ${PORT}`);
  console.log(`Webhook ready at /webhook`);
});
