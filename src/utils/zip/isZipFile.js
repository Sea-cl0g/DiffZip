const ZIP_SIGNATURES = [
    [0x50, 0x4b, 0x03, 0x04],
    [0x50, 0x4b, 0x05, 0x06],
    [0x50, 0x4b, 0x07, 0x08],
];

export async function isZipFile(file) {
    if (!file?.name?.toLowerCase().endsWith('.zip')) {
        return false;
    }

    try {
        const bytes = new Uint8Array(await file.slice(0, 4).arrayBuffer());
        return ZIP_SIGNATURES.some((signature) =>
            signature.every((byte, index) => bytes[index] === byte)
        );
    } catch {
        return false;
    }
}