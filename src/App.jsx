import { useState } from "react";
import Header from "./components/Header";
import Body from "./components/Body";
import Footer from "./components/Footer";

export default function App() {
  const [files, setFiles] = useState({ file1: null, file2: null });

  function handleFileChange(key, file) {
    setFiles(prev => {
      const next = { ...prev, [key]: file };
      if (next.file1 && next.file2) {
        setView("diff");
      }
      return next;
    });
  }

  return (
    <div className="app-shell">
      <Body
        files={files}
        onFileChange={handleFileChange}
      />
    </div>
  );
}
