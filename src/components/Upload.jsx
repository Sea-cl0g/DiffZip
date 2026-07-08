import React from 'react';
import { InboxOutlined } from '@ant-design/icons';
import { Divider, Typography, Upload as AntUpload, Layout } from 'antd';
const { Title } = Typography;

const { Dragger } = AntUpload;
const { Content, Sider } = Layout;

const contentStyle = {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    padding: '24px',
    backgroundColor: '#ffffff',
    border: '1px solid #d9d9d9',
    borderRadius: '8px',
    overflow: 'hidden',
};

const draggerStyle = {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
};

const paneInnerStyle = {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
};

function UploadPane({ title, onFile }) {
    const props = {
        name: 'file',
        multiple: false,
        maxCount: 1,
        beforeUpload(file) {
            onFile(file);
            return false;
        },
        onRemove() {
            onFile(null);
        },
    };

    return (
        <div style={paneInnerStyle}>
            <Title level={4}>{title}</Title>
            <Dragger {...props} style={draggerStyle}>
                <p className="ant-upload-drag-icon">
                    <InboxOutlined />
                </p>
                <p className="ant-upload-text">Click or drag file to this area to select files</p>
            </Dragger>
        </div>
    );
}

export default function Upload({ onFileChange }) {
    return (
        <div className="main-content">
            <Title level={3}>ZIPファイルを選択</Title>
            <Divider />
            <Layout hasSider style={{ flex: 1, minHeight: 0, gap: '16px', background: 'transparent' }}>
                <Content style={contentStyle}>
                    <UploadPane title="変更前のzip" onFile={(f) => onFileChange('file1', f)} />
                </Content>
                <Sider theme="light" width="50%" style={contentStyle}>
                    <UploadPane title="変更後のzip" onFile={(f) => onFileChange('file2', f)} />
                </Sider>
            </Layout>
        </div>
    );
}