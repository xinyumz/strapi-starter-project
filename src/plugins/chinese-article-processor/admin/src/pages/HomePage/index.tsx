// src/plugins/chinese-article-processor/admin/src/pages/HomePage/index.tsx

import React, { useEffect, useState } from 'react';

// Import the processor component
const ChineseArticleProcessor = React.lazy(() => import('../ChineseArticleProcessor'));

const HomePage = () => {
  const [showProcessor, setShowProcessor] = useState(false);
  const [articleId, setArticleId] = useState<string | null>(null);

  useEffect(() => {
    // Check if we're on the processor route or have articleId parameter
    const currentPath = window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);
    const articleIdParam = urlParams.get('articleId');

    console.log('[HomePage] Current path:', currentPath);
    console.log('[HomePage] Article ID param:', articleIdParam);

    if (currentPath.includes('/chinese-processor') || articleIdParam) {
      setShowProcessor(true);
      setArticleId(articleIdParam);
    }
  }, []);

  // If we should show the processor, render it
  if (showProcessor) {
    return (
      <React.Suspense fallback={
        <div style={{
          padding: '2rem',
          textAlign: 'center' as const,
          backgroundColor: '#f9f9f9',
          minHeight: '100vh'
        }}>
          <div style={{ color: '#666687' }}>Loading Chinese Processor...</div>
        </div>
      }>
        <ChineseArticleProcessor />
      </React.Suspense>
    );
  }

  // Otherwise render the homepage
  return (
    <div style={{ padding: '2rem', backgroundColor: '#f9f9f9', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            color: '#212134',
            marginBottom: '0.5rem'
          }}>
            Chinese Article Processor
          </h1>
          <p style={{
            fontSize: '1.1rem',
            color: '#666687',
            marginBottom: '2rem'
          }}>
            Advanced Chinese language processing with HSK analysis, grammar rules, and translation features.
          </p>
        </div>

        {/* How to Use Section */}
        <div style={{
          backgroundColor: '#f6f6f9',
          padding: '1.5rem',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          border: '1px solid #dcdce4'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#212134',
            marginBottom: '1rem'
          }}>
            How to Use
          </h2>
          <div style={{ color: '#4a4a6a', lineHeight: '1.6' }}>
            <p style={{ margin: '0.5rem 0' }}>• Go to Content Manager → Articles</p>
            <p style={{ margin: '0.5rem 0' }}>• Edit any article and add Chinese content</p>
            <p style={{ margin: '0.5rem 0' }}>• Use the "Language Processor" field to translate to Chinese</p>
            <p style={{ margin: '0.5rem 0' }}>• Click "Process Content" to analyze Chinese text</p>
            <p style={{ margin: '0.5rem 0' }}>• Or access the processor directly from the link below</p>
          </div>
        </div>

        {/* Features Section */}
        <div style={{
          backgroundColor: '#e6f3ff',
          padding: '1.5rem',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          border: '1px solid #b3d9ff'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#212134',
            marginBottom: '1rem'
          }}>
            Features
          </h2>
          <div style={{ color: '#4a4a6a', lineHeight: '1.6' }}>
            <p style={{ margin: '0.5rem 0' }}>✅ HSK level analysis and vocabulary difficulty</p>
            <p style={{ margin: '0.5rem 0' }}>✅ AI-powered grammar rule generation</p>
            <p style={{ margin: '0.5rem 0' }}>✅ Sentence-by-sentence breakdown</p>
            <p style={{ margin: '0.5rem 0' }}>✅ Multi-language translation support</p>
            <p style={{ margin: '0.5rem 0' }}>✅ Stable sentence ID management</p>
            <p style={{ margin: '0.5rem 0' }}>✅ Integrated with per-language content system</p>
          </div>
        </div>

        {/* Technical Integration */}
        <div style={{
          backgroundColor: '#d4edda',
          padding: '1.5rem',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          border: '1px solid #c3e6cb'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#212134',
            marginBottom: '1rem'
          }}>
            Technical Integration
          </h2>
          <div style={{ color: '#155724', lineHeight: '1.6' }}>
            <p style={{ margin: '0.5rem 0', display: 'flex', alignItems: 'center' }}>
              <span style={{
                display: 'inline-block',
                backgroundColor: '#c3e6cb',
                color: '#155724',
                padding: '0.2rem 0.5rem',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: '500',
                marginRight: '0.5rem'
              }}>
                Active
              </span>
              Integrated with per-language plugin
            </p>
            <p style={{ margin: '0.5rem 0', display: 'flex', alignItems: 'center' }}>
              <span style={{
                display: 'inline-block',
                backgroundColor: '#c3e6cb',
                color: '#155724',
                padding: '0.2rem 0.5rem',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: '500',
                marginRight: '0.5rem'
              }}>
                Ready
              </span>
              External API connections (HSK, Grammar, Pinyin)
            </p>
            <p style={{ margin: '0.5rem 0', display: 'flex', alignItems: 'center' }}>
              <span style={{
                display: 'inline-block',
                backgroundColor: '#c3e6cb',
                color: '#155724',
                padding: '0.2rem 0.5rem',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: '500',
                marginRight: '0.5rem'
              }}>
                Stable
              </span>
              Database relationships with foreign keys
            </p>
            <p style={{ margin: '0.5rem 0', display: 'flex', alignItems: 'center' }}>
              <span style={{
                display: 'inline-block',
                backgroundColor: '#c3e6cb',
                color: '#155724',
                padding: '0.2rem 0.5rem',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: '500',
                marginRight: '0.5rem'
              }}>
                Optimized
              </span>
              Intelligent UPSERT operations preserve sentence IDs
            </p>
          </div>
        </div>

        {/* Quick Access */}
        <div style={{ marginTop: '2rem' }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#212134',
            marginBottom: '1rem'
          }}>
            Quick Access
          </h2>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <a
              href="/admin/content-manager/collection-types/api::article.article"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '0.75rem 1.5rem',
                backgroundColor: '#4945ff',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '6px',
                fontWeight: '500',
                fontSize: '0.875rem',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#3730df';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#4945ff';
              }}
            >
              <span style={{ marginRight: '0.5rem' }}>📝</span>
              Go to Articles
            </a>

            <a
              href="/admin/plugins/chinese-article-processor/chinese-processor"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '0.75rem 1.5rem',
                backgroundColor: '#10b981',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '6px',
                fontWeight: '500',
                fontSize: '0.875rem',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#059669';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#10b981';
              }}
            >
              <span style={{ marginRight: '0.5rem' }}>🔧</span>
              Open Chinese Processor
            </a>
          </div>
        </div>

        {/* Status Indicator */}
        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          backgroundColor: '#d4edda',
          borderRadius: '6px',
          border: '1px solid #c3e6cb'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            color: '#155724'
          }}>
            <span style={{ marginRight: '0.5rem', fontSize: '1.2rem' }}>✅</span>
            <strong>Plugin Status: Active & Ready</strong>
          </div>
          <p style={{
            margin: '0.5rem 0 0 0',
            color: '#155724',
            fontSize: '0.875rem'
          }}>
            Chinese processing capabilities are fully integrated and ready to use.
          </p>
        </div>

        {/* Usage Statistics */}
        <div style={{
          marginTop: '2rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem'
        }}>
          {[
            { label: 'HSK Analysis', status: 'Operational', color: '#10b981' },
            { label: 'Grammar Rules', status: 'Active', color: '#4945ff' },
            { label: 'Translations', status: 'Ready', color: '#f59e0b' },
            { label: 'Sentence Processing', status: 'Online', color: '#8b5cf6' }
          ].map((item, index) => (
            <div key={index} style={{
              backgroundColor: 'white',
              padding: '1rem',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              textAlign: 'center' as const
            }}>
              <div style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#212134',
                marginBottom: '0.5rem'
              }}>
                {item.label}
              </div>
              <div style={{
                fontSize: '0.75rem',
                fontWeight: '500',
                color: item.color,
                padding: '0.25rem 0.5rem',
                backgroundColor: `${item.color}20`,
                borderRadius: '12px',
                display: 'inline-block'
              }}>
                {item.status}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;