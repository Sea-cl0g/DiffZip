function getEntrySize(entry) {
    return Number.isFinite(entry?.size) ? entry.size : 0;
}

function createFolderNode(name) {
    return {
        name,
        isFile: false,
        status: null,
        left: null,
        right: null,
        size: 0,
        value: 0,
        children: {},
    };
}

function createFileNode(source, mode) {
    const isDiffMode = mode === 'diff';
    const left = isDiffMode ? source.left || null : (mode === 'left' ? source : null);
    const right = isDiffMode ? source.right || null : (mode === 'right' ? source : null);
    const entry = mode === 'right' ? right : left || right;

    return {
        name: source.path.split('/').pop() || source.path,
        isFile: true,
        status: isDiffMode ? source.status : null,
        left,
        right,
        size: isDiffMode ? (Number.isFinite(source.size) ? source.size : getEntrySize(entry)) : getEntrySize(entry),
        value: isDiffMode ? (Number.isFinite(source.size) ? source.size : getEntrySize(entry)) : getEntrySize(entry),
        children: {},
    };
}

function getSourceItems(input, mode) {
    if (Array.isArray(input)) {
        return input;
    }

    if (mode === 'left') {
        return input?.left || [];
    }

    if (mode === 'right') {
        return input?.right || [];
    }

    return input?.changes || [];
}

export function buildTreeData(input, options = {}) {
    const mode = options.mode || 'diff';
    const sourceItems = getSourceItems(input, mode);
    const root = {};
    let keyCounter = 0;

    for (const item of sourceItems) {
        if (!item?.path) {
            continue;
        }

        const parts = item.path.split('/');
        let current = root;
        const leafSize = mode === 'diff'
            ? (Number.isFinite(item.size) ? item.size : getEntrySize(item.left || item.right))
            : getEntrySize(item);

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            const isFile = i === parts.length - 1;

            if (!current[part]) {
                current[part] = isFile ? createFileNode(item, mode) : createFolderNode(part);
            }

            if (isFile) {
                current[part].isFile = true;
                if (mode === 'diff') {
                    current[part].status = item.status;
                    current[part].left = item.left || null;
                    current[part].right = item.right || null;
                } else if (mode === 'left') {
                    current[part].left = item;
                    current[part].right = null;
                    current[part].status = null;
                } else if (mode === 'right') {
                    current[part].left = null;
                    current[part].right = item;
                    current[part].status = null;
                }
                current[part].size = leafSize;
                current[part].value = leafSize;
            } else {
                current[part].value = (current[part].value || 0) + leafSize;
            }

            current = current[part].children;
        }
    }

    function treeToArray(node, parentPath = '') {
        const result = [];

        for (const [name, item] of Object.entries(node)) {
            const currentPath = parentPath ? `${parentPath}/${name}` : name;
            const key = `${++keyCounter}`;

            const treeNode = {
                key,
                title: name,
                data: {
                    name,
                    path: currentPath,
                    isFile: item.isFile,
                    status: item.status,
                    left: item.isFile ? item.left : null,
                    right: item.isFile ? item.right : null,
                    value: Number.isFinite(item.value) ? item.value : 0,
                },
            };

            if (Object.keys(item.children).length > 0) {
                treeNode.children = treeToArray(item.children, currentPath);
            }

            result.push(treeNode);
        }

        return result.sort((a, b) => {
            if (a.data.isFile !== b.data.isFile) {
                return a.data.isFile ? 1 : -1;
            }
            return a.title.localeCompare(b.title);
        });
    }

    return treeToArray(root);
}
