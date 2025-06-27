// src/plugins/collection-article-relation/admin/src/utils/performanceMonitor.ts
// Performance monitoring and analytics for the plugin

interface PerformanceMetric {
    operation: string;
    startTime: number;
    endTime: number;
    duration: number;
    success: boolean;
    metadata?: any;
}

interface AnalyticsData {
    buttonClicks: number;
    successfulCreations: number;
    failedCreations: number;
    existingCollections: number;
    averageResponseTime: number;
    sessionStartTime: number;
}

interface WindowWithPerf extends Window {
    [key: string]: any;
}

class PerformanceMonitor {
    private metrics: PerformanceMetric[] = [];
    private analytics: AnalyticsData;
    private maxMetrics = 100; // Keep only last 100 metrics to prevent memory issues

    constructor() {
        this.analytics = {
            buttonClicks: 0,
            successfulCreations: 0,
            failedCreations: 0,
            existingCollections: 0,
            averageResponseTime: 0,
            sessionStartTime: Date.now()
        };

        // Load analytics from sessionStorage if available
        this.loadAnalytics();
    }

    /**
     * Start timing an operation
     */
    startTiming(operation: string, metadata?: any): string {
        const id = `${operation}_${Date.now()}_${Math.random()}`;

        // Store start time with operation ID
        if (typeof window !== 'undefined') {
            (window as WindowWithPerf)[`perf_${id}`] = {
                operation,
                startTime: performance.now(),
                metadata
            };
        }

        return id;
    }

    /**
     * End timing an operation and record metric
     */
    endTiming(operationId: string, success: boolean = true, additionalMetadata?: any): PerformanceMetric | null {
        if (typeof window === 'undefined') return null;

        const startData = (window as WindowWithPerf)[`perf_${operationId}`];
        if (!startData) {
            console.warn('[PerformanceMonitor] No start data found for operation:', operationId);
            return null;
        }

        const endTime = performance.now();
        const metric: PerformanceMetric = {
            operation: startData.operation,
            startTime: startData.startTime,
            endTime,
            duration: endTime - startData.startTime,
            success,
            metadata: { ...startData.metadata, ...additionalMetadata }
        };

        // Add to metrics array
        this.metrics.push(metric);

        // Keep only recent metrics
        if (this.metrics.length > this.maxMetrics) {
            this.metrics = this.metrics.slice(-this.maxMetrics);
        }

        // Update analytics
        this.updateAnalytics(metric);

        // Clean up temporary data
        delete (window as WindowWithPerf)[`perf_${operationId}`];

        console.log(`[PerformanceMonitor] ${metric.operation}: ${metric.duration.toFixed(2)}ms`, metric);

        return metric;
    }

    /**
     * Record button click analytics
     */
    recordButtonClick(): void {
        this.analytics.buttonClicks++;
        this.saveAnalytics();
    }

    /**
     * Record collection creation result
     */
    recordCreationResult(type: 'success' | 'failed' | 'existing'): void {
        switch (type) {
            case 'success':
                this.analytics.successfulCreations++;
                break;
            case 'failed':
                this.analytics.failedCreations++;
                break;
            case 'existing':
                this.analytics.existingCollections++;
                break;
        }
        this.saveAnalytics();
    }

    /**
     * Update analytics based on performance metric
     */
    private updateAnalytics(metric: PerformanceMetric): void {
        if (metric.operation === 'collection_creation') {
            // Update average response time
            const allCreationMetrics = this.metrics.filter(m => m.operation === 'collection_creation');
            const totalDuration = allCreationMetrics.reduce((sum, m) => sum + m.duration, 0);
            this.analytics.averageResponseTime = totalDuration / allCreationMetrics.length;
        }

        this.saveAnalytics();
    }

    /**
     * Get performance statistics
     */
    getPerformanceStats(): any {
        const recentMetrics = this.metrics.slice(-20); // Last 20 operations

        const stats = {
            totalOperations: this.metrics.length,
            recentOperations: recentMetrics.length,
            averageDuration: this.metrics.length > 0
                ? this.metrics.reduce((sum, m) => sum + m.duration, 0) / this.metrics.length
                : 0,
            successRate: this.metrics.length > 0
                ? (this.metrics.filter(m => m.success).length / this.metrics.length) * 100
                : 0,
            slowestOperation: this.metrics.length > 0
                ? Math.max(...this.metrics.map(m => m.duration))
                : 0,
            fastestOperation: this.metrics.length > 0
                ? Math.min(...this.metrics.map(m => m.duration))
                : 0,
            operationBreakdown: this.getOperationBreakdown(),
            recentMetrics: recentMetrics.map(m => ({
                operation: m.operation,
                duration: Math.round(m.duration),
                success: m.success,
                timestamp: new Date(Date.now() - (performance.now() - m.endTime)).toISOString()
            }))
        };

        return stats;
    }

    /**
     * Get analytics data
     */
    getAnalytics(): AnalyticsData & { sessionDuration: number; successRate: number } {
        const totalAttempts = this.analytics.successfulCreations + this.analytics.failedCreations + this.analytics.existingCollections;
        const successRate = totalAttempts > 0
            ? ((this.analytics.successfulCreations + this.analytics.existingCollections) / totalAttempts) * 100
            : 0;

        return {
            ...this.analytics,
            sessionDuration: Date.now() - this.analytics.sessionStartTime,
            successRate
        };
    }

    /**
     * Get operation breakdown
     */
    private getOperationBreakdown(): { [key: string]: { count: number; avgDuration: number; successRate: number } } {
        const breakdown: { [key: string]: { operations: PerformanceMetric[]; } } = {};

        // Group by operation
        this.metrics.forEach(metric => {
            if (!breakdown[metric.operation]) {
                breakdown[metric.operation] = { operations: [] };
            }
            breakdown[metric.operation].operations.push(metric);
        });

        // Calculate stats for each operation
        const result: { [key: string]: { count: number; avgDuration: number; successRate: number } } = {};

        Object.keys(breakdown).forEach(operation => {
            const ops = breakdown[operation].operations;
            result[operation] = {
                count: ops.length,
                avgDuration: ops.reduce((sum, op) => sum + op.duration, 0) / ops.length,
                successRate: (ops.filter(op => op.success).length / ops.length) * 100
            };
        });

        return result;
    }

    /**
     * Save analytics to sessionStorage
     */
    private saveAnalytics(): void {
        if (typeof window !== 'undefined' && window.sessionStorage) {
            try {
                window.sessionStorage.setItem('collection_plugin_analytics', JSON.stringify(this.analytics));
            } catch (error) {
                console.warn('[PerformanceMonitor] Failed to save analytics:', error);
            }
        }
    }

    /**
     * Load analytics from sessionStorage
     */
    private loadAnalytics(): void {
        if (typeof window !== 'undefined' && window.sessionStorage) {
            try {
                const saved = window.sessionStorage.getItem('collection_plugin_analytics');
                if (saved) {
                    const parsed = JSON.parse(saved);
                    this.analytics = { ...this.analytics, ...parsed };
                }
            } catch (error) {
                console.warn('[PerformanceMonitor] Failed to load analytics:', error);
            }
        }
    }

    /**
     * Export all data for debugging
     */
    exportData(): { metrics: PerformanceMetric[]; analytics: AnalyticsData; stats: any } {
        return {
            metrics: this.metrics,
            analytics: this.analytics,
            stats: this.getPerformanceStats()
        };
    }

    /**
     * Clear all data
     */
    clearData(): void {
        this.metrics = [];
        this.analytics = {
            buttonClicks: 0,
            successfulCreations: 0,
            failedCreations: 0,
            existingCollections: 0,
            averageResponseTime: 0,
            sessionStartTime: Date.now()
        };

        if (typeof window !== 'undefined' && window.sessionStorage) {
            window.sessionStorage.removeItem('collection_plugin_analytics');
        }

        console.log('[PerformanceMonitor] All data cleared');
    }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Helper functions for easy integration
export const startTiming = (operation: string, metadata?: any) =>
    performanceMonitor.startTiming(operation, metadata);

export const endTiming = (operationId: string, success: boolean = true, metadata?: any) =>
    performanceMonitor.endTiming(operationId, success, metadata);

export const recordButtonClick = () =>
    performanceMonitor.recordButtonClick();

export const recordCreationResult = (type: 'success' | 'failed' | 'existing') =>
    performanceMonitor.recordCreationResult(type);

export const getPerformanceStats = () =>
    performanceMonitor.getPerformanceStats();

export const getAnalytics = () =>
    performanceMonitor.getAnalytics();

// Expose to window for debugging in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    (window as any).collectionPluginMonitor = performanceMonitor;
}