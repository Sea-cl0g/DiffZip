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

    console.log(treeData)

    return (
        <Tree
            showLine
            defaultExpandedKeys={collectAllKeys(treeData)}
            onSelect={onSelect}
            treeData={treeData}
        />
    );
}