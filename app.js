// ========== Supabase 初始化 ==========
// 請在下方填入您的 Supabase 專案資訊
const SUPABASE_URL = 'https://naqyczuuariosniudbsr.supabase.co'; // 請填入您的 Supabase URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hcXljenV1YXJpb3NuaXVkYnNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzM2ODQsImV4cCI6MjA4MDM0OTY4NH0.6gLqwj0OBNHatfoPC_Pm0zANzQLS1KE9xJ2Vf2dQB7s'; // 請填入您的 Supabase Anon Key

// Supabase 客戶端（將在 DOMContentLoaded 中初始化）
let supabase;

// ========== 全域變數 ==========
let currentUser = null;
let currentProfile = null;

// ========== Firebase 初始化 ==========
// Firebase 配置（請填入您的 Firebase 配置）
const firebaseConfig = {
  apiKey: "AIzaSyA6QVAAIBGpnt8QBAScj3gMQmnQijqX_vk",
  authDomain: "cpaapp-8c4d6.firebaseapp.com",
  projectId: "cpaapp-8c4d6",
  storageBucket: "cpaapp-8c4d6.firebasestorage.app",
  messagingSenderId: "182638554959",
  appId: "1:182638554959:web:3e5e126b379c6c68c1df3a",
  measurementId: "G-ME38DET581"
};

// Firebase 和 Firestore 實例（將在初始化後設定）
let firebaseApp = null;
let db = null;

// 初始化 Firebase
function initFirebase() {
  try {
    // 檢查 Firebase 是否已載入
    if (typeof firebase === 'undefined') {
      console.error('Firebase SDK 尚未載入');
      return false;
    }
    
    // 初始化 Firebase App
    firebaseApp = firebase.initializeApp(firebaseConfig);
    
    // 初始化 Firestore
    db = firebase.firestore();
    
    console.log('✅ Firebase 初始化成功');
    return true;
  } catch (error) {
    console.error('❌ Firebase 初始化失敗：', error);
    return false;
  }
}

// ========== DOM 元素 ==========
let views = {};

// ========== 路由管理 ==========
let viewHistory = []; // 視圖歷史棧
let isNavigatingBack = false; // 標記是否正在執行返回操作
let currentViewId = null; // 當前視圖ID

// 初始化 views 對象（在 DOM 加載後）
function initViews() {
  views = {
    login: document.getElementById('login-view'),
    dashboard: document.getElementById('dashboard-view'),
    statusSelect: document.getElementById('student-status-select-view'),
    studentDecided: document.getElementById('student-decided-view'),
    studentUndecided: document.getElementById('student-undecided-view'),
    teacher: document.getElementById('teacher-view'),
    'university-view': document.getElementById('university-view'),
    'academics-view': document.getElementById('academics-view')
  };
}

// ========== 頁面切換函式 ==========
function showView(viewId, skipHistory = false) {
  // 確保 views 已初始化
  if (Object.keys(views).length === 0) {
    initViews();
  }
  
  // 如果視圖相同，不執行任何操作
  if (currentViewId === viewId) {
    return;
  }
  
  // 保存舊的視圖ID（在更新之前）
  const previousViewId = currentViewId;
  
  // 隱藏所有視圖
  Object.values(views).forEach(view => {
    if (view) view.style.display = 'none';
  });
  
  // 顯示指定視圖
  if (views[viewId]) {
    views[viewId].style.display = 'block';
    
    // 如果不是返回操作，則處理歷史記錄
    if (!isNavigatingBack && !skipHistory) {
      const isLoginView = viewId === 'login';
      // 登錄頁面只有在用戶未登錄時才添加到歷史記錄
      const shouldAddToHistory = !isLoginView || (isLoginView && !currentUser);
      
      if (shouldAddToHistory) {
        // 如果之前有視圖，保存到歷史棧
        if (previousViewId && previousViewId !== viewId) {
          viewHistory.push(previousViewId);
        }
        
        // 更新 URL 並添加到瀏覽器歷史
        const url = `#${viewId}`;
        history.pushState({ viewId: viewId }, '', url);
      } else {
        // 登錄頁面且用戶已登錄，使用 replaceState 不添加到歷史
        const url = `#${viewId}`;
        history.replaceState({ viewId: viewId }, '', url);
      }
    }
    
    // 更新當前視圖ID
    currentViewId = viewId;
    
    console.log(`✅ 切換到視圖: ${viewId}`, { 
      previousView: previousViewId,
      historyLength: viewHistory.length, 
      currentHistory: [...viewHistory] 
    });
  } else {
    console.warn(`視圖 "${viewId}" 不存在`);
  }
}

// 處理瀏覽器返回按鈕
function handleBackNavigation() {
  if (viewHistory.length > 0) {
    // 從歷史棧中取出上一個視圖
    const previousViewId = viewHistory.pop();
    
    // 如果上一個視圖是登錄頁面且用戶已登錄，跳過它
    if (previousViewId === 'login' && currentUser) {
      // 繼續查找下一個非登錄視圖
      if (viewHistory.length > 0) {
        const nextViewId = viewHistory.pop();
        isNavigatingBack = true;
        showView(nextViewId, true);
        isNavigatingBack = false;
        history.replaceState({ viewId: nextViewId }, '', `#${nextViewId}`);
        console.log(`🔙 跳過登錄頁面，返回到視圖: ${nextViewId}`);
      } else {
        // 如果歷史中只有登錄頁面，返回到 dashboard
        if (currentUser && currentViewId !== 'dashboard') {
          isNavigatingBack = true;
          showView('dashboard', true);
          isNavigatingBack = false;
          history.replaceState({ viewId: 'dashboard' }, '', '#dashboard');
          console.log('🔙 歷史中只有登錄頁面，返回到 dashboard');
        } else {
          console.log('🔙 無法返回，保持在當前視圖');
        }
      }
    } else {
      // 正常返回
      isNavigatingBack = true;
      showView(previousViewId, true);
      isNavigatingBack = false;
      history.replaceState({ viewId: previousViewId }, '', `#${previousViewId}`);
      
      console.log(`🔙 返回到視圖: ${previousViewId}`, { 
        remainingHistory: [...viewHistory] 
      });
    }
  } else {
    // 如果歷史為空，且用戶已登錄，返回到 dashboard（如果不在 dashboard）
    if (currentUser && currentViewId !== 'dashboard' && currentViewId !== 'login') {
      isNavigatingBack = true;
      showView('dashboard', true);
      isNavigatingBack = false;
      history.replaceState({ viewId: 'dashboard' }, '', '#dashboard');
      console.log('🔙 歷史為空，返回到 dashboard');
    } else if (currentUser && currentViewId === 'login') {
      // 如果用戶已登錄但當前在登錄頁面，返回到 dashboard
      isNavigatingBack = true;
      showView('dashboard', true);
      isNavigatingBack = false;
      history.replaceState({ viewId: 'dashboard' }, '', '#dashboard');
      console.log('🔙 用戶已登錄但在登錄頁面，返回到 dashboard');
    } else {
      // 如果用戶未登錄，保持在當前視圖
      console.log('🔙 歷史為空，保持在當前視圖');
    }
  }
}

// ========== 初始化 ==========
document.addEventListener('DOMContentLoaded', async () => {
  // 初始化 views 對象
  initViews();
  
  // 設定瀏覽器返回按鈕監聽器
  window.addEventListener('popstate', (event) => {
    if (event.state && event.state.viewId) {
      // 如果 URL 中有視圖ID，切換到該視圖
      const targetViewId = event.state.viewId;
      if (targetViewId !== currentViewId) {
        isNavigatingBack = true;
        showView(targetViewId, true);
        isNavigatingBack = false;
        
        // 更新歷史棧（移除當前視圖之後的所有項目）
        const currentIndex = viewHistory.indexOf(targetViewId);
        if (currentIndex !== -1) {
          viewHistory = viewHistory.slice(0, currentIndex);
        } else {
          // 如果目標視圖不在歷史中，清空歷史（可能是直接導航）
          viewHistory = [];
        }
      }
    } else {
      // 如果沒有狀態，嘗試從 URL hash 獲取
      const hash = window.location.hash.slice(1);
      if (hash && views[hash]) {
        isNavigatingBack = true;
        showView(hash, true);
        isNavigatingBack = false;
      } else {
        // 處理返回按鈕
        handleBackNavigation();
      }
    }
  });
  
  // 先設定事件監聽器（不依賴 Supabase）
  setupEventListeners();
  
  // 初始化 Supabase 客戶端
  if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } else if (typeof supabase !== 'undefined' && supabase.createClient) {
    // 如果 supabase 是全域變數
    supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } else {
    console.warn('Supabase 尚未載入或 URL/Key 未設定，部分功能將無法使用');
    showView('login');
    return;
  }
  
  // 設定認證狀態監聽器（在 Supabase 初始化之後）
  setupAuthStateListener();
  
  // 初始化 AI 聊天功能
  initAIChatbot();
  
  // 初始化 Firebase
  initFirebase();
  
  // 設定大學查詢相關事件監聽器
  setupUniversitySearchListeners();
  
  // 設定學術中心相關事件監聽器
  setupAcademicsListeners();
  
  // 檢查是否已登入
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      currentUser = session.user;
      await loadUserProfile();
      // 如果用戶已登入，載入 Sessions 列表（在 initAIChatbot 中已處理，這裡作為備份）
      if (!isSessionsLoaded) {
        await loadSessions();
        isSessionsLoaded = true;
      }
    } else {
      showView('login');
    }
  } catch (error) {
    console.error('檢查登入狀態失敗：', error);
    showView('login');
  }
});

// ========== 事件監聽器設定 ==========
function setupEventListeners() {
  // Google 登入按鈕
  document.getElementById('google-login-btn').addEventListener('click', handleGoogleLogin);
  
  // 登出按鈕（Bootstrap 版本）
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
  
  // 登出按鈕（Tailwind 版本）
  const navLogoutBtn = document.getElementById('nav-logout-btn');
  if (navLogoutBtn) {
    navLogoutBtn.addEventListener('click', handleLogout);
  }
  
  // 學生狀態選擇
  document.querySelectorAll('.status-card').forEach(card => {
    card.addEventListener('click', async (e) => {
      const status = card.dataset.status;
      await updateStudentStatus(status);
    });
  });
  
  // 已確定目標學生：資源篩選
  const categoryFilter = document.getElementById('resource-category-filter');
  if (categoryFilter) {
    categoryFilter.addEventListener('change', filterResources);
  }
  
  // 未確定目標學生：興趣表單
  const interestsForm = document.getElementById('interests-form');
  if (interestsForm) {
    interestsForm.addEventListener('submit', handleInterestsSubmit);
  }
  
  // 未確定目標學生：預約表單
  const appointmentForm = document.getElementById('appointment-form');
  if (appointmentForm) {
    appointmentForm.addEventListener('submit', handleAppointmentSubmit);
  }
  
  // 教師：資源表單
  const resourceForm = document.getElementById('resource-form');
  if (resourceForm) {
    resourceForm.addEventListener('submit', handleResourceSubmit);
  }
}

// ========== 大學查詢相關事件監聽器 ==========
function setupUniversitySearchListeners() {
  // 搜尋按鈕
  const searchBtn = document.getElementById('uni-search-btn');
  if (searchBtn) {
    searchBtn.addEventListener('click', handleUniversitySearch);
  }
  
  // 搜尋框 Enter 鍵
  const searchInput = document.getElementById('uni-search-input');
  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        handleUniversitySearch();
      }
    });
  }
  
  // 篩選器變更
  const locationFilter = document.getElementById('uni-location-filter');
  const typeFilter = document.getElementById('uni-type-filter');
  
  if (locationFilter) {
    locationFilter.addEventListener('change', handleUniversitySearch);
  }
  
  if (typeFilter) {
    typeFilter.addEventListener('change', handleUniversitySearch);
  }
}

// ========== 郵件格式驗證 ==========
function isValidFCTEmail(email) {
  // 驗證格式：f 後面跟著 6 位數字，然後是 @fct.edu.mo
  // 例如：f210004@fct.edu.mo
  const emailPattern = /^f\d{6}@fct\.edu\.mo$/i;
  return emailPattern.test(email);
}

// ========== 認證狀態監聽器設定 ==========
function setupAuthStateListener() {
  if (!supabase) {
    console.warn('Supabase 尚未初始化，無法設定認證狀態監聽器');
    return;
  }
  
  // 監聽認證狀態變化
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session) {
      currentUser = session.user;
      const userEmail = session.user.email;
      
      // 驗證郵件格式
      if (!isValidFCTEmail(userEmail)) {
        // 郵件格式不符合，拒絕訪問並登出
        const errorDiv = document.getElementById('login-error');
        errorDiv.textContent = '拒絕訪問：僅限 FCT 學校帳戶（格式：fxxxxxx@fct.edu.mo）';
        errorDiv.style.display = 'block';
        
        // 登出用戶
        await supabase.auth.signOut();
        currentUser = null;
        currentProfile = null;
        
        // 清空視圖歷史記錄
        viewHistory = [];
        currentViewId = null;
        
        // 切換到登錄頁面（不添加到歷史記錄）
        showView('login', true);
        history.replaceState({ viewId: 'login' }, '', '#login');
        return;
      }
      
      // 確定用戶角色：f210004@fct.edu.mo 為老師，其他為學生
      const userRole = userEmail.toLowerCase() === 'f210004@fct.edu.mo' ? 'teacher' : 'student';
      
      // 如果是新用戶（Google 登入），需要檢查並建立 profile
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      // 如果沒有 profile，建立一個
      if (!existingProfile) {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: session.user.id,
            email: session.user.email,
            role: userRole
          });
        
        if (insertError) {
          console.error('建立 profile 失敗：', insertError);
        }
      } else {
        // 如果已有 profile，確保角色正確（特別是 f210004@fct.edu.mo）
        if (existingProfile.role !== userRole) {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ role: userRole })
            .eq('id', session.user.id);
          
          if (updateError) {
            console.error('更新角色失敗：', updateError);
          }
        }
      }
      
      await loadUserProfile();
      // 用戶登入後，載入 Sessions 列表
      if (!isSessionsLoaded) {
        await loadSessions();
        isSessionsLoaded = true;
      }
    } else if (event === 'SIGNED_OUT') {
      currentUser = null;
      currentProfile = null;
      currentSessionId = null;
      isSessionsLoaded = false;
      chatHistory = [];
      
      // 清空視圖歷史記錄
      viewHistory = [];
      currentViewId = null;
      
      // 清空聊天窗口和 Sessions 列表
      clearChatWindow();
      clearSessionsList();
      
      // 切換到登錄頁面（不添加到歷史記錄）
      showView('login', true);
      history.replaceState({ viewId: 'login' }, '', '#login');
    }
  });
}

// ========== 認證相關函式 ==========
async function handleLogout() {
  if (!supabase) {
    console.error('Supabase 尚未初始化');
    return;
  }
  
  await supabase.auth.signOut();
  currentUser = null;
  currentProfile = null;
  
  // 清空視圖歷史記錄
  viewHistory = [];
  currentViewId = null;
  
  // 切換到登錄頁面（不添加到歷史記錄）
  showView('login', true);
  history.replaceState({ viewId: 'login' }, '', '#login');
  
  // 清除導航列顯示
  const userEmailEl = document.getElementById('user-email');
  const navUserEmailEl = document.getElementById('nav-user-email');
  const logoutBtn = document.getElementById('logout-btn');
  const navLogoutBtn = document.getElementById('nav-logout-btn');
  
  if (userEmailEl) userEmailEl.textContent = '';
  if (navUserEmailEl) navUserEmailEl.textContent = '';
  if (logoutBtn) logoutBtn.style.display = 'none';
  if (navLogoutBtn) navLogoutBtn.style.display = 'none';
}

// ========== Google 登入相關函式 ==========
async function handleGoogleLogin() {
  const errorDiv = document.getElementById('login-error');
  errorDiv.style.display = 'none';
  
  // 檢查 Supabase 是否已初始化
  if (!supabase) {
    errorDiv.textContent = '系統尚未初始化，請重新整理頁面';
    errorDiv.style.display = 'block';
    return;
  }
  
  // 檢查 supabase.auth 是否存在
  if (!supabase.auth) {
    errorDiv.textContent = 'Google 登入失敗：認證服務尚未載入，請重新整理頁面';
    errorDiv.style.display = 'block';
    return;
  }
  
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}${window.location.pathname}`
      }
    });
    
    if (error) {
      errorDiv.textContent = 'Google 登入失敗：' + error.message;
      errorDiv.style.display = 'block';
    }
    // 如果成功，會自動跳轉到 Google 登入頁面
  } catch (error) {
    console.error('Google 登入錯誤：', error);
    errorDiv.textContent = 'Google 登入失敗：' + (error.message || '未知錯誤');
    errorDiv.style.display = 'block';
  }
}


// ========== 使用者資料載入 ==========
async function loadUserProfile() {
  if (!currentUser) return;
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', currentUser.id)
    .single();
  
  if (error) {
    console.error('載入使用者資料失敗：', error);
    return;
  }
  
  currentProfile = data;
  
  // 嘗試從 localStorage 同步目標信息（如果數據庫中沒有）
  try {
    const stored = localStorage.getItem(`target_${currentUser.id}`);
    if (stored) {
      const targetData = JSON.parse(stored);
      // 如果 localStorage 中有目標分數，但數據庫中沒有，同步到 currentProfile
      if (targetData.target_admission_score && !currentProfile.target_admission_score) {
        currentProfile.target_admission_score = targetData.target_admission_score;
      }
      // 同步其他目標信息
      if (targetData.target_university_id && !currentProfile.target_university_id) {
        currentProfile.target_university_id = targetData.target_university_id;
      }
      if (targetData.target_major_name && !currentProfile.target_major_name) {
        currentProfile.target_major_name = targetData.target_major_name;
      }
    }
  } catch (error) {
    console.error('同步目標信息失敗：', error);
  }
  
  // 更新導航列
  const userEmail = currentProfile.email || currentUser.email;
  const userEmailEl = document.getElementById('user-email');
  const navUserEmailEl = document.getElementById('nav-user-email');
  const logoutBtn = document.getElementById('logout-btn');
  const navLogoutBtn = document.getElementById('nav-logout-btn');
  
  if (userEmailEl) userEmailEl.textContent = userEmail;
  if (navUserEmailEl) navUserEmailEl.textContent = userEmail;
  if (logoutBtn) logoutBtn.style.display = 'block';
  if (navLogoutBtn) navLogoutBtn.style.display = 'block';
  
  // 如果是學生且還沒有選擇狀態，顯示狀態選擇視圖
  if (currentProfile.role === 'student' && !currentProfile.student_status) {
    showView('statusSelect');
  } else {
    // 否則顯示 Dashboard
    await showDashboard();
  }
}

// ========== 學生狀態更新 ==========
async function updateStudentStatus(status) {
  if (!currentUser) return;
  
  const { error } = await supabase
    .from('profiles')
    .update({ student_status: status })
    .eq('id', currentUser.id);
  
  if (error) {
    alert('更新狀態失敗：' + error.message);
    return;
  }
  
  currentProfile.student_status = status;
  
  // 更新狀態後顯示 Dashboard
  await showDashboard();
}

// ========== 已確定目標學生：資源相關 ==========
async function loadResources() {
  if (!supabase) {
    console.error('Supabase 尚未初始化');
    return;
  }
  
  const { data, error } = await supabase
    .from('resources')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('載入資源失敗：', error);
    alert('載入資源失敗：' + error.message);
    return;
  }
  
  const resourcesList = document.getElementById('resources-list');
  const resourcesEmpty = document.getElementById('resources-empty');
  const categoryFilter = document.getElementById('resource-category-filter');
  
  if (!resourcesList || !resourcesEmpty || !categoryFilter) {
    console.error('找不到必要的 DOM 元素');
    return;
  }
  
  // 清空列表
  resourcesList.innerHTML = '';
  
  // 收集所有類別
  const categories = [...new Set(data.map(r => r.category).filter(Boolean))];
  // 清空現有選項（保留「全部類別」）
  categoryFilter.innerHTML = '<option value="">全部類別</option>';
  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    categoryFilter.appendChild(option);
  });
  
  if (data.length === 0) {
    resourcesEmpty.style.display = 'block';
    resourcesList.style.display = 'none';
    return;
  }
  
  resourcesEmpty.style.display = 'none';
  resourcesList.style.display = 'grid';
  
  // 顯示資源
  displayResources(data, resourcesList);
}

function displayResources(resources, container) {
  container.innerHTML = '';
  
  resources.forEach(resource => {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden';
    card.innerHTML = `
      <div class="p-6">
        <div class="flex items-center justify-between mb-3">
          <span class="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
            ${resource.category || '未分類'}
          </span>
        </div>
        <h3 class="text-lg font-semibold text-gray-800 mb-3">${resource.title || '無標題'}</h3>
        <a 
          href="${resource.link}" 
          target="_blank" 
          rel="noopener noreferrer"
          class="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
          </svg>
          查看資源
        </a>
      </div>
    `;
    container.appendChild(card);
  });
}

async function filterResources() {
  if (!supabase) {
    console.error('Supabase 尚未初始化');
    return;
  }
  
  const category = document.getElementById('resource-category-filter').value;
  const { data: allResources, error } = await supabase
    .from('resources')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('載入資源失敗：', error);
    return;
  }
  
  let filtered = allResources || [];
  if (category) {
    filtered = allResources.filter(r => r.category === category);
  }
  
  const resourcesList = document.getElementById('resources-list');
  const resourcesEmpty = document.getElementById('resources-empty');
  
  if (filtered.length === 0) {
    resourcesEmpty.style.display = 'block';
    resourcesList.style.display = 'none';
  } else {
    resourcesEmpty.style.display = 'none';
    resourcesList.style.display = 'grid';
    displayResources(filtered, resourcesList);
  }
}

// ========== 未確定目標學生：興趣與預約 ==========
async function loadUndecidedStudentData() {
  await loadInterests();
  await loadTeachers();
  await loadMyAppointments();
}

async function loadInterests() {
  if (!currentProfile) return;
  
  const interestsText = document.getElementById('interests-text');
  const interestsDisplay = document.getElementById('interests-display');
  const currentInterests = document.getElementById('current-interests');
  
  if (currentProfile.interests) {
    interestsText.value = currentProfile.interests;
    interestsDisplay.textContent = currentProfile.interests;
    currentInterests.style.display = 'block';
  } else {
    currentInterests.style.display = 'none';
  }
}

async function handleInterestsSubmit(e) {
  e.preventDefault();
  if (!currentUser) return;
  
  const interests = document.getElementById('interests-text').value;
  
  const { error } = await supabase
    .from('profiles')
    .update({ interests })
    .eq('id', currentUser.id);
  
  if (error) {
    alert('儲存興趣失敗：' + error.message);
    return;
  }
  
  currentProfile.interests = interests;
  await loadInterests();
  alert('興趣已儲存！');
}

async function loadTeachers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('role', 'teacher');
  
  if (error) {
    console.error('載入教師列表失敗：', error);
    return;
  }
  
  const teacherSelect = document.getElementById('teacher-select');
  teacherSelect.innerHTML = '<option value="">請選擇教師</option>';
  
  data.forEach(teacher => {
    const option = document.createElement('option');
    option.value = teacher.email;
    option.textContent = teacher.email;
    teacherSelect.appendChild(option);
  });
}

async function handleAppointmentSubmit(e) {
  e.preventDefault();
  if (!currentUser || !supabase) {
    alert('系統錯誤：請重新登入');
    return;
  }
  
  const teacherName = document.getElementById('teacher-select').value;
  const datetime = document.getElementById('booking-datetime').value;
  const notes = document.getElementById('appointment-notes').value;
  
  if (!teacherName || !datetime) {
    alert('請填寫所有必填欄位');
    return;
  }
  
  // 將 datetime-local 的值轉換為 ISO 字符串
  const bookingTime = new Date(datetime);
  
  // 驗證日期是否有效
  if (isNaN(bookingTime.getTime())) {
    alert('請選擇有效的日期時間');
    return;
  }
  
  // 驗證日期是否在未來
  if (bookingTime < new Date()) {
    alert('預約時間必須是未來的時間');
    return;
  }
  
  const { error } = await supabase
    .from('appointments')
    .insert({
      student_id: currentUser.id,
      teacher_name: teacherName,
      booking_time: bookingTime.toISOString(),
      status: 'pending',
      notes: notes || null
    });
  
  if (error) {
    alert('提交預約失敗：' + error.message);
    console.error('預約錯誤：', error);
    return;
  }
  
  alert('預約已提交！');
  document.getElementById('appointment-form').reset();
  await loadMyAppointments();
}

async function loadMyAppointments() {
  if (!currentUser || !supabase) {
    console.error('用戶未登入或 Supabase 未初始化');
    return;
  }
  
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('student_id', currentUser.id)
    .order('booking_time', { ascending: true });
  
  if (error) {
    console.error('載入預約失敗：', error);
    alert('載入預約失敗：' + error.message);
    return;
  }
  
  const appointmentsList = document.getElementById('my-appointments-list');
  const appointmentsEmpty = document.getElementById('appointments-empty');
  
  if (!appointmentsList || !appointmentsEmpty) {
    console.error('找不到必要的 DOM 元素');
    return;
  }
  
  appointmentsList.innerHTML = '';
  
  if (!data || data.length === 0) {
    appointmentsEmpty.style.display = 'block';
    appointmentsList.style.display = 'none';
    return;
  }
  
  appointmentsEmpty.style.display = 'none';
  appointmentsList.style.display = 'block';
  
  data.forEach(appointment => {
    const bookingTime = new Date(appointment.booking_time);
    const statusBadge = appointment.status === 'confirmed' 
      ? '<span class="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">已確認</span>'
      : '<span class="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">待確認</span>';
    
    const div = document.createElement('div');
    div.className = 'bg-gray-50 rounded-lg p-4 border border-gray-200';
    div.innerHTML = `
      <div class="flex justify-between items-start">
        <div class="flex-1">
          <div class="flex items-center mb-2">
            <svg class="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
            <h3 class="text-lg font-semibold text-gray-800">${appointment.teacher_name || '未指定導師'}</h3>
          </div>
          <div class="flex items-center mb-2 text-gray-600">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            <span>${bookingTime.toLocaleString('zh-TW', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric', 
              hour: '2-digit', 
              minute: '2-digit' 
            })}</span>
          </div>
          ${appointment.notes ? `
            <div class="mt-2 p-2 bg-white rounded border border-gray-200">
              <p class="text-sm text-gray-600"><strong>備註：</strong>${appointment.notes}</p>
            </div>
          ` : ''}
        </div>
        <div class="ml-4">
          ${statusBadge}
        </div>
      </div>
    `;
    appointmentsList.appendChild(div);
  });
}

// ========== 教師相關函式 ==========
async function loadTeacherData() {
  await loadAllAppointments();
  await loadTeacherResources();
}

async function handleResourceSubmit(e) {
  e.preventDefault();
  if (!currentUser) return;
  
  const title = document.getElementById('resource-title').value;
  const link = document.getElementById('resource-link').value;
  const category = document.getElementById('resource-category').value;
  
  const { error } = await supabase
    .from('resources')
    .insert({
      title,
      link,
      category,
      created_by: currentUser.id
    });
  
  if (error) {
    alert('發布資源失敗：' + error.message);
    return;
  }
  
  alert('資源已發布！');
  document.getElementById('resource-form').reset();
  await loadTeacherResources();
}

async function loadTeacherResources() {
  const { data, error } = await supabase
    .from('resources')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('載入資源失敗：', error);
    return;
  }
  
  const resourcesList = document.getElementById('teacher-resources-list');
  const resourcesEmpty = document.getElementById('teacher-resources-empty');
  
  resourcesList.innerHTML = '';
  
  if (data.length === 0) {
    resourcesEmpty.style.display = 'block';
    return;
  }
  
  resourcesEmpty.style.display = 'none';
  
  data.forEach(resource => {
    const col = document.createElement('div');
    col.className = 'col-md-4';
    col.innerHTML = `
      <div class="card h-100">
        <div class="card-body">
          <span class="badge bg-secondary mb-2">${resource.category}</span>
          <h5 class="card-title">${resource.title}</h5>
          <p class="card-text">
            <a href="${resource.link}" target="_blank">${resource.link}</a>
          </p>
          <button class="btn btn-danger btn-sm" onclick="deleteResource('${resource.id}')">刪除</button>
        </div>
      </div>
    `;
    resourcesList.appendChild(col);
  });
}

async function deleteResource(resourceId) {
  if (!confirm('確定要刪除此資源嗎？')) return;
  
  const { error } = await supabase
    .from('resources')
    .delete()
    .eq('id', resourceId);
  
  if (error) {
    alert('刪除失敗：' + error.message);
    return;
  }
  
  await loadTeacherResources();
}

async function loadAllAppointments() {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .order('booking_time', { ascending: true });
  
  if (error) {
    console.error('載入預約失敗：', error);
    return;
  }
  
  const appointmentsList = document.getElementById('all-appointments-list');
  const appointmentsEmpty = document.getElementById('all-appointments-empty');
  
  appointmentsList.innerHTML = '';
  
  if (data.length === 0) {
    appointmentsEmpty.style.display = 'block';
    return;
  }
  
  appointmentsEmpty.style.display = 'none';
  
  data.forEach(appointment => {
    const bookingTime = new Date(appointment.booking_time);
    const statusBadge = appointment.status === 'confirmed' 
      ? '<span class="badge bg-success">已確認</span>'
      : '<span class="badge bg-warning">待確認</span>';
    
    const statusButton = appointment.status === 'pending'
      ? `<button class="btn btn-success btn-sm" onclick="confirmAppointment('${appointment.id}')">確認預約</button>`
      : '';
    
    const div = document.createElement('div');
    div.className = 'card mb-2';
    div.innerHTML = `
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <h6 class="card-title">${appointment.teacher_name}</h6>
            <p class="card-text mb-1">
              <strong>學生 ID：</strong>${appointment.student_id.substring(0, 8)}...
            </p>
            <p class="card-text mb-1">
              <strong>時間：</strong>${bookingTime.toLocaleString('zh-TW')}
            </p>
            ${appointment.notes ? `<p class="card-text"><small class="text-muted">${appointment.notes}</small></p>` : ''}
          </div>
          <div>
            ${statusBadge}
            ${statusButton}
          </div>
        </div>
      </div>
    `;
    appointmentsList.appendChild(div);
  });
}

async function confirmAppointment(appointmentId) {
  const { error } = await supabase
    .from('appointments')
    .update({ status: 'confirmed' })
    .eq('id', appointmentId);
  
  if (error) {
    alert('確認預約失敗：' + error.message);
    return;
  }
  
  await loadAllAppointments();
}

// ========== Dashboard 相關函式 ==========
async function showDashboard() {
  if (!currentUser || !currentProfile) return;
  
  // 獲取用戶名字（從 user_metadata 或 email）
  const userName = getUserName();
  const userEmail = currentProfile.email || currentUser.email;
  const studentId = extractStudentId(userEmail);
  const role = currentProfile.role;
  const status = currentProfile.student_status;
  
  // 更新 Dashboard 顯示
  const nameEl = document.getElementById('dashboard-name');
  const emailEl = document.getElementById('dashboard-email');
  const studentIdEl = document.getElementById('dashboard-student-id');
  const roleEl = document.getElementById('dashboard-role');
  const statusEl = document.getElementById('dashboard-status');
  const statusSection = document.getElementById('dashboard-status-section');
  const avatarEl = document.getElementById('dashboard-avatar');
  
  if (nameEl) nameEl.textContent = userName;
  if (emailEl) emailEl.textContent = userEmail;
  if (studentIdEl) {
    studentIdEl.textContent = studentId || '不適用';
    if (!studentId) {
      studentIdEl.classList.add('text-gray-400');
    }
  }
  
  // 更新角色顯示
  if (roleEl) {
    if (role === 'teacher') {
      roleEl.textContent = '教師';
      roleEl.className = 'inline-block px-4 py-2 rounded-full text-sm font-semibold bg-purple-100 text-purple-800';
    } else {
      roleEl.textContent = '學生';
      roleEl.className = 'inline-block px-4 py-2 rounded-full text-sm font-semibold bg-blue-100 text-blue-800';
    }
  }
  
  // 更新狀態顯示（僅學生顯示）
  if (role === 'student' && statusSection) {
    statusSection.style.display = 'block';
    if (statusEl) {
      if (status === 'decided') {
        statusEl.textContent = '已確定目標';
        statusEl.className = 'inline-block px-4 py-2 rounded-full text-sm font-semibold bg-green-100 text-green-800';
      } else if (status === 'undecided') {
        statusEl.textContent = '未確定目標';
        statusEl.className = 'inline-block px-4 py-2 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-800';
      } else {
        statusEl.textContent = '未設定';
        statusEl.className = 'inline-block px-4 py-2 rounded-full text-sm font-semibold bg-gray-100 text-gray-800';
      }
    }
  } else if (statusSection) {
    statusSection.style.display = 'none';
  }
  
  // 更新頭像（顯示名字首字母）
  if (avatarEl) {
    avatarEl.textContent = userName.charAt(0).toUpperCase();
  }
  
  // 顯示/隱藏快速操作卡片
  const navResources = document.getElementById('nav-resources');
  const navAppointments = document.getElementById('nav-appointments');
  const navTeacher = document.getElementById('nav-teacher');
  
  // 先隱藏所有卡片
  if (navResources) navResources.style.display = 'none';
  if (navAppointments) navAppointments.style.display = 'none';
  if (navTeacher) navTeacher.style.display = 'none';
  
  // 根據角色和狀態顯示對應卡片
  if (role === 'student') {
    if (status === 'decided' && navResources) {
      navResources.style.display = 'block';
    } else if (status === 'undecided' && navAppointments) {
      navAppointments.style.display = 'block';
    }
  } else if (role === 'teacher' && navTeacher) {
    navTeacher.style.display = 'block';
  }
  
  // 顯示 Dashboard 視圖
  showView('dashboard');
}

// 獲取用戶名字
function getUserName() {
  if (!currentUser) return '使用者';
  
  // 嘗試從 user_metadata 獲取名字
  if (currentUser.user_metadata) {
    if (currentUser.user_metadata.full_name) {
      return currentUser.user_metadata.full_name;
    }
    if (currentUser.user_metadata.name) {
      return currentUser.user_metadata.name;
    }
    // Google 登入通常會有 first_name 和 last_name
    if (currentUser.user_metadata.first_name || currentUser.user_metadata.last_name) {
      const firstName = currentUser.user_metadata.first_name || '';
      const lastName = currentUser.user_metadata.last_name || '';
      return `${firstName} ${lastName}`.trim() || '使用者';
    }
  }
  
  // 如果沒有名字，從 email 提取（例如：f210004@fct.edu.mo -> f210004）
  const email = currentUser.email || '';
  const studentId = extractStudentId(email);
  if (studentId) {
    return studentId;
  }
  
  // 如果都沒有，使用 email 的用戶名部分
  if (email) {
    return email.split('@')[0];
  }
  
  return '使用者';
}

// 從 email 提取學生編號
function extractStudentId(email) {
  if (!email) return null;
  
  // 格式：fxxxxxx@fct.edu.mo
  const match = email.match(/^(f\d{6})@fct\.edu\.mo$/i);
  if (match) {
    return match[1].toUpperCase();
  }
  
  return null;
}

// 導航到指定視圖（供 Dashboard 使用）
async function navigateToView(viewId) {
  if (!currentProfile) return;
  
  const role = currentProfile.role;
  const status = currentProfile.student_status;
  
  // 根據角色和狀態顯示對應視圖
  if (role === 'teacher') {
    if (viewId === 'teacher') {
      showView('teacher');
      await loadTeacherData();
    }
  } else if (role === 'student') {
    if (!status) {
      // 第一次登入，需要選擇狀態
      showView('statusSelect');
    } else if (status === 'decided') {
      if (viewId === 'studentDecided') {
        showView('studentDecided');
        await loadResources();
      }
    } else if (status === 'undecided') {
      if (viewId === 'studentUndecided') {
        showView('studentUndecided');
        await loadUndecidedStudentData();
      }
    }
  }
}

// ========== AI 智能助手聊天功能（多對話視窗模式） ==========
let chatHistory = []; // 保存當前 Session 的聊天歷史（用於 API 調用）
let currentSessionId = null; // 當前選中的 Session ID
let isSessionsLoaded = false; // 標記是否已載入 Sessions 列表

// 初始化聊天功能
function initAIChatbot() {
  const toggleBtn = document.getElementById('ai-chatbot-toggle');
  const closeBtn = document.getElementById('ai-chatbot-close');
  const chatWindow = document.getElementById('ai-chatbot-window');
  const sendBtn = document.getElementById('ai-chatbot-send');
  const input = document.getElementById('ai-chatbot-input');

  // 切換聊天窗口顯示
  if (toggleBtn) {
    toggleBtn.addEventListener('click', async () => {
      if (chatWindow) {
        const isVisible = chatWindow.style.display !== 'none';
        chatWindow.style.display = isVisible ? 'none' : 'flex';
        if (!isVisible) {
          input.focus();
          // 當打開聊天窗口時，載入 Sessions 列表（僅載入一次）
          if (!isSessionsLoaded && currentUser) {
            await loadSessions();
            isSessionsLoaded = true;
          }
        }
      }
    });
  }

  // 新增對話按鈕
  const newChatBtn = document.getElementById('ai-chatbot-new-chat');
  if (newChatBtn) {
    newChatBtn.addEventListener('click', startNewChat);
  }

  // 關閉聊天窗口
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      if (chatWindow) {
        chatWindow.style.display = 'none';
      }
    });
  }

  // 發送訊息
  if (sendBtn) {
    sendBtn.addEventListener('click', handleSendMessage);
  }

  // 按 Enter 發送（Shift+Enter 換行）
  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    });

    // 自動調整輸入框高度
    input.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 120) + 'px';
    });
  }

  // 診斷 Edge Function 連接（可選，在控制台輸出）
  if (supabase) {
    checkEdgeFunctionConnection();
  }
  
  // 如果用戶已登入，載入 Sessions 列表（在頁面載入時）
  if (currentUser && supabase) {
    loadSessions().then(() => {
      isSessionsLoaded = true;
    });
  }
}

// ========== 多對話視窗模式 - Session 管理 ==========

// 載入所有 Sessions（顯示在左側列表）
async function loadSessions() {
  if (!supabase || !currentUser) {
    console.warn('無法載入 Sessions：Supabase 或用戶未初始化');
    return;
  }

  try {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('載入 Sessions 失敗：', error);
      return;
    }

    // 渲染 Sessions 列表
    renderSessionsList(data || []);

    console.log(`已載入 ${data?.length || 0} 個 Sessions`);
  } catch (error) {
    console.error('載入 Sessions 時發生異常：', error);
  }
}

// 渲染 Sessions 列表到左側邊欄
function renderSessionsList(sessions) {
  const sessionsList = document.getElementById('ai-chatbot-sessions-list');
  const emptyState = document.getElementById('ai-chatbot-sessions-empty');
  if (!sessionsList) return;

  // 清空列表
  sessionsList.innerHTML = '';

  if (sessions.length === 0) {
    // 顯示空狀態
    if (emptyState) {
      sessionsList.appendChild(emptyState);
    }
    return;
  }

  // 渲染每個 Session
  sessions.forEach(session => {
    const sessionItem = document.createElement('div');
    sessionItem.className = 'ai-chatbot-session-item';
    if (session.id === currentSessionId) {
      sessionItem.classList.add('active');
    }

    // 格式化時間
    const timeStr = new Date(session.updated_at || session.created_at).toLocaleString('zh-TW', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    sessionItem.innerHTML = `
      <div class="ai-chatbot-session-item-content">
        <p class="ai-chatbot-session-item-title">${escapeHtml(session.title)}</p>
        <p class="ai-chatbot-session-item-time">${timeStr}</p>
      </div>
      <button class="ai-chatbot-session-item-delete" data-session-id="${session.id}" title="刪除對話">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
        </svg>
      </button>
    `;

    // 點擊切換 Session
    sessionItem.addEventListener('click', (e) => {
      // 如果點擊的是刪除按鈕，不觸發切換
      if (e.target.closest('.ai-chatbot-session-item-delete')) {
        return;
      }
      switchSession(session.id);
    });

    // 刪除按鈕事件
    const deleteBtn = sessionItem.querySelector('.ai-chatbot-session-item-delete');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (confirm('確定要刪除此對話嗎？')) {
          await deleteSession(session.id);
        }
      });
    }

    sessionsList.appendChild(sessionItem);
  });
}

// 切換到指定的 Session
async function switchSession(sessionId) {
  if (!sessionId) {
    console.warn('Session ID 為空');
    return;
  }

  currentSessionId = sessionId;
  
  // 更新 UI：標記當前選中的 Session
  document.querySelectorAll('.ai-chatbot-session-item').forEach(item => {
    item.classList.remove('active');
  });
  document.querySelectorAll(`[data-session-id="${sessionId}"]`).forEach(btn => {
    const item = btn.closest('.ai-chatbot-session-item');
    if (item) item.classList.add('active');
  });

  // 載入該 Session 的訊息
  await loadMessages(sessionId);
}

// 載入指定 Session 的所有訊息
async function loadMessages(sessionId) {
  if (!supabase || !currentUser || !sessionId) {
    console.warn('無法載入訊息：參數不完整');
    return;
  }

  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('載入訊息失敗：', error);
      return;
    }

    // 清空聊天窗口
    clearChatWindow();

    // 清空聊天歷史陣列
    chatHistory = [];

    // 如果有訊息，顯示它們
    if (data && data.length > 0) {
      data.forEach(message => {
        // 顯示訊息到聊天窗口
        addMessageFromDB(message.role, message.content, message.created_at);
        
        // 更新聊天歷史陣列（用於 API 調用）
        chatHistory.push({
          role: message.role,
          content: message.content
        });
      });

      // 滾動到底部
      const messagesContainer = document.getElementById('ai-chatbot-messages');
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
      
      console.log(`已載入 ${data.length} 條訊息`);
    } else {
      console.log('此 Session 沒有訊息');
    }

    // 更新標題：顯示 Session 標題
    const sessionItem = document.querySelector(`.ai-chatbot-session-item.active`);
    if (sessionItem) {
      const titleElement = sessionItem.querySelector('.ai-chatbot-session-item-title');
      if (titleElement) {
        const title = document.getElementById('ai-chatbot-title');
        const subtitle = document.getElementById('ai-chatbot-subtitle');
        if (title) title.textContent = titleElement.textContent;
        if (subtitle) subtitle.textContent = '繼續此對話';
      }
    }
  } catch (error) {
    console.error('載入訊息時發生異常：', error);
  }
}

// 開始新對話
function startNewChat() {
  currentSessionId = null;
  chatHistory = [];
  
  // 清空聊天窗口，顯示歡迎訊息
  clearChatWindow();
  
  // 移除所有 Session 的 active 狀態
  document.querySelectorAll('.ai-chatbot-session-item').forEach(item => {
    item.classList.remove('active');
  });

  // 更新標題
  const title = document.getElementById('ai-chatbot-title');
  const subtitle = document.getElementById('ai-chatbot-subtitle');
  if (title) title.textContent = 'AI 生涯導師';
  if (subtitle) subtitle.textContent = '隨時為您解答職涯問題';
}

// 清空聊天窗口
function clearChatWindow() {
  const messagesContainer = document.getElementById('ai-chatbot-messages');
  if (!messagesContainer) return;

  // 顯示歡迎訊息
  const welcome = document.getElementById('ai-chatbot-welcome');
  if (welcome) {
    messagesContainer.innerHTML = '';
    messagesContainer.appendChild(welcome);
  } else {
    messagesContainer.innerHTML = '';
  }
}

// 清空 Sessions 列表
function clearSessionsList() {
  const sessionsList = document.getElementById('ai-chatbot-sessions-list');
  if (sessionsList) {
    sessionsList.innerHTML = '';
    const emptyState = document.getElementById('ai-chatbot-sessions-empty');
    if (emptyState) {
      sessionsList.appendChild(emptyState);
    }
  }
}

// 刪除 Session
async function deleteSession(sessionId) {
  if (!supabase || !currentUser || !sessionId) {
    console.warn('無法刪除 Session：參數不完整');
    return;
  }

  try {
    const { error } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', currentUser.id);

    if (error) {
      console.error('刪除 Session 失敗：', error);
      alert('刪除失敗，請稍後再試');
      return;
    }

    // 如果刪除的是當前 Session，清空聊天窗口
    if (sessionId === currentSessionId) {
      startNewChat();
    }

    // 重新載入 Sessions 列表
    await loadSessions();

    console.log('Session 已刪除');
  } catch (error) {
    console.error('刪除 Session 時發生異常：', error);
    alert('刪除失敗，請稍後再試');
  }
}

// 建立新 Session
async function createSession(title) {
  if (!supabase || !currentUser) {
    console.warn('無法建立 Session：Supabase 或用戶未初始化');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({
        user_id: currentUser.id,
        title: title || '新對話'
      })
      .select()
      .single();

    if (error) {
      console.error('建立 Session 失敗：', error);
      return null;
    }

    console.log('Session 已建立：', data);
    return data;
  } catch (error) {
    console.error('建立 Session 時發生異常：', error);
    return null;
  }
}

// 從資料庫載入的訊息添加到聊天窗口（不保存到資料庫，避免重複）
function addMessageFromDB(role, content, createdAt) {
  const messagesContainer = document.getElementById('ai-chatbot-messages');
  if (!messagesContainer) return;

  const messageDiv = document.createElement('div');
  messageDiv.className = `ai-message ai-message-${role}`;

  // 格式化時間
  const timeStr = createdAt 
    ? new Date(createdAt).toLocaleTimeString('zh-TW', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    : new Date().toLocaleTimeString('zh-TW', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });

  if (role === 'user') {
    messageDiv.innerHTML = `
      <div class="ai-message-avatar">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
        </svg>
      </div>
      <div class="ai-message-content">
        <p>${escapeHtml(content)}</p>
        <p class="ai-message-time">${timeStr}</p>
      </div>
    `;
  } else {
    messageDiv.innerHTML = `
      <div class="ai-message-avatar">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
        </svg>
      </div>
      <div class="ai-message-content">
        <p>${formatMessageContent(content)}</p>
        <p class="ai-message-time">${timeStr}</p>
      </div>
    `;
  }

  messagesContainer.appendChild(messageDiv);
}

// 保存訊息到資料庫（需要 session_id）
async function saveMessageToDB(role, content, sessionId) {
  if (!supabase || !currentUser) {
    console.warn('無法保存訊息：Supabase 或用戶未初始化');
    return false;
  }

  // 驗證 role 和 content
  if (role !== 'user' && role !== 'assistant') {
    console.error('無效的 role：', role);
    return false;
  }

  if (!content || !content.trim()) {
    console.warn('訊息內容為空，跳過保存');
    return false;
  }

  if (!sessionId) {
    console.error('Session ID 為空，無法保存訊息');
    return false;
  }

  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        role: role,
        content: content.trim()
      })
      .select()
      .single();

    if (error) {
      console.error('保存訊息到資料庫失敗：', error);
      return false;
    }

    console.log('訊息已保存到資料庫：', data);
    return true;
  } catch (error) {
    console.error('保存訊息時發生異常：', error);
    return false;
  }
}

// 診斷 Edge Function 連接狀態
async function checkEdgeFunctionConnection() {
  if (!supabase) {
    console.warn('⚠️ Supabase 未初始化');
    return;
  }

  console.log('🔍 檢查 Edge Function 連接狀態...');
  console.log('Supabase URL:', SUPABASE_URL);
  console.log('Function 名稱: ask-ai');

  try {
    // 先檢查基本的 Supabase 連接
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.warn('⚠️ 無法獲取 session，但這不影響 Edge Function 調用');
    }

    // 嘗試調用 Edge Function（使用測試請求）
    const { data, error } = await supabase.functions.invoke('ask-ai', {
      body: { prompt: 'test', history: [] }
    });

    if (error) {
      console.error('❌ Edge Function 連接失敗：', error);
      console.error('錯誤詳情：', JSON.stringify(error, null, 2));
      
      if (error.status === 404) {
        console.error('💡 解決方案：Edge Function 未部署');
        console.error('   請執行：supabase functions deploy ask-ai');
        console.error('   或參考：SUPABASE_EDGE_FUNCTION_SETUP.md');
      } else if (error.status === 401 || error.status === 403) {
        console.error('💡 解決方案：認證失敗，請檢查 Supabase 配置');
        console.error('   1. 確認 SUPABASE_ANON_KEY 是否正確');
        console.error('   2. 確認用戶是否已登入');
      } else if (error.status === 500) {
        console.error('💡 解決方案：伺服器錯誤');
        console.error('   1. 查看日誌：supabase functions logs ask-ai');
        console.error('   2. 檢查環境變數：supabase secrets list');
      } else {
        console.error('💡 錯誤詳情：', error);
        console.error('   請查看瀏覽器 Network 標籤獲取更多資訊');
      }
    } else {
      console.log('✅ Edge Function 連接正常');
      if (data) {
        console.log('測試回應：', data);
      }
    }
  } catch (error) {
    console.error('❌ 無法連接到 Edge Function：', error.message);
    console.error('💡 請檢查：');
    console.error('   1. 網路連線是否正常');
    console.error('   2. Supabase URL 是否正確');
    console.error('   3. Edge Function 是否已部署');
    console.error('   4. 是否有 CORS 或防火牆問題');
    console.error('\n📝 詳細診斷：');
    console.error('   在 Console 中執行：diagnoseEdgeFunction()');
    console.error('   或查看：diagnose-edge-function.js');
  }
}

// 發送訊息處理函式
async function handleSendMessage() {
  const input = document.getElementById('ai-chatbot-input');
  const sendBtn = document.getElementById('ai-chatbot-send');
  const messagesContainer = document.getElementById('ai-chatbot-messages');
  const typingIndicator = document.getElementById('ai-chatbot-typing');

  if (!input || !sendBtn || !messagesContainer) return;

  const userMessage = input.value.trim();
  if (!userMessage) return;

  // 檢查 Supabase 是否已初始化
  if (!supabase) {
    showErrorMessage('系統尚未初始化，請重新整理頁面');
    return;
  }

  // 禁用輸入和按鈕
  input.disabled = true;
  sendBtn.disabled = true;

  // 隱藏歡迎訊息
  const welcome = document.getElementById('ai-chatbot-welcome');
  if (welcome && welcome.parentElement) {
    welcome.remove();
  }

  // 情況 B：如果沒有 Session，先建立一個
  if (!currentSessionId) {
    // 使用用戶訊息的前 20 個字作為標題
    const sessionTitle = userMessage.length > 20 
      ? userMessage.substring(0, 20) + '...'
      : userMessage;
    
    const newSession = await createSession(sessionTitle);
    if (!newSession) {
      showErrorMessage('無法建立新對話，請稍後再試');
      input.disabled = false;
      sendBtn.disabled = false;
      return;
    }

    currentSessionId = newSession.id;
    
    // 重新載入 Sessions 列表（更新左側列表）
    await loadSessions();
    
    // 標記當前選中的 Session
    document.querySelectorAll('.ai-chatbot-session-item').forEach(item => {
      if (item.querySelector(`[data-session-id="${currentSessionId}"]`)) {
        item.classList.add('active');
      }
    });
  }

  // 顯示用戶訊息
  addMessage('user', userMessage);
  
  // 保存用戶訊息到資料庫
  await saveMessageToDB('user', userMessage, currentSessionId);
  
  // 清空輸入框
  input.value = '';
  input.style.height = 'auto';

  // 顯示思考動畫
  if (typingIndicator) {
    typingIndicator.style.display = 'flex';
  }

  try {
    const startTime = Date.now();
    
    // 呼叫 Supabase Edge Function
    console.log('正在調用 Edge Function: ask-ai');
    console.log('請求內容:', { prompt: userMessage, history: chatHistory.slice(-10) });
    
    // 準備請求體
    const requestBody = {
      prompt: userMessage,
      history: chatHistory.slice(-10) // 只發送最近 10 條訊息作為上下文
    };
    
    let data, error;
    
    try {
      const result = await supabase.functions.invoke('ask-ai', {
        body: requestBody
      });
      data = result.data;
      error = result.error;
    } catch (invokeError) {
      console.error('調用 Edge Function 時發生異常:', invokeError);
      error = invokeError;
    }

    // 如果是 FunctionsHttpError 但 context 為空，嘗試直接獲取響應
    if (error && error.name === 'FunctionsHttpError' && (!error.context || Object.keys(error.context).length === 0)) {
      console.warn('FunctionsHttpError with empty context, attempting to fetch error details directly...');
      
      // 嘗試直接調用 Edge Function 獲取錯誤詳情或成功響應
      try {
        const functionUrl = `${SUPABASE_URL}/functions/v1/ask-ai`;
        const directResponse = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'apikey': SUPABASE_ANON_KEY
          },
          body: JSON.stringify(requestBody)
        });
        
        const responseText = await directResponse.text();
        console.log('直接調用響應狀態:', directResponse.status);
        console.log('直接調用響應文本:', responseText);
        
        // 如果響應成功，說明問題可能是 Supabase 客戶端的問題
        if (directResponse.ok) {
          try {
            const successData = JSON.parse(responseText);
            console.warn('直接調用成功，但 Supabase 客戶端返回錯誤。這可能是一個客戶端問題。');
            data = successData;
            error = null; // 清除錯誤，因為實際上調用成功了
          } catch (e) {
            // 解析失敗，繼續顯示錯誤
            console.error('解析成功響應失敗:', e);
          }
        } else {
          // 響應失敗，解析錯誤信息
          try {
            if (!error.serverError) error.serverError = {};
            error.serverError = JSON.parse(responseText);
            console.log('解析後的服務器錯誤:', error.serverError);
          } catch (e) {
            error.serverError = { 
              raw: responseText, 
              status: directResponse.status, 
              statusText: directResponse.statusText,
              parseError: e.message
            };
          }
          
          // 更新錯誤狀態碼
          if (!error.status && directResponse.status) {
            error.status = directResponse.status;
          }
        }
      } catch (fetchError) {
        console.error('Failed to fetch error details directly:', fetchError);
        if (!error.fetchError) error.fetchError = fetchError.message;
      }
    }

    const endTime = Date.now();
    const duration = endTime - startTime;
    console.log(`請求耗時: ${duration}ms`);

    // 隱藏思考動畫
    if (typingIndicator) {
      typingIndicator.style.display = 'none';
    }

    if (error) {
      console.error('AI 請求錯誤：', error);
      
      // 嘗試獲取服務器返回的詳細錯誤信息
      let serverError = null;
      if (error.context && error.context.body) {
        try {
          serverError = typeof error.context.body === 'string' 
            ? JSON.parse(error.context.body) 
            : error.context.body;
          console.error('服務器錯誤詳情：', serverError);
        } catch (e) {
          console.error('無法解析服務器錯誤：', error.context.body);
        }
      } else if (error.serverError) {
        // 使用直接調用獲取的錯誤信息
        serverError = error.serverError;
      }
      console.error('錯誤詳情：', JSON.stringify(error, null, 2));
      
      // 提供更詳細的錯誤訊息
      let errorMessage = '抱歉，發生錯誤：';
      
      // 檢查錯誤類型
      if (error.name === 'FunctionsHttpError') {
        errorMessage = `Edge Function 返回了錯誤狀態碼${error.status ? ` (${error.status})` : ''}`;
        
        if (error.status === 404) {
          errorMessage = 'Edge Function 未找到（404）。\n\n請確認已部署 ask-ai function：\n\n部署指令：\nsupabase functions deploy ask-ai';
        } else if (error.status === 401 || error.status === 403) {
          errorMessage = '認證失敗（401/403）。\n\n請檢查：\n1. Supabase Anon Key 是否正確\n2. 用戶是否已登入';
        } else if (error.status === 500) {
          errorMessage = '伺服器錯誤（500）';
          if (serverError && serverError.message) {
            errorMessage += `：${serverError.message}`;
          } else if (serverError && serverError.error) {
            errorMessage += `：${serverError.error}`;
          }
          errorMessage += '\n\n可能原因：\n1. Edge Function 內部錯誤\n2. 百度 API 配置問題\n3. API Key 格式不正確\n\n查看日誌：\nsupabase functions logs ask-ai';
        } else if (error.status === 400) {
          errorMessage = '請求格式錯誤（400）';
          if (serverError && serverError.message) {
            errorMessage += `：${serverError.message}`;
          }
        }
      } else if (error.message) {
        // 如果是網路錯誤或連接失敗
        if (error.message.includes('Failed to fetch') || 
            error.message.includes('NetworkError') ||
            error.message.includes('Failed to send')) {
          errorMessage = '無法連接到 Edge Function。\n\n請檢查：\n1. 網路連線是否正常\n2. Edge Function 是否已部署\n3. Supabase 配置是否正確';
        } else {
          errorMessage += error.message;
        }
      } else if (error.status) {
        errorMessage += `狀態碼：${error.status}`;
        if (serverError && serverError.message) {
          errorMessage += `\n${serverError.message}`;
        }
      } else {
        errorMessage += '未知錯誤，請查看瀏覽器控制台獲取詳細資訊';
      }
      
      addMessage('assistant', errorMessage);
      return;
    }

    console.log('收到回應：', data);

    if (data && data.response) {
      // 顯示 AI 回覆
      addMessage('assistant', data.response);
      
      // 保存 AI 回覆到資料庫
      await saveMessageToDB('assistant', data.response, currentSessionId);
      
      // 更新聊天歷史（用於 API 調用）
      chatHistory.push(
        { role: 'user', content: userMessage },
        { role: 'assistant', content: data.response }
      );
    } else {
      console.warn('回應格式異常：', data);
      const errorMsg = '抱歉，無法取得 AI 回覆。回應格式異常，請檢查 Edge Function 是否正常運作。';
      addMessage('assistant', errorMsg);
      // 不保存錯誤訊息到資料庫（可選：如果需要記錄錯誤，可以取消註解）
      // await saveMessageToDB('assistant', errorMsg, currentSessionId);
    }
  } catch (error) {
    console.error('AI 請求異常：', error);
    console.error('異常詳情：', error.stack);
    
    if (typingIndicator) {
      typingIndicator.style.display = 'none';
    }
    
    // 提供更詳細的錯誤訊息
    let errorMessage = '抱歉，發生錯誤：';
    
    if (error.message) {
      if (error.message.includes('Failed to fetch') || 
          error.message.includes('NetworkError') ||
          error.message.includes('Failed to send')) {
        errorMessage = '無法連接到 Edge Function。\n\n可能原因：\n1. 網路連線問題\n2. Edge Function 未部署\n3. CORS 設定問題\n\n解決方案：\n1. 檢查網路連線\n2. 執行：supabase functions deploy ask-ai\n3. 查看瀏覽器控制台獲取更多資訊';
      } else {
        errorMessage += error.message;
      }
    } else {
      errorMessage += '未知錯誤';
    }
    
    errorMessage += '\n\n💡 提示：打開瀏覽器開發者工具（F12）查看詳細錯誤訊息';
    
    addMessage('assistant', errorMessage);
  } finally {
    // 恢復輸入和按鈕
    input.disabled = false;
    sendBtn.disabled = false;
    input.focus();
  }
}

// 添加訊息到聊天窗口
function addMessage(role, content) {
  const messagesContainer = document.getElementById('ai-chatbot-messages');
  if (!messagesContainer) return;

  const messageDiv = document.createElement('div');
  messageDiv.className = `ai-message ai-message-${role}`;

  const now = new Date();
  const timeStr = now.toLocaleTimeString('zh-TW', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  if (role === 'user') {
    messageDiv.innerHTML = `
      <div class="ai-message-avatar">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
        </svg>
      </div>
      <div class="ai-message-content">
        <p>${escapeHtml(content)}</p>
        <p class="ai-message-time">${timeStr}</p>
      </div>
    `;
  } else {
    messageDiv.innerHTML = `
      <div class="ai-message-avatar">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
        </svg>
      </div>
      <div class="ai-message-content">
        <p>${formatMessageContent(content)}</p>
        <p class="ai-message-time">${timeStr}</p>
      </div>
    `;
  }

  messagesContainer.appendChild(messageDiv);
  
  // 滾動到底部
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// 格式化訊息內容（支援 Markdown 基本格式）
function formatMessageContent(content) {
  // 轉義 HTML
  let formatted = escapeHtml(content);
  
  // 簡單的 Markdown 轉換
  // 粗體 **text**
  formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  
  // 斜體 *text*
  formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>');
  
  // 換行
  formatted = formatted.replace(/\n/g, '<br>');
  
  return formatted;
}

// HTML 轉義
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 顯示錯誤訊息
function showErrorMessage(message) {
  const messagesContainer = document.getElementById('ai-chatbot-messages');
  if (messagesContainer) {
    addMessage('assistant', message);
  } else {
    alert(message);
  }
}

// ========== 大學查詢功能 ==========

// 檢查 Firestore 數據結構（用於調試）
async function checkFirestoreStructure() {
  if (!db) {
    console.error('Firestore 尚未初始化');
    return;
  }
  
  try {
    console.log('🔍 正在檢查 Firestore 數據結構...');
    
    // 讀取第一筆資料來查看結構
    const snapshot = await db.collection('universities')
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      console.warn('⚠️ universities 集合是空的，請先添加一些數據');
      return;
    }
    
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log('📄 文檔 ID:', doc.id);
      console.log('📋 數據結構:', data);
      console.log('🔑 所有欄位:', Object.keys(data));
      console.log('📊 詳細欄位資訊:');
      
      Object.keys(data).forEach(key => {
        const value = data[key];
        console.log(`  - ${key}: ${typeof value} = ${JSON.stringify(value)}`);
      });
    });
    
    // 讀取所有資料的欄位統計
    const allSnapshot = await db.collection('universities')
      .limit(10)
      .get();
    
    const allFields = new Set();
    allSnapshot.forEach(doc => {
      Object.keys(doc.data()).forEach(key => allFields.add(key));
    });
    
    console.log('📚 所有可能的欄位:', Array.from(allFields));
    
  } catch (error) {
    console.error('❌ 檢查數據結構失敗：', error);
    console.error('錯誤詳情:', error.message);
  }
}

// 去重大學資料（基於大學名稱）
function deduplicateUniversities(universities) {
  const uniqueUniversities = [];
  const seenNames = new Set();
  
  universities.forEach(uni => {
    // 使用標準化的名稱作為去重依據
    const name = (uni.name || uni.nameEn || '').trim().toLowerCase();
    if (name && !seenNames.has(name)) {
      seenNames.add(name);
      uniqueUniversities.push(uni);
    } else if (!name) {
      // 如果沒有名稱，也加入（可能是數據不完整）
      uniqueUniversities.push(uni);
    }
  });
  
  return uniqueUniversities;
}

// 載入所有大學（初始載入時）
async function loadUniversities() {
  if (!db) {
    console.error('Firestore 尚未初始化');
    return;
  }
  
  try {
    showLoading(true);
    
    // 先檢查數據結構（僅在開發時）
    if (console && console.log) {
      await checkFirestoreStructure();
    }
    
    // 從 Firestore 讀取所有大學資料
    const snapshot = await db.collection('universities').get();
    
    const universities = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      universities.push({
        id: doc.id,
        ...data
      });
    });
    
    // 去重：基於大學名稱
    const uniqueUniversities = deduplicateUniversities(universities);
    
    console.log(`✅ 成功載入 ${universities.length} 筆大學資料，去重後 ${uniqueUniversities.length} 筆`);
    displayUniversities(uniqueUniversities);
    showLoading(false);
  } catch (error) {
    console.error('載入大學資料失敗：', error);
    console.error('錯誤詳情:', error.message);
    showErrorMessage('載入大學資料失敗，請稍後再試');
    showLoading(false);
  }
}

// 搜尋大學
async function handleUniversitySearch() {
  if (!db) {
    console.error('Firestore 尚未初始化');
    showErrorMessage('Firebase 尚未初始化，請重新整理頁面');
    return;
  }
  
  const keyword = document.getElementById('uni-search-input')?.value.trim() || '';
  const location = document.getElementById('uni-location-filter')?.value || '';
  const type = document.getElementById('uni-type-filter')?.value || '';
  
  try {
    showLoading(true);
    
    let query = db.collection('universities');
    
    // 應用篩選器
    // 注意：由於 Firestore 的 where 查詢限制，我們先獲取所有數據，然後在前端篩選
    // 如果數據量很大，建議在 Firestore 中建立索引或使用更複雜的查詢策略
    
    // 先取得所有資料
    const snapshot = await query.get();
    
    let universities = [];
    snapshot.forEach(doc => {
      universities.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // 去重：基於大學名稱
    universities = deduplicateUniversities(universities);
    
    // 應用篩選器（在前端進行）
    if (location) {
      const lowerLocation = location.toLowerCase();
      universities = universities.filter(uni => {
        const city = (uni.city || '').toLowerCase();
        const district = (uni.district || '').toLowerCase();
        const address = (uni.address || '').toLowerCase();
        return city.includes(lowerLocation) || 
               district.includes(lowerLocation) ||
               address.includes(lowerLocation);
      });
    }
    
    if (type) {
      universities = universities.filter(uni => uni.type === type);
    }
    
    // 如果有關鍵字，在前端進行模糊搜尋
    if (keyword) {
      const lowerKeyword = keyword.toLowerCase();
      universities = universities.filter(uni => {
        const name = (uni.name || '').toLowerCase();
        const nameEn = (uni.nameEn || '').toLowerCase();
        const city = (uni.city || '').toLowerCase();
        const address = (uni.address || '').toLowerCase();
        const district = (uni.district || '').toLowerCase();
        
        // 檢查學科（metadata.disciplines）
        const disciplines = (uni.metadata?.disciplines || []).join(' ').toLowerCase();
        
        return name.includes(lowerKeyword) || 
               nameEn.includes(lowerKeyword) ||
               city.includes(lowerKeyword) || 
               address.includes(lowerKeyword) ||
               district.includes(lowerKeyword) ||
               disciplines.includes(lowerKeyword);
      });
    }
    
    displayUniversities(universities);
    showLoading(false);
  } catch (error) {
    console.error('搜尋大學失敗：', error);
    showErrorMessage('搜尋失敗，請稍後再試');
    showLoading(false);
  }
}

// 顯示大學列表
function displayUniversities(universities) {
  const resultsContainer = document.getElementById('uni-results');
  const emptyState = document.getElementById('uni-empty');
  
  if (!resultsContainer || !emptyState) {
    console.error('找不到必要的 DOM 元素');
    return;
  }
  
  // 清空結果
  resultsContainer.innerHTML = '';
  
  if (universities.length === 0) {
    resultsContainer.style.display = 'none';
    emptyState.style.display = 'block';
    return;
  }
  
  resultsContainer.style.display = 'grid';
  emptyState.style.display = 'none';
  
  // 渲染大學卡片
  universities.forEach(uni => {
    const card = createUniversityCard(uni);
    resultsContainer.appendChild(card);
  });
}

// 建立大學卡片
function createUniversityCard(uni) {
  const card = document.createElement('div');
  card.className = 'university-card bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden';
  
  // 大學資訊（根據實際 Firestore 數據結構）
  const name = uni.name || '未知大學';
  const nameEn = uni.nameEn || '';
  const city = uni.city || '';
  const district = uni.district || '';
  const address = uni.address || '';
  const location = city || district || address || '未知地區';
  const type = uni.type || ''; // "PUBLIC" 或 "PRIVATE"
  const typeDisplay = type === 'PUBLIC' ? '公立' : type === 'PRIVATE' ? '私立' : type;
  const website = uni.website || '';
  const founded = uni.founded || null;
  const ranking = uni.ranking || null;
  const contact = uni.contact || null;
  const tuition = uni.tuition || null;
  const disciplines = uni.metadata?.disciplines || [];
  const description = uni.description || '';
  
  // 格式化排名資訊
  let rankingText = '';
  if (ranking) {
    const rankings = [];
    if (ranking.domestic) rankings.push(`國內: ${ranking.domestic}`);
    if (ranking.qs) rankings.push(`QS: ${ranking.qs}`);
    if (ranking.timesHigherEd) rankings.push(`THE: ${ranking.timesHigherEd}`);
    rankingText = rankings.join(' | ');
  }
  
  card.innerHTML = `
    <div class="p-6">
      <div class="flex items-start justify-between mb-3">
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-gray-800 mb-1">${escapeHtml(name)}</h3>
          ${nameEn ? `<p class="text-sm text-gray-500 mb-2">${escapeHtml(nameEn)}</p>` : ''}
          <div class="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
            <span>${escapeHtml(location)}</span>
            ${founded ? `<span class="text-gray-400">• 成立於 ${founded}</span>` : ''}
          </div>
        </div>
        ${type ? `
          <span class="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full whitespace-nowrap">
            ${escapeHtml(typeDisplay)}
          </span>
        ` : ''}
      </div>
      
      ${rankingText ? `
        <div class="mb-3">
          <span class="text-sm text-gray-600">排名：</span>
          <span class="text-sm font-semibold text-gray-800">${escapeHtml(rankingText)}</span>
        </div>
      ` : ''}
      
      ${contact ? `
        <div class="mb-3 text-sm text-gray-600">
          ${contact.email ? `<div class="mb-1">📧 ${escapeHtml(contact.email)}</div>` : ''}
          ${contact.phone ? `<div>📞 ${escapeHtml(contact.phone)}</div>` : ''}
        </div>
      ` : ''}
      
      ${tuition ? `
        <div class="mb-3 text-sm">
          <div class="text-gray-600 mb-1">💰 學費：</div>
          ${tuition.undergraduate ? `
            <div class="text-gray-700">大學部：${tuition.undergraduate.perYear} ${tuition.undergraduate.currency}/年</div>
          ` : ''}
          ${tuition.graduate ? `
            <div class="text-gray-700">研究所：${tuition.graduate.perYear} ${tuition.graduate.currency}/年</div>
          ` : ''}
        </div>
      ` : ''}
      
      ${disciplines.length > 0 ? `
        <div class="mb-3">
          <div class="text-sm text-gray-600 mb-2">🏫 主要學科：</div>
          <div class="flex flex-wrap gap-1">
            ${disciplines.slice(0, 5).map(d => `
              <span class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">${escapeHtml(d)}</span>
            `).join('')}
            ${disciplines.length > 5 ? `<span class="px-2 py-1 text-gray-500 text-xs">+${disciplines.length - 5} 更多</span>` : ''}
          </div>
        </div>
      ` : ''}
      
      ${description ? `
        <p class="text-sm text-gray-600 mb-4 line-clamp-2">${escapeHtml(description)}</p>
      ` : ''}
      
      ${website ? `
        <a 
          href="${escapeHtml(website)}" 
          target="_blank" 
          rel="noopener noreferrer"
          class="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
          </svg>
          訪問官網
        </a>
      ` : ''}
    </div>
  `;
  
  return card;
}

// 顯示載入中
function showLoading(show) {
  const loadingEl = document.getElementById('uni-loading');
  if (loadingEl) {
    loadingEl.style.display = show ? 'block' : 'none';
  }
}

// 顯示錯誤訊息
function showErrorMessage(message) {
  const resultsContainer = document.getElementById('uni-results');
  const emptyState = document.getElementById('uni-empty');
  
  if (resultsContainer) {
    resultsContainer.innerHTML = `
      <div class="col-span-full bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <svg class="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <p class="text-red-600 text-lg">${escapeHtml(message)}</p>
      </div>
    `;
    resultsContainer.style.display = 'grid';
  }
  
  if (emptyState) {
    emptyState.style.display = 'none';
  }
}

// ========== 學術中心功能 ==========

// 載入學術中心數據
async function loadAcademicsData() {
  if (!currentUser) {
    console.error('用戶未登入');
    return;
  }

  try {
    // 載入目標設定
    await loadCurrentGoal();
    
    // 載入考程表
    await loadUpcomingExams();
    
    // 載入成績記錄
    await loadExamScores();
    
    // 計算進度
    await calculateProgress();
  } catch (error) {
    console.error('載入學術中心數據失敗：', error);
  }
}

// 載入當前目標
async function loadCurrentGoal() {
  if (!currentUser) return;

  const goalText = document.getElementById('goal-text');
  if (!goalText) return;

  // 從 localStorage 讀取目標信息
  let targetData = null;
  try {
    const stored = localStorage.getItem(`target_${currentUser.id}`);
    if (stored) {
      targetData = JSON.parse(stored);
    }
  } catch (error) {
    console.error('讀取目標信息失敗：', error);
  }

  // 如果 localStorage 中沒有，嘗試從 currentProfile 讀取（向後兼容）
  if (!targetData && currentProfile) {
    if (currentProfile.target_university_id && currentProfile.target_major_name) {
      targetData = {
        target_university_id: currentProfile.target_university_id,
        target_major_name: currentProfile.target_major_name,
        target_university_name: currentProfile.target_university_name || null,
        target_admission_score: currentProfile.target_admission_score || null
      };
    }
  }

  // 如果還是沒有，嘗試從 Supabase 讀取
  if (!targetData && supabase) {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('target_admission_score, target_university_id, target_major_name, target_university_name')
        .eq('id', currentUser.id)
        .single();
      
      // 如果字段不存在（400 错误），优雅地处理
      if (error) {
        // 如果是字段不存在的错误，忽略它
        if (error.code === 'PGRST116' || error.message?.includes('column') || error.message?.includes('field')) {
          // 字段不存在，忽略错误
          return;
        }
        // 其他错误才记录
        console.error('從數據庫讀取目標分數失敗：', error);
        return;
      }
      
      if (profile && profile.target_admission_score) {
        // 如果數據庫中有目標分數，但沒有完整的目標信息，至少確保 currentProfile 有這個值
        if (currentProfile) {
          currentProfile.target_admission_score = profile.target_admission_score;
          if (profile.target_university_id) currentProfile.target_university_id = profile.target_university_id;
          if (profile.target_major_name) currentProfile.target_major_name = profile.target_major_name;
          if (profile.target_university_name) currentProfile.target_university_name = profile.target_university_name;
        }
      }
    } catch (error) {
      // 忽略字段不存在的错误
      if (error?.code !== 'PGRST116' && !error?.message?.includes('column') && !error?.message?.includes('field')) {
        console.error('從數據庫讀取目標分數失敗：', error);
      }
    }
  }

  if (targetData && targetData.target_university_id && targetData.target_major_name) {
    try {
      const universityId = targetData.target_university_id;
      const majorName = targetData.target_major_name;
      let uniName = targetData.target_university_name;

      // 如果沒有大學名稱，嘗試從 Firebase 獲取
      if (!uniName && db) {
        const uniDoc = await db.collection('universities').doc(universityId).get();
        if (uniDoc.exists) {
          const uniData = uniDoc.data();
          uniName = uniData.name || uniData.nameEn || '未知大學';
        }
      }

      // 確保目標分數同步到 currentProfile
      if (targetData.target_admission_score && currentProfile) {
        currentProfile.target_admission_score = targetData.target_admission_score;
      }

      if (uniName) {
        goalText.textContent = `${uniName} - ${majorName}`;
      } else {
        goalText.textContent = `大學 ID: ${universityId} - ${majorName}`;
      }
    } catch (error) {
      console.error('載入大學資訊失敗：', error);
      goalText.textContent = `${targetData.target_major_name}`;
    }
  } else {
    goalText.textContent = '尚未設定目標';
  }
}

// 處理圖片或PDF上傳
async function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  // 檢查文件類型（支持圖片和PDF）
  const isImage = file.type.startsWith('image/');
  const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  
  if (!isImage && !isPDF) {
    alert('請上傳圖片文件（JPG、PNG）或PDF文件');
    return;
  }

  // 檢查文件大小（限制 10MB）
  if (file.size > 10 * 1024 * 1024) {
    alert('文件大小不能超過 10MB');
    return;
  }

  const loadingEl = document.getElementById('schedule-loading');
  if (loadingEl) loadingEl.style.display = 'block';

  try {
    let base64;
    
    // 如果是PDF，先轉換為圖片
    if (isPDF) {
      console.log('檢測到PDF文件，正在轉換為圖片...');
      base64 = await pdfToImage(file);
    } else {
      // 讀取圖片文件並轉換為 Base64
      base64 = await fileToBase64(file);
    }
    
    // 移除 data:image/... 前綴（如果有的話）
    const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;

    // 獲取組別選擇
    const streamSelect = document.getElementById('stream-select');
    const selectedStream = streamSelect ? streamSelect.value : 'general';
    
    console.log('選擇的組別：', selectedStream);

    // 準備請求體（包含組別信息）
    const requestBody = { 
      image: base64Data,
      stream: selectedStream
    };

    // 呼叫 Edge Function（嘗試使用 Supabase 客戶端）
    let data, error;
    
    try {
      const result = await supabase.functions.invoke('process-schedule', {
        body: requestBody
      });
      data = result.data;
      error = result.error;
    } catch (invokeError) {
      console.error('調用 Edge Function 時發生異常:', invokeError);
      error = invokeError;
    }

    // 如果使用 Supabase 客戶端失敗，嘗試直接調用 Edge Function
    if (error && (error.message?.includes('Failed to send') || error.name === 'FunctionsHttpError')) {
      console.warn('Supabase 客戶端調用失敗，嘗試直接調用 Edge Function...');
      
      try {
        const functionUrl = `${SUPABASE_URL}/functions/v1/process-schedule`;
        const directResponse = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'apikey': SUPABASE_ANON_KEY
          },
          body: JSON.stringify(requestBody)
        });
        
        const responseText = await directResponse.text();
        console.log('直接調用響應狀態:', directResponse.status);
        console.log('直接調用響應文本（前500字符）:', responseText.substring(0, 500));
        
        if (directResponse.ok) {
          try {
            const successData = JSON.parse(responseText);
            data = successData;
            error = null;
            console.log('✅ 直接調用成功');
          } catch (parseError) {
            console.error('解析響應 JSON 失敗:', parseError);
            throw new Error('Edge Function 返回了無效的 JSON 格式');
          }
        } else {
          // 嘗試解析錯誤訊息
          let errorMessage = `HTTP ${directResponse.status}: ${directResponse.statusText}`;
          try {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.message || errorData.error || errorMessage;
            if (errorData.hint) {
              errorMessage += `\n提示: ${errorData.hint}`;
            }
          } catch (e) {
            errorMessage += `\n響應: ${responseText.substring(0, 200)}`;
          }
          throw new Error(errorMessage);
        }
      } catch (fetchError) {
        console.error('直接調用也失敗:', fetchError);
        throw new Error(`無法連接到 Edge Function: ${fetchError.message}\n\n請確認：\n1. Edge Function 已部署（運行: supabase functions deploy process-schedule）\n2. 百度 API 配置已設置（運行: supabase secrets set BAIDU_API_KEY=... BAIDU_SECRET_KEY=...）`);
      }
    }

    if (error) {
      // 提供更詳細的錯誤訊息
      let errorMessage = error.message || '未知錯誤';
      
      if (error.message?.includes('百度 API 配置未設定')) {
        errorMessage = '百度 OCR API 配置未設定\n\n請運行以下命令設置：\nsupabase secrets set BAIDU_API_KEY=your_key BAIDU_SECRET_KEY=your_secret\n\n然後重新部署：\nsupabase functions deploy process-schedule';
      } else if (error.message?.includes('無法獲取百度 Access Token')) {
        errorMessage = '無法獲取百度 Access Token\n\n請檢查：\n1. BAIDU_API_KEY 和 BAIDU_SECRET_KEY 是否正確\n2. 百度千帆平台帳號狀態是否正常\n3. API 配額是否已用完';
      } else if (error.message?.includes('OCR 識別失敗')) {
        errorMessage = 'OCR 識別失敗\n\n請確認：\n1. 圖片清晰且包含完整的考試時間表\n2. 圖片格式正確（支持 JPG、PNG 等）\n3. 圖片大小不超過 10MB';
      }
      
      throw new Error(errorMessage);
    }

    if (!data || !data.success || !data.schedules || data.schedules.length === 0) {
      throw new Error('無法從圖片中提取考程表，請確認圖片清晰且包含完整的考試時間表');
    }

    // 將考程表存入資料庫
    const schedules = data.schedules.map(schedule => {
      // 處理 exam_type：支持英文和中文格式
      let examType = 'exam'; // 默認為考試
      if (schedule.exam_type === 'test' || schedule.exam_type === '測驗') {
        examType = 'test';
      } else if (schedule.exam_type === 'exam' || schedule.exam_type === '考試') {
        examType = 'exam';
      }
      
      return {
        user_id: currentUser.id,
        subject: schedule.subject,
        exam_date: schedule.exam_date,
        exam_time: schedule.exam_time || null,
        exam_type: examType
      };
    });

    const { error: insertError } = await supabase
      .from('exam_schedules')
      .insert(schedules);

    if (insertError) {
      throw insertError;
    }

    // 立即重新載入考程表（在顯示提示之前）
    await loadUpcomingExams();
    
    // 顯示成功訊息
    alert(`成功新增 ${schedules.length} 項考試到考程表！`);
    
    // 清空文件輸入
    event.target.value = '';

  } catch (error) {
    console.error('處理圖片失敗：', error);
    alert('處理圖片失敗：' + (error.message || '未知錯誤'));
  } finally {
    if (loadingEl) loadingEl.style.display = 'none';
  }
}

// 將文件轉換為 Base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// 將PDF轉換為圖片（Base64）
async function pdfToImage(file) {
  return new Promise(async (resolve, reject) => {
    try {
      // 設置PDF.js worker
      if (typeof pdfjsLib !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      } else {
        throw new Error('PDF.js 庫未載入，請確認已引入 pdf.min.js');
      }

      // 讀取PDF文件
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      // 獲取第一頁（考程表通常在第一頁）
      const page = await pdf.getPage(1);
      
      // 設置渲染選項（提高分辨率以獲得更好的OCR效果）
      const viewport = page.getViewport({ scale: 2.0 }); // 2倍縮放提高清晰度
      
      // 創建canvas
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      // 渲染PDF頁面到canvas
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;
      
      // 將canvas轉換為Base64圖片
      const imageData = canvas.toDataURL('image/png');
      console.log('✅ PDF轉換為圖片成功，尺寸：', canvas.width, 'x', canvas.height);
      
      resolve(imageData);
    } catch (error) {
      console.error('❌ PDF轉換失敗：', error);
      reject(new Error('PDF轉換失敗：' + (error.message || '未知錯誤')));
    }
  });
}

// 載入即將到來的考試
async function loadUpcomingExams() {
  if (!currentUser) return;

  try {
    // 使用本地時間獲取今天的日期字符串（YYYY-MM-DD）
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    // 查詢所有考程表（包括過期的）
    const { data: schedules, error: schedulesError } = await supabase
      .from('exam_schedules')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('exam_date', { ascending: true });
    
    if (schedulesError) throw schedulesError;

    // 查詢所有成績記錄（用於檢查哪些考試已有成績）
    let scoresMap = {};
    try {
      const { data: scores, error: scoresError } = await supabase
        .from('exam_scores')
        .select('*')
        .eq('user_id', currentUser.id);
      
      if (!scoresError && scores) {
        // 建立 schedule_id 到成績的映射
        scores.forEach(score => {
          if (score.schedule_id) {
            scoresMap[score.schedule_id] = score;
          }
        });
      }
    } catch (scoresErr) {
      // 如果 exam_scores 表不存在或查詢失敗，忽略錯誤，繼續顯示考程表
      console.warn('查詢成績記錄失敗（將繼續顯示考程表）：', scoresErr);
    }
    
    // 在客戶端按日期和時間排序
    if (schedules) {
      schedules.sort((a, b) => {
        if (a.exam_date !== b.exam_date) {
          return a.exam_date.localeCompare(b.exam_date);
        }
        const timeA = a.exam_time || '';
        const timeB = b.exam_time || '';
        return timeA.localeCompare(timeB);
      });
    }

    const examsList = document.getElementById('exam-schedule-list');
    const examsEmpty = document.getElementById('exams-empty');

    if (!examsList) {
      console.warn('找不到 exam-schedule-list 容器');
      return;
    }

    if (!examsEmpty) {
      console.warn('找不到 exams-empty 容器');
    }

    // 控制清空按鈕的顯示/隱藏
    const clearAllBtn = document.getElementById('clear-all-exams-btn');
    if (clearAllBtn) {
      if (schedules && schedules.length > 0) {
        clearAllBtn.style.display = 'flex';
      } else {
        clearAllBtn.style.display = 'none';
      }
    }

    // 判斷是否有資料
    if (!schedules || schedules.length === 0) {
      examsList.innerHTML = '';
      examsList.style.display = 'none';
      if (examsEmpty) {
        examsEmpty.style.display = 'block';
      }
      return;
    }

    // 顯示列表，隱藏空狀態
    examsList.style.display = 'block';
    if (examsEmpty) {
      examsEmpty.style.display = 'none';
    }

    // 渲染時間軸列表
    renderExamScheduleList(examsList, schedules, scoresMap, today);

  } catch (error) {
    // 如果表不存在（404/PGRST205），优雅地处理，不显示错误
    if (error?.code === 'PGRST205' || error?.message?.includes('Could not find the table')) {
      const examsList = document.getElementById('exam-schedule-list');
      const examsEmpty = document.getElementById('exams-empty');
      const clearAllBtn = document.getElementById('clear-all-exams-btn');
      
      if (examsList) {
        examsList.innerHTML = '';
        examsList.style.display = 'none';
      }
      if (examsEmpty) {
        examsEmpty.style.display = 'block';
      }
      if (clearAllBtn) {
        clearAllBtn.style.display = 'none';
      }
      return;
    }
    console.error('載入考程表失敗：', error);
  }
}

// 渲染考程表列表（時間軸樣式）
function renderExamScheduleList(container, schedules, scoresMap, today) {
  container.innerHTML = '';
  
  // 創建時間軸容器
  const timeline = document.createElement('div');
  timeline.className = 'exam-timeline space-y-4';
  
  schedules.forEach((exam, index) => {
    // 解析考試日期（使用本地時間，避免時區問題）
    // exam.exam_date 格式應該是 "YYYY-MM-DD"
    const [year, month, day] = exam.exam_date.split('-').map(Number);
    const examDate = new Date(year, month - 1, day, 0, 0, 0, 0);
    
    // 使用傳入的 today 參數創建今天的日期對象（確保一致性）
    const [todayYear, todayMonth, todayDay] = today.split('-').map(Number);
    const todayDate = new Date(todayYear, todayMonth - 1, todayDay, 0, 0, 0, 0);
    
    // 計算距離今天的天數（使用 Math.floor，因為我們已經設置了時間為 0:0:0:0）
    const daysDiff = Math.floor((examDate - todayDate) / (1000 * 60 * 60 * 24));
    
    // 判斷狀態：先判斷是否為今天，再判斷是否為過去
    const isToday = daysDiff === 0;
    const isPast = daysDiff < 0;
    const isUpcoming = daysDiff > 0 && daysDiff <= 7;
    
    // 格式化日期顯示
    const dateDisplay = examDate.toLocaleDateString('zh-TW', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      weekday: 'short'
    });
    
    // 格式化時間顯示
    const timeDisplay = exam.exam_time || '時間未定';
    const typeDisplay = exam.exam_type === 'test' ? '測驗' : '考試';
    
    // 判斷狀態樣式
    let statusClass = '';
    let statusText = '';
    let statusIcon = '';
    
    if (isPast) {
      statusClass = 'text-gray-400 bg-gray-50 border-gray-200';
      statusText = '已過期';
      statusIcon = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';
    } else if (isToday) {
      statusClass = 'text-orange-600 bg-orange-50 border-orange-300';
      statusText = '今天';
      statusIcon = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';
    } else if (isUpcoming) {
      statusClass = 'text-red-600 bg-red-50 border-red-300';
      statusText = `還有 ${daysDiff} 天`;
      statusIcon = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>';
    } else {
      statusClass = 'text-blue-600 bg-blue-50 border-blue-300';
      statusText = `還有 ${daysDiff} 天`;
      statusIcon = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>';
    }
    
    const score = scoresMap[exam.id] || null;
    
    // 創建考試卡片
    const examCard = document.createElement('div');
    examCard.className = `exam-schedule-item ${isPast ? 'opacity-60' : ''} bg-white rounded-lg border-l-4 ${statusClass.split(' ')[2]} shadow-sm hover:shadow-md transition-all duration-200`;
    
    // 成績區塊
    let scoreSection = '';
    if (score) {
      const percentage = ((score.score_obtained / score.full_marks) * 100).toFixed(1);
      scoreSection = `
        <div class="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-gray-700">已填寫分數：</span>
            <span class="text-lg font-bold text-green-600">${score.score_obtained} / ${score.full_marks} (${percentage}%)</span>
          </div>
        </div>
      `;
    } else {
      // 無論是否過期，都可以填入分數
      scoreSection = `
        <div class="mt-3">
          <button 
            onclick="openScoreModal('${exam.id}', '${escapeHtml(exam.subject)}', '${exam.exam_date}', '${timeDisplay}')" 
            class="w-full px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors duration-200 flex items-center justify-center gap-2 ${isPast ? 'opacity-90' : ''}"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
            </svg>
            填寫分數
          </button>
        </div>
      `;
    }
    
    examCard.innerHTML = `
      <div class="p-4">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-2">
              <h4 class="font-semibold text-lg ${isPast ? 'text-gray-500' : 'text-gray-800'}">${escapeHtml(exam.subject)}</h4>
              <span class="px-2 py-1 text-xs font-semibold rounded ${exam.exam_type === 'test' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}">${typeDisplay}</span>
            </div>
            
            <div class="flex items-center gap-4 text-sm ${isPast ? 'text-gray-400' : 'text-gray-600'}">
              <div class="flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                <span class="font-medium">${dateDisplay}</span>
              </div>
              ${exam.exam_time ? `
                <div class="flex items-center gap-1">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span>${timeDisplay}</span>
                </div>
              ` : ''}
              <div class="flex items-center gap-1 ${statusClass} px-2 py-1 rounded">
                ${statusIcon}
                <span class="text-xs font-medium">${statusText}</span>
              </div>
            </div>
            
            ${scoreSection}
          </div>
          
          <button 
            onclick="event.stopPropagation(); deleteExamSchedule('${exam.id}')" 
            class="ml-4 text-red-500 hover:text-red-700 p-2 rounded hover:bg-red-50 transition-colors flex-shrink-0"
            title="刪除"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
          </button>
        </div>
      </div>
    `;
    
    timeline.appendChild(examCard);
  });
  
  container.appendChild(timeline);
}

// 創建考試項目元素
function createExamItem(exam, score = null) {
  const item = document.createElement('div');
  item.className = 'exam-schedule-card bg-white rounded-lg p-4 border-l-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer';
  
  // 解析考試日期（使用本地時間，避免時區問題）
  const [year, month, day] = exam.exam_date.split('-').map(Number);
  const examDate = new Date(year, month - 1, day, 0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // 計算距離今天的天數（使用 Math.floor，因為我們已經設置了時間為 0:0:0:0）
  const daysUntil = Math.floor((examDate - today) / (1000 * 60 * 60 * 24));
  
  // 判斷是否即將到來（7天內，且是未來）
  const isUpcoming = daysUntil > 0 && daysUntil <= 7;
  const borderColor = isUpcoming ? 'border-red-500' : 'border-blue-500';
  item.className = `exam-schedule-card bg-white rounded-lg p-4 border-l-4 ${borderColor} shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer`;

  const dateStr = examDate.toLocaleDateString('zh-TW', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    weekday: 'short'
  });

  const timeStr = exam.exam_time || '時間未定';
  const typeStr = exam.exam_type === 'test' ? '測驗' : '考試';
  const upcomingBadge = isUpcoming ? 
    `<span class="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded">即將到來</span>` : '';

  // 如果有成績，顯示分數；否則顯示填寫分數按鈕
  let scoreSection = '';
  if (score) {
    const percentage = ((score.score_obtained / score.full_marks) * 100).toFixed(1);
    scoreSection = `
      <div class="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-gray-700">已填寫分數：</span>
          <span class="text-lg font-bold text-green-600">${score.score_obtained} / ${score.full_marks} (${percentage}%)</span>
        </div>
      </div>
    `;
  } else {
    scoreSection = `
      <div class="mt-3">
        <button 
          onclick="openScoreModal('${exam.id}', '${escapeHtml(exam.subject)}', '${exam.exam_date}', '${timeStr}')" 
          class="w-full px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors duration-200 flex items-center justify-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
          </svg>
          填寫分數
        </button>
      </div>
    `;
  }

  item.innerHTML = `
    <div class="flex items-center justify-between">
      <div class="flex-1">
        <h4 class="font-semibold text-gray-800 text-lg">${escapeHtml(exam.subject)}</h4>
        <p class="text-sm text-gray-600 mt-1">
          <span class="font-medium">${dateStr}</span>
          ${exam.exam_time ? `<span class="ml-2">${timeStr}</span>` : ''}
          <span class="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">${typeStr}</span>
          ${upcomingBadge}
        </p>
        ${scoreSection}
      </div>
      <button 
        onclick="event.stopPropagation(); deleteExamSchedule('${exam.id}')" 
        class="ml-4 text-red-500 hover:text-red-700 p-2 rounded hover:bg-red-50 transition-colors"
        title="刪除"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
        </svg>
      </button>
    </div>
  `;

  return item;
}

// 刪除考程表項目
async function deleteExamSchedule(examId) {
  if (!confirm('確定要刪除這項考試嗎？')) return;

  try {
    const { error } = await supabase
      .from('exam_schedules')
      .delete()
      .eq('id', examId)
      .eq('user_id', currentUser.id);

    if (error) throw error;

    await loadUpcomingExams();
  } catch (error) {
    console.error('刪除考試失敗：', error);
    alert('刪除失敗：' + (error.message || '未知錯誤'));
  }
}

// 一鍵清空所有考程表
async function clearAllExamSchedules() {
  try {
    // 先獲取所有考程表記錄進行去重檢查
    const { data: allSchedules, error: fetchError } = await supabase
      .from('exam_schedules')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: true });

    if (fetchError) throw fetchError;

    if (!allSchedules || allSchedules.length === 0) {
      alert('考程表已經是空的');
      return;
    }

    // 檢查並去重重複記錄
    // 重複定義：相同的 subject、exam_date、exam_time、exam_type
    const seen = new Map();
    const duplicatesToDelete = [];
    let duplicateCount = 0;

    allSchedules.forEach(schedule => {
      // 創建唯一鍵：subject + exam_date + exam_time + exam_type
      const key = `${schedule.subject}|${schedule.exam_date}|${schedule.exam_time || ''}|${schedule.exam_type}`;
      
      if (seen.has(key)) {
        // 找到重複，保留最早創建的（seen 中的），刪除當前這個
        duplicatesToDelete.push(schedule.id);
        duplicateCount++;
      } else {
        // 第一次見到，記錄下來
        seen.set(key, schedule);
      }
    });

    // 如果有重複記錄，先自動去重
    if (duplicatesToDelete.length > 0) {
      const { error: dedupeError } = await supabase
        .from('exam_schedules')
        .delete()
        .in('id', duplicatesToDelete);

      if (dedupeError) throw dedupeError;

      // 重新載入以更新顯示
      await loadUpcomingExams();
      
      // 顯示去重訊息
      const continueClear = confirm(
        `✓ 已自動去重 ${duplicateCount} 筆重複記錄\n\n` +
        `⚠️ 警告：是否要繼續清空所有剩餘的考程表記錄？\n此操作無法復原！`
      );
      
      if (!continueClear) {
        return; // 用戶取消，只去重不清空
      }
    } else {
      // 沒有重複記錄，直接確認清空
      const confirmed = confirm('⚠️ 警告：此操作將刪除所有考程表記錄，且無法復原！\n\n確定要清空所有考程表嗎？');
      if (!confirmed) return;
    }

    // 刪除所有剩餘的記錄
    const { error: deleteError } = await supabase
      .from('exam_schedules')
      .delete()
      .eq('user_id', currentUser.id);

    if (deleteError) throw deleteError;

    // 重新載入考程表（會顯示空狀態）
    await loadUpcomingExams();
    
    // 顯示成功訊息
    let message = '✓ 已成功清空所有考程表';
    if (duplicateCount > 0) {
      message += `\n（已自動去重 ${duplicateCount} 筆重複記錄）`;
    }
    alert(message);
  } catch (error) {
    console.error('清空考程表失敗：', error);
    alert('清空失敗：' + (error.message || '未知錯誤'));
  }
}

// 載入成績記錄
async function loadExamScores() {
  if (!currentUser) return;

  try {
    const { data, error } = await supabase
      .from('exam_scores')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const scoresList = document.getElementById('scores-list');
    const scoresEmpty = document.getElementById('scores-empty');

    if (!scoresList || !scoresEmpty) return;

    if (!data || data.length === 0) {
      scoresList.innerHTML = '';
      scoresList.style.display = 'none';
      scoresEmpty.style.display = 'block';
      return;
    }

    scoresList.innerHTML = '';
    scoresList.style.display = 'block';
    scoresEmpty.style.display = 'none';

    // 按科目分組
    const scoresBySubject = {};
    data.forEach(score => {
      if (!scoresBySubject[score.subject]) {
        scoresBySubject[score.subject] = [];
      }
      scoresBySubject[score.subject].push(score);
    });

    Object.keys(scoresBySubject).forEach(subject => {
      const subjectScores = scoresBySubject[subject];
      const subjectDiv = document.createElement('div');
      subjectDiv.className = 'mb-4 p-4 bg-gray-50 rounded-lg';
      
      subjectDiv.innerHTML = `
        <h4 class="font-semibold text-gray-800 mb-2">${escapeHtml(subject)}</h4>
        <div class="space-y-2">
          ${subjectScores.map(score => createScoreItem(score)).join('')}
        </div>
      `;
      
      scoresList.appendChild(subjectDiv);
    });

  } catch (error) {
    // 如果表不存在（404/PGRST205），优雅地处理，不显示错误
    if (error?.code === 'PGRST205' || error?.message?.includes('Could not find the table')) {
      const scoresList = document.getElementById('scores-list');
      const scoresEmpty = document.getElementById('scores-empty');
      if (scoresList && scoresEmpty) {
        scoresList.innerHTML = '';
        scoresList.style.display = 'none';
        scoresEmpty.style.display = 'block';
      }
      return;
    }
    console.error('載入成績記錄失敗：', error);
  }
}

// 創建成績項目元素
function createScoreItem(score) {
  const typeMap = {
    'test_score': '測驗',
    'exam_score': '考試',
    'daily_performance': '日常表現'
  };
  const typeStr = typeMap[score.type] || score.type;
  const percentage = ((score.score_obtained / score.full_marks) * 100).toFixed(1);
  const dateStr = new Date(score.created_at).toLocaleDateString('zh-TW');

  return `
    <div class="flex items-center justify-between p-2 bg-white rounded">
      <div class="flex-1">
        <span class="text-sm font-medium text-gray-700">${typeStr}</span>
        <span class="ml-2 text-sm text-gray-600">${score.score_obtained} / ${score.full_marks} (${percentage}%)</span>
        <span class="ml-2 text-xs text-gray-500">${dateStr}</span>
      </div>
      <button 
        onclick="deleteExamScore('${score.id}')" 
        class="ml-2 text-red-500 hover:text-red-700 text-sm"
        title="刪除"
      >
        刪除
      </button>
    </div>
  `;
}

// 刪除成績記錄
async function deleteExamScore(scoreId) {
  if (!confirm('確定要刪除這筆成績嗎？')) return;

  try {
    const { error } = await supabase
      .from('exam_scores')
      .delete()
      .eq('id', scoreId)
      .eq('user_id', currentUser.id);

    if (error) throw error;

    await loadExamScores();
    await calculateProgress();
  } catch (error) {
    console.error('刪除成績失敗：', error);
    alert('刪除失敗：' + (error.message || '未知錯誤'));
  }
}

// 打開分數輸入模態框
function openScoreModal(scheduleId, subject, examDate, examTime) {
  const modal = new bootstrap.Modal(document.getElementById('scoreModal'));
  
  // 設置表單值
  document.getElementById('modal-schedule-id').value = scheduleId;
  document.getElementById('modal-exam-subject').value = subject;
  
  // 格式化日期顯示（使用本地時間，避免時區問題）
  const [year, month, day] = examDate.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day, 0, 0, 0, 0);
  const dateStr = dateObj.toLocaleDateString('zh-TW', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    weekday: 'short'
  });
  document.getElementById('modal-exam-date').value = `${dateStr} ${examTime || ''}`.trim();
  
  // 重置輸入框
  document.getElementById('modal-score-obtained').value = '';
  document.getElementById('modal-score-full-marks').value = '100';
  
  // 打開模態框
  modal.show();
}

// 處理分數輸入模態框的保存
async function handleScoreModalSave() {
  if (!currentUser) {
    alert('請先登入');
    return;
  }

  const scheduleId = document.getElementById('modal-schedule-id').value;
  const subject = document.getElementById('modal-exam-subject').value.trim();
  const scoreObtained = parseFloat(document.getElementById('modal-score-obtained').value);
  const fullMarks = parseFloat(document.getElementById('modal-score-full-marks').value);

  if (!scheduleId || !subject || isNaN(scoreObtained) || isNaN(fullMarks) || fullMarks <= 0) {
    alert('請填寫完整的成績資訊');
    return;
  }

  if (scoreObtained < 0 || scoreObtained > fullMarks) {
    alert('得分不能小於 0 或大於滿分');
    return;
  }

  try {
    // 先查詢該考試的類型（從 exam_schedules 表）
    const { data: schedule, error: scheduleError } = await supabase
      .from('exam_schedules')
      .select('exam_type')
      .eq('id', scheduleId)
      .eq('user_id', currentUser.id)
      .single();

    if (scheduleError) throw scheduleError;

    // 根據 exam_type 決定 type
    const type = schedule.exam_type === 'test' ? 'test_score' : 'exam_score';

    // 插入成績記錄，關聯 schedule_id
    const { error } = await supabase
      .from('exam_scores')
      .insert({
        user_id: currentUser.id,
        schedule_id: scheduleId,
        subject: subject,
        type: type,
        score_obtained: scoreObtained,
        full_marks: fullMarks
      });

    if (error) throw error;

    // 關閉模態框
    const modal = bootstrap.Modal.getInstance(document.getElementById('scoreModal'));
    if (modal) {
      modal.hide();
    }

    // 重新載入考程表和進度
    await loadUpcomingExams();
    await loadExamScores();
    await calculateProgress();

    alert('成績已成功記錄！');

  } catch (error) {
    console.error('新增成績失敗：', error);
    alert('新增成績失敗：' + (error.message || '未知錯誤'));
  }
}

// 處理成績輸入表單（保留以備後用，但現在主要使用 Modal）
async function handleScoreInputSubmit(event) {
  event.preventDefault();

  if (!currentUser) {
    alert('請先登入');
    return;
  }

  const subject = document.getElementById('score-subject')?.value.trim();
  const type = document.getElementById('score-type')?.value;
  const scoreObtained = parseFloat(document.getElementById('score-obtained')?.value);
  const fullMarks = parseFloat(document.getElementById('score-full-marks')?.value);

  if (!subject || isNaN(scoreObtained) || isNaN(fullMarks) || fullMarks <= 0) {
    alert('請填寫完整的成績資訊');
    return;
  }

  if (scoreObtained < 0 || scoreObtained > fullMarks) {
    alert('得分不能小於 0 或大於滿分');
    return;
  }

  try {
    const { error } = await supabase
      .from('exam_scores')
      .insert({
        user_id: currentUser.id,
        subject: subject,
        type: type,
        score_obtained: scoreObtained,
        full_marks: fullMarks
      });

    if (error) throw error;

    // 清空表單
    event.target.reset();
    if (document.getElementById('score-full-marks')) {
      document.getElementById('score-full-marks').value = '100';
    }

    // 重新載入成績和進度
    await loadExamScores();
    await calculateProgress();

    alert('成績已成功記錄！');

  } catch (error) {
    console.error('新增成績失敗：', error);
    alert('新增成績失敗：' + (error.message || '未知錯誤'));
  }
}

// 計算進度
async function calculateProgress() {
  if (!currentUser || !currentProfile) return;

  // 先嘗試從 currentProfile 獲取目標分數
  let targetScore = currentProfile.target_admission_score;
  
  // 如果沒有，嘗試從 localStorage 讀取
  if (!targetScore) {
    try {
      const stored = localStorage.getItem(`target_${currentUser.id}`);
      if (stored) {
        const targetData = JSON.parse(stored);
        if (targetData.target_admission_score) {
          targetScore = targetData.target_admission_score;
          // 同步到 currentProfile
          currentProfile.target_admission_score = targetScore;
        }
      }
    } catch (error) {
      console.error('讀取目標分數失敗：', error);
    }
  }
  
  // 如果還是沒有，嘗試從 Supabase 讀取
  if (!targetScore && supabase) {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('target_admission_score')
        .eq('id', currentUser.id)
        .single();
      
      // 如果字段不存在（400 错误），优雅地处理
      if (error) {
        // 如果是字段不存在的错误，忽略它
        if (error.code === 'PGRST116' || error.message?.includes('column') || error.message?.includes('field')) {
          // 字段不存在，忽略错误
          return null;
        }
        // 其他错误才记录
        console.error('從數據庫讀取目標分數失敗：', error);
        return null;
      }
      
      if (profile && profile.target_admission_score) {
        targetScore = profile.target_admission_score;
        currentProfile.target_admission_score = targetScore;
      }
    } catch (error) {
      // 忽略字段不存在的错误
      if (error?.code !== 'PGRST116' && !error?.message?.includes('column') && !error?.message?.includes('field')) {
        console.error('從數據庫讀取目標分數失敗：', error);
      }
    }
  }

  if (!targetScore) {
    // 如果沒有設定目標，顯示提示
    const currentScoreEl = document.getElementById('current-weighted-score');
    const targetScoreEl = document.getElementById('target-score-display');
    const gapEl = document.getElementById('score-gap');
    const messageEl = document.getElementById('progress-message');

    if (currentScoreEl) currentScoreEl.textContent = '-';
    if (targetScoreEl) targetScoreEl.textContent = '-';
    if (gapEl) gapEl.textContent = '-';
    if (messageEl) {
      messageEl.innerHTML = '<p class="text-gray-600">請先設定目標以查看進度</p>';
    }
    return;
  }

  try {
    // 獲取所有成績
    const { data: scores, error } = await supabase
      .from('exam_scores')
      .select('*')
      .eq('user_id', currentUser.id);

    if (error) throw error;

    if (!scores || scores.length === 0) {
      const currentScoreEl = document.getElementById('current-weighted-score');
      const targetScoreEl = document.getElementById('target-score-display');
      const gapEl = document.getElementById('score-gap');
      const messageEl = document.getElementById('progress-message');

      if (currentScoreEl) currentScoreEl.textContent = '-';
      if (targetScoreEl) targetScoreEl.textContent = targetScore.toFixed(1);
      if (gapEl) gapEl.textContent = '-';
      if (messageEl) {
        messageEl.innerHTML = '<p class="text-gray-600">請輸入成績以查看進度</p>';
      }
      return;
    }

    // 按科目分組計算
    const subjectScores = {};
    scores.forEach(score => {
      if (!subjectScores[score.subject]) {
        subjectScores[score.subject] = {
          test_scores: [],
          exam_scores: [],
          daily_scores: []
        };
      }
      
      const percentage = (score.score_obtained / score.full_marks) * 100;
      
      if (score.type === 'test_score') {
        subjectScores[score.subject].test_scores.push(percentage);
      } else if (score.type === 'exam_score') {
        subjectScores[score.subject].exam_scores.push(percentage);
      } else if (score.type === 'daily_performance') {
        subjectScores[score.subject].daily_scores.push(percentage);
      }
    });

    // 計算每個科目的加權總分
    let totalWeightedScore = 0;
    let subjectCount = 0;

    Object.keys(subjectScores).forEach(subject => {
      const subj = subjectScores[subject];
      
      // 計算平均值
      const avgTest = subj.test_scores.length > 0 
        ? subj.test_scores.reduce((a, b) => a + b, 0) / subj.test_scores.length 
        : 0;
      const avgExam = subj.exam_scores.length > 0 
        ? subj.exam_scores.reduce((a, b) => a + b, 0) / subj.exam_scores.length 
        : 0;
      const avgDaily = subj.daily_scores.length > 0 
        ? subj.daily_scores.reduce((a, b) => a + b, 0) / subj.daily_scores.length 
        : 0;

      // 計算加權總分：(測驗平均 * 0.2) + (考試平均 * 0.2) + (日常表現 * 0.6)
      const weightedScore = (avgTest * 0.2) + (avgExam * 0.2) + (avgDaily * 0.6);
      
      totalWeightedScore += weightedScore;
      subjectCount++;
    });

    // 計算總平均
    const currentWeightedScore = subjectCount > 0 ? totalWeightedScore / subjectCount : 0;
    const gap = targetScore - currentWeightedScore;

    // 更新 UI
    const currentScoreEl = document.getElementById('current-weighted-score');
    const targetScoreEl = document.getElementById('target-score-display');
    const gapEl = document.getElementById('score-gap');
    const messageEl = document.getElementById('progress-message');

    if (currentScoreEl) currentScoreEl.textContent = currentWeightedScore.toFixed(1);
    if (targetScoreEl) targetScoreEl.textContent = targetScore.toFixed(1);
    
    if (gapEl) {
      gapEl.textContent = gap >= 0 ? `+${gap.toFixed(1)}` : gap.toFixed(1);
      gapEl.className = gap >= 0 ? 'text-2xl font-bold text-red-600' : 'text-2xl font-bold text-green-600';
    }

    if (messageEl) {
      if (gap <= 0) {
        messageEl.innerHTML = `
          <p class="text-green-600 font-semibold">🎉 恭喜！你已達到目標分數！</p>
        `;
      } else {
        messageEl.innerHTML = `
          <p class="text-gray-800 font-semibold">你還需要再努力賺取 <span class="text-red-600">${gap.toFixed(1)}</span> 分才能達標！</p>
          <p class="text-sm text-gray-600 mt-2">繼續加油！</p>
        `;
      }
    }

  } catch (error) {
    console.error('計算進度失敗：', error);
  }
}

// 開啟目標選擇模態框
async function openGoalSelectionModal() {
  const modal = document.getElementById('goal-selection-modal');
  if (!modal) return;

  modal.style.display = 'block';

  // 載入大學列表
  await loadGoalUniversities();
}

// 載入目標選擇的大學列表
async function loadGoalUniversities() {
  if (!db) {
    console.error('Firestore 尚未初始化');
    return;
  }

  try {
    const snapshot = await db.collection('universities').get();
    const universities = [];
    
    snapshot.forEach(doc => {
      universities.push({
        id: doc.id,
        ...doc.data()
      });
    });

    const listContainer = document.getElementById('goal-universities-list');
    if (!listContainer) return;

    listContainer.innerHTML = '';

    if (universities.length === 0) {
      listContainer.innerHTML = '<p class="text-gray-600">目前尚無大學資料</p>';
      return;
    }

    universities.forEach(uni => {
      const item = document.createElement('div');
      item.className = 'p-3 border border-gray-200 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors';
      item.innerHTML = `
        <h4 class="font-semibold text-gray-800">${escapeHtml(uni.name || uni.nameEn || '未知大學')}</h4>
        ${uni.city ? `<p class="text-sm text-gray-600">${escapeHtml(uni.city)}</p>` : ''}
      `;
      item.addEventListener('click', () => selectUniversityForGoal(uni));
      listContainer.appendChild(item);
    });

    // 設定搜尋功能
    const searchInput = document.getElementById('goal-uni-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const keyword = e.target.value.toLowerCase();
        Array.from(listContainer.children).forEach(item => {
          const text = item.textContent.toLowerCase();
          item.style.display = text.includes(keyword) ? 'block' : 'none';
        });
      });
    }

  } catch (error) {
    console.error('載入大學列表失敗：', error);
  }
}

// 選擇大學（顯示科系列表）
async function selectUniversityForGoal(university) {
  const majorsSection = document.getElementById('goal-majors-section');
  const majorsList = document.getElementById('goal-majors-list');
  
  if (!majorsSection || !majorsList) return;

  // 從 metadata.disciplines 讀取科系資料（Firebase 中的實際欄位）
  // 如果沒有，也檢查 majors 欄位（向後兼容）
  const disciplines = university.metadata?.disciplines || [];
  const majors = university.majors || [];
  
  // 合併兩個來源的科系資料
  let allMajors = [];
  
  // 先處理 disciplines（字符串數組）
  if (disciplines.length > 0) {
    allMajors = disciplines.map(d => typeof d === 'string' ? d : (d.name || String(d)));
  }
  
  // 再處理 majors（可能是對象或字符串）
  if (majors.length > 0) {
    majors.forEach(major => {
      const majorName = typeof major === 'string' ? major : (major.name || '未知科系');
      if (!allMajors.includes(majorName)) {
        allMajors.push(majorName);
      }
    });
  }

  if (allMajors.length === 0) {
    majorsList.innerHTML = '<p class="text-gray-600">此大學暫無科系資料，請聯繫管理員添加</p>';
    majorsSection.style.display = 'block';
    return;
  }

  majorsList.innerHTML = '';

  allMajors.forEach(majorName => {
    const majorItem = document.createElement('div');
    majorItem.className = 'p-3 border border-gray-200 rounded-lg hover:bg-purple-50 cursor-pointer transition-colors';
    
    // 對於 disciplines，我們只有科系名稱，沒有錄取分數
    // 如果需要錄取分數，可以從其他地方獲取或使用默認值
    majorItem.innerHTML = `
      <h4 class="font-semibold text-gray-800">${escapeHtml(majorName)}</h4>
      <p class="text-sm text-gray-500">點擊選擇此科系作為目標</p>
    `;
    
    majorItem.addEventListener('click', () => selectMajorForGoal(university, majorName));
    majorsList.appendChild(majorItem);
  });

  majorsSection.style.display = 'block';
}

// 選擇科系並更新目標
async function selectMajorForGoal(university, major) {
  if (!currentUser) {
    alert('請先登入');
    return;
  }

  const majorName = typeof major === 'string' ? major : (major.name || '未知科系');

  try {
    // 查找該科系的錄取分數
    let targetAdmissionScore = null;
    
    // 先從 majors 數組中查找（如果 majors 是對象數組）
    if (university.majors && Array.isArray(university.majors)) {
      const majorObj = university.majors.find(m => {
        const mName = typeof m === 'string' ? m : (m.name || '');
        return mName === majorName;
      });
      
      if (majorObj && typeof majorObj === 'object' && majorObj.admission_score) {
        targetAdmissionScore = majorObj.admission_score;
      }
    }
    
    // 如果沒有找到，嘗試從 admission_scores 中查找
    if (!targetAdmissionScore && university.admission_scores) {
      // admission_scores 可能是對象，key 是科系名稱
      if (typeof university.admission_scores === 'object') {
        targetAdmissionScore = university.admission_scores[majorName];
      }
    }
    
    // 如果還是沒有找到，嘗試根據大學名稱判斷 Tier 並使用默認分數
    if (!targetAdmissionScore) {
      const uniName = (university.name || university.nameEn || '').toLowerCase();
      
      // 根據大學名稱判斷 Tier（與 admin-seed.js 中的邏輯一致）
      if (uniName.includes('香港大學') || uniName.includes('university of hong kong') || uniName.includes('hku')) {
        targetAdmissionScore = 90;
      } else if (uniName.includes('香港中文大學') || uniName.includes('chinese university') || uniName.includes('cuhk')) {
        targetAdmissionScore = 88;
      } else if (uniName.includes('香港科技大學') || uniName.includes('hong kong university of science') || uniName.includes('hkust')) {
        targetAdmissionScore = 87;
      } else if (uniName.includes('香港理工大學') || uniName.includes('polytechnic university') || uniName.includes('polyu')) {
        targetAdmissionScore = 80;
      } else if (uniName.includes('香港城市大學') || uniName.includes('city university') || uniName.includes('cityu')) {
        targetAdmissionScore = 78;
      } else if (uniName.includes('香港浸會大學') || uniName.includes('baptist university') || uniName.includes('hkbu')) {
        targetAdmissionScore = 75;
      } else if (uniName.includes('香港教育大學') || uniName.includes('education university') || uniName.includes('eduhk')) {
        targetAdmissionScore = 72;
      } else if (uniName.includes('嶺南大學') || uniName.includes('lingnan university') || uniName.includes('lnu')) {
        targetAdmissionScore = 70;
      } else {
        // 默認分數
        targetAdmissionScore = 75;
      }
    }

    // 使用 localStorage 存儲目標信息
    const targetData = {
      target_university_id: university.id,
      target_major_name: majorName,
      target_university_name: university.name || university.nameEn || '未知大學',
      target_admission_score: targetAdmissionScore
    };
    
    localStorage.setItem(`target_${currentUser.id}`, JSON.stringify(targetData));

    // 更新 Supabase profiles 表中的目標分數
    if (supabase) {
      try {
        const updateData = { 
          target_admission_score: targetAdmissionScore,
          target_university_id: university.id,
          target_major_name: majorName,
          // 嘗試保存大學名稱（如果字段存在）
          target_university_name: university.name || university.nameEn || '未知大學'
        };
        
        const { error: updateError } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', currentUser.id);

        if (updateError) {
          // 如果是字段不存在的错误，只记录警告，不显示错误
          if (updateError.code === 'PGRST116' || updateError.message?.includes('column') || updateError.message?.includes('field')) {
            console.warn('目標分數字段不存在於數據庫中，已保存到 localStorage');
          } else {
            console.error('更新目標分數失敗：', updateError);
          }
          // 不阻止流程繼續，因為已經保存到 localStorage
        }
      } catch (error) {
        // 忽略字段不存在的错误
        if (error?.code !== 'PGRST116' && !error?.message?.includes('column') && !error?.message?.includes('field')) {
          console.error('更新目標分數時發生錯誤：', error);
        }
      }
    }

    // 更新當前 profile 中的目標信息
    if (currentProfile) {
      currentProfile.target_university_id = university.id;
      currentProfile.target_major_name = majorName;
      currentProfile.target_admission_score = targetAdmissionScore;
      currentProfile.target_university_name = university.name || university.nameEn || '未知大學';
    }

    // 關閉模態框
    closeGoalSelectionModal();

    // 重新載入目標顯示和進度
    await loadCurrentGoal();
    await calculateProgress();

    alert('目標設定成功！目標分數：' + targetAdmissionScore);

  } catch (error) {
    console.error('設定目標失敗：', error);
    alert('設定目標失敗：' + (error.message || '未知錯誤'));
  }
}

// 關閉目標選擇模態框
function closeGoalSelectionModal() {
  const modal = document.getElementById('goal-selection-modal');
  if (modal) {
    modal.style.display = 'none';
  }
  
  // 重置科系選擇區域
  const majorsSection = document.getElementById('goal-majors-section');
  if (majorsSection) {
    majorsSection.style.display = 'none';
  }
  
  const searchInput = document.getElementById('goal-uni-search');
  if (searchInput) {
    searchInput.value = '';
  }
}

// 設定學術中心相關事件監聽器
function setupAcademicsListeners() {
  // 圖片上傳
  const imageUpload = document.getElementById('schedule-image-upload');
  if (imageUpload) {
    imageUpload.addEventListener('change', handleImageUpload);
  }

  // 一鍵清空考程表按鈕
  const clearAllBtn = document.getElementById('clear-all-exams-btn');
  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', clearAllExamSchedules);
  }

  // 成績輸入表單（如果還存在）
  const scoreForm = document.getElementById('score-input-form');
  if (scoreForm) {
    scoreForm.addEventListener('submit', handleScoreInputSubmit);
  }

  // 分數輸入模態框的保存按鈕
  const saveScoreBtn = document.getElementById('save-score-btn');
  if (saveScoreBtn) {
    saveScoreBtn.addEventListener('click', handleScoreModalSave);
  }

  // 目標選擇按鈕
  const selectGoalBtn = document.getElementById('select-goal-btn');
  if (selectGoalBtn) {
    selectGoalBtn.addEventListener('click', openGoalSelectionModal);
  }

  // 關閉模態框
  const closeModalBtn = document.getElementById('close-goal-modal');
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeGoalSelectionModal);
  }

  // 點擊模態框外部關閉
  const modal = document.getElementById('goal-selection-modal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeGoalSelectionModal();
      }
    });
  }
}

// 將函式暴露到全域，供 HTML 中的 onclick 使用
window.deleteResource = deleteResource;
window.confirmAppointment = confirmAppointment;
window.navigateToView = navigateToView;
window.sendMessage = handleSendMessage;
window.loadUniversities = loadUniversities;
window.loadAcademicsData = loadAcademicsData;
window.deleteExamSchedule = deleteExamSchedule;
window.deleteExamScore = deleteExamScore;
window.openScoreModal = openScoreModal;

