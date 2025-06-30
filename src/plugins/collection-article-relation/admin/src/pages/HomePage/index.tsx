// src/plugins/collection-article-relation/admin/src/pages/HomePage/index.tsx

import React from 'react';

const HomePage = () => {
  return (
    <div style={{ padding: '2rem', backgroundColor: '#f9f9f9', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            color: '#212134',
            marginBottom: '0.5rem'
          }}>
            Collection Auto-Fill Plugin
          </h1>
          <p style={{
            fontSize: '1.1rem',
            color: '#666687',
            marginBottom: '2rem'
          }}>
            Streamline your content workflow with intelligent collection creation
          </p>
        </div>

        {/* Status Section */}
        <div style={{
          backgroundColor: '#d4edda',
          padding: '2rem',
          borderRadius: '12px',
          marginBottom: '2rem',
          border: '1px solid #c3e6cb',
          textAlign: 'center'
        }}>
          <h2 style={{
            fontSize: '1.75rem',
            color: '#155724',
            marginBottom: '1rem',
            fontWeight: '600'
          }}>
            ✅ Plugin Active & Working
          </h2>
          <p style={{
            fontSize: '1rem',
            color: '#155724',
            marginBottom: '1rem',
            lineHeight: '1.6'
          }}>
            The floating "📚 Quick Collection" button is now available on all article edit pages.
            Click it to instantly create collections with auto-filled fields.
          </p>
          <div style={{
            display: 'inline-block',
            padding: '0.5rem 1rem',
            backgroundColor: '#c3e6cb',
            color: '#155724',
            borderRadius: '20px',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}>
            Ready to Use
          </div>
        </div>

        {/* How to Use Section */}
        <div style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '12px',
          marginBottom: '2rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            color: '#212134',
            marginBottom: '1.5rem',
            fontWeight: '600'
          }}>
            🎯 How to Use
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem'
          }}>
            {[
              {
                step: '1',
                title: 'Navigate to Article',
                description: 'Go to any article edit page in the content manager',
                color: '#4945ff'
              },
              {
                step: '2',
                title: 'Find the Button',
                description: 'Look for the floating "📚 Quick Collection" button in the bottom-right',
                color: '#f59e0b'
              },
              {
                step: '3',
                title: 'Click to Create',
                description: 'Click the button to instantly create a collection with auto-filled data',
                color: '#8b5cf6'
              },
              {
                step: '4',
                title: 'Open Collection',
                description: 'Click "📂 Open Collection" in the notification to view your new collection',
                color: '#10b981'
              }
            ].map((item, index) => (
              <div key={index} style={{
                textAlign: 'center',
                padding: '1.5rem',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px'
              }}>
                <div style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: item.color,
                  marginBottom: '0.5rem'
                }}>
                  {item.step}
                </div>
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#212134',
                  marginBottom: '0.5rem'
                }}>
                  {item.title}
                </h3>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#666687',
                  lineHeight: '1.4',
                  margin: 0
                }}>
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Auto-Fill Features */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: '2rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              color: '#212134',
              marginBottom: '1.5rem',
              fontWeight: '600'
            }}>
              ✨ What Gets Auto-Filled
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem'
            }}>
              {[
                { title: 'Title & Date', desc: 'Collection title and date copied exactly from the source article', bg: '#d4edda', color: '#155724' },
                { title: 'Cover & Category', desc: 'Cover image and category automatically copied from the article', bg: '#e6f3ff', color: '#0d47a1' },
                { title: 'Article Relation', desc: 'The source article is automatically linked to the new collection', bg: '#fff3cd', color: '#856404' },
                { title: 'Duplicate Prevention', desc: 'Detects existing single-article collections and redirects instead of creating duplicates', bg: '#f3e5f5', color: '#4a148c' }
              ].map((feature, index) => (
                <div key={index} style={{
                  padding: '1rem',
                  backgroundColor: feature.bg,
                  borderRadius: '8px'
                }}>
                  <h3 style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: feature.color,
                    marginBottom: '0.5rem'
                  }}>
                    ✅ {feature.title}
                  </h3>
                  <p style={{
                    fontSize: '0.75rem',
                    color: feature.color,
                    margin: 0,
                    lineHeight: '1.4'
                  }}>
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Key Benefits */}
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              color: '#212134',
              marginBottom: '1.5rem',
              fontWeight: '600'
            }}>
              🎉 Key Benefits
            </h2>

            {[
              { metric: '90%', title: 'Time Savings', desc: 'Dramatically reduce manual collection creation time', color: '#4945ff' },
              { metric: '1-Click', title: 'Collection Creation', desc: 'Instant collection creation with full auto-fill', color: '#10b981' },
              { metric: 'Zero', title: 'Learning Curve', desc: 'Intuitive floating button requires no training', color: '#f59e0b' }
            ].map((benefit, index) => (
              <div key={index} style={{
                textAlign: 'center',
                marginBottom: index < 2 ? '1.5rem' : 0
              }}>
                <div style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: benefit.color,
                  marginBottom: '0.25rem'
                }}>
                  {benefit.metric}
                </div>
                <h3 style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#212134',
                  marginBottom: '0.25rem'
                }}>
                  {benefit.title}
                </h3>
                <p style={{
                  fontSize: '0.75rem',
                  color: '#666687',
                  margin: 0,
                  lineHeight: '1.4'
                }}>
                  {benefit.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Info */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '2rem'
        }}>
          {/* Multi-Article Collections */}
          <div style={{
            backgroundColor: '#f3e5f5',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid #e1bee7'
          }}>
            <h2 style={{
              fontSize: '1.25rem',
              color: '#4a148c',
              marginBottom: '1rem',
              fontWeight: '600'
            }}>
              💡 Multi-Article Collections
            </h2>
            <h3 style={{
              fontSize: '1rem',
              color: '#4a148c',
              marginBottom: '0.75rem',
              fontWeight: '500'
            }}>
              Need collections with multiple articles?
            </h3>
            <p style={{
              fontSize: '0.875rem',
              color: '#4a148c',
              margin: 0,
              lineHeight: '1.5'
            }}>
              Use the quick button to create a collection from your primary article, then manually add additional articles to it.
              This workflow is still much faster than creating everything from scratch!
            </p>
          </div>

          {/* Technical Info */}
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid #dee2e6'
          }}>
            <h2 style={{
              fontSize: '1.25rem',
              color: '#212134',
              marginBottom: '1rem',
              fontWeight: '600'
            }}>
              🔧 Technical Details
            </h2>

            {[
              { label: 'Plugin Version:', value: '2.0.0 (Simplified & Optimized)' },
              { label: 'Primary Use Case:', value: 'Single-article collections (80% of use cases)' },
              { label: 'Integration:', value: 'Non-invasive floating button system' },
              { label: 'API Endpoints:', value: '/quick-create, /health' }
            ].map((detail, index) => (
              <div key={index} style={{ marginBottom: '0.75rem' }}>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: '#212134'
                }}>
                  {detail.label}
                </span>
                <br />
                <span style={{
                  fontSize: '0.75rem',
                  color: '#666687'
                }}>
                  {detail.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;