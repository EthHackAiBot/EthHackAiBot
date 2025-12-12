require('dotenv').config();
const express = require('express');
const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();

// THIS LINE IS REQUIRED — fixes Telegram webhook
app.use(express.json());

// Simple test commands
bot.start((ctx) => ctx.reply('EthHack AI Bot is LIVE! 🚀'));
bot.command('live', (ctx) => ctx.reply('No active threats right now – all clear!'));
bot.command('upgrade', (ctx) => ctx.reply('Pro upgrade coming soon – $19 lifetime'));

// EXPLICIT webhook route — fixes the 404 error
app.post('/webhook', bot.webhookCallback('/webhook'));

// Health check
app.get('/', (req, res) => res.send('EthHack AI Bot running'));

// Graceful shutdown (stops SIGTERM crashes)
process.on('SIGTERM', () => {
  console.log('SIGTERM received — shutting down gracefully');
  process.exit(0);
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Bot LIVE on port ${PORT}`);
  console.log('Webhook ready at /webhook');
});
