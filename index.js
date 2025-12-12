const express = require('express');
const app = express();

// This line makes your beautiful page appear
app.use(express.static('public'));

// Optional: keep Telegram webhook alive
app.post('/webhook', (req, res) => res.sendStatus(200));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('Site live'));
