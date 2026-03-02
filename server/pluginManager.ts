
import * as path from 'path';
import * as fs from 'fs/promises';

/**
 * Plugin Manager - Handles dynamic loading of casino plugins
 */
export class PluginManager {
  private plugins: any[] = [];
  private pluginPath: string;

  constructor(pluginPath: string) {
    this.pluginPath = pluginPath;
  }

  /**
   * Load all plugins from the specified directory
   */
  async loadPlugins() {
    try {
      // Ensure plugin directory exists
      try {
        await fs.access(this.pluginPath);
      } catch {
        await fs.mkdir(this.pluginPath, { recursive: true });
        return;
      }

      const entries = await fs.readdir(this.pluginPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const pluginMain = path.join(this.pluginPath, entry.name, 'index.ts');
          try {
            await fs.access(pluginMain);
            // In production, we'd dynamically import here.
            // For now, we'll log the discovery.
            console.log(`[PluginManager] Discovered plugin: ${entry.name}`);
          } catch {
            // No main entry point found for this directory
          }
        }
      }
    } catch (error) {
      console.error("[PluginManager] Error loading plugins:", error);
    }
  }

  /**
   * Get tRPC routers from all loaded plugins
   */
  getPluginRouters() {
    return this.plugins.map(p => p.router).filter(Boolean);
  }

  /**
   * Gracefully shutdown all plugins
   */
  async shutdownPlugins() {
    for (const plugin of this.plugins) {
      if (typeof plugin.shutdown === 'function') {
        await plugin.shutdown();
      }
    }
  }
}
