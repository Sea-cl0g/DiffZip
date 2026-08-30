import React from 'react';
import { Tree } from 'antd';

export default function FileTree({ treeData, onSelect, selectedKeys }) {
    return (
        <div className="file-tree-root">
            <Tree
                showLine
                defaultExpandAll={true}
                onSelect={onSelect}
                selectedKeys={selectedKeys}
                treeData={treeData}
                titleRender={(node) => (
                    <span style={node.data?.status === 'deleted' ? { textDecoration: 'line-through', opacity: 0.5 } : undefined}>
                        {node.title}
                    </span>
                )}
            />
        </div>
    );
}
