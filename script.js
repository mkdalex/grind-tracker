// Initial tasks
let tasks = [];

let activeTaskId = null;
let taskTime = 0;
let timerInterval = null;

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
  "Don't wish it were easier. Wish you were better."
];

// DOM elements
const timeLeftEl = document.getElementById('time-left');
const timeNeededEl = document.getElementById('time-needed');
const taskListEl = document.getElementById('task-list');
const motivationEl = document.getElementById('motivation-quote');
const newTaskNameEl = document.getElementById('new-task-name');
const newTaskTimeEl = document.getElementById('new-task-time');
const addTaskBtn = document.getElementById('add-task-btn');
const progressCircle = document.getElementById('progress-circle');
const percentageText = document.getElementById('progress-percentage');

// Initialize
function init() {
  // Load tasks from local storage
  loadTasksFromStorage();
  
  // Load active task state
  loadActiveTaskState();
  
  updateTimeLeft();
  updateTaskList();
  
  // Set up timer to update time left every minute
  setInterval(updateTimeLeft, 60000);
  
  // Set up timer to change motivational quote
  setInterval(changeQuote, 15000);
  
  // Set up timer to update progress circle more frequently
  setInterval(() => {
    const now = new Date();
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59);
    const minutesLeft = Math.floor((endOfDay - now) / 60000);
    
    const totalMinutes = tasks
      .filter(task => !task.completed)
      .reduce((total, task) => total + task.timeAllocated, 0);
      
    updateProgressCircle(totalMinutes, minutesLeft);
  }, 5000);
  
  // Add event listener for adding new tasks
  addTaskBtn.addEventListener('click', addNewTask);
  
  // Set up the time perspective modal
  setupTimePerspectiveModal();
}

// Set up time perspective modal
function setupTimePerspectiveModal() {
  const progressCircle = document.getElementById('progress-circle-svg');
  const modal = document.getElementById('time-perspective-modal');
  const closeButton = document.getElementById('close-modal');
  
  // Open modal when clicking on progress circle
  progressCircle.addEventListener('click', () => {
    updateTimePerspective();
    modal.classList.add('active');
  });
  
  // Close modal when clicking on close button
  closeButton.addEventListener('click', () => {
    modal.classList.remove('active');
  });
  
  // Close modal when clicking outside content
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
    }
  });
  
  // Generate life grid
  generateLifeGrid();
}

// Update time left in the day
function updateTimeLeft() {
  const now = new Date();
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59);
  
  const minutesLeft = Math.floor((endOfDay - now) / 60000);
  timeLeftEl.textContent = formatTime(minutesLeft);
  
  // Also update time needed
  updateTimeNeeded();
}

// Update time needed for all incomplete tasks
function updateTimeNeeded() {
  const totalMinutes = tasks
    .filter(task => !task.completed)
    .reduce((total, task) => total + task.timeAllocated, 0);
  
  timeNeededEl.textContent = formatTime(totalMinutes);
  
  // Check if we have a time deficit
  const now = new Date();
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59);
  const minutesLeft = Math.floor((endOfDay - now) / 60000);
  
  if (totalMinutes > minutesLeft) {
    timeNeededEl.style.color = '#ff5555';
  } else {
    timeNeededEl.style.color = '#55ff55';
  }
  
  // Update progress circle
  updateProgressCircle(totalMinutes, minutesLeft);
  
  // Update tasks completed
  const completedCount = tasks.filter(task => task.completed).length;
  const totalCount = tasks.length;
  document.getElementById('tasks-completed').textContent = `${completedCount}/${totalCount}`;
  
  // Update time efficiency
  const efficiencyEl = document.getElementById('time-efficiency');
  if (activeTaskId) {
    efficiencyEl.textContent = "Active ⚡";
    efficiencyEl.style.color = '#55ff55';
  } else {
    efficiencyEl.textContent = "Inactive ⚠️";
    efficiencyEl.style.color = '#ff5555';
  }
}

// Update progress circle
function updateProgressCircle(totalMinutes, minutesLeft) {
  const progressCircle = document.getElementById('progress-circle');
  const percentageText = document.getElementById('progress-percentage');
  
  const circumference = 2 * Math.PI * 45; // r = 45
  
  // Calculate percentage of day planned
  const percentage = Math.min(100, Math.round((totalMinutes / (minutesLeft || 1)) * 100));
  
  // Update stroke dash offset
  const offset = circumference - (percentage / 100) * circumference;
  progressCircle.style.strokeDashoffset = offset;
  
  // Update percentage text
  percentageText.textContent = `${percentage}%`;
  
  // Change color based on percentage
  if (percentage > 90) {
    progressCircle.classList.add('progress-danger');
  } else {
    progressCircle.classList.remove('progress-danger');
  }
}

// Format minutes to hours and minutes
function formatTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

// Format seconds for the timer display
function formatSeconds(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}

// Change the motivational quote
function changeQuote() {
  const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
  motivationEl.textContent = motivationalQuotes[randomIndex];
  
  // Add a flash effect to highlight the new quote
  motivationEl.style.backgroundColor = '#555';
  setTimeout(() => {
    motivationEl.style.backgroundColor = '#333';
  }, 300);
}

// Update the task list in the DOM
function updateTaskList() {
  taskListEl.innerHTML = '';
  
  tasks.forEach(task => {
    const taskEl = document.createElement('div');
    taskEl.className = `task-item ${task.completed ? 'completed' : ''} ${activeTaskId === task.id ? 'active' : ''}`;
    
    const isActive = activeTaskId === task.id;
    
    taskEl.innerHTML = `
      <div class="task-info">
        <div class="task-name ${task.completed ? 'completed' : ''}">${task.name}</div>
        <div class="task-time">Allocated: ${formatTime(task.timeAllocated)}</div>
      </div>
      
      ${isActive ? `<div class="task-timer">${formatSeconds(taskTime)}</div>` : ''}
      
      <div class="button-group">
        ${!task.completed ? `
          <button class="btn-${isActive && timerInterval ? 'pause' : 'play'}" onclick="toggleTimer(${task.id})">
            ${isActive && timerInterval ? '⏸️' : '▶️'}
          </button>
          <button class="btn-complete" onclick="completeTask(${task.id})">✓</button>
        ` : ''}
        <button class="btn-delete" onclick="deleteTask(${task.id})">🗑️</button>
      </div>
    `;
    
    taskListEl.appendChild(taskEl);
  });
  
  updateTimeNeeded();
}

// Toggle timer for a task
function toggleTimer(taskId) {
  if (activeTaskId === taskId) {
    // Pause/resume current task
    if (timerInterval) {
      // Pause
      clearInterval(timerInterval);
      timerInterval = null;
    } else {
      // Resume
      timerInterval = setInterval(() => {
        taskTime++;
        updateTaskList();
      }, 1000);
    }
  } else {
    // Switch to new task
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    
    activeTaskId = taskId;
    taskTime = 0;
    
    timerInterval = setInterval(() => {
      taskTime++;
      updateTaskList();
    }, 1000);
  }
  
  // Save active task state to storage
  saveActiveTaskState();
  
  updateTaskList();
}

// Mark a task as completed
function completeTask(taskId) {
  tasks = tasks.map(task => 
    task.id === taskId ? { ...task, completed: true } : task
  );
  
  // Save to local storage
  saveTasksToStorage();
  
  if (activeTaskId === taskId) {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    activeTaskId = null;
  }
  
  updateTaskList();
}

// Delete a task
function deleteTask(taskId) {
  tasks = tasks.filter(task => task.id !== taskId);
  
  // Save to local storage
  saveTasksToStorage();
  
  if (activeTaskId === taskId) {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    activeTaskId = null;
  }
  
  updateTaskList();
}

// Add a new task
function addNewTask() {
  const name = newTaskNameEl.value.trim();
  if (!name) return;
  
  const timeAllocated = parseInt(newTaskTimeEl.value);
  
  const newTask = {
    id: Date.now(),
    name,
    timeAllocated,
    completed: false
  };
  
  tasks.push(newTask);
  
  // Save to local storage
  saveTasksToStorage();
  
  newTaskNameEl.value = '';
  
  updateTaskList();
}

// Save tasks to local storage
function saveTasksToStorage() {
  localStorage.setItem('grindTrackerTasks', JSON.stringify(tasks));
}

// Load tasks from local storage
function loadTasksFromStorage() {
  const storedTasks = localStorage.getItem('grindTrackerTasks');
  if (storedTasks) {
    tasks = JSON.parse(storedTasks);
  }
}

// Save active task state to local storage
function saveActiveTaskState() {
  const activeTaskState = {
    activeTaskId,
    taskTime
  };
  localStorage.setItem('grindTrackerActiveTask', JSON.stringify(activeTaskState));
}

// Load active task state from local storage
function loadActiveTaskState() {
  const storedActiveTask = localStorage.getItem('grindTrackerActiveTask');
  if (storedActiveTask) {
    const { activeTaskId: storedId, taskTime: storedTime } = JSON.parse(storedActiveTask);
    
    // Only restore if the task still exists
    if (storedId && tasks.some(task => task.id === storedId)) {
      activeTaskId = storedId;
      taskTime = storedTime;
      
      // Don't automatically resume the timer, but show the current state
    }
  }
}

// Update time perspective information
function updateTimePerspective() {
  const now = new Date();
  
  // Calculate week progress
  const dayOfWeek = now.getDay() || 7; // Make Sunday 7 instead of 0
  const weekProgress = Math.round((dayOfWeek / 7) * 100);
  document.getElementById('week-progress').textContent = `${weekProgress}%`;
  document.getElementById('week-bar').style.width = `${weekProgress}%`;
  
  // Calculate month progress
  const dayOfMonth = now.getDate();
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthProgress = Math.round((dayOfMonth / lastDayOfMonth) * 100);
  document.getElementById('month-progress').textContent = `${monthProgress}%`;
  document.getElementById('month-bar').style.width = `${monthProgress}%`;
  
  // Calculate year progress
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const endOfYear = new Date(now.getFullYear() + 1, 0, 1);
  const yearProgress = Math.round(((now - startOfYear) / (endOfYear - startOfYear)) * 100);
  document.getElementById('year-progress').textContent = `${yearProgress}%`;
  document.getElementById('year-bar').style.width = `${yearProgress}%`;
  
  // Set productive hours (would normally be calculated from actual data)
  // For demo purposes, using a placeholder value
  const productiveHours = 8.5;
  const maxWeeklyHours = 40; // Assuming 40 productive hours per week is the goal
  const productivePercentage = Math.round((productiveHours / maxWeeklyHours) * 100);
  document.getElementById('productive-hours').textContent = `${productiveHours}h`;
  document.getElementById('productive-bar').style.width = `${productivePercentage}%`;
  
  // Update motivation message
  updatePerspectiveMotivation(weekProgress, monthProgress, yearProgress);
}

// Update motivation message based on time progression
function updatePerspectiveMotivation(weekProgress, monthProgress, yearProgress) {
  const motivationEl = document.getElementById('perspective-motivation');
  const messages = [
    "Another week is slipping by. What will you have to show for it? Someone out there is making the most of every minute. Will that be you?",
    "Time doesn't care about your excuses. Neither does success. This month is nearly half gone - are you halfway to your goals?",
    `${yearProgress}% of the year has passed. Are you ${yearProgress}% closer to where you want to be?`,
    "While you hesitate, others execute. While you plan, others achieve. Time rewards action, not intention.",
    "You will never get today back. Never. Make it count or accept mediocrity.",
    "The gap between who you are and who you want to be is what you do right now.",
    "A year from now, you'll wish you had started today.",
    "Your future is created by what you do today, not tomorrow."
  ];
  
  const randomIndex = Math.floor(Math.random() * messages.length);
  motivationEl.textContent = messages[randomIndex];
}

// Generate life grid visualization
function generateLifeGrid() {
  const lifeGridEl = document.getElementById('life-grid');
  lifeGridEl.innerHTML = '';
  
  // Assuming 80 years = 4,160 weeks (showing just one year = 52 weeks for simplicity)
  const totalWeeks = 52;
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const weeksPassed = Math.floor((now - startOfYear) / (7 * 24 * 60 * 60 * 1000));
  
  for (let i = 0; i < totalWeeks; i++) {
    const weekEl = document.createElement('div');
    weekEl.className = 'life-week';
    
    if (i < weeksPassed) {
      weekEl.classList.add('past');
    } else if (i === weeksPassed) {
      weekEl.classList.add('current');
    }
    
    lifeGridEl.appendChild(weekEl);
  }
}



// Make the toggle timer and task functions globally accessible
window.toggleTimer = toggleTimer;
window.completeTask = completeTask;
window.deleteTask = deleteTask;

// Initialize when the page loads
window.addEventListener('load', init);