import 'dotenv/config';
import express from 'express';
import { config } from './config';

const app = express();
const PORT = config.port;

app.get('/healthz', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'AltraBot is running',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>AltraBot WhatsApp Bot</title>
      <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        .status { color: green; font-size: 24px; }
      </style>
    </head>
    <body>
      <h1>AltraBot WhatsApp Bot</h1>
      <p class="status">✅ Service is running</p>
      <p>Health check: <a href="/healthz">/healthz</a></p>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`AltraBot server running on port ${PORT}`);
});
