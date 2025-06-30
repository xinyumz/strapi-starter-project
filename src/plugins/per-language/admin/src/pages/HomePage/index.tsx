// src/plugins/per-language/admin/src/pages/HomePage/index.tsx

import React from 'react';

const HomePage: React.FC = () => {
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
            Per-Language Content Management
          </h1>
          <p style={{
            fontSize: '1.1rem',
            color: '#666687',
            marginBottom: '2rem'
          }}>
            This plugin provides multi-language content management capabilities for articles.
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
            <p style={{ margin: '0.5rem 0' }}>• Edit any article</p>
            <p style={{ margin: '0.5rem 0' }}>• Use the "Language Processor" field to translate and manage content</p>
            <p style={{ margin: '0.5rem 0' }}>• The field provides integrated translation, processing, and publishing controls</p>
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
            <p style={{ margin: '0.5rem 0' }}>✅ Multi-language translation</p>
            <p style={{ margin: '0.5rem 0' }}>✅ Chinese content processing (HSK analysis, grammar rules)</p>
            <p style={{ margin: '0.5rem 0' }}>✅ Per-language publishing controls</p>
            <p style={{ margin: '0.5rem 0' }}>✅ Access tier management (Free/Login/Premium)</p>
            <p style={{ margin: '0.5rem 0' }}>✅ Integrated workflow within article editor</p>
          </div>
        </div>

        {/* Quick Access */}
        <div style={{ marginTop: '2rem' }}>
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
            <span style={{ marginRight: '0.5rem' }}>→</span>
            Go to Articles
          </a>
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
            The Language Processor field is available in all article content types.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;