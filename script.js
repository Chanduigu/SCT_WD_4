// Firebase Setup
const firebaseConfig = {
  apiKey: "AIzaSyDfuOrLVQBsatKDAk1jru5Ok0rH42RsHqI",
  authDomain: "to-do-c2c21.firebaseapp.com",
  projectId: "to-do-c2c21"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// UI Elements
const loginScreen = document.getElementById("loginScreen"),
      appScreen = document.getElementById("appScreen"),
      googleBtn = document.getElementById("googleSignIn"),
      signOutBtn = document.getElementById("signOutBtn");

const taskInput = document.getElementById("taskInput"),
      taskDeadline = document.getElementById("taskDeadline"),
      taskDuration = document.getElementById("taskDuration"),
      taskPriority = document.getElementById("taskPriority"),
      addTaskBtn = document.getElementById("addTaskBtn"),
      taskList = document.getElementById("taskList");

const activeTaskInfo = document.getElementById("activeTaskInfo"),
      startFocusBtn = document.getElementById("startFocusBtn"),
      stopwatchDisplay = document.getElementById("stopwatchDisplay");

const remWater = document.getElementById("remWater"),
      remGym = document.getElementById("remGym"),
      remSleep = document.getElementById("remSleep");

const statsCanvas = document.getElementById("statsChart"),
      streakDisplay = document.getElementById("streakDisplay");

let user = null;
let tasks = [], activeTask = null;
let stopwatchSecs = 0, swInterval = null;
let completedDates = [], streak = 0;

// Auth
auth.onAuthStateChanged(u => {
  user = u;
  if (u) {
    loginScreen.classList.add("hidden");
    appScreen.classList.remove("hidden");
    loadData();
  } else {
    loginScreen.classList.remove("hidden");
    appScreen.classList.add("hidden");
  }
});
googleBtn.onclick = () => auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
signOutBtn.onclick = () => auth.signOut();

// Save & Load
function saveData() {
  if (!user) return;
  const obj = { tasks, activeTask, stopwatchSecs, completedDates };
  localStorage.setItem(`FocusFlow_${user.uid}`, JSON.stringify(obj));
}
function loadData() {
  const raw = localStorage.getItem(`FocusFlow_${user.uid}`);
  if (raw) {
    const obj = JSON.parse(raw);
    tasks = obj.tasks || [];
    activeTask = obj.activeTask || null;
    stopwatchSecs = obj.stopwatchSecs || 0;
    completedDates = obj.completedDates || [];
  }
  renderAll();
}

// Add Task
addTaskBtn.onclick = () => {
  const name = taskInput.value.trim();
  if (!name) return;
  tasks.push({
    name,
    deadline: taskDeadline.value,
    duration: Number(taskDuration.value),
    priority: taskPriority.value,
    completed: false
  });
  taskInput.value = taskDeadline.value = taskDuration.value = "";
  renderTasks();
  saveData();
};

// Render Tasks
function renderTasks() {
  taskList.innerHTML = "";
  tasks.forEach((t, i) => {
    const li = document.createElement("li");
    li.innerHTML = `
      📌 ${t.name} (${t.priority}) – due ${t.deadline}, ${t.duration}m
      <button onclick="startTask(${i})">▶️</button>
      <button onclick="editTask(${i})">✏️</button>
      <button onclick="deleteTask(${i})">🗑️</button>
      <button onclick="toggleComp(${i})">${t.completed ? '↺' : '✅'}</button>`;
    taskList.appendChild(li);
  });
}

// Start a task
function startTask(i) {
  activeTask = { index: i, start: Date.now() };
  stopwatchSecs = 0;
  clearInterval(swInterval);
  swInterval = setInterval(() => {
    stopwatchSecs++;
    updateStopwatch();
    saveData();
  }, 1000);
  renderActive();
  startFocusBtn.disabled = false;
}

// Edit task
function editTask(i) {
  const t = tasks[i];
  const newName = prompt("Edit name", t.name) || t.name;
  const newDur = parseInt(prompt("Edit duration", t.duration)) || t.duration;
  const newDeadline = prompt("Edit deadline", t.deadline) || t.deadline;
  const newPriority = prompt("Edit priority (High/Medium/Low)", t.priority) || t.priority;
  tasks[i] = {
    ...t,
    name: newName,
    duration: newDur,
    deadline: newDeadline,
    priority: newPriority
  };
  renderTasks();
  saveData();
}

// Delete task
function deleteTask(i) {
  if (confirm("Are you sure you want to delete this task?")) {
    tasks.splice(i, 1);
    renderTasks();
    saveData();
  }
}

// Toggle completion
function toggleComp(i) {
  tasks[i].completed = !tasks[i].completed;
  if (tasks[i].completed) {
    const today = new Date().toISOString().slice(0, 10);
    if (!completedDates.includes(today)) completedDates.push(today);
  }
  saveData();
  renderTasks();
  renderChart();
  updateStreak();
}

// Stopwatch
function updateStopwatch() {
  const m = String(Math.floor(stopwatchSecs / 60)).padStart(2, '0'),
        s = String(stopwatchSecs % 60).padStart(2, '0');
  stopwatchDisplay.textContent = `${m}:${s}`;
}
function renderActive() {
  if (!activeTask) {
    activeTaskInfo.textContent = "No task running";
    startFocusBtn.disabled = true;
    return;
  }
  const t = tasks[activeTask.index];
  activeTaskInfo.textContent = `Working on "${t.name}", ${t.duration} min`;
}

// ✅ Focus Button just marks task as completed and stops stopwatch
startFocusBtn.onclick = () => {
  if (!activeTask) return;
  tasks[activeTask.index].completed = true;
  const today = new Date().toISOString().slice(0, 10);
  if (!completedDates.includes(today)) completedDates.push(today);
  activeTask = null;
  stopwatchSecs = 0;
  clearInterval(swInterval);
  renderAll();
  saveData();
};

// Reminders
setInterval(() => {
  const now = new Date();
  if (remWater.checked && now.getMinutes() === 0) alert("💧 Time to drink water!");
  if (remGym.checked && now.getHours() === 18 && now.getMinutes() === 0) alert("🏋️ Time for the gym!");
  if (remSleep.checked && now.getHours() === 22 && now.getMinutes() === 0) alert("🌙 Time to sleep!");
}, 60 * 1000);

// Chart
let chart = null;
function renderChart() {
  const counts = { High: 0, Medium: 0, Low: 0 };
  tasks.forEach(t => {
    if (t.completed) counts[t.priority]++;
  });
  const data = [counts.High, counts.Medium, counts.Low];
  const cfg = {
    type: 'bar',
    data: {
      labels: ['High', 'Medium', 'Low'],
      datasets: [{
        label: 'Completed tasks by priority',
        data,
        backgroundColor: ['#f44336', '#ff9800', '#4caf50']
      }]
    },
    options: { responsive: true }
  };
  if (chart) {
    chart.data.datasets[0].data = data;
    chart.update();
  } else {
    chart = new Chart(statsCanvas, cfg);
  }
}

// Streak
function updateStreak() {
  const today = new Date().toISOString().slice(0, 10);
  const sorted = [...new Set(completedDates)].sort();
  let s = 0;
  for (let i = sorted.length - 1; i >= 0; i--) {
    const d = new Date(sorted[i]);
    const expected = new Date();
    expected.setDate(expected.getDate() - s);
    if (d.toISOString().slice(0, 10) === expected.toISOString().slice(0, 10)) {
      s++;
    } else {
      break;
    }
  }
  streak = s;
  streakDisplay.textContent = `🔥 Streak: ${streak} day${streak !== 1 ? 's' : ''}`;
  saveData();
}

// Render
function renderAll() {
  renderTasks();
  renderActive();
  updateStopwatch();
  renderChart();
  updateStreak();
}
