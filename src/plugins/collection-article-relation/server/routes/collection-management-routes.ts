// src/plugins/collection-article-relation/server/routes/collection-management-routes.ts

export default [
    // ====================================
    // ORPHAN DETECTION ROUTES
    // ====================================

    {
        method: 'GET',
        path: '/orphans/detect',
        handler: 'orphanManagement.detectOrphans',
        config: {
            policies: [],
            middlewares: [],
            auth: false,
            description: 'Detect all orphaned collections in the system',
            tags: ['orphan-management', 'detection']
        },
    },

    {
        method: 'GET',
        path: '/orphans/status/:id',
        handler: 'orphanManagement.getOrphanStatus',
        config: {
            policies: [],
            middlewares: [],
            auth: { scope: ['admin'] },
            description: 'Get detailed orphan status for a specific collection',
            tags: ['orphan-management', 'status']
        },
    },

    {
        method: 'GET',
        path: '/orphans/stats',
        handler: 'orphanManagement.getOrphanStats',
        config: {
            policies: [],
            middlewares: [],
            auth: { scope: ['admin'] },
            description: 'Get system-wide orphan detection statistics',
            tags: ['orphan-management', 'statistics']
        },
    },

    // ====================================
    // DUPLICATE DETECTION ROUTES 
    // ====================================

    {
        method: 'GET',
        path: '/duplicates/detect',
        handler: 'duplicateDetection.detectDuplicates',
        config: {
            policies: [],
            middlewares: [],
            auth: { scope: ['admin'] },
            description: 'Detect all duplicate collections in the system',
            tags: ['duplicate-management', 'detection']
        },
    },

    {
        method: 'GET',
        path: '/duplicates/stats',
        handler: 'duplicateDetection.getDuplicateStats',
        config: {
            policies: [],
            middlewares: [],
            auth: { scope: ['admin'] },
            description: 'Get system-wide duplicate detection statistics',
            tags: ['duplicate-management', 'statistics']
        },
    },

    {
        method: 'GET',
        path: '/duplicates/groups/:fingerprint',
        handler: 'duplicateDetection.getDuplicateGroup',
        config: {
            policies: [],
            middlewares: [],
            auth: { scope: ['admin'] },
            description: 'Get detailed information about a specific duplicate group',
            tags: ['duplicate-management', 'details']
        },
    },

    {
        method: 'GET',
        path: '/duplicates/detect/force',
        handler: 'duplicateDetection.forceDetectDuplicates',
        config: {
            policies: [],
            middlewares: [],
            auth: { scope: ['admin'] },
            description: 'Force duplicate detection bypassing all cache layers',
            tags: ['duplicate-detection', 'cache-bypass', 'force-refresh']
        },
    },

    {
        method: 'GET',
        path: '/duplicates/stats/force',
        handler: 'duplicateDetection.forceGetDuplicateStats',
        config: {
            policies: [],
            middlewares: [],
            auth: { scope: ['admin'] },
            description: 'Force duplicate statistics generation bypassing cache',
            tags: ['duplicate-statistics', 'cache-bypass', 'force-refresh']
        },
    },

    // ====================================
    // COMBINED HEALTH ROUTES 
    // ====================================

    {
        method: 'GET',
        path: '/health/overview',
        handler: 'collectionHealth.getCombinedHealthOverview',
        config: {
            policies: [],
            middlewares: [],
            auth: { scope: ['admin'] },
            description: 'Get combined health overview including orphans and duplicates',
            tags: ['health-management', 'overview']
        },
    },

    {
        method: 'GET',
        path: '/health/overview/force',
        handler: 'collectionHealth.forceGetHealthOverview',
        config: {
            policies: [],
            middlewares: [],
            auth: { scope: ['admin'] },
            description: 'Force health overview bypassing cache',
            tags: ['health-management', 'force-refresh']
        },
    },

    {
        method: 'GET',
        path: '/health/metrics',
        handler: 'collectionHealth.getHealthMetrics',
        config: {
            policies: [],
            middlewares: [],
            auth: { scope: ['admin'] },
            description: 'Get health metrics summary for dashboard widgets',
            tags: ['health-management', 'metrics']
        },
    },

    {
        method: 'DELETE',
        path: '/health/cache',
        handler: 'collectionHealth.clearHealthCache',
        config: {
            policies: [],
            middlewares: [],
            auth: { scope: ['admin'] },
            description: 'Clear all health-related caches',
            tags: ['health-management', 'cache-management']
        },
    },

    // ====================================
    // ORPHAN CLEANUP ROUTES
    // ====================================

    {
        method: 'POST',
        path: '/orphans/cleanup/:id',
        handler: 'orphanManagement.cleanupOrphan',
        config: {
            policies: [],
            middlewares: [],
            auth: { scope: ['admin'] },
            description: 'Safely cleanup a single orphaned collection',
            tags: ['orphan-management', 'cleanup']
        },
    },

    {
        method: 'POST',
        path: '/orphans/bulk-cleanup',
        handler: 'orphanManagement.bulkCleanupOrphans',
        config: {
            policies: [],
            middlewares: [],
            auth: { scope: ['admin'] },
            description: 'Bulk cleanup multiple orphaned collections',
            tags: ['orphan-management', 'bulk-operations']
        },
    },

    // ====================================
    // ORPHAN REPAIR ROUTES
    // ====================================

    {
        method: 'POST',
        path: '/orphans/repair/:id',
        handler: 'orphanManagement.repairCollectionReferences',
        config: {
            policies: [],
            middlewares: [],
            auth: { scope: ['admin'] },
            description: 'Repair broken article references in a collection',
            tags: ['orphan-management', 'repair']
        },
    },

    // ====================================
    // MAINTENANCE ROUTES
    // ====================================

    {
        method: 'POST',
        path: '/maintenance/auto-cleanup',
        handler: 'orphanManagement.automatedCleanup',
        config: {
            policies: [],
            middlewares: [],
            auth: { scope: ['admin'] },
            description: 'Automated cleanup of orphaned collections based on rules',
            tags: ['maintenance', 'automation']
        },
    },

    {
        method: 'GET',
        path: '/maintenance/cleanup-preview',
        handler: 'orphanManagement.previewCleanup',
        config: {
            policies: [],
            middlewares: [],
            auth: { scope: ['admin'] },
            description: 'Preview what would be cleaned up in automated cleanup',
            tags: ['maintenance', 'preview']
        },
    },

    // ====================================
    // BATCH OPERATION ROUTES
    // ====================================

    {
        method: 'POST',
        path: '/batch/analyze-collections',
        handler: 'orphanManagement.batchAnalyzeCollections',
        config: {
            policies: [],
            middlewares: [],
            auth: { scope: ['admin'] },
            description: 'Batch analyze multiple collections for orphan status',
            tags: ['batch-operations', 'analysis']
        },
    },

    {
        method: 'POST',
        path: '/batch/repair-references',
        handler: 'orphanManagement.batchRepairReferences',
        config: {
            policies: [],
            middlewares: [],
            auth: { scope: ['admin'] },
            description: 'Batch repair broken references across multiple collections',
            tags: ['batch-operations', 'repair']
        },
    },

    // ====================================
    // ALTERNATIVE ROUTE PATTERNS
    // ====================================

    {
        method: 'GET',
        path: '/collections/orphaned',
        handler: 'orphanManagement.detectOrphans',
        config: {
            policies: [],
            middlewares: [],
            auth: { scope: ['admin'] },
            description: 'Alternative path: Detect orphaned collections',
            tags: ['orphan-management', 'alternative-path']
        },
    },

    {
        method: 'GET',
        path: '/collections/:id/orphan-status',
        handler: 'orphanManagement.getOrphanStatus',
        config: {
            policies: [],
            middlewares: [],
            auth: { scope: ['admin'] },
            description: 'Alternative path: Get collection orphan status',
            tags: ['orphan-management', 'alternative-path']
        },
    },

    {
        method: 'DELETE',
        path: '/collections/:id/cleanup-orphan',
        handler: 'orphanManagement.cleanupOrphan',
        config: {
            policies: [],
            middlewares: [],
            auth: { scope: ['admin'] },
            description: 'Alternative path: Cleanup orphaned collection using DELETE method',
            tags: ['orphan-management', 'alternative-path']
        },
    },

    // ====================================
    // DASHBOARD INTEGRATION ROUTES
    // ====================================

    {
        method: 'GET',
        path: '/dashboard/orphan-summary',
        handler: 'orphanManagement.getOrphanStats',
        config: {
            policies: [],
            middlewares: [],
            auth: { scope: ['admin'] },
            description: 'Dashboard widget data for orphan management overview',
            tags: ['dashboard', 'orphan-management']
        },
    },

    // ====================================
    // CACHE MANAGEMENT ROUTES
    // ====================================

    {
        method: 'DELETE',
        path: '/orphans/cache',
        handler: 'orphanManagement.clearOrphanCache',
        config: {
            policies: [],
            middlewares: [],
            auth: { scope: ['admin'] },
            description: 'Clear all orphan detection cache for immediate refresh',
            tags: ['cache-management', 'orphan-detection']
        },
    },

    {
        method: 'DELETE',
        path: '/orphans/cache/:id',
        handler: 'orphanManagement.clearCollectionCache',
        config: {
            policies: [],
            middlewares: [],
            auth: { scope: ['admin'] },
            description: 'Clear orphan detection cache for a specific collection',
            tags: ['cache-management', 'collection-specific']
        },
    },

    {
        method: 'GET',
        path: '/orphans/cache-stats',
        handler: 'orphanManagement.getCacheStats',
        config: {
            policies: [],
            middlewares: [],
            auth: { scope: ['admin'] },
            description: 'Get detailed cache statistics and performance metrics',
            tags: ['cache-management', 'statistics', 'performance']
        },
    },

    {
        method: 'GET',
        path: '/orphans/stats/force',
        handler: 'orphanManagement.forceGetOrphanStats',
        config: {
            policies: [],
            middlewares: [],
            auth: { scope: ['admin'] },
            description: 'Force orphan statistics generation bypassing cache',
            tags: ['orphan-statistics', 'cache-bypass', 'force-refresh']
        },
    },

    {
        method: 'GET',
        path: '/orphans/detect/force',
        handler: 'orphanManagement.forceDetectOrphans',
        config: {
            policies: [],
            middlewares: [],
            auth: { scope: ['admin'] },
            description: 'Force orphan detection bypassing all cache layers',
            tags: ['orphan-detection', 'cache-bypass', 'force-refresh']
        },
    },
];