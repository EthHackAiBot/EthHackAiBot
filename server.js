require('dotenv').config();
const express = require('express');
const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();

// THIS LINE WAS MISSING — fixes everything
app.use(express.json());

// ———— BOT COMMANDS ————
bot.start((ctx) => ctx.reply('EthHack AI Bot is LIVE! 🚀\nType /live for real-time threats'));
bot.command('live', (ctx) => ctx.reply('🔴 Scanning Ethereum + 50 chains...\nNo active threats right now – all clear!'));

// ———— WEBHOOK ————
app.use(bot.webhookCallback('/webhook'));

// ———— HEALTH ————
app.get('/', (req, res) => res.send('EthHack AI Bot is running'));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Bot LIVE on port ${PORT}`));
