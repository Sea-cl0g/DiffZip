import React from 'react';
import { UploadOutlined } from '@ant-design/icons';
import { Upload, Button, Select, Flex, Typography } from 'antd';
const { Text } = Typography;

function TargetSelect({ label, fileKey, uploadedFiles, selectedFile, onFileChange }) {
    const options = uploadedFiles.map(f => ({ label: f.name, value: f.name }));

    function handleChange(name) {
        const file = uploadedFiles.find(f => f.name === name) ?? null;
        onFileChange(fileKey, file);
    }

    return (
        <Flex vertical gap="none" align="center">
            <Text>{label}</Text>
            <Select
                value={selectedFile ? selectedFile.name : undefined}
                placeholder="ファイルを選択"
                onChange={handleChange}
                options={options}
                style={{ width: 140 }}
                size="small"
            />
        </Flex>
    );
}

export default function Toolbar({ uploadedFiles = [], onUploadFile, files = {}, onFileChange }) {
    const uploadProps = {
        showUploadList: false,
        beforeUpload(file) {
            onUploadFile(file);
            return false;
        },
    };

    return (
        <Flex justify="space-between" align="center">
            <Upload {...uploadProps}>
                <Button icon={<UploadOutlined />}>Click to Upload</Button>
            </Upload>
            <Flex gap="middle">
                <TargetSelect
                    label="File1"
                    fileKey="file1"
                    uploadedFiles={uploadedFiles}
                    selectedFile={files.file1}
                    onFileChange={onFileChange}
                />
                <TargetSelect
                    label="File2"
                    fileKey="file2"
                    uploadedFiles={uploadedFiles}
                    selectedFile={files.file2}
                    onFileChange={onFileChange}
                />
            </Flex>
        </Flex>
    );
}

