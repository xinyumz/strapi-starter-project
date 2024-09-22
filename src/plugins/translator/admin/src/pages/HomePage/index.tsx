/*
 *
 * HomePage
 * /admin/src/pages/HomePage/index.tsx
 *
 */


import React from 'react';
import { Box, Typography } from '@strapi/design-system';

const HomePage: React.FC = () => {
  return (
    <Box padding={8} background="neutral100">
      <Typography variant="alpha">Translator Plugin</Typography>
      <Typography>Welcome to the Translator plugin!</Typography>
    </Box>
  );
};

export default HomePage;