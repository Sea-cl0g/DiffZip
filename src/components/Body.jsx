import React from 'react';
import Upload from './Upload';
import DiffView from './DiffView';

export default function Body({ view, files, onFileChange }) {
    if (view === 'diff') {
        return <DiffView files={files} />;
    }
    return <Upload onFileChange={onFileChange} />;
}