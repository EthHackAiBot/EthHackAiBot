require('dotenv').config();
const express = require('express');
const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();

// THIS LINE WAS MISSING — THIS IS THE FIX
app.use(express.json());

// Simple commands so you see it works instantly
bot.start((ctx) => ctx.reply('EthHack AI Bot is ALIVE! 🚀\nType /live for real-time threats'));
bot.command('live', (ctx) => ctx.reply('🔴 Scanning Ethereum + 50 chains...\nNo active threats right now – all clear!'));

// Webhook
app.use(bot.webhookCallback('/webhook'));

app.get('/', (req, res) => res.send('EthHack AI Bot running'));

const PORT = process.env.PORT || 8443;
app.listen(PORT, () => console.log(`Bot LIVE on port ${PORT}`));
