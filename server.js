require('dotenv').config();
const express = require('express');
const { Telegraf } = require('telegraf');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const cron = require('node-cron');
const fetch = require('node-fetch');

const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();
app.use(express.json());

let paidUsers = new Set();

// Welcome
bot.start((ctx) => ctx.replyWithMarkdownV2(`
*Welcome to EthHack AI Bot*

Real-time security alerts for Ethereum + 50 EVM chains.

Free tier → alerts every 5 min
Pro tier → instant alerts (one-time $19 lifetime)

Commands:
/live — last threats
/upgrade — get instant alerts forever
`));

// Live threats command
bot.command('live', async (ctx) => {
  const threats = await getLatestThreats();
  let msg = "*Latest Threats*\n\n";
  threats.slice(0,8).forEach(t => {
    msg += `• ${t.name}\n${t.chain} • ${new Date(t.time).toLocaleTimeString()}\n\n`;
  });
  ctx.replyWithMarkdownV2(msg || 'No active threats right now');
});

// Upgrade command
bot.command('upgrade', (ctx) => {
  bot.telegram.sendInvoice(ctx.chat.id, {
    title: 'EthHack Pro — Lifetime Instant Alerts',
    description: 'One-time payment → forever instant notifications',
    payload: 'lifetime_pro',
    provider_token: process.env.STRIPE_SECRET_KEY,
    currency: 'USD',
    prices: [{ label: 'Lifetime Pro', amount: 1900 }],
  });
});

bot.on('successful_payment', (ctx) => {
  paidUsers.add(ctx.from.id);
  ctx.reply('Payment successful! You now get instant alerts forever');
});

// Background monitoring — every 30 seconds
cron.schedule('*/30 * * * * *', async () => {
  const threats = await getLatestThreats();
  if (threats.length === 0) return;

  const message = threats.map(t => 
    `*${t.name}*\n${t.chain} • ${new Date(t.time).toLocaleTimeString()}`
  ).join('\n\n');

  paidUsers.forEach(userId => {
    bot.telegram.sendMessage(userId, message, { parse_mode: 'Markdown' }).catch(() => {});
  });
});

async function getLatestThreats() {
  try {
    const res = await fetch('https://api.forta.network/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `{ alerts(input: { first: 10, blockSortDirection: desc }) { alerts { name createdAt source { chainId } } } }`
      })
    });
    const json = await res.json();
    return json.data.alerts.alerts.map(a => ({
      name: a.name.replace('Forta - ', ''),
      chain: ['ETH','BSC','POLY','ARBI','OP','BASE'][a.source.chainId % 6] || 'EVM',
      time: a.createdAt
    }));
  } catch (e) {
    return [];
  }
}

// Webhook
app.use(bot.webhookCallback('/webhook'));
app.get('/', (req, res) => res.send('EthHack AI Bot is alive'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Bot running on port ${PORT}`));

bot.launch();
