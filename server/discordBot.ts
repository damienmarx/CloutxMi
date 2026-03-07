import { Client, GatewayIntentBits, TextChannel, EmbedBuilder, ChannelType, PermissionFlagsBits } from 'discord.js';
import type { Guild } from 'discord.js';

/**
 * Degens¤Den Discord Bot
 * Automated server setup, big wins notifications, payments
 */

export class Degens¤DenDiscordBot {
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
        GatewayIntentBits.GuildMembers
      ]
    });
  }

  /**
   * Initialize and login bot
   */
  async initialize(): Promise<void> {
    try {
      await this.client.login(this.token);
      console.log(`✅ Degens¤Den Discord Bot logged in as ${this.client.user?.tag}`);
      
      this.client.once('ready', async () => {
        console.log('🤖 Bot is ready!');
        await this.setupServer();
      });
      
      this.setupEventHandlers();
    } catch (error) {
      console.error('❌ Failed to initialize Discord bot:', error);
      throw error;
    }
  }

  /**
   * Automated server setup - wipes and recreates channels/roles
   */
  async setupServer(): Promise<void> {
    try {
      const guild = await this.client.guilds.fetch(this.guildId);
      
      console.log('🔧 Setting up Degens¤Den Discord server...');
      
      // Delete old channels (except system channels)
      await this.cleanupOldChannels(guild);
      
      // Create role structure
      await this.createRoles(guild);
      
      // Create channel categories and channels
      await this.createChannelStructure(guild);
      
      // Set up permissions
      await this.setupPermissions(guild);
      
      console.log('✅ Degens¤Den Discord server setup complete!');
    } catch (error) {
      console.error('❌ Server setup failed:', error);
      throw error;
    }
  }

  /**
   * Clean up old channels
   */
  private async cleanupOldChannels(guild: Guild): Promise<void> {
    const channels = await guild.channels.fetch();
    
    for (const [id, channel] of channels) {
      if (channel && channel.type !== ChannelType.GuildCategory) {
        try {
          if (!channel.name.includes('system') && !channel.name.includes('rules')) {
            await channel.delete('Degens¤Den server restructure');
            console.log(`🗑️  Deleted channel: ${channel.name}`);
          }
        } catch (error) {
          console.error(`Failed to delete channel ${channel?.name}:`, error);
        }
      }
    }
    
    // Delete categories
    for (const [id, channel] of channels) {
      if (channel && channel.type === ChannelType.GuildCategory) {
        try {
          await channel.delete('Degens¤Den server restructure');
          console.log(`🗑️  Deleted category: ${channel.name}`);
        } catch (error) {
          console.error(`Failed to delete category ${channel?.name}:`, error);
        }
      }
    }
  }

  /**
   * Create luxury themed roles
   */
  private async createRoles(guild: Guild): Promise<void> {
    const roles = [
      { name: '👑 Owner', color: 0xFFD700, permissions: [PermissionFlagsBits.Administrator] },
      { name: '💎 Diamond VIP', color: 0xB9F2FF, permissions: [] },
      { name: '🌟 Platinum VIP', color: 0xE5E4E2, permissions: [] },
      { name: '🥇 Gold VIP', color: 0xFFD700, permissions: [] },
      { name: '🥈 Silver VIP', color: 0xC0C0C0, permissions: [] },
      { name: '🥉 Bronze VIP', color: 0xCD7F32, permissions: [] },
      { name: '🎰 High Roller', color: 0xFF6B6B, permissions: [] },
      { name: '🎲 Player', color: 0x4ECDC4, permissions: [] },
      { name: '🤖 Bot', color: 0x7289DA, permissions: [] }
    ];

    for (const roleData of roles) {
      try {
        const existingRole = guild.roles.cache.find(r => r.name === roleData.name);
        if (!existingRole) {
          await guild.roles.create({
            name: roleData.name,
            color: roleData.color,
            permissions: roleData.permissions as any,
            hoist: true
          });
          console.log(`✅ Created role: ${roleData.name}`);
        }
      } catch (error) {
        console.error(`Failed to create role ${roleData.name}:`, error);
      }
    }
  }

  /**
   * Create channel structure matching Degens¤Den theme
   */
  private async createChannelStructure(guild: Guild): Promise<void> {
    // 📢 Information Category
    const infoCategory = await guild.channels.create({
      name: '📢・INFORMATION',
      type: ChannelType.GuildCategory
    });

    await guild.channels.create({
      name: '📜・rules',
      type: ChannelType.GuildText,
      parent: infoCategory.id,
      topic: 'Server rules and guidelines'
    });

    await guild.channels.create({
      name: '📣・announcements',
      type: ChannelType.GuildText,
      parent: infoCategory.id,
      topic: 'Important Degens¤Den updates'
    }).then(channel => {
      this.announcementsChannelId = channel.id;
    });

    await guild.channels.create({
      name: '🎯・how-to-play',
      type: ChannelType.GuildText,
      parent: infoCategory.id,
      topic: 'Game guides and tutorials'
    });

    // 🎰 Casino Category
    const casinoCategory = await guild.channels.create({
      name: '🎰・CASINO',
      type: ChannelType.GuildCategory
    });

    await guild.channels.create({
      name: '💬・general-chat',
      type: ChannelType.GuildText,
      parent: casinoCategory.id,
      topic: 'General casino discussion'
    });

    await guild.channels.create({
      name: '🏆・big-wins',
      type: ChannelType.GuildText,
      parent: casinoCategory.id,
      topic: 'Celebrate your massive wins!'
    }).then(channel => {
      this.bigWinsChannelId = channel.id;
    });

    await guild.channels.create({
      name: '📊・leaderboards',
      type: ChannelType.GuildText,
      parent: casinoCategory.id,
      topic: 'Top players and statistics'
    });

    await guild.channels.create({
      name: '🎲・strategy',
      type: ChannelType.GuildText,
      parent: casinoCategory.id,
      topic: 'Share winning strategies'
    });

    // 💰 Payments Category
    const paymentsCategory = await guild.channels.create({
      name: '💰・PAYMENTS',
      type: ChannelType.GuildCategory
    });

    await guild.channels.create({
      name: '💳・deposits',
      type: ChannelType.GuildText,
      parent: paymentsCategory.id,
      topic: 'Deposit funds to your account'
    }).then(channel => {
      this.paymentsChannelId = channel.id;
    });

    await guild.channels.create({
      name: '💸・withdrawals',
      type: ChannelType.GuildText,
      parent: paymentsCategory.id,
      topic: 'Withdraw your winnings'
    });

    await guild.channels.create({
      name: '🎁・rain-drops',
      type: ChannelType.GuildText,
      parent: paymentsCategory.id,
      topic: 'Random reward distributions'
    });

    // 👑 VIP Category
    const vipCategory = await guild.channels.create({
      name: '👑・VIP LOUNGE',
      type: ChannelType.GuildCategory
    });

    await guild.channels.create({
      name: '💎・diamond-lounge',
      type: ChannelType.GuildText,
      parent: vipCategory.id,
      topic: 'Exclusive for Diamond VIPs'
    });

    await guild.channels.create({
      name: '🌟・platinum-lounge',
      type: ChannelType.GuildText,
      parent: vipCategory.id,
      topic: 'Exclusive for Platinum VIPs'
    });

    await guild.channels.create({
      name: '🥇・gold-lounge',
      type: ChannelType.GuildText,
      parent: vipCategory.id,
      topic: 'Exclusive for Gold VIPs'
    });

    // 🎧 Voice Category
    const voiceCategory = await guild.channels.create({
      name: '🎧・VOICE CHANNELS',
      type: ChannelType.GuildCategory
    });

    await guild.channels.create({
      name: '🎤・General Voice',
      type: ChannelType.GuildVoice,
      parent: voiceCategory.id
    });

    await guild.channels.create({
      name: '👑・VIP Voice',
      type: ChannelType.GuildVoice,
      parent: voiceCategory.id
    });

    // 🛠️ Support Category
    const supportCategory = await guild.channels.create({
      name: '🛠️・SUPPORT',
      type: ChannelType.GuildCategory
    });

    await guild.channels.create({
      name: '🎫・tickets',
      type: ChannelType.GuildText,
      parent: supportCategory.id,
      topic: 'Open a support ticket'
    });

    await guild.channels.create({
      name: '❓・faq',
      type: ChannelType.GuildText,
      parent: supportCategory.id,
      topic: 'Frequently asked questions'
    });

    console.log('✅ All channels created successfully');
  }

  /**
   * Setup channel permissions
   */
  private async setupPermissions(guild: Guild): Promise<void> {
    // VIP lounges - restrict to VIP roles
    const channels = await guild.channels.fetch();
    
    const vipChannels = channels.filter(c => c?.name.includes('lounge'));
    const everyoneRole = guild.roles.everyone;
    
    for (const [id, channel] of vipChannels) {
      if (channel && 'permissionOverwrites' in channel) {
        await channel.permissionOverwrites.create(everyoneRole, {
          ViewChannel: false
        });
        console.log(`🔒 Locked ${channel.name} for non-VIPs`);
      }
    }
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    this.client.on('messageCreate', async (message) => {
      if (message.author.bot) return;
      
      // Command handling
      if (message.content.startsWith('!clout')) {
        await this.handleCommand(message);
      }
    });
  }

  /**
   * Handle bot commands
   */
  private async handleCommand(message: any): Promise<void> {
    const args = message.content.split(' ').slice(1);
    const command = args[0];

    switch (command) {
      case 'setup':
        await message.reply('🔧 Setting up server...');
        await this.setupServer();
        await message.reply('✅ Server setup complete!');
        break;
      
      case 'balance':
        // TODO: Integrate with wallet API
        await message.reply('💰 Your balance: $0.00');
        break;
      
      case 'deposit':
        await this.sendDepositInfo(message);
        break;
      
      case 'help':
        await this.sendHelpMessage(message);
        break;
    }
  }

  /**
   * Send big win notification
   */
  async notifyBigWin(
    username: string,
    game: string,
    betAmount: number,
    winAmount: number,
    multiplier: number
  ): Promise<void> {
    if (!this.bigWinsChannelId) return;

    try {
      const channel = await this.client.channels.fetch(this.bigWinsChannelId) as TextChannel;
      
      const embed = new EmbedBuilder()
        .setColor(0xFFD700)
        .setTitle('🎰 MASSIVE WIN! 🎰')
        .setDescription(`**${username}** just won BIG on **${game}**!`)
        .addFields(
          { name: '💰 Bet Amount', value: `$${betAmount.toFixed(2)}`, inline: true },
          { name: '🏆 Win Amount', value: `$${winAmount.toFixed(2)}`, inline: true },
          { name: '📈 Multiplier', value: `${multiplier}x`, inline: true }
        )
        .setThumbnail('https://em-content.zobj.net/thumbs/160/microsoft/319/money-bag_1f4b0.png')
        .setTimestamp()
        .setFooter({ text: 'Degens¤Den Casino' });

      await channel.send({ embeds: [embed] });
    } catch (error) {
      console.error('Failed to send big win notification:', error);
    }
  }

  /**
   * Send deposit information
   */
  private async sendDepositInfo(message: any): Promise<void> {
    const embed = new EmbedBuilder()
      .setColor(0x4ECDC4)
      .setTitle('💳 Deposit Funds')
      .setDescription('Deposit to your Degens¤Den wallet:')
      .addFields(
        { name: 'Website', value: '[Visit Degens¤Den](https://degensden.org/dashboard)' },
        { name: 'Manual Payment', value: 'Contact <@OWNER_ID> for manual deposits' },
        { name: 'Supported Methods', value: 'Crypto, Bank Transfer, OSRS GP' }
      )
      .setFooter({ text: 'Deposits are instant' });

    await message.reply({ embeds: [embed] });
  }

  /**
   * Send help message
   */
  private async sendHelpMessage(message: any): Promise<void> {
    const embed = new EmbedBuilder()
      .setColor(0xFFD700)
      .setTitle('🎰 Degens¤Den Bot Commands')
      .setDescription('Available commands:')
      .addFields(
        { name: '!clout balance', value: 'Check your balance' },
        { name: '!clout deposit', value: 'Get deposit information' },
        { name: '!clout setup', value: 'Setup server (Admin only)' },
        { name: '!clout help', value: 'Show this message' }
      )
      .setFooter({ text: 'Degens¤Den - Luxury Crypto Casino' });

    await message.reply({ embeds: [embed] });
  }

  /**
   * Send payment notification
   */
  async notifyPayment(
    username: string,
    type: 'deposit' | 'withdrawal',
    amount: number,
    status: 'pending' | 'completed' | 'failed'
  ): Promise<void> {
    if (!this.paymentsChannelId) return;

    try {
      const channel = await this.client.channels.fetch(this.paymentsChannelId) as TextChannel;
      
      const color = status === 'completed' ? 0x4ECDC4 : status === 'pending' ? 0xFFA500 : 0xFF6B6B;
      const emoji = type === 'deposit' ? '💳' : '💸';
      
      const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle(`${emoji} ${type.toUpperCase()} ${status.toUpperCase()}`)
        .addFields(
          { name: 'User', value: username, inline: true },
          { name: 'Amount', value: `$${amount.toFixed(2)}`, inline: true },
          { name: 'Status', value: status.toUpperCase(), inline: true }
        )
        .setTimestamp();

      await channel.send({ embeds: [embed] });
    } catch (error) {
      console.error('Failed to send payment notification:', error);
    }
  }

  /**
   * Shutdown bot
   */
  async shutdown(): Promise<void> {
    await this.client.destroy();
    console.log('🛑 Degens¤Den Discord Bot shut down');
  }
}

// Export singleton instance
let botInstance: Degens¤DenDiscordBot | null = null;

export function initializeDiscordBot(token: string, guildId: string): Degens¤DenDiscordBot {
  if (!botInstance) {
    botInstance = new Degens¤DenDiscordBot(token, guildId);
  }
  return botInstance;
}

export function getDiscordBot(): Degens¤DenDiscordBot | null {
  return botInstance;
}
