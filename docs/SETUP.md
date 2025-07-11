# 🚀 **First Time Setup Guide**

**Complete setup instructions for Lingaist CMS**

This guide walks through setting up Lingaist CMS from scratch, ensuring all components work correctly on first run.

## 📋 **Prerequisites Checklist**

- [ ] **Node.js 18.x or 20.x** (LTS versions)
- [ ] **MySQL 8.0+** or **MariaDB 10.6+** installed and running
- [ ] **yarn 1.22+** (preferred) or **npm 6.0+**
- [ ] **Git** for version control
- [ ] **Google Cloud account** (for translation features)

## 🗄️ **Database Setup**

### **1. Create Database**
```sql
-- Connect to MySQL as root user
mysql -u root -p

-- Create database with proper charset (replace database name as needed)
CREATE DATABASE lingaist_cms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create dedicated user for the CMS
CREATE USER 'cms_user'@'localhost' IDENTIFIED BY 'secure_password_here';

-- Grant all privileges on the CMS database
GRANT ALL PRIVILEGES ON lingaist_cms.* TO 'cms_user'@'localhost';

-- Flush privileges to apply changes
FLUSH PRIVILEGES;

-- Exit MySQL
EXIT;
```

### **2. Test Database Connection**
```bash
# Test connection with new user (replace database name as needed)
mysql -u cms_user -p lingaist_cms

# If successful, you should see:
# mysql> 

# Exit the test connection
EXIT;
```

## 🌩️ **Google Cloud Translation Setup**

### **1. Create Google Cloud Project**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Enable the **Cloud Translation API**
4. Go to **IAM & Admin > Service Accounts**
5. Create a new service account with Translation API access
6. Download the JSON key file

### **2. Configure Service Account**
```bash
# Place the JSON key file in the project root
# Rename it to something descriptive (keep in .gitignore)
mv ~/Downloads/my-project-key.json ./google-cloud-key.json

# Ensure it's ignored by git
echo "google-cloud-key.json" >> .gitignore
```

**💡 Note:** Lingaist CMS currently uses Google Cloud Translation as the translation provider due to its enterprise reliability and 100+ language support. However, other providers can also be used, like OpenAI GPT, Azure Translator, AWS Translate, DeepL API. The system can be easily reconfigured to use alternative providers if needed.


## ⚙️ **Project Setup**

### **1. Clone and Install**
```bash
# Clone the repository
git clone https://github.com/xinyumz/lingaist-cms.git
cd lingaist-cms

# Install dependencies (yarn recommended)
yarn install
# OR
npm install
```

### **2. Environment Configuration**
```bash
# Copy environment template
cp .env.example .env

# Edit the .env file with the settings
nano .env  # or use preferred editor
```

**Required .env settings:**
```env
# Database (customize names as needed)
DATABASE_CLIENT=mysql2
DATABASE_HOST=127.0.0.1
DATABASE_PORT=3306
DATABASE_NAME=lingaist_cms
DATABASE_USERNAME=cms_user
DATABASE_PASSWORD=secure_password_here

# Google Cloud Translation
GOOGLE_APPLICATION_CREDENTIALS=./google-cloud-key.json

# Security (generate new values for production)
APP_KEYS="my-app-key-1,my-app-key-2"
API_TOKEN_SALT=my-api-token-salt
ADMIN_JWT_SECRET=my-admin-jwt-secret
TRANSFER_TOKEN_SALT=my-transfer-token-salt
JWT_SECRET=my-jwt-secret
```

### **3. Generate Secure Keys (Production)**
```bash
# Generate secure random strings for production
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Run this 5 times and use the outputs for each secret in .env
```

## 🚀 **First Start**

### **1. Initial Build and Start**
```bash
# Build admin panel first (required)
yarn build
# OR
npm run build

# Start development server
yarn develop
# OR
npm run develop
```

### **2. Database Migration**
On first start, Strapi will automatically:
- Create all database tables
- Set up the multilingual schema
- Initialize plugin content types
- Configure cascading delete relationships

**Expected tables created:**
- Core: `articles`, `collections`, `blogs`
- Multilingual: `article_perlanguages`, `collection_perlanguages`  
- Chinese Processor: `article_sentences`, `sentence_grammar_rules`, `sentence_translations`
- Plugin tables: Various plugin-specific tables

### **3. Admin Account Setup**
1. Open browser to `http://localhost:1337/admin`
2. Create admin account:
   - **First Name:** first name
   - **Last Name:** last name  
   - **Email:** my-email@domain.com
   - **Password:** Secure password (8+ characters)
3. Complete registration

## ✅ **Verification Checklist**

### **Database Verification**
```sql
-- Connect to database (replace database name as needed)
mysql -u cms_user -p lingaist_cms

-- Check core tables exist
SHOW TABLES LIKE '%articles%';
SHOW TABLES LIKE '%collections%';
SHOW TABLES LIKE '%perlanguage%';
SHOW TABLES LIKE '%sentence%';

-- Verify cascading delete tables
DESCRIBE article_perlanguages;
DESCRIBE collection_perlanguages;
DESCRIBE article_sentences;
```

### **Plugin Verification**
```bash
# Check all plugins loaded correctly
curl http://localhost:1337/per-language/languages
curl http://localhost:1337/collection-manager/health/overview
curl http://localhost:1337/chinese-article-processor/languages
```

### **Translation Verification**
```bash
# Test Google Cloud Translation connection
# (This should NOT return authentication errors)
curl -X POST http://localhost:1337/translator/translate \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello","targetLanguage":"zh"}'
```

## 🧪 **Test Content Creation**

### **1. Create Test Article**
1. Go to **Content Manager > Articles**
2. Click **Create new entry**
3. Fill in required fields:
   - **Title:** "Test Article"
   - **Base:** "This is a test article."
   - **Cover:** Upload any image
   - **Date:** Today's date
4. Save as draft first

### **2. Test Translation Workflow**
1. Go to **Per-Language** plugin section
2. Translate a test article to Chinese
3. Verify multilingual content is created
4. Check database: `SELECT * FROM article_perlanguages;`

### **3. Test Chinese Processing**
1. Process the Chinese content with Chinese Article Processor
2. Verify sentence analysis is generated
3. Check database: `SELECT * FROM article_sentences;`

### **4. Test Collection Health**
1. Create a test collection
2. Add a test article to the collection
3. Navigate to **Collections** list page
4. Verify health badge appears

## 🔧 **Troubleshooting Common Issues**

### **Database Connection Failed**
```bash
Error: connect ECONNREFUSED 127.0.0.1:3306
```
**Solution:**
1. Ensure MySQL is running: `sudo systemctl start mysql`
2. Check MySQL port: `sudo netstat -tlnp | grep 3306`
3. Verify user permissions: Recreate database user

### **Google Cloud Authentication Failed**  
```bash
Error: Could not load the default credentials
```
**Solution:**
1. Verify JSON key file path in `.env`
2. Check file permissions: `chmod 600 google-cloud-key.json`
3. Validate JSON syntax: `cat google-cloud-key.json | python -m json.tool`

### **Plugin Not Loading**
```bash
[ERROR] Plugin 'per-language' could not be loaded
```
**Solution:**
1. Rebuild admin: `yarn build`
2. Check plugin package.json files exist
3. Verify all plugin dependencies installed

### **Admin Panel Not Accessible**
```bash
Cannot GET /admin
```
**Solution:**
1. Ensure admin was built: `yarn build`
2. Check for build errors in console
3. Clear browser cache and cookies

## 📚 **Next Steps**

After successful setup:

1. **Read Documentation:**
   - [Architecture Overview](docs/ARCHITECTURE.md)
   - [Developer Guide](docs/DEVELOPER_GUIDE.md)
   - [Cascading Delete System](docs/CASCADING_DELETE.md)

2. **Configure Production Settings:**
   - Set `NODE_ENV=production`
   - Use secure database credentials
   - Configure SSL/HTTPS
   - Set up proper backup strategies

3. **Customize for Needs:**
   - Add custom content types
   - Create additional language processors
   - Configure category taxonomies
   - Set up Next.js integration

## 🆘 **Getting Help**

If encounter issues:

1. **Check Logs:** Look for errors in console output
2. **Database Verification:** Ensure all tables created correctly
3. **Environment Check:** Verify all required environment variables set
4. **Documentation:** Review the comprehensive guides in `/docs`
5. **Community Support:** Check Strapi community forums for general Strapi issues