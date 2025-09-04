import { WAMessage, WASocket } from '@whiskeysockets/baileys';
import { prisma } from '../../index';
import { isOwner } from '../../middleware/auth';
import { logger } from '../../utils/logger';

export const broadcastCommand: Command = {
  name: 'broadcast',
  description: 'Mengirim pesan broadcast ke semua grup',
  usage: '.broadcast [teks]',
  aliases: ['bc'],
  category: 'owner',
  ownerOnly: true,
  
  execute: async (sock: WASocket, message: WAMessage, args: string[]) => {
    try {
      const jid = message.key.remoteJid!;
      const userJid = message.key.participant || message.key.remoteJid!;
      
      if (!isOwner(userJid)) {
        await sock.sendMessage(jid, {
          text: '❌ Hanya owner yang bisa menggunakan perintah ini.'
        });
        return;
      }
      
      if (args.length === 0) {
        await sock.sendMessage(jid, {
          text: '❌ Silakan ketik pesan broadcast.\nContoh: .broadcast Halo semua member!'
        });
        return;
      }
      
      const broadcastMessage = args.join(' ');
      
      // Dapatkan semua grup
      const groups = await prisma.group.findMany({
        where: { isActive: true }
      });
      
      await sock.sendMessage(jid, {
        text: `📢 Mengirim broadcast ke ${groups.length} grup...`
      });
      
      let successCount = 0;
      let failCount = 0;
      
      // Kirim ke semua grup
      for (const group of groups) {
        try {
          await sock.sendMessage(group.jid, {
            text: `📢 *BROADCAST*\n\n${broadcastMessage}\n\n_Pesan otomatis dari owner_`
          });
          successCount++;
          
          // Tunggu sebentar untuk menghindari rate limit
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          logger.error(`Error sending broadcast to ${group.jid}:`, error);
          failCount++;
        }
      }
      
      // Kirim laporan
      await sock.sendMessage(jid, {
        text: `📊 *Laporan Broadcast*\n\n` +
              `✅ Berhasil: ${successCount} grup\n` +
              `❌ Gagal: ${failCount} grup\n` +
              `📋 Total: ${groups.length} grup`
      });
      
      await logCommandUsage('broadcast', jid);
      
    } catch (error) {
      logger.error('Error in broadcast command:', error);
      await sock.sendMessage(message.key.remoteJid!, {
        text: '❌ Terjadi kesalahan saat mengirim broadcast.'
      });
    }
  }
};
