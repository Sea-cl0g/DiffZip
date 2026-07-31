import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Typography } from 'antd';
import { hierarchy, treemap } from 'd3-hierarchy';
import { buildTreemapHierarchyData } from '../utils/treeBuilder';

const STATUS_COLORS = {
    added: '#3aa655',
    deleted: '#d64545',
    modified: '#da8b00',
    unchanged: '#8a8a8a',
    default: '#4f6d7a',
};

function formatSize(size) {
    const safeSize = Number.isFinite(size) ? size : 0;
    if (safeSize < 1024) {
        return `${safeSize} B`;
    }

    const units = ['KB', 'MB', 'GB', 'TB'];
    let value = safeSize / 1024;
    let unitIndex = 0;

    while (value >= 1024 && unitIndex < units.length - 1) {
        value /= 1024;
        unitIndex += 1;
    }

    const rounded = value >= 100 ? value.toFixed(0) : value.toFixed(1);
    return `${rounded} ${units[unitIndex]}`;
}

function formatDelta(delta) {
    const safeDelta = Number.isFinite(delta) ? delta : 0;
    const sign = safeDelta > 0 ? '+' : '';
    return `${sign}${formatSize(Math.abs(safeDelta))}`;
}

function formatLabel(nodeData, treeView) {
    const base = formatSize(nodeData.baseSize);
    if (treeView !== 'sub') {
        return base;
    }

    const delta = Number.isFinite(nodeData.delta) ? nodeData.delta : 0;
    return `${base} (${formatDelta(delta)})`;
}

function pickNodeColor(nodeData, treeView) {
    if (treeView === 'sub' && Number.isFinite(nodeData.delta)) {
        if (nodeData.delta > 0) {
            return STATUS_COLORS.added;
        }
        if (nodeData.delta < 0) {
            return STATUS_COLORS.deleted;
        }
    }

    return STATUS_COLORS[nodeData.status] || STATUS_COLORS.default;
}

export default function TreeMapView({ treeData, treeMode, treeView, layoutVersion = 0, onSelect }) {
    const containerRef = useRef(null);
    const [size, setSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        const element = containerRef.current;
        if (!element) {
            return;
        }

        const rect = element.getBoundingClientRect();
        setSize({
            width: Math.max(0, Math.floor(rect.width)),
            height: Math.max(0, Math.floor(rect.height)),
        });
    }, [layoutVersion, treeData, treeMode, treeView]);

    const leaves = useMemo(() => {
        if (!Array.isArray(treeData) || treeData.length === 0) {
            return [];
        }

        if (size.width <= 0 || size.height <= 0) {
            return [];
        }

        const source = buildTreemapHierarchyData(treeData, { mode: treeMode, treeView });
        const root = hierarchy(source)
            .sum((node) => {
                if (!node.isFile) {
                    return 0;
                }
                const weight = Number.isFinite(node.weight) ? node.weight : 0;
                return weight > 0 ? weight : 0;
            })
            .sort((a, b) => b.value - a.value);

        treemap()
            .size([size.width, size.height])
            .paddingInner(1)
            .paddingOuter(0)
            .round(true)(root);

        return root
            .leaves()
            .filter((leaf) => leaf.data?.isFile)
            .filter((leaf) => (leaf.x1 - leaf.x0) > 0 && (leaf.y1 - leaf.y0) > 0);
    }, [treeData, treeMode, treeView, size.width, size.height]);

    const handleLeafClick = (leaf) => {
        if (typeof onSelect !== 'function') {
            return;
        }

        onSelect([], {
            node: {
                data: leaf.data.data,
            },
        });
    };

    return (
        <div className="treemap-wrapper" ref={containerRef}>
            {leaves.length === 0 ? (
                <div className="treemap-empty">
                    <Typography.Text type="secondary">表示できるデータがありません</Typography.Text>
                </div>
            ) : (
                <svg className="treemap-svg" width={size.width} height={size.height} role="img" aria-label="TreeMap">
                    {leaves.map((leaf) => {
                        const width = Math.max(0, leaf.x1 - leaf.x0);
                        const height = Math.max(0, leaf.y1 - leaf.y0);
                        const data = leaf.data;
                        const color = pickNodeColor(data, treeView);
                        const showLabel = width >= 90 && height >= 28;
                        const showNameLabel = width >= 90 && height >= 42;
                        const label = formatLabel(data, treeView);
                        const fileName = data.name || data.path;

                        return (
                            <g key={data.path} transform={`translate(${leaf.x0}, ${leaf.y0})`}>
                                <title>{`${fileName}\n${data.path}\n${label}`}</title>
                                <rect
                                    width={width}
                                    height={height}
                                    fill={color}
                                    stroke="#ffffff"
                                    strokeWidth="1"
                                    onClick={() => handleLeafClick(leaf)}
                                    style={{ cursor: 'pointer' }}
                                />
                                {showLabel ? (
                                    <text x="4" y="14" fill="#ffffff" fontSize="11" pointerEvents="none">
                                        {showNameLabel ? (
                                            <tspan x="4" dy="0">{fileName}</tspan>
                                        ) : null}
                                        <tspan x="4" dy={showNameLabel ? '1.2em' : '0'}>{label}</tspan>
                                    </text>
                                ) : null}
                            </g>
                        );
                    })}
                </svg>
            )}
        </div>
    );
}
