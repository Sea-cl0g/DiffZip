import React, { useEffect, useState } from 'react';
import { Flex, Splitter, Typography, Layout } from 'antd';
import { buildZipDiffMetadata } from '../utils/zip/diffMetadata';
import { buildTreeData } from '../utils/treeBuilder';

import Tree from './FileTree';

const { Content, Sider } = Layout;

export const Desc = props => (
    <Flex justify="center" align="center" style={{ height: '100%' }}>
        <Typography.Title type="secondary" level={5} style={{ whiteSpace: 'nowrap' }}>
            {props.text}
        </Typography.Title>
    </Flex>
);

const contentStyle = {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    padding: '24px',
    overflow: 'hidden',
};

const layoutStyle = {
    flex: 1,
    minHeight: 0,
    background: '#ffffff',
    border: '1px solid #d9d9d9',
    borderRadius: '8px',
    margin: '16px',
    overflow: 'hidden',
};

const siderStyle = {
    ...contentStyle,
    borderLeft: '1px solid #d9d9d9',
    borderTopRightRadius: '8px',
    borderBottomRightRadius: '8px',
};

export default function DiffView({ files }) {
    const [treeData, setTreeData] = useState([]);

    useEffect(() => {
        const beforeZip = files?.file1;
        const afterZip = files?.file2;

        if (!beforeZip || !afterZip) {
            return;
        }

        let cancelled = false;

        (async () => {
            try {
                const result = await buildZipDiffMetadata(beforeZip, afterZip);
                if (!cancelled) {
                    const tree = buildTreeData(result.changes);
                    setTreeData(tree);
                }
            } catch (e) {
                console.error('Failed to build diff metadata:', e);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [files?.file1, files?.file2]);

    return (
        <div style={{ height: '100%', minHeight: 0 }}>
            <Splitter style={{ height: '100%', minHeight: 0, boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)' }}>
                <Splitter.Panel defaultSize="20%" min="20%" max="70%">
                    <Tree treeData={treeData} />
                </Splitter.Panel>
                <Splitter.Panel>
                    <Layout hasSider style={layoutStyle}>
                        <Content style={contentStyle}>
                            <p>test</p>
                        </Content>
                        <Sider theme="light" width="50%" style={siderStyle}>
                            <p>test</p>
                        </Sider>
                    </Layout>
                </Splitter.Panel>
            </Splitter>
        </div>
    );
}