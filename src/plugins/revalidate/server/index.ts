// src/plugins/revalidate/server/index.ts

import register from './register';
import bootstrap from './bootstrap';
import destroy from './destroy';
import config from './config';
import routes from './routes';
import controllers from './controllers';
import services from './services';

export default {
    register,
    bootstrap,
    destroy,
    config,
    routes,
    controllers,
    services,
};