require('dotenv').config();
const express = require('express');
const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();

app.use(express.json()); // ← This was missing or misplaced in some versions

// Instant test commands
bot.start((ctx) => ctx.reply('EthHack AI Bot is LIVE! Welcome!'));
bot.command('live', (ctx) => ctx.reply('No active threats right now – all clear!'));
bot.command('upgrade', (ctx) => ctx.reply('Pro upgrade coming soon – $19 lifetime'));

// Webhook
app.use('/webhook', bot.webhookCallback('/webhook'));

app.get('/', (req, res) => res.send('EthHack AI Bot running'));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Bot LIVE on port ${PORT}`));
