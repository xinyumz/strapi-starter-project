// src/plugins/chinese-article-processor/admin/src/pages/App/index.tsx

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Page } from '@strapi/strapi/admin';
import pluginId from '../../pluginId';
import HomePage from '../HomePage';
import ChineseArticleProcessor from '../ChineseArticleProcessor';

const App = () => {
  return (
    <div>
      <Routes>
        {/* Homepage route */}
        <Route path={`/plugins/${pluginId}`} element={<HomePage />} />

        {/* Chinese processor route with optional articleId parameter */}
        <Route path={`/plugins/${pluginId}/chinese-processor`} element={<ChineseArticleProcessor />} />

        {/* Fallback error page */}
        <Route path="*" element={<Page.Error />} />
      </Routes>
    </div>
  );
};

export default App;