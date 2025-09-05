import { proto } from '@whiskeysockets/baileys';
import { Command } from './index';

export const utilityCommands: Command[] = [
  {
    name: 'sticker',
    description: 'Ubah gambar/video jadi stiker',
    category: 'utility',
    usage: '.sticker [reply ke media]',
    execute: async (sock, message, args) => {
      const jid = message.key.remoteJid!;
      await sock.sendMessage(jid, {
        text: '🔄 Fitur stiker sedang dalam pengembangan. Silakan coba lagi nanti!'
      });
    }
  },
  {
    name: 'qrcode',
    description: 'Buat QR code dari teks',
    category: 'utility',
    usage: '.qrcode [teks]',
    execute: async (sock, message, args) => {
      const jid = message.key.remoteJid!;
      if (args.length === 0) {
        await sock.sendMessage(jid, {
          text: '❌ Silakan berikan teks untuk QR code\nContoh: .qrcode Hello World'
        });
        return;
      }
      
      const text = args.join(' ');
      await sock.sendMessage(jid, {
        text: `📲 QR Code untuk: "${text}"\n\nFitur QR code generator sedang dalam pengembangan.`
      });
    }
  }
];
