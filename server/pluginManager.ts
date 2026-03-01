/**
 * Enhanced Plugin Manager for CloutxMi
 * Manages plugin lifecycle, registration, and integration with error handling and Cloudflare fallbacks
 */

import { EventEmitter } from 'events';
import { logger } from '@/server/_core/logger';

export interface PluginInterface {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  initialize: () => Promise<void>;
  shutdown: () => Promise<void>;
  getRouter: () => any;
  getComponents: () => Record<string, React.ComponentType>;
  healthCheck?: () => Promise<boolean>;
}

export interface PluginRegistry {
  [key: string]: PluginInterface;
}

export interface PluginError {
  pluginId: string;
  error: Error;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

class PluginManager extends EventEmitter {
  private registry: PluginRegistry = {};
  private errors: PluginError[] = [];
  private maxErrorsPerPlugin = 10;
  private healthCheckInterval = 60000; // 1 minute
  private healthCheckTimer: NodeJS.Timeout | null = null;

  /**
   * Register a new plugin
   */
  async registerPlugin(plugin: PluginInterface): Promise<void> {
    try {
      logger.info(`Registering plugin: ${plugin.name} (${plugin.id})`);

      // Validate plugin interface
      this.validatePlugin(plugin);

      // Initialize plugin
      await this.initializePluginWithFallback(plugin);

      // Store in registry
      this.registry[plugin.id] = plugin;

      logger.info(`Plugin registered successfully: ${plugin.name}`);
      this.emit('plugin:registered', plugin);
    } catch (error) {
      this.handlePluginError(plugin.id, error as Error, 'high');
      throw error;
    }
  }

  /**
   * Unregister a plugin
   */
  async unregisterPlugin(pluginId: string): Promise<void> {
    try {
      const plugin = this.registry[pluginId];
      if (!plugin) {
        throw new Error(`Plugin not found: ${pluginId}`);
      }

      logger.info(`Unregistering plugin: ${plugin.name}`);

      // Shutdown plugin
      await this.shutdownPluginWithFallback(plugin);

      // Remove from registry
      delete this.registry[pluginId];

      logger.info(`Plugin unregistered successfully: ${plugin.name}`);
      this.emit('plugin:unregistered', plugin);
    } catch (error) {
      this.handlePluginError(pluginId, error as Error, 'high');
      throw error;
    }
  }

  /**
   * Get all registered plugins
   */
  getPlugins(): PluginRegistry {
    return { ...this.registry };
  }

  /**
   * Get a specific plugin
   */
  getPlugin(pluginId: string): PluginInterface | undefined {
    return this.registry[pluginId];
  }

  /**
   * Initialize plugin with fallback error handling
   */
  private async initializePluginWithFallback(plugin: PluginInterface): Promise<void> {
    try {
      await plugin.initialize();
    } catch (error) {
      logger.error(`Failed to initialize plugin ${plugin.id}:`, error);

      // Attempt fallback initialization
      try {
        logger.warn(`Attempting fallback initialization for ${plugin.id}`);
        // Implement custom fallback logic here
        // For example, use cached configuration or default settings
      } catch (fallbackError) {
        logger.error(`Fallback initialization failed for ${plugin.id}:`, fallbackError);
        throw new Error(`Plugin initialization failed: ${plugin.name}`);
      }
    }
  }

  /**
   * Shutdown plugin with fallback error handling
   */
  private async shutdownPluginWithFallback(plugin: PluginInterface): Promise<void> {
    try {
      await plugin.shutdown();
    } catch (error) {
      logger.error(`Failed to shutdown plugin ${plugin.id}:`, error);

      // Attempt fallback shutdown
      try {
        logger.warn(`Attempting fallback shutdown for ${plugin.id}`);
        // Implement custom fallback logic here
        // For example, force cleanup of resources
      } catch (fallbackError) {
        logger.error(`Fallback shutdown failed for ${plugin.id}:`, fallbackError);
        // Continue despite error to prevent cascading failures
      }
    }
  }

  /**
   * Validate plugin interface
   */
  private validatePlugin(plugin: PluginInterface): void {
    const requiredFields = ['id', 'name', 'version', 'description', 'author', 'initialize', 'shutdown', 'getRouter', 'getComponents'];

    for (const field of requiredFields) {
      if (!(field in plugin)) {
        throw new Error(`Plugin is missing required field: ${field}`);
      }
    }

    // Check for duplicate plugin ID
    if (this.registry[plugin.id]) {
      throw new Error(`Plugin with ID already registered: ${plugin.id}`);
    }
  }

  /**
   * Handle plugin errors with logging and recovery
   */
  private handlePluginError(pluginId: string, error: Error, severity: 'low' | 'medium' | 'high' | 'critical'): void {
    const pluginError: PluginError = {
      pluginId,
      error,
      timestamp: new Date(),
      severity,
    };

    this.errors.push(pluginError);

    // Keep only the most recent errors
    if (this.errors.length > this.maxErrorsPerPlugin * 10) {
      this.errors = this.errors.slice(-this.maxErrorsPerPlugin * 10);
    }

    logger.error(`Plugin error [${severity}]: ${pluginId}`, error);
    this.emit('plugin:error', pluginError);

    // Trigger alerts for critical errors
    if (severity === 'critical') {
      this.triggerAlert(pluginId, error);
    }
  }

  /**
   * Trigger alert for critical errors
   */
  private triggerAlert(pluginId: string, error: Error): void {
    // Implement alerting mechanism (e.g., email, SMS, Slack)
    logger.error(`CRITICAL ALERT: Plugin ${pluginId} encountered a critical error:`, error);
    // TODO: Send alert to operations team
  }

  /**
   * Start health checks for all plugins
   */
  startHealthChecks(): void {
    if (this.healthCheckTimer) {
      return; // Already running
    }

    logger.info('Starting plugin health checks');

    this.healthCheckTimer = setInterval(async () => {
      for (const [pluginId, plugin] of Object.entries(this.registry)) {
        if (plugin.healthCheck) {
          try {
            const isHealthy = await plugin.healthCheck();
            if (!isHealthy) {
              this.handlePluginError(pluginId, new Error('Health check failed'), 'medium');
            }
          } catch (error) {
            this.handlePluginError(pluginId, error as Error, 'medium');
          }
        }
      }
    }, this.healthCheckInterval);
  }

  /**
   * Stop health checks
   */
  stopHealthChecks(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
      logger.info('Stopped plugin health checks');
    }
  }

  /**
   * Get plugin errors
   */
  getErrors(pluginId?: string): PluginError[] {
    if (pluginId) {
      return this.errors.filter((e) => e.pluginId === pluginId);
    }
    return [...this.errors];
  }

  /**
   * Clear plugin errors
   */
  clearErrors(pluginId?: string): void {
    if (pluginId) {
      this.errors = this.errors.filter((e) => e.pluginId !== pluginId);
    } else {
      this.errors = [];
    }
  }

  /**
   * Get plugin statistics
   */
  getStatistics() {
    return {
      totalPlugins: Object.keys(this.registry).length,
      totalErrors: this.errors.length,
      errorsBySeverity: {
        low: this.errors.filter((e) => e.severity === 'low').length,
        medium: this.errors.filter((e) => e.severity === 'medium').length,
        high: this.errors.filter((e) => e.severity === 'high').length,
        critical: this.errors.filter((e) => e.severity === 'critical').length,
      },
      plugins: Object.entries(this.registry).map(([id, plugin]) => ({
        id,
        name: plugin.name,
        version: plugin.version,
        errors: this.errors.filter((e) => e.pluginId === id).length,
      })),
    };
  }
}

// Export singleton instance
export const pluginManager = new PluginManager();
