import { WAMessage, WASocket } from '@whiskeysockets/baileys';
import axios from 'axios';
import { logger } from '../../utils/logger';

export const memeCommand: Command = {
  name: 'meme',
  description: 'Mengirim meme acak',
  usage: '.meme',
  aliases: ['random-meme'],
  category: 'fun',
  
  execute: async (sock: WASocket, message: WAMessage, args: string[]) => {
    try {
      const jid = message.key.remoteJid!;
      
      await sock.sendMessage(jid, {
        text: '🔄 Mengambil meme...'
      });
      
      // Ambil meme dari API
      const response = await axios.get('https://meme-api.com/gimme');
      const meme = response.data;
      
      // Kirim meme
      await sock.sendMessage(jid, {
        image: { url: meme.url },
        caption: `📛 ${meme.title}\n👤 oleh u/${meme.author} di r/${meme.subreddit}`
      });
      
      await logCommandUsage('meme', jid);
      
    } catch (error) {
      logger.error('Error in meme command:', error);
      await sock.sendMessage(message.key.remoteJid!, {
        text: '❌ Terjadi kesalahan saat mengambil meme.'
      });
    }
  }
};
