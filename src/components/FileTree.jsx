import React from 'react';
import { ProductOutlined, BarsOutlined, DownOutlined } from '@ant-design/icons';
import { Tree, Tabs, Select, Flex } from 'antd';

const dropdownItems = [
    {
        label: '1st menu item',
        key: '1'
    },
    {
        label: '2nd menu item',
        key: '2'
    }
];

export default function FileTree({ treeData, onSelect }) {
    const onChange = key => {
        console.log(key);
    };

    const handleSelectChange = value => {
        console.log('selected', value);
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
            <Flex gap="medium" align="center" justify="flex-end">
                <p style={{ margin: 0 }}>選択:</p>
                <Select
                    defaultValue="1"
                    style={{ width: 160 }}
                    onChange={handleSelectChange}
                    options={selectOptions}
                />

            </Flex>
            <Tabs defaultActiveKey="1" items={tabItems} onChange={onChange} />
        </>
    );
}