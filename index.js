// index.js - Fixed full slogan in welcome + all features

const express = require('express');
const stripe = require('stripe');
const axios = require('axios');

const app = express();

app.use(express.json());
app.use(express.static('public'));

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const stripeClient = stripe(STRIPE_SECRET_KEY);

const BOT_TOKEN = process.env.BOT_TOKEN;

const SUCCESS_URL = process.env.SUCCESS_URL || 'https://bot.ethhack.com?status=success';
const CANCEL_URL = process.env.CANCEL_URL || 'https://bot.ethhack.com?status=cancel';
const PRICE_ID = process.env.PRICE_ID || 'price_1Sdv0cB4q90VhcD0njTotzmO';

// GoPlusLabs token security check
async function checkTokenRisk(chainId, address) {
  try {
    const url = `https://api.gopluslabs.io/api/v1/token_security/${chainId}?contract_addresses=${address}`;
    const response = await axios.get(url, { timeout: 10000 });
    return response.data.result ? response.data.result[address.toLowerCase()] : null;
  } catch (error) {
    console.error('GoPlus API error:', error.message);
    return null;
  }
}

// Serve the main site
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Create Checkout Session
app.post('/create-checkout-session', async (req, res) => {
  const { wallets, user_id } = req.body;

  console.log('Payment request - wallets:', wallets, 'user_id:', user_id);

  if (!wallets || !Array.isArray(wallets) || wallets.length === 0) {
    return res.status(400).json({ error: 'No wallets provided' });
  }

  if (!user_id) {
    return res.status(400).json({ error: 'Telegram user_id is required' });
  }

  try {
    const idempotencyKey = `checkout_${user_id}_${Date.now()}`;

    const session = await stripeClient.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: PRICE_ID,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: SUCCESS_URL,
      cancel_url: CANCEL_URL,
      metadata: {
        wallets: wallets.join(','),
        telegram_user_id: String(user_id),
      },
      expires_at: Math.floor(Date.now() / 1000) + 1800,
    }, {
      idempotencyKey: idempotencyKey
    });

    console.log('Session created:', session.id);
    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Telegram webhook
app.post('/webhook', async (req, res) => {
  res.sendStatus(200);

  const update = req.body;

  if (update.message) {
    const message = update.message;
    const chatId = message.chat.id;
    const text = message.text || '';
    const send = async (msg, options = {}) => {
      try {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, parse_mode: 'Markdown', ...options, text: msg })
        });
      } catch (err) {
        console.error('Send message failed:', err);
      }
    };

    // /checktoken command
    if (text.toLowerCase().startsWith('/checktoken')) {
      const parts = text.trim().split(' ');
      if (parts.length !== 3) {
        await send('Usage: /checktoken <chain> <address>\nExample: /checktoken bsc 0x55d58a4d8271ae86f3b4b79ce959ed14737c8c83');
        return;
      }

      const chainInput = parts[1].toLowerCase();
      const address = parts[2].toLowerCase();

      const chainMap = { eth: 1, ethereum: 1, bsc: 56, polygon: 137, base: 8453, arbitrum: 42161 };
      const chainId = chainMap[chainInput];

      if (!chainId) {
        await send('Supported chains: eth, bsc, polygon, base, arbitrum');
        return;
      }

      await send('🔍 Scanning token for threats...');

      const info = await checkTokenRisk(chainId, address);

      if (!info) {
        await send('❌ Token not found or API error.');
        return;
      }

      const shortAddr = address.slice(0, 6) + '...' + address.slice(-4);
      let msg = `*${info.token_name || 'Unknown Token'} (${shortAddr})*\n\n`;

      let hasRisk = false;

      if (info.is_honeypot === '1') { msg += '🚨 *HONEYPOT DETECTED — DO NOT BUY*\n'; hasRisk = true; }
      if (info.is_proxy === '1') { msg += '⚠️ Proxy/Upgradable Contract (high rug risk)\n'; hasRisk = true; }
      if (info.is_open_source === '0') { msg += '⚠️ Contract Not Verified/Open Source\n'; hasRisk = true; }
      if (info.owner_renounced === '0') { msg += '⚠️ Ownership Not Renounced\n'; hasRisk = true; }
      if (info.lp_lock === '0' || (info.lp_locked_percentage && parseFloat(info.lp_locked_percentage) < 50)) { msg += '⚠️ Low or No Liquidity Lock\n'; hasRisk = true; }
      if (info.holder_count && info.holder_count < 100) { msg += '⚠️ Very Low Holder Count\n'; hasRisk = true; }
      if (info.buy_tax && parseFloat(info.buy_tax) > 20) { msg += `⚠️ High Buy Tax: ${info.buy_tax}%\n`; hasRisk = true; }
      if (info.sell_tax && parseFloat(info.sell_tax) > 20) { msg += `⚠️ High Sell Tax: ${info.sell_tax}%\n`; hasRisk = true; }

      if (!hasRisk) {
        msg += '✅ No major risks detected.';
      } else {
        msg += '\n*Upgrade to Pro for instant monitoring across all your wallets!*';
      }

      await send(msg);
      return;
    }

    // Full slogan welcome on EVERY message
    await send(
      '🔴 *Don\'t get Rekt - Get EthHack!*\n\n'
      + 'Real-time protection against rug pulls, honeypots, phishing contracts, malicious approvals, flash-loan attacks, and more across 50+ EVM chains.\n\n'
      + '*Scan any token instantly:*\n/checktoken <chain> <address>\n\n'
      + 'Example:\n/checktoken bsc 0x55d58a4d8271ae86f3b4b79ce959ed14737c8c83\n\n'
      + 'Lifetime Pro: $19 one-time — instant alerts for all your wallets.',
      {
        reply_markup: {
          inline_keyboard: [[
            { text: 'Upgrade to Lifetime Pro 💳 ($19 one-time)', web_app: { url: 'https://bot.ethhack.com' } }
          ]]
        }
      }
    );
  }
});

// Health check
app.get('/webhook', (req, res) => res.send('OK'));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
