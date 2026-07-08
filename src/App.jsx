import { useState } from "react";
import Header from "./components/Header";
import Body from "./components/Body";

export default function App() {
  return (
    <div className="app-shell">
      <Header />
      <Body />
    </div>
  );
}
