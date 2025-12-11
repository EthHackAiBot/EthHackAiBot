const express = require('express');
const path = require('path');
const app = express();

// ───── Body parsing for forms / JSON (if you use it) ─────
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ───── Serve static files (your HTML, CSS, images, etc.) ─────
app.use(express.static(path.join(__dirname, 'public'))); 
// ← make sure your index.html + assets are inside a folder called "public"

// ───── Simple route for the root – serves your bot page ─────
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ───── Health check route (Railway loves this) ─────
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// ───── YOUR EXISTING ROUTES BELOW THIS LINE ─────
// Example placeholder routes – replace or add your real ones
app.post('/add-wallet', (req, res) => {
  // your wallet-adding logic here
  res.json({ success: true, message: 'Wallet monitoring started' });
});

app.get('/status', (req, res) => {
  // your status check logic
  res.json({ status: 'running', plan: 'lifetime' });
});

// ───── Catch-all for nice 404 (optional) ─────
app.use((req, res) => {
  res.status(404).send('<h1>404 – Not Found</h1>');
});

// ───── CRITICAL: RAILWAY-COMPATIBLE PORT BINDING ─────
const PORT = process.env.PORT || 8080;

app.listen(PORT, '0.0.0.0', () => {
  {
  console.log(`EthHack AI Bot is LIVE on port ${PORT}`);
  console.log(`→ Visit: https://bot.ethhack.com`);
});
