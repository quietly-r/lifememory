
const $ = id => document.getElementById(id);

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

const freshData = () => ({
  tasks: [],
  habits: [],
  checks: {},
  diaries: {},
  profile: {},
  studySessions: []
});

let data = freshData();
let taskFilter = 'today';

try {
  const saved = localStorage.getItem('myRoomData');
  if (saved) data = { ...freshData(), ...JSON.parse(saved) };
} catch (e) {
  data = freshData();
}

function save() {
  try {
    localStorage.setItem('myRoomData', JSON.stringify(data));
  } catch (e) {
    alert('保存できませんでした。バックアップを確認してください。');
  }
}

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;',
    '"': '&quot;', "'": '&#39;'
  }[c]));
}

function makeId() {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function showPage(id) {
  document.querySelectorAll('.page').forEach(page => {
    page.classList.toggle('active', page.id === id);
  });
  document.querySelectorAll('.nav').forEach(button => {
    button.classList.toggle('active', button.dataset.page === id);
  });
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.querySelectorAll('[data-page]').forEach(button => {
  button.addEventListener('click', event => {
    event.preventDefault();
    showPage(button.dataset.page);
  });
});

document.querySelectorAll('[data-go]').forEach(button => {
  button.addEventListener('click', () => showPage(button.dataset.go));
});

function addTask(event) {
  event.preventDefault();
  const name = $('taskInput').value.trim();
  if (!name) return;
  data.tasks.push({
    id: makeId(), name,
    date: $('taskDate').value || todayKey(),
    done: false
  });
  $('taskInput').value = '';
  save();
  render();
}

function toggleTask(id) {
  const task = data.tasks.find(item => item.id === id);
  if (task) task.done = !task.done;
  save();
  render();
}

function deleteTask(id) {
  data.tasks = data.tasks.filter(item => item.id !== id);
  save();
  render();
}

function addHabit(event) {
  event.preventDefault();
  const name = $('habitInput').value.trim();
  if (!name) return;
  data.habits.push({ id: makeId(), name });
  $('habitInput').value = '';
  save();
  render();
}

function toggleHabit(id) {
  const key = todayKey();
  if (!data.checks[key]) data.checks[key] = [];
  const checked = data.checks[key];
  data.checks[key] = checked.includes(id)
    ? checked.filter(item => item !== id)
    : [...checked, id];
  save();
  render();
}

function deleteHabit(id) {
  data.habits = data.habits.filter(item => item.id !== id);
  Object.values(data.checks).forEach(list => {
    const index = list.indexOf(id);
    if (index !== -1) list.splice(index, 1);
  });
  save();
  render();
}

function taskHTML(task) {
  return `<div class="task-row ${task.done ? 'done' : ''}">
    <input type="checkbox" aria-label="完了" ${task.done ? 'checked' : ''}
      data-task-check="${esc(task.id)}">
    <span class="task-name">${esc(task.name)}</span>
    <button class="delete" aria-label="削除" data-task-delete="${esc(task.id)}">×</button>
  </div>`;
}

function habitHTML(habit, checked) {
  return `<div class="task-row ${checked ? 'done' : ''}">
    <input type="checkbox" aria-label="達成" ${checked ? 'checked' : ''}
      data-habit-check="${esc(habit.id)}">
    <span class="task-name">${esc(habit.name)}</span>
    <button class="delete" aria-label="削除" data-habit-delete="${esc(habit.id)}">×</button>
  </div>`;
}

function renderTasks() {
  const today = data.tasks.filter(task => task.date === todayKey());
  const completed = today.filter(task => task.done).length;
  $('taskCount').textContent = `${completed}/${today.length}`;
  $('taskProgress').style.width =
    `${today.length ? completed / today.length * 100 : 0}%`;

  let list = [...data.tasks].sort((a, b) => a.date.localeCompare(b.date));
  if (taskFilter === 'today') list = list.filter(task => task.date === todayKey());
  if (taskFilter === 'done') list = list.filter(task => task.done);

  $('taskList').innerHTML = list.length
    ? list.map(task => `<div class="diary-entry">
        <div class="diary-date">${esc(task.date)}</div>
        ${taskHTML(task)}
      </div>`).join('')
    : '<div class="empty">タスクはまだありません ♡</div>';

  $('homeTasks').innerHTML = today.length
    ? today.map(taskHTML).join('')
    : '<div class="empty">今日はまだタスクがありません ☁</div>';
}

function renderHabits() {
  const checked = data.checks[todayKey()] || [];
  const done = data.habits.filter(habit => checked.includes(habit.id)).length;
  $('habitCount').textContent = `${done}/${data.habits.length}`;
  $('habitProgress').style.width =
    `${data.habits.length ? done / data.habits.length * 100 : 0}%`;
  $('habitDate').textContent = todayKey();

  $('habitList').innerHTML = data.habits.length
    ? data.habits.map(habit => habitHTML(habit, checked.includes(habit.id))).join('')
    : '<div class="empty">習慣を追加してみましょう ♡</div>';

  $('homeHabits').innerHTML = data.habits.length
    ? data.habits.slice(0, 5).map(habit => habitHTML(habit, checked.includes(habit.id))).join('')
    : '<div class="empty">ゆっくり追加してね ☁</div>';
}

function loadDiary(date) {
  const diary = data.diaries[date] || {};
  $('diaryDate').value = date;
  $('mood').value = diary.mood || '';
  $('diaryText').value = diary.text || '';
  $('diaryAchievement').value = diary.achievement || '';
  showPage('diary');
}

function saveDiary(event) {
  event.preventDefault();
  const date = $('diaryDate').value || todayKey();
  data.diaries[date] = {
    mood: $('mood').value,
    text: $('diaryText').value,
    achievement: $('diaryAchievement').value
  };
  save();
  render();
  alert('記録を保存しました ♡');
}

function deleteDiary(date) {
  if (!confirm(`${date}の記録を削除しますか？`)) return;
  delete data.diaries[date];
  save();
  render();
}

function diaryHTML(date, diary) {
  return `<div class="diary-entry">
    <div class="diary-date">${esc(date)}　♡ ${esc(diary.mood || '未選択')}</div>
    <div class="diary-body">${esc(diary.text || '本文なし')}</div>
    ${diary.achievement ? `<div class="diary-body muted">できたこと：${esc(diary.achievement)}</div>` : ''}
    <button class="text-button" data-diary-edit="${esc(date)}">編集する ✎</button>
    <button class="delete" data-diary-delete="${esc(date)}">×</button>
  </div>`;
}

function renderDiaries() {
  const entries = Object.entries(data.diaries)
    .sort((a, b) => b[0].localeCompare(a[0]));

  $('diaryList').innerHTML = entries.length
    ? entries.map(([date, diary]) => diaryHTML(date, diary)).join('')
    : '<div class="empty">記録はまだありません ♡</div>';

  $('recentDiaries').innerHTML = entries.length
    ? entries.slice(0, 3).map(([date, diary]) =>
        `<div class="diary-entry">
          <div class="diary-date">${esc(date)}　♡ ${esc(diary.mood || '')}</div>
          <div class="diary-body">${esc(diary.text || diary.achievement || '記録しました')}</div>
        </div>`).join('')
    : '<div class="empty">今日のことを残してみよう ♡</div>';

  const today = data.diaries[todayKey()];
  $('moodSummary').textContent = today?.mood || '未記録';
}

function saveProfile(event) {
  event.preventDefault();
  data.profile = {
    nickname: $('nickname').value,
    birthday: $('birthday').value,
    interests: $('interests').value,
    goals: $('goals').value,
    profileMemo: $('profileMemo').value
  };
  save();
  alert('プロフィールを保存しました ♡');
}

function loadProfile() {
  Object.entries(data.profile || {}).forEach(([key, value]) => {
    if ($(key)) $(key).value = value || '';
  });
}

function exportData() {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'my-room-backup.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function importData() {
  const file = $('importFile').files[0];
  if (!file) return alert('バックアップファイルを選択してください！');

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const incoming = JSON.parse(reader.result);
      if (!Array.isArray(incoming.tasks) ||
          !Array.isArray(incoming.habits) ||
          !incoming.diaries || !incoming.profile ||
          !incoming.checks) throw new Error('Invalid backup');

      if (!confirm('現在のデータを置き換えますか？')) return;
      data = { ...freshData(), ...incoming };
      save();
      loadProfile();
      render();
      alert('復元しました ♡');
    } catch (error) {
      alert('バックアップファイルを読み込めませんでした。');
    }
  };
  reader.readAsText(file);
}

document.querySelectorAll('[data-filter]').forEach(button => {
  button.addEventListener('click', () => {
    taskFilter = button.dataset.filter;
    document.querySelectorAll('[data-filter]').forEach(item => {
      item.classList.toggle('active', item === button);
    });
    renderTasks();
  });
});

$('taskForm').addEventListener('submit', addTask);
$('habitForm').addEventListener('submit', addHabit);
$('diaryForm').addEventListener('submit', saveDiary);
$('profileForm').addEventListener('submit', saveProfile);
$('exportButton').addEventListener('click', exportData);
$('importButton').addEventListener('click', importData);

$('diaryDate').addEventListener('change', () => {
  const diary = data.diaries[$('diaryDate').value] || {};
  $('mood').value = diary.mood || '';
  $('diaryText').value = diary.text || '';
  $('diaryAchievement').value = diary.achievement || '';
});

document.addEventListener('change', event => {
  const target = event.target;
  if (target.dataset.taskCheck) toggleTask(target.dataset.taskCheck);
  if (target.dataset.habitCheck) toggleHabit(target.dataset.habitCheck);
});

document.addEventListener('click', event => {
  const target = event.target.closest('button');
  if (!target) return;
  if (target.dataset.taskDelete) deleteTask(target.dataset.taskDelete);
  if (target.dataset.habitDelete) deleteHabit(target.dataset.habitDelete);
  if (target.dataset.diaryDelete) deleteDiary(target.dataset.diaryDelete);
  if (target.dataset.diaryEdit) loadDiary(target.dataset.diaryEdit);
});

$('today').textContent = new Date().toLocaleDateString('ja-JP', {
  year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
});

$('taskDate').value = todayKey();
$('diaryDate').value = todayKey();
loadProfile();

const initialDiary = data.diaries[todayKey()] || {};
$('mood').value = initialDiary.mood || '';
$('diaryText').value = initialDiary.text || '';
$('diaryAchievement').value = initialDiary.achievement || '';

renderTasks();
renderHabits();
renderDiaries();


let studyElapsed = 0;
let studyStartedAt = null;
let studyInterval = null;

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
}

function currentElapsed() {
  return studyElapsed + (studyStartedAt === null
    ? 0
    : Math.floor((Date.now() - studyStartedAt) / 1000));
}

function updateTimer() {
  $('timerDisplay').textContent = formatTime(currentElapsed());
}

function startTimer() {
  if (studyStartedAt !== null) return;

  studyStartedAt = Date.now();
  $('timerStatus').textContent = 'STUDYING... ♡';
  studyInterval = setInterval(updateTimer, 250);
  updateTimer();
}

function pauseTimer() {
  if (studyStartedAt === null) return;

  studyElapsed = currentElapsed();
  studyStartedAt = null;
  clearInterval(studyInterval);
  studyInterval = null;
  $('timerStatus').textContent = 'PAUSED';
  updateTimer();
}

function resetTimer() {
  pauseTimer();
  studyElapsed = 0;
  $('timerStatus').textContent = 'READY ♡';
  updateTimer();
}

function saveStudySession() {
  pauseTimer();

  const seconds = studyElapsed;
  if (seconds < 1) {
    alert('先にタイマーを動かしてください！');
    return;
  }

  data.studySessions ||= [];
  data.studySessions.push({
    id: makeId(),
    date: todayKey(),
    subject: $('studySubject').value,
    seconds,
    createdAt: new Date().toISOString()
  });

  save();
  studyElapsed = 0;
  $('timerStatus').textContent = 'SAVED ♡';
  updateTimer();
  renderStudy();
  alert('勉強記録を保存しました！');
}

function renderStudy() {
  const sessions = data.studySessions || [];
  const today = sessions.filter(s => s.date === todayKey());
  const total = today.reduce((sum, s) => sum + s.seconds, 0);

  $('studyTodayTotal').textContent =
    `${Math.floor(total / 60)}分`;

  const subjects = {};
  today.forEach(s => {
    subjects[s.subject] = (subjects[s.subject] || 0) + s.seconds;
  });

  $('studySubjectTotals').innerHTML =
    Object.entries(subjects).length
      ? Object.entries(subjects).map(([subject, seconds]) =>
          `<div class="study-subject-row">
            <span>${esc(subject)}</span>
            <span>${Math.floor(seconds / 60)}分</span>
          </div>`).join('')
      : '<div class="empty">今日の記録はまだありません ♡</div>';

  $('studyHistory').innerHTML = sessions.length
    ? [...sessions].reverse().map(s =>
        `<div class="study-entry">
          <div>${esc(s.date)}　♡ ${esc(s.subject)}</div>
          <div>${Math.floor(s.seconds / 60)}分 ${s.seconds % 60}秒</div>
          <button class="delete" data-study-delete="${esc(s.id)}">×</button>
        </div>`).join('')
    : '<div class="empty">勉強した時間がここに残ります ♡</div>';
}

$('timerStart').addEventListener('click', startTimer);
$('timerPause').addEventListener('click', pauseTimer);
$('timerReset').addEventListener('click', resetTimer);
$('timerSave').addEventListener('click', saveStudySession);

document.addEventListener('click', event => {
  const button = event.target.closest('[data-study-delete]');
  if (!button) return;

  data.studySessions = (data.studySessions || [])
    .filter(s => s.id !== button.dataset.studyDelete);

  save();
  renderStudy();
});

const previousRender = typeof render === 'function' ? render : null;
function render() {
  renderTasks();
  renderHabits();
  renderDiaries();
  renderStudy();
}

updateTimer();
renderStudy();

