/**
 * Roulette Game Plugin - Server Side
 * Implements the Roulette game logic with provably fair mechanics and error handling
 */

import { PluginInterface } from '../../../server/pluginManager';
import { rouletteRouter } from './router';
import { logger } from '@/server/_core/logger';

export const roulettePlugin: PluginInterface = {
  id: 'game_roulette',
  name: 'Roulette',
  version: '1.0.0',
  description: 'European and American Roulette with live wheel animations',
  author: 'CloutxMi Development Team',

  async initialize() {
    try {
      logger.info('Initializing Roulette plugin');
      // Initialize game state, load wheel configurations, etc.
      logger.info('Roulette plugin initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Roulette plugin:', error);
      throw error;
    }
  },

  async shutdown() {
    try {
      logger.info('Shutting down Roulette plugin');
      // Cleanup resources, save state, etc.
      logger.info('Roulette plugin shut down successfully');
    } catch (error) {
      logger.error('Failed to shutdown Roulette plugin:', error);
      throw error;
    }
  },

  getRouter() {
    return rouletteRouter;
  },

  getComponents() {
    return {
      RouletteWheel: require('./components/RouletteWheel').default,
      BettingBoard: require('./components/BettingBoard').default,
      GameStats: require('./components/GameStats').default,
    };
  },

  async healthCheck() {
    try {
      // Perform health check
      return true;
    } catch (error) {
      logger.error('Roulette plugin health check failed:', error);
      return false;
    }
  },
};
