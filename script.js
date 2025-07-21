let tasks = JSON.parse(localStorage.getItem("tasks")) || {};
let selectedDate = localStorage.getItem("selectedDate") || null;

const calendarEl = document.getElementById("calendar");
const monthYearEl = document.getElementById("month-year");
const taskList = document.getElementById("task-list");
const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");
const selectedDateTitle = document.getElementById("selected-date-title");
const exportPDFBtn = document.getElementById("export-pdf");
const exportExcelBtn = document.getElementById("export-excel");
const notifyBtn = document.getElementById("enable-notifications");
const toggleThemeBtn = document.getElementById("toggle-theme");

const today = new Date();
let currentMonth = today.getMonth();
let currentYear = today.getFullYear();

const monthNames = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDayText(dateStr) {
  const d = new Date(dateStr + "T00:00");
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return d.toLocaleDateString("es-ES", options);
}

function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.getElementById("toast-container").appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function updateMonthYearHeader() {
  monthYearEl.textContent = `${monthNames[currentMonth]} ${currentYear}`;
}

function generateCalendar() {
  updateMonthYearHeader();
  calendarEl.innerHTML = "";

  const weekDays = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  weekDays.forEach(d => {
    const dayHeader = document.createElement("div");
    dayHeader.className = "calendar-day calendar-header-day";
    dayHeader.textContent = d;
    calendarEl.appendChild(dayHeader);
  });

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement("div");
    empty.className = "calendar-day empty";
    calendarEl.appendChild(empty);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const count = tasks[dateKey]?.length || 0;

    const dayEl = document.createElement("div");
    dayEl.classList.add("calendar-day");
    dayEl.textContent = day;

    const todayKey = formatDate(today);
    if (dateKey === todayKey) {
      dayEl.classList.add("today");
    }

    if (count > 0) {
      const span = document.createElement("span");
      span.className = "activity-count";
      span.textContent = count;

      if (count >= 6) span.classList.add("high");
      else if (count >= 3) span.classList.add("medium");
      else span.classList.add("low");

      dayEl.appendChild(span);
    }

    dayEl.addEventListener("click", () => {
      selectedDate = dateKey;
      localStorage.setItem("selectedDate", selectedDate);
      updateTaskView();
    });

    calendarEl.appendChild(dayEl);
  }

  if (selectedDate) updateTaskView();
}

function updateTaskView() {
  selectedDateTitle.textContent = selectedDate
    ? `📅 ${formatDayText(selectedDate)}`
    : "📅 Selecciona un día";
  renderTasks();
}

function renderTasks() {
  taskList.innerHTML = "";
  const dayTasks = tasks[selectedDate] || [];

  if (dayTasks.length === 0) {
    taskList.innerHTML = `<div id="no-tasks">No hay actividades para este día. 📌</div>`;
    return;
  }

  dayTasks.forEach((task, index) => {
    const li = document.createElement("li");
    li.className = "task-item";
    if (task.completed) li.classList.add("completed");

    li.innerHTML = `
      <span>${task.text}</span>
      <div class="task-buttons">
        <button onclick="toggleTask(${index})">✔</button>
        <button onclick="editTask(${index})">✏</button>
        <button onclick="deleteTask(${index})" class="delete">🗑</button>
      </div>
    `;

    taskList.appendChild(li);
  });
}

function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
  generateCalendar();
}

taskForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = taskInput.value.trim();
  if (!text || !selectedDate) return;

  if (!tasks[selectedDate]) tasks[selectedDate] = [];
  tasks[selectedDate].push({ text, completed: false });

  taskInput.value = "";
  saveTasks();
  renderTasks();
  showToast("✅ Tarea agregada");
});

function toggleTask(index) {
  tasks[selectedDate][index].completed = !tasks[selectedDate][index].completed;
  saveTasks();
  renderTasks();
  showToast("✔ Estado cambiado");
}

function deleteTask(index) {
  if (!confirm("¿Seguro que deseas eliminar esta tarea?")) return;
  tasks[selectedDate].splice(index, 1);
  if (tasks[selectedDate].length === 0) delete tasks[selectedDate];
  saveTasks();
  renderTasks();
  showToast("🗑 Tarea eliminada");
}

function editTask(index) {
  const newText = prompt("Editar actividad:", tasks[selectedDate][index].text);
  if (newText !== null) {
    tasks[selectedDate][index].text = newText.trim();
    saveTasks();
    renderTasks();
    showToast("✏ Tarea editada");
  }
}

document.getElementById("prev-month").addEventListener("click", () => {
  currentMonth--;
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }
  generateCalendar();
});

document.getElementById("next-month").addEventListener("click", () => {
  currentMonth++;
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  generateCalendar();
});

exportPDFBtn.addEventListener("click", () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let y = 10;
  doc.setFontSize(14);
  doc.text(`Tareas de ${monthNames[currentMonth]} ${currentYear}`, 10, y);
  y += 10;

  Object.entries(tasks).forEach(([date, dayTasks]) => {
    if (date.startsWith(`${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`)) {
      doc.setFontSize(12);
      doc.text(`${formatDayText(date)}:`, 10, y);
      y += 6;
      dayTasks.forEach(task => {
        doc.text(`- ${task.text} ${task.completed ? "(✔)" : ""}`, 15, y);
        y += 6;
      });
      y += 4;
    }
  });

  doc.save("tareas.pdf");
});

exportExcelBtn.addEventListener("click", () => {
  const wb = XLSX.utils.book_new();
  const data = [["Fecha", "Tarea", "Completada"]];

  Object.entries(tasks).forEach(([date, items]) => {
    if (date.startsWith(`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`)) {
      items.forEach(task => {
        data.push([formatDayText(date), task.text, task.completed ? "Sí" : "No"]);
      });
    }
  });

  const ws = XLSX.utils.aoa_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, "Tareas");
  XLSX.writeFile(wb, "tareas.xlsx");
});

notifyBtn.addEventListener("click", () => {
  if (!("Notification" in window)) return;
  Notification.requestPermission().then(permission => {
    if (permission === "granted") {
      const todayKey = formatDate(new Date());
      const pending = tasks[todayKey]?.filter(t => !t.completed).length || 0;
      new Notification(pending > 0 ? "Tareas pendientes" : "Todo listo", {
        body: pending > 0
          ? `Tienes ${pending} actividades pendientes hoy.`
          : "No tienes tareas pendientes hoy 🎉",
        icon: "icon-192.png"
      });
    }
  });
});

toggleThemeBtn.addEventListener("click", () => {
  document.body.classList.toggle("light-theme");
});

generateCalendar();
