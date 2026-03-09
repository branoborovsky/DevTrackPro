import { info, error, warn, debug, trace } from '@tauri-apps/plugin-log';

export const logger = {
  info: (message: string) => info(message),
  error: (message: string) => error(message),
  warn: (message: string) => warn(message),
  debug: (message: string) => debug(message),
  trace: (message: string) => trace(message),
};

export const logError = (err: any, context?: string) => {
  const message = context ? `[${context}] ${err?.message || err}` : (err?.message || err);
  console.error(message, err);
  error(message);
};

export const logInfo = (message: string) => {
  console.log(message);
  info(message);
};
