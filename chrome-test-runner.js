// Chrome DevTools 自動測試運行器
// 這個文件包含可以在 Chrome DevTools 中運行的測試函數

// 測試套件
const ChromeTests = {
  // 基本頁面測試
  async testPageLoad() {
    const title = document.title;
    return {
      name: '頁面標題測試',
      passed: title === '學生職涯輔導系統',
      expected: '學生職涯輔導系統',
      actual: title
    };
  },

  // DOM 元素存在測試
  async testDOMElements() {
    const requiredElements = [
      'login-view',
      'dashboard-view',
      'student-status-select-view',
      'student-decided-view',
      'student-undecided-view',
      'teacher-view'
    ];

    const missing = [];
    const existing = [];

    requiredElements.forEach(id => {
      const el = document.getElementById(id);
      if (!el) {
        missing.push(id);
      } else {
        existing.push(id);
      }
    });

    return {
      name: 'DOM 元素存在測試',
      passed: missing.length === 0,
      expected: `所有 ${requiredElements.length} 個元素存在`,
      actual: missing.length > 0 
        ? `缺少: ${missing.join(', ')}` 
        : `所有元素存在`,
      details: {
        existing,
        missing
      }
    };
  },

  // 視圖切換測試
  async testViewSwitching() {
    // 模擬 showView 函數
    const views = {
      login: document.getElementById('login-view'),
      dashboard: document.getElementById('dashboard-view')
    };

    if (!views.login || !views.dashboard) {
      return {
        name: '視圖切換測試',
        passed: false,
        expected: '視圖元素存在',
        actual: '視圖元素不存在',
        error: '無法找到視圖元素'
      };
    }

    // 測試切換邏輯
    const originalDisplay = {
      login: views.login.style.display,
      dashboard: views.dashboard.style.display
    };

    // 模擬切換到 login
    Object.values(views).forEach(view => {
      if (view) view.style.display = 'none';
    });
    if (views.login) views.login.style.display = 'block';

    const loginVisible = views.login.style.display === 'block';
    const dashboardHidden = views.dashboard.style.display === 'none';

    // 恢復原狀
    views.login.style.display = originalDisplay.login;
    views.dashboard.style.display = originalDisplay.dashboard;

    return {
      name: '視圖切換測試',
      passed: loginVisible && dashboardHidden,
      expected: 'login 顯示，dashboard 隱藏',
      actual: `login: ${views.login.style.display}, dashboard: ${views.dashboard.style.display}`
    };
  },

  // Supabase 初始化測試
  async testSupabaseInit() {
    const hasSupabase = typeof window.supabase !== 'undefined' || 
                       typeof supabase !== 'undefined';
    
    return {
      name: 'Supabase 初始化測試',
      passed: hasSupabase,
      expected: 'Supabase 已載入',
      actual: hasSupabase ? 'Supabase 已載入' : 'Supabase 未載入'
    };
  },

  // 表單元素測試
  async testFormElements() {
    const loginEmail = document.getElementById('login-email');
    const loginPassword = document.getElementById('login-password');
    const loginBtn = document.getElementById('login-btn');

    const elements = {
      email: !!loginEmail,
      password: !!loginPassword,
      button: !!loginBtn
    };

    const allExist = Object.values(elements).every(v => v === true);

    return {
      name: '登入表單元素測試',
      passed: allExist,
      expected: '所有表單元素存在',
      actual: allExist 
        ? '所有元素存在' 
        : `缺少: ${Object.entries(elements).filter(([k, v]) => !v).map(([k]) => k).join(', ')}`,
      details: elements
    };
  },

  // 運行所有測試
  async runAll() {
    console.log('🧪 開始運行 Chrome DevTools 測試...\n');
    
    const results = [];
    
    results.push(await this.testPageLoad());
    results.push(await this.testDOMElements());
    results.push(await this.testViewSwitching());
    results.push(await this.testSupabaseInit());
    results.push(await this.testFormElements());

    // 輸出結果
    console.log('\n📊 測試結果:');
    console.log('='.repeat(50));
    
    results.forEach(result => {
      const icon = result.passed ? '✅' : '❌';
      console.log(`${icon} ${result.name}`);
      if (!result.passed) {
        console.log(`   預期: ${result.expected}`);
        console.log(`   實際: ${result.actual}`);
        if (result.error) {
          console.log(`   錯誤: ${result.error}`);
        }
      }
    });

    const passed = results.filter(r => r.passed).length;
    const total = results.length;
    const percentage = ((passed / total) * 100).toFixed(1);

    console.log('='.repeat(50));
    console.log(`\n總計: ${passed}/${total} 通過 (${percentage}%)`);

    if (passed === total) {
      console.log('🎉 所有測試通過！');
    } else {
      console.log('⚠️  部分測試失敗');
    }

    return {
      summary: {
        passed,
        total,
        percentage
      },
      results
    };
  }
};

// 如果在瀏覽器中運行，自動執行
if (typeof window !== 'undefined') {
  // 等待頁面載入完成
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      console.log('頁面載入完成，可以運行測試');
      console.log('運行 ChromeTests.runAll() 來執行所有測試');
    });
  } else {
    console.log('頁面已載入，可以運行測試');
    console.log('運行 ChromeTests.runAll() 來執行所有測試');
  }
}

// 導出（如果在 Node.js 環境）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ChromeTests;
}



