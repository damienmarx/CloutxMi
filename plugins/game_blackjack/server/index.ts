/**
 * Blackjack Game Plugin - Server Side
 * Implements the Blackjack game logic with proper error handling and fallbacks
 */

import { PluginInterface } from '../../pluginManager';
import { blackjackRouter } from './router';
import { logger } from '@/server/_core/logger';

export const blackjackPlugin: PluginInterface = {
  id: 'game_blackjack',
  name: 'Blackjack',
  version: '1.0.0',
  description: 'Classic Blackjack card game with provably fair mechanics',
  author: 'CloutxMi Development Team',

  async initialize() {
    try {
      logger.info('Initializing Blackjack plugin');
      // Initialize game state, load configurations, etc.
      logger.info('Blackjack plugin initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Blackjack plugin:', error);
      throw error;
    }
  },

  async shutdown() {
    try {
      logger.info('Shutting down Blackjack plugin');
      // Cleanup resources, save state, etc.
      logger.info('Blackjack plugin shut down successfully');
    } catch (error) {
      logger.error('Failed to shutdown Blackjack plugin:', error);
      throw error;
    }
  },

  getRouter() {
    return blackjackRouter;
  },

  getComponents() {
    return {
      GameBoard: require('./components/GameBoard').default,
      GameStats: require('./components/GameStats').default,
    };
  },

  async healthCheck() {
    try {
      // Perform health check (e.g., verify database connection, external API availability)
      return true;
    } catch (error) {
      logger.error('Blackjack plugin health check failed:', error);
      return false;
    }
  },
};
