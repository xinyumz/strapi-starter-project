export default [
  {
    method: 'GET',
    path: '/taxons',
    handler: 'taxonController.find',
    config: {
      auth: false,
      policies: [],
    },
  },
  {
    method: 'GET',
    path: '/taxons/:id',
    handler: 'taxonController.findOne',
    config: {
      auth: false,
      policies: [],
    },
  },
  {
    method: 'POST',
    path: '/taxons',
    handler: 'taxonController.create',
    config: {
      auth: false,
      policies: [],
    },
  },
  {
    method: 'PUT',
    path: '/taxons/:id',
    handler: 'taxonController.update',
    config: {
      auth: false,
      policies: [],
    },
  },
  {
    method: 'DELETE',
    path: '/taxons/:id',
    handler: 'taxonController.delete',
    config: {
      auth: false,
      policies: [],
    },
  },
  {
    method: 'GET',
    path: '/taxons-with-categories',
    handler: 'taxonController.findWithCategories',
    config: {
      auth: false,
      policies: [],
    },
  },
  {
    method: 'GET',
    path: '/categories',
    handler: 'categoryController.find',
    config: {
      auth: false,
      policies: [],
    },
  },
  {
    method: 'GET',
    path: '/categories/:id',
    handler: 'categoryController.findOne',
    config: {
      auth: false,
      policies: [],
    },
  },
  {
    method: 'POST',
    path: '/categories',
    handler: 'categoryController.create',
    config: {
      auth: false,
      policies: [],
    },
  },
  {
    method: 'PUT',
    path: '/categories/:id',
    handler: 'categoryController.update',
    config: {
      auth: false,
      policies: [],
    },
  },
  {
    method: 'DELETE',
    path: '/categories/:id',
    handler: 'categoryController.delete',
    config: {
      auth: false,
      policies: [],
    },
  },
  {
    method: 'GET',
    path: '/categories/by-taxon/:taxonId',
    handler: 'categoryController.findByTaxon',
    config: {
      auth: false,
      policies: [],
    },
  },
];