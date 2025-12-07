require('dotenv').config();
const express = require('express');
const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();

// ———— ALL BOT COMMANDS ————
bot.start((ctx) => ctx.reply('EthHack AI Bot is alive! 🚀\nType /live for latest threats'));
bot.command('live', (ctx) => ctx.reply('Live threats coming soon...'));

// ———— WEBHOOK SETUP ————
app.use(bot.webhookCallback('/webhook'));

// ———— HEALTH CHECK ————
app.get('/', (req, res) => res.send('EthHack AI Bot is running'));

// ———— START SERVER ————
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Bot listening on port ${PORT}`);
  console.log(`Webhook path: /webhook`);
});
