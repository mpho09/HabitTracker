

/* ── State ── */
let habits = JSON.parse(localStorage.getItem('snpl_habits') || '[]');
let activeFilter = 'all';
let nextId = parseInt(localStorage.getItem('snpl_nextId') || '1', 10);



function saveToStorage() {
  localStorage.setItem('snpl_habits', JSON.stringify(habits));
  localStorage.setItem('snpl_nextId', String(nextId));
}



function validateForm() {
  const name      = document.getElementById('habit-name').value.trim();
  const targetRaw = document.getElementById('habit-target').value;
  const category  = document.getElementById('habit-category').value;
  const errorEl   = document.getElementById('form-error');

  if (name.length < 3) {
    errorEl.textContent = 'Habit name must be at least 3 characters.';
    return false;
  }

  const target = Number(targetRaw);
  if (!targetRaw || !Number.isInteger(target) || target < 1 || target > 7) {
    errorEl.textContent = 'Target must be a whole number between 1 and 7.';
    return false;
  }

  if (!category) {
    errorEl.textContent = 'Please select a category.';
    return false;
  }

  errorEl.textContent = '';
  return { name, target, category };
}



function addHabit(name, target, category) {
  const newHabit = {
    id:        nextId++,
    name:      name,
    category:  category,
    target:    target,
    streak:    0,
    doneToday: false,
  };

  habits.push(newHabit);
  saveToStorage();
  renderHabits();
  updateSummary();
}



function deleteHabit(id) {
  habits = habits.filter(function (h) { return h.id !== id; });
  saveToStorage();
  renderHabits();
  updateSummary();
}


function toggleDone(id) {
  const habit = habits.find(function (h) { return h.id === id; });
  if (!habit) return;

  if (!habit.doneToday) {
    habit.doneToday = true;
    habit.streak += 1;
  } else {
    habit.doneToday = false;
    habit.streak = Math.max(0, habit.streak - 1);
  }

  saveToStorage();
  renderHabits();
  updateSummary();
}



function renderHabits() {
  const container = document.getElementById('habits-container');

  // Apply filter
  const filtered = activeFilter === 'all'
    ? habits
    : habits.filter(function (h) { return h.category === activeFilter; });

  // Update count label
  const countEl = document.getElementById('habit-count');
  if (filtered.length === 0) {
    countEl.textContent = '';
  } else if (filtered.length === 1) {
    countEl.textContent = '1 habit';
  } else {
    countEl.textContent = filtered.length + ' habits';
  }

  // Empty state
  if (filtered.length === 0) {
    const message = habits.length === 0
      ? 'No habits yet — add one above.'
      : 'No habits in this category.';

    container.innerHTML =
      '<div class="empty-state">' +
        '<span class="icon">✦</span>' +
        '<p>' + message + '</p>' +
      '</div>';
    return;
  }

  // Build cards
  container.innerHTML = '';

  filtered.forEach(function (h) {
    const card = document.createElement('div');
    card.className = 'habit-card' + (h.doneToday ? ' done' : '');
    card.dataset.id = h.id;

    card.innerHTML =
      '<input type="checkbox" class="habit-check"' +
        ' aria-label="Mark ' + escHtml(h.name) + ' done"' +
        (h.doneToday ? ' checked' : '') + '>' +
      '<div class="habit-info">' +
        '<div class="habit-name">' + escHtml(h.name) + '</div>' +
        '<div class="habit-meta">' +
          '<span class="cat-badge cat-' + h.category + '">' + h.category + '</span>' +
          '<span class="habit-target">target: ' + h.target + '×/wk</span>' +
        '</div>' +
      '</div>' +
      '<div class="habit-actions">' +
        '<div class="streak">' +
          '<span class="streak-val">' + h.streak + '</span>' +
          '<span class="streak-label">streak</span>' +
        '</div>' +
        '<button class="btn-delete" aria-label="Delete ' + escHtml(h.name) + '">✕</button>' +
      '</div>';

    // Attach listeners to this card's interactive elements
    card.querySelector('.habit-check').addEventListener('change', function () {
      toggleDone(h.id);
    });

    card.querySelector('.btn-delete').addEventListener('click', function () {
      deleteHabit(h.id);
    });

    container.appendChild(card);
  });
}



function updateSummary() {
  const total = habits.length;
  const done  = habits.filter(function (h) { return h.doneToday; }).length;
  const pct   = total === 0 ? 0 : Math.round((done / total) * 100);

  document.getElementById('sum-total').textContent = total;
  document.getElementById('sum-done').textContent  = done;
  document.getElementById('sum-pct').textContent   = pct + '%';
  document.getElementById('progress-fill').style.width = pct + '%';
}



function escHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}




// Form submission
document.getElementById('habit-form').addEventListener('submit', function (e) {
  e.preventDefault();
  const result = validateForm();
  if (!result) return;
  addHabit(result.name, result.target, result.category);
  e.target.reset();
  document.getElementById('form-error').textContent = '';
});

// Category filter buttons (event delegation on the parent)
document.getElementById('filter-bar').addEventListener('click', function (e) {
  const btn = e.target.closest('.filter-btn');
  if (!btn) return;

  document.querySelectorAll('.filter-btn').forEach(function (b) {
    b.classList.remove('active');
  });
  btn.classList.add('active');

  activeFilter = btn.dataset.filter;
  renderHabits();
});

renderHabits();
updateSummary();