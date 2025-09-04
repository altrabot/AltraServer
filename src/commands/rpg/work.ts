import { WAMessage, WASocket } from '@whiskeysockets/baileys';
import { prisma } from '../../index';
import { logger } from '../../utils/logger';

export const workCommand: Command = {
  name: 'work',
  description: 'Bekerja untuk mendapatkan koin',
  usage: '.work',
  aliases: ['kerja'],
  category: 'rpg',
  cooldown: 3600, // 1 jam
  
  execute: async (sock: WASocket, message: WAMessage, args: string[]) => {
    try {
      const jid = message.key.remoteJid!;
      const userJid = message.key.participant || message.key.remoteJid!;
      
      // Dapatkan user dari database
      const user = await prisma.user.findUnique({
        where: { jid: userJid },
        include: { rpgProfile: true }
      });
      
      if (!user) {
        await sock.sendMessage(jid, {
          text: '❌ Silakan daftar RPG dulu dengan .rpgstart'
        });
        return;
      }
      
      if (!user.rpgProfile) {
        await sock.sendMessage(jid, {
          text: '❌ Silakan daftar RPG dulu dengan .rpgstart'
        });
        return;
      }
      
      // Cek cooldown
      const lastWork = user.rpgProfile.lastWork;
      const now = new Date();
      
      if (lastWork && (now.getTime() - lastWork.getTime()) < this.cooldown * 1000) {
        const remaining = Math.ceil((this.cooldown * 1000 - (now.getTime() - lastWork.getTime())) / 1000);
        const minutes = Math.floor(remaining / 60);
        const seconds = remaining % 60;
        
        await sock.sendMessage(jid, {
          text: `⏳ Kamu masih lelah. Tunggu ${minutes}m ${seconds}s lagi sebelum bekerja.`
        });
        return;
      }
      
      // Pekerjaan dan penghasilan berdasarkan level
      const jobs = [
        { name: 'Tukang Sapu', min: 5, max: 15 },
        { name: 'Pelayan', min: 10, max: 25 },
        { name: 'Koki', min: 20, max: 40 },
        { name: 'Programmer', min: 30, max: 60 },
        { name: 'Dokter', min: 50, max: 100 }
      ];
      
      const jobIndex = Math.min(user.rpgProfile.level - 1, jobs.length - 1);
      const job = jobs[jobIndex];
      const earnings = Math.floor(Math.random() * (job.max - job.min + 1)) + job.min;
      
      // Update user coins dan last work
      await prisma.user.update({
        where: { id: user.id },
        data: {
          coins: { increment: earnings },
          rpgProfile: {
            update: {
              lastWork: now,
              stamina: Math.max(0, user.rpgProfile.stamina - 10)
            }
          }
        }
      });
      
      // Kirim hasil
      const response = `💼 *Kamu bekerja sebagai ${job.name}*\n\n` +
                     `🪙 Mendapatkan: ${earnings} koin\n` +
                     `💪 Stamina: -10\n\n` +
                     `💰 Total koin: ${user.coins + earnings}`;
      
      await sock.sendMessage(jid, { text: response });
      await logCommandUsage('work', jid);
      
    } catch (error) {
      logger.error('Error in work command:', error);
      await sock.sendMessage(message.key.remoteJid!, {
        text: '❌ Terjadi kesalahan saat bekerja.'
      });
    }
  }
};
