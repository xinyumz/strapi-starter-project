//server/index.ts

import register from './register';
import bootstrap from './bootstrap';
import destroy from './destroy';
import config from './config';
import contentTypes from './content-types';
import controllers from './controllers';
import routes from './routes';
import middlewares from './middlewares';
import policies from './policies';
import services from './services';

export default {
  register,
  bootstrap,
  destroy,
  config,
  controllers,
  routes,
  services,
  contentTypes,
  policies,
  middlewares,
};

console.log('Loading translator plugin server');
console.log('Content types:', JSON.stringify(contentTypes, null, 2));