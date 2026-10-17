import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Bootstrap 5 CSS (프로젝트 전체에서 딱 한 번만 import)
import 'bootstrap/dist/css/bootstrap.min.css';

// 우리 프로젝트만의 커스텀 스타일 (Bootstrap보다 나중에 불러와야 우선 적용됨)
import './index.css';

// 로그인
import store from './auth/reducers/store';
import { Provider } from 'react-redux';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>,
);
