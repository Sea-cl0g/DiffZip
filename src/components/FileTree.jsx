import React from 'react';
import { Tree } from 'antd';

export default function FileTree({ treeData, onSelect }) {
    return (
        <Tree
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
    );
}