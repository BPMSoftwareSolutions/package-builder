/**
 * Conductor - Orchestration Engine
 * Manages plugin lifecycle, symphony execution, and event coordination
 */

import {
  ConductorConfig,
  PluginMetadata,
  Symphony,
  Movement,
  Beat,
  Sequence,
  ConductorEvent,
  EventListener,
  ConductorMetrics
} from './types.js';

export class Conductor {
  private config: ConductorConfig;
  private plugins: Map<string, PluginMetadata> = new Map();
  private sequences: Map<string, Sequence> = new Map();
  private symphonies: Map<string, Symphony> = new Map();
  private eventListeners: EventListener[] = [];
  private metrics: ConductorMetrics = {
    totalSymphonies: 0,
    completedSymphonies: 0,
    failedSymphonies: 0,
    activeMovements: 0,
    completedBeats: 0,
    failedBeats: 0,
    avgBeatDuration: 0,
    totalPluginsLoaded: 0,
    pluginErrors: {}
  };

  constructor(config: ConductorConfig) {
    this.config = {
      timeout: 30000,
      retryAttempts: 3,
      ...config
    };
  }

  /**
   * Initialize the conductor and load plugins
   */
  async play(): Promise<void> {
    console.log('🎼 Conductor starting orchestration...');
    
    for (const pluginName of this.config.plugins) {
      await this.loadPlugin(pluginName);
    }
    
    console.log('✅ All plugins loaded');
    this.emit({
      type: 'plugin:loaded',
      timestamp: new Date()
    });
  }

  /**
   * Load a plugin
   */
  private async loadPlugin(pluginName: string): Promise<void> {
    try {
      console.log(`📦 Loading plugin: ${pluginName}`);
      
      const metadata: PluginMetadata = {
        name: pluginName,
        version: '1.0.0',
        loaded: true,
        loadedAt: new Date()
      };
      
      this.plugins.set(pluginName, metadata);
      this.metrics.totalPluginsLoaded++;
      
      this.emit({
        type: 'plugin:loaded',
        pluginId: pluginName,
        timestamp: new Date()
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error(`❌ Failed to load plugin ${pluginName}:`, err);
      
      this.metrics.pluginErrors[pluginName] = (this.metrics.pluginErrors[pluginName] || 0) + 1;
      
      this.emit({
        type: 'plugin:error',
        pluginId: pluginName,
        error: err,
        timestamp: new Date()
      });
    }
  }

  /**
   * Get a loaded plugin
   */
  getPlugin(name: string): PluginMetadata | undefined {
    return this.plugins.get(name);
  }

  /**
   * Register a sequence
   */
  registerSequence(sequence: Sequence): void {
    this.sequences.set(`${sequence.pluginId}:${sequence.id}`, sequence);
  }

  /**
   * Execute a symphony
   */
  async executeSymphony(symphony: Symphony): Promise<Symphony> {
    this.metrics.totalSymphonies++;
    
    this.emit({
      type: 'symphony:start',
      symphonyId: symphony.id,
      timestamp: new Date()
    });

    try {
      symphony.status = 'running';
      
      for (const movement of symphony.movements) {
        await this.executeMovement(movement, symphony.id);
      }
      
      symphony.status = 'completed';
      symphony.completedAt = new Date();
      this.metrics.completedSymphonies++;
      
      this.emit({
        type: 'symphony:complete',
        symphonyId: symphony.id,
        timestamp: new Date()
      });
    } catch (error) {
      symphony.status = 'failed';
      symphony.completedAt = new Date();
      this.metrics.failedSymphonies++;
      
      const err = error instanceof Error ? error : new Error(String(error));
      this.emit({
        type: 'symphony:error',
        symphonyId: symphony.id,
        error: err,
        timestamp: new Date()
      });
    }

    this.symphonies.set(symphony.id, symphony);
    return symphony;
  }

  /**
   * Execute a movement
   */
  private async executeMovement(movement: Movement, symphonyId: string): Promise<void> {
    this.metrics.activeMovements++;
    
    this.emit({
      type: 'movement:start',
      symphonyId: symphonyId,
      movementId: movement.id,
      timestamp: new Date()
    });

    try {
      movement.status = 'running';
      
      for (const beat of movement.beats) {
        await this.executeBeat(beat, symphonyId, movement.id);
      }
      
      movement.status = 'completed';
      
      this.emit({
        type: 'movement:complete',
        symphonyId: symphonyId,
        movementId: movement.id,
        timestamp: new Date()
      });
    } catch (error) {
      movement.status = 'failed';
      
      const err = error instanceof Error ? error : new Error(String(error));
      this.emit({
        type: 'movement:error',
        symphonyId: symphonyId,
        movementId: movement.id,
        error: err,
        timestamp: new Date()
      });
    } finally {
      this.metrics.activeMovements--;
    }
  }

  /**
   * Execute a beat
   */
  private async executeBeat(beat: Beat, symphonyId: string, movementId: string): Promise<void> {
    const startTime = Date.now();
    
    this.emit({
      type: 'beat:start',
      symphonyId: symphonyId,
      movementId: movementId,
      beatId: beat.id,
      timestamp: new Date()
    });

    try {
      beat.status = 'running';
      
      const sequenceKey = `${beat.pluginId}:${beat.sequenceId}`;
      const sequence = this.sequences.get(sequenceKey);
      
      if (!sequence) {
        throw new Error(`Sequence not found: ${sequenceKey}`);
      }
      
      beat.result = await sequence.handler(beat.data);
      beat.status = 'completed';
      this.metrics.completedBeats++;
      
      this.emit({
        type: 'beat:complete',
        symphonyId: symphonyId,
        movementId: movementId,
        beatId: beat.id,
        timestamp: new Date()
      });
    } catch (error) {
      beat.status = 'failed';
      this.metrics.failedBeats++;
      
      const err = error instanceof Error ? error : new Error(String(error));
      beat.error = err;
      
      this.emit({
        type: 'beat:error',
        symphonyId: symphonyId,
        movementId: movementId,
        beatId: beat.id,
        error: err,
        timestamp: new Date()
      });
    } finally {
      beat.duration = Date.now() - startTime;
    }
  }

  /**
   * Register an event listener
   */
  on(listener: EventListener): void {
    this.eventListeners.push(listener);
  }

  /**
   * Emit an event
   */
  private emit(event: ConductorEvent): void {
    for (const listener of this.eventListeners) {
      listener(event);
    }
  }

  /**
   * Get conductor metrics
   */
  getMetrics(): ConductorMetrics {
    return { ...this.metrics };
  }

  /**
   * Get a symphony by ID
   */
  getSymphony(id: string): Symphony | undefined {
    return this.symphonies.get(id);
  }
}

/**
 * Factory function to create a conductor
 */
export function createConductor(config: ConductorConfig): Conductor {
  return new Conductor(config);
}

