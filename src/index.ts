import 'dotenv/config';
import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

// Health check endpoint
app.get('/healthz', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'AltraBot is running',
    timestamp: new Date().toISOString()
  });
});

// Main endpoint
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
        <p>Status: <strong>Ready to connect WhatsApp</strong></p>
      </div>
    </body>
    </html>
  `);
});

// QR endpoint placeholder
app.get('/qr', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>AltraBot - QR Login</title>
      <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        .info { margin: 20px 0; }
      </style>
    </head>
    <body>
      <h1>AltraBot QR Login</h1>
      <div class="info">
        <p>QR code will be generated after WhatsApp connection is initialized.</p>
        <p>Please check the server logs for connection status.</p>
      </div>
      <p><a href="/">Back to Home</a></p>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`🚀 AltraBot server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/healthz`);
  console.log(`🔗 Homepage: http://localhost:${PORT}`);
  console.log(`📱 QR Login: http://localhost:${PORT}/qr`);
});

export default app;
