require('dotenv').config();
const express = require('express');
const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();

app.use(express.json()); // ← THIS WAS MISSING — fixes everything

// Test commands
bot.start((ctx) => ctx.reply('EthHack AI Bot is LIVE! 🚀'));
bot.command('live', (ctx) => ctx.reply('No active threats right now – all clear!'));

// Webhook — explicit path
app.post('/webhook', bot.webhookCallback('/webhook'));

// Health check
app.get('/', (req, res) => res.send('EthHack AI Bot running'));

// Port
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Bot LIVE on port ${PORT}`);
});

// Graceful shutdown — stops SIGTERM crash
process.on('SIGTERM', () => {
  console.log('SIGTERM received — shutting down gracefully');
  process.exit(0);
});
