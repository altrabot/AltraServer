import { CommandHandler } from '../src/handlers/commandHandler';
import { isOwner } from '../src/middleware/auth';

describe('Basic Tests', () => {
  test('Command Handler should load all commands', () => {
    const commands = CommandHandler.getCommands();
    expect(commands.length).toBe(200);
  });

  test('Owner number should be recognized', () => {
    const ownerNumber = '083131871328@s.whatsapp.net';
    expect(isOwner(ownerNumber)).toBe(true);
    
    const nonOwnerNumber = '1234567890@s.whatsapp.net';
    expect(isOwner(nonOwnerNumber)).toBe(false);
  });

  test('Anti bad word middleware should detect bad words', async () => {
    const badText = 'kata anjing harus terdeteksi';
    const goodText = 'ini adalah kalimat baik';
    
    // Implementasi test untuk middleware
    // ...
  });
});
