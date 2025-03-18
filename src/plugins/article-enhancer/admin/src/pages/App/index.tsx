/**
 *
 * This component is the skeleton around the actual pages, and should only
 * contain code that should be seen on all pages. (e.g. navigation bar)
 *
 */

import React from 'react';
import { Switch, Route } from 'react-router-dom';
import { NotFound } from '@strapi/helper-plugin';
import pluginId from '../../pluginId';
import GrammarPage from '../GrammarPage';
import ChineseArticleProcessor from '../ChineseArticleProcessor';

const App = () => {
  return (
    <div>
      <Switch>
        <Route path={`/plugins/${pluginId}/chinese-processor`} component={ChineseArticleProcessor} exact />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
};

export default App;