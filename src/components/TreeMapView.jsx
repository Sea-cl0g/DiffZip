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
    return String(safeSize);
}

function formatLabel(nodeData, treeView) {
    const base = formatSize(nodeData.baseSize);
    if (treeView !== 'sub') {
        return base;
    }

    const delta = Number.isFinite(nodeData.delta) ? nodeData.delta : 0;
    const sign = delta > 0 ? '+' : '';
    return `${base}(${sign}${delta})`;
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
        const heightTmp = window.innerHeight //後で直す
        console.log(rect)
        setSize({
            width: Math.max(0, Math.floor(rect.width)),
            height: heightTmp * 1 / 2,
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
                        const showLabel = width >= 70 && height >= 20;
                        const label = formatLabel(data, treeView);

                        return (
                            <g key={data.path} transform={`translate(${leaf.x0}, ${leaf.y0})`}>
                                <title>{`${data.path}\n${label}`}</title>
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
                                        {label}
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
