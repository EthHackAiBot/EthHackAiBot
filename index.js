// index.js - Final fixed Render PostgreSQL connection + Pro storage + monitoring

const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const axios = require('axios');
const { Pool } = require('pg');

const app = express();
app.use(express.json());
app.use(express.static('public'));

const BOT_TOKEN = process.env.BOT_TOKEN;
const PRICE_ID = process.env.PRICE_ID;

// PostgreSQL connection - Always use SSL false reject for Render
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Create table if not exists
(async () => {
  try {
    const client = await pool.connect();
    console.log('PostgreSQL connected successfully');
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        telegram_id BIGINT UNIQUE NOT NULL,
        wallets JSONB DEFAULT '[]',
        is_pro BOOLEAN DEFAULT FALSE,
        payment_date TIMESTAMP,
        stripe_session_id TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Users table ready');
    client.release();
  } catch (err) {
    console.error('PostgreSQL error:', err);
  }
})();

// GoPlus token risk check
async function checkTokenRisk(chainId, address) {
  try {
    const url = `https://api.gopluslabs.io/api/v1/token_security/${chainId}?contract_addresses=${address}`;
    const response = await axios.get(url, { timeout: 10000 });
    return response.data.result ? response.data.result[address.toLowerCase()] : null;
  } catch (error) {
    console.error('GoPlus error:', error.message);
    return null;
  }
}

// Approval risk check for wallet (Pro monitoring)
async function checkApprovalRisk(chainId, wallet) {
  try {
    const url = `https://api.gopluslabs.io/api/v1/approval_security/${chainId}?addresses=${wallet}`;
    const response = await axios.get(url);
    const result = response.data.result[wallet.toLowerCase()];
    return result && result.risky_approval_count > 0 ? result : null;
  } catch (error) {
    console.error('Approval check error:', error.message);
    return null;
  }
}

// Serve site
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Create Checkout Session
app.post('/create-checkout-session', async (req, res) => {
  const { wallets, user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: 'Telegram user_id required' });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: PRICE_ID, quantity: 1 }],
      mode: 'payment',
      success_url: `https://bot.ethhack.com?status=success&user=${user_id}`,
      cancel_url: `https://bot.ethhack.com?status=cancel&user=${user_id}`,
      metadata: { telegram_user_id: String(user_id) },
      client_reference_id: String(user_id),
    });

    res.json({ url: session.url });
  } catch (err) {
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
        console.error('Send failed:', err);
      }
    };

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
      if (info.buy_tax && parseFloat(info.buy_tax) > 20) { msg += `⚠️ High Buy Tax: ${info.buy_tax}%\n'; hasRisk = true; }
      if (info.sell_tax && parseFloat(info.sell_tax) > 20) { msg += `⚠️ High Sell Tax: ${info.sell_tax}%\n'; hasRisk = true; }

      if (!hasRisk) {
        msg += '✅ No major risks detected.';
      } else {
        msg += '\n*Upgrade to Pro for instant monitoring across all your wallets!*';
      }

      await send(msg);
      return;
    }

    // Welcome on every message
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

// Background monitoring for Pro users (every 5 minutes)
setInterval(async () => {
  try {
    const { rows: proUsers } = await pool.query('SELECT telegram_id, wallets FROM users WHERE is_pro = TRUE');
    console.log(`Monitoring ${proUsers.length} Pro users`);
    for (const user of proUsers) {
      const wallets = user.wallets || [];
      for (const wallet of wallets) {
        const risk = await checkApprovalRisk(1, wallet); // Example ETH, add multi-chain
        if (risk) {
          const msg = `🚨 RISK DETECTED on wallet ${wallet.slice(0,6)}...${wallet.slice(-4)}\n`
            + `Malicious approvals found — revoke immediately!`;
          await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: user.telegram_id, text: msg })
          });
          console.log(`Alert sent to ${user.telegram_id}`);
        }
      }
    }
  } catch (err) {
    console.error('Monitoring error:', err);
  }
}, 300000); // 5 minutes

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
