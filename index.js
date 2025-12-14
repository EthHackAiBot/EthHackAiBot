// index.js - Fixed version using native Node.js fetch (no node-fetch needed)
const express = require('express');
const stripe = require('stripe');

const app = express();

app.use(express.json());
app.use(express.static('public'));

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const stripeClient = stripe(STRIPE_SECRET_KEY);

const BOT_TOKEN = process.env.BOT_TOKEN;

// Configurable via Render environment variables
const SUCCESS_URL = process.env.SUCCESS_URL || 'https://bot.ethhack.com?status=success';
const CANCEL_URL = process.env.CANCEL_URL || 'https://bot.ethhack.com?status=cancel';
const PRICE_ID = process.env.PRICE_ID || 'price_1Sdv0cB4q90VhcD0njTotzmO'; // Set this in Render env!

// Serve your landing page
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Create Checkout Session
app.post('/create-checkout-session', async (req, res) => {
  const { wallets, user_id } = req.body;

  console.log('Create session request - wallets:', wallets, 'user_id:', user_id);

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
      expires_at: Math.floor(Date.now() / 1000) + 1800, // 30 minutes
    }, {
      idempotency_key: idempotencyKey
    });

    console.log('Checkout session created:', session.id);

    res.json({ url: session.url });
  } catch (err) {
    console.error('Error creating checkout session:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Telegram webhook endpoint
app.post('/webhook', async (req, res) => {
  res.sendStatus(200);

  const update = req.body;

  if (update.message && update.message.text === '/start') {
    const chatId = update.message.chat.id;

    try {
      // Native fetch - no import needed in Node.js 18+
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: 'EthHack AI Bot 🐺\n\nLifetime protection activated!\nAdd your wallets on the site for real-time alerts:',
          reply_markup: {
            inline_keyboard: [[
              { text: 'Open Site', url: 'https://bot.ethhack.com' }
            ]]
          }
        })
      });
    } catch (err) {
      console.error('Failed to send Telegram message:', err);
    }
  }
});

// Health check
app.get('/webhook', (req, res) => res.send('OK'));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
