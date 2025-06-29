// src/plugins/per-language/admin/src/components/processed-data/BulkControls.tsx

import React from 'react';
import { Refresh } from '@strapi/icons';

interface BulkControlsProps {
    onLanguageSelect: (language: string) => void;
    onRefresh: () => void;
    onBulkPublish: (publish: boolean) => void;
    onBulkAccessTier: (tier: string) => void;
    bulkPublishState: boolean;
}

export const BulkControls: React.FC<BulkControlsProps> = ({
    onLanguageSelect,
    onRefresh,
    onBulkPublish,
    onBulkAccessTier,
    bulkPublishState
}) => {
    return (
        <div style={{
            background: 'white',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            marginBottom: '16px',
            padding: '16px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
            <div style={{ width: "100%", padding: "16px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {/* Line 1: Open Language Card - Responsive inline/stacked */}
                    <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        flexWrap: "wrap",
                        gap: "12px"
                    }}>
                        <div style={{
                            display: "flex",
                            gap: "12px",
                            alignItems: "center",
                            flexWrap: "wrap",
                            minWidth: "fit-content",
                            maxWidth: "100%"
                        }}>
                            <span style={{
                                fontSize: "14px",
                                fontWeight: "bold",
                                whiteSpace: "nowrap",
                                flexShrink: 0,
                                color: "#32324d"
                            }}>
                                Open Language Card:
                            </span>
                            <select
                                style={{
                                    minWidth: "200px",
                                    flexShrink: 1,
                                    padding: "8px 12px",
                                    border: "1px solid #dcdce4",
                                    borderRadius: "4px",
                                    fontSize: "14px",
                                    backgroundColor: "white",
                                    cursor: "pointer"
                                }}
                                onChange={(e) => onLanguageSelect(e.target.value)}
                                defaultValue=""
                            >
                                <option value="" disabled>Select language to view</option>
                                <option value="zh">Chinese (中文) ⚙️</option>
                                <option value="es">Spanish (Español) 🚧</option>
                                <option value="fr">French (Français) 🚧</option>
                                <option value="de">German (Deutsch) 🚧</option>
                                <option value="ja">Japanese (日本語) 🚧</option>
                                <option value="pt">Portuguese (Português) 🚧</option>
                            </select>
                        </div>
                        <button
                            onClick={onRefresh}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                padding: "8px 12px",
                                border: "1px solid #dcdce4",
                                borderRadius: "4px",
                                backgroundColor: "white",
                                cursor: "pointer",
                                fontSize: "14px",
                                flexShrink: 0
                            }}
                        >
                            <Refresh width="16px" height="16px" />
                            Refresh All
                        </button>
                    </div>

                    {/* Line 2: Bulk Actions - Flex with wrap */}
                    <div style={{
                        display: "flex",
                        gap: "16px",
                        alignItems: "center",
                        flexWrap: "wrap"
                    }}>
                        <span style={{
                            fontSize: "14px",
                            fontWeight: "bold",
                            whiteSpace: "nowrap",
                            color: "#32324d"
                        }}>
                            Bulk Actions:
                        </span>

                        <div style={{
                            display: "flex",
                            gap: "8px",
                            alignItems: "center",
                            flexShrink: 0
                        }}>
                            <span style={{
                                fontSize: "14px",
                                whiteSpace: "nowrap",
                                color: "#666687"
                            }}>
                                Publish All:
                            </span>
                            <input
                                type="checkbox"
                                checked={bulkPublishState}
                                onChange={() => onBulkPublish(!bulkPublishState)}
                                style={{
                                    width: "16px",
                                    height: "16px",
                                    cursor: "pointer"
                                }}
                            />
                        </div>

                        <div style={{
                            display: "flex",
                            gap: "8px",
                            alignItems: "center",
                            flexShrink: 0
                        }}>
                            <span style={{
                                fontSize: "14px",
                                whiteSpace: "nowrap",
                                color: "#666687"
                            }}>
                                Set All:
                            </span>
                            <select
                                style={{
                                    minWidth: "140px",
                                    padding: "6px 8px",
                                    border: "1px solid #dcdce4",
                                    borderRadius: "4px",
                                    fontSize: "14px",
                                    backgroundColor: "white",
                                    cursor: "pointer"
                                }}
                                onChange={(e) => onBulkAccessTier(e.target.value)}
                                defaultValue=""
                            >
                                <option value="" disabled>Select tier</option>
                                <option value="Free">Free</option>
                                <option value="Login">Login Required</option>
                                <option value="Premium">Premium</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};