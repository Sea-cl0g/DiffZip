import { useCallback, useEffect, useRef, useState } from 'react';
import { FileZipOutlined, InboxOutlined } from '@ant-design/icons';
import { Flex, Result, Splitter, Typography, Upload, message } from 'antd';
import { unzip } from 'unzipit';
import { createPatch } from 'diff';
import { html } from 'diff2html';
import 'diff2html/bundles/css/diff2html.min.css';
import { buildZipDiffMetadata } from '../utils/zip/diffMetadata';
import { buildTreeData } from '../utils/treeBuilder';
import DiffImage from './DiffImage';
import Tree from './FileTree';
import TreeMapPanel from './TreeMapPanel';
import { isZipFile } from '../utils/zip/isZipFile';

const TREE_MODE = {
    DIFF: 'diff',
    LEFT: 'left',
    RIGHT: 'right',
};

const SAMPLE_ZIP_URLS = {
    before: 'https://drive.google.com/uc?export=download&id=1X0H9CL0eljnyoDmfDauacPt5uK7DvsHv',
    after: 'https://drive.google.com/uc?export=download&id=1jfcFdHuqySXEh_vzRaMcWJumW2Toxru2',
};

const IMAGE_EXTENSION_TO_MIME = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.bmp': 'image/bmp',
    '.svg': 'image/svg+xml',
};

function getImageMimeTypeFromPath(path) {
    if (!path) {
        return null;
    }

    const lowerPath = String(path).toLowerCase();
    for (const [extension, mimeType] of Object.entries(IMAGE_EXTENSION_TO_MIME)) {
        if (lowerPath.endsWith(extension)) {
            return mimeType;
        }
    }

    return null;
}

function escapeHtml(text) {
    return String(text || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function buildPlainFileHtml(filePath, fileText) {
    const safePath = escapeHtml(filePath);
    const safeText = escapeHtml(fileText);

    return `
        <div class="d2h-wrapper">
            <div class="d2h-file-wrapper">
                <div class="d2h-file-header">
                    <span class="d2h-file-name-wrapper">
                        <span class="d2h-file-name">${safePath}</span>
                    </span>
                </div>
                <div class="d2h-file-diff">
                    <pre style="margin:0;padding:12px;white-space:pre;overflow:auto;">${safeText}</pre>
                </div>
            </div>
        </div>`;
}

export default function DiffView({ files, onUploadFile }) {
    const [messageApi, contextHolder] = message.useMessage();
    const [treeData, setTreeData] = useState([]);
    const [diffMetadata, setDiffMetadata] = useState(null);
    const [treeMode, setTreeMode] = useState(TREE_MODE.DIFF);
    const [isTreeReady, setIsTreeReady] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [diffHtml, setDiffHtml] = useState('');
    const [imageCompareUrls, setImageCompareUrls] = useState(null);
    const [treeLayoutVersion, setTreeLayoutVersion] = useState(0);
    const imageBlobUrlsRef = useRef({ before: null, after: null });

    const revokeImageBlobUrls = useCallback(() => {
        if (imageBlobUrlsRef.current.before) {
            URL.revokeObjectURL(imageBlobUrlsRef.current.before);
            imageBlobUrlsRef.current.before = null;
        }

        if (imageBlobUrlsRef.current.after) {
            URL.revokeObjectURL(imageBlobUrlsRef.current.after);
            imageBlobUrlsRef.current.after = null;
        }
    }, []);

    useEffect(() => () => {
        revokeImageBlobUrls();
    }, [revokeImageBlobUrls]);

    useEffect(() => {
        const beforeZip = files?.file1;
        const afterZip = files?.file2;

        if (!beforeZip || !afterZip) {
            setTreeData([]);
            setDiffMetadata(null);
            setTreeMode(TREE_MODE.DIFF);
            setIsTreeReady(false);
            setSelectedFile(null);
            return;
        }

        let cancelled = false;
        setIsTreeReady(false);
        setDiffMetadata(null);
        setSelectedFile(null);

        (async () => {
            try {
                const result = await buildZipDiffMetadata(beforeZip, afterZip);
                if (!cancelled) {
                    setDiffMetadata(result);
                    setTreeMode(TREE_MODE.DIFF);
                    setIsTreeReady(true);
                }
            } catch (e) {
                console.error('Failed to build diff metadata:', e);
                if (!cancelled) {
                    setTreeData([]);
                    setDiffMetadata(null);
                    setIsTreeReady(true);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [files?.file1, files?.file2]);

    useEffect(() => {
        if (!diffMetadata) {
            setTreeData([]);
            return;
        }

        setTreeData(buildTreeData(diffMetadata, { mode: treeMode }));
        setSelectedFile(null);
    }, [treeMode, diffMetadata]);

    useEffect(() => {
        if (!selectedFile) {
            revokeImageBlobUrls();
            setDiffHtml('');
            setImageCompareUrls(null);
            return;
        }

        const displayPath = selectedFile.path;
        const status = selectedFile.status || (treeMode === TREE_MODE.LEFT ? 'deleted' : treeMode === TREE_MODE.RIGHT ? 'added' : null);
        const beforeZipPath = selectedFile.left?.zipPath;
        const afterZipPath = selectedFile.right?.zipPath;
        const imageMimeType = getImageMimeTypeFromPath(afterZipPath || beforeZipPath || displayPath);

        let cancelled = false;

        (async () => {
            try {
                revokeImageBlobUrls();

                if (imageMimeType) {
                    let beforeUrl = null;
                    let afterUrl = null;

                    if ((status === 'deleted' || status === 'modified') && beforeZipPath) {
                        const beforeZipInfo = await unzip(files.file1);
                        const beforeEntry = beforeZipInfo.entries[beforeZipPath];
                        if (beforeEntry) {
                            const beforeBlob = await beforeEntry.blob(imageMimeType);
                            imageBlobUrlsRef.current.before = URL.createObjectURL(beforeBlob);
                            console.log('[before]', imageBlobUrlsRef.current.before);
                            beforeUrl = imageBlobUrlsRef.current.before;
                        }
                    }

                    if ((status === 'added' || status === 'modified') && afterZipPath) {
                        const afterZipInfo = await unzip(files.file2);
                        const afterEntry = afterZipInfo.entries[afterZipPath];
                        if (afterEntry) {
                            const afterBlob = await afterEntry.blob(imageMimeType);
                            imageBlobUrlsRef.current.after = URL.createObjectURL(afterBlob);
                            console.log('[after]', imageBlobUrlsRef.current.after);
                            afterUrl = imageBlobUrlsRef.current.after;
                        }
                    }

                    if (!cancelled) {
                        setDiffHtml('');
                        setImageCompareUrls({ before: beforeUrl, after: afterUrl });
                    }

                    return;
                }

                if (!cancelled) {
                    setImageCompareUrls(null);
                }

                if (treeMode === TREE_MODE.LEFT || treeMode === TREE_MODE.RIGHT) {
                    const targetZipFile = treeMode === TREE_MODE.LEFT ? files.file1 : files.file2;
                    const targetZipPath = treeMode === TREE_MODE.LEFT ? beforeZipPath : afterZipPath;
                    let fileText = '';

                    if (targetZipFile && targetZipPath) {
                        const targetZipInfo = await unzip(targetZipFile);
                        const targetEntry = targetZipInfo.entries[targetZipPath];
                        if (targetEntry) {
                            fileText = await targetEntry.text();
                        }
                    }

                    if (!cancelled) {
                        setDiffHtml(buildPlainFileHtml(displayPath, fileText));
                    }

                    return;
                }

                let beforeText = '';
                let afterText = '';

                if ((status === 'deleted' || status === 'modified') && beforeZipPath) {
                    const beforeZipInfo = await unzip(files.file1);
                    const beforeEntry = beforeZipInfo.entries[beforeZipPath];
                    if (beforeEntry) {
                        beforeText = await beforeEntry.text();
                    }
                }

                if ((status === 'added' || status === 'modified') && afterZipPath) {
                    const afterZipInfo = await unzip(files.file2);
                    const afterEntry = afterZipInfo.entries[afterZipPath];
                    if (afterEntry) {
                        afterText = await afterEntry.text();
                    }
                }

                if (!cancelled) {
                    const diffPatch = createPatch(
                        displayPath,
                        beforeText,
                        afterText,
                    );

                    const diffHtmlOutput = html(diffPatch, {
                        drawFileList: false,
                        matching: 'lines',
                        outputFormat: 'side-by-side',
                    });

                    setDiffHtml(diffHtmlOutput);
                }
            } catch (e) {
                console.error('Failed to read file text:', e);
            }
        })();

        return () => {
            cancelled = true;
            revokeImageBlobUrls();
        };
    }, [selectedFile, treeMode, files?.file1, files?.file2, revokeImageBlobUrls]);

    function handleTreeModeChange(nextMode) {
        setTreeMode(nextMode);
    }

    function handleTreeSelect(_, { node }) {
        if (node.data !== null && node.data !== undefined) {
            if (node.data?.isFile) {
                setSelectedFile(node.data);
            }
        }
    }

    function handleSplitterResizeEnd() {
        setTreeLayoutVersion((prev) => prev + 1);
    }

    const hasComparisonFiles = Boolean(files?.file1 && files?.file2);
    const isCentralEmptyState = !hasComparisonFiles
        || (!imageCompareUrls?.before && !imageCompareUrls?.after && !diffHtml);
    const uploadProps = {
        showUploadList: false,
        multiple: true,
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
        <div style={{ flex: 1, minHeight: 0 }}>
            {contextHolder}
            <Splitter
                className={`diff-splitter${hasComparisonFiles ? '' : ' diff-splitter--awaiting-files'}`}
                onResizeEnd={handleSplitterResizeEnd}
                style={{ height: '100%', minHeight: 0, boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)', backgroundColor: '#ffffff' }}
            >
                <Splitter.Panel defaultSize="30%">
                    <div className="diff-panel">
                        {isTreeReady ? (
                            <Tree
                                treeData={treeData}
                                onSelect={handleTreeSelect}
                                selectedKeys={selectedFile ? [selectedFile.path] : []}
                            />
                        ) : <></>}
                    </div>
                </Splitter.Panel>
                <Splitter.Panel>
                    <div className={`diff-panel${isCentralEmptyState ? ' diff-panel--empty-state' : ''}`}>
                        {!hasComparisonFiles ? (
                            <div className="central-empty-state">
                                <Upload.Dragger {...uploadProps} className="central-uploader">
                                    <p className="ant-upload-drag-icon">
                                        <InboxOutlined />
                                    </p>
                                    <p className="ant-upload-text">
                                        <span>クリックまたはドラッグして</span>
                                        <span>ファイルをアップロード</span>
                                    </p>
                                    <p className="ant-upload-hint">
                                        比較するzipファイルを2つ以上アップロードしてください。
                                    </p>
                                </Upload.Dragger>
                                <Flex vertical align="center" gap={4} className="sample-code-links">
                                    <Typography.Text type="secondary">サンプルコードで試す</Typography.Text>
                                    <Flex gap="middle">
                                        <Typography.Link href={SAMPLE_ZIP_URLS.before} target="_blank" rel="noopener noreferrer">
                                            <FileZipOutlined /> 成果物発表会時のソースコード
                                        </Typography.Link>
                                        <Typography.Link href={SAMPLE_ZIP_URLS.after} target="_blank" rel="noopener noreferrer">
                                            <FileZipOutlined /> 合宿後のソースコード
                                        </Typography.Link>
                                    </Flex>
                                </Flex>
                            </div>
                        ) : imageCompareUrls?.before || imageCompareUrls?.after ? (
                            <DiffImage
                                beforeUrl={imageCompareUrls?.before}
                                afterUrl={imageCompareUrls?.after}
                            />
                        ) : diffHtml ? (
                            <div dangerouslySetInnerHTML={{ __html: diffHtml }} />
                        ) : (
                            <div className="central-empty-state">
                                <Result
                                    className="central-selection-result"
                                    status="info"
                                    title="ファイルツリーまたはツリーマップをクリックしてください"
                                />
                            </div>
                        )}
                    </div>
                </Splitter.Panel>
                <Splitter.Panel defaultSize="30%">
                    <div className="diff-panel">
                        {isTreeReady ? (
                            <TreeMapPanel
                                treeData={treeData}
                                onSelect={handleTreeSelect}
                                selectedFilePath={selectedFile?.path}
                                treeMode={treeMode}
                                treeLayoutVersion={treeLayoutVersion}
                            />
                        ) : <></>}
                    </div>
                </Splitter.Panel>
            </Splitter>
        </div>
    );
}