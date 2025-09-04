import express from 'express';
import { Server as SocketIOServer } from 'socket.io';
import QRCode from 'qrcode';
import { whatsappClient, qrCode, isConnected } from '../wa/baileys';
import { logger } from '../utils/logger';

export function initWebServer(app: express.Application, io: SocketIOServer) {
  // Serve static files
  app.use(express.static('public'));
  
  // QR endpoint
  app.get('/qr', async (req, res) => {
    try {
      if (isConnected) {
        return res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>AltraBot - Already Connected</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              .status { color: green; font-size: 24px; }
            </style>
          </head>
          <body>
            <h1>AltraBot WhatsApp</h1>
            <p class="status">✅ Bot sudah terhubung ke WhatsApp</p>
            <p>Kembali ke <a href="/">dashboard</a></p>
          </body>
          </html>
        `);
      }
      
      if (!qrCode) {
        return res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>AltraBot - Generating QR</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              .status { color: orange; font-size: 24px; }
            </style>
          </head>
          <body>
            <h1>AltraBot WhatsApp</h1>
            <p class="status">⏳ Menghasilkan QR code...</p>
            <p>Refresh halaman ini dalam beberapa detik</p>
          </body>
          </html>
        `);
      }
      
      const qrImage = await QRCode.toDataURL(qrCode);
      
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>AltraBot - QR Login</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .instructions { margin: 20px auto; max-width: 500px; }
            .qr-container { margin: 20px auto; }
          </style>
        </head>
        <body>
          <h1>AltraBot WhatsApp</h1>
          <p>Scan QR code berikut untuk login:</p>
          <div class="qr-container">
            <img src="${qrImage}" alt="QR Code" />
          </div>
          <div class="instructions">
            <h3>Cara Login:</h3>
            <ol style="text-align: left; display: inline-block;">
              <li>Buka WhatsApp di ponsel Anda</li>
              <li>Ketuk <strong>Menu</strong> (titik tiga) → <strong>Perangkat tertaut</strong></li>
              <li>Ketuk <strong>Tautkan perangkat</strong></li>
              <li>Scan QR code di atas</li>
            </ol>
          </div>
          <p>Status: <span id="status">Menunggu scan...</span></p>
          <script src="/socket.io/socket.io.js"></script>
          <script>
            const socket = io();
            socket.on('status', (status) => {
              document.getElementById('status').textContent = status;
            });
            socket.on('qr', (qr) => {
              location.reload();
            });
          </script>
        </body>
        </html>
      `);
    } catch (error) {
      logger.error('Error generating QR page:', error);
      res.status(500).send('Error generating QR code');
    }
  });
  
  // Dashboard
  app.get('/', async (req, res) => {
    try {
      const groups = await prisma.group.count();
      const users = await prisma.user.count();
      const uptime = process.uptime();
      
      const days = Math.floor(uptime / 86400);
      const hours = Math.floor((uptime % 86400) / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      const seconds = Math.floor(uptime % 60);
      
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>AltraBot - Dashboard</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .stats { display: flex; justify-content: center; gap: 20px; margin: 20px 0; }
            .stat-card { border: 1px solid #ddd; padding: 20px; border-radius: 8px; min-width: 150px; }
            .connected { color: green; }
            .disconnected { color: red; }
          </style>
        </head>
        <body>
          <h1>AltraBot Dashboard</h1>
          
          <div class="stats">
            <div class="stat-card">
              <h3>Status</h3>
              <p class="${isConnected ? 'connected' : 'disconnected'}">
                ${isConnected ? '✅ Terhubung' : '❌ Terputus'}
              </p>
            </div>
            <div class="stat-card">
              <h3>Uptime</h3>
              <p>${days}d ${hours}h ${minutes}m ${seconds}s</p>
            </div>
            <div class="stat-card">
              <h3>Grup</h3>
              <p>${groups}</p>
            </div>
            <div class="stat-card">
              <h3>Pengguna</h3>
              <p>${users}</p>
            </div>
          </div>
          
          <div>
            <a href="/qr" style="margin: 10px; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px;">
              ${isConnected ? 'Refresh QR' : 'Login QR'}
            </a>
            <a href="/healthz" style="margin: 10px; padding: 10px 20px; background: #28a745; color: white; text-decoration: none; border-radius: 5px;">
              Health Check
            </a>
          </div>
          
          <script src="/socket.io/socket.io.js"></script>
          <script>
            const socket = io();
            socket.on('status', (status) => {
              location.reload();
            });
          </script>
        </body>
        </html>
      `);
    } catch (error) {
      logger.error('Error generating dashboard:', error);
      res.status(500).send('Error generating dashboard');
    }
  });
  
  // Socket.IO untuk real-time updates
  io.on('connection', (socket) => {
    logger.info('Client connected to websocket');
    
    socket.emit('status', isConnected ? 'Terhubung ke WhatsApp' : 'Menunggu koneksi');
    if (qrCode) {
      socket.emit('qr', qrCode);
    }
    
    socket.on('disconnect', () => {
      logger.info('Client disconnected from websocket');
    });
  });
    }
