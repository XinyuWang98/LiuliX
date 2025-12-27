import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// 导入全局样式
import './styles/variables.css';
import './styles/reset.css';
import './styles/global.css';

// Prompt库初始化
import { promptRegistry } from './services/promptRegistry';
import { seedPrompts } from './services/prompts';
import { SEED_CLEANING_PROMPTS } from './services/prompts/seedCleaningPrompts';

// 注册洞察Prompt
promptRegistry.registerBatch(seedPrompts);
// 注册清洗Prompt
promptRegistry.registerBatch(SEED_CLEANING_PROMPTS);


ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
