# 🇨🇳 Chinese Article Processor

**Advanced HSK-based Chinese language processing for Strapi v5**

The Chinese Article Processor is a specialized language processor that integrates with the Per-Language plugin to provide comprehensive Chinese language analysis, including HSK difficulty assessment, grammar rule generation, sentence segmentation, and translation management.

## 🎯 **Core Features**

### **HSK Difficulty Analysis**
- Automatic HSK level calculation based on vocabulary complexity
- Character-by-character HSK level assessment
- Distribution analysis across all HSK levels (1-6+)
- Smart difficulty scoring with hybrid algorithms

### **Grammar Rule Generation**
- Sentence-level grammar analysis
- Pattern recognition for Chinese grammar structures
- Educational grammar explanations
- Rule categorization and tagging

### **Sentence Processing**
- Intelligent Chinese sentence segmentation
- Character-level analysis and classification
- Pinyin generation and tone marking
- Translation integration for each sentence

### **Translation Workflows**
- Multi-target language translation (English default)
- Sentence-by-sentence translation preservation
- Context-aware translation quality
- Fallback and error recovery

## 🏗️ **Architecture Integration**

```
┌─────────────────────────────────────────────────┐
│            CHINESE ARTICLE PROCESSOR            │
├─────────────────────────────────────────────────┤
│  🎯 HSK Analysis       │  📝 Grammar Rules      │
│  - Level calculation   │  - Pattern recognition │
│  - Distribution data   │  - Educational content │
│  - Difficulty scoring  │  - Rule categorization │
├────────────────────────┼────────────────────────┤
│  ✂️ Sentence Segmentation │  🔄 Translation      │
│  - Smart boundaries    │  - Multi-target        │
│  - Character analysis  │  - Sentence-level      │
│  - Pinyin generation   │  - Quality validation  │
└─────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────┐
│              PER-LANGUAGE HUB                   │
│            (Registry Integration)               │
└─────────────────────────────────────────────────┘
```

## 📊 **Database Schema**

### **Article Sentences**
```sql
article_sentences (
    id              INTEGER PRIMARY KEY,
    article_id      INTEGER NOT NULL,
    per_language_id INTEGER NOT NULL,
    language        VARCHAR(10) NOT NULL,
    sentence_text   TEXT NOT NULL,
    sentence_order  INTEGER NOT NULL
);
```

### **Grammar Rules**
```sql
sentence_grammar_rules (
    id          INTEGER PRIMARY KEY,
    sentence_id INTEGER NOT NULL,
    rule        TEXT NOT NULL
);
```

### **Translations**
```sql
sentence_translations (
    id                  INTEGER PRIMARY KEY,
    sentence_id         INTEGER NOT NULL,
    translation_language VARCHAR(10) NOT NULL,
    translation_text    TEXT NOT NULL
);
```

## 🚀 **API Endpoints**

### **Processing**
```http
POST   /chinese-article-processor/process-article/:id
POST   /chinese-article-processor/process-article-with-content
PUT    /chinese-article-processor/update-processed-data/:id
```

### **Analysis**
```http
POST   /chinese-article-processor/hsk/calculate
POST   /chinese-article-processor/grammar/generate
GET    /chinese-article-processor/languages
```

### **Data Retrieval**
```http
GET    /chinese-article-processor/article/:id/sentences
```

## 🎓 **HSK Analysis System**

### **Difficulty Calculation Algorithm**
```typescript
interface HSKAnalysis {
    distribution: number[];      // Count per HSK level [1,2,3,4,5,6,beyond,unknown]
    selectedLevel: number;       // Calculated primary level
    calculatedLevel: number;     // Algorithm-determined level
    totalCharacters: number;     // Total Chinese characters analyzed
    coverage: {
        hsk1to3: number;        // Percentage of basic characters
        hsk4to6: number;        // Percentage of advanced characters
        beyond: number;         // Percentage beyond HSK 6
    };
}
```

### **Level Determination Logic**
1. **Character Analysis** - Each Chinese character assessed for HSK level
2. **Distribution Calculation** - Count characters per HSK level
3. **Weighted Scoring** - Higher levels weighted more heavily
4. **Threshold Analysis** - Smart cutoffs for level determination
5. **Context Adjustment** - Sentence complexity factors

### **Example HSK Output**
```json
{
    "hsk": {
        "distribution": [28, 9, 5, 2, 5, 0, 0, 0, 9],
        "selectedLevel": 3,
        "calculatedLevel": 3,
        "totalCharacters": 58,
        "coverage": {
            "hsk1to3": 72.4,
            "hsk4to6": 12.1,
            "beyond": 15.5
        }
    }
}
```

## 📝 **Grammar Analysis System**

### **Rule Categories**
- **Sentence Structure** - Subject-verb-object patterns
- **Particle Usage** - 的, 了, 着, 过 usage patterns
- **Measure Words** - Classifier and measure word rules
- **Aspect Markers** - Temporal and aspectual indicators
- **Question Patterns** - Interrogative structures
- **Comparative Structures** - Comparison grammar patterns

### **Example Grammar Output**
```json
{
    "grammar": {
        "sentences": [
            {
                "text": "我今天很忙。",
                "order": 1,
                "rules": [
                    "Subject-Verb-Adjective structure",
                    "Time expression '今天' in pre-verbal position",
                    "Adverb '很' intensifying adjective"
                ],
                "translations": {
                    "en": "I am very busy today."
                }
            }
        ]
    }
}
```

## 🔧 **Configuration**

### **HSK Data Sources**
The processor uses comprehensive HSK vocabulary databases:
- HSK 1-6 official vocabulary lists
- Extended character frequency data
- Context-aware character classification
- Tone and pinyin information

### **Translation Settings**
```typescript
// Default translation targets
const DEFAULT_TARGET_LANGUAGES = ['en'];

// Configurable via environment
const TARGET_LANGUAGES = process.env.CHINESE_PROCESSOR_TARGETS?.split(',') || ['en'];
```

### **Processing Options**
```typescript
interface ProcessingOptions {
    targetLanguages?: string[];     // ['en', 'es', 'fr']
    includeGrammar?: boolean;       // Default: true
    includePinyin?: boolean;        // Default: true
    hskMode?: 'strict' | 'lenient'; // Default: 'strict'
}
```

## 💡 **Usage Examples**

### **Basic Article Processing**
```javascript
// Process Chinese article (gets content from article_perlanguages table)
const response = await fetch('/chinese-article-processor/process-article/123', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        targetLanguages: ['en', 'es']
    })
});

const result = await response.json();
console.log('HSK Level:', result.data.hsk.selectedLevel);
console.log('Grammar Rules:', result.data.grammar.sentences.length);
```

### **Direct Content Processing**
```javascript
// Process Chinese text directly
const response = await fetch('/chinese-article-processor/process-article-with-content', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        content: "我今天很忙，需要完成很多工作。",
        targetLanguages: ['en'],
        articleId: 123  // Optional: save to database
    })
});
```

### **HSK Analysis Only**
```javascript
// Get HSK analysis without full processing
const response = await fetch('/chinese-article-processor/hsk/calculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        text: "学习中文很有趣。"
    })
});

const { hskLevel, distribution } = await response.json();
```

## 🎨 **Frontend Integration**

### **Processing Status Display**
```typescript
interface ProcessingStatus {
    hasContent: boolean;           // Content available for processing
    hasProcessedData: boolean;     // Processing completed
    hskLevel?: string;            // "HSK 3"
    sentenceCount?: number;       // Number of processed sentences
    grammarRuleCount?: number;    // Total grammar rules identified
}
```

### **Difficulty Visualization**
- HSK level badges with color coding
- Distribution charts showing level breakdown
- Progress indicators for processing status
- Grammar rule expansion panels

## 🔍 **Data Structure**

### **Complete Processed Data**
```typescript
interface ChineseProcessedData {
    hsk: {
        distribution: number[];
        selectedLevel: number;
        calculatedLevel: number;
        totalCharacters: number;
        coverage: {
            hsk1to3: number;
            hsk4to6: number;
            beyond: number;
        };
    };
    grammar: {
        sentences: Array<{
            text: string;
            order: number;
            rules: string[];
            translations: Record<string, string>;
            pinyin?: string;
            tones?: number[];
        }>;
    };
    metadata: {
        processingDate: string;
        processorVersion: string;
        targetLanguages: string[];
        totalSentences: number;
        totalGrammarRules: number;
    };
}
```

## 🚀 **Performance Optimization**

### **Caching Strategy**
- HSK vocabulary lookups cached in memory
- Grammar pattern matching optimized
- Sentence segmentation results cached
- Translation results preserved in database

### **Processing Pipeline**
1. **Input Validation** - Text length and character validation
2. **Sentence Segmentation** - Smart boundary detection
3. **Character Analysis** - HSK level lookup for each character
4. **Grammar Analysis** - Pattern matching and rule generation
5. **Translation** - Multi-target language translation
6. **Data Persistence** - Save to multiple related tables
7. **Metadata Generation** - Processing statistics and metrics

## 🔧 **Troubleshooting**

### **Common Issues**

#### **Processing Fails**
```
Error: No content found for article 123 in language zh
```
**Solution:** Ensure article content is translated to Chinese first via Per-Language plugin

#### **Low HSK Accuracy**
```
Warning: Many characters marked as "unknown" level
```
**Solution:** Update HSK vocabulary database or check for non-Chinese characters

#### **Grammar Rules Missing**
```
Info: No grammar rules generated for simple sentences
```
**Solution:** Normal for very basic sentences; adjust grammar analysis sensitivity

### **Debug Mode**
```env
DEBUG=true
NODE_ENV=development
```

Enables detailed logging:
- Character-by-character HSK analysis
- Grammar pattern matching details
- Translation API call logging
- Processing timing metrics

## 🚀 **Future Enhancements**

### **Planned Features**
- **Traditional Chinese Support** - HSK analysis for traditional characters
- **Regional Variations** - Support for Taiwan and Hong Kong variants
- **Advanced Grammar** - More sophisticated pattern recognition
- **Audio Integration** - Pinyin pronunciation and tone practice
- **Writing Analysis** - Stroke order and character composition

### **API Extensions**
- Batch processing for multiple articles
- Custom HSK vocabulary management
- Grammar rule customization
- Translation quality scoring

## 📊 **Integration with Per-Language**

### **Registry Registration**
```typescript
export default ({ strapi }: any) => {
    // Attempt registration with per-language registry
    const attemptRegistration = () => {
        const registry = strapi.plugin('per-language')?.service('languageProcessorRegistry');
        const adapter = strapi.plugin('chinese-article-processor').service('processorAdapter');

        if (registry && adapter) {
            registry.registerProcessor(adapter);
            strapi.log.info('[Chinese Processor] ✅ Registered with language processor registry');
            return true;
        }
        return false;
    };
    // ... retry logic
};
```

### **Data Flow**
1. **Content Input** - Chinese text from article_perlanguages table
2. **Processing** - HSK analysis + grammar rules + translation
3. **Storage** - Results saved to article_perlanguages.processed_data
4. **Retrieval** - Frontend displays processed results with professional UX

---

**The Chinese Article Processor provides comprehensive Chinese language analysis while seamlessly integrating with the Per-Language plugin architecture for professional multilingual content management.**