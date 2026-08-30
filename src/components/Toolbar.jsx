import React, { useState } from 'react';
import { UploadOutlined } from '@ant-design/icons';
import { Upload, Button, Select, Flex, Typography } from 'antd';
const { Text } = Typography;

const targetOptions = [
    { label: 'Option 1', value: 'option1' },
    { label: 'Option 2', value: 'option2' },
    { label: 'Option 3', value: 'option3' },
];

function TargetSelect({ label }) {
    // 仮実装: App/Bodyへは未接続、選択値はこのコンポーネント内に保持するだけ
    const [value, setValue] = useState('option1');

    return (
        <Flex vertical gap="small" align="center">
            <Text>{label}</Text>
            <Select
                value={value}
                onChange={setValue}
                options={targetOptions}
                style={{ width: 140 }}
                size="small"
            />
        </Flex>
    );
}

export default function Toolbar() {
    // 仮実装: ファイル選択のみ行い、App/Bodyへは接続しない
    const [fileList, setFileList] = useState([]);

    const uploadProps = {
        fileList,
        beforeUpload() {
            return false;
        },
        onChange(info) {
            setFileList(info.fileList);
        },
    };

    return (
        <Flex justify="space-between" align="center">
            <Upload {...uploadProps}>
                <Button icon={<UploadOutlined />}>Click to Upload</Button>
            </Upload>
            <Flex gap="middle">
                <TargetSelect label="A" />
                <TargetSelect label="B" />
            </Flex>
        </Flex>
    );
}
