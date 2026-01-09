const MAX_LOGS = 1000;

type Level = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  ts: string;
  level: Level;
  msg: string;
  meta?: any;
}

const envDebug = process.env.REACT_APP_DEBUG_LOGS === 'true';
const forceApprove = process.env.REACT_APP_FORCE_APPROVE === 'true';
export const LOG_ENABLED = envDebug || forceApprove;

let buffer: LogEntry[] = [];

const persist = () => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem('bt:logs', JSON.stringify(buffer.slice(-MAX_LOGS)));
    }
  } catch (err) {
    // ignore
  }
};

const push = (level: Level, msg: string, meta?: any) => {
  const entry: LogEntry = { ts: new Date().toISOString(), level, msg, meta };
  buffer.push(entry);
  if (buffer.length > MAX_LOGS) buffer = buffer.slice(-MAX_LOGS);
  try {
    if (LOG_ENABLED && typeof console !== 'undefined') {
      const fn = console[level] || console.log;
      fn(`[BT][${level.toUpperCase()}] ${entry.ts} — ${msg}`, meta || '');
    }
  } catch (err) {
    // ignore console failures
  }
  persist();
};

export const logger = {
  debug: (msg: string, meta?: any) => push('debug', msg, meta),
  info: (msg: string, meta?: any) => push('info', msg, meta),
  warn: (msg: string, meta?: any) => push('warn', msg, meta),
  error: (msg: string, meta?: any) => push('error', msg, meta),
  getLogs: () => buffer.slice(),
  clear: () => { buffer = []; persist(); }
};

export default logger;
