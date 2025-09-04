import { makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers, proto } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import { Server as SocketIOServer } from 'socket.io';
import { prisma } from '../index';
import { logger } from '../utils/logger';
import { config } from '../config';
import { handleMessage } from '../handlers/messageHandler';
import { antiSpamMiddleware, antiBadWordMiddleware, antiLinkMiddleware } from '../middleware/security';
import { isAdmin, isOwner, isPremium } from '../middleware/auth';

export let whatsappClient: ReturnType<typeof makeWASocket> | null = null;
export let qrCode: string | null = null;
export let isConnected = false;

export async function initWhatsAppClient(io: SocketIOServer) {
  const { state, saveCreds } = await useMultiFileAuthState(config.sessionDir);

  whatsappClient = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    browser: Browsers.ubuntu('Chrome'),
    logger: logger as any,
  });

  whatsappClient.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      qrCode = qr;
      io.emit('qr', qr);
      io.emit('status', 'Scan QR code untuk login');
    }

    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
      logger.info(`Koneksi tertutup, ${shouldReconnect ? 'menghubungkan ulang' : 'logout'}...`);

      if (shouldReconnect) {
        initWhatsAppClient(io);
      }
    } else if (connection === 'open') {
      isConnected = true;
      qrCode = null;
      io.emit('status', 'Terhubung ke WhatsApp');
      logger.info('Bot terhubung ke WhatsApp');
    }
  });

  whatsappClient.ev.on('creds.update', saveCreds);

  // Handle incoming messages
  whatsappClient.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const message of messages) {
      if (!message.message) continue;

      try {
        // Dapatkan info pengirim dan grup
        const jid = message.key.remoteJid!;
        const isGroup = jid.endsWith('@g.us');
        const userJid = message.key.participant || message.key.remoteJid!;
        const messageType = Object.keys(message.message)[0];
        
        // Simpan pesan ke database
        await prisma.message.create({
          data: {
            content: messageType === 'conversation' ? message.message.conversation : '',
            type: messageType,
            fromMe: message.key.fromMe,
            timestamp: new Date(message.messageTimestamp! * 1000),
            userId: userJid,
            groupId: isGroup ? jid : null,
          },
        });

        // Update statistik pengguna
        if (!message.key.fromMe) {
          await updateUserStats(userJid, jid, isGroup);
        }

        // Handle hanya pesan teks
        if (messageType === 'conversation' && message.message.conversation) {
          const text = message.message.conversation;
          
          // Middleware keamanan
          if (isGroup && !message.key.fromMe) {
            const shouldContinue = await applySecurityMiddlewares(text, userJid, jid);
            if (!shouldContinue) return;
          }

          // Handle perintah
          if (text.startsWith('.')) {
            await handleMessage(whatsappClient!, message, text);
          }
        }

      } catch (error) {
        logger.error('Error processing message:', error);
      }
    }
  });

  // Handle calls
  whatsappClient.ev.on('call', async (call) => {
    if (call.status === 'offer') {
      const callerJid = call.from;
      logger.warn(`Mendapatkan panggilan dari ${callerJid}, memblokir...`);
      
      // Blokir nomor
      await whatsappClient!.updateBlockStatus(callerJid, 'block');
      
      // Kirim pesan peringatan
      await whatsappClient!.sendMessage(callerJid, {
        text: 'Bot tidak menerima panggilan. Nomor Anda telah diblokir.'
      });
      
      // Catat di database
      await prisma.warningLog.create({
        data: {
          reason: 'Menelepon bot',
          severity: 3,
          userId: callerJid,
        }
      });
    }
  });

  // Handle group participants update
  whatsappClient.ev.on('group-participants.update', async (update) => {
    const { id, participants, action } = update;
    
    if (action === 'add' || action === 'remove') {
      // Kirim pesan sambutan/perpisahan
      await handleGroupParticipantsUpdate(id, participants, action);
    }
  });

  return whatsappClient;
}

async function updateUserStats(userJid: string, groupJid: string, isGroup: boolean) {
  try {
    // Update atau buat user
    let user = await prisma.user.findUnique({
      where: { jid: userJid }
    });

    if (!user) {
      const profile = await whatsappClient?.profilePictureUrl(userJid).catch(() => null);
      user = await prisma.user.create({
        data: {
          jid: userJid,
          number: userJid.split('@')[0],
          name: 'Unknown',
        }
      });
    }

    // Update group user stats jika di grup
    if (isGroup) {
      let groupUser = await prisma.groupUser.findUnique({
        where: {
          userId_groupId: {
            userId: user.id,
            groupId: groupJid
          }
        }
      });

      if (groupUser) {
        await prisma.groupUser.update({
          where: { id: groupUser.id },
          data: { messageCount: { increment: 1 } }
        });
      } else {
        // Buat group user jika belum ada
        let group = await prisma.group.findUnique({
          where: { jid: groupJid }
        });

        if (!group) {
          const metadata = await whatsappClient?.groupMetadata(groupJid);
          group = await prisma.group.create({
            data: {
              jid: groupJid,
              name: metadata?.subject || 'Unknown Group',
              description: metadata?.desc || '',
            }
          });
        }

        await prisma.groupUser.create({
          data: {
            userId: user.id,
            groupId: group.id,
            messageCount: 1
          }
        });
      }
    }
  } catch (error) {
    logger.error('Error updating user stats:', error);
  }
}

async function applySecurityMiddlewares(text: string, userJid: string, groupJid: string): Promise<boolean> {
  try {
    // Cek apakah user adalah admin atau owner
    const isUserAdmin = await isAdmin(userJid, groupJid);
    const isUserOwner = isOwner(userJid);
    
    if (isUserAdmin || isUserOwner) {
      return true; // Admin dan owner bebas dari filter
    }

    // Anti spam
    const spamCheck = await antiSpamMiddleware(userJid, groupJid);
    if (!spamCheck.allowed) {
      if (spamCheck.reason === 'muted') {
        await whatsappClient!.sendMessage(groupJid, {
          text: `@${userJid.split('@')[0]} telah dimute karena spam.`
        }, { mentions: [userJid] });
      }
      return false;
    }

    // Anti kata kasar
    const badWordCheck = await antiBadWordMiddleware(text, userJid, groupJid);
    if (!badWordCheck.allowed) {
      await whatsappClient!.sendMessage(groupJid, {
        text: `@${userJid.split('@')[0]} menggunakan kata tidak pantas. Peringatan ${badWordCheck.warningCount}/5.`
      }, { mentions: [userJid] });
      
      if (badWordCheck.banned) {
        await whatsappClient!.groupParticipantsUpdate(groupJid, [userJid], 'remove');
      }
      return false;
    }

    // Anti link
    const linkCheck = await antiLinkMiddleware(text, userJid, groupJid);
    if (!linkCheck.allowed) {
      await whatsappClient!.sendMessage(groupJid, {
        text: `@${userJid.split('@')[0]} mengirim link terlarang.`
      }, { mentions: [userJid] });
      
      if (linkCheck.action === 'remove') {
        await whatsappClient!.groupParticipantsUpdate(groupJid, [userJid], 'remove');
      } else {
        await whatsappClient!.sendMessage(groupJid, {
          delete: linkCheck.messageKey
        });
      }
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Error applying security middlewares:', error);
    return true; // Default allow jika error
  }
}

async function handleGroupParticipantsUpdate(groupJid: string, participants: string[], action: 'add' | 'remove') {
  try {
    const group = await prisma.group.findUnique({
      where: { jid: groupJid },
      include: { users: { include: { user: true } } }
    });

    if (!group) return;

    for (const participant of participants) {
      const user = await prisma.user.findUnique({
        where: { jid: participant }
      });

      if (user) {
        if (action === 'add') {
          // Kirim pesan sambutan
          if (group.welcomeMsg) {
            const welcomeMsg = group.welcomeMsg
              .replace('{user}', `@${participant.split('@')[0]}`)
              .replace('{group}', group.name || 'Grup');
            
            await whatsappClient!.sendMessage(groupJid, {
              text: welcomeMsg,
              mentions: [participant]
            });
          }
        } else if (action === 'remove') {
          // Kirim pesan perpisahan
          if (group.goodbyeMsg) {
            const goodbyeMsg = group.goodbyeMsg
              .replace('{user}', `@${participant.split('@')[0]}`)
              .replace('{group}', group.name || 'Grup');
            
            await whatsappClient!.sendMessage(groupJid, {
              text: goodbyeMsg
            });
          }
        }
      }
    }
  } catch (error) {
    logger.error('Error handling group participants update:', error);
  }
  }
