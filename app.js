/* ================================================================
   AI Study Planner — app.js
   All logic lives here.  No external libraries or APIs are used.
   The "AI" is just JavaScript rules — no real AI model is called.
   Comments throughout explain every major step for beginners.
   ================================================================ */

// ----------------------------------------------------------------
// 1. GRAB REFERENCES TO DOM ELEMENTS
//    document.getElementById() finds an element on the page by its
//    id="" attribute from the HTML.
// ----------------------------------------------------------------
const planForm        = document.getElementById('planForm');
const outputSection   = document.getElementById('outputSection');
const inputSection    = document.getElementById('inputSection');
const resetBtn        = document.getElementById('resetBtn');
const sessionsGrid    = document.getElementById('sessionsGrid');
const tipsList        = document.getElementById('tipsList');
const tipsCard        = document.getElementById('tipsCard');
const planTitle       = document.getElementById('planTitle');
const planSubtitle    = document.getElementById('planSubtitle');
const progressBar     = document.getElementById('progressBar');
const progressLabel   = document.getElementById('progressLabel');
const sessionsCompletedEl = document.getElementById('sessionsCompleted');
// New visual elements added in the polished UI
const progressPercent = document.getElementById('progressPercent');
const progressCount   = document.getElementById('progressCount');
const generateBtn     = document.getElementById('generateBtn');

// ----------------------------------------------------------------
// 2. INPUT FIELDS
// ----------------------------------------------------------------
const subjectInput    = document.getElementById('subject');
const hoursInput      = document.getElementById('hours');
const daysInput       = document.getElementById('days');

// ----------------------------------------------------------------
// 3. ERROR MESSAGE SPANS
// ----------------------------------------------------------------
const subjectError    = document.getElementById('subjectError');
const hoursError      = document.getElementById('hoursError');
const difficultyError = document.getElementById('difficultyError');
const daysError       = document.getElementById('daysError');

// ----------------------------------------------------------------
// 4. STUDY TIPS DATA
//    We have separate tip lists for each difficulty level.
//    When the plan is generated we randomly pick 3 tips to display.
// ----------------------------------------------------------------
const TIPS = {
  Easy: [
    'Use the Pomodoro technique: 25 min focus, 5 min break.',
    'Read your notes aloud — speaking helps memory retention.',
    'Draw simple diagrams or mind maps to visualise concepts.',
    'Review yesterday\'s material for 5 minutes before starting new topics.',
    'Keep your study space tidy to minimise distractions.',
    'Set a consistent start time each day to build a habit.',
  ],
  Medium: [
    'Break large topics into smaller sub-topics and tackle one at a time.',
    'After reading a section, close the book and write what you remember.',
    'Use flashcards for key terms and review them before bed.',
    'Teach the concept to an imaginary student — if you can explain it, you know it.',
    'Alternate between subjects to prevent mental fatigue.',
    'Drink water regularly — hydration improves concentration.',
  ],
  Hard: [
    'Prioritise understanding over memorising — focus on the "why".',
    'Solve past exam questions under timed conditions to build exam stamina.',
    'Identify your weakest areas first and allocate more time to them.',
    'Get at least 7–8 hours of sleep — memory consolidation happens overnight.',
    'Create a summary sheet of the most important formulas or concepts.',
    'Study the hardest material when your energy is at its peak (usually morning).',
  ],
};

// ----------------------------------------------------------------
// 5. SESSION TEMPLATES
//    Each difficulty level has a set of session blueprints.
//    Each session has a type, icon, title, and description template.
//    We use the actual hours entered to fill in durations later.
// ----------------------------------------------------------------
const SESSION_TEMPLATES = {
  Easy: [
    { type: 'study',    icon: '📖', title: 'Core Reading',       descTpl: 'Read through the main {subject} material carefully. Focus on understanding the key ideas.' },
    { type: 'study',    icon: '✏️', title: 'Note-Taking',        descTpl: 'Write concise notes on what you just read. Use your own words to aid memory.' },
    { type: 'revision', icon: '🔁', title: 'Quick Revision',     descTpl: 'Flip through your {subject} notes from previous sessions to reinforce what you have learned.' },
    { type: 'practice', icon: '✅', title: 'Light Practice',     descTpl: 'Try a few easy exercises or quizzes on {subject} to confirm your understanding.' },
    { type: 'break',    icon: '☕', title: 'Recharge Break',      descTpl: 'Step away from the desk. Stretch, hydrate, and let your brain rest before the next round.' },
  ],
  Medium: [
    { type: 'study',    icon: '📗', title: 'Deep Study',          descTpl: 'Work through the core concepts of {subject} section by section. Take brief notes as you go.' },
    { type: 'study',    icon: '🧩', title: 'Concept Mapping',     descTpl: 'Draw a mind map or list the key connections in {subject}. Linking ideas boosts recall.' },
    { type: 'revision', icon: '🔄', title: 'Active Recall',       descTpl: 'Close your notes and write down everything you remember about {subject}. Then check what you missed.' },
    { type: 'practice', icon: '📝', title: 'Worked Examples',     descTpl: 'Solve {subject} practice problems step-by-step. Focus on method, not just the answer.' },
    { type: 'break',    icon: '🚶', title: 'Movement Break',      descTpl: 'Go for a short walk or do light stretching. Physical movement refreshes mental focus.' },
  ],
  Hard: [
    { type: 'study',    icon: '📕', title: 'Intensive Study',     descTpl: 'Focus deeply on the most challenging {subject} topics. Break each one into smaller parts.' },
    { type: 'study',    icon: '🧠', title: 'Critical Analysis',   descTpl: 'Question your assumptions about {subject}. Ask "why" and "how" at every step.' },
    { type: 'revision', icon: '♻️', title: 'Spaced Revision',    descTpl: 'Revisit notes from 2–3 days ago on {subject}. Spaced repetition is proven to boost retention.' },
    { type: 'practice', icon: '🏋️', title: 'Exam-Style Practice', descTpl: 'Attempt timed past-paper questions on {subject}. Aim to answer under realistic exam conditions.' },
    { type: 'break',    icon: '🛌', title: 'Rest & Recharge',     descTpl: 'Rest is part of the plan. Take a proper break — a tired brain cannot absorb new information.' },
  ],
};

// ----------------------------------------------------------------
// 6. HELPER — pick N random items from an array
//    We use this to select 3 tips without repeating any.
// ----------------------------------------------------------------
function pickRandom(arr, n) {
  // Copy the array so we don't modify the original, then shuffle it
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]]; // swap
  }
  return copy.slice(0, n); // return the first n items after shuffling
}

// ----------------------------------------------------------------
// 7. HELPER — calculate recommended daily study duration
//    Logic:
//    - Easy:   use the hours the student entered as-is
//    - Medium: add 20% more focus time (round to nearest 0.5)
//    - Hard:   add 40% more focus time (round to nearest 0.5)
//    We also cap suggestions at the total hours available.
// ----------------------------------------------------------------
function recommendedHours(hours, difficulty) {
  const multipliers = { Easy: 1.0, Medium: 1.2, Hard: 1.4 };
  const raw = hours * multipliers[difficulty];
  // Round to nearest 0.5
  return Math.min(hours, Math.round(raw * 2) / 2);
}

// ----------------------------------------------------------------
// 8. HELPER — split total hours into session durations
//    Given a total and a count of sessions, divide the time up.
//    Break gets a fixed 15 min; the rest share the remaining time.
// ----------------------------------------------------------------
function splitTime(totalHours, sessionCount) {
  const breakMinutes  = 15;
  const studyMinutes  = Math.round(totalHours * 60) - breakMinutes;
  const studySessions = sessionCount - 1; // everything except the break
  const perSession    = Math.max(10, Math.round(studyMinutes / studySessions));
  return { perStudy: perSession, breakTime: breakMinutes };
}

// ----------------------------------------------------------------
// 9. VALIDATE FORM
//    Returns true if all inputs are valid, false otherwise.
//    Also shows/hides error messages for each field.
// ----------------------------------------------------------------
function validateForm() {
  let valid = true;

  // Clear previous errors first
  subjectError.textContent    = '';
  hoursError.textContent      = '';
  difficultyError.textContent = '';
  daysError.textContent       = '';
  subjectInput.classList.remove('input-error');
  hoursInput.classList.remove('input-error');
  daysInput.classList.remove('input-error');

  // --- Subject ---
  const subjectVal = subjectInput.value.trim();
  if (!subjectVal) {
    subjectError.textContent = '⚠️ Please enter a subject name.';
    subjectInput.classList.add('input-error');
    valid = false;
  }

  // --- Hours ---
  const hoursVal = parseFloat(hoursInput.value);
  if (!hoursInput.value || isNaN(hoursVal) || hoursVal < 0.5 || hoursVal > 16) {
    hoursError.textContent = '⚠️ Enter a value between 0.5 and 16 hours.';
    hoursInput.classList.add('input-error');
    valid = false;
  }

  // --- Difficulty ---
  const difficultyVal = document.querySelector('input[name="difficulty"]:checked');
  if (!difficultyVal) {
    difficultyError.textContent = '⚠️ Please select a difficulty level.';
    valid = false;
  }

  // --- Days ---
  const daysVal = parseInt(daysInput.value, 10);
  if (!daysInput.value || isNaN(daysVal) || daysVal < 1 || daysVal > 365) {
    daysError.textContent = '⚠️ Enter between 1 and 365 days.';
    daysInput.classList.add('input-error');
    valid = false;
  }

  return valid;
}

// ----------------------------------------------------------------
// 10. RENDER SESSION CARDS
//     This function creates the HTML for each study session card
//     and injects it into the sessions grid on the page.
// ----------------------------------------------------------------
// Type-label map for the visual session tag
const TYPE_LABELS = {
  study:    'Study',
  revision: 'Revision',
  practice: 'Practice',
  break:    'Break',
};

function renderSessions(sessions) {
  sessionsGrid.innerHTML = ''; // clear any old cards

  sessions.forEach((session, index) => {
    // Create the card element
    const card = document.createElement('div');
    card.className = `session-card type-${session.type}`;
    card.dataset.index = index; // store the card's position for progress tracking

    const typeLabel = TYPE_LABELS[session.type] || session.type;

    card.innerHTML = `
      <div class="session-check">✓</div>
      <span class="session-type-tag">${typeLabel}</span>
      <div class="session-icon">${session.icon}</div>
      <div class="session-title">${session.title}</div>
      <div class="session-duration">⏱ ${session.duration}</div>
      <div class="session-desc">${session.description}</div>
    `;

    // Clicking a card toggles it as "done" and updates the progress bar
    card.addEventListener('click', () => toggleSession(card));

    sessionsGrid.appendChild(card);
  });
}

// ----------------------------------------------------------------
// 11. TOGGLE SESSION COMPLETION
//     When a card is clicked, mark it done (or undo it).
//     Then recalculate and update the progress bar.
// ----------------------------------------------------------------
function toggleSession(card) {
  card.classList.toggle('done');
  updateProgress();
}

// ----------------------------------------------------------------
// 12. UPDATE PROGRESS BAR
//     Count how many session cards have the "done" class and
//     display the percentage in the progress bar.
// ----------------------------------------------------------------
function updateProgress() {
  const allCards   = sessionsGrid.querySelectorAll('.session-card');
  const doneCards  = sessionsGrid.querySelectorAll('.session-card.done');
  const total      = allCards.length;
  const done       = doneCards.length;

  // Avoid dividing by zero if somehow there are no cards
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

  progressBar.style.width    = percent + '%';
  progressLabel.textContent  = percent + '% complete';
  sessionsCompletedEl.textContent = `${done} / ${total} sessions`;

  // Update the polished visual stat display
  if (progressPercent) progressPercent.textContent = percent + '%';
  if (progressCount)   progressCount.textContent   = `${done} / ${total} sessions`;
}

// ----------------------------------------------------------------
// 13. RENDER TIPS
//     Pick 3 random tips for the chosen difficulty and display them.
// ----------------------------------------------------------------
function renderTips(difficulty) {
  const selectedTips = pickRandom(TIPS[difficulty], 3);
  tipsList.innerHTML = '';

  selectedTips.forEach(tip => {
    const li = document.createElement('li');
    li.innerHTML = `<span class="tip-icon">💡</span> ${tip}`;
    tipsList.appendChild(li);
  });

  // Apply difficulty-tinted styling to the tips card
  if (tipsCard) {
    tipsCard.classList.remove('diff-easy', 'diff-medium', 'diff-hard');
    tipsCard.classList.add('diff-' + difficulty.toLowerCase());
  }
}

// ----------------------------------------------------------------
// 14. GENERATE THE STUDY PLAN (the core function)
//     This is called when the form is submitted.
//     It reads the input values, builds session objects, and
//     calls the render helpers to display everything on the page.
// ----------------------------------------------------------------
function generatePlan(subject, hours, difficulty, days) {
  // Pick the right session templates for the difficulty
  const templates = SESSION_TEMPLATES[difficulty];

  // Calculate how many hours to recommend and how to split time
  const recHours    = recommendedHours(hours, difficulty);
  const { perStudy, breakTime } = splitTime(recHours, templates.length);

  // Build the final sessions array by filling in subject and duration
  const sessions = templates.map(tpl => ({
    type:        tpl.type,
    icon:        tpl.icon,
    title:       tpl.title,
    // Replace {subject} placeholder in the description template
    description: tpl.descTpl.replace(/{subject}/g, subject),
    // Format duration: break gets fixed time; others get equal share
    duration:    tpl.type === 'break'
                   ? `${breakTime} min`
                   : `${perStudy} min`,
  }));

  // ---- Update the plan header text ----
  const totalDailyMinutes = Math.round(recHours * 60);
  planTitle.textContent    = `📚 ${subject} — ${days}-Day Study Plan`;
  planSubtitle.textContent = `Difficulty: ${difficulty} · ~${totalDailyMinutes} min/day recommended · ${days} day${days !== 1 ? 's' : ''} to go`;

  // ---- Render sessions and tips ----
  renderSessions(sessions);
  renderTips(difficulty);

  // ---- Reset progress bar to 0 ----
  updateProgress();

  // ---- Show the output section and scroll to it ----
  outputSection.classList.remove('hidden');
  outputSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ----------------------------------------------------------------
// 15. FORM SUBMIT EVENT LISTENER
//     This runs when the user clicks "Generate Study Plan".
//     We prevent the default browser form submission (which would
//     reload the page), validate the inputs, then generate the plan.
// ----------------------------------------------------------------
planForm.addEventListener('submit', function (event) {
  event.preventDefault(); // stop the page from reloading

  // Validate first — if invalid, stop here
  if (!validateForm()) return;

  // Read the validated values
  const subject    = subjectInput.value.trim();
  const hours      = parseFloat(hoursInput.value);
  const difficulty = document.querySelector('input[name="difficulty"]:checked').value;
  const days       = parseInt(daysInput.value, 10);

  // Brief loading state for visual feedback (clears automatically)
  if (generateBtn) {
    generateBtn.disabled = true;
    generateBtn.classList.add('loading');
  }

  // Small delay so the loading spinner is visible, then generate
  setTimeout(function () {
    generatePlan(subject, hours, difficulty, days);
    if (generateBtn) {
      generateBtn.disabled = false;
      generateBtn.classList.remove('loading');
    }
  }, 420);
});

// ----------------------------------------------------------------
// 16. RESET BUTTON
//     Hides the output, clears the form, and scrolls back up.
// ----------------------------------------------------------------
resetBtn.addEventListener('click', function () {
  // Hide the output section
  outputSection.classList.add('hidden');

  // Clear all form fields
  planForm.reset();

  // Clear any leftover error messages
  subjectError.textContent    = '';
  hoursError.textContent      = '';
  difficultyError.textContent = '';
  daysError.textContent       = '';
  subjectInput.classList.remove('input-error');
  hoursInput.classList.remove('input-error');
  daysInput.classList.remove('input-error');

  // Scroll back to the top of the page
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ----------------------------------------------------------------
// 17. CLEAR ERRORS ON INPUT (better UX)
//     As soon as the user starts typing in a field, remove the
//     error highlight so they get immediate positive feedback.
// ----------------------------------------------------------------
subjectInput.addEventListener('input', () => {
  subjectError.textContent = '';
  subjectInput.classList.remove('input-error');
});

hoursInput.addEventListener('input', () => {
  hoursError.textContent = '';
  hoursInput.classList.remove('input-error');
});

daysInput.addEventListener('input', () => {
  daysError.textContent = '';
  daysInput.classList.remove('input-error');
});

document.querySelectorAll('input[name="difficulty"]').forEach(radio => {
  radio.addEventListener('change', () => {
    difficultyError.textContent = '';
  });
});
