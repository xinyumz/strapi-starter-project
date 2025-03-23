# Strapi plugin chinese-article-processor

A plugin for processing Chinese articles with HSK level calculation, grammar rules generation, and translations.

## Features

- HSK vocabulary level calculation for Chinese text
- Chinese grammar rule generation
- Sentence translation capabilities
- Custom field for integrating with Strapi content types

## Installation

```bash
npm install chinese-article-processor
# or
yarn add chinese-article-processor
```

## Configuration

Add the plugin to your `config/plugins.js` file:

```js
module.exports = {
  // ...
  'chinese-article-processor': {
    enabled: true,
    // Additional configuration options can be added here
  },
  // ...
}
```