// src/plugins/per-language/admin/src/pages/ProcessingOverview.tsx

import React from 'react';
import {
    Layout,
    HeaderLayout,
    ContentLayout,
    Button
} from '@strapi/design-system';
import { ArrowLeft } from '@strapi/icons';
import { ProcessedDataDisplay } from '../components/ProcessedDataDisplay';

const ProcessingOverview = () => {
    // Get article ID from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const articleId = urlParams.get('articleId');

    const handleGoBack = () => {
        if (articleId) {
            const articleEditUrl = `/admin/content-manager/collection-types/api::article.article/${articleId}`;
            window.location.href = articleEditUrl;
        } else {
            window.history.back();
        }
    };

    if (!articleId) {
        return (
            <Layout>
                <HeaderLayout title="Processing Overview" />
                <ContentLayout>
                    <div>
                        <p>No article ID provided. Please access this page from an article.</p>
                        <Button onClick={handleGoBack} startIcon={<ArrowLeft />}>
                            Go Back
                        </Button>
                    </div>
                </ContentLayout>
            </Layout>
        );
    }

    return (
        <Layout>
            <HeaderLayout
                title={`Multi-Language Processing Overview - Article ${articleId}`}
                navigationAction={
                    <Button
                        startIcon={<ArrowLeft />}
                        variant="tertiary"
                        onClick={handleGoBack}
                    >
                        Back to Article
                    </Button>
                }
            />
            <ContentLayout>
                <ProcessedDataDisplay
                    articleId={articleId}
                    onRefresh={() => {
                        console.log('Refresh triggered');
                    }}
                />
            </ContentLayout>
        </Layout>
    );
};

export default ProcessingOverview;