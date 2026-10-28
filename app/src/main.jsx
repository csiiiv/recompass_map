import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css"; // reset, theme vars, #root sizing — must load first
import "./styles.css"; // component styles
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
