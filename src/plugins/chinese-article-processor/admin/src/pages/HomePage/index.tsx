// src/plugins/chinese-article-processor/admin/src/pages/HomePage/index.tsx

import React from 'react';
import {
  Layout,
  HeaderLayout,
  ContentLayout,
  Box,
  Typography,
  Link,
  Badge
} from '@strapi/design-system';
import { ExternalLink } from '@strapi/icons';
import pluginId from '../../pluginId';

const HomePage = () => {
  return (
    <Layout>
      <HeaderLayout title={`${pluginId} Plugin`} />
      <ContentLayout>
        <Box padding={8}>
          <Typography variant="alpha" marginBottom={4}>
            Chinese Article Processor
          </Typography>

          <Typography variant="epsilon" marginBottom={6}>
            Advanced Chinese language processing with HSK analysis, grammar rules, and translation features.
          </Typography>

          <Box padding={4} background="neutral100" borderRadius="4px" marginBottom={4}>
            <Typography variant="delta" marginBottom={2}>
              How to Use
            </Typography>
            <Typography variant="omega">
              • Go to Content Manager → Articles<br />
              • Edit any article and add Chinese content<br />
              • Use the "Language Processor" field to translate to Chinese<br />
              • Click "Process Content" to analyze Chinese text<br />
              • Opens dedicated Chinese processor interface for detailed analysis
            </Typography>
          </Box>

          <Box padding={4} background="primary100" borderRadius="4px" marginBottom={4}>
            <Typography variant="delta" marginBottom={2}>
              Features
            </Typography>
            <Typography variant="omega">
              ✅ HSK level analysis and vocabulary difficulty<br />
              ✅ AI-powered grammar rule generation<br />
              ✅ Sentence-by-sentence breakdown<br />
              ✅ Multi-language translation support<br />
              ✅ Stable sentence ID management<br />
              ✅ Integrated with per-language content system
            </Typography>
          </Box>

          <Box padding={4} background="success100" borderRadius="4px" marginBottom={4}>
            <Typography variant="delta" marginBottom={2}>
              Technical Integration
            </Typography>
            <Typography variant="omega">
              • <Badge backgroundColor="success200">Active</Badge> Integrated with per-language plugin<br />
              • <Badge backgroundColor="success200">Ready</Badge> External API connections (HSK, Grammar, Pinyin)<br />
              • <Badge backgroundColor="success200">Stable</Badge> Database relationships with foreign keys<br />
              • <Badge backgroundColor="success200">Optimized</Badge> Intelligent UPSERT operations preserve sentence IDs
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
      </ContentLayout>
    </Layout>
  );
};

export default HomePage;