// main.tsx : ReactDOM 렌더링 //

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "@core/App.tsx"; // 별칭 사용:@core -> 설정파일 -> 1. tsconfig.json 2. vite.config.ts

const rootElement = document.getElementById("root") as HTMLElement;
const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);