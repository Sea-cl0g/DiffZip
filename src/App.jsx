import { useState } from "react";
import Header from "./components/Header";
import Body from "./components/Body";
import Footer from "./components/Footer";

export default function App() {
  // アップロード済みzipのプール（同名ファイルは上書き）
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [files, setFiles] = useState({ file1: null, file2: null });

  function handleUploadFile(file) {
    setUploadedFiles(prev => [...prev.filter(f => f.name !== file.name), file]);
  }

  function handleFileChange(key, file) {
    setFiles(prev => ({ ...prev, [key]: file }));
  }

  return (
    <div className="app-shell">
      <Body
        uploadedFiles={uploadedFiles}
        onUploadFile={handleUploadFile}
        files={files}
        onFileChange={handleFileChange}
      />
    </div>
  );
}
