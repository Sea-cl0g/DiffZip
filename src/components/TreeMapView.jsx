import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Typography } from 'antd';
import { hierarchy, treemap } from 'd3-hierarchy';
import { buildTreemapHierarchyData } from '../utils/treeBuilder';

const STATUS_COLORS = {
    default: '#4f6d7a',
};

const ADDED_COLOR = '#0a9d3f';
const DELETED_COLOR = '#e2231a';
const UNCHANGED_COLOR = '#8a8a8a';
const UNSIZED_COLOR = '#e0b400';

// gray -> green, mild to strong, 5 buckets for size-increase modified files
const INCREASE_COLORS = ['#9fc79f', '#7ab97a', '#55ab55', '#2f9d2f', '#0a8f0a'];
// gray -> red, mild to strong, 5 buckets for size-decrease modified files
const DECREASE_COLORS = ['#d3a3a3', '#c67d7d', '#b95757', '#ac3232', '#9f0c0c'];

const INCREASE_GRADIENT = `linear-gradient(to right, ${INCREASE_COLORS.join(', ')})`;
const DECREASE_GRADIENT = `linear-gradient(to right, ${DECREASE_COLORS.join(', ')})`;

const CHANGE_RATE_THRESHOLDS = [0.2, 0.4, 0.6, 0.8];

const CHANGE_CATEGORY_LABELS = {
    added: '追加',
    increase: '増加',
    decrease: '減少',
    deleted: '削除',
    unsized: '内容変更',
    unchanged: '変更なし',
    default: 'その他',
};

const CHANGE_CATEGORY_ORDER = ['added', 'increase', 'decrease', 'deleted', 'unsized', 'unchanged', 'default'];

const FIXED_EXTENSION_COLORS = [
    '#1f77b4',
    '#ff7f0e',
    '#9467bd',
    '#17becf',
    '#8c564b',
    '#e377c2',
    '#00a6d6',
    '#6a3d9a',
    '#7570b3',
    '#e6ab02',
    '#003f8c',
    '#2f5aa8',
    '#4a78c2',
    '#5b3c9e',
    '#7b52ab',
    '#a06fc7',
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

        const categoryKey = getChangeCategory(node);
        if (hiddenStatuses.has(categoryKey)) {
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

function formatTileLabel(nodeData) {
    const category = getChangeCategory(nodeData);
    const sizeText = formatSize(nodeData.baseSize);
    const delta = Number.isFinite(nodeData.delta) ? nodeData.delta : 0;
    return `[${category}] ${sizeText}(${formatDelta(delta)})`;
}

function buildExtensionSummary(extension, fileNodes) {
    const totalSize = fileNodes.reduce(
        (sum, node) => sum + (Number.isFinite(node.baseSize) ? node.baseSize : 0),
        0,
    );

    return `${extension}\n${fileNodes.length}ファイル(${formatSize(totalSize)})`;
}

function getChangeLevel(rateAbs) {
    for (let i = 0; i < CHANGE_RATE_THRESHOLDS.length; i += 1) {
        if (rateAbs < CHANGE_RATE_THRESHOLDS[i]) {
            return i;
        }
    }
    return CHANGE_RATE_THRESHOLDS.length;
}

// derives a display category distinct from the raw diff status (splits modified into increase/decrease/unsized)
function getChangeCategory(nodeData) {
    const status = nodeData.status;

    if (status === 'added') {
        return 'added';
    }
    if (status === 'deleted') {
        return 'deleted';
    }
    if (status === 'unchanged') {
        return 'unchanged';
    }
    if (status === 'modified') {
        const delta = Number.isFinite(nodeData.delta) ? nodeData.delta : 0;
        if (delta === 0) {
            return 'unsized';
        }
        return delta > 0 ? 'increase' : 'decrease';
    }

    return 'default';
}

function getCategorySwatchStyle(categoryKey) {
    if (categoryKey === 'increase') {
        return { backgroundImage: INCREASE_GRADIENT };
    }
    if (categoryKey === 'decrease') {
        return { backgroundImage: DECREASE_GRADIENT };
    }

    const flatColors = {
        added: ADDED_COLOR,
        deleted: DELETED_COLOR,
        unchanged: UNCHANGED_COLOR,
        unsized: UNSIZED_COLOR,
        default: STATUS_COLORS.default,
    };

    return { backgroundColor: flatColors[categoryKey] || STATUS_COLORS.default };
}

function pickNodeColor(nodeData) {
    const category = getChangeCategory(nodeData);

    switch (category) {
        case 'added':
            return ADDED_COLOR;
        case 'deleted':
            return DELETED_COLOR;
        case 'unchanged':
            return UNCHANGED_COLOR;
        case 'unsized':
            return UNSIZED_COLOR;
        case 'increase': {
            const rate = Number.isFinite(nodeData.rate) ? nodeData.rate : 0;
            return INCREASE_COLORS[getChangeLevel(rate)];
        }
        case 'decrease': {
            const rate = Number.isFinite(nodeData.rate) ? nodeData.rate : 0;
            return DECREASE_COLORS[getChangeLevel(Math.abs(rate))];
        }
        default:
            return STATUS_COLORS.default;
    }
}

export default function TreeMapView({ treeData, treeMode, treeView, layoutVersion = 0, onSelect, selectedFilePath }) {
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
            height: heightTmp * 3 / 5,
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
        const availableStatuses = new Set(allFileNodes.map((node) => getChangeCategory(node)));
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
        const filesByExtension = new Map();

        allFileNodes.forEach((node) => {
            if (hiddenStatuses.has(getChangeCategory(node))) {
                return;
            }

            const extension = getExtensionFromPath(node.path);
            if (!filesByExtension.has(extension)) {
                filesByExtension.set(extension, []);
            }
            filesByExtension.get(extension).push(node);
        });

        return [...filesByExtension.entries()]
            .map(([extension, fileNodes]) => ({
                extension,
                totalSize: fileNodes.reduce(
                    (sum, node) => sum + (Number.isFinite(node.baseSize) ? node.baseSize : 0),
                    0,
                ),
                color: extensionColorMap.get(extension) || STATUS_COLORS.default,
                summary: buildExtensionSummary(extension, fileNodes),
            }))
            .sort((a, b) => b.totalSize - a.totalSize);
    }, [allFileNodes, extensionColorMap, hiddenStatuses]);

    const extensionSummaryMap = useMemo(
        () => new Map(extensionLegend.map((item) => [item.extension, item.summary])),
        [extensionLegend],
    );

    const statusLegend = useMemo(() => {
        const visibleForCount = allFileNodes.filter(
            (node) => !hiddenExtensions.has(getExtensionFromPath(node.path)),
        );

        const counts = new Map();
        visibleForCount.forEach((node) => {
            const categoryKey = getChangeCategory(node);
            counts.set(categoryKey, (counts.get(categoryKey) || 0) + 1);
        });

        return CHANGE_CATEGORY_ORDER
            .filter((categoryKey) => counts.has(categoryKey))
            .map((categoryKey) => ({
                status: categoryKey,
                label: CHANGE_CATEGORY_LABELS[categoryKey] || categoryKey,
                count: counts.get(categoryKey),
                swatchStyle: getCategorySwatchStyle(categoryKey),
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
                                fill={extensionColorMap.get(extension) || STATUS_COLORS.default}
                                stroke="none"
                                strokeWidth="0"
                            >
                                <title>{extensionSummaryMap.get(extension)}</title>
                            </rect>
                        );
                    })}
                    {leaves.map(({ leaf }) => {
                        const width = Math.max(0, leaf.x1 - leaf.x0);
                        const height = Math.max(0, leaf.y1 - leaf.y0);
                        const data = leaf.data;
                        const color = pickNodeColor(data);
                        const isSelected = data.path === selectedFilePath;
                        const showLabel = width >= 90 && height >= 28;
                        const showNameLabel = width >= 90 && height >= 42;
                        const label = formatTileLabel(data);
                        const fileName = data.name || data.path;

                        return (
                            <g key={data.path} transform={`translate(${leaf.x0}, ${leaf.y0})`}>
                                <title>{`${fileName}\n${data.path}\n${label}`}</title>
                                <rect
                                    width={width}
                                    height={height}
                                    fill={color}
                                    stroke={isSelected ? '#1677ff' : '#ffffff'}
                                    strokeWidth={isSelected ? '3' : '1'}
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
                    {/* 選択中のノードを最前面に重畳描画して枠線が隣接ノードに隠れないようにする */}
                    {(() => {
                        const selectedObj = leaves.find(({ leaf }) => leaf.data?.path === selectedFilePath);
                        if (!selectedObj) return null;
                        const { leaf } = selectedObj;
                        const width = Math.max(0, leaf.x1 - leaf.x0);
                        const height = Math.max(0, leaf.y1 - leaf.y0);
                        const data = leaf.data;
                        const color = pickNodeColor(data);
                        const showLabel = width >= 90 && height >= 28;
                        const showNameLabel = width >= 90 && height >= 42;
                        const label = formatTileLabel(data);
                        const fileName = data.name || data.path;

                        return (
                            <g transform={`translate(${leaf.x0}, ${leaf.y0})`} style={{ pointerEvents: 'none' }}>
                                <rect
                                    width={width}
                                    height={height}
                                    fill={color}
                                    stroke="#1677ff"
                                    strokeWidth="3"
                                />
                                {showLabel ? (
                                    <text x="4" y="14" fill="#ffffff" fontSize="11">
                                        {showNameLabel ? (
                                            <tspan x="4" dy="0">{fileName}</tspan>
                                        ) : null}
                                        <tspan x="4" dy={showNameLabel ? '1.2em' : '0'}>{label}</tspan>
                                    </text>
                                ) : null}
                            </g>
                        );
                    })()}
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
                                title={item.summary}
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
                                title={`${item.label} (${item.count}ファイル)`}
                            >
                                <span className="treemap-legend-swatch" style={item.swatchStyle} aria-hidden="true" />
                                <span className="treemap-legend-label">{`${item.label} (${item.count}ファイル)`}</span>
                            </button>
                        );
                    })}
                </div>
            ) : null}
        </div>
    );
}
