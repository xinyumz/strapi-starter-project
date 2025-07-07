// src/plugins/collection-manager/server/controllers/orphan-operations-controller.ts
// Focused on cleanup, repair, and maintenance operations

export default ({ strapi }: any) => ({

    // ====================================
    // ORPHAN CLEANUP ENDPOINTS
    // ====================================

    /**
     * Safely cleanup an orphaned collection
     * POST /collection-manager/orphans/cleanup/:id
     */
    async cleanupOrphan(ctx: any) {
        const startTime = Date.now();

        try {
            const { id } = ctx.params;
            const { force = false, createBackup = true, reason = 'Manual cleanup' } = ctx.request.body || {};

            const collectionId = parseInt(id);

            if (isNaN(collectionId) || collectionId <= 0) {
                ctx.status = 400;
                ctx.body = {
                    success: false,
                    error: {
                        type: 'VALIDATION_ERROR',
                        message: 'Valid collection ID is required',
                        code: 'INVALID_COLLECTION_ID',
                        received: id
                    }
                };
                return;
            }

            console.log('[OrphanOperationsController] Cleaning up collection:', collectionId, { force, createBackup, reason });

            const orphanCleanupService = strapi.plugin('collection-manager').service('orphanCleanup');

            if (!orphanCleanupService || typeof orphanCleanupService.safeCleanupOrphanedCollection !== 'function') {
                ctx.status = 501;
                ctx.body = {
                    success: false,
                    error: {
                        type: 'NOT_IMPLEMENTED',
                        message: 'Orphan cleanup service not available',
                        code: 'ORPHAN_CLEANUP_UNAVAILABLE'
                    }
                };
                return;
            }

            const cleanupResult = await orphanCleanupService.safeCleanupOrphanedCollection(collectionId, {
                force,
                createBackup,
                reason
            });

            const processingTime = Date.now() - startTime;

            // Set appropriate status code based on result
            if (cleanupResult.success) {
                ctx.status = cleanupResult.action === 'deleted' ? 200 : 202; // 202 for skipped
            } else {
                ctx.status = 400; // Bad request for failed cleanup
            }

            ctx.body = {
                success: cleanupResult.success,
                data: {
                    action: cleanupResult.action,
                    message: cleanupResult.message,
                    collection: cleanupResult.collection ? {
                        id: cleanupResult.collection.id,
                        title: cleanupResult.collection.Title,
                        wasBackedUp: cleanupResult.metadata.backupCreated
                    } : null,
                    changes: cleanupResult.metadata.relatedChanges
                },
                metadata: {
                    processingTime,
                    timestamp: new Date().toISOString(),
                    requestParams: { force, createBackup, reason }
                }
            };

            console.log(`[OrphanOperationsController] Cleanup ${cleanupResult.action} for collection ${collectionId} in ${processingTime}ms`);

        } catch (error) {
            const processingTime = Date.now() - startTime;
            console.error(`[OrphanOperationsController] Error in cleanup (${processingTime}ms):`, error);

            if (error instanceof Error && error.message.includes('not found')) {
                ctx.status = 404;
                ctx.body = {
                    success: false,
                    error: {
                        type: 'NOT_FOUND',
                        message: 'Collection not found',
                        code: 'COLLECTION_NOT_FOUND'
                    }
                };
                return;
            }

            ctx.status = 500;
            ctx.body = {
                success: false,
                error: {
                    type: 'INTERNAL_ERROR',
                    message: 'Failed to cleanup orphaned collection',
                    code: 'ORPHAN_CLEANUP_FAILED',
                    ...(process.env.NODE_ENV === 'development' && {
                        details: error instanceof Error ? error.message : 'Unknown error'
                    })
                },
                metadata: {
                    processingTime,
                    timestamp: new Date().toISOString()
                }
            };
        }
    },

    /**
     * Bulk cleanup multiple orphaned collections
     * POST /collection-manager/orphans/bulk-cleanup
     */
    async bulkCleanupOrphans(ctx: any) {
        const startTime = Date.now();

        try {
            const { collectionIds = [], force = false, createBackup = true, reason = 'Bulk cleanup' } = ctx.request.body || {};

            // Validation
            if (!Array.isArray(collectionIds) || collectionIds.length === 0) {
                ctx.status = 400;
                ctx.body = {
                    success: false,
                    error: {
                        type: 'VALIDATION_ERROR',
                        message: 'Array of collection IDs is required',
                        code: 'MISSING_COLLECTION_IDS'
                    }
                };
                return;
            }

            // Validate all IDs are numbers
            const invalidIds = collectionIds.filter(id => typeof id !== 'number' || isNaN(id) || id <= 0);
            if (invalidIds.length > 0) {
                ctx.status = 400;
                ctx.body = {
                    success: false,
                    error: {
                        type: 'VALIDATION_ERROR',
                        message: 'All collection IDs must be valid positive numbers',
                        code: 'INVALID_COLLECTION_IDS',
                        invalidIds
                    }
                };
                return;
            }

            // Reasonable limit for bulk operations
            if (collectionIds.length > 50) {
                ctx.status = 400;
                ctx.body = {
                    success: false,
                    error: {
                        type: 'VALIDATION_ERROR',
                        message: 'Too many collections for bulk cleanup (max 50)',
                        code: 'BULK_LIMIT_EXCEEDED',
                        limit: 50,
                        requested: collectionIds.length
                    }
                };
                return;
            }

            console.log('[OrphanOperationsController] Starting bulk cleanup:', { count: collectionIds.length, force, createBackup, reason });

            const orphanCleanupService = strapi.plugin('collection-manager').service('orphanCleanup');

            if (!orphanCleanupService || typeof orphanCleanupService.bulkCleanupOrphanedCollections !== 'function') {
                ctx.status = 501;
                ctx.body = {
                    success: false,
                    error: {
                        type: 'NOT_IMPLEMENTED',
                        message: 'Bulk orphan cleanup service not available',
                        code: 'BULK_ORPHAN_CLEANUP_UNAVAILABLE'
                    }
                };
                return;
            }

            const bulkResult = await orphanCleanupService.bulkCleanupOrphanedCollections(collectionIds, {
                force,
                createBackup,
                reason
            });

            const processingTime = Date.now() - startTime;

            ctx.body = {
                success: true,
                data: {
                    summary: bulkResult.summary,
                    results: bulkResult.results.map(result => ({
                        success: result.success,
                        action: result.action,
                        message: result.message,
                        collection: result.collection ? {
                            id: result.collection.id,
                            title: result.collection.Title
                        } : null
                    })),
                    detailedResults: bulkResult.results // Full results for debugging
                },
                metadata: {
                    processingTime,
                    timestamp: new Date().toISOString(),
                    requestParams: {
                        collectionCount: collectionIds.length,
                        force,
                        createBackup,
                        reason
                    }
                }
            };

            console.log(`[OrphanOperationsController] Bulk cleanup completed in ${processingTime}ms:`, bulkResult.summary);

        } catch (error) {
            const processingTime = Date.now() - startTime;
            console.error(`[OrphanOperationsController] Error in bulk cleanup (${processingTime}ms):`, error);

            ctx.status = 500;
            ctx.body = {
                success: false,
                error: {
                    type: 'INTERNAL_ERROR',
                    message: 'Failed to perform bulk cleanup',
                    code: 'BULK_CLEANUP_FAILED',
                    ...(process.env.NODE_ENV === 'development' && {
                        details: error instanceof Error ? error.message : 'Unknown error'
                    })
                },
                metadata: {
                    processingTime,
                    timestamp: new Date().toISOString()
                }
            };
        }
    },

    // ====================================
    // ORPHAN REPAIR ENDPOINTS  
    // ====================================

    /**
     * Repair broken article references in a collection
     * POST /collection-manager/orphans/repair/:id
     */
    async repairCollectionReferences(ctx: any) {
        const startTime = Date.now();

        try {
            const { id } = ctx.params;
            const {
                removeInvalidReferences = true,
                addReplacementArticles = []
            } = ctx.request.body || {};

            const collectionId = parseInt(id);

            if (isNaN(collectionId) || collectionId <= 0) {
                ctx.status = 400;
                ctx.body = {
                    success: false,
                    error: {
                        type: 'VALIDATION_ERROR',
                        message: 'Valid collection ID is required',
                        code: 'INVALID_COLLECTION_ID',
                        received: id
                    }
                };
                return;
            }

            // Validate replacement articles if provided
            if (addReplacementArticles.length > 0) {
                const invalidReplacements = addReplacementArticles.filter(id =>
                    typeof id !== 'number' || isNaN(id) || id <= 0
                );
                if (invalidReplacements.length > 0) {
                    ctx.status = 400;
                    ctx.body = {
                        success: false,
                        error: {
                            type: 'VALIDATION_ERROR',
                            message: 'All replacement article IDs must be valid positive numbers',
                            code: 'INVALID_REPLACEMENT_ARTICLES',
                            invalidIds: invalidReplacements
                        }
                    };
                    return;
                }
            }

            console.log('[OrphanOperationsController] Repairing collection:', collectionId, {
                removeInvalidReferences,
                addReplacementArticles: addReplacementArticles.length
            });

            const orphanCleanupService = strapi.plugin('collection-manager').service('orphanCleanup');

            if (!orphanCleanupService || typeof orphanCleanupService.repairCollectionReferences !== 'function') {
                ctx.status = 501;
                ctx.body = {
                    success: false,
                    error: {
                        type: 'NOT_IMPLEMENTED',
                        message: 'Collection repair service not available',
                        code: 'COLLECTION_REPAIR_UNAVAILABLE'
                    }
                };
                return;
            }

            const repairResult = await orphanCleanupService.repairCollectionReferences(collectionId, {
                removeInvalidReferences,
                addReplacementArticles
            });

            const processingTime = Date.now() - startTime;

            // Set appropriate status code
            if (repairResult.success) {
                ctx.status = repairResult.action === 'repaired' ? 200 : 202; // 202 for skipped
            } else {
                ctx.status = 400;
            }

            ctx.body = {
                success: repairResult.success,
                data: {
                    action: repairResult.action,
                    message: repairResult.message,
                    collection: repairResult.collection ? {
                        id: repairResult.collection.id,
                        documentId: repairResult.collection.documentId,
                        title: repairResult.collection.Title,
                        url: `/admin/content-manager/collection-types/api::collection.collection/${repairResult.collection.documentId || repairResult.collection.id}`
                    } : null,
                    changes: repairResult.metadata.relatedChanges
                },
                metadata: {
                    processingTime,
                    timestamp: new Date().toISOString(),
                    requestParams: { removeInvalidReferences, addReplacementArticles }
                }
            };

            console.log(`[OrphanOperationsController] Repair ${repairResult.action} for collection ${collectionId} in ${processingTime}ms`);

        } catch (error) {
            const processingTime = Date.now() - startTime;
            console.error(`[OrphanOperationsController] Error in repair (${processingTime}ms):`, error);

            if (error instanceof Error && error.message.includes('not found')) {
                ctx.status = 404;
                ctx.body = {
                    success: false,
                    error: {
                        type: 'NOT_FOUND',
                        message: 'Collection not found',
                        code: 'COLLECTION_NOT_FOUND'
                    }
                };
                return;
            }

            ctx.status = 500;
            ctx.body = {
                success: false,
                error: {
                    type: 'INTERNAL_ERROR',
                    message: 'Failed to repair collection references',
                    code: 'COLLECTION_REPAIR_FAILED',
                    ...(process.env.NODE_ENV === 'development' && {
                        details: error instanceof Error ? error.message : 'Unknown error'
                    })
                },
                metadata: {
                    processingTime,
                    timestamp: new Date().toISOString()
                }
            };
        }
    },

    /**
     * Batch repair broken references
     * POST /collection-manager/batch/repair-references
     */
    async batchRepairReferences(ctx: any) {
        const startTime = Date.now();

        try {
            const {
                collectionIds = [],
                removeInvalidReferences = true,
                dryRun = false
            } = ctx.request.body || {};

            if (!Array.isArray(collectionIds) || collectionIds.length === 0) {
                ctx.status = 400;
                ctx.body = {
                    success: false,
                    error: {
                        type: 'VALIDATION_ERROR',
                        message: 'Array of collection IDs is required',
                        code: 'MISSING_COLLECTION_IDS'
                    }
                };
                return;
            }

            const orphanCleanupService = strapi.plugin('collection-manager').service('orphanCleanup');

            if (!orphanCleanupService || typeof orphanCleanupService.batchRepairReferences !== 'function') {
                ctx.status = 501;
                ctx.body = {
                    success: false,
                    error: {
                        type: 'NOT_IMPLEMENTED',
                        message: 'Batch repair service not available',
                        code: 'BATCH_REPAIR_UNAVAILABLE'
                    }
                };
                return;
            }

            const batchResult = await orphanCleanupService.batchRepairReferences(collectionIds, {
                removeInvalidReferences,
                dryRun
            });

            const processingTime = Date.now() - startTime;

            ctx.body = {
                success: true,
                data: {
                    results: batchResult.results,
                    summary: batchResult.summary
                },
                metadata: {
                    processingTime,
                    timestamp: new Date().toISOString(),
                    requestParams: {
                        collectionCount: collectionIds.length,
                        removeInvalidReferences,
                        dryRun
                    }
                }
            };

        } catch (error) {
            const processingTime = Date.now() - startTime;
            console.error(`[OrphanOperationsController] Error in batch repair (${processingTime}ms):`, error);

            ctx.status = 500;
            ctx.body = {
                success: false,
                error: {
                    type: 'INTERNAL_ERROR',
                    message: 'Failed to perform batch repair',
                    code: 'BATCH_REPAIR_FAILED',
                    ...(process.env.NODE_ENV === 'development' && {
                        details: error instanceof Error ? error.message : 'Unknown error'
                    })
                },
                metadata: {
                    processingTime,
                    timestamp: new Date().toISOString()
                }
            };
        }
    },

    // ====================================
    // MAINTENANCE ENDPOINTS
    // ====================================

    /**
     * Automated cleanup based on rules
     * POST /collection-manager/maintenance/auto-cleanup
     */
    async automatedCleanup(ctx: any) {
        const startTime = Date.now();

        try {
            const {
                rules = {
                    deleteEmpty: true,
                    deleteBrokenReferences: false,
                    maxAge: null,
                    dryRun: false
                }
            } = ctx.request.body || {};

            console.log('[OrphanOperationsController] Starting automated cleanup with rules:', rules);

            const orphanCleanupService = strapi.plugin('collection-manager').service('orphanCleanup');

            if (!orphanCleanupService || typeof orphanCleanupService.automatedCleanup !== 'function') {
                ctx.status = 501;
                ctx.body = {
                    success: false,
                    error: {
                        type: 'NOT_IMPLEMENTED',
                        message: 'Automated cleanup service not available',
                        code: 'AUTOMATED_CLEANUP_UNAVAILABLE'
                    }
                };
                return;
            }

            const cleanupResult = await orphanCleanupService.automatedCleanup(rules);
            const processingTime = Date.now() - startTime;

            ctx.body = {
                success: true,
                data: {
                    rules,
                    analysis: cleanupResult.analysis,
                    toCleanup: cleanupResult.toCleanup,
                    cleanupResults: cleanupResult.cleanupResults,
                    summary: cleanupResult.summary
                },
                metadata: {
                    processingTime,
                    timestamp: new Date().toISOString(),
                    automatedRun: true
                }
            };

        } catch (error) {
            const processingTime = Date.now() - startTime;
            console.error(`[OrphanOperationsController] Error in automated cleanup (${processingTime}ms):`, error);

            ctx.status = 500;
            ctx.body = {
                success: false,
                error: {
                    type: 'INTERNAL_ERROR',
                    message: 'Failed to perform automated cleanup',
                    code: 'AUTOMATED_CLEANUP_FAILED',
                    ...(process.env.NODE_ENV === 'development' && {
                        details: error instanceof Error ? error.message : 'Unknown error'
                    })
                },
                metadata: {
                    processingTime,
                    timestamp: new Date().toISOString()
                }
            };
        }
    },

    /**
     * Preview what would be cleaned up
     * GET /collection-manager/maintenance/cleanup-preview
     */
    async previewCleanup(ctx: any) {
        const startTime = Date.now();

        try {
            const orphanCleanupService = strapi.plugin('collection-manager').service('orphanCleanup');

            if (!orphanCleanupService || typeof orphanCleanupService.previewCleanup !== 'function') {
                ctx.status = 501;
                ctx.body = {
                    success: false,
                    error: {
                        type: 'NOT_IMPLEMENTED',
                        message: 'Cleanup preview service not available',
                        code: 'CLEANUP_PREVIEW_UNAVAILABLE'
                    }
                };
                return;
            }

            const { preview, recommendations } = await orphanCleanupService.previewCleanup();
            const processingTime = Date.now() - startTime;

            ctx.body = {
                success: true,
                data: {
                    preview,
                    recommendations
                },
                metadata: {
                    processingTime,
                    timestamp: new Date().toISOString(),
                    previewMode: true
                }
            };

        } catch (error) {
            const processingTime = Date.now() - startTime;
            console.error(`[OrphanOperationsController] Error in cleanup preview (${processingTime}ms):`, error);

            ctx.status = 500;
            ctx.body = {
                success: false,
                error: {
                    type: 'INTERNAL_ERROR',
                    message: 'Failed to generate cleanup preview',
                    code: 'CLEANUP_PREVIEW_FAILED',
                    ...(process.env.NODE_ENV === 'development' && {
                        details: error instanceof Error ? error.message : 'Unknown error'
                    })
                },
                metadata: {
                    processingTime,
                    timestamp: new Date().toISOString()
                }
            };
        }
    }
});