type LogLevel = 'info' | 'warn' | 'error';

class Logger {
  log(level: LogLevel, message: string, context?: any) {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

    switch (level) {
      case 'info':
        console.info(formattedMessage, context || '');
        break;
      case 'warn':
        console.warn(formattedMessage, context || '');
        break;
      case 'error':
        console.error(formattedMessage, context || '');
        // Optional: Trigger Sentry or external monitoring here
        // if (window.Sentry) { window.Sentry.captureException(context || new Error(message)); }
        break;
    }
  }

  info(message: string, context?: any) {
    this.log('info', message, context);
  }

  warn(message: string, context?: any) {
    this.log('warn', message, context);
  }

  error(message: string, context?: any) {
    this.log('error', message, context);
  }
}

export const logger = new Logger();
