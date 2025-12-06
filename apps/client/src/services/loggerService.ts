export const LogLevel = {
    INFO: 'INFO',
    WARN: 'WARN',
    ERROR: 'ERROR',
    DEBUG: 'DEBUG'
} as const;

type LogLevel = typeof LogLevel[keyof typeof LogLevel];

class LoggerService {
    private log(level: LogLevel, message: string, context?: any) {
        const timestamp = new Date().toISOString();
        const prefix = `[${timestamp}] [${level}]`;

        switch (level) {
            case LogLevel.ERROR:
                console.error(prefix, message, context || '');
                break;
            case LogLevel.WARN:
                console.warn(prefix, message, context || '');
                break;
            case LogLevel.DEBUG:
                // Only log debug in dev mode
                if (import.meta.env.DEV) {
                    console.debug(prefix, message, context || '');
                }
                break;
            default:
                console.log(prefix, message, context || '');
        }
    }

    info(message: string, context?: any) {
        this.log(LogLevel.INFO, message, context);
    }

    warn(message: string, context?: any) {
        this.log(LogLevel.WARN, message, context);
    }

    error(message: string, error?: any) {
        // If error is an Error object, extract useful info
        const context = error instanceof Error
            ? { stack: error.stack, ...error }
            : error;

        this.log(LogLevel.ERROR, message, context);
    }

    debug(message: string, context?: any) {
        this.log(LogLevel.DEBUG, message, context);
    }
}

export const logger = new LoggerService();
