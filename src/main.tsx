import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// 导入全局样式
import './styles/variables.css';
import './styles/reset.css';
import './styles/global.css';

// 初始化 Prompt 库
import { promptRegistry } from './services/promptRegistry';
import { seedPrompts } from './services/prompts';
promptRegistry.registerBatch(seedPrompts);


ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
