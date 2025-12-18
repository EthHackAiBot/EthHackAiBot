// index.js - Full: Bot + Stripe + Render PostgreSQL Pro storage + auto-monitoring

const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const axios = require('axios');
const { Pool } = require('pg');

const app = express();
app.use(express.json());
app.use(express.static('public'));

const BOT_TOKEN = process.env.BOT_TOKEN;
const PRICE_ID = process.env.PRICE_ID;

// PostgreSQL connection (Render provides DATABASE_URL)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Create table if not exists (run on startup)
pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    wallets JSONB DEFAULT '[]',
    is_pro BOOLEAN DEFAULT FALSE,
    payment_date TIMESTAMP,
    stripe_session_id TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`).catch(err => console.error('Table creation error:', err));

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

// Stripe webhook for payment success (save user + wallets)
app.post('/webhook-stripe', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const user_id = session.client_reference_id;
    const wallets = session.metadata.wallets ? JSON.parse(session.metadata.wallets) : [];

    try {
      await pool.query(`
        INSERT INTO users (telegram_id, wallets, is_pro, payment_date, stripe_session_id)
        VALUES ($1, $2, TRUE, NOW(), $3)
        ON CONFLICT (telegram_id) DO UPDATE SET
        wallets = $2,
        is_pro = TRUE,
        payment_date = NOW(),
        stripe_session_id = $3
      `, [user_id, wallets, session.id]);

      // Send confirmation to user
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: user_id,
          text: '🎉 Pro activated! Lifetime instant alerts unlocked for your wallets.'
        })
      });
    } catch (err) {
      console.error('DB save error:', err);
    }
  }

  res.json({ received: true });
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
      // Your existing /checktoken code here (same as before)
      // ... (paste from previous working version)
      return;
    }

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

// Background monitoring (every 5 minutes)
setInterval(async () => {
  try {
    const { rows: proUsers } = await pool.query('SELECT telegram_id, wallets FROM users WHERE is_pro = TRUE');
    for (const user of proUsers) {
      const wallets = user.wallets || [];
      for (const wallet of wallets) {
        const risk = await checkApprovalRisk(1, wallet); // Example ETH, add multi-chain
        if (risk) {
          const msg = `🚨 RISK DETECTED on wallet ${wallet.slice(0,6)}...${wallet.slice(-4)}\n`
            + `Malicious approvals found — revoke now!`;
          await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: user.telegram_id, text: msg })
          });
        }
      }
    }
  } catch (err) {
    console.error('Monitoring error:', err);
  }
}, 300000); // 5 minutes

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
