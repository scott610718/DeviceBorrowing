const adminLoginLink = document.getElementById('adminLogin');
const loginModal = document.getElementById('loginModal');
const closeModal = document.querySelector('.close');
const loginForm = document.getElementById('loginForm');
const classroomSelect = document.getElementById('classroom');
const weekSelect = document.getElementById('week');
const scheduleBody = document.getElementById('scheduleBody');
const exportDataButton = document.getElementById('exportData');
const importDataButton = document.getElementById('importData');
const fileInput = document.getElementById('fileInput');

let currentWeek = getCurrentWeek();
let currentClassroom = 'ipad';
let isAdmin = false;
let data = { 'ipad': {}, 'chromebook': {} };

document.addEventListener('DOMContentLoaded', () => {
    loadWeeks();
    loadSchedule();
    checkAdmin();
});

adminLoginLink.addEventListener('click', () => {
    loginModal.style.display = 'block';
});

closeModal.addEventListener('click', () => {
    loginModal.style.display = 'none';
});

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (username === '114' && password === '114') {
        isAdmin = true;
        alert('登入成功');
        loginModal.style.display = 'none';
    } else {
        alert('帳號或密碼錯誤');
    }
});

classroomSelect.addEventListener('change', (e) => {
    currentClassroom = e.target.value;
    loadSchedule();
});

weekSelect.addEventListener('change', (e) => {
    currentWeek = parseInt(e.target.value, 10);
    loadSchedule();
});

document.getElementById('prevWeek').addEventListener('click', () => {
    if (currentWeek > 1) {
        currentWeek--;
        weekSelect.value = currentWeek;
        loadSchedule();
    }
});

document.getElementById('nextWeek').addEventListener('click', () => {
    if (currentWeek < 52) {
        currentWeek++;
        weekSelect.value = currentWeek;
        loadSchedule();
    }
});

exportDataButton.addEventListener('click', exportData);
importDataButton.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', importData);

function getCurrentWeek() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now - start + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60000);
    const oneWeek = 604800000;
    return Math.floor(diff / oneWeek) + 1;
}

function loadWeeks() {
    for (let i = 1; i <= 52; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `第 ${i} 週`;
        weekSelect.appendChild(option);
    }
    weekSelect.value = currentWeek;
}

function loadSchedule() {
    // Clear previous schedule
    scheduleBody.innerHTML = '';

    const schedule = data[currentClassroom][currentWeek] || generateEmptySchedule();
    const startDate = getStartDateOfWeek(currentWeek);

    for (let period = 1; period <= 8; period++) {
        const row = document.createElement('tr');
        const periodCell = document.createElement('td');
        periodCell.textContent = `第 ${period} 節`;
        row.appendChild(periodCell);

        for (let day = 0; day < 6; day++) {
            const cell = document.createElement('td');
            const date = new Date(startDate);
            date.setDate(date.getDate() + day);
            const dateStr = `${date.getMonth() + 1}${date.getDate().toString().padStart(2, '0')}`;
            cell.dataset.date = dateStr;
            cell.dataset.period = period;
            cell.dataset.day = day;

            const status = schedule[day][period - 1];
            if (status === '不可借用') {
                cell.classList.add('unavailable');
                cell.textContent = '不可借用';
            } else if (status === '每週不可借用') {
                cell.classList.add('unavailable');
                cell.textContent = '每週不可借用';
            } else {
                cell.classList.add('available');
                cell.textContent = status || '可借用';
                if (isAdmin) {
                    cell.contentEditable = true;
                    cell.addEventListener('blur', () => updateSchedule(day, period - 1, cell.textContent));
                }
            }

            row.appendChild(cell);
        }

        scheduleBody.appendChild(row);
    }
}

function generateEmptySchedule() {
    const schedule = [];
    for (let day = 0; day < 6; day++) {
        const daySchedule = [];
        for (let period = 0; period < 8; period++) {
            daySchedule.push('可借用');
        }
        schedule.push(daySchedule);
    }
    return schedule;
}

function getStartDateOfWeek(week) {
    const start = new Date(new Date().getFullYear(), 0, 1);
    const days = (week - 1) * 7;
    start.setDate(start.getDate() + days);
    return start;
}

function updateSchedule(day, period, status) {
    if (!data[currentClassroom][currentWeek]) {
        data[currentClassroom][currentWeek] = generateEmptySchedule();
    }
    data[currentClassroom][currentWeek][day][period] = status;
    saveData();
}

function saveData() {
    // Save data to GitHub API (pseudo code, replace with actual implementation)
    // fetch('https://api.github.com/repos/scott610718/your-repo/contents/schedule.json', {
    //     method: 'PUT',
    //     headers: {
    //         'Authorization': `token YOUR_GITHUB_TOKEN`,
    //         'Content-Type': 'application/json'
    //     },
    //     body: JSON.stringify(data)
    // });
}

function exportData() {
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schedule_${new Date().getFullYear()}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function importData(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            data = JSON.parse(e.target.result);
            loadSchedule();
        };
        reader.readAsText(file);
    }
}

function checkAdmin() {
    // Check admin status (pseudo code, replace with actual implementation)
    // fetch('https://api.github.com/repos/scott610718/your-repo/contents/schedule.json', {
    //     headers: {
    //         'Authorization': `token YOUR_GITHUB_TOKEN`
    //     }
    // })
    // .then(response => response.json())
    // .then(json => {
    //     data = JSON.parse(atob(json.content));
    //     loadSchedule();
    // });
}