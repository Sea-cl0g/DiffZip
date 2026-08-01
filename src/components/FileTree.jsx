import React, { useState } from 'react';
import { ProductOutlined, BarsOutlined } from '@ant-design/icons';
import { Tree, Tabs, Select, Flex } from 'antd';
import TreeMapView from './TreeMapView';

const comparisonTargetOptions = [
    {
        label: '差分',
        value: 'diff'
    },
    {
        label: '変更前のzip',
        value: 'left'
    },
    {
        label: '変更後のzip',
        value: 'right'
    },
];

const treeViewModeOptions = [
    {
        label: '差分',
        value: 'sub'
    },
    {
        label: 'フル',
        value: 'full'
    }
];

export default function FileTree({ treeData, onSelect, treeMode = 'diff', onTreeModeChange, treeLayoutVersion = 0 }) {
    const [treeView, setTabView] = useState('sub');
    const [activeTab, setActiveTab] = useState('1');

    const onTabChange = key => {
        setActiveTab(key);
    };

    const handleSelectChange = value => {
        if (typeof onTreeModeChange === 'function') {
            onTreeModeChange(value);
        }
    };

    const treeViewChange = value => {
        setTabView(value)
    };

    const tabItems = [
        {
            key: '1',
            label: 'ツリー表示',
            icon: <ProductOutlined />,
            children: <TreeMapView
                treeData={treeData}
                treeMode={treeMode}
                treeView={treeView}
                layoutVersion={treeLayoutVersion}
                onSelect={onSelect}
            />
        },
        {
            key: '2',
            label: 'ファイル表示',
            icon: <BarsOutlined />,
            children: <Tree
                showLine
                defaultExpandAll={true}
                onSelect={onSelect}
                treeData={treeData}
                titleRender={(node) => (
                    <span style={node.data?.status === 'deleted' ? { textDecoration: 'line-through', opacity: 0.5 } : undefined}>
                        {node.title}
                    </span>
                )}
            />
        }
    ];

    return (
        <div className="file-tree-root">
            <Flex className="file-tree-controls" gap="medium" justify="space-between">
                <Flex gap="small" align="center">
                    <p>選択:</p>
                    <Select
                        value={treeMode}
                        style={{ width: 140 }}
                        onChange={handleSelectChange}
                        options={comparisonTargetOptions}
                        size="small"
                    />
                </Flex>
                {treeMode === "diff" && activeTab === "1" ? <Flex gap="small" align="center">
                    <Select
                        value={treeView}
                        style={{ width: 100 }}
                        onChange={treeViewChange}
                        options={treeViewModeOptions}
                        size="small"
                    />
                </Flex> : null}
            </Flex>
            <Tabs className="file-tree-tabs" activeKey={activeTab} items={tabItems} onChange={onTabChange} />
        </div>
    );
}