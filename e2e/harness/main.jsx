import React from "react";
import { createRoot } from "react-dom/client";
import TestApp from "./TestApp.jsx";
import "@fontsource/plus-jakarta-sans/400.css";
import "@fontsource/plus-jakarta-sans/500.css";
import "@fontsource/plus-jakarta-sans/600.css";
import "@fontsource/plus-jakarta-sans/700.css";
import "@fontsource/plus-jakarta-sans/800.css";
import "../../src/index.css";

createRoot(document.getElementById("root")).render(<TestApp />);
