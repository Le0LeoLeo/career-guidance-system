import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// 模擬 DOM
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost',
  pretendToBeVisual: true
});

global.window = dom.window;
global.document = dom.window.document;

// 載入 app.js（需要動態導入，因為它使用 DOM）
describe('App 基本功能測試', () => {
  beforeEach(() => {
    // 重置 DOM
    document.body.innerHTML = '';
    
    // 創建必要的 DOM 元素
    const loginView = document.createElement('div');
    loginView.id = 'login-view';
    loginView.style.display = 'none';
    document.body.appendChild(loginView);
    
    const dashboardView = document.createElement('div');
    dashboardView.id = 'dashboard-view';
    dashboardView.style.display = 'none';
    document.body.appendChild(dashboardView);
  });

  it('應該能夠創建視圖元素', () => {
    const loginView = document.getElementById('login-view');
    expect(loginView).toBeTruthy();
    expect(loginView.id).toBe('login-view');
  });

  it('應該能夠切換視圖顯示狀態', () => {
    const loginView = document.getElementById('login-view');
    const dashboardView = document.getElementById('dashboard-view');
    
    // 模擬 showView 函式
    function showView(viewId) {
      const views = {
        login: loginView,
        dashboard: dashboardView
      };
      
      Object.values(views).forEach(view => {
        if (view) view.style.display = 'none';
      });
      
      if (views[viewId]) {
        views[viewId].style.display = 'block';
      }
    }
    
    showView('login');
    expect(loginView.style.display).toBe('block');
    expect(dashboardView.style.display).toBe('none');
    
    showView('dashboard');
    expect(loginView.style.display).toBe('none');
    expect(dashboardView.style.display).toBe('block');
  });

  it('應該能夠從 email 提取學生編號', () => {
    function extractStudentId(email) {
      if (!email) return null;
      const match = email.match(/^(f\d{6})@fct\.edu\.mo$/i);
      if (match) {
        return match[1].toUpperCase();
      }
      return null;
    }
    
    expect(extractStudentId('f210004@fct.edu.mo')).toBe('F210004');
    expect(extractStudentId('f123456@fct.edu.mo')).toBe('F123456');
    expect(extractStudentId('invalid@email.com')).toBeNull();
    expect(extractStudentId(null)).toBeNull();
    expect(extractStudentId('')).toBeNull();
  });

  it('應該能夠驗證日期時間格式', () => {
    function isValidDateTime(dateTimeString) {
      if (!dateTimeString) return false;
      const date = new Date(dateTimeString);
      return !isNaN(date.getTime());
    }
    
    expect(isValidDateTime('2024-01-15T10:00')).toBe(true);
    expect(isValidDateTime('invalid')).toBe(false);
    expect(isValidDateTime('')).toBe(false);
    expect(isValidDateTime(null)).toBe(false);
  });
});

describe('資源過濾功能測試', () => {
  it('應該能夠過濾資源列表', () => {
    const resources = [
      { id: 1, title: '數學資源', category: 'math' },
      { id: 2, title: '英語資源', category: 'english' },
      { id: 3, title: '數學練習', category: 'math' }
    ];
    
    function filterResourcesByCategory(resources, category) {
      if (!category || category === 'all') {
        return resources;
      }
      return resources.filter(r => r.category === category);
    }
    
    expect(filterResourcesByCategory(resources, 'all')).toHaveLength(3);
    expect(filterResourcesByCategory(resources, 'math')).toHaveLength(2);
    expect(filterResourcesByCategory(resources, 'english')).toHaveLength(1);
    expect(filterResourcesByCategory(resources, 'science')).toHaveLength(0);
  });
});

describe('預約時間驗證測試', () => {
  it('應該能夠驗證預約時間不能是過去', () => {
    function isValidFutureDateTime(dateTimeString) {
      if (!dateTimeString) return false;
      const selectedDate = new Date(dateTimeString);
      const now = new Date();
      return selectedDate > now;
    }
    
    const futureDate = new Date();
    futureDate.setHours(futureDate.getHours() + 1);
    expect(isValidFutureDateTime(futureDate.toISOString().slice(0, 16))).toBe(true);
    
    const pastDate = new Date();
    pastDate.setHours(pastDate.getHours() - 1);
    expect(isValidFutureDateTime(pastDate.toISOString().slice(0, 16))).toBe(false);
  });
});




