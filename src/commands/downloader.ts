import { proto } from '@whiskeysockets/baileys';
import { Command } from './index';

export const downloaderCommands: Command[] = [
  {
    name: 'ytmp3',
    description: 'Download audio dari YouTube',
    category: 'downloader',
    usage: '.ytmp3 [url]',
    execute: async (sock, message, args) => {
      const jid = message.key.remoteJid!;
      await sock.sendMessage(jid, {
        text: '🎵 YouTube MP3 downloader sedang dalam pengembangan.'
      });
    }
  },
  {
    name: 'tiktok',
    description: 'Download video TikTok',
    category: 'downloader',
    usage: '.tiktok [url]',
    execute: async (sock, message, args) => {
      const jid = message.key.remoteJid!;
      await sock.sendMessage(jid, {
        text: '📱 TikTok downloader sedang dalam pengembangan.'
      });
    }
  }
];
