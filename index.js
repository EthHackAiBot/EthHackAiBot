const express = require('express');
const path = require('path');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static files (put your index.html, css, images in a folder called "public")
app.use(express.static(path.join(__dirname, 'public')));

// Root route – serves the bot page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check (Railway loves this)
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// YOUR EXISTING ROUTES GO HERE (add them below this line)
// Example:
// app.post('/add-wallet', ...)
// app.get('/status', ...)

// 404 fallback
app.use((req, res) => {
  res.status(404).send('<h1>404 – Not Found</h1>'));
});

// CRITICAL: Railway-compatible port binding
const PORT = process.env.PORT || 8080;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`EthHack AI Bot is LIVE on port ${PORT}`);
  console.log(`Visit: https://bot.ethhack.com`);
});
