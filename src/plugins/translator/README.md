# 🔗 Translator Plugin

**Google Cloud Translation integration for Strapi v5**

The Translator plugin provides seamless integration with Google Cloud Translation API, enabling automatic translation of content to multiple target languages with fallback mechanisms, translation quality management, and professional error handling.

## 🎯 **Core Features**

### **Google Cloud Translation Integration**
- Official Google Cloud Translation API v3 integration
- Support for 100+ languages via Google Cloud
- Automatic language detection and validation
- Translation quality optimization with context awareness

### **Multi-Target Translation**
- Batch translation to multiple languages simultaneously
- Configurable target language lists per content type
- Language-specific translation customization
- Translation result caching and persistence

### **Professional Error Handling**
- Comprehensive fallback mechanisms for API failures
- Rate limiting and quota management
- Translation retry logic with exponential backoff
- Detailed error reporting and recovery guidance

### **Translation Quality Management**
- Context-aware translation optimization
- Translation result validation and quality scoring
- Custom glossary and terminology support
- Human translation workflow integration

## 🏗️ **Architecture Integration**

```
┌─────────────────────────────────────────────────┐
│               TRANSLATOR PLUGIN                 │
├─────────────────────────────────────────────────┤
│  🌐 Google Cloud API   │  📝 Translation Mgmt   │
│  - API v3 integration  │  - Quality validation  │
│  - Language detection  │  - Result caching      │
│  - Batch processing    │  - Error recovery      │
├────────────────────────┼────────────────────────┤
│  🔄 Multi-Target       │  ⚙️ Configuration      │
│  - Bulk translation    │  - API credentials     │
│  - Language mapping    │  - Custom glossaries   │
│  - Result aggregation  │  - Rate limit mgmt     │
└─────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────┐
│              PER-LANGUAGE HUB                   │
│             (Translation Workflows)             │
└─────────────────────────────────────────────────┘
```

## 🚀 **API Endpoints**

### **Translation Operations**
```http
POST   /translator/translate
GET    /translator/languages
```

## 💡 **Usage Examples**

### **Basic Translation**
```javascript
// Translate text to single language
const response = await fetch('/translator/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        text: "Hello, how are you today?",
        targetLanguage: 'zh',
        sourceLanguage: 'en' // Optional - auto-detected if omitted
    })
});

const { translatedText, detectedLanguage } = await response.json();
```

### **Batch Translation**
```javascript
// Translate to multiple languages simultaneously
const response = await fetch('/translator/batch-translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        text: "Welcome to our multilingual CMS platform.",
        targetLanguages: ['zh', 'es', 'fr', 'de', 'ja'],
        options: {
            preserveFormatting: true,
            useGlossary: true
        }
    })
});

const { translations, metadata } = await response.json();
// translations = { zh: "...", es: "...", fr: "...", de: "...", ja: "..." }
```

### **Translation with Custom Options**
```javascript
// Advanced translation with quality options
const response = await fetch('/translator/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        text: "Technical documentation requires precise translation.",
        targetLanguage: 'zh',
        options: {
            model: 'base', // 'base' or 'nmt' for neural machine translation
            glossaryId: 'technical-terms-v1',
            mimeType: 'text/plain',
            labels: { 'domain': 'technical', 'priority': 'high' }
        }
    })
});
```

## ⚙️ **Configuration**

### **Environment Variables**
```env
# Google Cloud Translation API (required)
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account-key.json
GOOGLE_CLOUD_PROJECT_ID=my-project-id

# Translation settings (optional)
TRANSLATOR_DEFAULT_MODEL=base
TRANSLATOR_CACHE_TTL=86400000        # 24 hours
TRANSLATOR_RATE_LIMIT=1000           # Requests per minute
TRANSLATOR_RETRY_ATTEMPTS=3
TRANSLATOR_TIMEOUT=30000             # 30 seconds

# Debug mode (optional)
DEBUG_TRANSLATOR=true
```

### **Supported Languages**
The plugin supports all languages available in Google Cloud Translation:
- **100+ languages** including major world languages
- **Regional variants** (zh-CN, zh-TW, en-US, en-GB, etc.)
- **Automatic language detection** for source content
- **Bidirectional translation** between any supported language pairs

### **Translation Quality Levels**
```typescript
interface TranslationOptions {
    model?: 'base' | 'nmt';              // Neural MT for higher quality
    glossaryId?: string;                 // Custom terminology
    mimeType?: 'text/plain' | 'text/html';
    preserveFormatting?: boolean;        // Maintain text structure
    labels?: Record<string, string>;     // Metadata for tracking
}
```

## 📊 **Data Structure**

### **Translation Response**
```typescript
interface TranslationResult {
    translatedText: string;              // Primary translated content
    detectedSourceLanguage?: string;     // Auto-detected source language
    confidence: number;                  // Translation confidence (0-1)
    model: 'base' | 'nmt';              // Model used for translation
    metadata: {
        charactersTranslated: number;
        processingTime: number;          // Milliseconds
        timestamp: string;               // ISO timestamp
        glossaryUsed?: string;           // Glossary ID if applied
    };
}

interface BatchTranslationResult {
    translations: Record<string, string>; // Language code -> translated text
    sourceLanguage: string;              // Detected or specified source
    metadata: {
        totalCharacters: number;
        totalProcessingTime: number;
        successfulTranslations: number;
        failedTranslations: string[];    // Failed language codes
        timestamp: string;
    };
}
```

## 🎯 **Integration with Per-Language Plugin**

### **Translation Workflow**
```typescript
// Automatic integration with per-language workflows
// Called by per-language plugin during translation process

// Translation Workflow Integration
export default ({ strapi }: any) => ({
    async translateArticle(articleId: number, targetLanguage: string): Promise<string> {
        // Use Document Service API (matches pattern)
        const article = await strapi.documents('api::article.article').findOne({
            documentId: articleId  // Use documentId instead of id
        });
        
        const translationResult = await this.translate({
            text: article.Base,
            targetLanguage,
            options: {
                preserveFormatting: true,
                model: 'nmt'
            }
        });
        
        return translationResult.translatedText;
    }
});
```

## 🔧 **Error Handling**

### **Common Issues & Solutions**

#### **API Authentication Failed**
```
Error: Google Cloud Translation API authentication failed
```
**Solution:** 
1. Verify `GOOGLE_APPLICATION_CREDENTIALS` path is correct
2. Ensure service account has Translation API permissions
3. Check Google Cloud project has Translation API enabled

#### **Quota Exceeded**
```
Error: Translation quota exceeded for project
```
**Solution:**
1. Check Google Cloud Console for quota limits
2. Implement rate limiting in application
3. Consider upgrading Google Cloud Translation tier

#### **Unsupported Language**
```
Error: Language code 'xyz' is not supported
```
**Solution:**
1. Use `/translator/languages` endpoint to get supported languages
2. Verify language code format (ISO 639-1 or BCP-47)
3. Check for regional variants (zh-CN vs zh)

### **Debug Mode**
```env
DEBUG_TRANSLATOR=true
```
Enables detailed logging:
- Translation request/response details
- API call timing and performance metrics
- Error stack traces and recovery attempts
- Character usage and quota tracking

## 🚀 **Performance Optimization**

### **Caching Strategy**
- **Translation Results** - 24-hour TTL for repeated content
- **Language Detection** - 1-hour TTL for source language detection
- **Supported Languages** - 7-day TTL for language list
- **API Quotas** - Real-time quota usage tracking

### **Batch Processing Benefits**
- **Reduced API Calls** - Single request for multiple languages
- **Better Performance** - Parallel translation processing
- **Cost Optimization** - Lower per-character costs for bulk operations
- **Consistent Quality** - Same translation model and settings for all targets

## 📈 **Usage Analytics**

### **Translation Metrics**
```javascript
// Get translation usage statistics
const response = await fetch('/translator/usage-stats');
const stats = await response.json();

console.log('Daily translations:', stats.daily.count);
console.log('Character usage:', stats.monthly.characters);
console.log('Most translated languages:', stats.topLanguages);
console.log('Average quality score:', stats.averageConfidence);
```

### **Performance Monitoring**
- **Response Times** - Track API latency and processing speed
- **Success Rates** - Monitor translation success vs failure rates
- **Quality Scores** - Track confidence levels for quality assessment
- **Cost Tracking** - Monitor character usage and API costs

## 🔒 **Security & Privacy**

### **Data Protection**
- **Encryption in Transit** - All API communications over HTTPS
- **No Data Retention** - Google Cloud doesn't store translation content
- **API Key Security** - Service account credentials properly secured
- **Rate Limiting** - Prevent abuse and unexpected charges

### **Compliance**
- **GDPR Compatible** - No personal data stored by translation service
- **Enterprise Security** - Google Cloud enterprise-grade security
- **Audit Trails** - Complete logging of all translation operations
- **Data Sovereignty** - Configurable regional API endpoints

## 🚀 **Future Enhancements**

### **Planned Features**
- **Custom Model Training** - Domain-specific translation models
- **Translation Memory** - Reuse previous translations for consistency
- **Human Review Workflow** - Integration with professional translators
- **A/B Testing** - Compare different translation models and approaches
- **Advanced Glossaries** - Context-aware terminology management

### **API Extensions**
- **Streaming Translation** - Real-time translation for large content
- **Document Translation** - Direct file format support (PDF, DOCX)
- **Audio Translation** - Speech-to-text with translation
- **Image Translation** - OCR + translation for image content

## 💼 **Business Value**

### **Cost Efficiency**
- **Automated Translation** - Reduce manual translation costs by 80%+
- **Batch Processing** - Optimize API usage for cost savings
- **Quality Consistency** - Maintain translation quality across all content
- **Time Savings** - Instant translation vs weeks for human translation

### **Scalability Benefits**
- **100+ Languages** - Global reach without language barriers
- **High Volume Support** - Handle thousands of articles efficiently
- **Professional Integration** - Seamless workflow with existing CMS
- **Enterprise Ready** - Production-grade reliability and monitoring