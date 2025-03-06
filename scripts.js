// GitHub倉庫配置
const GITHUB_CONFIG = {
  owner: 'scott610718',  // 替換為您的GitHub用戶名
  repo: 'DeviceBorrowing',         // 替換為您的倉庫名
  branch: 'main',                 // 主分支名稱
  ipadPath: 'data/ipad.json',     // iPad教室數據路徑
  chromebookPath: 'data/chromebook.json' // Chromebook教室數據路徑
};

// 全局變數
let currentData = {
  ipad: {},
  chromebook: {}
};
let isAdmin = false;
let githubToken = '';
let currentWeek = 1;
let currentYear = 114;

// 初始化應用
async function init() {
  // 產生週次選項
  generateWeekOptions();
  
  // 產生表格
  generateTable();
  
  // 設定本週為預設選項
  setCurrentWeek();
  
  // 載入資料
  await loadData();
  
  // 事件監聽
  setupEventListeners();
  
  // 設定當前年份
  const now = new Date();
  currentYear = now.getFullYear() - 1911; // 民國年
}

// 從GitHub載入資料
async function loadData() {
  try {
    // 載入iPad教室數據
    const ipadData = await fetchGitHubFile(GITHUB_CONFIG.ipadPath);
    if (ipadData) {
      currentData.ipad = ipadData;
    } else {
      currentData.ipad = initializeEmptyClassroomData();
    }
    
    // 載入Chromebook教室數據
    const chromebookData = await fetchGitHubFile(GITHUB_CONFIG.chromebookPath);
    if (chromebookData) {
      currentData.chromebook = chromebookData;
    } else {
      currentData.chromebook = initializeEmptyClassroomData();
    }
    
    // 更新表格
    updateTable();
  } catch (error) {
    console.error('載入數據時發生錯誤:', error);
    alert('無法載入借用數據。請確認網絡連接或稍後再試。');
    
    // 初始化空數據以保證UI可用
    currentData.ipad = initializeEmptyClassroomData();
    currentData.chromebook = initializeEmptyClassroomData();
    updateTable();
  }
}

// 從GitHub獲取文件
async function fetchGitHubFile(path) {
  try {
    const apiUrl = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${path}?ref=${GITHUB_CONFIG.branch}`;
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`文件 ${path} 不存在，將創建初始數據。`);
        return null;
      }
      throw new Error(`GitHub API返回錯誤: ${response.status}`);
    }
    
    const data = await response.json();
    const content = atob(data.content); // Base64解碼
    return JSON.parse(content);
  } catch (error) {
    console.error(`獲取${path}時出錯:`, error);
    throw error;
  }
}

// 將數據保存到GitHub
async function saveDataToGithub() {
  if (!isAdmin || !githubToken) {
    alert('您需要以管理員身份登入才能保存更改。');
    return;
  }
  
  try {
    // 保存iPad教室數據
    await updateGithubFile(
      GITHUB_CONFIG.ipadPath,
      JSON.stringify(currentData.ipad, null, 2)
    );
    
    // 保存Chromebook教室數據
    await updateGithubFile(
      GITHUB_CONFIG.chromebookPath,
      JSON.stringify(currentData.chromebook, null, 2)
    );
    
    alert('借用資料已成功保存！');
  } catch (error) {
    console.error('保存數據時發生錯誤:', error);
    alert('保存數據失敗。請確認您的權限或稍後再試。');
  }
}

// 更新GitHub上的文件
async function updateGithubFile(path, content) {
  try {
    // 首先獲取文件的當前SHA值（如果文件存在）
    let sha = null;
    try {
      const fileData = await fetchFileDetails(path);
      if (fileData) {
        sha = fileData.sha;
      }
    } catch (error) {
      if (error.message.includes('404')) {
        console.log(`文件 ${path} 不存在，將創建新文件。`);
      } else {
        throw error;
      }
    }
    
    // 準備更新請求
    const apiUrl = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${path}`;
    const requestBody = {
      message: `更新 ${path} - ${new Date().toISOString()}`,
      content: btoa(unescape(encodeURIComponent(content))), // UTF-8編碼後Base64
      branch: GITHUB_CONFIG.branch
    };
    
    // 如果文件已存在，添加SHA
    if (sha) {
      requestBody.sha = sha;
    }
    
    // 發送請求
    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${githubToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      throw new Error(`GitHub API返回錯誤: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`更新文件 ${path} 時出錯:`, error);
    throw error;
  }
}

// 獲取文件詳細信息
async function fetchFileDetails(path) {
  const apiUrl = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${path}?ref=${GITHUB_CONFIG.branch}`;
  const response = await fetch(apiUrl);
  
  if (!response.ok) {
    throw new Error(`GitHub API返回錯誤: ${response.status}`);
  }
  
  return await response.json();
}

// 處理管理員登入
async function handleLogin() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const token = document.getElementById('github-token').value;
  
  // 先檢查本地認證
  if (username === '114' && password === '114') {
    if (!token) {
      alert('需要提供GitHub令牌才能修改數據。');
      return;
    }
    
    // 測試GitHub令牌有效性
    try {
      const testUrl = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}`;
      const response = await fetch(testUrl, {
        headers: {
          'Authorization': `token ${token}`
        }
      });
      
      if (!response.ok) {
        alert('GitHub令牌無效或權限不足。');
        return;
      }
      
      // 登入成功
      isAdmin = true;
      githubToken = token;
      hideLoginModal();
      loginBtn.textContent = '登出';
      loginBtn.removeEventListener('click', showLoginModal);
      loginBtn.addEventListener('click', handleLogout);
      adminButtons.style.display = 'flex';
      
      // 重新產生表格（使用下拉選單）
      generateTable();
      updateTable();
    } catch (error) {
      console.error('驗證GitHub令牌時出錯:', error);
      alert('無法驗證GitHub令牌。請確認網絡連接或令牌有效性。');
    }
  } else {
    alert('帳號或密碼錯誤！');
  }
}

// 處理表格單元格變更
function handleCellChange(event) {
  const select = event.target;
  const period = select.dataset.period;
  const day = select.dataset.day;
  const value = select.value;
  const classroom = classroomSelect.value;
  const week = parseInt(weekSelect.value);
  
  const key = `${day}-${period}`;
  
  // 檢查是否有每週不可借用的設定
  if (value === 'weekly-unavailable') {
    // 將所有週次的該時段設定為不可借用
    for (let w = 1; w <= 52; w++) {
      if (!currentData[classroom][w]) {
        currentData[classroom][w] = {};
      }
      
      currentData[classroom][w][key] = {
        borrower: '',
        status: 'weekly-unavailable'
      };
    }
    
    select.parentElement.className = 'status-weekly-unavailable';
  } else if (value === 'unavailable') {
    // 僅將當前週次的該時段設定為不可借用
    if (!currentData[classroom][week]) {
      currentData[classroom][week] = {};
    }
    
    currentData[classroom][week][key] = {
      borrower: '',
      status: 'unavailable'
    };
    
    select.parentElement.className = 'status-unavailable';
  } else if (value) {
    // 設定借用者
    if (!currentData[classroom][week]) {
      currentData[classroom][week] = {};
    }
    
    currentData[classroom][week][key] = {
      borrower: value,
      status: ''
    };
    
    select.parentElement.className = 'status-borrowed';
  } else {
    // 清除設定
    if (currentData[classroom][week] && currentData[classroom][week][key]) {
      currentData[classroom][week][key] = {
        borrower: '',
        status: ''
      };
    }
    
    select.parentElement.className = 'status-available';
  }
  
  // 儲存資料按鈕啟用（視覺反饋）
  document.getElementById('saveBtn').disabled = false;
}

// 匯出資料為JSON文件
function exportData() {
  const dataStr = JSON.stringify(currentData, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `營北國中載具借用系統資料_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  
  URL.revokeObjectURL(url);
}

// 匯入資料
async function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = async function(e) {
    try {
      const importedData = JSON.parse(e.target.result);
      
      // 檢查資料結構
      if (importedData.ipad && importedData.chromebook) {
        currentData = importedData;
        updateTable();
        
        // 詢問是否保存到GitHub
        if (confirm('資料已成功匯入到本地。是否立即保存到GitHub？')) {
          await saveDataToGithub();
        } else {
          alert('資料已匯入本地，但尚未保存到GitHub。請記得點擊"保存更改"按鈕。');
          document.getElementById('saveBtn').disabled = false;
        }
      } else {
        alert('匯入的資料格式不正確！');
      }
    } catch (error) {
      console.error('匯入資料時發生錯誤:', error);
      alert('匯入資料時發生錯誤！');
    }
  };
  reader.readAsText(file);
  
  // 清空檔案輸入欄位，以便再次選擇相同的檔案
  event.target.value = '';
}

// 初始化空教室數據
function initializeEmptyClassroomData() {
  const data = {};
  
  for (let week = 1; week <= 52; week++) {
    data[week] = {};
    
    for (let day = 1; day <= 6; day++) {
      for (let period = 1; period <= 8; period++) {
        const key = `${day}-${period}`;
        data[week][key] = {
          borrower: '',
          status: ''
        };
      }
    }
  }
  
  return data;
}
