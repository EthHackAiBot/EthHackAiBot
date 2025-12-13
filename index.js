const express = require('express');
const app = express();

app.use(express.json());

// Serve your landing page from the public folder
app.use(express.static('public'));

// Root path serves index.html
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Telegram webhook (keep this if you have it)
app.post('/webhook', async (req, res) => {
  res.sendStatus(200);
  // Your Telegram code here
});

app.get('/webhook', (req, res) => res.send('OK'));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('Server running'));
