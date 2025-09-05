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

// Buat commands map
export const commands = new Map<string, Command>();

// Fungsi untuk register commands
export function registerCommands(): void {
  // Register core commands
  coreCommands.forEach(cmd => {
    commands.set(cmd.name, cmd);
  });

  // Register utility commands
  utilityCommands.forEach(cmd => {
    commands.set(cmd.name, cmd);
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
