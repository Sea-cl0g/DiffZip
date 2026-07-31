import React, { Children } from 'react';
import { Tree, Tabs } from 'antd';

export default function FileTree({ treeData, onSelect }) {
    const onChange = key => {
        console.log(key);
    };

    const items = [
        {
            key: '1',
            label: 'ツリー表示',
            children: <p>a</p>
        },
        {
            key: '2',
            label: 'ファイル表示',
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
        <>
            <Tabs defaultActiveKey="1" items={items} onChange={onChange} />
        </>
    );
}