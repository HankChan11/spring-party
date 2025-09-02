import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";      // ← 這行很關鍵

createRoot(document.getElementById("root")).render(<App />);
