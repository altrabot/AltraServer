import 'dotenv/config';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { makeWASocket, useMultiFileAuthState, Browsers } from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import path from 'path';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Global variables untuk WhatsApp client
let whatsappClient: any = null;
let qrCode: string | null = null;
let isConnected = false;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Inisialisasi WhatsApp
async function initWhatsApp() {
  try {
    const { state, saveCreds } = await useMultiFileAuthState('./sessions');

    whatsappClient = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      browser: Browsers.ubuntu('Chrome'),
    });

    whatsappClient.ev.on('connection.update', async (update: any) => {
      const { connection, qr } = update;

      if (qr) {
        // Generate QR code sebagai data URL
        qrCode = await QRCode.toDataURL(qr);
        console.log('QR code generated');
      }

      if (connection === 'open') {
        isConnected = true;
        qrCode = null;
        console.log('WhatsApp connected successfully!');
        
        // Simpan credentials
        whatsappClient.ev.on('creds.update', saveCreds);
      }

      if (connection === 'close') {
        isConnected = false;
        console.log('WhatsApp disconnected, restarting...');
        setTimeout(initWhatsApp, 5000);
      }
    });

    whatsappClient.ev.on('creds.update', saveCreds);

  } catch (error) {
    console.error('Error initializing WhatsApp:', error);
    setTimeout(initWhatsApp, 5000);
  }
}

// Health check endpoint
app.get('/healthz', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    
    res.status(200).json({ 
      status: 'OK', 
      message: 'AltraBot is running with database connected',
      timestamp: new Date().toISOString(),
      database: 'Connected',
      whatsapp: isConnected ? 'Connected' : 'Disconnected'
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
        .qr-container { margin: 20px auto; }
        .connected { color: green; }
        .disconnected { color: red; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🤖 AltraBot WhatsApp Bot</h1>
        <p class="status">✅ Service is running successfully</p>
        
        <div class="info">
          <p><strong>WhatsApp Status:</strong> 
            <span class="${isConnected ? 'connected' : 'disconnected'}">
              ${isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </p>
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

// QR endpoint dengan real QR code
app.get('/qr', async (req, res) => {
  try {
    if (!qrCode) {
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>AltraBot - QR Login</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .info { margin: 20px 0; }
            .loading { color: blue; }
          </style>
          <meta http-equiv="refresh" content="3">
        </head>
        <body>
          <h1>AltraBot QR Login</h1>
          <div class="info">
            <p class="loading">⏳ Generating QR code, please wait...</p>
            <p>If QR code doesn't appear in 10 seconds, refresh the page.</p>
          </div>
          <p><a href="/">Back to Home</a></p>
          <script>
            setTimeout(() => { location.reload(); }, 3000);
          </script>
        </body>
        </html>
      `);
    }

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>AltraBot - QR Login</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          .info { margin: 20px 0; }
          .qr-container { margin: 20px auto; }
          .instructions { text-align: left; max-width: 500px; margin: 20px auto; }
        </style>
      </head>
      <body>
        <h1>AltraBot QR Login</h1>
        
        <div class="qr-container">
          <img src="${qrCode}" alt="WhatsApp QR Code" style="width: 300px; height: 300px;" />
        </div>
        
        <div class="instructions">
          <h3>📱 Cara Login:</h3>
          <ol>
            <li>Buka WhatsApp di ponsel Anda</li>
            <li>Ketuk <strong>Menu</strong> (titik tiga) → <strong>Perangkat tertaut</strong></li>
            <li>Ketuk <strong>Tautkan perangkat</strong></li>
            <li>Scan QR code di atas</li>
            <li>Tunggu hingga terkoneksi (halaman akan otomatis refresh)</li>
          </ol>
        </div>
        
        <div class="info">
          <p>Status: <strong>${isConnected ? '✅ Terhubung' : '❌ Menunggu scan'}</strong></p>
          ${!isConnected ? '<p><em>Halaman akan otomatis refresh setiap 3 detik</em></p>' : ''}
        </div>
        
        <p><a href="/">Back to Home</a></p>
        
        ${!isConnected ? `
        <script>
          // Auto-refresh setiap 3 detik sampai terkoneksi
          setTimeout(() => { location.reload(); }, 3000);
        </script>
        ` : ''}
      </body>
      </html>
    `);

  } catch (error) {
    console.error('QR endpoint error:', error);
    res.status(500).send('Error generating QR code');
  }
});

// API endpoint untuk get QR code (JSON)
app.get('/api/qr', async (req, res) => {
  res.json({
    qr: qrCode,
    connected: isConnected,
    timestamp: new Date().toISOString()
  });
});

// API endpoint untuk status
app.get('/api/status', async (req, res) => {
  res.json({
    connected: isConnected,
    timestamp: new Date().toISOString(),
    session: !!whatsappClient
  });
});

// Start server dan inisialisasi WhatsApp
async function startServer() {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connected successfully');

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 AltraBot server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/healthz`);
      console.log(`🔗 Homepage: http://localhost:${PORT}`);
      console.log(`📱 QR Login: http://localhost:${PORT}/qr`);
      
      // Inisialisasi WhatsApp setelah server started
      setTimeout(() => {
        console.log('🔄 Initializing WhatsApp connection...');
        initWhatsApp();
      }, 1000);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await prisma.$disconnect();
  if (whatsappClient) {
    await whatsappClient.ws.close();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await prisma.$disconnect();
  if (whatsappClient) {
    await whatsappClient.ws.close();
  }
  process.exit(0);
});

// Start the server
startServer();

export default app;
