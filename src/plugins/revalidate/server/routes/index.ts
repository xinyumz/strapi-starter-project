// src/plugins/revalidate/server/routes/index.ts

export default [
    // ====================================
    // REVALIDATION ROUTES
    // ====================================

    {
        method: 'POST',
        path: '/trigger',
        handler: 'revalidateController.triggerRevalidation',
        config: {
            policies: [],
            middlewares: [],
            auth: { scope: ['admin'] }, // Require admin authentication
            description: 'Trigger Next.js ISR revalidation for a specific path',
            tags: ['revalidation', 'isr']
        },
    },

    {
        method: 'GET',
        path: '/health',
        handler: 'revalidateController.health',
        config: {
            policies: [],
            middlewares: [],
            auth: false, // Public health check
            description: 'Health check for revalidate plugin',
            tags: ['health', 'monitoring']
        },
    },

    {
        method: 'GET',
        path: '/history',
        handler: 'revalidateController.getRevalidationHistory',
        config: {
            policies: [],
            middlewares: [],
            auth: { scope: ['admin'] },
            description: 'Get revalidation history (future feature)',
            tags: ['revalidation', 'history']
        },
    },

    // ====================================
    // ALTERNATIVE ROUTE FOR BACKWARDS COMPATIBILITY
    // ====================================

    {
        method: 'GET',
        path: '/',
        handler: 'revalidateController.health',
        config: {
            policies: [],
            middlewares: [],
            auth: false,
            description: 'Default plugin health endpoint',
            tags: ['health']
        },
    },
];