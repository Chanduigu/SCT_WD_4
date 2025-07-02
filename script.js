<script type="module">
  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
  import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
  import { getDatabase, ref, push, onValue } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

  // ✅ ONLY ONE firebaseConfig block
  const firebaseConfig = {
    apiKey: "AIzaSyDfuOrLVQBsatKDAk1jru5Ok0rH42RsHqI",
    authDomain: "to-do-c2c21.firebaseapp.com",
    databaseURL: "https://to-do-c2c21-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "to-do-c2c21",
    storageBucket: "to-do-c2c21.firebasestorage.app",
    messagingSenderId: "948561635865",
    appId: "1:948561635865:web:0d5a0b26dceb52152d5888"
  };

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getDatabase(app);
  const provider = new GoogleAuthProvider();

  const loginSection = document.getElementById("loginSection");
  const dashboardSection = document.getElementById("dashboardSection");

  const taskInput = document.getElementById("taskInput");
  const prioritySelect = document.getElementById("prioritySelect");
  const taskList = document.getElementById("taskList");
  const logoutBtn = document.getElementById("logoutBtn");
  const loginBtn = document.getElementById("loginBtn");

  let currentUser = null;

  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUser = user;
      loginSection.style.display = "none";
      dashboardSection.style.display = "block";
      loadTasks();
    } else {
      loginSection.style.display = "block";
      dashboardSection.style.display = "none";
    }
  });

  // Sign in
  loginBtn.addEventListener("click", () => {
    signInWithPopup(auth, provider)
      .then((result) => {
        currentUser = result.user;
      })
      .catch((error) => {
        alert("Login failed: " + error.message);
      });
  });

  // Sign out
  logoutBtn.addEventListener("click", () => {
    signOut(auth);
  });

  // Add task
  window.addTask = function () {
    const text = taskInput.value.trim();
    const priority = prioritySelect.value;

    if (text === "" || !currentUser) return;

    const task = {
      text,
      priority,
      timestamp: Date.now()
    };

    const taskRef = ref(db, "tasks/" + currentUser.uid);
    push(taskRef, task);
    taskInput.value = "";
  };

  // Load tasks
  function loadTasks() {
    const taskRef = ref(db, "tasks/" + currentUser.uid);
    onValue(taskRef, (snapshot) => {
      taskList.innerHTML = "";
      snapshot.forEach((child) => {
        const task = child.val();
        const li = document.createElement("li");
        li.className = "task-item";
        li.innerHTML = `
          <span>${task.text}</span>
          <span class="priority-tag ${task.priority}">${task.priority}</span>
        `;
        taskList.appendChild(li);
      });
    });
  }
</script>
