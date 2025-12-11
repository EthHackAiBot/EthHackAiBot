require('dotenv').config();
const express = require('express');
const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();

// CRITICAL: needed for Telegram to talk to us
app.use(express.json());

// Simple test commands
bot.start((ctx) => ctx.replyWithMarkdown(`
*Welcome to EthHack AI Bot* 🚀

Real-time EVM security alerts (rug-pulls, honeypots, phishing)

Free tier → delayed alerts
$19 lifetime → *instant alerts (<8s)*

Type /live to see latest threats
Type /upgrade for lifetime pro
`));
bot.command('live', (ctx) => ctx.reply('Scanning... no threats right now'));
bot.command('upgrade', (ctx) => ctx.reply('Pro upgrade coming soon – $19 lifetime'));

// Webhook route
app.use(bot.webhookCallback('/webhook'));

// Health check
app.get('/', (req, res) => res.send('EthHack AI Bot is running'));

// Graceful shutdown — THIS STOPS THE SIGTERM CRASH
process.on('SIGTERM', () => {
  console.log('SIGTERM received – shutting down gracefully');
  process.exit(0);
});

// Start server on the port Railway expects
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Bot LIVE and listening on port ${PORT}`);
  console.log(`Webhook URL: /webhook`);
});
