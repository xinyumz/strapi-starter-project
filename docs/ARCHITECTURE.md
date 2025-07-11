# 🏗️ **Multilingual CMS Architecture Overview**

**Enterprise-grade multilingual content management system built on Strapi v5.17.0**

This document provides a comprehensive overview of the system architecture, plugin relationships, data flow, and technical implementation details for developers and system administrators.

## 🎯 **System Philosophy**

### **Core Design Principles**
- **Language Agnostic** - No hard-coded language assumptions
- **Registry-Based** - Modular processor architecture
- **Manual Save UX** - Professional user control over data persistence
- **Production Ready** - Enterprise-grade error handling and monitoring
- **Future Proof** - Extensible for any language processing needs

### **Professional UX Standards**
- Smart change detection (save buttons only when needed)
- Batch operations for efficiency
- Visual feedback for all operations (saving, saved, errors)
- Comprehensive error recovery with retry mechanisms
- Consistent patterns across all components

## 🧩 **Plugin Ecosystem**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    STRAPI v5.17.0 CORE SYSTEM                          │
├─────────────────────────────────────────────────────────────────────────┤
│  🌍 PER-LANGUAGE (Hub)  │  🎯 CHINESE-PROCESSOR  │  🔗 TRANSLATOR    │
│  - Registry System      │  - HSK Analysis         │  - Google API     │
│  - Generic Interface    │  - Grammar Rules        │  - Multi-target   │
│  - Manual Save UX       │  - Sentence Segmentation│  - Fallback Logic │
├─────────────────────────┼─────────────────────────┼───────────────────┤
│  📂 COLLECTION-MGR      │  🏷️ CATEGORY-MGR        │  🔄 REVALIDATE    │
│  - Health Monitoring    │  - Hierarchical Tags    │  - Next.js ISR    │
│  - Orphan Detection     │  - Multi-taxonomy        │  - Server-side    │
│  - Enterprise Analytics │  - Cascading Dropdowns  │  - Clean UX       │
└─────────────────────────────────────────────────────────────────────────┘
```

### **Plugin Roles & Responsibilities**

#### **🌍 Per-Language (Central Hub)**
- **Role:** Central orchestrator for all multilingual functionality
- **Responsibilities:**
  - Language processor registry management
  - Generic interface for language processing
  - Translation workflow coordination
  - Manual save UX implementation
  - Content access tier management

#### **🎯 Chinese Article Processor (Language Processor)**
- **Role:** Specialized Chinese language processing
- **Responsibilities:**
  - HSK difficulty analysis
  - Grammar rule generation
  - Sentence segmentation
  - Pinyin and tone processing
  - Educational content structuring

#### **📂 Collection Manager (Health Monitoring)**
- **Role:** Collection health and maintenance automation
- **Responsibilities:**
  - Real-time health monitoring with floating badges
  - Orphan and duplicate detection
  - Hybrid health scoring algorithms
  - Professional analytics dashboard

#### **🔗 Translator (Translation Engine)**
- **Role:** Multi-language translation coordination
- **Responsibilities:**
  - Google Cloud Translation API integration
  - Translation quality management
  - Multi-target language support
  - Fallback and error recovery

#### **🏷️ Category Manager (Taxonomy)**
- **Role:** Hierarchical content categorization
- **Responsibilities:**
  - Multi-level category structures
  - Cascading dropdown UX
  - Tag management and organization

#### **🔄 Revalidate (Cache Management)**
- **Role:** Next.js integration and cache invalidation
- **Responsibilities:**
  - Incremental Static Regeneration (ISR)
  - Server-side cache management
  - Clean frontend integration

## 🏛️ **Database Architecture**

### **Understanding Database Schema Creation**

When Strapi creates database tables, it combines:
1. **The defined fields** (business logic from content type schemas)
2. **Strapi auto-generated fields** (system management)

### **Field Naming Convention**
- **Schema Definition:** PascalCase (`Title`, `LanguageProcessor`)
- **Database Storage:** snake_case (`title`, `language_processor`)
- **API/Frontend:** PascalCase (`Title`, `LanguageProcessor`)

### **Core Content Types**

#### **Articles Table**
```sql
articles (
    -- Core content fields (from the schema)
    id                 INTEGER PRIMARY KEY AUTO_INCREMENT,
    title              VARCHAR(255),               -- "Title" in schema
    date               DATE,                        -- "Date" in schema
    category           INTEGER,                     -- "Category" custom field → integer
    base               LONGTEXT,                    -- "Base" richtext field
    language_processor LONGTEXT,                    -- "LanguageProcessor" custom field → JSON
    
    -- Strapi v5 auto-generated fields
    created_at         DATETIME(6),
    updated_at         DATETIME(6),
    published_at       DATETIME(6),
    created_by_id      INTEGER UNSIGNED,
    updated_by_id      INTEGER UNSIGNED,
    locale             VARCHAR(255),                -- i18n locale
    document_id        VARCHAR(255)                 -- Strapi v5 document ID
);
```

#### **Collections Table**
```sql
collections (
    -- Core content fields (from the schema)
    id            INTEGER PRIMARY KEY AUTO_INCREMENT,
    title         VARCHAR(255),                     -- "Title" in schema
    date          DATE,                              -- "Date" in schema
    category      INTEGER,                           -- "Category" custom field → integer
    per_language  LONGTEXT,                          -- "PerLanguage" custom field → JSON
    
    -- Strapi v5 auto-generated fields
    created_at    DATETIME(6),
    updated_at    DATETIME(6),
    published_at  DATETIME(6),
    created_by_id INTEGER UNSIGNED,
    updated_by_id INTEGER UNSIGNED,
    locale        VARCHAR(255),                      -- i18n locale
    document_id   VARCHAR(255)                       -- Strapi v5 document ID
);
```

#### **Blogs Table**
```sql
blogs (
    -- Core content fields (from the schema)
    id            INTEGER PRIMARY KEY AUTO_INCREMENT,
    title         VARCHAR(255),                     -- "Title" in schema
    date          DATE,                              -- "Date" in schema
    body          LONGTEXT,                          -- "Body" CKEditor field
    
    -- Strapi v5 auto-generated fields
    created_at    DATETIME(6),
    updated_at    DATETIME(6),
    published_at  DATETIME(6),
    created_by_id INTEGER UNSIGNED,
    updated_by_id INTEGER UNSIGNED,
    document_id   VARCHAR(255),                      -- Strapi v5 document ID
    locale        VARCHAR(255)                       -- i18n locale
);
```

### **Multilingual Data Layer (Plugin Tables)**

#### **Article Per-Language Content**
```sql
article_perlanguages (
    -- Plugin-defined fields (business logic)
    id                 INTEGER PRIMARY KEY AUTO_INCREMENT,
    article_id         INTEGER,                      -- References articles.id
    language           VARCHAR(255),                 -- Language code (zh, en, es)
    per_language_text  LONGTEXT,                    -- Translated content
    processed_data     JSON,                        -- Language processor results
    difficulty_data    JSON,                        -- HSK/difficulty analysis
    display_skill      VARCHAR(50),                 -- Skill level display
    published          TINYINT(1),                  -- Published status per language
    access_tier        VARCHAR(20),                 -- Access control level
    
    -- Strapi auto-generated fields
    created_at         DATETIME(6),
    updated_at         DATETIME(6),
    published_at       DATETIME(6),
    created_by_id      INTEGER UNSIGNED,
    updated_by_id      INTEGER UNSIGNED,
    document_id        VARCHAR(255),
    locale             VARCHAR(255)
);
```

#### **Collection Per-Language Content**
```sql
collection_perlanguages (
    -- Plugin-defined fields (business logic)
    id            INTEGER PRIMARY KEY AUTO_INCREMENT,
    collection_id INTEGER,                          -- References collections.id
    language      VARCHAR(255),                     -- Language code
    description   LONGTEXT,                         -- Translated description
    display_skill VARCHAR(50),                      -- Skill level display
    published     TINYINT(1),                       -- Published status per language
    access_tier   VARCHAR(20),                      -- Access control level
    
    -- Strapi auto-generated fields
    created_at    DATETIME(6),
    updated_at    DATETIME(6),
    published_at  DATETIME(6),
    created_by_id INTEGER UNSIGNED,
    updated_by_id INTEGER UNSIGNED,
    document_id   VARCHAR(255),
    locale        VARCHAR(255)
);
```

### **Language Processing Tables (Chinese Processor Plugin)**

#### **Article Sentences**
```sql
article_sentences (
    -- Plugin-defined fields (business logic)
    id              INTEGER PRIMARY KEY AUTO_INCREMENT,
    article_id      INTEGER,                        -- References articles.id
    per_language_id INTEGER,                        -- References article_perlanguages.id
    language        VARCHAR(10),                    -- Language code
    sentence_text   LONGTEXT,                       -- Individual sentence text
    sentence_order  INTEGER,                        -- Order within article
    
    -- Strapi auto-generated fields
    created_at      DATETIME(6),
    updated_at      DATETIME(6),
    published_at    DATETIME(6),
    created_by_id   INTEGER UNSIGNED,
    updated_by_id   INTEGER UNSIGNED,
    document_id     VARCHAR(255),
    locale          VARCHAR(255)
);
```

#### **Grammar Rules**
```sql
sentence_grammar_rules (
    -- Plugin-defined fields (business logic)
    id          INTEGER PRIMARY KEY AUTO_INCREMENT,
    sentence_id INTEGER,                            -- References article_sentences.id
    rule        VARCHAR(255),                       -- Grammar rule text
    
    -- Strapi auto-generated fields
    created_at    DATETIME(6),
    updated_at    DATETIME(6),
    published_at  DATETIME(6),
    created_by_id INTEGER UNSIGNED,
    updated_by_id INTEGER UNSIGNED,
    document_id   VARCHAR(255),
    locale        VARCHAR(255)
);
```

#### **Sentence Translations**
```sql
sentence_translations (
    -- Plugin-defined fields (business logic)
    id                   INTEGER PRIMARY KEY AUTO_INCREMENT,
    sentence_id          INTEGER,                   -- References article_sentences.id
    translation_language VARCHAR(255),             -- Target language code
    translation_text     LONGTEXT,                 -- Translated sentence
    
    -- Strapi auto-generated fields
    created_at           DATETIME(6),
    updated_at           DATETIME(6),
    published_at         DATETIME(6),
    created_by_id        INTEGER UNSIGNED,
    updated_by_id        INTEGER UNSIGNED,
    document_id          VARCHAR(255),
    locale               VARCHAR(255)
);
```

### **Category Manager Tables**

#### **Taxons (Category Types)**
```sql
category_manager_taxons (
    -- Plugin-defined fields (business logic)
    id   INTEGER PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255),                             -- Taxon name (e.g., "Content Type")
    url  VARCHAR(255),                             -- URL slug
    
    -- Strapi auto-generated fields
    created_at    DATETIME(6),
    updated_at    DATETIME(6),
    published_at  DATETIME(6),
    created_by_id INTEGER UNSIGNED,
    updated_by_id INTEGER UNSIGNED,
    document_id   VARCHAR(255),
    locale        VARCHAR(255)
);
```

#### **Categories**
```sql
category_manager_categories (
    -- Plugin-defined fields (business logic)
    id    INTEGER PRIMARY KEY AUTO_INCREMENT,
    name  VARCHAR(255),                            -- Category name
    url   VARCHAR(255),                            -- URL slug
    order INTEGER,                                 -- Sort order
    
    -- Strapi auto-generated fields
    created_at    DATETIME(6),
    updated_at    DATETIME(6),
    published_at  DATETIME(6),
    created_by_id INTEGER UNSIGNED,
    updated_by_id INTEGER UNSIGNED,
    document_id   VARCHAR(255),
    locale        VARCHAR(255)
);
```

### **Relationship Tables (Auto-Generated)**

#### **Article-Collection Relationships**
```sql
articles_collections_lnk (
    id             INTEGER PRIMARY KEY AUTO_INCREMENT,
    article_id     INTEGER UNSIGNED,               -- References articles.id
    collection_id  INTEGER UNSIGNED,               -- References collections.id
    collection_ord DOUBLE UNSIGNED,                -- Sort order in collection
    article_ord    DOUBLE UNSIGNED                 -- Sort order of collection in article
);
```

#### **Category-Taxon Relationships**
```sql
category_manager_categories_taxon_lnk (
    id           INTEGER PRIMARY KEY AUTO_INCREMENT,
    category_id  INTEGER UNSIGNED,                 -- References category_manager_categories.id
    taxon_id     INTEGER UNSIGNED,                 -- References category_manager_taxons.id
    category_ord DOUBLE UNSIGNED                   -- Sort order
);
```

### **Custom Field Storage**

Custom fields in schemas are stored as JSON/text rather than creating additional tables:
- `Category` field → Stores category selection as integer reference
- `LanguageProcessor` field → Stores processor configuration as JSON in longtext
- `PerLanguage` field → Stores multilingual metadata as JSON in longtext

### **Media Field Implementation**

Media fields (like `Cover`) create references to Strapi's upload system:
- Core media tables: `files`, `files_related_mph` (managed by Strapi)
- Content references files via Strapi's internal relation system
- No direct foreign key columns in  main tables

### **Key Schema Notes**

#### **Strapi v5 Standard Fields**
All content types automatically include:
- `id` - Primary key
- `document_id` - Unique document identifier (Strapi v5 feature)
- `created_at`, `updated_at`, `published_at` - Timestamp tracking
- `created_by_id`, `updated_by_id` - User audit trail
- `locale` - i18n locale (added when i18n plugin is globally enabled)

#### **Why Extra Fields Exist**
- **locale field** → Added because main content types use i18n, enabling it globally
- **published_at field** → Added by Strapi v5 document lifecycle system
- **User tracking fields** → Standard Strapi audit functionality
- **document_id field** → Strapi v5 document management system

#### **Fresh Installation Behavior**
During fresh setup, Strapi will:
1. Create all tables with defined business logic fields
2. Automatically add standard Strapi system fields
3. Set up proper foreign key relationships
4. Enable the cascading delete system for data integrity

## 🗑️ **Cascading Delete Architecture**

### **Data Integrity Management**
The system implements enterprise-grade cascading delete functionality in `src/index.ts` to maintain data integrity across all multilingual and language processing tables. This ensures no orphaned data remains when articles or collections are deleted.

```
┌─────────────────────────────────────────────────┐
│            CASCADE DELETE SYSTEM               │
├─────────────────────────────────────────────────┤
│  🔄 Lifecycle Hooks    │  📦 Entity Override    │
│  - Individual deletes  │  - Bulk operations     │
│  - Real-time cleanup   │  - Query-based cleanup │
├────────────────────────┼────────────────────────┤
│  🧹 Article Cleanup    │  🗂️ Collection Cleanup │
│  - article_perlanguages│  - collection_perlanguages
│  - article_sentences   │  - Reference integrity │
│  - sentence_grammar_*  │  - Health score updates │
│  - sentence_translations│ - Orphan prevention   │
└─────────────────────────────────────────────────┘
```

### **Cleanup Scope by Content Type**

#### **Article Deletions Clean Up:**
- `article_perlanguages` - All multilingual content and processed data
- `article_sentences` - Chinese processor sentence segmentation
- `sentence_grammar_rules` - Grammar analysis results
- `sentence_translations` - Sentence-level translations

#### **Collection Deletions Clean Up:**
- `collection_perlanguages` - Multilingual collection descriptions and metadata

### **Performance Characteristics**
- **Individual Deletions:** ~50-200ms additional processing per item
- **Bulk Deletions:** Optimized batch processing with transaction safety
- **Memory Efficient:** Processes items individually to prevent memory spikes
- **Atomic Operations:** All-or-nothing cleanup prevents partial data states

## 🔄 **Data Flow Architecture**

### **Content Creation Workflow**
```
1. Article Creation
   ├── Core content in `articles` table
   ├── Category assignment via Category Manager
   └── LanguageProcessor field configuration

2. Translation Process
   ├── Google Cloud Translation via Translator plugin
   ├── Content stored in `article_perlanguages`
   └── Manual save confirmation with UX feedback

3. Language Processing
   ├── Registry lookup via Per-Language hub
   ├── Processor-specific analysis (HSK, grammar, etc.)
   ├── Structured data stored in `processed_data` field
   └── Educational metadata in `difficulty_data`

4. Collection Management
   ├── Articles grouped into collections
   ├── Collection health monitoring via Collection Manager
   ├── Multilingual collection descriptions
   └── Access tier and publish controls
```

### **Processing Pipeline**
```
Content Input → Language Detection → Processor Selection → Analysis → Manual Save → Storage
     ↓              ↓                    ↓               ↓          ↓         ↓
Article Text → Hub Registry → Chinese Processor → HSK+Grammar → User Save → DB Storage
```

## 🔧 **Language Processor Interface**

### **Generic Processor Contract**
```typescript
interface LanguageProcessorInterface {
    readonly processorId: string;           // 'chinese-hsk-processor'
    readonly languageCodes: string[];       // ['zh', 'zh-CN', 'zh-TW']
    readonly displayName: string;           // 'Chinese HSK Processor'

    processContent(content: string, options?: any): Promise<any>;
    saveProcessedData(articleId: number, language: string, data: any, displaySkill?: string): Promise<void>;
    getProcessedData(articleId: number, language: string): Promise<any>;
}
```

### **Registration System**
```typescript
// Processors register themselves at startup
export default ({ strapi }: any) => {
    const registry = strapi.plugin('per-language')?.service('languageProcessorRegistry');
    const adapter = strapi.plugin('chinese-article-processor').service('processorAdapter');

    if (registry && adapter) {
        registry.registerProcessor(adapter);
        console.log('[Chinese Processor] ✅ Registered with registry');
    }
};
```

### **Future Language Processors**
```typescript
// Japanese JLPT Processor (example)
{
    processorId: 'japanese-jlpt-processor',
    languageCodes: ['ja'],
    displayName: 'Japanese JLPT Processor',
    
    async processContent(content: string): Promise<any> {
        return {
            jlpt: { level: 'N3', vocabulary: [...], grammar: [...] },
            kanji: { count: 45, levels: [...] },
            // ... JLPT-specific analysis
        };
    }
}

// Korean TOPIK Processor (example)
{
    processorId: 'korean-topik-processor', 
    languageCodes: ['ko'],
    displayName: 'Korean TOPIK Processor',
    
    async processContent(content: string): Promise<any> {
        return {
            topik: { level: 'TOPIK 2', vocabulary: [...] },
            hangul: { syllables: [...], complexity: [...] },
            // ... TOPIK-specific analysis
        };
    }
}
```

## 🎨 **Manual Save UX Architecture**

### **Design Philosophy**
Traditional auto-save creates user anxiety and potential data conflicts. Our manual save system provides:
- **Complete user control** over when data is persisted
- **Visual feedback** for unsaved changes
- **Batch operations** for efficiency
- **Error recovery** with retry mechanisms

### **State Management Pattern**
```typescript
// Consistent pattern across all components
interface ManualSaveState {
    pendingChanges: Record<string, any>;    // Track what changed
    originalValues: Record<string, any>;    // For change detection
    isSaving: boolean;                      // Loading state
    saveError?: string;                     // Error handling
}

// Smart change detection
const hasUnsavedChanges = Object.keys(pendingChanges).length > 0;
const actuallyChanged = pendingChanges[field] !== originalValues[field];
```

### **UX Components**
- **Change Detection** - Save button only appears when values differ from original
- **Batch Saving** - Multiple field changes saved together
- **Visual Feedback** - "Saving..." → "Saved!" → (disappears)
- **Error Recovery** - Clear error messages with retry options
- **Disabled Actions** - Prevent conflicts during save operations

## 📊 **Health Monitoring System**

### **Hybrid Scoring Algorithm**
Traditional percentage-based health scoring fails at scale (1000 collections, 1 issue = 99% invisible). Our hybrid system ensures issues are always visible:

```typescript
// Hybrid Health Calculation
const healthScore = 100 - basePenalties - scaledPenalties;

// Base penalties (fixed impact for any issues)
const basePenalties = (orphans > 0 ? 5 : 0) + (duplicates > 0 ? 2 : 0);

// Scaled penalties (proportional impact)
const scaledPenalties = (orphans/total * 40) + (duplicates/total * 20);
```

### **Real-Time Monitoring**
- **Floating health badge** automatically appears on collection list pages
- **Dynamic content** based on actual issues ("All Good" vs "X Issues Found")
- **Sub-100ms performance** with intelligent caching
- **One-click refresh** with cache invalidation

## 🚀 **Performance Architecture**

### **Caching Strategy**
```typescript
// Intelligent multi-layer caching
const cacheConfig = {
    healthOverview: { ttl: 120000 },      // 2 minutes - frequent access
    orphanDetection: { ttl: 300000 },     // 5 minutes - expensive analysis
    duplicateDetection: { ttl: 600000 },  // 10 minutes - most expensive
    languageProcessing: { ttl: 86400000 } // 24 hours - rarely changes
};
```

### **Response Time Targets**
- **Cache Hits:** <100ms for all operations
- **Fresh Analysis:** <2s for health, <5s for complex analysis
- **User Interactions:** <200ms for save operations
- **Background Tasks:** Async processing for heavy computations

### **Memory Management**
- Automatic cache cleanup for expired entries
- Configurable size limits to prevent memory bloat
- Efficient data structures for large-scale operations
- Memory leak prevention with proper cleanup patterns

## 🔐 **Security Architecture**

### **API Security**
- **Authentication:** Strapi built-in user authentication
- **Authorization:** Role-based access control (RBAC)
- **Input Validation:** Comprehensive parameter validation
- **Error Handling:** Secure error messages (no sensitive data leakage)

### **Data Protection**
- **Sensitive Data:** Google Cloud credentials properly secured
- **Cache Security:** No sensitive data in memory caches
- **Audit Trails:** Comprehensive logging for all operations
- **Privacy:** Configurable data retention policies

## 🚀 **Deployment Architecture**

### **Environment Configuration**
```env
# Core Strapi Configuration
NODE_ENV=production
DATABASE_URL=mysql://user:pass@host:port/db

# Google Cloud Translation
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json

# Debug Controls
DEBUG=false
DEBUG_HEALTH=false
DEBUG_PLUGINS=false

# Cache Configuration  
HEALTH_CACHE_TTL=120000
ORPHAN_CACHE_TTL=300000
DUPLICATE_CACHE_TTL=600000
```

### **Scaling Considerations**
- **Database Indexing:** Optimized indexes on foreign keys and search fields
- **CDN Integration:** Static assets served via CDN
- **Load Balancing:** Multiple Strapi instances with shared database
- **Cache Layers:** Redis for shared caching in multi-instance setups

## 📈 **Monitoring & Analytics**

### **Health Metrics**
- System health scores with trend analysis
- Plugin performance metrics (response times, cache hit rates)
- Error rates and failure patterns
- User interaction analytics (save patterns, error recovery)

### **Business Intelligence**
- Content creation patterns by language
- Translation usage statistics
- Processing accuracy metrics
- Collection health trends over time

## 🔮 **Future Architecture**

### **Planned Enhancements**
- **Microservices Architecture** - Plugin separation for independent scaling
- **Event-Driven Processing** - Async workflows with message queues
- **AI Integration** - Machine learning for content analysis improvements
- **Multi-Tenant Support** - Isolated environments for different organizations

### **Technology Roadmap**
- **Next.js 15** integration for improved frontend performance
- **PostgreSQL** migration for advanced query capabilities
- **Docker** containerization for simplified deployment
- **Kubernetes** orchestration for enterprise scaling