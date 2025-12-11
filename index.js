const express = require('express');
const path = require('path');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve your HTML/CSS/JS files (they must be inside a folder called "public")
app.use(express.static(path.join(__dirname, 'public')));

// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check for Railway
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// YOUR REAL ROUTES GO HERE (add them later)

// 404 page (fixed the broken tag)
app.use((req, res) => {
  res.status(404).send('<h1>404 – Not Found</h1>');
});

// Railway-compatible start
const PORT = process.env.PORT || 8080;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`EthHack AI Bot is LIVE on port ${PORT}`);
  console.log(`Visit: https://bot.ethhack.com`);
});
