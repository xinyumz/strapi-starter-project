// src/plugins/revalidate/server/services/revalidate-service.ts

interface RevalidationConfig {
    baseUrl: string;
    secret: string;
    timeout: number;
    userAgent: string;
}

interface RevalidationResult {
    success: boolean;
    status?: number;
    statusText?: string;
    responseText?: string;
    processingTime: number;
    error?: string;
}

export default ({ strapi }: any) => ({

    /**
     * Get revalidation configuration
     * Can be overridden via environment variables or plugin config
     */
    getConfig(): RevalidationConfig {
        return {
            baseUrl: process.env.REVALIDATE_BASE_URL || 'https://pandaist.com',
            secret: process.env.REVALIDATE_SECRET || 'tempsecret',
            timeout: parseInt(process.env.REVALIDATE_TIMEOUT || '10000'),
            userAgent: 'Strapi-Revalidate-Plugin/1.0.0'
        };
    },

    /**
     * Validate a revalidation path
     */
    validatePath(path: string): { valid: boolean; error?: string } {
        if (!path || typeof path !== 'string') {
            return { valid: false, error: 'Path is required and must be a string' };
        }

        const cleanPath = path.trim();

        if (!cleanPath.startsWith('/')) {
            return { valid: false, error: 'Path must start with /' };
        }

        if (cleanPath.length > 500) {
            return { valid: false, error: 'Path too long (max 500 characters)' };
        }

        // Basic URL encoding check
        try {
            encodeURIComponent(cleanPath);
        } catch (error) {
            return { valid: false, error: 'Path contains invalid characters' };
        }

        return { valid: true };
    },

    /**
     * Build revalidation URL
     */
    buildRevalidationUrl(path: string): string {
        const config = this.getConfig();
        return `${config.baseUrl}/api/revalidate?secret=${config.secret}&path=${encodeURIComponent(path)}`;
    },

    /**
     * Perform the actual revalidation request
     */
    async performRevalidation(path: string): Promise<RevalidationResult> {
        const startTime = Date.now();

        try {
            // Validate path
            const validation = this.validatePath(path);
            if (!validation.valid) {
                return {
                    success: false,
                    error: validation.error,
                    processingTime: Date.now() - startTime
                };
            }

            const config = this.getConfig();
            const revalidateUrl = this.buildRevalidationUrl(path.trim());

            console.log(`[RevalidateService] Making request to: ${revalidateUrl}`);

            // Make the HTTP request
            const response = await fetch(revalidateUrl, {
                method: 'GET',
                headers: {
                    'User-Agent': config.userAgent,
                },
                signal: AbortSignal.timeout(config.timeout)
            });

            const processingTime = Date.now() - startTime;

            // Get response text
            let responseText = '';
            try {
                responseText = await response.text();
            } catch (textError) {
                // Ignore text parsing errors
            }

            if (response.ok) {
                console.log(`[RevalidateService] ✅ Success: ${response.status} ${response.statusText} (${processingTime}ms)`);

                return {
                    success: true,
                    status: response.status,
                    statusText: response.statusText,
                    responseText,
                    processingTime
                };
            } else {
                console.error(`[RevalidateService] ❌ Failed: ${response.status} ${response.statusText}`);

                return {
                    success: false,
                    status: response.status,
                    statusText: response.statusText,
                    responseText,
                    error: `HTTP ${response.status}: ${response.statusText}`,
                    processingTime
                };
            }

        } catch (error) {
            const processingTime = Date.now() - startTime;

            let errorMessage = 'Unknown error occurred';

            if (error instanceof Error) {
                errorMessage = error.message;

                if (error.name === 'TimeoutError') {
                    errorMessage = 'Request timed out';
                } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
                    errorMessage = 'Network error occurred';
                }
            }

            console.error(`[RevalidateService] ❌ Error (${processingTime}ms):`, error);

            return {
                success: false,
                error: errorMessage,
                processingTime
            };
        }
    },

    /**
     * Get service health and configuration info
     */
    async getServiceHealth(): Promise<{
        status: string;
        config: Partial<RevalidationConfig>;
        timestamp: string;
    }> {
        const config = this.getConfig();

        return {
            status: 'healthy',
            config: {
                baseUrl: config.baseUrl,
                timeout: config.timeout,
                userAgent: config.userAgent
                // Don't expose secret in health check
            },
            timestamp: new Date().toISOString()
        };
    }
});