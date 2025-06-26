// src/plugins/per-language/server/routes/index.ts
import articleRoutes from './article-routes';
import collectionRoutes from './collection-routes';

// Per-language routes
const perLanguageRoutes = [
  // Language management
  {
    method: 'GET',
    path: '/languages',
    handler: 'perLanguage.getLanguages',
    config: { auth: false, policies: [] }
  },
  {
    method: 'GET',
    path: '/article/:articleId/languages',
    handler: 'perLanguage.getArticleLanguages',
    config: { auth: false, policies: [] }
  },
  {
    method: 'GET',
    path: '/article/:articleId/language/:language',
    handler: 'perLanguage.getLanguageContent',
    config: { auth: false, policies: [] }
  },

  // Translation & Processing workflows
  {
    method: 'POST',
    path: '/translate',
    handler: 'perLanguage.translateArticle',
    config: { auth: false, policies: [] }
  },
  {
    method: 'POST',
    path: '/process',
    handler: 'perLanguage.processArticle',
    config: { auth: false, policies: [] }
  },
  {
    method: 'POST',
    path: '/translate-and-process',
    handler: 'perLanguage.translateAndProcess',
    config: { auth: false, policies: [] }
  },

  // Content management  
  {
    method: 'PUT',
    path: '/content/:contentId/publish',
    handler: 'perLanguage.setPublishStatus',
    config: { auth: false, policies: [] }
  },
  {
    method: 'DELETE',
    path: '/content/:contentId',
    handler: 'perLanguage.deleteLanguageContent',
    config: { auth: false, policies: [] }
  },
  {
    method: 'GET',
    path: '/article/:articleId/language/:language/refresh',
    handler: 'perLanguage.refreshLanguageData',
    config: { auth: false, policies: [], description: 'Refresh data for a specific language' }
  }
];

// Combine all routes
export default [
  ...perLanguageRoutes,
  ...articleRoutes,
  ...collectionRoutes
];