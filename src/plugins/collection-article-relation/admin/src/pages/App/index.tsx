/**
 *
 * This component is the skeleton around the actual pages, and should only
 * contain code that should be seen on all pages. (e.g. navigation bar)
 *
 */

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import pluginId from '../../pluginId';
import HomePage from '../HomePage';
import { Page } from "@strapi/strapi/admin";

const App = () => {
  console.log('[App] Component rendered - but FloatingCollectionButton should be mounted globally');

  return (
    <div>
      <Routes>
        <Route path={`/plugins/${pluginId}`} element={<HomePage />} />
        <Route path="*" element={<Page.Error />} />
      </Routes>
    </div>
  );
};

export default App;