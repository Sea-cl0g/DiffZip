import { UploadOutlined } from '@ant-design/icons';
import { Upload, Button, Select, Flex, Typography, message } from 'antd';
import { isZipFile } from '../utils/zip/isZipFile';
const { Text } = Typography;

function TargetSelect({ label, fileKey, uploadedFiles, selectedFile, onFileChange }) {
    const options = uploadedFiles.map(f => ({ label: f.name, value: f.name }));

    function handleChange(name) {
        const file = uploadedFiles.find(f => f.name === name) ?? null;
        onFileChange(fileKey, file);
    }

    return (
        <Flex vertical gap="none" align="left">
            <Text strong>{label}</Text>
            <Select
                value={selectedFile ? selectedFile.name : undefined}
                placeholder="ファイルを選択"
                onChange={handleChange}
                options={options}
                size="small"
            />
        </Flex>
    );
}

export default function Toolbar({ uploadedFiles = [], onUploadFile, files = {}, onFileChange }) {
    const [messageApi, contextHolder] = message.useMessage();
    const uploadProps = {
        showUploadList: false,
        accept: '.zip',
        async beforeUpload(file) {
            if (!await isZipFile(file)) {
                messageApi.error(`${file.name} は有効なzipファイルではありません`);
                return Upload.LIST_IGNORE;
            }
            onUploadFile(file);
            return false;
        },
    };

    return (
        <>
            {contextHolder}
            <Flex justify="space-between">
                <Flex
                    align="center"
                    gap="small"
                    onClick={() => window.location.reload()}
                    style={{ cursor: 'pointer' }}
                >
                    <img src="/favicon.svg" alt="" width={28} height={28} />
                    <h2 style={{ display: 'inline-block', margin: 0 }}>
                        DiffZip
                    </h2>
                </Flex>
                <Flex justify='flex-end' gap="middle" align="center">
                    <Flex gap="small">
                        <Text type="secondary">File1:</Text>
                        <TargetSelect
                            uploadedFiles={uploadedFiles}
                            selectedFile={files.file1}
                            onFileChange={onFileChange}
                        />
                    </Flex>
                    <Flex gap="small">
                        <Text type="secondary">File2:</Text>
                        <TargetSelect
                            uploadedFiles={uploadedFiles}
                            selectedFile={files.file2}
                            onFileChange={onFileChange}
                        />
                    </Flex>
                    <Upload {...uploadProps} multiple={true}>
                        <Button type="primary" icon={<UploadOutlined />}>アップロード</Button>
                    </Upload>
                </Flex>
            </Flex>
        </>
    );
}

