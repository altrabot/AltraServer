import { WAMessage, WASocket } from '@whiskeysockets/baileys';
import { isAdmin } from '../../middleware/auth';
import { logger } from '../../utils/logger';

export const kickCommand: Command = {
  name: 'kick',
  description: 'Mengeluarkan member dari grup',
  usage: '.kick [@user|nomor]',
  aliases: ['keluarkan'],
  category: 'admin',
  adminOnly: true,
  
  execute: async (sock: WASocket, message: WAMessage, args: string[]) => {
    try {
      const jid = message.key.remoteJid!;
      
      if (!jid.endsWith('@g.us')) {
        await sock.sendMessage(jid, {
          text: '❌ Perintah ini hanya bisa digunakan di grup.'
        });
        return;
      }
      
      if (args.length === 0) {
        await sock.sendMessage(jid, {
          text: '❌ Silakan mention user atau ketik nomor yang ingin dikick.\nContoh: .kick @user'
        });
        return;
      }
      
      const target = args[0].replace('@', '').split('-')[0];
      let targetJid: string;
      
      if (target.includes('@')) {
        targetJid = target;
      } else {
        targetJid = `${target}@s.whatsapp.net`;
      }
      
      // Cek apakah pengirim adalah admin
      const isSenderAdmin = await isAdmin(message.key.participant!, jid);
      if (!isSenderAdmin) {
        await sock.sendMessage(jid, {
          text: '❌ Hanya admin yang bisa menggunakan perintah ini.'
        });
        return;
      }
      
      // Kick user
      await sock.groupParticipantsUpdate(jid, [targetJid], 'remove');
      
      await sock.sendMessage(jid, {
        text: `✅ Berhasil mengeluarkan ${targetJid.split('@')[0]} dari grup.`
      });
      
      await logCommandUsage('kick', jid);
      
    } catch (error) {
      logger.error('Error in kick command:', error);
      await sock.sendMessage(message.key.remoteJid!, {
        text: '❌ Terjadi kesalahan saat mengkick user.'
      });
    }
  }
};
