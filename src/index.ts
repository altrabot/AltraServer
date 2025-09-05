import 'dotenv/config';
import express from 'express';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Health check endpoint dengan database check
app.get('/healthz', async (req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    res.status(200).json({ 
      status: 'OK', 
      message: 'AltraBot is running with database connected',
      timestamp: new Date().toISOString(),
      database: 'Connected'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      message: 'Database connection failed',
      error: error.message,
      timestamp: new Date().toISOString(),
      database: 'Disconnected'
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
        .info { margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🤖 AltraBot WhatsApp Bot</h1>
        <p class="status">✅ Service is running successfully</p>
        
        <div class="info">
          <p><strong>Health check:</strong> <a href="/healthz">/healthz</a></p>
          <p><strong>QR Login:</strong> <a href="/qr">/qr</a></p>
          <p><strong>Database:</strong> PostgreSQL with Prisma</p>
          <p><strong>Port:</strong> ${PORT}</p>
        </div>
        
        <p>Server is ready to connect to WhatsApp</p>
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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 AltraBot server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/healthz`);
  console.log(`🔗 Homepage: http://localhost:${PORT}`);
  console.log('📱 WhatsApp connection will be initialized...');
});

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

export default app;
