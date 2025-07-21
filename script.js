// Variables globales
let selectedDate = new Date();
let tasks = JSON.parse(localStorage.getItem('tasks') || '{}');
let editingTaskId = null;

// Referencias al DOM
const monthYear = document.getElementById("month-year");
const calendarDays = document.getElementById("calendar-days");
const selectedDateDisplay = document.getElementById("selected-date");
const taskText = document.getElementById("task-text");
const taskDesc = document.getElementById("task-desc");
const taskList = document.getElementById("task-list");
const searchTask = document.getElementById("search-task");
const taskStats = document.getElementById("task-stats");

// Inicialización
document.getElementById("prev-month").onclick = () => changeMonth(-1);
document.getElementById("next-month").onclick = () => changeMonth(1);
document.getElementById("add-task").onclick = addTask;
document.getElementById("export-pdf").onclick = exportPDF;
document.getElementById("export-excel").onclick = exportExcel;
document.getElementById("save-json").onclick = saveJSON;
document.getElementById("load-json").onchange = loadJSON;
document.getElementById("toggle-theme").onclick = toggleTheme;
searchTask.oninput = renderTasks;

document.getElementById("save-edit").onclick = saveEdit;
document.getElementById("cancel-edit").onclick = () => {
  document.getElementById("edit-modal").style.display = "none";
};

initTheme();
renderCalendar();
renderTasks();
requestNotificationPermission();
navigator.serviceWorker?.register("service-worker.js");

// Funciones principales
function renderCalendar() {
  const weekdays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  document.getElementById("calendar-weekdays").innerHTML = weekdays
  .map(d => `<div class="weekday">${d}</div>`).join('');

  calendarDays.innerHTML = "";
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const today = new Date();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  monthYear.textContent = selectedDate.toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  });

  for (let i = 0; i < firstDay; i++) {
    calendarDays.innerHTML += `<div></div>`;
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const thisDate = new Date(year, month, day);
    const key = thisDate.toISOString().split("T")[0];
    const dayTasks = tasks[key] || [];
    const taskCount = dayTasks.length;

    const div = document.createElement("div");
    div.className = "day";
    if (thisDate.toDateString() === today.toDateString()) div.classList.add("today");
    if (thisDate.toDateString() === selectedDate.toDateString()) div.classList.add("selected");

    if (taskCount > 0) {
      const taskIndicator = document.createElement("div");
      taskIndicator.className = "task-count";
      taskIndicator.textContent = taskCount;

      if (taskCount < 3) div.classList.add("green");
      else if (taskCount < 5) div.classList.add("orange");
      else div.classList.add("red");

      div.appendChild(taskIndicator);
    }

    div.textContent = day;
    div.onclick = () => {
      selectedDate = thisDate;
      renderCalendar();
      renderTasks();
    };
    calendarDays.appendChild(div);
  }
}

function renderTasks() {
  const key = selectedDate.toISOString().split("T")[0];
  const dayTasks = tasks[key] || [];
  const filter = searchTask.value.toLowerCase();
  const filteredTasks = dayTasks.filter(t => t.text.toLowerCase().includes(filter));

  selectedDateDisplay.textContent = `📆 ${selectedDate.toLocaleDateString("es-ES", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  })}`;

  taskList.innerHTML = "";

  if (filteredTasks.length === 0) {
    taskList.innerHTML = `<li>No hay actividades para este día 📌</li>`;
  } else {
    filteredTasks.forEach((task, index) => {
      const li = document.createElement("li");
      li.className = "task" + (task.done ? " done" : "");

      const content = document.createElement("div");
      content.innerHTML = `<strong>${task.text}</strong><br/><small>${task.desc || ""}</small>`;
      li.appendChild(content);

      const buttons = document.createElement("div");
      buttons.innerHTML = `
        <button onclick="toggleDone(${index})">✔️</button>
        <button onclick="editTask(${index})">✏️</button>
        <button onclick="deleteTask(${index})">🗑️</button>
      `;
      li.appendChild(buttons);
      taskList.appendChild(li);
    });
  }

  const completed = dayTasks.filter(t => t.done).length;
  taskStats.textContent = `✅ Completadas: ${completed} / 🕓 Total: ${dayTasks.length}`;
}

function addTask() {
  const text = taskText.value.trim();
  const desc = taskDesc.value.trim();
  if (!text) return alert("Escribe el nombre de la tarea");

  const key = selectedDate.toISOString().split("T")[0];
  if (!tasks[key]) tasks[key] = [];
  tasks[key].push({ text, desc, done: false });
  saveTasks();
  taskText.value = "";
  taskDesc.value = "";
  renderTasks();
  renderCalendar();
}

function editTask(index) {
  const key = selectedDate.toISOString().split("T")[0];
  const task = tasks[key][index];
  editingTaskId = index;

  document.getElementById("edit-text").value = task.text;
  document.getElementById("edit-desc").value = task.desc;
  document.getElementById("edit-modal").style.display = "flex";
}

function saveEdit() {
  const text = document.getElementById("edit-text").value.trim();
  const desc = document.getElementById("edit-desc").value.trim();
  const key = selectedDate.toISOString().split("T")[0];
  if (!text) return;

  tasks[key][editingTaskId].text = text;
  tasks[key][editingTaskId].desc = desc;
  saveTasks();
  document.getElementById("edit-modal").style.display = "none";
  renderTasks();
  renderCalendar();
}

function deleteTask(index) {
  const key = selectedDate.toISOString().split("T")[0];
  tasks[key].splice(index, 1);
  if (tasks[key].length === 0) delete tasks[key];
  saveTasks();
  renderTasks();
  renderCalendar();
}

function toggleDone(index) {
  const key = selectedDate.toISOString().split("T")[0];
  tasks[key][index].done = !tasks[key][index].done;
  saveTasks();
  renderTasks();
}

function changeMonth(offset) {
  selectedDate.setMonth(selectedDate.getMonth() + offset);
  renderCalendar();
}

function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function exportPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const key = selectedDate.toISOString().split("T")[0];
  const data = tasks[key] || [];

  doc.text(`Tareas para ${key}`, 10, 10);
  data.forEach((t, i) => {
    doc.text(`- ${t.text} ${t.done ? "[✔]" : "[ ]"}`, 10, 20 + i * 10);
    if (t.desc) doc.text(`  ${t.desc}`, 10, 25 + i * 10);
  });

  doc.save(`tareas_${key}.pdf`);
}

function exportExcel() {
  const key = selectedDate.toISOString().split("T")[0];
  const data = tasks[key] || [];
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Tareas");
  XLSX.writeFile(wb, `tareas_${key}.xlsx`);
}

function saveJSON() {
  const blob = new Blob([JSON.stringify(tasks)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "respaldo_tareas.json";
  link.click();
}

function loadJSON(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      tasks = JSON.parse(reader.result);
      saveTasks();
      renderTasks();
      renderCalendar();
    } catch (err) {
      alert("Archivo inválido");
    }
  };
  reader.readAsText(file);
}

function toggleTheme() {
  const isDark = document.body.classList.contains("dark");
  document.body.classList.toggle("dark", !isDark);
  document.body.classList.toggle("light", isDark);
  localStorage.setItem("theme", isDark ? "light" : "dark");
}

function initTheme() {
  const saved = localStorage.getItem("theme") || "dark";
  document.body.classList.add(saved);
}

function requestNotificationPermission() {
  if ("Notification" in window && Notification.permission !== "granted") {
    Notification.requestPermission();
  }

  const today = new Date().toISOString().split("T")[0];
  const todayTasks = tasks[today] || [];
  const pending = todayTasks.filter(t => !t.done).length;

  if (pending > 0 && Notification.permission === "granted") {
    new Notification("Tareas pendientes", {
      body: `Tienes ${pending} tareas pendientes hoy.`,
      icon: "icon-192.png",
    });
  }
}
