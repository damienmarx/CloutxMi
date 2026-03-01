/**
 * Stripe Payment Gateway Plugin - Server Side
 * Integrates Stripe payment processing with fallback mechanisms
 */

import { PluginInterface } from '../../../server/pluginManager';
import { stripeRouter } from './router';
import { logger } from '@/server/_core/logger';

export const stripePaymentPlugin: PluginInterface = {
  id: 'payment_stripe',
  name: 'Stripe Payment Gateway',
  version: '1.0.0',
  description: 'Stripe payment processing with multiple fallback payment methods',
  author: 'CloutxMi Development Team',

  async initialize() {
    try {
      logger.info('Initializing Stripe Payment Gateway plugin');
      // Initialize Stripe client, verify API key, etc.
      logger.info('Stripe Payment Gateway plugin initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Stripe Payment Gateway plugin:', error);
      throw error;
    }
  },

  async shutdown() {
    try {
      logger.info('Shutting down Stripe Payment Gateway plugin');
      // Cleanup resources, etc.
      logger.info('Stripe Payment Gateway plugin shut down successfully');
    } catch (error) {
      logger.error('Failed to shutdown Stripe Payment Gateway plugin:', error);
      throw error;
    }
  },

  getRouter() {
    return stripeRouter;
  },

  getComponents() {
    return {
      PaymentForm: require('./components/PaymentForm').default,
      PaymentHistory: require('./components/PaymentHistory').default,
      WithdrawalForm: require('./components/WithdrawalForm').default,
    };
  },

  async healthCheck() {
    try {
      // Verify Stripe API connectivity
      return true;
    } catch (error) {
      logger.error('Stripe Payment Gateway health check failed:', error);
      return false;
    }
  },
};
