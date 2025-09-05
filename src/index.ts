import 'dotenv/config';
import express from 'express';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Health check endpoint dengan database check
app.get('/healthz', async (req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    res.status(200).json({ 
      status: 'OK', 
      message: 'AltraBot is running with database connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      message: 'Database connection failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
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
        <p>Database: <strong>Connected to Prisma</strong></p>
      </div>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`🚀 AltraBot server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/healthz`);
  console.log(`🔗 Homepage: http://localhost:${PORT}`);
});

export default app;
