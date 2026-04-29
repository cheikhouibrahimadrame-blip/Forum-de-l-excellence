import pino from 'pino';

const isDev = process.env.NODE_ENV !== 'production';

const logger = pino({
    level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
    redact: {
        paths: ['password', '*.password', 'token', '*.token', 'secret', '*.secret'],
        censor: '[REDACTED]'
    },
    transport: isDev
        ? {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'HH:MM:ss',
                ignore: 'pid,hostname',
            },
        }
        : undefined,
    // In production, output structured JSON (pino default)
});

export default logger;
