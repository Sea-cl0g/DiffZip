import React from 'react';
import { Tree } from 'antd';

const treeData = [
    {
        title: 'Files',
        key: '0',
        children: [
            { title: 'added.txt', key: '0-0' },
            { title: 'modified.txt', key: '0-1' },
            { title: 'deleted.txt', key: '0-2' },
        ],
    },
];

export default function FileTree({ onSelect }) {
    return (
        <Tree
            showLine
            defaultExpandedKeys={['0']}
            onSelect={onSelect}
            treeData={treeData}
        />
    );
}