// src/plugins/per-language/admin/src/pages/HomePage/index.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Divider,
  Flex,
  Grid,
  GridItem,
  Select,
  Option,
  Table,
  Thead,
  Tbody,
  Tr,
  Td,
  Th,
  Badge,
  IconButton
} from '@strapi/design-system';
import { Trash, Pencil, Check } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { request } from '@strapi/helper-plugin';
import pluginId from '../../pluginId';

interface Language {
  code: string;
  name: string;
  hasProcessor: boolean;
}

interface LanguageContent {
  id: number;
  article: { id: number; title: string };
  language: string;
  per_language_text: string;
  processed_data: any;
  display_skill: string;
  published: boolean;
  created_at: string;
  updated_at: string;
}

interface Article {
  id: number;
  title: string;
  [key: string]: any; // Allow additional properties
}

const HomePage: React.FC = () => {
  const { formatMessage } = useIntl();
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [selectedArticleId, setSelectedArticleId] = useState<string>('');
  const [articles, setArticles] = useState<Array<{ id: number; title: string }>>([]);
  const [articleLanguages, setArticleLanguages] = useState<LanguageContent[]>([]);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [refreshCounter, setRefreshCounter] = useState<number>(0);

  // Function to refresh data
  const refreshData = () => {
    setRefreshCounter(prev => prev + 1);
  };

  useEffect(() => {
    // Fetch available languages
    const fetchLanguages = async () => {
      try {
        const { data } = await request(`/${pluginId}/languages`, { method: 'GET' });
        setLanguages(data);
      } catch (error) {
        console.error('Error fetching languages:', error);
      } finally {
        setLoading(false);
      }
    };

    // Fetch available articles
    const fetchArticles = async () => {
      try {
        // Get the article content type UID
        const articleUID = 'api::article.article';

        // Fetch articles using the content manager API
        const response = await request(
          `/content-manager/collection-types/${articleUID}?page=1&pageSize=100&sort=id:DESC`,
          { method: 'GET' }
        );

        // Handle the response structure correctly
        if (response && response.results) {
          setArticles(response.results.map((article: Article) => ({
            id: article.id,
            title: article.title || `Article #${article.id}`
          })));
        } else {
          // Fallback if the response structure isn't as expected
          console.warn('Unexpected response structure:', response);
          const articleData = Array.isArray(response) ? response :
            (response?.data ? response.data : []);

          setArticles(articleData.map((article: any) => ({
            id: article.id,
            title: article.title || `Article #${article.id}`
          })));
        }
      } catch (error) {
        console.error('Error fetching articles:', error);
        // Set empty array so UI doesn't break
        setArticles([]);
      }
    };

    fetchLanguages();
    fetchArticles();
  }, [refreshCounter]);

  // Fetch article languages when an article is selected
  useEffect(() => {
    const fetchArticleLanguages = async () => {
      if (!selectedArticleId) return;

      try {
        setProcessingStatus('Loading language content...');
        const { data } = await request(`/${pluginId}/article/${selectedArticleId}/languages`, { method: 'GET' });
        setArticleLanguages(data);
        setProcessingStatus('');
      } catch (error) {
        console.error('Error fetching article languages:', error);
        setProcessingStatus('Error loading language content');
      }
    };

    fetchArticleLanguages();
  }, [selectedArticleId, refreshCounter]);

  const handleLanguageChange = (value: string) => {
    setSelectedLanguage(value);
  };

  const handleArticleChange = (value: string) => {
    setSelectedArticleId(value);
    setSelectedLanguage('');
  };

  const handleTranslate = async () => {
    if (!selectedArticleId || !selectedLanguage) {
      setProcessingStatus('Please select an article and a language');
      return;
    }

    setProcessingStatus('Translating...');
    try {
      const result = await request(`/${pluginId}/translate`, {
        method: 'POST',
        body: { articleId: parseInt(selectedArticleId), targetLanguage: selectedLanguage }
      });

      setProcessingStatus(`Translation ${result.success ? 'succeeded' : 'failed'}: ${result.message || ''}`);
      refreshData();
    } catch (error) {
      console.error('Translation error:', error);
      setProcessingStatus('Translation failed. See console for details.');
    }
  };

  const handleProcess = async () => {
    if (!selectedArticleId || !selectedLanguage) {
      setProcessingStatus('Please select an article and a language');
      return;
    }

    setProcessingStatus('Processing...');
    try {
      const result = await request(`/${pluginId}/process`, {
        method: 'POST',
        body: { articleId: parseInt(selectedArticleId), targetLanguage: selectedLanguage }
      });

      setProcessingStatus(`Processing ${result.success ? 'succeeded' : 'failed'}: ${result.message || ''}`);
      refreshData();
    } catch (error) {
      console.error('Processing error:', error);
      setProcessingStatus('Processing failed. See console for details.');
    }
  };

  const handleTranslateAndProcess = async () => {
    if (!selectedArticleId || !selectedLanguage) {
      setProcessingStatus('Please select an article and a language');
      return;
    }

    setProcessingStatus('Translating and processing...');
    try {
      const result = await request(`/${pluginId}/translate-and-process`, {
        method: 'POST',
        body: { articleId: parseInt(selectedArticleId), targetLanguage: selectedLanguage }
      });

      setProcessingStatus(`Operation ${result.success ? 'succeeded' : 'failed'}: ${result.message || ''}`);
      refreshData();
    } catch (error) {
      console.error('Translate and process error:', error);
      setProcessingStatus('Operation failed. See console for details.');
    }
  };

  const handleTogglePublish = async (contentId: number, currentStatus: boolean) => {
    try {
      await request(`/${pluginId}/content/${contentId}/publish`, {
        method: 'PUT',
        body: { published: !currentStatus }
      });

      refreshData();
      setProcessingStatus(`Content publish status toggled successfully`);
    } catch (error) {
      console.error('Error toggling publish status:', error);
      setProcessingStatus('Failed to toggle publish status');
    }
  };

  const handleDeleteContent = async (contentId: number) => {
    if (!window.confirm('Are you sure you want to delete this language content?')) {
      return;
    }

    try {
      await request(`/${pluginId}/content/${contentId}`, {
        method: 'DELETE'
      });

      refreshData();
      setProcessingStatus(`Language content deleted successfully`);
    } catch (error) {
      console.error('Error deleting language content:', error);
      setProcessingStatus('Failed to delete language content');
    }
  };

  if (loading) {
    return (
      <Box padding={8}>
        <Typography variant="beta">Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box padding={8}>
      <Typography variant="alpha">
        {formatMessage({ id: `${pluginId}.plugin.name`, defaultMessage: 'Per-language Processing' })}
      </Typography>

      <Box paddingTop={4}>
        <Typography variant="epsilon">Select an article and target language to begin processing</Typography>
      </Box>

      <Grid gap={4} padding={4}>
        <GridItem col={6}>
          <Box padding={2}>
            <Typography variant="delta">Article</Typography>
            <Select
              placeholder="Select an article"
              clearLabel="Clear"
              value={selectedArticleId}
              onChange={handleArticleChange}
            >
              {articles.map(article => (
                <Option key={article.id} value={article.id.toString()}>
                  {article.title || `Article #${article.id}`}
                </Option>
              ))}
            </Select>
          </Box>
        </GridItem>

        <GridItem col={6}>
          <Box padding={2}>
            <Typography variant="delta">Language</Typography>
            <Select
              placeholder="Select a language"
              clearLabel="Clear"
              value={selectedLanguage}
              onChange={handleLanguageChange}
            >
              {languages.map(lang => (
                <Option
                  key={lang.code}
                  value={lang.code}
                  disabled={!lang.hasProcessor}
                >
                  {lang.name} {!lang.hasProcessor && '(No processor available)'}
                </Option>
              ))}
            </Select>
          </Box>
        </GridItem>
      </Grid>

      <Divider />

      <Box padding={4}>
        <Flex gap={4}>
          <Button onClick={handleTranslate} disabled={!selectedArticleId || !selectedLanguage}>
            Translate
          </Button>
          <Button onClick={handleProcess} disabled={!selectedArticleId || !selectedLanguage}>
            Process
          </Button>
          <Button onClick={handleTranslateAndProcess} disabled={!selectedArticleId || !selectedLanguage}>
            Translate & Process
          </Button>
          <Button onClick={refreshData} variant="secondary">
            Refresh
          </Button>
        </Flex>
      </Box>

      {processingStatus && (
        <Box padding={4} background="neutral100" borderRadius="4px">
          <Typography variant="omega">{processingStatus}</Typography>
        </Box>
      )}

      <Divider />

      {selectedArticleId && (
        <Box paddingTop={4}>
          <Typography variant="delta">Language Content for Selected Article</Typography>

          {articleLanguages.length > 0 ? (
            <Table colCount={6} rowCount={articleLanguages.length}>
              <Thead>
                <Tr>
                  <Th><Typography variant="sigma">Language</Typography></Th>
                  <Th><Typography variant="sigma">Content Length</Typography></Th>
                  <Th><Typography variant="sigma">Processed</Typography></Th>
                  <Th><Typography variant="sigma">Display Skill</Typography></Th>
                  <Th><Typography variant="sigma">Status</Typography></Th>
                  <Th><Typography variant="sigma">Actions</Typography></Th>
                </Tr>
              </Thead>
              <Tbody>
                {articleLanguages.map(content => (
                  <Tr key={content.id}>
                    <Td>
                      <Typography>
                        {content.language}
                      </Typography>
                    </Td>
                    <Td>
                      <Typography>
                        {content.per_language_text?.length || 0} chars
                      </Typography>
                    </Td>
                    <Td>
                      <Typography>
                        {content.processed_data ? 'Yes' : 'No'}
                      </Typography>
                    </Td>
                    <Td>
                      <Typography>
                        {content.display_skill || '-'}
                      </Typography>
                    </Td>
                    <Td>
                      <Badge active={content.published}>
                        {content.published ? 'Published' : 'Draft'}
                      </Badge>
                    </Td>
                    <Td>
                      <Flex gap={2}>
                        <IconButton
                          onClick={() => handleTogglePublish(content.id, content.published)}
                          label={content.published ? 'Unpublish' : 'Publish'}
                          icon={<Check />}
                        />
                        <IconButton
                          onClick={() => handleDeleteContent(content.id)}
                          label="Delete"
                          icon={<Trash />}
                        />
                      </Flex>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          ) : (
            <Box padding={4} background="neutral100" borderRadius="4px">
              <Typography variant="omega">No language content found for this article</Typography>
            </Box>
          )}
        </Box>
      )}

      <Divider />

      <Box paddingTop={4}>
        <Typography variant="epsilon">
          Available Language Processors: {languages.filter(l => l.hasProcessor).length}
        </Typography>
        <Box padding={2}>
          {languages.filter(l => l.hasProcessor).map(lang => (
            <Box key={lang.code} padding={2} background="neutral100" marginBottom={2} borderRadius="4px">
              <Typography variant="omega">{lang.name} ({lang.code})</Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default HomePage;