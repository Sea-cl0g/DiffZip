import Toolbar from './Toolbar';
import DiffView from './DiffView';

export default function Body({ uploadedFiles, onUploadFile, files, onFileChange }) {
    return (
        <main className="main-content">
            <Toolbar
                uploadedFiles={uploadedFiles}
                onUploadFile={onUploadFile}
                files={files}
                onFileChange={onFileChange}
            />
            <DiffView files={files} onUploadFile={onUploadFile} />
        </main>
    );
}