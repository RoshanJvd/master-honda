
type LogLevel = 'info' | 'warn' | 'error' | 'success';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
}

const MAX_LOGS = 100;

export const logger = {
  // Fix: Remove 'private' modifier as it's not allowed in object literals
  log(level: LogLevel, message: string, data?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data
    };

    // Console output with brand styling
    const styles = {
      info: 'color: #171091; font-weight: bold',
      warn: 'color: #F59E0B; font-weight: bold',
      error: 'color: #B02E15; font-weight: bold',
      success: 'color: #10B981; font-weight: bold'
    };

    console.log(`%c[MASTER HONDA ${level.toUpperCase()}]`, styles[level], message, data || '');

    // Persist to local storage for audit
    try {
      const logs: LogEntry[] = JSON.parse(localStorage.getItem('mh_system_logs') || '[]');
      logs.unshift(entry);
      localStorage.setItem('mh_system_logs', JSON.stringify(logs.slice(0, MAX_LOGS)));
    } catch (e) {
      console.error("Failed to persist logs", e);
    }
  },

  info(msg: string, data?: any) { this.log('info', msg, data); },
  warn(msg: string, data?: any) { this.log('warn', msg, data); },
  error(msg: string, data?: any) { this.log('error', msg, data); },
  success(msg: string, data?: any) { this.log('success', msg, data); },

  getLogs(): LogEntry[] {
    return JSON.parse(localStorage.getItem('mh_system_logs') || '[]');
  },

  clearLogs() {
    localStorage.removeItem('mh_system_logs');
  }
};
