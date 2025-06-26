import { prefixPluginTranslations } from '@strapi/helper-plugin';

import pluginPkg from '../../package.json';
import pluginId from './pluginId';
import Initializer from './components/Initializer';
import PluginIcon from './components/PluginIcon';

const name = pluginPkg.strapi.name;

export default {
  register(app: any) {
    app.addMenuLink({
      to: `/plugins/${pluginId}`,
      icon: PluginIcon,
      intlLabel: {
        id: `${pluginId}.plugin.name`,
        defaultMessage: name,
      },
      Component: async () => {
        const component = await import('./pages/App');
        return component;
      },
      permissions: [],
    });

    const plugin = {
      id: pluginId,
      initializer: Initializer,
      isReady: false,
      name,
    };

    app.registerPlugin(plugin);
  },

  bootstrap(app: any) {
    console.log('[Collection Article Relation] Bootstrap completed');

    // Simple DOM-based approach
    setTimeout(() => {
      console.log('[Collection Article Relation] Setting up global button detection');

      // Create a simple detector that runs periodically
      const checkAndAddButton = () => {
        const currentPath = window.location.pathname;
        const isArticlePage = /\/admin\/content-manager\/collection-types\/api::article\.article\/(\d+)/.test(currentPath);

        if (isArticlePage && !document.getElementById('floating-collection-btn')) {
          const match = currentPath.match(/\/admin\/content-manager\/collection-types\/api::article\.article\/(\d+)/);
          if (match) {
            const articleId = match[1];
            addFloatingButton(articleId);
          }
        } else if (!isArticlePage) {
          removeFloatingButton();
        }
      };

      // Check every 2 seconds
      setInterval(checkAndAddButton, 2000);
      checkAndAddButton(); // Initial check

    }, 2000);
  },

  async registerTrads(app: any) {
    const { locales } = app;

    const importedTrads = await Promise.all(
      (locales as any[]).map((locale) => {
        return import(`./translations/${locale}.json`)
          .then(({ default: data }) => {
            return {
              data: prefixPluginTranslations(data, pluginId),
              locale,
            };
          })
          .catch(() => {
            return {
              data: {},
              locale,
            };
          });
      })
    );

    return Promise.resolve(importedTrads);
  },
};

// Simple DOM-based floating button
function addFloatingButton(articleId: string) {
  console.log('[Collection Article Relation] Adding floating button for article:', articleId);

  const button = document.createElement('button');
  button.id = 'floating-collection-btn';
  button.innerHTML = '📚 Create Collection';
  button.style.cssText = `
    position: fixed;
    top: 100px;
    right: 20px;
    z-index: 9999;
    background: #4945ff;
    color: white;
    border: none;
    padding: 12px 16px;
    border-radius: 25px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    transition: all 0.2s ease;
  `;

  button.onmouseover = () => {
    button.style.transform = 'scale(1.05)';
    button.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
  };

  button.onmouseout = () => {
    button.style.transform = 'scale(1)';
    button.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
  };

  button.onclick = async () => {
    button.innerHTML = '⏳ Creating...';
    button.disabled = true;

    try {
      const response = await fetch('/collection-article-relation/quick-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ articleId: parseInt(articleId) })
      });

      const data = await response.json();

      if (data.success) {
        button.innerHTML = '✅ Created!';

        // Show success notification
        const notification = document.createElement('div');
        notification.innerHTML = `Collection "${data.data.collection.Title}" created successfully!`;
        notification.style.cssText = `
          position: fixed;
          top: 50px;
          right: 20px;
          background: #28a745;
          color: white;
          padding: 12px 16px;
          border-radius: 8px;
          z-index: 10000;
          font-size: 14px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        document.body.appendChild(notification);

        setTimeout(() => {
          notification.remove();
          if (data.data.redirectUrl) {
            window.location.href = data.data.redirectUrl;
          }
        }, 2000);
      } else {
        throw new Error('Creation failed');
      }
    } catch (error) {
      console.error('Failed to create collection:', error);
      button.innerHTML = '❌ Failed';
      setTimeout(() => {
        button.innerHTML = '📚 Create Collection';
        button.disabled = false;
      }, 2000);
    }
  };

  document.body.appendChild(button);
}

function removeFloatingButton() {
  const existingButton = document.getElementById('floating-collection-btn');
  if (existingButton) {
    existingButton.remove();
  }
}