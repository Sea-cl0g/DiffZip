import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Splitter, Typography } from 'antd';
import { unzip } from 'unzipit';
import { createPatch } from 'diff';
import { html } from 'diff2html';
import 'diff2html/bundles/css/diff2html.min.css';
import { buildZipDiffMetadata } from '../utils/zip/diffMetadata';
import { buildTreeData } from '../utils/treeBuilder';
import DiffImage from './DiffImage';
import Tree from './FileTree';

const TREE_MODE = {
    DIFF: 'diff',
    LEFT: 'left',
    RIGHT: 'right',
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

export default function DiffView({ files }) {
    const [treeData, setTreeData] = useState([]);
    const [diffMetadata, setDiffMetadata] = useState(null);
    const [treeMode, setTreeMode] = useState(TREE_MODE.DIFF);
    const [isTreeReady, setIsTreeReady] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [diffHtml, setDiffHtml] = useState('');
    const [imageCompareUrls, setImageCompareUrls] = useState(null);
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

    return (
        <div style={{ height: '100%', minHeight: 0 }}>
            <Splitter style={{ height: '100%', minHeight: 0, boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)', backgroundColor: '#ffffff' }}>
                <Splitter.Panel defaultSize="30%" min="30%" max="70%">
                    <div className="diff-panel">
                        {isTreeReady ? (
                            <Tree
                                treeData={treeData}
                                onSelect={handleTreeSelect}
                                treeMode={treeMode}
                                onTreeModeChange={handleTreeModeChange}
                            />
                        ) : <></>}
                    </div>
                </Splitter.Panel>
                <Splitter.Panel>
                    <div className="diff-panel">
                        {imageCompareUrls?.before || imageCompareUrls?.after ? (
                            <DiffImage
                                beforeUrl={imageCompareUrls?.before}
                                afterUrl={imageCompareUrls?.after}
                            />
                        ) : diffHtml ? (
                            <div dangerouslySetInnerHTML={{ __html: diffHtml }} />
                        ) : (
                            <Typography.Text type="secondary">ファイルを選択してください</Typography.Text>
                        )}
                    </div>
                </Splitter.Panel>
            </Splitter>
        </div>
    );
}