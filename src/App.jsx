import { useState } from "react";
import Header from "./components/Header";
import Body from "./components/Body";

export default function App() {
  const [view, setView] = useState("upload"); // "upload" | "diff"
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
      <Header />
      <Body
        view={view}
        files={files}
        onFileChange={handleFileChange}
      />
    </div>
  );
}
