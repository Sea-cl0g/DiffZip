import { unzip } from 'unzipit';

function normalizeZipPath(inputPath) {
    return String(inputPath || '')
        .replace(/\\/g, '/')
        .replace(/^\.\//, '')
        .replace(/^\/+/, '')
        .replace(/\/+/g, '/');
}

function toEntryMeta(entry) {
    const normalizedPath = normalizeZipPath(entry.name);
    const crc32 = typeof entry?.crc32 === 'number' ? entry.crc32 : null;

    return {
        path: normalizedPath,
        zipPath: normalizedPath,
        size: Number.isFinite(entry.size) ? entry.size : null,
        compressedSize: Number.isFinite(entry.compressedSize) ? entry.compressedSize : null,
        crc32,
        lastModMs: entry.lastModDate instanceof Date ? entry.lastModDate.getTime() : null,
    };
}

function detectSingleRootFolderPrefix(paths) {
    if (paths.length === 0) {
        return '';
    }

    const firstSegments = new Set();

    for (const path of paths) {
        const separatorIndex = path.indexOf('/');
        if (separatorIndex <= 0) {
            return '';
        }

        firstSegments.add(path.slice(0, separatorIndex));
        if (firstSegments.size > 1) {
            return '';
        }
    }

    return `${paths[0].slice(0, paths[0].indexOf('/'))}/`;
}

function stripPrefix(path, prefix) {
    return prefix && path.startsWith(prefix) ? path.slice(prefix.length) : path;
}

function buildComparableEntryMap(rawMap, rootPrefix) {
    const comparableMap = new Map();

    for (const meta of rawMap.values()) {
        const comparablePath = stripPrefix(meta.zipPath, rootPrefix);
        comparableMap.set(comparablePath, meta);
    }

    return comparableMap;
}

function metadataChanged(leftMeta, rightMeta) {
    if (!leftMeta || !rightMeta) {
        return true;
    }

    if (leftMeta.size !== rightMeta.size) {
        return true;
    }

    if (leftMeta.compressedSize !== rightMeta.compressedSize) {
        return true;
    }

    if (leftMeta.crc32 != null && rightMeta.crc32 != null && leftMeta.crc32 !== rightMeta.crc32) {
        return true;
    }

    return false;
}

async function listZipFileEntries(fileLike) {
    const zipInfo = await unzip(fileLike);
    const entries = Object.values(zipInfo.entries || {});
    const map = new Map();

    for (const entry of entries) {
        if (entry.isDirectory) {
            continue;
        }

        const meta = toEntryMeta(entry);
        if (!meta.path) {
            continue;
        }

        map.set(meta.path, meta);
    }

    return map;
}

export async function buildZipDiffMetadata(beforeZipFile, afterZipFile) {
    if (!beforeZipFile || !afterZipFile) {
        throw new Error('Two zip files are required.');
    }

    const startedAt = performance.now();
    const [beforeRawMap, afterRawMap] = await Promise.all([
        listZipFileEntries(beforeZipFile),
        listZipFileEntries(afterZipFile),
    ]);

    const beforeMap = buildComparableEntryMap(
        beforeRawMap,
        detectSingleRootFolderPrefix([...beforeRawMap.keys()]),
    );
    const afterMap = buildComparableEntryMap(
        afterRawMap,
        detectSingleRootFolderPrefix([...afterRawMap.keys()]),
    );

    const allPaths = new Set([...beforeMap.keys(), ...afterMap.keys()]);
    const sortedPaths = [...allPaths].sort((a, b) => a.localeCompare(b));
    const changes = [];

    for (const path of sortedPaths) {
        const left = beforeMap.get(path) || null;
        const right = afterMap.get(path) || null;

        if (!left && right) {
            changes.push({ path, status: 'added', type: 'file', left: null, right });
            continue;
        }

        if (left && !right) {
            changes.push({ path, status: 'deleted', type: 'file', left, right: null });
            continue;
        }

        if (metadataChanged(left, right)) {
            changes.push({ path, status: 'modified', type: 'file', left, right });
        }
    }

    const summary = {
        added: changes.filter((item) => item.status === 'added').length,
        deleted: changes.filter((item) => item.status === 'deleted').length,
        modified: changes.filter((item) => item.status === 'modified').length,
        totalChanged: changes.length,
    };

    return {
        changes,
        summary,
        elapsedMs: Math.round(performance.now() - startedAt),
    };
}
