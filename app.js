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
  
  // 檢查是否已登入
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      currentUser = session.user;
      await loadUserProfile();
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
  // 登入表單
  document.getElementById('login-form').addEventListener('submit', handleLogin);
  document.getElementById('signup-form').addEventListener('submit', handleSignup);
  document.getElementById('show-signup-btn').addEventListener('click', () => {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('signup-form').style.display = 'block';
  });
  document.getElementById('show-login-btn').addEventListener('click', () => {
    document.getElementById('signup-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'block';
  });
  
  // 登出按鈕
  document.getElementById('logout-btn').addEventListener('click', handleLogout);
  
  // 學生狀態選擇
  document.querySelectorAll('.status-card').forEach(card => {
    card.addEventListener('click', async (e) => {
      const status = card.dataset.status;
      await updateStudentStatus(status);
    });
  });
  
  // 已確定目標學生：資源篩選
  document.getElementById('resource-category-filter').addEventListener('change', filterResources);
  
  // 未確定目標學生：興趣表單
  document.getElementById('interests-form').addEventListener('submit', handleInterestsSubmit);
  
  // 未確定目標學生：預約表單
  document.getElementById('appointment-form').addEventListener('submit', handleAppointmentSubmit);
  
  // 教師：資源表單
  document.getElementById('resource-form').addEventListener('submit', handleResourceSubmit);
  
  // 監聽認證狀態變化
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session) {
      currentUser = session.user;
      await loadUserProfile();
    } else if (event === 'SIGNED_OUT') {
      currentUser = null;
      currentProfile = null;
      showView('login');
    }
  });
}

// ========== 認證相關函式 ==========
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const errorDiv = document.getElementById('login-error');
  
  errorDiv.style.display = 'none';
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) {
    errorDiv.textContent = '登入失敗：' + error.message;
    errorDiv.style.display = 'block';
  } else {
    currentUser = data.user;
    await loadUserProfile();
  }
}

async function handleSignup(e) {
  e.preventDefault();
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;
  const role = document.getElementById('signup-role').value;
  const errorDiv = document.getElementById('login-error');
  
  errorDiv.style.display = 'none';
  
  if (!role) {
    errorDiv.textContent = '請選擇身份';
    errorDiv.style.display = 'block';
    return;
  }
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });
  
  if (error) {
    errorDiv.textContent = '註冊失敗：' + error.message;
    errorDiv.style.display = 'block';
  } else {
    // 更新 profile 的 role
    if (data.user) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', data.user.id);
      
      if (updateError) {
        console.error('更新角色失敗：', updateError);
      }
      
      currentUser = data.user;
      await loadUserProfile();
    }
  }
}

async function handleLogout() {
  await supabase.auth.signOut();
  currentUser = null;
  currentProfile = null;
  showView('login');
  document.getElementById('user-email').textContent = '';
  document.getElementById('logout-btn').style.display = 'none';
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
  document.getElementById('user-email').textContent = currentProfile.email || currentUser.email;
  document.getElementById('logout-btn').style.display = 'block';
  
  // 根據角色和狀態顯示對應視圖
  if (currentProfile.role === 'teacher') {
    showView('teacher');
    await loadTeacherData();
  } else if (currentProfile.role === 'student') {
    if (!currentProfile.student_status) {
      // 第一次登入，需要選擇狀態
      showView('statusSelect');
    } else if (currentProfile.student_status === 'decided') {
      showView('studentDecided');
      await loadResources();
    } else if (currentProfile.student_status === 'undecided') {
      showView('studentUndecided');
      await loadUndecidedStudentData();
    }
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
  
  // 重新載入視圖
  await loadUserProfile();
}

// ========== 已確定目標學生：資源相關 ==========
async function loadResources() {
  const { data, error } = await supabase
    .from('resources')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('載入資源失敗：', error);
    return;
  }
  
  const resourcesList = document.getElementById('resources-list');
  const resourcesEmpty = document.getElementById('resources-empty');
  const categoryFilter = document.getElementById('resource-category-filter');
  
  // 清空列表
  resourcesList.innerHTML = '';
  
  // 收集所有類別
  const categories = [...new Set(data.map(r => r.category))];
  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    if (!categoryFilter.querySelector(`option[value="${category}"]`)) {
      categoryFilter.appendChild(option);
    }
  });
  
  if (data.length === 0) {
    resourcesEmpty.style.display = 'block';
    return;
  }
  
  resourcesEmpty.style.display = 'none';
  
  // 顯示資源
  displayResources(data, resourcesList);
}

function displayResources(resources, container) {
  container.innerHTML = '';
  
  resources.forEach(resource => {
    const col = document.createElement('div');
    col.className = 'col-md-4';
    col.innerHTML = `
      <div class="card h-100">
        <div class="card-body">
          <span class="badge bg-secondary mb-2">${resource.category}</span>
          <h5 class="card-title">${resource.title}</h5>
          <a href="${resource.link}" target="_blank" class="btn btn-primary btn-sm">查看資源</a>
        </div>
      </div>
    `;
    container.appendChild(col);
  });
}

async function filterResources() {
  const category = document.getElementById('resource-category-filter').value;
  const { data: allResources } = await supabase
    .from('resources')
    .select('*')
    .order('created_at', { ascending: false });
  
  let filtered = allResources;
  if (category) {
    filtered = allResources.filter(r => r.category === category);
  }
  
  displayResources(filtered, document.getElementById('resources-list'));
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
  if (!currentUser) return;
  
  const teacherName = document.getElementById('teacher-select').value;
  const date = document.getElementById('booking-date').value;
  const time = document.getElementById('booking-time').value;
  const notes = document.getElementById('appointment-notes').value;
  
  if (!teacherName || !date || !time) {
    alert('請填寫所有必填欄位');
    return;
  }
  
  const bookingTime = new Date(`${date}T${time}`);
  
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
    return;
  }
  
  alert('預約已提交！');
  document.getElementById('appointment-form').reset();
  await loadMyAppointments();
}

async function loadMyAppointments() {
  if (!currentUser) return;
  
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('student_id', currentUser.id)
    .order('booking_time', { ascending: true });
  
  if (error) {
    console.error('載入預約失敗：', error);
    return;
  }
  
  const appointmentsList = document.getElementById('my-appointments-list');
  const appointmentsEmpty = document.getElementById('appointments-empty');
  
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
    
    const div = document.createElement('div');
    div.className = 'card mb-2';
    div.innerHTML = `
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <h6 class="card-title">${appointment.teacher_name}</h6>
            <p class="card-text mb-1">
              <strong>時間：</strong>${bookingTime.toLocaleString('zh-TW')}
            </p>
            ${appointment.notes ? `<p class="card-text"><small class="text-muted">${appointment.notes}</small></p>` : ''}
          </div>
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

// 將函式暴露到全域，供 HTML 中的 onclick 使用
window.deleteResource = deleteResource;
window.confirmAppointment = confirmAppointment;

