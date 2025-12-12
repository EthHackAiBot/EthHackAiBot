const express = require('express');
const fetch = require('node-fetch');
const app = express();

app.use(express.json());
app.use(express.static('public')); // this serves the HTML/CSS/JS

// Root = beautiful web UI
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// API endpoint to check balance (called from the website)
app.get('/api/balance/:address', async (req, res) => {
  try {
    const address = req.params.address;
    const response = await fetch(
      `https://api.ethplorer.io/getAddressInfo/${address}?apiKey=freekey`
    );
    const data = await response.json();
    if (data.error) throw data.error;
    res.json({
      address,
      balance: data.ETH.balance,
      usd: (data.ETH.price ? data.ETH.price.rate : 0).toFixed(2)
    });
  } catch (e) {
    res.status(400).json({ error: 'Invalid address or network error' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('Web UI + API running on port', port));
