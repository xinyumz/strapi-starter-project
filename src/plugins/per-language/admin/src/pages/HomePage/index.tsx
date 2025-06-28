// src/plugins/per-language/admin/src/pages/HomePage/index.tsx

import React from 'react';
import {
  Main,
  Header,
  Content,
  Box,
  Typography,
  Link
} from '@strapi/design-system';
import { ExternalLink } from '@strapi/icons';
import pluginId from '../../pluginId';

const HomePage: React.FC = () => {
  return (
    <Main>
      <Box title={`${pluginId} Plugin`} />
      <Main>
        <Box padding={8}>
          <Typography variant="alpha" marginBottom={4}>
            Per-Language Content Management
          </Typography>

          <Typography variant="epsilon" marginBottom={6}>
            This plugin provides multi-language content management capabilities for articles.
          </Typography>

          <Box padding={4} background="neutral100" borderRadius="4px" marginBottom={4}>
            <Typography variant="delta" marginBottom={2}>
              How to Use
            </Typography>
            <Typography variant="omega">
              • Go to Content Manager → Articles<br />
              • Edit any article<br />
              • Use the "Language Processor" field to translate and manage content<br />
              • The field provides integrated translation, processing, and publishing controls
            </Typography>
          </Box>

          <Box padding={4} background="primary100" borderRadius="4px">
            <Typography variant="delta" marginBottom={2}>
              Features
            </Typography>
            <Typography variant="omega">
              ✅ Multi-language translation<br />
              ✅ Chinese content processing (HSK analysis, grammar rules)<br />
              ✅ Per-language publishing controls<br />
              ✅ Access tier management (Free/Login/Premium)<br />
              ✅ Integrated workflow within article editor
            </Typography>
          </Box>

          <Box paddingTop={6}>
            <Link
              href="/admin/content-manager/collection-types/api::article.article"
              startIcon={<ExternalLink />}
              isExternal={false}
            >
              Go to Articles
            </Link>
          </Box>
        </Box>
      </Main>
    </Main>
  );
};

export default HomePage;