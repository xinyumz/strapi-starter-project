# 🔄 Revalidate Plugin

**Next.js Incremental Static Regeneration (ISR) integration for Strapi v5**

The Revalidate plugin provides seamless integration with Next.js applications, enabling automatic cache invalidation and incremental static regeneration when content changes in your Strapi CMS. Features server-side cache management, clean frontend integration, and enterprise-grade reliability.

## 🎯 **Core Features**

### **Next.js ISR Integration**
- Automatic Incremental Static Regeneration triggering
- Smart cache invalidation based on content changes
- Configurable revalidation strategies per content type
- Support for both page-level and API route revalidation

### **Server-Side Cache Management**
- Intelligent cache invalidation algorithms
- Multi-environment support (development, staging, production)
- Batch revalidation for performance optimization
- Fallback mechanisms for revalidation failures

### **Clean Frontend Integration**
- Seamless webhook-based communication with Next.js
- Zero-configuration setup for standard use cases
- Custom revalidation logic support
- Real-time status monitoring and logging

### **Enterprise Reliability**
- Retry mechanisms with exponential backoff
- Dead letter queue for failed revalidations
- Comprehensive error logging and monitoring
- Rate limiting and throttling protection

## 🏗️ **Architecture Overview**

```
┌─────────────────────────────────────────────────┐
│               REVALIDATE PLUGIN                 │
├─────────────────────────────────────────────────┤
│  🔄 ISR Triggers       │  📡 Webhook Manager    │
│  - Content change det  │  - Next.js endpoints   │
│  - Smart invalidation  │  - Retry mechanisms    │
│  - Batch processing    │  - Status monitoring   │
├────────────────────────┼────────────────────────┤
│  🗄️ Cache Strategy     │  ⚙️ Configuration      │
│  - Path mapping        │  - Environment setup   │
│  - TTL management      │  - Custom logic        │
│  - Fallback handling   │  - Rate limiting       │
└─────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────┐
│              NEXT.JS APPLICATION                │
│           (Frontend Cache Management)           │
└─────────────────────────────────────────────────┘
```

## 🚀 **API Endpoints**

### **Revalidation Operations**
```http
POST   /revalidate/trigger
POST   /revalidate/batch
GET    /revalidate/status
POST   /revalidate/retry/:id
```

### **Configuration Management**
```http
GET    /revalidate/config
PUT    /revalidate/config
GET    /revalidate/paths
POST   /revalidate/paths/test
```

### **Monitoring & Analytics**
```http
GET    /revalidate/logs
GET    /revalidate/metrics
GET    /revalidate/health
DELETE /revalidate/cache
```

## ⚙️ **Configuration**

### **Environment Variables**
```env
# Next.js Application Settings (required)
NEXTJS_REVALIDATE_URL=https://your-nextjs-app.com
NEXTJS_REVALIDATE_TOKEN=your-secret-revalidation-token

# Revalidation Behavior (optional)
REVALIDATE_ENABLED=true
REVALIDATE_RETRY_ATTEMPTS=3
REVALIDATE_RETRY_DELAY=5000          # 5 seconds
REVALIDATE_BATCH_SIZE=10             # Max paths per batch
REVALIDATE_RATE_LIMIT=100            # Requests per minute

# Environment-specific settings
REVALIDATE_ENVIRONMENT=production     # development, staging, production
REVALIDATE_WEBHOOK_TIMEOUT=30000     # 30 seconds

# Debug mode (optional)
DEBUG_REVALIDATE=true
```

### **Content Type Configuration**
```typescript
// Configure revalidation behavior per content type
const revalidationConfig = {
    'api::article.article': {
        enabled: true,
        paths: [
            '/articles/[slug]',           // Dynamic article pages
            '/articles',                  // Article listing page
            '/',                         // Homepage if articles featured
        ],
        strategy: 'immediate',           // 'immediate', 'debounced', 'scheduled'
        debounceTime: 5000,             // For debounced strategy
        includeDrafts: false,           // Revalidate draft content changes
        customLogic: 'articleRevalidation' // Custom revalidation function
    },
    
    'api::collection.collection': {
        enabled: true,
        paths: [
            '/collections/[slug]',
            '/collections',
            '/categories/[category]'     // If collections grouped by category
        ],
        strategy: 'debounced',
        debounceTime: 10000,            // Wait 10s for multiple changes
        relatedContent: ['articles']    // Also revalidate related articles
    },
    
    'api::blog.blog': {
        enabled: true,
        paths: ['/blog/[slug]', '/blog'],
        strategy: 'immediate'
    }
};
```

## 💡 **Usage Examples**

### **Basic Revalidation Trigger**
```javascript
// Manually trigger revalidation for specific paths
const response = await fetch('/revalidate/trigger', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        paths: [
            '/articles/my-chinese-article',
            '/articles',
            '/'
        ],
        reason: 'Article published'
    })
});

const result = await response.json();
console.log('Revalidation status:', result.success);
console.log('Processed paths:', result.processedPaths);
```

### **Batch Revalidation**
```javascript
// Efficiently revalidate multiple paths
const response = await fetch('/revalidate/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        operations: [
            {
                type: 'article',
                id: 123,
                action: 'published',
                paths: ['/articles/chinese-grammar-guide']
            },
            {
                type: 'collection',
                id: 45,
                action: 'updated',
                paths: ['/collections/hsk-level-1']
            }
        ]
    })
});
```

### **Custom Revalidation Logic**
```javascript
// Define custom revalidation logic for complex scenarios
const customRevalidationFunctions = {
    async articleRevalidation(article, action) {
        const paths = [
            `/articles/${article.slug}`,
            '/articles'
        ];
        
        // If article is featured, also revalidate homepage
        if (article.featured) {
            paths.push('/');
        }
        
        // If article has category, revalidate category pages
        if (article.Category) {
            paths.push(`/categories/${article.Category.slug}`);
        }
        
        // If article is in collections, revalidate collection pages
        if (article.collections?.length > 0) {
            article.collections.forEach(collection => {
                paths.push(`/collections/${collection.slug}`);
            });
        }
        
        return paths;
    },
    
    async collectionRevalidation(collection, action) {
        const paths = [
            `/collections/${collection.slug}`,
            '/collections'
        ];
        
        // Revalidate all articles in the collection
        if (collection.articles?.length > 0) {
            collection.articles.forEach(article => {
                paths.push(`/articles/${article.slug}`);
            });
        }
        
        return paths;
    }
};
```

## 🔧 **Next.js Integration**

### **API Route Setup**
```javascript
// pages/api/revalidate.js or app/api/revalidate/route.js
export default async function handler(req, res) {
    // Verify the request is from your Strapi instance
    if (req.headers.authorization !== `Bearer ${process.env.REVALIDATE_SECRET_TOKEN}`) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const { paths, reason } = req.body;
    
    try {
        // Revalidate each path
        const results = await Promise.allSettled(
            paths.map(path => res.revalidate(path))
        );
        
        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected');
        
        console.log(`Revalidated ${successful}/${paths.length} paths. Reason: ${reason}`);
        
        if (failed.length > 0) {
            console.error('Failed revalidations:', failed);
        }
        
        return res.json({ 
            success: true, 
            revalidated: successful,
            failed: failed.length,
            reason 
        });
    } catch (err) {
        console.error('Revalidation error:', err);
        return res.status(500).json({ message: 'Error revalidating', error: err.message });
    }
}
```

### **Automatic Content Lifecycle Integration**
```javascript
// Strapi lifecycle hooks integration

// src/index.ts (register function) - v5 recommended approach
export default {
    register({ strapi }: any) {
        // Use Document Service middleware instead of lifecycle hooks
        strapi.documents('api::article.article').use(async (ctx, next) => {
            await next();
            
            if (['create', 'update', 'delete'].includes(ctx.action)) {
                try {
                    await strapi.plugin('revalidate').service('revalidationService').handleContentChange({
                        contentType: 'article',
                        data: ctx.result,
                        action: ctx.action
                    });
                } catch (error) {
                    console.error('Revalidation trigger failed:', error);
                    // Don't throw - don't break content operations if revalidation fails
                }
            }
        });
    }
};

async function triggerRevalidation(contentType, data, action) {
    try {
        await strapi.plugin('revalidate').service('revalidationService').handleContentChange({
            contentType,
            data,
            action
        });
    } catch (error) {
        console.error('Revalidation trigger failed:', error);
        // Don't throw - don't break content operations if revalidation fails
    }
}
```

## 📊 **Monitoring & Analytics**

### **Revalidation Status Tracking**
```javascript
// Get revalidation history and status
const response = await fetch('/revalidate/status?limit=50');
const statusData = await response.json();

// Example response:
// {
//   "recentRevalidations": [
//     {
//       "id": "rev_123",
//       "timestamp": "2024-01-15T10:30:00Z",
//       "paths": ["/articles/chinese-grammar"],
//       "status": "success",
//       "duration": 245,
//       "reason": "Article published"
//     }
//   ],
//   "metrics": {
//     "totalRevalidations": 1250,
//     "successRate": 98.4,
//     "averageDuration": 180,
//     "failureRate": 1.6
//   }
// }
```

### **Performance Metrics**
```javascript
// Comprehensive revalidation analytics
const response = await fetch('/revalidate/metrics');
const metrics = await response.json();

console.log('Success rate:', metrics.successRate);
console.log('Average response time:', metrics.averageResponseTime);
console.log('Most revalidated paths:', metrics.topPaths);
console.log('Peak revalidation times:', metrics.peakHours);
```

### **Health Check**
```javascript
// Monitor revalidation system health
const response = await fetch('/revalidate/health');
const health = await response.json();

// {
//   "status": "healthy",
//   "nextjsConnection": "connected",
//   "queueDepth": 2,
//   "lastSuccessfulRevalidation": "2024-01-15T10:35:00Z",
//   "errorRate": 0.02
// }
```

## 🚀 **Advanced Features**

### **Intelligent Path Resolution**
```typescript
interface PathResolutionContext {
    contentType: string;
    content: any;
    action: 'create' | 'update' | 'delete' | 'publish' | 'unpublish';
    locale?: string;
    previousVersion?: any;
}

// Smart path resolution based on content relationships
const intelligentPathResolver = {
    async resolveArticlePaths(context: PathResolutionContext): Promise<string[]> {
        const { content, action, locale } = context;
        const paths: string[] = [];
        
        // Always include the article's own page
        if (content.slug) {
            paths.push(`/articles/${content.slug}`);
            if (locale && locale !== 'en') {
                paths.push(`/${locale}/articles/${content.slug}`);
            }
        }
        
        // Include listing pages
        paths.push('/articles');
        if (locale && locale !== 'en') {
            paths.push(`/${locale}/articles`);
        }
        
        // Include category pages if article has categories
        if (content.Category?.slug) {
            paths.push(`/categories/${content.Category.slug}`);
        }
        
        // Include collection pages if article is in collections
        if (content.collections?.length > 0) {
            content.collections.forEach(collection => {
                if (collection.slug) {
                    paths.push(`/collections/${collection.slug}`);
                }
            });
        }
        
        // For featured articles, include homepage
        if (content.featured) {
            paths.push('/');
            if (locale && locale !== 'en') {
                paths.push(`/${locale}`);
            }
        }
        
        return [...new Set(paths)]; // Remove duplicates
    }
};
```

### **Conditional Revalidation**
```typescript
// Only revalidate when specific conditions are met
const conditionalRevalidation = {
    shouldRevalidateArticle(oldData: any, newData: any): boolean {
        // Only revalidate if content that affects frontend changed
        const significantFields = ['Title', 'Base', 'slug', 'published', 'featured'];
        
        return significantFields.some(field => oldData[field] !== newData[field]);
    },
    
    shouldRevalidateCollection(oldData: any, newData: any): boolean {
        // Revalidate if collection metadata or article relationships changed
        const collectionFields = ['Title', 'slug', 'published'];
        const metadataChanged = collectionFields.some(field => oldData[field] !== newData[field]);
        
        // Check if articles in collection changed
        const oldArticleIds = new Set(oldData.articles?.map(a => a.id) || []);
        const newArticleIds = new Set(newData.articles?.map(a => a.id) || []);
        const articlesChanged = oldArticleIds.size !== newArticleIds.size || 
                               [...oldArticleIds].some(id => !newArticleIds.has(id));
        
        return metadataChanged || articlesChanged;
    }
};
```

### **Queue Management**
```typescript
// Advanced queue management for high-traffic scenarios
interface RevalidationJob {
    id: string;
    paths: string[];
    priority: 'low' | 'normal' | 'high' | 'critical';
    attempts: number;
    maxAttempts: number;
    nextRetry?: Date;
    metadata: {
        contentType: string;
        contentId: number;
        reason: string;
        timestamp: Date;
    };
}

const queueManager = {
    async addJob(job: Omit<RevalidationJob, 'id' | 'attempts'>): Promise<string> {
        const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        await strapi.db.query('revalidation-job').create({
            data: {
                ...job,
                id: jobId,
                attempts: 0,
                status: 'pending'
            }
        });
        
        return jobId;
    },
    
    async processQueue(): Promise<void> {
        const pendingJobs = await strapi.db.query('revalidation-job').findMany({
            where: {
                status: 'pending',
                nextRetry: { $lte: new Date() }
            },
            orderBy: [
                { priority: 'desc' },
                { timestamp: 'asc' }
            ],
            limit: 10
        });
        
        for (const job of pendingJobs) {
            try {
                await this.executeRevalidation(job);
                await this.markJobComplete(job.id);
            } catch (error) {
                await this.handleJobFailure(job, error);
            }
        }
    }
};
```

## 🔍 **Troubleshooting**

### **Common Issues & Solutions**

#### **Revalidation Timeouts**
```
Error: Revalidation request timed out after 30 seconds
```
**Solution:**
1. Check Next.js application health and response times
2. Increase `REVALIDATE_WEBHOOK_TIMEOUT` value
3. Verify network connectivity between Strapi and Next.js
4. Enable debug logging to identify bottlenecks

#### **Authentication Failures**
```
Error: Next.js revalidation returned 401 Unauthorized
```
**Solution:**
1. Verify `NEXTJS_REVALIDATE_TOKEN` matches in both applications
2. Check Next.js API route authorization logic
3. Ensure token is properly included in webhook headers

#### **Path Resolution Issues**
```
Warning: Revalidation path '/articles/undefined' is invalid
```
**Solution:**
1. Check content slug generation in Strapi
2. Verify path template configuration
3. Add null checks in custom path resolution logic

### **Debug Mode**
```env
DEBUG_REVALIDATE=true
```
Enables comprehensive logging:
- Webhook request/response details
- Path resolution step-by-step breakdown
- Queue processing and retry attempts
- Performance timing for each operation

## 🚀 **Performance Optimization**

### **Batching Strategy**
- **Smart Grouping** - Combine related revalidations into single requests
- **Debouncing** - Wait for multiple rapid changes before revalidating
- **Priority Queuing** - Process critical revalidations first
- **Rate Limiting** - Prevent overwhelming Next.js application

### **Caching Efficiency**
- **Path Deduplication** - Remove duplicate paths from batch requests
- **Conditional Revalidation** - Only revalidate when content meaningfully changes
- **Selective Invalidation** - Target specific pages rather than broad invalidation
- **TTL Management** - Balance freshness with performance

## 📈 **Future Enhancements**

### **Planned Features**
- **Predictive Revalidation** - Pre-emptively revalidate popular content
- **Multi-Environment Sync** - Coordinate revalidation across environments
- **A/B Testing Support** - Selective revalidation for feature flags
- **Analytics Dashboard** - Visual monitoring of revalidation patterns
- **Custom Webhooks** - Support for additional frontend frameworks

### **Integration Roadmap**
- **Vercel Integration** - Native Vercel edge cache management
- **Cloudflare Support** - Cloudflare Workers cache invalidation
- **CDN Integration** - Multi-CDN cache purging capabilities
- **Monitoring Tools** - DataDog, NewRelic integration for observability

---

**The Revalidate plugin ensures your Next.js frontend stays perfectly synchronized with your Strapi CMS content changes, providing enterprise-grade cache management that scales with your application while maintaining optimal performance and reliability.**