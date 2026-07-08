import React from 'react';
import { InboxOutlined } from '@ant-design/icons';
import { Divider, Typography, Upload as AntUpload, Layout, Flex } from 'antd';
const { Title } = Typography;

const { Dragger } = AntUpload;

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
    height: '100%',
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

const uploadRootStyle = {
    height: '100%',
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
};

const panesRowStyle = {
    flex: 1,
    minHeight: 0,
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
        <div className="upload-pane" style={paneInnerStyle}>
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
        <div style={uploadRootStyle}>
            <Title level={3} style={{ textAlign: 'center' }}>同じ構造のzipファイルを2つアップロードしてください</Title>
            <Divider />
            <Flex style={panesRowStyle} gap={16}>
                <div style={contentStyle}>
                    <UploadPane title="変更前のzip" onFile={(f) => onFileChange('file1', f)} />
                </div>
                <div style={contentStyle}>
                    <UploadPane title="変更後のzip" onFile={(f) => onFileChange('file2', f)} />
                </div>
            </Flex>
        </div>
    );
}