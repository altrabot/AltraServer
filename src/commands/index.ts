import { proto } from '@whiskeysockets/baileys';

export interface Command {
  name: string;
  description: string;
  category: string;
  usage: string;
  aliases?: string[];
  execute: (sock: any, message: proto.IWebMessageInfo, args: string[]) => Promise<void>;
}

// Import semua command modules
import { coreCommands } from './core';
import { utilityCommands } from './utility';
import { downloaderCommands } from './downloader';

// Buat commands map
export const commands = new Map<string, Command>();

// Fungsi untuk register commands
export function registerCommands(): void {
  // Register semua commands
  const allCommands = [
    ...coreCommands,
    ...utilityCommands,
    ...downloaderCommands
  ];

  allCommands.forEach(cmd => {
    commands.set(cmd.name, cmd);
    
    // Register aliases jika ada
    if (cmd.aliases) {
      cmd.aliases.forEach(alias => {
        commands.set(alias, cmd);
      });
    }
  });

  console.log(`✅ Registered ${commands.size} commands`);
}

// Helper functions
export function getCommand(name: string): Command | undefined {
  return commands.get(name);
}

export function getAllCommands(): Command[] {
  return Array.from(commands.values());
}

export function getCommandsByCategory(category: string): Command[] {
  return getAllCommands().filter(cmd => cmd.category === category);
}

// Register commands saat module di-load
registerCommands();
