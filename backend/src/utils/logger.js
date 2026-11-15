const { config } = require('../config/env');

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'authorization',
  'bearer',
  'secret',
  'cookie',
  'creditcard',
  'cardnumber',
  'cvv',
  'jwt'
]);

function redactObject(obj, depth = 0) {
  if (!obj || typeof obj !== 'object' || depth > 6) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => redactObject(item, depth + 1));
  }

  if (obj instanceof Error) {
    return {
      name: obj.name,
      message: obj.message,
      stack: obj.stack,
      ...(obj.statusCode ? { statusCode: obj.statusCode } : {}),
      ...(obj.details ? { details: redactObject(obj.details, depth + 1) } : {})
    };
  }

  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.has(lowerKey)) {
      result[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      result[key] = redactObject(value, depth + 1);
    } else {
      result[key] = value;
    }
  }
  return result;
}

class Logger {
  constructor(options = {}) {
    this.minLevel = options.level || (config?.NODE_ENV === 'production' ? 'info' : 'debug');
    this.format = options.format || (config?.NODE_ENV === 'production' ? 'json' : 'pretty');
    this.outputStream = options.outputStream || process.stdout;
    this.errorStream = options.errorStream || process.stderr;
  }

  shouldLog(level) {
    const currentWeight = LOG_LEVELS[this.minLevel] ?? 1;
    const targetWeight = LOG_LEVELS[level] ?? 1;
    return targetWeight >= currentWeight;
  }

  formatEntry(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const redactedMeta = redactObject(meta);

    if (this.format === 'json') {
      const logRecord = {
        timestamp,
        level,
        message: typeof message === 'string' ? message : String(message),
        ...redactedMeta
      };
      return JSON.stringify(logRecord);
    }

    // Pretty development formatting
    const levelColors = {
      debug: '\x1b[36mDEBUG\x1b[0m',
      info: '\x1b[32mINFO\x1b[0m',
      warn: '\x1b[33mWARN\x1b[0m',
      error: '\x1b[31mERROR\x1b[0m'
    };
    const levelTag = levelColors[level] || level.toUpperCase();
    const metaStr = Object.keys(redactedMeta).length > 0 ? ` ${JSON.stringify(redactedMeta)}` : '';
    return `[${timestamp}] [${levelTag}]: ${message}${metaStr}`;
  }

  log(level, message, meta = {}) {
    if (!this.shouldLog(level)) return;

    const formatted = this.formatEntry(level, message, meta);
    if (level === 'error') {
      this.errorStream.write(formatted + '\n');
    } else {
      this.outputStream.write(formatted + '\n');
    }
  }

  debug(message, meta) {
    this.log('debug', message, meta);
  }

  info(message, meta) {
    this.log('info', message, meta);
  }

  warn(message, meta) {
    this.log('warn', message, meta);
  }

  error(message, meta) {
    this.log('error', message, meta);
  }
}

const defaultLogger = new Logger();

module.exports = {
  Logger,
  logger: defaultLogger,
  redactObject
};
