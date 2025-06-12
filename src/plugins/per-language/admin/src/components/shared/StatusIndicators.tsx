// src/plugins/per-language/admin/src/components/shared/StatusIndicators.tsx

import React from 'react';
import { Flex, Badge, Box } from '@strapi/design-system';

interface StatusIndicatorsProps {
    hasContent: boolean;
    canProcess: boolean;
    hasProcessor: boolean;
    isSyncing?: boolean;
}

export const StatusIndicators: React.FC<StatusIndicatorsProps> = ({
    hasContent,
    canProcess,
    hasProcessor,
    isSyncing = false
}) => {
    return (
        <Box padding={3} background="neutral100" borderRadius="4px">
            <Flex gap={2} flexWrap="wrap">
                <Badge active={hasContent}>
                    {hasContent ? '✅ Content Available' : '⭕ No Content'}
                </Badge>

                <Badge active={canProcess}>
                    {canProcess ? '✅ Ready to Process' : '⭕ Add Content First'}
                </Badge>

                <Badge active={hasProcessor}>
                    {hasProcessor ? '⚙️ Processor Available' : '🚧 Under Development'}
                </Badge>

                {isSyncing && (
                    <Badge backgroundColor="warning">
                        🔄 Syncing...
                    </Badge>
                )}
            </Flex>
        </Box>
    );
};