document.addEventListener("DOMContentLoaded", function() {
    const adminLoginBtn = document.getElementById('adminLoginBtn');
    const roomSelect = document.getElementById('roomSelect');
    const weeklyScheduleDiv = document.getElementById('weeklySchedule');
    const exportDataBtn = document.getElementById('exportDataBtn');
    const importDataBtn = document.getElementById('importDataBtn');

    let currentRoom = "ipad"; // 預設為 ipad 教室
    let currentWeek = getCurrentWeek();

    // 事件：管理者登入
    adminLoginBtn.addEventListener('click', function() {
        const username = prompt("請輸入管理員帳號");
        const password = prompt("請輸入管理員密碼");
        if (username === '114' && password === '114') {
            alert("登入成功！");
        } else {
            alert("帳號或密碼錯誤！");
        }
    });

    // 事件：切換教室
    roomSelect.addEventListener('change', function() {
        currentRoom = roomSelect.value;
        loadSchedule(currentRoom, currentWeek);
    });

    // 載入當週的借用狀況
    function loadSchedule(room, week) {
        fetchGitHubData(room, week).then(data => {
            renderSchedule(data);
        }).catch(error => {
            console.error("錯誤:", error);
        });
    }

    // 獲取當週的週次
    function getCurrentWeek() {
        const today = new Date();
        const startDate = new Date("2025-01-01"); // 假設114年1月1日是第一週的開始
        const diff = today - startDate;
        const week = Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1;
        return week;
    }

    // 從 GitHub API 獲取教室的借用資料
    function fetchGitHubData(room, week) {
        const url = `https://api.github.com/repos/your-username/your-repo/contents/data/${room}_room.json`;
        return fetch(url)
            .then(response => response.json())
            .then(data => {
                const content = atob(data.content); // 解碼內容
                return JSON.parse(content);
            });
    }

    // 顯示借用狀況
    function renderSchedule(data) {
        let scheduleHTML = '<table>';
        for (let day = 1; day <= 6; day++) {
            scheduleHTML += `<tr><td>星期${day}</td>`;
            for (let period = 1; period <= 8; period++) {
                const entry = data[day - 1][period - 1];
                scheduleHTML += `<td>${entry ? entry : '無借用'}</td>`;
            }
            scheduleHTML += '</tr>';
        }
        scheduleHTML += '</table>';
        weeklyScheduleDiv.innerHTML = scheduleHTML;
    }

    // 匯出資料
    exportDataBtn.addEventListener('click', function() {
        const file = new Blob([JSON.stringify({ schedule: "data" })], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(file);
        link.download = 'schedule_data.json';
        link.click();
    });

    // 匯入資料
    importDataBtn.addEventListener('click', function() {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';
        fileInput.addEventListener('change', function(event) {
            const file = event.target.files[0];
            const reader = new FileReader();
            reader.onload = function() {
                const data = JSON.parse(reader.result);
                console.log(data);
                // 處理匯入的資料
            };
            reader.readAsText(file);
        });
        fileInput.click();
    });

    // 頁面加載時顯示當週的借用狀況
    loadSchedule(currentRoom, currentWeek);
});
