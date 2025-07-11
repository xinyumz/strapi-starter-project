# 🌍 Per-Language Plugin

**Enterprise-grade multilingual content management for Strapi v5**

The Per-Language plugin serves as the central hub for managing multilingual content in the Strapi application. It provides a language-agnostic architecture that can work with any language processor while maintaining professional manual save UX and comprehensive error handling.

## 🎯 **Core Features**

### **Language Processor Registry System**
- Generic interface for any language processor
- Automatic processor registration and discovery
- Fallback mechanisms for compatibility
- Future-ready for additional language processors

### **Professional Manual Save UX**
- Smart change detection (save button only appears when needed)
- Batch operations for efficiency
- Pending changes tracking with visual feedback
- Discard functionality for safety
- Professional loading states and error recovery

### **Translation Workflows**
- Google Cloud Translation integration
- Automatic content translation to target languages
- Translation + processing workflows
- Access tier management and publish controls

### **Content Management**
- Article-specific language content storage
- Collection multilingual support
- Structured metadata preservation
- Difficulty analysis integration

## 🏗️ **Architecture Overview**

```
┌─────────────────────────────────────────────────┐
│                PER-LANGUAGE HUB                 │
├─────────────────────────────────────────────────┤
│  🔧 Registry System    │  📝 Content Manager   │
│  - Processor discovery │  - Article languages  │
│  - Interface standards │  - Translation storage │
│  - Fallback handling   │  - Access controls     │
├────────────────────────┼────────────────────────┤
│  🔄 Translation        │  💾 Manual Save UX    │
│  - Google Cloud API    │  - Change detection    │
│  - Multi-target        │  - Batch operations    │
│  - Workflow automation │  - Error recovery      │
└─────────────────────────────────────────────────┘
```

## 📊 **Database Schema**

### **Article Per-Language Content**
```sql
article_perlanguages (
    -- Plugin-defined fields (business logic)
    id                 INTEGER PRIMARY KEY,
    article_id         INTEGER NOT NULL,            -- References articles.id
    language           VARCHAR(255) NOT NULL,       -- Language code (zh, en, es, etc.)
    per_language_text  LONGTEXT NOT NULL,          -- Translated content
    processed_data     JSON,                       -- Language processor results
    difficulty_data    JSON,                       -- HSK/difficulty analysis
    display_skill      VARCHAR(50),                -- Skill level display
    published          BOOLEAN DEFAULT FALSE,      -- Published status per language
    access_tier        VARCHAR(20),                -- Access control level
    
    -- Strapi auto-generated fields (added automatically)
    created_at         DATETIME(6),
    updated_at         DATETIME(6),
    published_at       DATETIME(6),
    created_by_id      INTEGER UNSIGNED,
    updated_by_id      INTEGER UNSIGNED,
    document_id        VARCHAR(255),               -- Strapi v5 document identifier
    locale             VARCHAR(255)                -- i18n locale
);
```

### **Collection Per-Language Content**
```sql
collection_perlanguages (
    -- Plugin-defined fields (business logic)
    id            INTEGER PRIMARY KEY,
    collection_id INTEGER NOT NULL,                -- References collections.id
    language      VARCHAR(255) NOT NULL,           -- Language code
    description   LONGTEXT,                        -- Translated description
    access_tier   VARCHAR(20),                     -- Access control level
    display_skill VARCHAR(50),                     -- Skill level display
    published     BOOLEAN DEFAULT FALSE,           -- Published status per language
    
    -- Strapi auto-generated fields (added automatically)
    created_at    DATETIME(6),
    updated_at    DATETIME(6),
    published_at  DATETIME(6),
    created_by_id INTEGER UNSIGNED,
    updated_by_id INTEGER UNSIGNED,
    document_id   VARCHAR(255),                    -- Strapi v5 document identifier
    locale        VARCHAR(255)                     -- i18n locale
);
```

### **Schema Notes**

#### **Plugin-Defined vs Auto-Generated Fields**
- **Plugin-defined fields** - These are the business logic fields defined in the plugin schema
- **Strapi auto-generated fields** - Added automatically by Strapi for system functionality

#### **Fresh Installation**
During fresh setup, Strapi will create these tables with:
1. All plugin-defined fields exactly as specified
2. Standard Strapi system fields added automatically
3. Proper foreign key relationships to main content tables

#### **Field Usage**
- Use **plugin-defined fields** for business logic and API operations
- **Auto-generated fields** provide system functionality (timestamps, user tracking, document management)
- All fields are accessible via Strapi APIs, but focus on business logic fields for core functionality

## 🚀 **API Endpoints**

### **Language Management**
```http
GET    /per-language/languages
GET    /per-language/article/:articleId/languages
GET    /per-language/article/:articleId/language/:language
```

### **Translation & Processing Workflows**
```http
POST   /per-language/translate
POST   /per-language/process  
POST   /per-language/translate-and-process
```

### **Content Management**
```http
PUT    /per-language/content/:contentId/publish
DELETE /per-language/content/:contentId
GET    /per-language/article/:articleId/language/:language/refresh
```

### **Registry System**
```http
GET    /per-language/registry/status
GET    /per-language/registry/check/:language
```

### **Advanced Article Operations**
```http
GET    /per-language/article/:id/content
PUT    /per-language/article/:id/content
POST   /per-language/update-processed-data
```

### **Collection Operations**
```http
GET    /per-language/collection/:id/content
PUT    /per-language/collection/:id/content
GET    /per-language/collection/:id/languages
```

**Note:** Additional endpoints are available for advanced operations. See the complete API reference documentation for the full endpoint list.

## 🗑️ **Data Integrity & Cascading Deletes**

### **Automatic Cleanup Integration**
The Per-Language plugin data is automatically cleaned up when articles or collections are deleted through the system's cascading delete functionality (implemented in `src/index.ts`).

#### **Protected Data Tables**
When content is deleted, the system automatically cleans up:
- `article_perlanguages` - All multilingual content and processed data
- `collection_perlanguages` - All multilingual collection descriptions

#### **Deletion Safety**
- **Atomic Operations** - All cleanup happens in database transactions
- **Failure Protection** - Cleanup failures prevent main deletion from proceeding
- **Comprehensive Logging** - Detailed logs track all cleanup operations
- **Performance Optimized** - Efficient SQL queries minimize deletion overhead

#### **Plugin Data Preservation**
The cascading delete system ensures:
- No orphaned multilingual content remains after deletions
- Translation workflow integrity is maintained
- Access tier and publish controls are properly cleaned up
- Processed language data is completely removed

### **Developer Notes**
If extending the Per-Language plugin with additional data tables, ensure foreign key relationships are properly handled in the cascading delete system located in `src/index.ts`.


## 🔧 **Language Processor Interface**

To create a new language processor, implement this interface:

```typescript
interface LanguageProcessorInterface {
    readonly processorId: string;           // 'spanish-dele-processor'
    readonly languageCodes: string[];       // ['es', 'es-ES', 'es-MX']
    readonly displayName: string;           // 'Spanish DELE Processor'

    processContent(content: string, options?: any): Promise<any>;
    saveProcessedData(articleId: number, language: string, data: any, displaySkill?: string): Promise<void>;
    getProcessedData(articleId: number, language: string): Promise<any>;
}
```

### **Example Implementation**
```typescript
// src/plugins/spanish-processor/server/services/processor-adapter.ts
export default ({ strapi }: any) => ({
    processorId: 'spanish-dele-processor',
    languageCodes: ['es', 'es-ES', 'es-MX'],
    displayName: 'Spanish DELE Processor',

    async processContent(content: string, options: any = {}): Promise<any> {
        // The Spanish processing logic here
        return processedData;
    },

    async saveProcessedData(articleId: number, language: string, data: any, displaySkill?: string): Promise<void> {
        // Save processed data to article_perlanguages table
    },

    async getProcessedData(articleId: number, language: string): Promise<any> {
        // Retrieve processed data from article_perlanguages table
    }
});
```

### **Registration**
```typescript
// src/plugins/spanish-processor/server/bootstrap.ts
export default ({ strapi }: any) => {
    // Attempt registration with per-language registry (matches the retry pattern)
    const attemptRegistration = () => {
        const registry = strapi.plugin('per-language')?.service('languageProcessorRegistry');
        const adapter = strapi.plugin('spanish-processor').service('processorAdapter');

        if (registry && adapter) {
            registry.registerProcessor(adapter);
            strapi.log.info('[Spanish Processor] ✅ Registered with language processor registry');
            return true;
        }
        return false;
    };

    // Try immediate registration
    if (!attemptRegistration()) {
        // Retry with delay if per-language plugin not ready
        setTimeout(() => {
            if (attemptRegistration()) {
                strapi.log.info('[Spanish Processor] ✅ Registration successful on retry');
            } else {
                strapi.log.error('[Spanish Processor] ❌ Registration failed - per-language plugin unavailable');
            }
        }, 1000);
    }
};
```

## 💡 **Usage Examples**

### **Basic Translation Workflow**
```javascript
// Translate article to Spanish
const response = await fetch('/per-language/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        articleId: 123,
        targetLanguage: 'es'
    })
});
```

### **Complete Translate + Process Workflow**
```javascript
// Translate and process in one step
const response = await fetch('/per-language/translate-and-process', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        articleId: 123,
        targetLanguage: 'zh'
    })
});
```

### **Check Language Support**
```javascript
// Check if language processing is available
const response = await fetch('/per-language/registry/check/ja');
const { canProcess } = await response.json();
```

## ⚙️ **Configuration**

### **Environment Variables**
```env
# Google Cloud Translation (required for translation features)
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account-key.json

# Debug mode (optional)
DEBUG=true
DEBUG_PLUGINS=true
```

### **Supported Languages**
The plugin automatically detects supported languages based on registered processors:

- **Chinese (zh, zh-CN, zh-TW)** - via Chinese Article Processor
- **Additional languages** - via custom processors created

## 🎨 **Frontend Integration**

### **Manual Save UX Components**
The plugin provides professional manual save components with:

- **Smart change detection** - save button only appears when needed
- **Batch operations** - can change multiple fields before saving
- **Visual feedback** - "Saving..." → "Saved!" with proper error handling
- **Discard functionality** - can revert all pending changes

### **Language Card System**
- Access tier management with dropdown selection
- Publish/draft toggle controls
- Processing status indicators
- Bulk operation controls

## 🔍 **Troubleshooting**

### **Common Issues**

#### **Translation Not Working**
```
Error: Google Cloud Translation API not configured
```
**Solution:** Set up `GOOGLE_APPLICATION_CREDENTIALS` environment variable

#### **Processor Not Found**
```
Error: No processor found for language: ja
```
**Solution:** Create and register a Japanese language processor

#### **Content Not Saving**
```
Error: No article_perlanguages entry found
```
**Solution:** Translate the article first to create the language entry

### **Debug Mode**
Enable debug logging to troubleshoot issues:
```env
DEBUG=true
DEBUG_PLUGINS=true
```

## 📝 **Development Notes**

### **Manual Save Philosophy**
The plugin implements manual save controls instead of auto-save to:
- Give users complete control over when data is saved
- Prevent accidental data loss from auto-save conflicts
- Provide clear visual feedback for unsaved changes
- Enable batch operations for efficiency

### **Registry System Benefits**
- **Language agnostic** - no hard-coded language assumptions
- **Extensible** - easy to add new language processors
- **Fallback safe** - maintains compatibility with existing processors
- **Future-proof** - ready for any language processing needs

## 🤝 **Contributing**

When extending this plugin:
1. Follow the established TypeScript interfaces
2. Use the `[PerLanguage]` logging prefix for consistency
3. Implement proper error handling with user-friendly messages
4. Test manual save UX workflows thoroughly
5. Update documentation for new features