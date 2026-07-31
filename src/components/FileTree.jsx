import React from 'react';
import { ProductOutlined, BarsOutlined } from '@ant-design/icons';
import { Tree, Tabs, Select, Flex } from 'antd';

const dropdownItems = [
    {
        label: '差分',
        key: 'diff'
    },
    {
        label: '変更前のzip',
        key: 'left'
    },
    {
        label: '変更後のzip',
        key: 'right'
    },
];

export default function FileTree({ treeData, onSelect, treeMode = 'diff', onTreeModeChange }) {
    const onChange = key => {
        console.log(key);
    };

    const handleSelectChange = value => {
        if (typeof onTreeModeChange === 'function') {
            onTreeModeChange(value);
        }
    };

    const tabItems = [
        {
            key: '1',
            label: 'ツリー表示',
            icon: <ProductOutlined />,
            children: <p>a</p>
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

    const selectOptions = dropdownItems.map(item => ({
        value: item.key,
        label: item.label,
    }));

    return (
        <>
            <Flex gap="medium" align="center" justify="space-between">
                <p style={{ margin: 0 }}>選択:</p>
                <Select
                    value={treeMode}
                    style={{ width: 160 }}
                    onChange={handleSelectChange}
                    options={selectOptions}
                />

            </Flex>
            <Tabs defaultActiveKey="1" items={tabItems} onChange={onChange} />
        </>
    );
}