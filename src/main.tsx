import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';
import './i18n';
import { startHistoryJanitor } from './utils/chatHistory';

// 无论打开哪个页面都先清理过期的本机聊天记录，之后每分钟检查一次
startHistoryJanitor();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

