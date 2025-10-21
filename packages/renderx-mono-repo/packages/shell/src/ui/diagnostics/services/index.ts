/**
 * Diagnostics Services
 * 
 * Barrel export for all diagnostics services.
 * These services handle data fetching, processing, and business logic
 * for the diagnostics panel.
 * 
 * @see docs/refactoring/diagnostics-modularity-strategy.md
 */

// Manifest Service
export {
  loadPluginManifest,
  isValidManifest,
  getPluginById,
  getPluginIds,
  filterPlugins
} from './manifest.service';

// Plugin Enrichment Service
export {
  loadPluginSequences,
  enrichPluginData,
  enrichAllPlugins
} from './plugin-enrichment.service';

// Conductor Service
export {
  introspectConductor,
  getMountedPluginIds,
  getDiscoveredPlugins,
  getRuntimeMountedSeqIds,
  getSequenceCatalogDirs,
  isPluginMounted,
  isSequenceMounted
} from './conductor.service';

// Stats Service
export {
  loadInteractionManifestData,
  loadTopicsManifestData,
  loadPluginManifestData,
  loadComponentsData,
  aggregateAllStats,
  calculateSummaryStats,
  formatLoadingTime,
  calculateAverageLoadTime,
  calculateSuccessRate
} from './stats.service';

// Log Parser Service
export {
  parseLog,
  calculateExecutionStats,
  exportAsJson
} from './log-parser.service';

// Log Converter Service
export {
  convertLogToJson,
  loadLogFile,
  getLogFiles
} from './log-converter.service';

// Sequence Execution Service
export {
  getConductor,
  isConductorAvailable,
  getAvailableSequences,
  executeSequence,
  generateRequestId,
  validateParameters,
  convertToHistoryItem,
  getSequenceMetadata
} from './sequence-execution.service';

