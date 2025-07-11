# 🚀 **Developer Getting Started Guide**

**Quick start guide for developers working with the Multilingual CMS**

This guide helps developers understand the system, set up their development environment, and start contributing to the multilingual CMS platform.

## 📋 **Prerequisites**

### **Required Software**
- **Node.js 18.x or 20.x** (LTS versions)
- **MySQL 8.0+** or **MariaDB 10.6+**
- **yarn 1.22+** (preferred) or **npm 6.0+**
- **Git** for version control

### **Recommended Tools**
- **VS Code** with Strapi extensions
- **MySQL Workbench** or **phpMyAdmin** for database management
- **Postman** or **Insomnia** for API testing
- **React Developer Tools** browser extension

## 📦 **Key Dependencies**

### **Core Dependencies**
- **@strapi/strapi:** v5.17.0 - Core CMS framework
- **mysql2:** v3.14.1 - Database driver
- **@google-cloud/translate:** v8.5.0 - Translation API

### **Plugin Dependencies**
- **react:** v18.0.0 - Frontend framework
- **styled-components:** v6.1.19 - UI styling
- **sharp:** v0.33.5 - Image processing


## ⚙️ **Environment Setup**

### **1. Clone and Install**
```bash
# Clone the repository
git clone <repository-url>
cd strapi-starter-project

# Install dependencies (yarn recommended)
yarn install
# OR
npm install

# Install plugin dependencies
cd src/plugins/per-language && yarn install && cd ../../..
cd src/plugins/chinese-article-processor && yarn install && cd ../../..
cd src/plugins/collection-manager && yarn install && cd ../../..
# Repeat for other plugins as needed
```

### **2. Environment Configuration**
Create `.env` file in project root:
```env
# Core Strapi Settings
NODE_ENV=development
HOST=0.0.0.0
PORT=1337

# Database Configuration
DATABASE_CLIENT=mysql
DATABASE_HOST=127.0.0.1
DATABASE_PORT=3306
DATABASE_NAME=multilingual_cms
DATABASE_USERNAME=my_db_user
DATABASE_PASSWORD=my_db_password

# Google Cloud Translation (required for translation features)
GOOGLE_APPLICATION_CREDENTIALS=./strapi-translator-436122-a6db8e957deb.json

# Debug Settings (optional)
DEBUG=true
DEBUG_HEALTH=true
DEBUG_PLUGINS=true

# Cache Configuration (optional - defaults shown)
HEALTH_CACHE_TTL=120000
ORPHAN_CACHE_TTL=300000
DUPLICATE_CACHE_TTL=600000
```

### **3. Database Setup**
```sql
-- Create database
CREATE DATABASE multilingual_cms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user and grant permissions
CREATE USER 'cms_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON multilingual_cms.* TO 'cms_user'@'localhost';
FLUSH PRIVILEGES;
```

### **4. Start Development Server**
```bash
# Start Strapi in development mode (recommended with yarn)
yarn develop
# OR
npm run develop

# The admin panel will be available at:
# http://localhost:1337/admin
```

## 🏗️ **Project Structure**

```
strapi-starter-project/
├── src/
│   ├── api/                    # Core content types
│   │   ├── article/
│   │   ├── blog/
│   │   └── collection/
│   ├── components/             # Reusable components
│   ├── extensions/             # Strapi core extensions
│   └── plugins/                # Custom plugins
│       ├── per-language/       # 🌍 Central hub
│       ├── chinese-article-processor/  # 🎯 Chinese processing
│       ├── collection-manager/ # 📚 Health monitoring
│       ├── category-manager/   # 🏷️ Taxonomy
│       ├── translator/         # 🔗 Translation engine
│       └── revalidate/         # 🔄 Cache management
├── config/                     # Strapi configuration
├── database/                   # Database files
└── public/                     # Static assets
```

## 📝 **Database Field Naming Convention**

### **Schema vs Database Field Names**
When working with the system, understand the field naming conversion:

- **In Content Type Schemas:** PascalCase (`Title`, `LanguageProcessor`, `PerLanguage`)
- **In Database Tables:** snake_case (`title`, `language_processor`, `per_language`)
- **In API Responses:** PascalCase (`Title`, `LanguageProcessor`, `PerLanguage`)

### **Plugin-Defined vs Auto-Generated Fields**
Plugin schemas define only business logic fields. Strapi automatically adds system fields:

**Defined Fields (Business Logic):**
- `article_id`, `language`, `per_language_text`, `processed_data`

**Strapi Auto-Generated Fields (System Management):**
- `id`, `created_at`, `updated_at`, `published_at`
- `created_by_id`, `updated_by_id`, `document_id`, `locale`

This is normal Strapi v5 behavior and ensures proper system functionality.


## 🔧 **System Configuration**

### **Core Configuration Files**

The system uses standard Strapi v5 configuration files located in `/config/`:

#### **Database Configuration** (`config/database.ts`)
- **Multi-database support:** MySQL, PostgreSQL, SQLite
- **Connection pooling:** Configurable via environment variables
- **SSL support:** For production deployments
- **Environment-driven:** All settings configurable via `.env`

#### **Plugin Configuration** (`config/plugins.ts`)
```typescript
export default {
    'per-language': { enabled: true, resolve: './src/plugins/per-language' },
    'chinese-article-processor': { enabled: true, resolve: './src/plugins/chinese-article-processor' },
    'collection-manager': { enabled: true, resolve: './src/plugins/collection-manager' },
    'translator': { enabled: true, resolve: './src/plugins/translator' },
    'category-manager': { enabled: true, resolve: './src/plugins/category-manager' },
    'revalidate': { enabled: true, resolve: './src/plugins/revalidate' }
};
```

#### **Security Configuration** (`config/middlewares.ts`)
- **CSP settings** configured for media uploads and external integrations
- **CORS enabled** for API access
- **Image/media sources** allowlisted for CDN usage

#### **API Configuration** (`config/api.ts`)
- **REST API limits:** 25 default, 100 maximum
- **Response counting** enabled for pagination
- **Optimized for performance** with reasonable limits

### **Admin Panel Configuration** (`src/admin/app.js`)
- **Basic customization** ready for branding
- **CSS styling** support via `app.css`
- **Bootstrap configuration** for plugin initialization

### **Environment Variables**
All configuration is environment-driven via `.env` file - see [Setup Guide](docs/SETUP.md) for complete configuration details.

**For detailed configuration:** Each plugin has specific configuration options documented in their respective README files.

## 🧩 **Plugin Development**

### **Understanding Plugin Architecture**
Each plugin follows Strapi v5 conventions:
```
plugin-name/
├── admin/                      # Frontend React components
│   └── src/
│       ├── components/         # UI components
│       ├── pages/             # Plugin pages
│       └── utils/             # Utilities
├── server/                     # Backend logic
│   ├── controllers/           # API endpoints
│   ├── services/              # Business logic
│   ├── routes/                # Route definitions
│   ├── content-types/         # Database schemas
│   └── bootstrap.ts           # Plugin initialization
└── package.json               # Plugin metadata
```

### **Creating a New Language Processor**

#### **1. Generate Plugin Structure**
```bash
# Create new plugin
npx create-strapi-plugin japanese-processor

# Move to plugins directory
mv japanese-processor src/plugins/
```

#### **2. Implement Processor Interface**
```typescript
// src/plugins/japanese-processor/server/services/processor-adapter.ts
export default ({ strapi }: any) => ({
    processorId: 'japanese-jlpt-processor',
    languageCodes: ['ja'],
    displayName: 'Japanese JLPT Processor',

    async processContent(content: string, options: any = {}): Promise<any> {
        // 1. JLPT vocabulary analysis
        const jlptAnalysis = await this.analyzeJLPTLevel(content);
        
        // 2. Kanji complexity assessment
        const kanjiAnalysis = await this.analyzeKanji(content);
        
        // 3. Grammar pattern recognition
        const grammarAnalysis = await this.analyzeGrammar(content);

        return {
            jlpt: jlptAnalysis,
            kanji: kanjiAnalysis,
            grammar: grammarAnalysis,
            metadata: {
                processingDate: new Date().toISOString(),
                processorVersion: '1.0.0'
            }
        };
    },

  async saveProcessedData(articleId: number, language: string, data: any, displaySkill?: string): Promise<void> {
    // Use processor's own service (matches the actual implementation)
    const processService = strapi.plugin('japanese-processor').service('processService');
    await processService.saveProcessedData(articleId, language, data, displaySkill);
}

    // ... other interface methods
});
```

#### **3. Register with Per-Language Hub**
```typescript
// src/plugins/japanese-processor/server/bootstrap.ts
export default ({ strapi }: any) => {
    const registry = strapi.plugin('per-language')?.service('languageProcessorRegistry');
    const adapter = strapi.plugin('japanese-processor').service('processorAdapter');

    if (registry && adapter) {
        registry.registerProcessor(adapter);
        strapi.log.info('[Japanese Processor] ✅ Registered with language processor registry');
    }
};
```

## 🔧 **Development Workflow**

### **1. Making Changes**
```bash
# Start development server with auto-reload (yarn recommended)
yarn develop
# OR
npm run develop

# Make changes to plugin code
# Changes will be automatically reloaded
```

### **2. Available Scripts**
```bash
# Yarn commands (recommended)
yarn develop       # Start development server with auto-reload
yarn start         # Start production server
yarn build         # Build admin panel for production
yarn strapi        # Access Strapi CLI commands

# NPM equivalents (also supported)
npm run develop    # Start development server with auto-reload
npm run start      # Start production server  
npm run build      # Build admin panel for production
npm run strapi     # Access Strapi CLI commands
```

### **3. Recommended Development Workflow**
```bash
# Build admin panel and start development (recommended)
yarn build && yarn develop
# OR
npm run build && npm run develop
```

### **4. Testing Changes**
```bash
# Test article creation workflow
# 1. Create article in admin panel
# 2. Translate to target language
# 3. Process with language processor
# 4. Verify results in processed data display

# Test collection health monitoring
# 1. Create collections with articles
# 2. Create orphaned collection (no articles)
# 3. Check health badge appears
# 4. Verify health scoring
```

### **5. Database Changes**
```bash
# After modifying content types or schemas
yarn build
yarn develop
# OR
npm run build
npm run develop

# Database migrations will run automatically
```

## 🔍 **Debugging & Troubleshooting**

### **Debug Mode**
```env
# Enable debug logging
DEBUG=true
DEBUG_HEALTH=true
DEBUG_PLUGINS=true
```

### **Common Issues & Solutions**

#### **Plugin Not Loading**
```bash
# Check plugin registration
cat src/plugins/plugin-name/package.json
# Verify strapi field contains correct metadata

# Rebuild and restart
yarn build
yarn develop
# OR
npm run build
npm run develop
```

#### **Database Connection Issues**
```bash
# Test database connection
mysql -h 127.0.0.1 -u cms_user -p multilingual_cms

# Check Strapi database config
cat config/database.ts
```

#### **Translation Not Working**
```bash
# Verify Google Cloud credentials
ls -la strapi-translator-*.json

# Test API access
node -e "console.log(process.env.GOOGLE_APPLICATION_CREDENTIALS)"
```

### **Useful Debug Commands**
```bash
# Check plugin loading
yarn strapi console
# OR
npm run strapi console

> strapi.plugins['per-language']

# Test registry system
> strapi.plugin('per-language').service('languageProcessorRegistry').getSupportedLanguages()

# Check health monitoring
> strapi.plugin('collection-manager').service('collectionHealth').getCombinedHealthOverview()
```

## 🗑️ **Cascading Delete System**

### **Automatic Data Cleanup**
The system automatically maintains data integrity when content is deleted through comprehensive cascading delete functionality implemented in `src/index.ts`.

#### **What Gets Cleaned Up**
```bash
# Article deletion triggers cleanup of:
- article_perlanguages (multilingual content)
- article_sentences (Chinese processor data)
- sentence_grammar_rules (grammar analysis)
- sentence_translations (sentence translations)

# Collection deletion triggers cleanup of:
- collection_perlanguages (multilingual descriptions)
```

#### **Testing Cascading Deletes**
```bash
# Test article cascading delete
# 1. Create article with Chinese content
# 2. Translate to multiple languages (creates article_perlanguages entries)
# 3. Process with Chinese processor (creates sentences, grammar rules)
# 4. Delete article via admin interface
# 5. Verify all related data cleaned up:

# Check for orphaned data (should return 0 rows)
mysql> SELECT COUNT(*) FROM article_perlanguages WHERE article_id = 123;
mysql> SELECT COUNT(*) FROM article_sentences WHERE article_id = 123;
mysql> SELECT COUNT(*) FROM sentence_grammar_rules WHERE sentence_id IN 
       (SELECT id FROM article_sentences WHERE article_id = 123);
```

#### **Cleanup Monitoring**
```bash
# Enable detailed cleanup logging
DEBUG=true

# Watch cleanup operations in real-time
tail -f logs/strapi.log | grep "Cleanup"

# Example output:
# [Article Cleanup] Processing cascading delete for articles: [123]
# [Article Cleanup] ✅ Deleted 3 article per-language records for article 123
# [Article Cleanup] ✅ Deleted 12 grammar rules, 15 translations, 5 sentences
```

#### **Performance Considerations**
- **Bulk Deletions:** Use admin bulk select for efficiency
- **Large Datasets:** Monitor cleanup timing for articles with extensive language processing
- **Database Load:** Cascading deletes use optimized SQL queries for minimal impact
- **Transaction Safety:** All cleanup operations are atomic and safe to retry


## 📚 **API Testing**

### **Using Postman/Insomnia**

#### **Translation Workflow**
```javascript
// POST /per-language/translate
{
    "articleId": 1,
    "targetLanguage": "zh"
}
```

#### **Processing Workflow**
```javascript
// POST /per-language/process
{
    "articleId": 1,
    "targetLanguage": "zh"
}
```

#### **Health Monitoring**
```javascript
// GET /collection-manager/health/overview
// Returns complete health analysis

// GET /collection-manager/health/overview/force
// Bypasses cache for fresh data
```

## 🎨 **Frontend Development**

### **Plugin Admin Components**
```typescript
// Example component structure
// src/plugins/plugin-name/admin/src/components/FeatureComponent.tsx

import React from 'react';
import { Card, CardBody, Typography, Button } from '@strapi/design-system';

export const FeatureComponent: React.FC = () => {
    return (
        <Card>
            <CardBody>
                <Typography variant="delta">Feature Component</Typography>
                <Button variant="primary">Action Button</Button>
            </CardBody>
        </Card>
    );
};
```

### **Manual Save UX Pattern**
```typescript
// Follow the established manual save pattern
const [pendingChanges, setPendingChanges] = useState<Record<string, any>>({});
const [originalValues, setOriginalValues] = useState({});
const [isSaving, setIsSaving] = useState(false);

const hasUnsavedChanges = Object.keys(pendingChanges).length > 0;

const handleSave = async () => {
    setIsSaving(true);
    try {
        // Save logic here
        setPendingChanges({});
        // Show success feedback
    } catch (error) {
        // Show error feedback
    } finally {
        setIsSaving(false);
    }
};
```

## 📝 **Code Standards**

### **TypeScript Guidelines**
```typescript
// Use proper interfaces
interface ProcessorOptions {
    targetLanguages?: string[];
    includeGrammar?: boolean;
    difficulty?: 'strict' | 'lenient';
}

// Consistent error handling
try {
    const result = await processContent(content, options);
    return { success: true, data: result };
} catch (error) {
    console.error('[PluginName] Error processing:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new ApplicationError(`Processing failed: ${errorMessage}`);
}
```

### **Logging Standards**
```typescript
// Use consistent logging prefixes
console.log('[PluginName] Operation started');
console.error('[PluginName] Error occurred:', error);

// For debug-only logging
if (process.env.DEBUG === 'true') {
    console.log('[PluginName] Debug info:', debugData);
}
```

### **API Response Standards**
```typescript
// Consistent API response format
return {
    success: boolean;
    data?: any;
    message?: string;
    error?: {
        type: string;
        message: string;
        code?: string;
    };
    metadata?: {
        processingTime: number;
        timestamp: string;
    };
};
```

## 🚀 **Deployment Guide**

### **Production Build**
```bash
# Build for production
NODE_ENV=production yarn build
NODE_ENV=production yarn start
# OR
NODE_ENV=production npm run build
NODE_ENV=production npm start
```

### **Environment Variables**
```bash
# Production environment file
NODE_ENV=production
HOST=0.0.0.0
PORT=1337

# Database (use production credentials)
DATABASE_CLIENT=mysql
DATABASE_HOST=prod-db-host
DATABASE_NAME=cms_production
DATABASE_USERNAME=prod_user
DATABASE_PASSWORD=secure_production_password

# Disable debug logging
DEBUG=false
DEBUG_HEALTH=false
DEBUG_PLUGINS=false

# Production cache settings (longer TTL)
HEALTH_CACHE_TTL=300000    # 5 minutes
ORPHAN_CACHE_TTL=600000    # 10 minutes
DUPLICATE_CACHE_TTL=1800000 # 30 minutes
```

### **Docker Deployment**
```dockerfile
# Dockerfile example
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
COPY yarn.lock ./
RUN yarn install --frozen-lockfile --production

COPY . .
RUN yarn build

EXPOSE 1337
CMD ["yarn", "start"]
```

## 🧪 **Testing Guidelines**

### **Manual Testing Checklist**

#### **Translation Workflow**
- [ ] Create article with base content
- [ ] Translate to multiple languages
- [ ] Verify manual save UX works correctly
- [ ] Test error handling for failed translations
- [ ] Check access tier and publish controls

#### **Language Processing**
- [ ] Process content in supported languages
- [ ] Verify difficulty analysis accuracy
- [ ] Test grammar rule generation
- [ ] Check processed data storage
- [ ] Validate UI display of results

#### **Collection Health**
- [ ] Create collections with articles
- [ ] Create orphaned collections
- [ ] Verify health badge appears on collection list
- [ ] Test health score accuracy
- [ ] Check real-time updates

### **API Testing**
```bash
# Test all major endpoints
curl -X GET http://localhost:1337/per-language/languages
curl -X POST http://localhost:1337/per-language/translate -d '{"articleId":1,"targetLanguage":"zh"}'
curl -X GET http://localhost:1337/collection-manager/health/overview
```

## 📖 **Learning Resources**

### **Strapi v5 Documentation**
- [Strapi v5 Developer Docs](https://docs.strapi.io/dev-docs/intro)
- [Plugin Development Guide](https://docs.strapi.io/dev-docs/plugins-development)
- [Content Type Builder](https://docs.strapi.io/dev-docs/backend-customization/content-types)

### **Technology Stack**
- **Backend:** Node.js, Strapi v5, MySQL, TypeScript
- **Frontend:** React 18, Strapi Design System, TypeScript
- **External APIs:** Google Cloud Translation
- **Development:** yarn (preferred), npm, Git, VS Code

### **System-Specific Resources**
- **Per-Language Plugin README** - Central hub architecture
- **Chinese Processor README** - Language processing implementation
- **Collection Manager README** - Health monitoring system
- **Category Manager README** - Hierarchical taxonomy management
- **Translator README** - Google Cloud Translation integration
- **Revalidate README** - Next.js cache management
- **Architecture Overview** - Complete system design

## 🤝 **Contributing Guidelines**

### **Before Making Changes**
1. **Understand the architecture** - Read plugin READMEs and architecture docs
2. **Set up development environment** - Follow this guide completely
3. **Test existing functionality** - Ensure everything works before changes
4. **Plan changes** - Discuss major modifications with team

### **Development Process**
1. **Create feature branch** from main
2. **Follow code standards** (TypeScript, logging, error handling)
3. **Test thoroughly** using manual testing checklist
4. **Update documentation** if adding new features
5. **Submit pull request** with clear description

### **Preferred Package Manager**
- **Use yarn** for all development tasks when possible
- **NPM commands** are maintained for compatibility
- **Lock files:** Maintain both `yarn.lock` and `package-lock.json`
- **CI/CD:** Configure pipelines to use yarn for consistency

### **Code Review Checklist**
- [ ] Follows established TypeScript interfaces
- [ ] Uses consistent logging prefixes
- [ ] Implements proper error handling
- [ ] Maintains manual save UX patterns
- [ ] Includes appropriate tests
- [ ] Updates relevant documentation

## 🆘 **Getting Help**

### **Common Debugging Steps**
1. **Check logs** - Look for error messages in console
2. **Verify environment** - Ensure all required env vars are set
3. **Test database** - Confirm database connection and permissions
4. **Check plugin loading** - Verify all plugins loaded correctly
5. **Test API endpoints** - Use Postman to test specific endpoints

### **When to Ask for Help**
- **Architecture questions** - Understanding plugin interactions
- **Complex debugging** - Issues affecting multiple components
- **Performance problems** - Slow response times or memory issues
- **Database design** - Questions about schema modifications

### **Resources for Support**
- **Documentation** - Complete plugin and architecture docs
- **Code Examples** - Existing processor implementations
- **Development Team** - For architecture and design questions
- **Community** - Strapi Discord/Forum for general Strapi questions