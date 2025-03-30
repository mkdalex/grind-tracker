// Task data structure and state variables
let tasks = [];
let activeTasks = {}; // Format: { taskId: { timeSpent: seconds, interval: intervalId } }

// Motivational quotes
const motivationalQuotes = [
  "Every minute wasted is money lost.",
  "You're in a race against time.",
  "Comfort is the enemy of achievement.",
  "While you rest, someone else is grinding.",
  "Your future depends on what you do today.",
  "The grind doesn't stop for anyone.",
  "Pain today, wealth tomorrow.",
  "Average effort gets average results.",
  "You don't get what you wish for. You get what you work for.",
  "Success isn't owned, it's rented. And the rent is due every day.",
  "The harder you work, the luckier you get.",
  "Discipline is choosing between what you want now and what you want most.",
  "You're one decision away from a totally different life.",
  "Wasted time is worse than wasted money.",
  "Nobody cares about your excuses.",
  "Don't wish it were easier. Wish you were better.",
];

// DOM elements
const timeLeftEl = document.getElementById("time-left");
const timeNeededEl = document.getElementById("time-needed");
const taskListEl = document.getElementById("task-list");
const motivationEl = document.getElementById("motivation-quote");
const newTaskNameEl = document.getElementById("new-task-name");
const newTaskTimeEl = document.getElementById("new-task-time");
const addTaskBtn = document.getElementById("add-task-btn");
const progressCircle = document.getElementById("progress-circle");
const percentageText = document.getElementById("progress-percentage");

// =============================================
// Initialization and Setup
// =============================================

function init() {
  loadTasksFromStorage();
  loadActiveTasksState();

  updateTimeLeft();
  updateTaskList();

  setInterval(updateTimeLeft, 60000);
  setInterval(changeQuote, 15000);
  setInterval(() => {
    const now = new Date();
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59);
    const minutesLeft = Math.floor((endOfDay - now) / 60000);

    const totalMinutes = tasks
      .filter((task) => !task.completed)
      .reduce((total, task) => total + task.timeAllocated, 0);

    updateProgressCircle(totalMinutes, minutesLeft);
  }, 5000);

  addTaskBtn.addEventListener("click", addNewTask);
  setupTimePerspectiveModal();
}

function setupTimePerspectiveModal() {
  const progressCircleSvg = document.getElementById("progress-circle-svg");
  const modal = document.getElementById("time-perspective-modal");
  const closeButton = document.getElementById("close-modal");

  progressCircleSvg.addEventListener("click", () => {
    updateTimePerspective();
    modal.classList.add("active");
  });

  closeButton.addEventListener("click", () => {
    modal.classList.remove("active");
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.remove("active");
    }
  });

  generateLifeGrid();
}

// =============================================
// Time and Progress Tracking
// =============================================

function updateTimeLeft() {
  const now = new Date();
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59);

  const minutesLeft = Math.floor((endOfDay - now) / 60000);
  timeLeftEl.textContent = formatTime(minutesLeft);

  updateTimeNeeded();
}

function updateTimeNeeded() {
  const totalMinutes = tasks
    .filter((task) => !task.completed)
    .reduce((total, task) => total + task.timeAllocated, 0);

  timeNeededEl.textContent = formatTime(totalMinutes);

  const now = new Date();
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59);
  const minutesLeft = Math.floor((endOfDay - now) / 60000);

  if (totalMinutes > minutesLeft) {
    timeNeededEl.style.color = "#ff5555";
  } else {
    timeNeededEl.style.color = "#55ff55";
  }

  updateProgressCircle(totalMinutes, minutesLeft);

  const completedCount = tasks.filter((task) => task.completed).length;
  const totalCount = tasks.length;
  document.getElementById(
    "tasks-completed"
  ).textContent = `${completedCount}/${totalCount}`;

  const efficiencyEl = document.getElementById("time-efficiency");
  const activeTaskCount = Object.keys(activeTasks).length;

  if (activeTaskCount > 0) {
    const runningCount = Object.values(activeTasks).filter(
      (t) => t.interval
    ).length;

    if (runningCount > 0) {
      efficiencyEl.textContent = `Active ${runningCount}/${activeTaskCount} ⚡`;
      efficiencyEl.style.color = "#55ff55";
    } else {
      efficiencyEl.textContent = "Paused ⏸️";
      efficiencyEl.style.color = "#ffaa55";
    }
  } else {
    efficiencyEl.textContent = "Inactive ⚠️";
    efficiencyEl.style.color = "#ff5555";
  }
}

function updateProgressCircle(totalMinutes, minutesLeft) {
  const circumference = 2 * Math.PI * 45;
  const percentage = Math.min(
    100,
    Math.round((totalMinutes / (minutesLeft || 1)) * 100)
  );

  const offset = circumference - (percentage / 100) * circumference;
  progressCircle.style.strokeDashoffset = offset;

  percentageText.textContent = `${percentage}%`;

  if (percentage > 90) {
    progressCircle.classList.add("progress-danger");
  } else {
    progressCircle.classList.remove("progress-danger");
  }
}

function updateProgressBackground(task) {
  const taskEl = document.querySelector(`.task-item[data-task-id="${task.id}"]`);
  if (!taskEl) return;
  
  let progressBg = taskEl.querySelector('.task-progress-background');
  let progressHandle = taskEl.querySelector('.task-progress-handle');
  
  if (!progressBg) {
    progressBg = document.createElement('div');
    progressBg.className = 'task-progress-background';
    taskEl.appendChild(progressBg);
    
    // Create the handle element
    progressHandle = document.createElement('div');
    progressHandle.className = 'task-progress-handle';
    taskEl.appendChild(progressHandle);
    
    // Setup drag functionality
    setupProgressDragging(progressBg, progressHandle, task);
  }
  
  const timeSpent = activeTasks[task.id].timeSpent;
  const timeSpentMinutes = timeSpent / 60;
  const percentComplete = Math.min(100, (timeSpentMinutes / task.timeAllocated) * 100);
  
  // Update width of the progress background
  progressBg.style.width = `${percentComplete}%`;
  
  // Position the handle at the end of the progress bar
  progressHandle.style.left = `calc(${percentComplete}% - 4px)`;
  
  // Adjust the intensity as it progresses
  const alpha = 0.2 + (percentComplete / 100) * 0.1;
  progressBg.style.backgroundColor = `rgba(40, 180, 70, ${alpha})`;
  
  // Update the timer display
  const timerDisplay = taskEl.querySelector('.task-timer');
  if (timerDisplay) {
    timerDisplay.textContent = formatSeconds(timeSpent);
  }
}


function setupProgressDragging(progressElement, handleElement, task) {
  let isDragging = false;
  let startX, startWidth;
  
  const taskEl = progressElement.closest('.task-item');
  if (!taskEl) return;
  
  // Use the handle for dragging
  handleElement.addEventListener('mousedown', function(e) {
    isDragging = true;
    startX = e.clientX;
    startWidth = parseFloat(progressElement.style.width) || 0;
    e.preventDefault();
    
    // Add a class to show we're dragging
    taskEl.classList.add('dragging');
  });
  
  document.addEventListener('mousemove', function(e) {
    if (!isDragging) return;
    
    const taskRect = taskEl.getBoundingClientRect();
    const offsetX = e.clientX - startX;
    
    // Calculate new width percentage based on task element width
    const newWidthPercent = Math.min(100, Math.max(0, startWidth + (offsetX / taskRect.width) * 100));
    
    // Update the progress bar width
    progressElement.style.width = `${newWidthPercent}%`;
    
    // Update the handle position
    handleElement.style.left = `calc(${newWidthPercent}% - 4px)`;
    
    // Update the time spent based on the new width
    const taskId = parseInt(taskEl.dataset.taskId);
    if (activeTasks[taskId]) {
      const newTimeMinutes = (newWidthPercent / 100) * task.timeAllocated;
      activeTasks[taskId].timeSpent = Math.round(newTimeMinutes * 60);
      
      // Update the timer display
      const timerDisplay = taskEl.querySelector('.task-timer');
      if (timerDisplay) {
        timerDisplay.textContent = formatSeconds(activeTasks[taskId].timeSpent);
      }
      
      // Update the "Spent" text if it exists
      const taskTime = taskEl.querySelector('.task-time');
      if (taskTime) {
        const currentText = taskTime.textContent;
        const spentIndex = currentText.indexOf('• Spent:');
        if (spentIndex !== -1) {
          const baseText = currentText.substring(0, spentIndex);
          taskTime.textContent = `${baseText}• Spent: ${formatTime(Math.floor(activeTasks[taskId].timeSpent / 60))}`;
        }
      }
    }
  });
  
  document.addEventListener('mouseup', function() {
    if (isDragging) {
      isDragging = false;
      taskEl.classList.remove('dragging');
      saveActiveTasksState();
    }
  });
}

// =============================================
// Task Management
// =============================================

function toggleTimer(taskId) {
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return;

  if (activeTasks[taskId]) {
    if (activeTasks[taskId].interval) {
      clearInterval(activeTasks[taskId].interval);
      activeTasks[taskId].interval = null;
    } else {
      activeTasks[taskId].interval = setInterval(() => {
        activeTasks[taskId].timeSpent++;
        updateProgressBackground(task);
        saveActiveTasksState();
      }, 1000);
    }
  } else {
    activeTasks[taskId] = {
      timeSpent: 0,
      interval: setInterval(() => {
        activeTasks[taskId].timeSpent++;
        updateProgressBackground(task);
        saveActiveTasksState();
      }, 1000),
    };
  }

  saveActiveTasksState();
  updateTaskList();
}

function completeTask(taskId) {
  if (activeTasks[taskId] && activeTasks[taskId].interval) {
    clearInterval(activeTasks[taskId].interval);
    delete activeTasks[taskId];
    saveActiveTasksState();
  }

  tasks = tasks.map((task) =>
    task.id === taskId ? { ...task, completed: true } : task
  );

  saveTasksToStorage();
  updateTaskList();
}

function deleteTask(taskId) {
  if (activeTasks[taskId] && activeTasks[taskId].interval) {
    clearInterval(activeTasks[taskId].interval);
    delete activeTasks[taskId];
    saveActiveTasksState();
  }

  tasks = tasks.filter((task) => task.id !== taskId);

  saveTasksToStorage();
  updateTaskList();
}

function addNewTask() {
  const name = newTaskNameEl.value.trim();
  if (!name) return;

  const timeAllocated = parseInt(newTaskTimeEl.value);

  const newTask = {
    id: Date.now(),
    name,
    timeAllocated,
    completed: false,
  };

  tasks.push(newTask);

  saveTasksToStorage();
  newTaskNameEl.value = "";

  updateTaskList();
}

// =============================================
// UI Updates
// =============================================

function updateTaskList() {
  taskListEl.innerHTML = '';
  
  tasks.forEach(task => {
    const taskEl = document.createElement('div');
    taskEl.className = `task-item ${task.completed ? 'completed' : ''} ${activeTasks[task.id] ? 'active' : ''}`;
    taskEl.dataset.taskId = task.id;
    
    const isActive = !!activeTasks[task.id];
    const isRunning = isActive && activeTasks[task.id].interval;
    const timeSpent = isActive ? activeTasks[task.id].timeSpent : 0;
    
    taskEl.innerHTML = `
      <div class="task-info">
        <div class="task-name ${task.completed ? 'completed' : ''}">${task.name}</div>
        <div class="task-time">
          Allocated: ${formatTime(task.timeAllocated)}
          ${isActive ? `• Spent: ${formatTime(Math.floor(timeSpent / 60))}` : ''}
        </div>
      </div>
      
      ${isActive ? `<div class="task-timer">${formatSeconds(timeSpent)}</div>` : ''}
      
      <div class="button-group">
        ${!task.completed ? `
          <button class="btn-${isRunning ? 'pause' : 'play'}" onclick="toggleTimer(${task.id})">
            ${isRunning ? '⏸️' : '▶️'}
          </button>
          <button class="btn-complete" onclick="completeTask(${task.id})">✓</button>
        ` : ''}
        <button class="btn-delete" onclick="deleteTask(${task.id})">🗑️</button>
      </div>
    `;
    
    taskListEl.appendChild(taskEl);
    
    // Add progress elements for active tasks
    if (isActive) {
      // Add the progress background
      const progressBg = document.createElement('div');
      progressBg.className = 'task-progress-background';
      taskEl.appendChild(progressBg);
      
      // Add the separate handle element
      const handle = document.createElement('div');
      handle.className = 'task-progress-handle';
      taskEl.appendChild(handle);
      
      // Set up dragging
      setupProgressDragging(progressBg, handle, task);
      
      // Set initial progress
      const percentComplete = Math.min(100, (timeSpent / 60 / task.timeAllocated) * 100);
      progressBg.style.width = `${percentComplete}%`;
      
      // Position the handle at the progress point
      handle.style.left = `calc(${percentComplete}% - 4px)`;
      
      // Set background alpha
      const alpha = 0.2 + (percentComplete / 100) * 0.1;
      progressBg.style.backgroundColor = `rgba(40, 180, 70, ${alpha})`;
    }
  });
  
  updateTimeNeeded();
}

function updateTimePerspective() {
  const now = new Date();

  const dayOfWeek = now.getDay() || 7;
  const weekProgress = Math.round((dayOfWeek / 7) * 100);
  document.getElementById("week-progress").textContent = `${weekProgress}%`;
  document.getElementById("week-bar").style.width = `${weekProgress}%`;

  const dayOfMonth = now.getDate();
  const lastDayOfMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0
  ).getDate();
  const monthProgress = Math.round((dayOfMonth / lastDayOfMonth) * 100);
  document.getElementById("month-progress").textContent = `${monthProgress}%`;
  document.getElementById("month-bar").style.width = `${monthProgress}%`;

  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const endOfYear = new Date(now.getFullYear() + 1, 0, 1);
  const yearProgress = Math.round(
    ((now - startOfYear) / (endOfYear - startOfYear)) * 100
  );
  document.getElementById("year-progress").textContent = `${yearProgress}%`;
  document.getElementById("year-bar").style.width = `${yearProgress}%`;

  const productiveHours = 8.5;
  const maxWeeklyHours = 40;
  const productivePercentage = Math.round(
    (productiveHours / maxWeeklyHours) * 100
  );
  document.getElementById(
    "productive-hours"
  ).textContent = `${productiveHours}h`;
  document.getElementById(
    "productive-bar"
  ).style.width = `${productivePercentage}%`;

  updatePerspectiveMotivation(weekProgress, monthProgress, yearProgress);
}

function updatePerspectiveMotivation(
  weekProgress,
  monthProgress,
  yearProgress
) {
  const motivationEl = document.getElementById("perspective-motivation");
  const messages = [
    "Another week is slipping by. What will you have to show for it? Someone out there is making the most of every minute. Will that be you?",
    "Time doesn't care about your excuses. Neither does success. This month is nearly half gone - are you halfway to your goals?",
    `${yearProgress}% of the year has passed. Are you ${yearProgress}% closer to where you want to be?`,
    "While you hesitate, others execute. While you plan, others achieve. Time rewards action, not intention.",
    "You will never get today back. Never. Make it count or accept mediocrity.",
    "The gap between who you are and who you want to be is what you do right now.",
    "A year from now, you'll wish you had started today.",
    "Your future is created by what you do today, not tomorrow.",
  ];

  const randomIndex = Math.floor(Math.random() * messages.length);
  motivationEl.textContent = messages[randomIndex];
}

function generateLifeGrid() {
  const lifeGridEl = document.getElementById("life-grid");
  if (!lifeGridEl) return;

  lifeGridEl.innerHTML = "";

  const totalWeeks = 52;
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const weeksPassed = Math.floor(
    (now - startOfYear) / (7 * 24 * 60 * 60 * 1000)
  );

  for (let i = 0; i < totalWeeks; i++) {
    const weekEl = document.createElement("div");
    weekEl.className = "life-week";

    if (i < weeksPassed) {
      weekEl.classList.add("past");
    } else if (i === weeksPassed) {
      weekEl.classList.add("current");
    }

    lifeGridEl.appendChild(weekEl);
  }
}

function changeQuote() {
  const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
  motivationEl.textContent = motivationalQuotes[randomIndex];

  motivationEl.style.backgroundColor = "#555";
  setTimeout(() => {
    motivationEl.style.backgroundColor = "#333";
  }, 300);
}

// =============================================
// Storage & Data Management
// =============================================

function saveTasksToStorage() {
  localStorage.setItem("grindTrackerTasks", JSON.stringify(tasks));
}

function loadTasksFromStorage() {
  const storedTasks = localStorage.getItem("grindTrackerTasks");
  if (storedTasks) {
    tasks = JSON.parse(storedTasks);
  }
}

function saveActiveTasksState() {
  localStorage.setItem("grindTrackerActiveTasks", JSON.stringify(activeTasks));
}

function loadActiveTasksState() {
  const storedActiveTasks = localStorage.getItem("grindTrackerActiveTasks");
  if (storedActiveTasks) {
    const parsedTasks = JSON.parse(storedActiveTasks);

    Object.keys(parsedTasks).forEach((taskId) => {
      const id = parseInt(taskId);
      if (tasks.some((task) => task.id === id)) {
        activeTasks[id] = {
          timeSpent: parsedTasks[taskId].timeSpent,
          interval: null,
        };
      }
    });
  }
}

// =============================================
// Utility Functions
// =============================================

function formatTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

function formatSeconds(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
}

// Make functions globally accessible
window.toggleTimer = toggleTimer;
window.completeTask = completeTask;
window.deleteTask = deleteTask;

// Initialize when the page loads
window.addEventListener("load", init);
