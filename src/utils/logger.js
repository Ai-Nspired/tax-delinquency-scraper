/**
 * Simple logger with level support.
 */
const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };

export class Logger {
  constructor(level = 'info') {
    this.level = LEVELS[level] ?? LEVELS.info;
  }

  _log(level, msg, data = null) {
    if (LEVELS[level] < this.level) return;
    const ts = new Date().toISOString();
    const prefix = "[" + ts + "] [" + level.toUpperCase() + "]";
    const line = data !== null ? prefix + " " + msg + "\n" + JSON.stringify(data, null, 2) : prefix + " " + msg;
    const methods = { debug: "log", info: "log", warn: "warn", error: "error" };
    console[methods[level]](line);
  }

  debug(msg, data) { this._log("debug", msg, data); }
  info(msg, data) { this._log("info", msg, data); }
  warn(msg, data) { this._log("warn", msg, data); }
  error(msg, data) { this._log("error", msg, data); }
}

export const logger = new Logger();