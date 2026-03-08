/**
 * Deployment Configuration Module
 * 
 * Determines deployment mode (cloud vs local) from environment variables.
 * All mode-dependent behavior reads from this single source of truth.
 * 
 * IMPORTANT: This module does NOT change any UI, logic, or business behavior.
 * It only provides configuration values that differ between deployment modes.
 */

export type DeploymentMode = 'cloud' | 'local';

interface DeploymentConfig {
  mode: DeploymentMode;
  appTitle: string;
  /** Base URL for any future API endpoints */
  apiBaseUrl: string;
  /** Storage mode: 'cloud' for remote storage, 'local' for browser/file storage */
  storageMode: 'cloud' | 'local';
  /** Authentication mode: 'cloud' for cloud auth, 'local' for simplified local auth */
  authMode: 'cloud' | 'local' | 'none';
  /** Whether the app requires internet connectivity for core features */
  requiresInternet: boolean;
  /** Base path for data files */
  dataBasePath: string;
  /** Port the app runs on */
  port: number;
}

function resolveConfig(): DeploymentConfig {
  const mode = (import.meta.env.VITE_DEPLOYMENT_MODE as DeploymentMode) || 'cloud';
  
  const baseConfig: DeploymentConfig = {
    mode,
    appTitle: import.meta.env.VITE_APP_TITLE || 'HR Analytics Dashboard',
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '',
    storageMode: mode === 'local' ? 'local' : 'cloud',
    authMode: (import.meta.env.VITE_AUTH_MODE as DeploymentConfig['authMode']) || (mode === 'local' ? 'none' : 'cloud'),
    requiresInternet: mode !== 'local',
    dataBasePath: import.meta.env.VITE_DATA_BASE_PATH || '/data',
    port: parseInt(import.meta.env.VITE_PORT || '8080', 10),
  };

  return baseConfig;
}

/** Singleton deployment config – imported wherever mode-aware behavior is needed */
export const deploymentConfig = resolveConfig();

/** Convenience helpers */
export const isLocalMode = () => deploymentConfig.mode === 'local';
export const isCloudMode = () => deploymentConfig.mode === 'cloud';
