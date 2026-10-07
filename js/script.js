const pad = number => String(number).padStart(2, '0');
const now = new Date();
const dayKey = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
const storageKey = `js-study-checklist:${dayKey}`;
const checks = [...document.querySelectorAll('input[type="checkbox"][data-task]')];
const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');

document.getElementById('today').textContent = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long', day: '2-digit', month: 'long'
}).format(now).replace(/^./, letter => letter.toUpperCase());

function updateProgress() {
  const completed = checks.filter(check => check.checked).length;
  const percent = Math.round((completed / checks.length) * 100);
  document.getElementById('progressNumber').textContent = `${percent}%`;
  document.getElementById('progressBar').style.width = `${percent}%`;
  document.getElementById('progressLabel').textContent = completed === 0
    ? 'Nenhuma tarefa concluída'
    : completed === checks.length
      ? 'Sessão completa. Mandou bem!'
      : `${completed} de ${checks.length} tarefas concluídas`;
}

checks.forEach(check => {
  check.checked = Boolean(saved[check.dataset.task]);
  check.addEventListener('change', () => {
    const state = Object.fromEntries(checks.map(item => [item.dataset.task, item.checked]));
    localStorage.setItem(storageKey, JSON.stringify(state));
    updateProgress();
  });
});

document.getElementById('clearDay').addEventListener('click', () => {
  checks.forEach(check => { check.checked = false; });
  localStorage.removeItem(storageKey);
  updateProgress();
});

function minutesToday(date) { return date.getHours() * 60 + date.getMinutes(); }
function parseTime(value) { const [h, m] = value.split(':').map(Number); return h * 60 + m; }

function highlightCurrent() {
  const minute = minutesToday(new Date());
  let active = null;
  document.querySelectorAll('.block').forEach(block => {
    const isCurrent = minute >= parseTime(block.dataset.start) && minute < parseTime(block.dataset.end);
    block.classList.toggle('current', isCurrent);
    if (isCurrent) active = block;
  });
  const status = document.getElementById('statusText');
  if (minute < 15 * 60) status.textContent = 'Sua sessão começa às 15h.';
  else if (minute >= 18 * 60) status.textContent = 'Sessão encerrada. Até amanhã!';
  else status.textContent = active ? `Agora: ${active.querySelector('h3').textContent}` : 'Continue no bloco atual.';
}

const cycleStorageKey = `js-study-pomodoro-cycle:${dayKey}`;
let completedPomodoros = Number(localStorage.getItem(cycleStorageKey) || 0);
if (!Number.isFinite(completedPomodoros) || completedPomodoros < 0 || completedPomodoros > 3) completedPomodoros = 0;
let mode = 'focus';
let remaining = 25 * 60;
let interval = null;
const timer = document.getElementById('timer');
const timerMode = document.getElementById('timerMode');
const timerToggle = document.getElementById('timerToggle');

function renderTimer() {
  const text = `${pad(Math.floor(remaining / 60))}:${pad(remaining % 60)}`;
  timer.textContent = text;
  document.title = interval ? `${text} · ${mode === 'focus' ? 'Foco' : 'Pausa'}` : 'Meu foco em JavaScript';
}

function stopTimer() {
  clearInterval(interval);
  interval = null;
  timerToggle.textContent = 'Continuar';
}

function beep() {
  try {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.connect(gain); gain.connect(context.destination);
    oscillator.frequency.value = 740; gain.gain.value = .12;
    oscillator.start(); oscillator.stop(context.currentTime + .35);
  } catch (_) {}
}

timerToggle.addEventListener('click', () => {
  if (interval) { stopTimer(); return; }
  timerToggle.textContent = 'Pausar';
  interval = setInterval(() => {
    remaining -= 1;
    if (remaining <= 0) {
      beep();
      if (mode === 'focus') {
        completedPomodoros += 1;
        const isLongBreak = completedPomodoros === 4;
        mode = 'break';
        remaining = (isLongBreak ? 60 : 5) * 60;
        timerMode.textContent = isLongBreak ? 'Descanso longo · 1 hora' : 'Descanso · 5 minutos';
        if (isLongBreak) completedPomodoros = 0;
        localStorage.setItem(cycleStorageKey, String(completedPomodoros));
      } else {
        mode = 'focus';
        remaining = 25 * 60;
        timerMode.textContent = `Foco · Pomodoro ${completedPomodoros + 1} de 4`;
      }
      stopTimer();
      timerToggle.textContent = 'Começar';
    }
    renderTimer();
  }, 1000);
});

document.getElementById('timerReset').addEventListener('click', () => {
  stopTimer(); mode = 'focus'; remaining = 25 * 60;
  timerMode.textContent = `Foco · Pomodoro ${completedPomodoros + 1} de 4`;
  timerToggle.textContent = 'Começar'; renderTimer();
});

updateProgress();
highlightCurrent();
timerMode.textContent = `Foco · Pomodoro ${completedPomodoros + 1} de 4`;
renderTimer();
setInterval(highlightCurrent, 30000);
