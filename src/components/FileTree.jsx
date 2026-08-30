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
        label: '変更量',
        value: 'sub'
    },
    {
        label: '実サイズ',
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
            children: (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
                    {treeMode === 'diff' ? (
                        <Flex gap="small" align="center" justify="flex-end">
                            <Select
                                value={treeView}
                                style={{ width: 100 }}
                                onChange={treeViewChange}
                                options={treeViewModeOptions}
                                size="small"
                            />
                        </Flex>
                    ) : null}
                    <div style={{ flex: 1, minHeight: 0 }}>
                        <TreeMapView
                            treeData={treeData}
                            treeMode={treeMode}
                            treeView={treeView}
                            layoutVersion={treeLayoutVersion}
                            onSelect={onSelect}
                        />
                    </div>
                </div>
            )
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
            <Tabs className="file-tree-tabs" activeKey={activeTab} items={tabItems} onChange={onTabChange} />
        </div>
    );
}