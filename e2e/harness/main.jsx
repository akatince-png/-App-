import React from "react";
import { createRoot } from "react-dom/client";
import TestApp from "./TestApp.jsx";
import "../../src/index.css";

createRoot(document.getElementById("root")).render(<TestApp />);
