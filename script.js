function addTask() {
  const taskInput = document.getElementById("taskInput");
  const prioritySelect = document.getElementById("prioritySelect");
  const taskList = document.getElementById("taskList");

  const taskText = taskInput.value.trim();
  const priority = prioritySelect.value;

  if (taskText === "") return;

  const li = document.createElement("li");
  li.className = "task-item";
  li.innerHTML = `
    <span>${taskText}</span>
    <span class="priority-tag ${priority}">${priority}</span>
  `;

  taskList.appendChild(li);
  taskInput.value = "";
}
