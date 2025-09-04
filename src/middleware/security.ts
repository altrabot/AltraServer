import { prisma } from '../index';
import { logger } from '../utils/logger';

// Daftar kata kasar (bisa dipindah ke database)
const badWords = [
  'anjing', 'bangsat', 'kontol', 'memek', 'jancuk', 'jancok', 
  'bajingan', 'bego', 'goblok', 'tolol', 'idiot', 'kampret'
];

// Pattern link terlarang
const forbiddenPatterns = [
  /chat\.whatsapp\.com\/[A-Za-z0-9]+/i, // Undangan grup
  /whatsapp\.com\/channel\/[A-Za-z0-9]+/i, // Channel WhatsApp
  /phishing\.com/i, // Contoh domain phishing
  /malware\.site/i // Contoh malware site
];

// Whitelist pattern (link yang diizinkan)
const whitelistPatterns = [
  /youtube\.com/i,
  /youtu\.be/i,
  /instagram\.com/i,
  /tiktok\.com/i,
  /twitter\.com/i,
  /x\.com/i,
  /facebook\.com/i
];

export async function antiSpamMiddleware(userJid: string, groupJid: string): Promise<{ allowed: boolean; reason?: string }> {
  try {
    // Implementasi token bucket rate limiting
    // ...
    return { allowed: true };
  } catch (error) {
    logger.error('Error in antiSpamMiddleware:', error);
    return { allowed: true }; // Default allow jika error
  }
}

export async function antiBadWordMiddleware(text: string, userJid: string, groupJid: string): Promise<{ allowed: boolean; warningCount?: number; banned?: boolean }> {
  try {
    const lowerText = text.toLowerCase();
    let containsBadWord = false;
    
    // Cek kata kasar
    for (const word of badWords) {
      if (lowerText.includes(word)) {
        containsBadWord = true;
        break;
      }
    }
    
    if (!containsBadWord) {
      return { allowed: true };
    }
    
    // Dapatkan user dan update warning
    const user = await prisma.user.findUnique({
      where: { jid: userJid },
      include: { warningsLog: true }
    });
    
    if (!user) return { allowed: false };
    
    const warningCount = user.warnings + 1;
    
    // Update warning count
    await prisma.user.update({
      where: { id: user.id },
      data: { warnings: warningCount }
    });
    
    // Tambah warning log
    await prisma.warningLog.create({
      data: {
        reason: 'Menggunakan kata kasar',
        severity: 1,
        userId: user.id,
        groupId: groupJid
      }
    });
    
    // Cek jika perlu ban
    if (warningCount >= 10) {
      // Ban 7 hari
      const banUntil = new Date();
      banUntil.setDate(banUntil.getDate() + 7);
      
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          isBanned: true,
          banUntil: banUntil,
          banReason: 'Menggunakan kata kasar (10+ warnings)'
        }
      });
      
      return { allowed: false, warningCount, banned: true };
    } else if (warningCount >= 5) {
      // Ban 2 hari
      const banUntil = new Date();
      banUntil.setDate(banUntil.getDate() + 2);
      
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          isBanned: true,
          banUntil: banUntil,
          banReason: 'Menggunakan kata kasar (5+ warnings)'
        }
      });
      
      return { allowed: false, warningCount, banned: true };
    }
    
    return { allowed: false, warningCount };
  } catch (error) {
    logger.error('Error in antiBadWordMiddleware:', error);
    return { allowed: true }; // Default allow jika error
  }
}

export async function antiLinkMiddleware(text: string, userJid: string, groupJid: string): Promise<{ allowed: boolean; action?: string; messageKey?: any }> {
  try {
    // Cek pattern link
    let containsForbiddenLink = false;
    let isWhitelisted = false;
    
    // Cek whitelist dulu
    for (const pattern of whitelistPatterns) {
      if (pattern.test(text)) {
        isWhitelisted = true;
        break;
      }
    }
    
    if (isWhitelisted) {
      return { allowed: true };
    }
    
    // Cek forbidden patterns
    for (const pattern of forbiddenPatterns) {
      if (pattern.test(text)) {
        containsForbiddenLink = true;
        break;
      }
    }
    
    if (!containsForbiddenLink) {
      return { allowed: true };
    }
    
    // Dapatkan user
    const user = await prisma.user.findUnique({
      where: { jid: userJid }
    });
    
    if (!user) return { allowed: false, action: 'delete' };
    
    // Tambah warning
    const warningCount = user.warnings + 1;
    
    await prisma.user.update({
      where: { id: user.id },
      data: { warnings: warningCount }
    });
    
    await prisma.warningLog.create({
      data: {
        reason: 'Mengirim link terlarang',
        severity: 2,
        userId: user.id,
        groupId: groupJid
      }
    });
    
    // Jika sudah banyak warning, kick user
    if (warningCount >= 3) {
      return { allowed: false, action: 'remove' };
    }
    
    return { allowed: false, action: 'delete' };
  } catch (error) {
    logger.error('Error in antiLinkMiddleware:', error);
    return { allowed: true }; // Default allow jika error
  }
}
