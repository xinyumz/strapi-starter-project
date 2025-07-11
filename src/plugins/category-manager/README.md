# 🏷️ Category Manager Plugin

**Hierarchical content categorization and taxonomy management for Strapi v5**

The Category Manager plugin provides sophisticated multi-level category structures, cascading dropdown UX, and professional taxonomy management for organizing multilingual content with precision and ease.

## 🎯 **Core Features**

### **Hierarchical Category Structure**
- Multi-level nested categories with unlimited depth
- Parent-child relationships with intelligent inheritance
- Category tree visualization and management
- Automatic hierarchy validation and conflict prevention

### **Cascading Dropdown UX**
- Dynamic category selection with parent-child filtering
- Progressive disclosure of category options
- Smart category suggestions based on content type
- Professional admin interface with intuitive navigation

### **Multi-Taxonomy Support**
- Multiple independent category systems
- Custom taxonomy creation and management
- Cross-taxonomy relationships and mappings
- Flexible category assignment rules

### **Multilingual Category Support**
- Category names and descriptions in multiple languages
- Language-specific category hierarchies
- Translation workflow integration
- Localized category administration

## 🏗️ **Architecture Overview**

```
┌─────────────────────────────────────────────────┐
│             CATEGORY MANAGER                    │
├─────────────────────────────────────────────────┤
│  🌳 Hierarchy Mgmt     │  🎯 Taxonomy System    │
│  - Multi-level trees   │  - Custom taxonomies   │
│  - Parent-child refs   │  - Cross-references     │
│  - Validation rules    │  - Assignment logic     │
├────────────────────────┼────────────────────────┤
│  🔽 Cascading UX       │  🌍 Multilingual       │
│  - Dynamic dropdowns   │  - Translated names     │
│  - Progressive loading │  - Language hierarchies │
│  - Smart suggestions   │  - Localized admin      │
└─────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────┐
│          CONTENT ASSOCIATION                    │
│        (Articles, Collections, etc.)           │
└─────────────────────────────────────────────────┘
```

## 📊 **Database Schema**

### **Category Structure**
```sql
categories (
    id              INTEGER PRIMARY KEY,
    documentId      VARCHAR(36) UNIQUE,
    name            VARCHAR(255) NOT NULL,
    slug            VARCHAR(255) UNIQUE,
    description     TEXT,
    parent_id       INTEGER REFERENCES categories(id),
    taxonomy        VARCHAR(100) DEFAULT 'default',
    sort_order      INTEGER DEFAULT 0,
    is_active       BOOLEAN DEFAULT TRUE,
    metadata        JSON,
    created_at      TIMESTAMP,
    updated_at      TIMESTAMP
);

category_localizations (
    id              INTEGER PRIMARY KEY,
    category_id     INTEGER NOT NULL,
    locale          VARCHAR(10) NOT NULL,
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    created_at      TIMESTAMP,
    updated_at      TIMESTAMP
);
```

### **Content Associations**
```sql
article_categories (
    id              INTEGER PRIMARY KEY,
    article_id      INTEGER NOT NULL,
    category_id     INTEGER NOT NULL,
    is_primary      BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP
);

collection_categories (
    id              INTEGER PRIMARY KEY,
    collection_id   INTEGER NOT NULL,
    category_id     INTEGER NOT NULL,
    created_at      TIMESTAMP
);
```

## 🚀 **API Endpoints**

### **Category Management**
```http
GET    /category-manager/categories
POST   /category-manager/categories
PUT    /category-manager/categories/:id
DELETE /category-manager/categories/:id
```

### **Hierarchy Operations**
```http
GET    /category-manager/categories/tree
GET    /category-manager/categories/:id/children
GET    /category-manager/categories/:id/ancestors
POST   /category-manager/categories/:id/move
```

### **Taxonomy Management**
```http
GET    /category-manager/taxonomies
POST   /category-manager/taxonomies
GET    /category-manager/categories/by-taxonomy/:taxonomy
```

### **Content Assignment**
```http
POST   /category-manager/assign
DELETE /category-manager/unassign
GET    /category-manager/content/:type/:id/categories
```

## 💡 **Usage Examples**

### **Creating Category Hierarchy**
```javascript
// Create main category
const parentCategory = await fetch('/category-manager/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        name: 'Language Learning',
        slug: 'language-learning',
        description: 'All language learning content',
        taxonomy: 'content-type'
    })
});

// Create subcategory
const childCategory = await fetch('/category-manager/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        name: 'Chinese HSK',
        slug: 'chinese-hsk',
        description: 'Chinese HSK level content',
        parent_id: parentCategory.data.id,
        taxonomy: 'content-type'
    })
});
```

### **Get Category Tree**
```javascript
// Fetch complete category hierarchy
const response = await fetch('/category-manager/categories/tree?taxonomy=content-type');
const categoryTree = await response.json();

// Example tree structure:
// {
//   "data": [
//     {
//       "id": 1,
//       "name": "Language Learning",
//       "children": [
//         {
//           "id": 2,
//           "name": "Chinese HSK",
//           "children": [
//             { "id": 3, "name": "HSK 1", "children": [] },
//             { "id": 4, "name": "HSK 2", "children": [] }
//           ]
//         }
//       ]
//     }
//   ]
// }
```

### **Assign Categories to Content**
```javascript
// Assign multiple categories to an article
const response = await fetch('/category-manager/assign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        contentType: 'article',
        contentId: 123,
        categoryIds: [2, 3], // Chinese HSK + HSK 1
        primaryCategoryId: 2 // Primary category
    })
});
```

### **Cascading Category Selection**
```javascript
// Get categories filtered by parent (for cascading dropdowns)
const response = await strapi.documents('api::category.category').findMany({
    filters: { parent_id: parentId }
});
const childCategories = response;

// Use in frontend dropdown to show only relevant subcategories
```

## 🎨 **Frontend Integration**

### **Cascading Category Selector Component**
```typescript
interface CategorySelectorProps {
    selectedCategories: number[];
    taxonomy?: string;
    maxDepth?: number;
    allowMultiple?: boolean;
    onSelectionChange: (categoryIds: number[]) => void;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
    selectedCategories,
    taxonomy = 'default',
    maxDepth = 5,
    allowMultiple = true,
    onSelectionChange
}) => {
    const [categoryTree, setCategoryTree] = useState([]);
    const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());

    // Fetch category tree on mount
    useEffect(() => {
        fetch(`/category-manager/categories/tree?taxonomy=${taxonomy}`)
            .then(res => res.json())
            .then(data => setCategoryTree(data.data));
    }, [taxonomy]);

    // Recursive category tree renderer with checkboxes
    const renderCategoryNode = (category: any, depth: number = 0) => (
        <div key={category.id} style={{ marginLeft: depth * 20 }}>
            <label>
                <input
                    type={allowMultiple ? 'checkbox' : 'radio'}
                    checked={selectedCategories.includes(category.id)}
                    onChange={(e) => {
                        if (allowMultiple) {
                            const newSelection = e.target.checked
                                ? [...selectedCategories, category.id]
                                : selectedCategories.filter(id => id !== category.id);
                            onSelectionChange(newSelection);
                        } else {
                            onSelectionChange([category.id]);
                        }
                    }}
                />
                {category.name}
            </label>
            {category.children?.length > 0 && depth < maxDepth && (
                <div>
                    {category.children.map((child: any) => 
                        renderCategoryNode(child, depth + 1)
                    )}
                </div>
            )}
        </div>
    );

    return (
        <div className="category-selector">
            {categoryTree.map(category => renderCategoryNode(category))}
        </div>
    );
};
```

### **Category Breadcrumb Display**
```typescript
const CategoryBreadcrumb: React.FC<{ categoryId: number }> = ({ categoryId }) => {
    const [ancestors, setAncestors] = useState([]);

    useEffect(() => {
        fetch(`/category-manager/categories/${categoryId}/ancestors`)
            .then(res => res.json())
            .then(data => setAncestors(data.data));
    }, [categoryId]);

    return (
        <nav className="category-breadcrumb">
            {ancestors.map((category, index) => (
                <span key={category.id}>
                    {index > 0 && ' > '}
                    <a href={`/categories/${category.slug}`}>{category.name}</a>
                </span>
            ))}
        </nav>
    );
};
```

## ⚙️ **Configuration**

### **Taxonomy Configuration**
```typescript
// Define custom taxonomies
const taxonomyConfig = {
    'content-type': {
        name: 'Content Types',
        description: 'Main content categorization',
        maxDepth: 4,
        allowMultiple: false,
        required: true
    },
    'difficulty': {
        name: 'Difficulty Levels',
        description: 'Content difficulty classification',
        maxDepth: 2,
        allowMultiple: false,
        required: false
    },
    'topic': {
        name: 'Topics',
        description: 'Subject matter tags',
        maxDepth: 3,
        allowMultiple: true,
        required: false
    }
};
```

### **Category Validation Rules**
```typescript
interface CategoryValidation {
    slugFormat: RegExp;              // URL-safe slug validation
    nameMinLength: number;           // Minimum category name length
    maxDepth: number;                // Maximum hierarchy depth
    uniqueNames: boolean;            // Enforce unique names per taxonomy
    preventCircularRefs: boolean;    // Prevent parent-child loops
}

const validationRules: CategoryValidation = {
    slugFormat: /^[a-z0-9-]+$/,
    nameMinLength: 2,
    maxDepth: 5,
    uniqueNames: true,
    preventCircularRefs: true
};
```

## 🔧 **Category Operations**

### **Moving Categories**
```javascript
// Move category to new parent (reorganize hierarchy)
const response = await fetch('/category-manager/categories/3/move', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        newParentId: 5,
        sortOrder: 2
    })
});
```

### **Bulk Category Assignment**
```javascript
// Assign same categories to multiple content items
const response = await fetch('/category-manager/assign/bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        contentType: 'article',
        contentIds: [1, 2, 3, 4, 5],
        categoryIds: [10, 11],
        operation: 'add' // 'add', 'remove', or 'replace'
    })
});
```

### **Category Analytics**
```javascript
// Get category usage statistics
const response = await fetch('/category-manager/analytics/usage');
const stats = await response.json();

// Example response:
// {
//   "categoriesCount": 45,
//   "avgContentPerCategory": 8.5,
//   "mostUsedCategories": [
//     { "id": 2, "name": "Chinese HSK", "contentCount": 156 },
//     { "id": 5, "name": "Grammar", "contentCount": 89 }
//   ],
//   "unusedCategories": [
//     { "id": 23, "name": "Advanced Topics" }
//   ]
// }
```

## 🌍 **Multilingual Support**

### **Localized Category Names**
```javascript
// Create category with multiple language versions
const response = await fetch('/category-manager/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        name: 'Grammar Rules',
        slug: 'grammar-rules',
        localizations: {
            'zh': { name: '语法规则', description: '中文语法规则说明' },
            'es': { name: 'Reglas Gramaticales', description: 'Explicaciones de gramática española' },
            'fr': { name: 'Règles Grammaticales', description: 'Explications grammaticales françaises' }
        }
    })
});
```

### **Language-Specific Category Trees**
```javascript
// Get category tree in specific language
const response = await fetch('/category-manager/categories/tree?locale=zh');
const chineseCategoryTree = await response.json();
```

## 🚀 **Performance Features**

### **Caching Strategy**
- **Category Trees** - 30-minute TTL for complete hierarchy
- **Content Assignments** - 15-minute TTL for category-content relationships
- **Category Metadata** - 1-hour TTL for category details
- **Usage Statistics** - 6-hour TTL for analytics data

### **Optimization Techniques**
- **Hierarchical Indexing** - Database indexes on parent-child relationships
- **Lazy Loading** - Load category children on demand
- **Breadcrumb Caching** - Cache ancestor paths for fast breadcrumb display
- **Search Optimization** - Full-text search on category names and descriptions

## 🔍 **Troubleshooting**

### **Common Issues**

#### **Circular Reference Prevention**
```
Error: Cannot set parent - would create circular reference
```
**Solution:** The system automatically prevents categories from becoming their own ancestors

#### **Maximum Depth Exceeded**
```
Warning: Category depth exceeds maximum allowed depth of 5
```
**Solution:** Reorganize category hierarchy or increase maxDepth configuration

#### **Duplicate Category Names**
```
Error: Category name 'Grammar' already exists in taxonomy 'content-type'
```
**Solution:** Use unique names per taxonomy or enable hierarchical naming (Parent > Child)

### **Debug Mode**
```env
DEBUG_CATEGORIES=true
```
Enables detailed logging:
- Category hierarchy validation steps
- Parent-child relationship changes
- Content assignment operations
- Performance metrics for tree operations

## 📈 **Analytics & Reporting**

### **Category Usage Metrics**
```javascript
// Comprehensive category analytics
const response = await fetch('/category-manager/analytics/detailed');
const analytics = await response.json();

console.log('Total categories:', analytics.totalCategories);
console.log('Average depth:', analytics.averageHierarchyDepth);
console.log('Orphaned categories:', analytics.orphanedCategories);
console.log('Most popular:', analytics.topCategories);
```

### **Content Distribution Analysis**
- **Category Balance** - Content distribution across categories
- **Hierarchy Effectiveness** - Usage patterns by hierarchy level
- **Taxonomy Performance** - Which taxonomies are most/least used
- **Multilingual Coverage** - Category translation completeness

## 🚀 **Future Enhancements**

### **Planned Features**
- **Smart Category Suggestions** - AI-powered category recommendations
- **Bulk Category Operations** - Mass import/export and reorganization
- **Category Templates** - Predefined category structures for different domains
- **Advanced Search** - Full-text search across category hierarchies
- **Category Approval Workflow** - Review process for category changes

### **Integration Roadmap**
- **SEO Optimization** - Category-based URL structures and meta tags
- **Content Recommendations** - Related content based on category similarity
- **Analytics Dashboard** - Visual category performance metrics
- **API Extensions** - GraphQL support and advanced filtering

## 💼 **Business Value**

### **Content Organization Benefits**
- **Intuitive Navigation** - Users find content faster with clear categorization
- **Scalable Structure** - Hierarchy grows with content without losing organization
- **Professional Admin UX** - Efficient content management for editors
- **SEO Benefits** - Well-structured categories improve search rankings

### **Operational Efficiency**
- **Reduced Content Chaos** - Clear taxonomy prevents content sprawl
- **Faster Content Creation** - Predefined categories speed up publishing
- **Better Content Strategy** - Analytics reveal content gaps and opportunities
- **Multilingual Consistency** - Uniform categorization across all languages

### **Technical Advantages**
- **Database Efficiency** - Optimized queries for hierarchical data
- **Cache-Friendly** - Smart caching reduces database load
- **API Performance** - Efficient endpoints for category operations
- **Extensible Architecture** - Easy to add new taxonomy types

## 🔗 **Integration Examples**

### **With Collection Manager**
```javascript
// Categories influence collection health scoring
const collectionHealth = await fetch('/collection-manager/health/overview');
// Collections without primary categories flagged as "needs categorization"
```

### **With Per-Language Plugin**
```javascript
// Categories support multilingual workflows
const categoryAssignment = await fetch('/per-language/article/123/categories', {
    headers: { 'Accept-Language': 'zh' }
});
// Returns localized category names for Chinese interface
```

### **Content Filtering by Category**
```javascript
// Advanced content queries using categories
const articles = await fetch('/api/articles?filters[Category][id][$in][0]=2&filters[Category][id][$in][1]=3');
// Returns articles in "Chinese HSK" or "HSK 1" categories
```

## 📚 **Best Practices**

### **Category Design Guidelines**
1. **Logical Hierarchy** - Organize from general to specific
2. **Consistent Naming** - Use clear, descriptive category names
3. **Balanced Trees** - Avoid too deep or too shallow hierarchies
4. **Meaningful Taxonomies** - Create taxonomies that serve user needs
5. **Regular Maintenance** - Review and reorganize categories periodically

### **Performance Optimization**
1. **Limit Depth** - Keep hierarchies under 5 levels for best performance
2. **Cache Strategy** - Use appropriate TTL for different data types
3. **Batch Operations** - Group multiple category changes together
4. **Index Management** - Maintain database indexes on foreign keys
5. **Monitor Usage** - Track slow queries and optimize accordingly

### **Multilingual Considerations**
1. **Complete Translations** - Ensure all categories have translations
2. **Cultural Adaptation** - Adapt category structures for different regions
3. **Consistent Terminology** - Use standardized translations across content
4. **Fallback Logic** - Show default language if translation missing
5. **Translation Workflow** - Integrate category translation with content translation

---

**The Category Manager plugin provides the taxonomical foundation for your multilingual CMS, enabling sophisticated content organization that scales with your platform while maintaining intuitive user experience and professional administration capabilities.**