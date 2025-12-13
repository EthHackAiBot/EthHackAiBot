const express = require('express');
const stripe = require('stripe');
const app = express();

app.use(express.json());
app.use(express.static('public'));

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const stripeClient = stripe(STRIPE_SECRET_KEY);

const TOKEN = process.env.BOT_TOKEN;

// Serve your landing page
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// New endpoint for creating Stripe Checkout session
app.post('/create-checkout-session', async (req, res) => {
  const { wallets } = req.body;

  if (!wallets || wallets.length === 0) {
    return res.status(400).json({ error: 'No wallets provided' });
  }

  try {
    const session = await stripeClient.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: 'price_1Sdv0cB4q90VhcD0njTotzmO', // Your Price ID
          quantity: 1,
        },
      ],
      mode: 'payment', // One-time payment
      success_url: `https://bot.ethhack.com?status=success`,
      cancel_url: `https://bot.ethhack.com?status=cancel`,
      metadata: { wallets: wallets.join(',') } // Save wallets in metadata for later
    });

    res.json({ id: session.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Telegram webhook (for /start reply)
app.post('/webhook', async (req, res) => {
  res.sendStatus(200);

  if (req.body.message?.text === '/start') {
    const chatId = req.body.message.chat.id;

    await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: 'EthHack AI Bot 🐺\n\nLifetime protection activated!\nAdd your wallets on the site for real-time alerts:',
        reply_markup: {
          inline_keyboard: [[{ text: 'Open Site', url: 'https://bot.ethhack.com' }]]
        }
      })
    });
  }
});

app.get('/webhook', (req, res) => res.send('OK'));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('Server running'));
