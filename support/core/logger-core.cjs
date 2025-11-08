const pino = require('pino');
const path = require('path');
const context = require('./context-core.cjs');

const logger = pino({
    level: 'info',
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'yyyy-mm-dd HH:MM:ss.l',
            ignore: 'pid,hostname',
            singleLine: true,
        },
    },
});

function getCallerFile() {
    const original = Error.prepareStackTrace;
    Error.prepareStackTrace = (_, stack) => stack;
    const err = new Error();
    const stack = err.stack;
    Error.prepareStackTrace = original;
    const site = stack[2];
    if (!site) return 'unknown';
    const fileName = site.getFileName();
    const line = site.getLineNumber();
    const projectRoot = process.cwd();
    if (!fileName) return 'unknown';
    const relativePath = path.relative(projectRoot, fileName).replace(/\\/g, '/');
    return `${relativePath}:${line}`;
}

function stringifyWithFunctions(obj) {
    if (typeof obj !== 'object' || obj === null) {
        return JSON.stringify(obj);
    }
    if (Array.isArray(obj)) {
        const items = obj.map((item) => {
            if (typeof item === 'function') {
                return `[Function: ${item.name || 'anonymous'}]`;
            }
            if (typeof item === 'object' && item !== null) {
                return stringifyWithFunctions(item);
            }
            return JSON.stringify(item);
        });
        return `[${items.join(',')}]`;
    }

    const keys = Object.keys(obj);
    const pairs = keys.map((key) => {
        const value = obj[key];
        let strValue;
        if (typeof value === 'function') {
            strValue = `[Function: ${value.name || 'anonymous'}]`;
        } else if (typeof value === 'object' && value !== null) {
            strValue = stringifyWithFunctions(value);
        } else {
            strValue = JSON.stringify(value);
        }
        return `"${key}":${strValue}`;
    });

    return `{${pairs.join(',')}}`;
}

function formatArgs(args) {
    if (args.length === 0) return '';
    if (args.length === 1) {
        const arg = args[0];
        if (arg instanceof Error) return arg;
        if (typeof arg === 'object' && arg !== null) {
            return stringifyWithFunctions(arg);
        }
        return String(arg);
    }
    return args
        .map((a) => {
            if (a instanceof Error) return a.stack || a.message;
            if (typeof a === 'function') return `[Function: ${a.name || 'anonymous'}]`;
            if (typeof a === 'object' && a !== null) return stringifyWithFunctions(a);
            return String(a);
        })
        .join(' ');
}

function logWithLevel(args, callerFile) {
    const msg = formatArgs(args);
    const contextData = context.getStore();
    const identitySegments = contextData
        ? Object.entries(contextData)
            .filter(([, value]) => value !== undefined)
            .map(([key, value]) => `${key}: ${value === null ? 'null' : value},`)
        : [];
    const identityPrefix = identitySegments.length ? `${identitySegments.join(' ')} ` : '';
    const fileWithId = `${identityPrefix}${callerFile}`;
    if (msg instanceof Error) {
        const formattedMsg = `${fileWithId} - ${msg.message}`;
        logger.error({ err: msg, msg: formattedMsg });
    } else {
        const formattedMsg = `${fileWithId} - ${msg}`;
        logger.info({ msg: formattedMsg });
    }
}

function makeAsyncLogger() {
    return (...args) => {
        const callerFile = getCallerFile();
        setImmediate(() => logWithLevel(args, callerFile));
    };
}

console.log = makeAsyncLogger('info');
console.info = makeAsyncLogger('info');
console.warn = makeAsyncLogger('warn');
console.error = makeAsyncLogger('error');
console.debug = makeAsyncLogger('debug');

process.on('uncaughtException', (err) => {
    logger.error({ err, caller: 'uncaughtException' }, 'Uncaught Exception');
});

process.on('unhandledRejection', (reason) => {
    logger.error({ err: reason, caller: 'unhandledRejection' }, 'Unhandled Rejection');
});

process.on('SIGINT', () => {
    logger.info('Process interrupted (Ctrl + C)');
    process.exit(0);
});

process.on('exit', (code) => {
    logger.info(`Process exiting with code ${code}`);
});

module.exports = logger;
