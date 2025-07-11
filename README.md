# 🌍 **Enterprise Multilingual CMS**

**Professional multilingual content management system built on Strapi v5.17.0**

A sophisticated, language-agnostic content management platform featuring intelligent language processing, real-time health monitoring, and professional manual save UX. Designed for enterprise-scale multilingual content operations with extensible processor architecture.

## ✨ **Key Features**

### **🎯 Language Processing**
- **HSK-based Chinese analysis** with difficulty scoring and grammar rules
- **Registry-based architecture** ready for Japanese, Korean, Spanish processors
- **Professional translation workflows** with Google Cloud integration
- **Manual save UX** with smart change detection and batch operations

### **📊 Health Monitoring**
- **Real-time collection health** with floating badges
- **Hybrid scoring algorithms** that make issues visible at any scale
- **Orphan and duplicate detection** with automated recommendations
- **Sub-100ms performance** with intelligent caching

### **🏗️ Enterprise Architecture**
- **6 specialized plugins** working in harmony
- **Language-agnostic design** with no hard-coded assumptions
- **Production-ready** error handling and monitoring
- **Cascading delete system** maintains data integrity across multilingual content
- **Future-proof** extensible for any language processing needs

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18.x or 20.x
- MySQL 8.0+ or MariaDB 10.6+
- Google Cloud Translation API credentials

### **Installation**
```bash
# Clone and install
git clone <repository-url>
cd strapi-starter-project

# Install dependencies (choose one)
npm install
# OR
yarn install

# Set up environment
cp .env.example .env
# Edit .env with database and Google Cloud credentials

# Start development server
npm run develop
# OR
yarn develop
```

### **Available Scripts**
```bash
# npm commands
npm run develop    # Start development server with auto-reload
npm run start      # Start production server  
npm run build      # Build admin panel for production
npm run strapi     # Access Strapi CLI commands

# yarn commands (equivalent)
yarn develop       # Start development server with auto-reload
yarn start         # Start production server
yarn build         # Build admin panel for production  
yarn strapi        # Access Strapi CLI commands
```

### **Recommended Development Workflow**
```bash
# Build admin panel and start development (recommended)
yarn build && yarn develop
# OR
npm run build && npm run develop
```

### **First Steps**
1. **Create Admin Account** - Visit http://localhost:1337/admin
2. **Create Article** - Add base content in the source language
3. **Translate Content** - Use translation workflows for target languages  
4. **Process Languages** - Apply language-specific processing (HSK, etc.)
5. **Monitor Health** - Check collection health via floating badges

## ⚡ **Quick Reference**

### **Key URLs**
- **Admin Panel:** http://localhost:1337/admin
- **API Base:** http://localhost:1337/api
- **Plugin APIs:** http://localhost:1337/[plugin-name]

### **Key Commands**
```bash
yarn develop        # Development with hot reload
yarn build         # Build admin panel
yarn start          # Production server
```

### **Key Plugins**
- **Per-Language:** `/per-language` - Central multilingual hub
- **Collection Manager:** `/collection-manager` - Health monitoring
- **Chinese Processor:** `/chinese-article-processor` - HSK analysis


## 🏗️ **System Architecture**

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

## 📚 **Documentation**

### **For Setup & Installation**
- **[First Time Setup Guide](docs/SETUP.md)** - Complete setup instructions for new installations
- **[Getting Started Guide](docs/DEVELOPER_GUIDE.md#quick-start)** - Development environment setup

### **For Users & Stakeholders**
- **[User Workflows](docs/DEVELOPER_GUIDE.md#testing-guidelines)** - Common content management tasks

### **For Developers**
- **[System Architecture](docs/ARCHITECTURE.md)** - Complete technical overview
- **[Developer Guide](docs/DEVELOPER_GUIDE.md)** - Development setup and workflows
- **[Cascading Delete System](docs/CASCADING_DELETE.md)** - Data integrity and cleanup
- **[API Reference](docs/API_REFERENCE.md)** - Complete API documentation *(coming soon)*

### **For Plugin Development**
- **[Per-Language Plugin](src/plugins/per-language/README.md)** - Central hub and language registry
- **[Chinese Processor](src/plugins/chinese-article-processor/README.md)** - HSK analysis and grammar processing
- **[Collection Manager](src/plugins/collection-manager/README.md)** - Health monitoring and analytics

## 🔧 **Development**

### **Available Scripts**
```bash
npm run develop    # Start development server with auto-reload
npm run start      # Start production server
npm run build      # Build admin panel for production
npm run strapi     # Access Strapi CLI commands
```

### **Plugin Development**
```bash
# Create new language processor
npx create-strapi-plugin japanese-processor
mv japanese-processor src/plugins/

# Follow the language processor interface
# See docs/ARCHITECTURE.md for complete guide
```

## 🌟 **Current Language Support**

- **🇨🇳 Chinese (zh, zh-CN, zh-TW)** - Full HSK analysis, grammar rules, sentence processing
- **🔄 Translation Support** - 100+ languages via Google Cloud Translation
- **🚀 Ready for Expansion** - Japanese (JLPT), Korean (TOPIK), Spanish (DELE)

## 📊 **Production Statistics**

- **⚡ Performance** - Sub-100ms cached responses, <2s fresh analysis
- **🎯 Accuracy** - 100% orphan detection, advanced duplicate identification
- **🛡️ Reliability** - Enterprise error handling, comprehensive monitoring
- **📈 Scalability** - Tested with 1000+ collections, intelligent caching

## 🚀 **Deployment**

### **Production Build**
```bash
NODE_ENV=production npm run build
NODE_ENV=production npm start
```

### **Docker Deployment**
```bash
docker build -t multilingual-cms .
docker run -p 1337:1337 multilingual-cms
```

See **[Developer Guide](docs/DEVELOPER_GUIDE.md#deployment-guide)** for complete deployment instructions.

## 🤝 **Contributing**

1. **Read Documentation** - Start with [Architecture Overview](docs/ARCHITECTURE.md)
2. **Set Up Environment** - Follow [Developer Guide](docs/DEVELOPER_GUIDE.md)
3. **Understand Patterns** - Review existing plugin implementations
4. **Follow Standards** - TypeScript, consistent logging, manual save UX
5. **Test Thoroughly** - Complete workflow testing required

## 📈 **Roadmap**

### **Next Language Processors**
- **Japanese JLPT Processor** - Kanji analysis, JLPT level assessment
- **Korean TOPIK Processor** - Hangul complexity, TOPIK level scoring
- **Spanish DELE Processor** - Grammar complexity, DELE level analysis

### **Platform Enhancements**
- **Advanced Analytics** - Usage patterns, content performance metrics
- **Automation Tools** - Scheduled processing, bulk operations
- **Integration APIs** - Webhook support, external system connectors

## 📄 **License**

MIT License - see LICENSE file for details.

## 🆘 **Support**

- **Documentation** - Complete guides in `docs/` folder
- **Plugin Docs** - Specific README files in each plugin
- **Issues** - GitHub Issues for bug reports and feature requests
- **Development** - See [Developer Guide](docs/DEVELOPER_GUIDE.md#getting-help) for development support

---

**Built with ❤️ for professional multilingual content management**