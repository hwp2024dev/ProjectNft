// main.tsx : ReactDOM 렌더링 //

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "@core/App.tsx"; // 별칭 사용:@core -> 설정파일 -> 1. tsconfig.json 2. vite.config.ts
import { UserProvider } from "@core/UserContext";
import { Web3Provider } from "@core/Web3Provider"; //

const rootElement = document.getElementById("root") as HTMLElement;
const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <UserProvider> 
        <Web3Provider>
            <App />
        </Web3Provider>
      </UserProvider>
    </BrowserRouter>
  </React.StrictMode>
);