import { Tree } from 'antd';

export default function FileTree({ treeData, onSelect, selectedKeys }) {
    return (
        <div className="file-tree-root">
            <Tree
                showLine
                defaultExpandAll={true}
                autoExpandParent={true}
                selectedKeys={selectedKeys}
                expandedKeys={selectedKeys}
                onSelect={onSelect}
                treeData={treeData}
                titleRender={(node) => (
                    <span style={node.data?.status === 'deleted' ? { textDecoration: 'line-through', opacity: 0.5 } : undefined}>
                        {node.title}
                    </span>
                )}
            />
        </div>
    );
}
