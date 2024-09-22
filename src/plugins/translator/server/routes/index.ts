//server/routes/index.ts

export default [
  {
    method: 'POST',
    path: '/translate',
    handler: 'translation-controller.translate',
    config: {
      auth: false,
      policies: [],
    },
  },
];