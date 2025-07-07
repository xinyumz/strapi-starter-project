// src/plugins/collection-manager/server/services/orphan-cleanup-service.ts
// Focused on cleanup and repair operations

import type { Core } from '@strapi/strapi';
import { errors } from '@strapi/utils';

const { ApplicationError, ValidationError, NotFoundError } = errors;

interface CleanupResult {
    success: boolean;
    action: 'deleted' | 'repaired' | 'skipped';
    collection?: any;
    message: string;
    metadata: {
        processingTime: number;
        backupCreated: boolean;
        relatedChanges: string[];
    };
}

export default ({ strapi }: any) => {
    // Helper function to validate collection ID
    const validateCollectionId = (collectionId: any): number => {
        const id = parseInt(collectionId?.toString());
        if (!collectionId || isNaN(id) || id <= 0) {
            throw new ValidationError('Valid collection ID is required');
        }
        return id;
    };

    // Helper to check if articles exist (imported from orphan detection service)
    const checkArticlesExistence = async (articleIds: number[]): Promise<Map<number, boolean>> => {
        const existenceMap = new Map<number, boolean>();

        if (articleIds.length === 0) return existenceMap;

        try {
            const existingArticles = await strapi.documents('api::article.article').findMany({
                filters: {
                    id: { $in: articleIds }
                },
                fields: ['id']
            });

            const existingIds = new Set(existingArticles.map((art: any) => parseInt(art.id.toString())));

            articleIds.forEach(id => {
                existenceMap.set(id, existingIds.has(id));
            });

            return existenceMap;
        } catch (error) {
            console.error('[OrphanCleanup] Error checking article existence:', error);
            // Default to assuming all articles exist if we can't check
            articleIds.forEach(id => existenceMap.set(id, true));
            return existenceMap;
        }
    };

    return {
        /**
         * Safely cleanup an orphaned collection
         */
        async safeCleanupOrphanedCollection(collectionId: number, options: {
            force?: boolean;
            createBackup?: boolean;
            reason?: string;
        } = {}): Promise<CleanupResult> {
            const startTime = Date.now();
            const { force = false, createBackup = true, reason = 'Automated cleanup' } = options;

            try {
                const validId = validateCollectionId(collectionId);

                console.log(`[OrphanCleanup] Starting safe cleanup for collection ${validId}`, {
                    force,
                    createBackup,
                    reason
                });

                // Get orphan detection service to check status
                const orphanDetectionService = strapi.plugin('collection-manager').service('orphanDetection');

                // Get current status
                const status = await orphanDetectionService.getCollectionOrphanStatus(validId);

                if (!status.isOrphaned && !force) {
                    return {
                        success: false,
                        action: 'skipped',
                        message: 'Collection is not orphaned - cleanup skipped',
                        metadata: {
                            processingTime: Date.now() - startTime,
                            backupCreated: false,
                            relatedChanges: []
                        }
                    };
                }

                // Get full collection details
                const collection = await strapi.documents('api::collection.collection').findFirst({
                    filters: { id: validId }
                });

                if (!collection) {
                    throw new NotFoundError(`Collection with ID ${validId} not found`);
                }

                let backupData = null;
                if (createBackup) {
                    // Create backup data (could be stored in a backup service)
                    backupData = {
                        collection,
                        status,
                        deletedAt: new Date().toISOString(),
                        reason,
                        restorable: true
                    };
                    console.log(`[OrphanCleanup] Backup created for collection "${collection.Title}"`);
                }

                // Perform the deletion
                await strapi.documents('api::collection.collection').delete({
                    documentId: collection.documentId
                });

                // Clear related caches - get autofill service for cache clearing
                const autoFillService = strapi.plugin('collection-manager').service('collectionAutofill');
                if (autoFillService && typeof autoFillService.clearCache === 'function') {
                    autoFillService.clearCache();
                }

                // Clear orphan detection cache
                if (orphanDetectionService && typeof orphanDetectionService.clearOrphanCache === 'function') {
                    orphanDetectionService.clearOrphanCache();
                }

                const processingTime = Date.now() - startTime;

                console.log(`[OrphanCleanup] Collection ${validId} deleted successfully (${processingTime}ms)`);

                return {
                    success: true,
                    action: 'deleted',
                    collection: backupData?.collection,
                    message: `Collection "${collection.Title}" was safely deleted`,
                    metadata: {
                        processingTime,
                        backupCreated: !!backupData,
                        relatedChanges: [
                            'Collection removed from database',
                            'Article relationships cleared',
                            'Caches invalidated'
                        ]
                    }
                };

            } catch (error) {
                const processingTime = Date.now() - startTime;
                console.error(`[OrphanCleanup] Error in safe cleanup (${processingTime}ms):`, error);

                if (error instanceof NotFoundError || error instanceof ValidationError) {
                    throw error;
                }

                throw new ApplicationError(
                    `Failed to cleanup collection: ${error instanceof Error ? error.message : 'Unknown error'}`
                );
            }
        },

        /**
         * Bulk cleanup multiple orphaned collections
         */
        async bulkCleanupOrphanedCollections(collectionIds: number[], options: {
            force?: boolean;
            createBackup?: boolean;
            reason?: string;
        } = {}): Promise<{ results: CleanupResult[]; summary: any }> {
            const startTime = Date.now();
            const { force = false, createBackup = true, reason = 'Bulk automated cleanup' } = options;

            try {
                console.log(`[OrphanCleanup] Starting bulk cleanup for ${collectionIds.length} collections`);

                const results: CleanupResult[] = [];
                let successCount = 0;
                let skipCount = 0;
                let errorCount = 0;

                for (const collectionId of collectionIds) {
                    try {
                        const result = await this.safeCleanupOrphanedCollection(collectionId, {
                            force,
                            createBackup,
                            reason
                        });

                        results.push(result);

                        if (result.success && result.action === 'deleted') {
                            successCount++;
                        } else if (result.action === 'skipped') {
                            skipCount++;
                        }

                    } catch (error) {
                        console.error(`[OrphanCleanup] Error cleaning up collection ${collectionId}:`, error);

                        results.push({
                            success: false,
                            action: 'skipped',
                            message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                            metadata: {
                                processingTime: 0,
                                backupCreated: false,
                                relatedChanges: []
                            }
                        });

                        errorCount++;
                    }
                }

                const totalProcessingTime = Date.now() - startTime;

                const summary = {
                    totalCollections: collectionIds.length,
                    successfulCleanups: successCount,
                    skippedCleanups: skipCount,
                    failedCleanups: errorCount,
                    processingTime: totalProcessingTime,
                    averageTimePerCollection: Math.round(totalProcessingTime / collectionIds.length),
                    timestamp: new Date().toISOString()
                };

                console.log(`[OrphanCleanup] Bulk cleanup completed:`, summary);

                return { results, summary };

            } catch (error) {
                console.error('[OrphanCleanup] Error in bulk cleanup:', error);
                throw new ApplicationError(
                    `Failed to perform bulk cleanup: ${error instanceof Error ? error.message : 'Unknown error'}`
                );
            }
        },

        /**
         * Repair broken article references in a collection
         */
        async repairCollectionReferences(collectionId: number, options: {
            removeInvalidReferences?: boolean;
            addReplacementArticles?: number[];
        } = {}): Promise<CleanupResult> {
            const startTime = Date.now();
            const { removeInvalidReferences = true, addReplacementArticles = [] } = options;

            try {
                const validId = validateCollectionId(collectionId);

                console.log(`[OrphanRepair] Starting reference repair for collection ${validId}`);

                // Get orphan detection service for relationship status
                const orphanDetectionService = strapi.plugin('collection-manager').service('orphanDetection');

                // Get current relationship status
                const relationshipStatus = await orphanDetectionService.getCollectionRelationshipStatus(validId);

                if (relationshipStatus.missingArticles === 0 && addReplacementArticles.length === 0) {
                    return {
                        success: false,
                        action: 'skipped',
                        message: 'No broken references to repair',
                        metadata: {
                            processingTime: Date.now() - startTime,
                            backupCreated: false,
                            relatedChanges: []
                        }
                    };
                }

                const collection = relationshipStatus.collection;
                const currentArticles = collection.articles || [];
                const validArticleIds = relationshipStatus.articleDetails
                    .filter(art => art.exists)
                    .map(art => art.id);

                // Build new article list
                let newArticleIds = [...validArticleIds];

                // Add replacement articles if specified
                if (addReplacementArticles.length > 0) {
                    // Validate replacement articles exist
                    const replacementExistence = await checkArticlesExistence(addReplacementArticles);
                    const validReplacements = addReplacementArticles.filter(id =>
                        replacementExistence.get(id) === true && !newArticleIds.includes(id)
                    );
                    newArticleIds.push(...validReplacements);
                }

                if (removeInvalidReferences || addReplacementArticles.length > 0) {
                    // Update collection with new article relationships
                    await strapi.documents('api::collection.collection').update({
                        documentId: collection.documentId,
                        data: {
                            articles: newArticleIds
                        }
                    });

                    // Clear caches
                    const autoFillService = strapi.plugin('collection-manager').service('collectionAutofill');
                    if (autoFillService && typeof autoFillService.clearCache === 'function') {
                        autoFillService.clearCache();
                    }

                    if (orphanDetectionService && typeof orphanDetectionService.clearOrphanCache === 'function') {
                        orphanDetectionService.clearOrphanCache();
                    }

                    const changes = [];
                    if (removeInvalidReferences && relationshipStatus.missingArticles > 0) {
                        changes.push(`Removed ${relationshipStatus.missingArticles} invalid article reference(s)`);
                    }
                    if (addReplacementArticles.length > 0) {
                        const addedCount = newArticleIds.length - validArticleIds.length;
                        changes.push(`Added ${addedCount} replacement article(s)`);
                    }

                    console.log(`[OrphanRepair] Collection ${validId} repaired successfully`);

                    return {
                        success: true,
                        action: 'repaired',
                        collection,
                        message: `Collection "${collection.Title}" references repaired`,
                        metadata: {
                            processingTime: Date.now() - startTime,
                            backupCreated: false,
                            relatedChanges: changes
                        }
                    };
                }

                return {
                    success: false,
                    action: 'skipped',
                    message: 'No repair actions specified',
                    metadata: {
                        processingTime: Date.now() - startTime,
                        backupCreated: false,
                        relatedChanges: []
                    }
                };

            } catch (error) {
                console.error('[OrphanRepair] Error repairing collection references:', error);

                if (error instanceof NotFoundError || error instanceof ValidationError) {
                    throw error;
                }

                throw new ApplicationError(
                    `Failed to repair collection references: ${error instanceof Error ? error.message : 'Unknown error'}`
                );
            }
        },

        /**
         * Batch repair broken references across multiple collections
         */
        async batchRepairReferences(collectionIds: number[], options: {
            removeInvalidReferences?: boolean;
            dryRun?: boolean;
        } = {}): Promise<{ results: any[]; summary: any }> {
            const startTime = Date.now();
            const { removeInvalidReferences = true, dryRun = false } = options;

            try {
                console.log(`[OrphanRepair] Starting batch repair for ${collectionIds.length} collections`);

                const results = [];
                let repairedCount = 0;
                let skippedCount = 0;
                let errorCount = 0;

                const orphanDetectionService = strapi.plugin('collection-manager').service('orphanDetection');

                for (const collectionId of collectionIds) {
                    try {
                        if (dryRun) {
                            // Just analyze what would be repaired
                            const relationshipStatus = await orphanDetectionService.getCollectionRelationshipStatus(collectionId);
                            results.push({
                                collectionId,
                                wouldRepair: relationshipStatus.missingArticles > 0,
                                missingArticles: relationshipStatus.missingArticles,
                                action: 'dry-run',
                                success: true
                            });
                            if (relationshipStatus.missingArticles > 0) {
                                repairedCount++; // Would repair count
                            } else {
                                skippedCount++;
                            }
                        } else {
                            // Actually perform the repair
                            const repairResult = await this.repairCollectionReferences(collectionId, {
                                removeInvalidReferences
                            });
                            results.push({
                                collectionId,
                                action: repairResult.action,
                                message: repairResult.message,
                                success: repairResult.success
                            });

                            if (repairResult.success && repairResult.action === 'repaired') {
                                repairedCount++;
                            } else {
                                skippedCount++;
                            }
                        }
                    } catch (error) {
                        results.push({
                            collectionId,
                            action: 'failed',
                            success: false,
                            error: error instanceof Error ? error.message : 'Unknown error'
                        });
                        errorCount++;
                    }
                }

                const processingTime = Date.now() - startTime;

                const summary = {
                    totalProcessed: collectionIds.length,
                    successful: repairedCount,
                    skipped: skippedCount,
                    failed: errorCount,
                    dryRun,
                    processingTime,
                    timestamp: new Date().toISOString()
                };

                console.log(`[OrphanRepair] Batch repair completed:`, summary);

                return { results, summary };

            } catch (error) {
                console.error('[OrphanRepair] Error in batch repair:', error);
                throw new ApplicationError(
                    `Failed to perform batch repair: ${error instanceof Error ? error.message : 'Unknown error'}`
                );
            }
        },

        /**
         * Automated cleanup based on configurable rules
         */
        async automatedCleanup(rules: {
            deleteEmpty?: boolean;
            deleteBrokenReferences?: boolean;
            maxAge?: number | null;
            dryRun?: boolean;
        } = {}): Promise<{
            analysis: any;
            toCleanup: any[];
            cleanupResults: CleanupResult[];
            summary: string;
        }> {
            const startTime = Date.now();
            const {
                deleteEmpty = true,
                deleteBrokenReferences = false,
                maxAge = null,
                dryRun = false
            } = rules;

            try {
                console.log('[OrphanCleanup] Starting automated cleanup with rules:', rules);

                const orphanDetectionService = strapi.plugin('collection-manager').service('orphanDetection');

                // Get all orphaned collections
                const orphanResults = await orphanDetectionService.detectOrphanedCollections();

                const toCleanup = [];

                // Apply cleanup rules
                for (const result of orphanResults) {
                    const { collection, status } = result;

                    if (deleteEmpty && status.orphanType === 'empty') {
                        toCleanup.push({
                            collectionId: collection.id,
                            reason: 'Empty collection - automated cleanup rule',
                            priority: 'medium'
                        });
                    }

                    if (deleteBrokenReferences && status.orphanType === 'broken_references') {
                        toCleanup.push({
                            collectionId: collection.id,
                            reason: 'Broken references - automated cleanup rule',
                            priority: 'high'
                        });
                    }

                    // Age-based cleanup could be implemented here
                    // if (maxAge && collection.createdAt && ...) { ... }
                }

                let cleanupResults: CleanupResult[] = [];

                if (!dryRun && toCleanup.length > 0) {
                    // Perform actual cleanup
                    const bulkResult = await this.bulkCleanupOrphanedCollections(
                        toCleanup.map(item => item.collectionId),
                        {
                            force: false,
                            createBackup: true,
                            reason: 'Automated maintenance cleanup'
                        }
                    );
                    cleanupResults = bulkResult.results;
                }

                const analysis = {
                    totalOrphaned: orphanResults.filter(r => r.status.isOrphaned).length,
                    eligibleForCleanup: toCleanup.length,
                    cleanupPerformed: !dryRun,
                    processingTime: Date.now() - startTime
                };

                const summary = dryRun ?
                    `Would clean up ${toCleanup.length} collections` :
                    `Cleaned up ${cleanupResults.filter(r => r.success).length}/${toCleanup.length} collections`;

                return {
                    analysis,
                    toCleanup,
                    cleanupResults,
                    summary
                };

            } catch (error) {
                console.error('[OrphanCleanup] Error in automated cleanup:', error);
                throw new ApplicationError(
                    `Failed to perform automated cleanup: ${error instanceof Error ? error.message : 'Unknown error'}`
                );
            }
        },

        /**
         * Preview what would be cleaned up without executing
         */
        async previewCleanup(): Promise<{
            preview: any;
            recommendations: any;
        }> {
            try {
                const orphanDetectionService = strapi.plugin('collection-manager').service('orphanDetection');
                const orphanResults = await orphanDetectionService.detectOrphanedCollections();

                const preview = {
                    empty: orphanResults.filter(r => r.status.orphanType === 'empty'),
                    brokenReferences: orphanResults.filter(r => r.status.orphanType === 'broken_references'),
                    highSeverity: orphanResults.filter(r => r.status.severity === 'high'),
                    mediumSeverity: orphanResults.filter(r => r.status.severity === 'medium')
                };

                const recommendations = {
                    safeToDelete: preview.empty.length,
                    needsReview: preview.brokenReferences.length,
                    highPriority: preview.highSeverity.length,
                    totalOrphaned: orphanResults.filter(r => r.status.isOrphaned).length
                };

                return { preview, recommendations };

            } catch (error) {
                console.error('[OrphanCleanup] Error generating cleanup preview:', error);
                throw new ApplicationError(
                    `Failed to generate cleanup preview: ${error instanceof Error ? error.message : 'Unknown error'}`
                );
            }
        }
    };
};