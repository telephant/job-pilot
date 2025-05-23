import debug from 'debug';

// Base namespace for all debug logs
const BASE_NAMESPACE = 'job-pilot';

// Debug logger interface
export interface Logger {
  // Basic logging
  log: debug.Debugger;
  // Error logging
  error: debug.Debugger;
}

// Create namespaced loggers for different modules
export const auth: Logger = {
  log: debug(`${BASE_NAMESPACE}:auth`),
  error: debug(`${BASE_NAMESPACE}:auth:error`)
};

export const token: Logger = {
  log: debug(`${BASE_NAMESPACE}:token`),
  error: debug(`${BASE_NAMESPACE}:token:error`)
};

export const email: Logger = {
  log: debug(`${BASE_NAMESPACE}:email`),
  error: debug(`${BASE_NAMESPACE}:email:error`)
};

export const server: Logger = {
  log: debug(`${BASE_NAMESPACE}:server`),
  error: debug(`${BASE_NAMESPACE}:server:error`)
};

export const main: Logger = {
  log: debug(`${BASE_NAMESPACE}:main`),
  error: debug(`${BASE_NAMESPACE}:main:error`)
};

export const scraper: Logger = {
  log: debug(`${BASE_NAMESPACE}:scraper`),
  error: debug(`${BASE_NAMESPACE}:scraper:error`)
};

export const generator: Logger = {
  log: debug(`${BASE_NAMESPACE}:generator`),
  error: debug(`${BASE_NAMESPACE}:generator:error`)
};

// General error logger
export const error = debug(`${BASE_NAMESPACE}:error`);

/**
 * Enable debug logs by default if no DEBUG environment variable is set
 */
export function setupDebug(): void {
  if (!process.env.DEBUG) {
    debug.enable(`${BASE_NAMESPACE}:*`);
  }
}

/**
 * Create a custom logger with a specific namespace
 * @param namespace The namespace for this logger
 * @returns A logger object with log and error methods
 */
export function createLogger(namespace: string): Logger {
  return {
    log: debug(`${BASE_NAMESPACE}:${namespace}`),
    error: debug(`${BASE_NAMESPACE}:${namespace}:error`)
  };
}

export default {
  auth,
  token,
  email,
  server,
  main,
  scraper,
  generator,
  error,
  setupDebug,
  createLogger
}; 