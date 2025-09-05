// src/index.ts
import 'dotenv/config';
import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

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
        .status { color: green; font-size: 24px; margin-bottom: 20px; }
        .container { max-width: 600px; margin: 0 auto; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🤖 AltraBot WhatsApp Bot</h1>
        <p class="status">✅ Service is running successfully</p>
        <p>Health check: <a href="/healthz">/healthz</a></p>
        <p>QR Login: <a href="/qr">/qr</a></p>
        <p>Database: <strong>Prisma PostgreSQL</strong></p>
      </div>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`🚀 AltraBot server running on port ${PORT}`);
});

export default app;
