import { Client, GatewayIntentBits, TextChannel, EmbedBuilder, ChannelType, PermissionFlagsBits } from 'discord.js';
import type { Guild } from 'discord.js';

/**
 * Degens Den Discord Bot
 * Automated server setup, big wins notifications, payments
 */

// Note: class name uses DegensDen (¤ is not valid in JS identifiers)
export class DegensDenDiscordBot {
  private client: Client;
  private token: string;
  private guildId: string;
  private bigWinsChannelId?: string;
  private paymentsChannelId?: string;
  private announcementsChannelId?: string;

  constructor(token: string, guildId: string) {
    this.token = token;
    this.guildId = guildId;

    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
      ],
    });
  }

  async initialize(): Promise<void> {
    try {
      await this.client.login(this.token);
      console.log(`[Discord] Logged in as ${this.client.user?.tag}`);
      this.client.once('ready', async () => {
        console.log('[Discord] Bot ready');
        await this.setupServer();
      });
      this.setupEventHandlers();
    } catch (error) {
      console.error('[Discord] Failed to initialize:', error);
      throw error;
    }
  }

  async setupServer(): Promise<void> {
    try {
      const guild = await this.client.guilds.fetch(this.guildId);
      console.log('[Discord] Setting up Degens Den server...');
      await this.cleanupOldChannels(guild);
      await this.createRoles(guild);
      await this.createChannelStructure(guild);
      await this.setupPermissions(guild);
      console.log('[Discord] Server setup complete!');
    } catch (error) {
      console.error('[Discord] Server setup failed:', error);
      throw error;
    }
  }

  private async cleanupOldChannels(guild: Guild): Promise<void> {
    const channels = await guild.channels.fetch();
    for (const [, channel] of channels) {
      if (channel && channel.type !== ChannelType.GuildCategory) {
        try {
          if (!channel.name.includes('system') && !channel.name.includes('rules')) {
            await channel.delete('Degens Den server restructure');
          }
        } catch { /* ignore */ }
      }
    }
    for (const [, channel] of channels) {
      if (channel && channel.type === ChannelType.GuildCategory) {
        try { await channel.delete('Degens Den server restructure'); } catch { /* ignore */ }
      }
    }
  }

  private async createRoles(guild: Guild): Promise<void> {
    const roles = [
      { name: 'Owner', color: 0xFFD700, permissions: [PermissionFlagsBits.Administrator] },
      { name: 'Diamond VIP', color: 0xB9F2FF, permissions: [] },
      { name: 'Platinum VIP', color: 0xE5E4E2, permissions: [] },
      { name: 'Gold VIP', color: 0xFFD700, permissions: [] },
      { name: 'Silver VIP', color: 0xC0C0C0, permissions: [] },
      { name: 'Bronze VIP', color: 0xCD7F32, permissions: [] },
      { name: 'High Roller', color: 0xFF6B6B, permissions: [] },
      { name: 'Player', color: 0x4ECDC4, permissions: [] },
    ];
    for (const roleData of roles) {
      try {
        const existing = guild.roles.cache.find(r => r.name === roleData.name);
        if (!existing) {
          await guild.roles.create({
            name: roleData.name,
            color: roleData.color,
            permissions: roleData.permissions as bigint[],
            hoist: true,
          });
        }
      } catch { /* ignore */ }
    }
  }

  private async createChannelStructure(guild: Guild): Promise<void> {
    const infoCategory = await guild.channels.create({ name: 'INFORMATION', type: ChannelType.GuildCategory });
    await guild.channels.create({ name: 'rules', type: ChannelType.GuildText, parent: infoCategory.id });
    const announcementsChannel = await guild.channels.create({ name: 'announcements', type: ChannelType.GuildText, parent: infoCategory.id });
    this.announcementsChannelId = announcementsChannel.id;

    const casinoCategory = await guild.channels.create({ name: 'CASINO', type: ChannelType.GuildCategory });
    await guild.channels.create({ name: 'general-chat', type: ChannelType.GuildText, parent: casinoCategory.id });
    const bigWinsChannel = await guild.channels.create({ name: 'big-wins', type: ChannelType.GuildText, parent: casinoCategory.id });
    this.bigWinsChannelId = bigWinsChannel.id;
    await guild.channels.create({ name: 'leaderboards', type: ChannelType.GuildText, parent: casinoCategory.id });

    const paymentsCategory = await guild.channels.create({ name: 'PAYMENTS', type: ChannelType.GuildCategory });
    const depositsChannel = await guild.channels.create({ name: 'deposits', type: ChannelType.GuildText, parent: paymentsCategory.id });
    this.paymentsChannelId = depositsChannel.id;
    await guild.channels.create({ name: 'withdrawals', type: ChannelType.GuildText, parent: paymentsCategory.id });

    const vipCategory = await guild.channels.create({ name: 'VIP LOUNGE', type: ChannelType.GuildCategory });
    await guild.channels.create({ name: 'diamond-lounge', type: ChannelType.GuildText, parent: vipCategory.id });
    await guild.channels.create({ name: 'platinum-lounge', type: ChannelType.GuildText, parent: vipCategory.id });
    await guild.channels.create({ name: 'gold-lounge', type: ChannelType.GuildText, parent: vipCategory.id });

    const supportCategory = await guild.channels.create({ name: 'SUPPORT', type: ChannelType.GuildCategory });
    await guild.channels.create({ name: 'tickets', type: ChannelType.GuildText, parent: supportCategory.id });
    await guild.channels.create({ name: 'faq', type: ChannelType.GuildText, parent: supportCategory.id });
  }

  private async setupPermissions(guild: Guild): Promise<void> {
    const channels = await guild.channels.fetch();
    const vipChannels = channels.filter(c => c?.name.includes('lounge'));
    const everyoneRole = guild.roles.everyone;
    for (const [, channel] of vipChannels) {
      if (channel && 'permissionOverwrites' in channel) {
        await channel.permissionOverwrites.create(everyoneRole, { ViewChannel: false });
      }
    }
  }

  private setupEventHandlers(): void {
    this.client.on('messageCreate', async (message) => {
      if (message.author.bot) return;
      if (message.content.startsWith('!degen')) {
        await this.handleCommand(message);
      }
    });
  }

  private async handleCommand(message: any): Promise<void> {
    const args = message.content.split(' ').slice(1);
    const command = args[0];
    switch (command) {
      case 'setup':
        await message.reply('Setting up server...');
        await this.setupServer();
        await message.reply('Server setup complete!');
        break;
      case 'balance':
        await message.reply('Visit https://cloutscape.org/dashboard to check your balance');
        break;
      case 'help':
        await this.sendHelpMessage(message);
        break;
    }
  }

  async notifyBigWin(username: string, game: string, betAmount: number, winAmount: number, multiplier: number): Promise<void> {
    if (!this.bigWinsChannelId) return;
    try {
      const channel = await this.client.channels.fetch(this.bigWinsChannelId) as TextChannel;
      const embed = new EmbedBuilder()
        .setColor(0xFFD700)
        .setTitle('MASSIVE WIN!')
        .setDescription(`**${username}** just won big on **${game}**!`)
        .addFields(
          { name: 'Bet', value: `$${betAmount.toFixed(2)}`, inline: true },
          { name: 'Win', value: `$${winAmount.toFixed(2)}`, inline: true },
          { name: 'Multiplier', value: `${multiplier}x`, inline: true },
        )
        .setTimestamp()
        .setFooter({ text: 'Degens Den Casino' });
      await channel.send({ embeds: [embed] });
    } catch (error) {
      console.error('[Discord] Failed to send big win notification:', error);
    }
  }

  async notifyPayment(username: string, type: 'deposit' | 'withdrawal', amount: number, status: 'pending' | 'completed' | 'failed'): Promise<void> {
    if (!this.paymentsChannelId) return;
    try {
      const channel = await this.client.channels.fetch(this.paymentsChannelId) as TextChannel;
      const color = status === 'completed' ? 0x4ECDC4 : status === 'pending' ? 0xFFA500 : 0xFF6B6B;
      const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle(`${type.toUpperCase()} ${status.toUpperCase()}`)
        .addFields(
          { name: 'User', value: username, inline: true },
          { name: 'Amount', value: `$${amount.toFixed(2)}`, inline: true },
          { name: 'Status', value: status.toUpperCase(), inline: true },
        )
        .setTimestamp();
      await channel.send({ embeds: [embed] });
    } catch (error) {
      console.error('[Discord] Failed to send payment notification:', error);
    }
  }

  private async sendHelpMessage(message: any): Promise<void> {
    const embed = new EmbedBuilder()
      .setColor(0xFFD700)
      .setTitle('Degens Den Bot Commands')
      .addFields(
        { name: '!degen balance', value: 'Check your balance (visit site)' },
        { name: '!degen setup', value: 'Setup server (Admin only)' },
        { name: '!degen help', value: 'Show this message' },
      )
      .setFooter({ text: 'Degens Den — Luxury Crypto Casino' });
    await message.reply({ embeds: [embed] });
  }

  async shutdown(): Promise<void> {
    await this.client.destroy();
    console.log('[Discord] Bot shut down');
  }
}

let botInstance: DegensDenDiscordBot | null = null;

export function initializeDiscordBot(token: string, guildId: string): DegensDenDiscordBot {
  if (!botInstance) {
    botInstance = new DegensDenDiscordBot(token, guildId);
  }
  return botInstance;
}

export function getDiscordBot(): DegensDenDiscordBot | null {
  return botInstance;
}
