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

const FIXED_EXTENSION_COLORS = [
    '#1f77b4',
    '#ff7f0e',
    '#2ca02c',
    '#d62728',
    '#9467bd',
    '#17becf',
    '#8c564b',
    '#e377c2',
];

function getExtensionFromPath(path) {
    const fileName = String(path || '').split('/').pop() || '';
    const lastDotIndex = fileName.lastIndexOf('.');

    if (lastDotIndex <= 0 || lastDotIndex === fileName.length - 1) {
        return '(no ext)';
    }

    return fileName.slice(lastDotIndex).toLowerCase();
}

function hashToColor(text) {
    let hash = 0;
    for (let i = 0; i < text.length; i += 1) {
        hash = ((hash << 5) - hash) + text.charCodeAt(i);
        hash |= 0;
    }

    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 65%, 52%)`;
}

function collectFileNodes(sourceNode, out = []) {
    if (!sourceNode || typeof sourceNode !== 'object') {
        return out;
    }

    const children = Array.isArray(sourceNode.children) ? sourceNode.children : [];
    if (children.length === 0) {
        if (sourceNode.isFile) {
            out.push(sourceNode);
        }
        return out;
    }

    children.forEach((child) => collectFileNodes(child, out));
    return out;
}

function buildExtensionGroupedSource(fileNodes, hiddenExtensions, hiddenStatuses) {
    const groups = new Map();

    fileNodes.forEach((node) => {
        const extension = getExtensionFromPath(node.path);
        if (hiddenExtensions.has(extension)) {
            return;
        }

        const statusKey = node.status || 'default';
        if (hiddenStatuses.has(statusKey)) {
            return;
        }

        if (!groups.has(extension)) {
            groups.set(extension, []);
        }
        groups.get(extension).push(node);
    });

    if (groups.size === 0) {
        return null;
    }

    const children = [...groups.entries()].map(([extension, nodes]) => ({
        name: extension,
        path: extension,
        isFile: false,
        extension,
        children: nodes,
    }));

    return { name: 'root', path: '', isFile: false, children };
}

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
    const [hiddenExtensions, setHiddenExtensions] = useState(() => new Set());
    const [hiddenStatuses, setHiddenStatuses] = useState(() => new Set());

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

    const treemapSource = useMemo(() => {
        if (!Array.isArray(treeData) || treeData.length === 0) {
            return null;
        }

        return buildTreemapHierarchyData(treeData, { mode: treeMode, treeView });
    }, [treeData, treeMode, treeView]);

    const allFileNodes = useMemo(() => {
        if (!treemapSource) {
            return [];
        }

        return collectFileNodes(treemapSource, []);
    }, [treemapSource]);

    const preparedTreemap = useMemo(() => {
        const empty = { leaves: [], groups: [] };

        if (allFileNodes.length === 0 || size.width <= 0 || size.height <= 0) {
            return empty;
        }

        const groupedSource = buildExtensionGroupedSource(allFileNodes, hiddenExtensions, hiddenStatuses);
        if (!groupedSource) {
            return empty;
        }

        const root = hierarchy(groupedSource)
            .sum((node) => {
                if (!node.isFile) {
                    return 0;
                }
                const weight = Number.isFinite(node.weight) ? node.weight : 0;
                return weight > 0 ? weight : 0;
            })
            .sort((a, b) => b.value - a.value);

        // paddingOuter leaves a visible gap for the extension group border
        treemap()
            .size([size.width, size.height])
            .paddingInner(1)
            .paddingOuter(6)
            .round(true)(root);

        const groups = (root.children || []).filter((group) => (group.x1 - group.x0) > 0 && (group.y1 - group.y0) > 0);

        const leaves = root
            .leaves()
            .filter((leaf) => leaf.data?.isFile)
            .filter((leaf) => (leaf.x1 - leaf.x0) > 0 && (leaf.y1 - leaf.y0) > 0)
            .map((leaf) => ({
                leaf,
                extension: leaf.parent?.data?.extension || getExtensionFromPath(leaf.data?.path),
            }));

        return { leaves, groups };
    }, [allFileNodes, hiddenExtensions, hiddenStatuses, size.width, size.height]);

    useEffect(() => {
        const availableExtensions = new Set(allFileNodes.map((node) => getExtensionFromPath(node.path)));
        setHiddenExtensions((prev) => {
            const next = new Set([...prev].filter((ext) => availableExtensions.has(ext)));
            if (next.size === prev.size) {
                return prev;
            }
            return next;
        });
    }, [allFileNodes]);

    useEffect(() => {
        const availableStatuses = new Set(allFileNodes.map((node) => node.status || 'default'));
        setHiddenStatuses((prev) => {
            const next = new Set([...prev].filter((status) => availableStatuses.has(status)));
            if (next.size === prev.size) {
                return prev;
            }
            return next;
        });
    }, [allFileNodes]);

    const extensionColorMap = useMemo(() => {
        const extensions = [...new Set(allFileNodes.map((node) => getExtensionFromPath(node.path)))]
            .sort((a, b) => a.localeCompare(b));

        const map = new Map();
        extensions.forEach((extension, index) => {
            if (index < FIXED_EXTENSION_COLORS.length) {
                map.set(extension, FIXED_EXTENSION_COLORS[index]);
            } else {
                map.set(extension, hashToColor(extension));
            }
        });

        return map;
    }, [allFileNodes]);

    const extensionLegend = useMemo(() => {
        const stats = new Map();

        allFileNodes.forEach((node) => {
            const extension = getExtensionFromPath(node.path);
            const baseSize = Number.isFinite(node.baseSize) ? node.baseSize : 0;
            stats.set(extension, (stats.get(extension) || 0) + baseSize);
        });

        return [...stats.entries()]
            .map(([extension, totalSize]) => ({
                extension,
                totalSize,
                color: extensionColorMap.get(extension) || STATUS_COLORS.default,
            }))
            .sort((a, b) => b.totalSize - a.totalSize);
    }, [allFileNodes, extensionColorMap]);

    const statusLegend = useMemo(() => {
        const visibleForCount = allFileNodes.filter(
            (node) => !hiddenExtensions.has(getExtensionFromPath(node.path)),
        );

        const counts = new Map();
        visibleForCount.forEach((node) => {
            const statusKey = node.status || 'default';
            counts.set(statusKey, (counts.get(statusKey) || 0) + 1);
        });

        return Object.keys(STATUS_COLORS)
            .filter((statusKey) => counts.has(statusKey))
            .map((statusKey) => ({
                status: statusKey,
                count: counts.get(statusKey),
                color: STATUS_COLORS[statusKey],
            }));
    }, [allFileNodes, hiddenExtensions]);

    const { leaves, groups } = preparedTreemap;

    const toggleExtension = (extension) => {
        setHiddenExtensions((prev) => {
            const next = new Set(prev);
            if (next.has(extension)) {
                next.delete(extension);
            } else {
                next.add(extension);
            }
            return next;
        });
    };

    const toggleStatus = (status) => {
        setHiddenStatuses((prev) => {
            const next = new Set(prev);
            if (next.has(status)) {
                next.delete(status);
            } else {
                next.add(status);
            }
            return next;
        });
    };

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
                    {groups.map((group) => {
                        const width = Math.max(0, group.x1 - group.x0);
                        const height = Math.max(0, group.y1 - group.y0);
                        const extension = group.data?.extension;

                        return (
                            <rect
                                key={`group-${extension}`}
                                x={group.x0}
                                y={group.y0}
                                width={width}
                                height={height}
                                fill="none"
                                stroke={extensionColorMap.get(extension) || STATUS_COLORS.default}
                                strokeWidth="2"
                                pointerEvents="none"
                            />
                        );
                    })}
                    {leaves.map(({ leaf }) => {
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

            {extensionLegend.length > 0 ? (
                <div className="treemap-legend" aria-label="TreeMap extension legend">
                    {extensionLegend.map((item) => {
                        const isHidden = hiddenExtensions.has(item.extension);
                        return (
                            <button
                                key={item.extension}
                                type="button"
                                className={`treemap-legend-item${isHidden ? ' is-hidden' : ''}`}
                                onClick={() => toggleExtension(item.extension)}
                                title={`${item.extension} (${formatSize(item.totalSize)})`}
                            >
                                <span className="treemap-legend-swatch treemap-legend-swatch--line" style={{ backgroundColor: item.color }} aria-hidden="true" />
                                <span className="treemap-legend-label">{item.extension}</span>
                            </button>
                        );
                    })}
                </div>
            ) : null}

            {statusLegend.length > 0 ? (
                <div className="treemap-legend treemap-legend--vertical" aria-label="TreeMap status legend">
                    {statusLegend.map((item) => {
                        const isHidden = hiddenStatuses.has(item.status);
                        return (
                            <button
                                key={item.status}
                                type="button"
                                className={`treemap-legend-item${isHidden ? ' is-hidden' : ''}`}
                                onClick={() => toggleStatus(item.status)}
                                title={`${item.status} (${item.count}件)`}
                            >
                                <span className="treemap-legend-swatch" style={{ backgroundColor: item.color }} aria-hidden="true" />
                                <span className="treemap-legend-label">{`${item.status} (${item.count}件)`}</span>
                            </button>
                        );
                    })}
                </div>
            ) : null}
        </div>
    );
}
