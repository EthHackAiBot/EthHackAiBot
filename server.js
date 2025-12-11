require('dotenv').config();
const express = require('express');
const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();

app.use(express.json());   // ← keep only this one line (no comment)

bot.start((ctx) => ctx.replyWithMarkdown(`
*Welcome to EthHack AI Bot* 🚀

Real-time EVM security alerts (rug-pulls, honeypots, phishing)

Free tier → delayed alerts
$19 lifetime → *instant alerts (<8s)*

Type /live to see latest threats
Type /upgrade for lifetime pro
`));

bot.command('live', (ctx) => ctx.reply('No active threats right now – all clear!'));
bot.command('upgrade', (ctx) => ctx.reply('Pro upgrade coming soon – $19 lifetime'));

app.use('/webhook', bot.webhookCallback('/webhook'));

app.get('/', (req, res) => res.send('EthHack AI Bot running'));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Bot LIVE on port ${PORT}`));
