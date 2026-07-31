import React from 'react';
import { ProductOutlined, BarsOutlined, DownOutlined } from '@ant-design/icons';
import { Tree, Tabs, Dropdown, Space, Flex } from 'antd';

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


    const handleButtonClick = e => {
        console.log('click', e);
    };
    const menuProps = {
        items: dropdownItems,
        onClick: handleButtonClick,
    };

    return (
        <>
            <Flex gap="medium" align="end" vertical>
                <Dropdown menu={menuProps}>
                    <Space>
                        Hover me
                        <DownOutlined />
                    </Space>
                </Dropdown>

            </Flex>
            <Tabs defaultActiveKey="1" items={tabItems} onChange={onChange} />
        </>
    );
}