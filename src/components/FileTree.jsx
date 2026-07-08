import React from 'react';
import { Tree } from 'antd';

export default function FileTree({ treeData, onSelect }) {
    function collectAllKeys(nodes) {
        const keys = [];
        for (const node of nodes) {
            keys.push(node.key);
            if (node.children?.length) {
                keys.push(...collectAllKeys(node.children));
            }
        }
        return keys;
    }

    return (
        <Tree
            showLine
            defaultExpandedKeys={collectAllKeys(treeData)}
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