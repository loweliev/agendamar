const calendarEl = document.getElementById('calendar');
const tasksView = document.getElementById('tasks-view');
const calendarView = document.getElementById('calendar-view');
const taskList = document.getElementById('task-list');
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const backButton = document.getElementById('back-button');
const selectedDateTitle = document.getElementById('selected-date-title');

let selectedDate = null;
let tasks = JSON.parse(localStorage.getItem('tasks')) || {};

// Generar calendario del mes actual
function generateCalendar() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const firstWeekDay = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  calendarEl.innerHTML = '';

  for (let i = 0; i < firstWeekDay; i++) {
    calendarEl.innerHTML += `<div></div>`;
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = formatDate(new Date(year, month, day));
    const count = tasks[dateKey]?.length || 0;

    const dayEl = document.createElement('div');
    dayEl.classList.add('calendar-day');
    dayEl.textContent = day;

    if (count > 0) {
      const span = document.createElement('span');
      span.className = 'activity-count';
      span.textContent = count;
      dayEl.appendChild(span);
    }

    dayEl.addEventListener('click', () => openTasksForDate(dateKey));
    calendarEl.appendChild(dayEl);
  }
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function openTasksForDate(dateKey) {
  selectedDate = dateKey;
  selectedDateTitle.textContent = `📅 Actividades para ${dateKey}`;
  calendarView.classList.add('hidden');
  tasksView.classList.remove('hidden');
  renderTasks();
}

function renderTasks() {
  taskList.innerHTML = '';

  const dayTasks = tasks[selectedDate] || [];

  dayTasks.forEach((task, index) => {
    const li = document.createElement('li');
    li.className = 'task-item';
    if (task.completed) li.classList.add('completed');

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
  localStorage.setItem('tasks', JSON.stringify(tasks));
  generateCalendar();
}

taskForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = taskInput.value.trim();
  if (!text) return;

  if (!tasks[selectedDate]) tasks[selectedDate] = [];
  tasks[selectedDate].push({ text, completed: false });

  taskInput.value = '';
  saveTasks();
  renderTasks();
});

backButton.addEventListener('click', () => {
  tasksView.classList.add('hidden');
  calendarView.classList.remove('hidden');
  selectedDate = null;
});

function toggleTask(index) {
  tasks[selectedDate][index].completed = !tasks[selectedDate][index].completed;
  saveTasks();
  renderTasks();
}

function deleteTask(index) {
  tasks[selectedDate].splice(index, 1);
  if (tasks[selectedDate].length === 0) delete tasks[selectedDate];
  saveTasks();
  renderTasks();
}

function editTask(index) {
  const newText = prompt('Editar actividad:', tasks[selectedDate][index].text);
  if (newText !== null) {
    tasks[selectedDate][index].text = newText.trim();
    saveTasks();
    renderTasks();
  }
}

generateCalendar();
