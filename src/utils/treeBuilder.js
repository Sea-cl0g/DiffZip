export function buildTreeData(changes) {
    const root = {};
    let keyCounter = 0;

    for (const change of changes) {
        const parts = change.path.split('/');
        let current = root;

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            const isFile = i === parts.length - 1;

            if (!current[part]) {
                current[part] = {
                    name: part,
                    isFile,
                    status: isFile ? change.status : null,
                    left: isFile ? change.left : null,
                    right: isFile ? change.right : null,
                    children: {},
                };
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
