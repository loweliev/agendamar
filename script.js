// Variables globales
let selectedDate = new Date();
let tasks = {};
let editingTaskId = null;

// Firebase
import { db, ref, get, set, push, update, remove, onValue } from './firebase.js';

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
requestNotificationPermission();
navigator.serviceWorker?.register("service-worker.js");

// Cargar tareas desde Firebase
function loadTasksFromFirebase() {
  const tasksRef = ref(db, 'tasks');
  onValue(tasksRef, (snapshot) => {
    tasks = snapshot.val() || {};
    renderTasks();
    renderCalendar();
  });
}
loadTasksFromFirebase();

function getDateKey(date = selectedDate) {
  return date.toISOString().split("T")[0];
}

function changeMonth(offset) {
  selectedDate.setMonth(selectedDate.getMonth() + offset);
  renderCalendar();
}

function addTask() {
  const text = taskText.value.trim();
  const desc = taskDesc.value.trim();
  if (!text) return alert("Escribe el nombre de la tarea");

  const key = getDateKey();
  const newTask = { text, desc, done: false };

  console.log("🔄 Enviando tarea a Firebase:", key, newTask); // Agregado

  push(ref(db, `tasks/${key}`), newTask)
    .then(() => console.log("✅ Tarea guardada en Firebase"))
    .catch((err) => console.error("❌ Error al guardar tarea:", err));

  taskText.value = "";
  taskDesc.value = "";
}


function deleteTask(taskId) {
  const key = getDateKey();
  remove(ref(db, `tasks/${key}/${taskId}`));
}

function toggleDone(taskId, currentState) {
  const key = getDateKey();
  update(ref(db, `tasks/${key}/${taskId}`), { done: !currentState });
}

function editTask(id, text, desc) {
  editingTaskId = id;
  document.getElementById("edit-text").value = text;
  document.getElementById("edit-desc").value = desc;
  document.getElementById("edit-modal").style.display = "flex";
}

function saveEdit() {
  const text = document.getElementById("edit-text").value.trim();
  const desc = document.getElementById("edit-desc").value.trim();
  const key = getDateKey();
  if (!text) return;

  update(ref(db, `tasks/${key}/${editingTaskId}`), { text, desc });
  document.getElementById("edit-modal").style.display = "none";
}

function renderTasks() {
  const key = getDateKey();
  const dayTasks = tasks[key] || {};
  const filter = searchTask.value.toLowerCase();
  taskList.innerHTML = "";

  const entries = Object.entries(dayTasks);
  const filtered = entries.filter(([id, t]) => t.text.toLowerCase().includes(filter));

  selectedDateDisplay.textContent = `📆 ${selectedDate.toLocaleDateString("es-ES", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  })}`;

  if (filtered.length === 0) {
    taskList.innerHTML = `<li>No hay actividades para este día 📌</li>`;
  } else {
    filtered.forEach(([id, task]) => {
      const li = document.createElement("li");
      li.className = "task" + (task.done ? " done" : "");

      const content = document.createElement("div");
      content.innerHTML = `<strong>${task.text}</strong><br/><small>${task.desc || ""}</small>`;
      li.appendChild(content);

      const buttons = document.createElement("div");
      buttons.innerHTML = `
        <button onclick="toggleDone('${id}', ${task.done})">✔️</button>
        <button onclick="editTask('${id}', '${task.text}', '${task.desc || ''}')">✏️</button>
        <button onclick="deleteTask('${id}')">🗑️</button>
      `;
      li.appendChild(buttons);
      taskList.appendChild(li);
    });
  }

  const completed = entries.filter(([_, t]) => t.done).length;
  taskStats.textContent = `✅ Completadas: ${completed} / 🕓 Total: ${entries.length}`;
}

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
    const dayTasks = tasks[key] || {};
    const taskCount = Object.keys(dayTasks).length;

    const div = document.createElement("div");
    div.className = "day";
    if (thisDate.toDateString() === today.toDateString()) div.classList.add("today");
    if (thisDate.toDateString() === selectedDate.toDateString()) div.classList.add("selected");

    div.innerHTML = `${day}`;
    if (taskCount > 0) {
      let colorClass = "";
      if (taskCount < 3) colorClass = "green";
      else if (taskCount < 5) colorClass = "orange";
      else colorClass = "red";

      div.classList.add(colorClass);
      div.innerHTML += `<div class="task-count">${taskCount}</div>`;
    }

    div.onclick = () => {
      selectedDate = thisDate;
      renderCalendar();
      renderTasks();
    };

    calendarDays.appendChild(div);
  }
}
