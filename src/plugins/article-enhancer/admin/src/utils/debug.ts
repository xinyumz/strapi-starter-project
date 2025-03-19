// src/plugins/article-enhancer/admin/src/utils/debug.ts

/**
 * Enhanced console logging function that adds timestamps and caller info to logs
 * Great for debugging asynchronous operations and tracing function calls
 */
export const debug = {
    log: (...args: any[]) => {
        const now = new Date();
        const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;

        // Try to get the caller info
        const stack = new Error().stack;
        let caller = 'unknown';
        if (stack) {
            const lines = stack.split('\n');
            if (lines.length > 2) {
                // Get the caller of this function (skip the first two lines which are the Error and this function)
                const callerLine = lines[2].trim();
                // Extract the function name or file name
                const match = callerLine.match(/at\s+([^\s]+)/);
                if (match && match[1]) {
                    caller = match[1];
                }
            }
        }

        console.log(`[${timestamp}] [${caller}]`, ...args);
    },

    error: (...args: any[]) => {
        const now = new Date();
        const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;
        console.error(`[${timestamp}] [ERROR]`, ...args);
    },

    warn: (...args: any[]) => {
        const now = new Date();
        const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;
        console.warn(`[${timestamp}] [WARN]`, ...args);
    },

    group: (label: string) => {
        const now = new Date();
        const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;
        console.group(`[${timestamp}] ${label}`);
    },

    groupEnd: () => {
        console.groupEnd();
    },

    // Utility to log an action with timing
    async action<T>(label: string, fn: () => Promise<T>): Promise<T> {
        const start = performance.now();
        debug.log(`Starting: ${label}`);
        try {
            const result = await fn();
            const end = performance.now();
            debug.log(`Completed: ${label} (${(end - start).toFixed(2)}ms)`);
            return result;
        } catch (error) {
            const end = performance.now();
            debug.error(`Failed: ${label} (${(end - start).toFixed(2)}ms)`, error);
            throw error;
        }
    }
};

export default debug;