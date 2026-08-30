import React, { useState } from 'react';
import { Select, Flex } from 'antd';
import TreeMapView from './TreeMapView';

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

export default function TreeMapPanel({ treeData, onSelect, selectedFilePath, treeMode = 'diff', treeLayoutVersion = 0 }) {
    const [treeView, setTreeView] = useState('sub');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
            {treeMode === 'diff' ? (
                <Flex gap="small" align="center" justify="flex-end">
                    <Select
                        value={treeView}
                        style={{ width: 100 }}
                        onChange={setTreeView}
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
                    selectedFilePath={selectedFilePath}
                />
            </div>
        </div>
    );
}
