// ========== Supabase 初始化 ==========
// 請在下方填入您的 Supabase 專案資訊
const SUPABASE_URL = 'https://naqyczuuariosniudbsr.supabase.co'; // 請填入您的 Supabase URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hcXljenV1YXJpb3NuaXVkYnNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzM2ODQsImV4cCI6MjA4MDM0OTY4NH0.6gLqwj0OBNHatfoPC_Pm0zANzQLS1KE9xJ2Vf2dQB7s'; // 請填入您的 Supabase Anon Key

// Supabase 客戶端（將在 DOMContentLoaded 中初始化）
let supabase;

// ========== 全域變數 ==========
let currentUser = null;
let currentProfile = null;

// ========== DOM 元素 ==========
const views = {
  login: document.getElementById('login-view'),
  dashboard: document.getElementById('dashboard-view'),
  statusSelect: document.getElementById('student-status-select-view'),
  studentDecided: document.getElementById('student-decided-view'),
  studentUndecided: document.getElementById('student-undecided-view'),
  teacher: document.getElementById('teacher-view')
};

// ========== 頁面切換函式 ==========
function showView(viewId) {
  // 隱藏所有視圖
  Object.values(views).forEach(view => {
    if (view) view.style.display = 'none';
  });
  
  // 顯示指定視圖
  if (views[viewId]) {
    views[viewId].style.display = 'block';
  }
}

// ========== 初始化 ==========
document.addEventListener('DOMContentLoaded', async () => {
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
        showView('login');
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
      // 清空聊天窗口和 Sessions 列表
      clearChatWindow();
      clearSessionsList();
      showView('login');
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
  showView('login');
  
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

// 將函式暴露到全域，供 HTML 中的 onclick 使用
window.deleteResource = deleteResource;
window.confirmAppointment = confirmAppointment;
window.navigateToView = navigateToView;
window.sendMessage = handleSendMessage;

