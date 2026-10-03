(function () {
  'use strict';
  var data = window.CCAF_MOCKS;
  var app = document.getElementById('app');
  var timerElement = document.getElementById('header-timer');
  var headerContext = document.getElementById('header-context');
  var dialog = document.getElementById('confirm-dialog');
  var storeKey = 'ccaf-mocks-attempts-v1';
  var durationMs = 120 * 60 * 1000;
  var attempts = {};
  var navOpen = false;
  var reviewFilter = 'all';
  try { attempts = JSON.parse(localStorage.getItem(storeKey) || '{}') || {}; } catch (_) { attempts = {}; }

  function escapeHtml(value) { return String(value).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function paperById(id) { return data.papers.find(function (paper) { return paper.id === id; }); }
  function questions(paper) { return paper.scenarios.flatMap(function (scenario, scenarioIndex) { return scenario.questions.map(function (question, localIndex) { return Object.assign({ scenario: scenario, scenarioIndex: scenarioIndex, localIndex: localIndex }, question); }); }); }
  function domainName(id) { return data.domains.find(function (domain) { return domain.id === id; }).name; }
  function store() { try { localStorage.setItem(storeKey, JSON.stringify(attempts)); } catch (_) {} }
  function equalChoices(a, b) { return a.length === b.length && a.slice().sort().join(',') === b.slice().sort().join(','); }
  function isAnswered(attempt, q, index) { var selected = attempt.answers[index] || []; return attempt.mode === 'immediate' ? !!attempt.checked[index] : selected.length === q.correct.length; }
  function timeLeft(attempt) { return Math.max(0, durationMs - (Date.now() - attempt.startedAt)); }
  function formatTime(ms) { var sec = Math.ceil(ms / 1000); var h = Math.floor(sec / 3600); var m = Math.floor((sec % 3600) / 60); var s = sec % 60; return [h, m, s].map(function (n) { return String(n).padStart(2, '0'); }).join(':'); }
  function currentRoute() { var parts = location.hash.replace(/^#\/?/, '').split('/'); return { page: parts[0] || 'home', id: parts[1] }; }
  function title(text) { document.title = text + ' · Claude Architect Mock Exams'; }

  function validatePapers() {
    if (data.papers.length !== 4) throw new Error('Expected four papers');
    data.papers.forEach(function (paper) {
      if (paper.scenarios.length !== 4 || paper.scenarios.some(function (scenario) { return scenario.questions.length !== 15; })) throw new Error(paper.id + ' must have four 15-question scenarios');
      var items = questions(paper);
      if (items.length !== 60) throw new Error(paper.id + ' must have 60 questions');
      data.domains.forEach(function (domain) {
        if (items.filter(function (item) { return item.domain === domain.id; }).length !== domain.target) throw new Error(paper.id + ' domain ' + domain.id + ' weight mismatch');
      });
      items.forEach(function (item, index) {
        if (item.rationale.length < 35 || item.stem.length < 35 || new Set(item.correct).size !== item.correct.length) throw new Error(paper.id + ' weak/invalid item ' + (index + 1));
      });
    });
  }

  function home() {
    timerElement.hidden = true;
    headerContext.textContent = 'Four full-length papers';
    title('Four practice exams');
    var cards = data.papers.map(function (paper) {
      var attempt = attempts[paper.id];
      var status = !attempt ? 'Not started' : attempt.finishedAt ? 'Completed · ' + score(paper, attempt).correct + '/60' : 'In progress · ' + formatTime(timeLeft(attempt)) + ' left';
      return '<article class="paper-card"><div class="paper-top"><span class="paper-number">' + String(paper.number).padStart(2, '0') + '</span><span class="paper-status">' + status + '</span></div><h2>' + escapeHtml(paper.title) + '</h2><p>' + escapeHtml(paper.summary) + '</p><div class="paper-scenarios">' + paper.scenarios.map(function (scenario) { return escapeHtml(scenario.title); }).join(' · ') + '</div><a class="button primary" href="#setup/' + paper.id + '">' + (attempt && !attempt.finishedAt ? 'Resume or restart' : attempt && attempt.finishedAt ? 'Review or retake' : 'Choose mode') + ' <span aria-hidden="true">→</span></a></article>';
    }).join('');
    app.innerHTML = '<div class="home"><div class="eyebrow">CCAR-F · independent practice</div><h1>Four full-length mock exams</h1><p class="home-intro">Practice the decisions behind Claude-based systems under exam-style constraints: four scenario blocks, 60 items, and 120 minutes per paper. Choose immediate feedback while learning or hold all answers until the end.</p><div class="exam-facts"><span><strong>60</strong> questions per paper</span><span><strong>120</strong> minutes</span><span><strong>4</strong> scenarios per paper</span><span>Single and multiple response</span></div><div class="papers">' + cards + '</div><div class="home-note">These are original practice questions based on Anthropic’s <a href="' + escapeHtml(data.guideUrl) + '" target="_blank" rel="noopener noreferrer">CCAR-F Exam Guide (version 1.0, July 2026)</a>. They are not official exam items and the raw practice percentage is not Anthropic’s scaled score. Your attempts stay in this browser.</div></div>';
  }

  function setup(paper) {
    timerElement.hidden = true;
    headerContext.textContent = paper.title;
    title(paper.title);
    var attempt = attempts[paper.id];
    var status = attempt ? attempt.finishedAt ? '<p class="setup-summary">A completed attempt is saved. Review its answers or start a new attempt; starting again replaces the saved attempt for this paper.</p>' : '<p class="setup-summary">Your ' + (attempt.mode === 'immediate' ? 'immediate-feedback' : 'end-of-test') + ' attempt is in progress. The timer continues while this page is closed: <strong>' + formatTime(timeLeft(attempt)) + '</strong> remains.</p>' : '';
    app.innerHTML = '<div class="setup"><a class="back-link" href="#home">← All papers</a><div class="eyebrow">Paper ' + paper.number + ' · 60 original questions</div><h1>' + escapeHtml(paper.title) + '</h1><p>' + escapeHtml(paper.summary) + '</p>' + status + '<div class="mode-grid"><label class="mode-card selected"><input type="radio" name="mode" value="immediate" checked><strong>Immediate feedback</strong><span>After you choose the required number of options, press Check answer. The answer and reasoning appear immediately, and that item is locked.</span></label><label class="mode-card"><input type="radio" name="mode" value="end"><strong>End-of-test feedback</strong><span>Move through the paper, revise answers, and flag items. Correct answers and explanations remain hidden until you submit or time expires.</span></label></div><div class="setup-summary">The exam timer is continuous. Multiple-response items state exactly how many options to select. Scoring in this practice site is exact-match per item; Anthropic uses a separate scaled score.</div><div class="setup-actions"><button class="button primary" data-action="start" data-paper="' + paper.id + '">Start new attempt</button>' + (attempt ? '<a class="button secondary" href="#' + (attempt.finishedAt ? 'results' : 'exam') + '/' + paper.id + '">' + (attempt.finishedAt ? 'Review saved result' : 'Resume current attempt') + '</a>' : '') + '</div></div>';
  }

  function score(paper, attempt) {
    var items = questions(paper);
    var correct = 0;
    var byDomain = {};
    data.domains.forEach(function (domain) { byDomain[domain.id] = { right: 0, total: 0 }; });
    items.forEach(function (item, index) {
      byDomain[item.domain].total++;
      if (equalChoices(attempt.answers[index] || [], item.correct)) { correct++; byDomain[item.domain].right++; }
    });
    return { correct: correct, total: items.length, percent: Math.round(100 * correct / items.length), byDomain: byDomain };
  }
  function updateTimer(attempt) {
    if (!attempt || attempt.finishedAt) { timerElement.hidden = true; return; }
    var left = timeLeft(attempt);
    timerElement.hidden = false;
    timerElement.textContent = formatTime(left);
    timerElement.classList.toggle('urgent', left <= 10 * 60 * 1000);
    if (left <= 0) finishAttempt(attempt.paperId, 'time');
  }
  function navMarkup(paper, attempt, items) {
    var done = items.filter(function (item, index) { return isAnswered(attempt, item, index); }).length;
    var groups = paper.scenarios.map(function (scenario, groupIndex) {
      var buttons = scenario.questions.map(function (_, localIndex) {
        var index = groupIndex * 15 + localIndex;
        var selected = attempt.answers[index] || [];
        var status = isAnswered(attempt, items[index], index) ? ' answered' : '';
        if (attempt.mode === 'immediate' && attempt.checked[index]) status += equalChoices(selected, items[index].correct) ? ' correct' : ' incorrect';
        if (attempt.flags[index]) status += ' flagged';
        if (index === attempt.currentIndex) status += ' current';
        return '<button type="button" data-jump="' + index + '" class="' + status.trim() + '" aria-label="Question ' + (index + 1) + (attempt.flags[index] ? ', flagged' : '') + '"' + (index === attempt.currentIndex ? ' aria-current="step"' : '') + '>' + (index + 1) + '</button>';
      }).join('');
      return '<div class="nav-scenario"><div class="nav-scenario-title">Scenario ' + (groupIndex + 1) + ' · ' + escapeHtml(scenario.title) + '</div><div class="number-grid">' + buttons + '</div></div>';
    }).join('');
    return '<div class="nav-head"><strong>Question navigator</strong><button type="button" class="nav-close" data-action="close-nav" aria-label="Close question navigator">×</button></div><p class="nav-sub">' + done + ' of 60 answered · ' + Object.keys(attempt.flags).filter(function (key) { return attempt.flags[key]; }).length + ' flagged</p>' + groups + '<div class="nav-legend">Green = answered · bottom line = flagged</div>';
  }
  function feedbackMarkup(question, selected) {
    var right = equalChoices(selected, question.correct);
    return '<div class="feedback' + (right ? '' : ' bad') + '" role="status"><strong>' + (right ? 'Correct.' : 'Not quite. Correct: ' + question.correct.map(function (index) { return String.fromCharCode(65 + index); }).join(', ') + '.') + '</strong><p>' + escapeHtml(question.rationale) + '</p></div>';
  }
  function renderExam(paper) {
    var attempt = attempts[paper.id];
    if (!attempt) { location.hash = '#setup/' + paper.id; return; }
    if (attempt.finishedAt || timeLeft(attempt) <= 0) { if (!attempt.finishedAt) finishAttempt(paper.id, 'time'); else location.hash = '#results/' + paper.id; return; }
    title(paper.title + ' · Question ' + (attempt.currentIndex + 1));
    headerContext.textContent = paper.title;
    updateTimer(attempt);
    var items = questions(paper);
    var index = attempt.currentIndex;
    var item = items[index];
    var selected = attempt.answers[index] || [];
    var checked = attempt.mode === 'immediate' && !!attempt.checked[index];
    var responseCount = item.correct.length;
    var options = item.options.map(function (option, optionIndex) {
      var className = 'answer-option' + (selected.includes(optionIndex) ? ' selected' : '');
      if (checked && item.correct.includes(optionIndex)) className += ' correct';
      else if (checked && selected.includes(optionIndex)) className += ' incorrect';
      return '<button type="button" class="' + className + '" data-choice="' + optionIndex + '" aria-pressed="' + selected.includes(optionIndex) + '"' + (checked ? ' disabled' : '') + '><span class="answer-letter">' + String.fromCharCode(65 + optionIndex) + '</span><span>' + escapeHtml(option) + '</span></button>';
    }).join('');
    var scenario = paper.scenarios[item.scenarioIndex];
    var scenarioText = '<div class="eyebrow">Scenario ' + (item.scenarioIndex + 1) + ' of 4</div><h2>' + escapeHtml(scenario.title) + '</h2><p>' + escapeHtml(scenario.context) + '</p>';
    var primary = attempt.mode === 'immediate' ? checked ? '<button type="button" class="button primary" data-action="next">' + (index === 59 ? 'Review paper' : 'Next question') + ' →</button>' : '<button type="button" class="button primary" data-action="check"' + (selected.length !== responseCount ? ' disabled' : '') + '>Check answer</button><button type="button" class="button secondary" data-action="next">Skip →</button>' : '<button type="button" class="button primary" data-action="next">' + (index === 59 ? 'Review paper' : 'Save & next') + ' →</button>';
    var feedback = checked ? feedbackMarkup(item, selected) : '';
    app.innerHTML = '<div class="exam-scrim' + (navOpen ? ' open' : '') + '" data-action="close-nav"></div><div class="exam-layout"><aside class="question-nav' + (navOpen ? ' open' : '') + '" id="question-nav" aria-label="Question navigation">' + navMarkup(paper, attempt, items) + '</aside><section class="question-surface"><button type="button" class="nav-open-button" data-action="open-nav" aria-controls="question-nav" aria-expanded="' + navOpen + '">☰ Questions</button><div class="question-meta"><span>Question ' + (index + 1) + ' of 60 · ' + (item.localIndex + 1) + ' of 15 in this scenario</span><span class="domain">' + escapeHtml(domainName(item.domain)) + '</span></div><div class="scenario-inline">' + scenarioText + '</div><h1>' + escapeHtml(item.stem) + '</h1><p class="select-instruction">Select ' + (responseCount === 1 ? 'ONE answer' : responseCount === 2 ? 'TWO answers' : 'THREE answers') + (attempt.mode === 'end' ? ' · feedback at end of test' : '') + '</p><div class="answer-list" role="group" aria-label="Answer choices">' + options + '</div>' + feedback + '<div class="question-actions"><div class="left"><button type="button" class="button secondary" data-action="flag">' + (attempt.flags[index] ? '⚑ Remove flag' : '⚑ Flag for review') + '</button><button type="button" class="button text" data-action="previous"' + (index === 0 ? ' disabled' : '') + '>← Previous</button></div><div class="right">' + primary + '<button type="button" class="button text" data-action="confirm-submit">Submit exam</button></div></div></section><aside class="scenario-aside">' + scenarioText + '</aside></div>';
  }

  function finishAttempt(id, reason) {
    var attempt = attempts[id];
    if (!attempt || attempt.finishedAt) return;
    attempt.finishedAt = Date.now();
    attempt.finishReason = reason;
    navOpen = false;
    store();
    location.hash = '#results/' + id;
    if (location.hash === '#results/' + id) route();
  }
  function renderResults(paper) {
    var attempt = attempts[paper.id];
    if (!attempt) { location.hash = '#setup/' + paper.id; return; }
    if (!attempt.finishedAt) { location.hash = '#exam/' + paper.id; return; }
    timerElement.hidden = true;
    headerContext.textContent = paper.title;
    title(paper.title + ' · Results');
    var result = score(paper, attempt);
    var bars = data.domains.map(function (domain) {
      var value = result.byDomain[domain.id];
      return '<div class="domain-score"><span>' + escapeHtml(domain.name) + '</span><div class="score-track"><div class="score-fill" style="width:' + Math.round(value.right / value.total * 100) + '%"></div></div><strong>' + value.right + '/' + value.total + '</strong></div>';
    }).join('');
    var items = questions(paper);
    var reviews = items.map(function (item, index) {
      var selected = attempt.answers[index] || [];
      var right = equalChoices(selected, item.correct);
      if (reviewFilter === 'missed' && right || reviewFilter === 'flagged' && !attempt.flags[index]) return '';
      var selections = selected.length ? selected.map(function (choice) { return String.fromCharCode(65 + choice) + '. ' + escapeHtml(item.options[choice]); }).join('; ') : 'No answer';
      var correct = item.correct.map(function (choice) { return String.fromCharCode(65 + choice) + '. ' + escapeHtml(item.options[choice]); }).join('; ');
      return '<article class="review-item" id="review-' + (index + 1) + '"><div class="review-label">Question ' + (index + 1) + ' · Scenario ' + (item.scenarioIndex + 1) + ' · Objective ' + item.objective + ' · ' + (right ? 'Correct' : 'Incorrect') + (attempt.flags[index] ? ' · Flagged' : '') + '</div><h3>' + escapeHtml(item.stem) + '</h3><div class="review-choice">Your answer: ' + selections + '</div><div class="review-choice"><strong>Correct answer: ' + correct + '</strong></div><div class="review-rationale">' + escapeHtml(item.rationale) + '</div></article>';
    }).join('');
    var answered = items.filter(function (item, index) { return (attempt.answers[index] || []).length === item.correct.length; }).length;
    var elapsed = Math.min(durationMs, attempt.finishedAt - attempt.startedAt);
    app.innerHTML = '<div class="results"><a class="back-link" href="#home">← All papers</a><div class="eyebrow">Paper ' + paper.number + ' · results</div><h1>Practice exam review</h1><p>' + (attempt.finishReason === 'time' ? 'The 120-minute timer expired and the paper was submitted automatically.' : 'You submitted the paper.') + ' Raw practice results are not a conversion to Anthropic’s scaled passing score.</p><div class="result-hero"><div class="result-score">' + result.correct + '/60<small>' + result.percent + '% correct</small></div><div class="result-meta">' + answered + ' answered · ' + (60 - answered) + ' unanswered<br>' + (attempt.mode === 'immediate' ? 'Immediate feedback' : 'End-of-test feedback') + ' · ' + formatTime(elapsed) + ' elapsed</div></div><div class="domain-scores">' + bars + '</div><div class="result-actions"><a class="button secondary" href="#home">All papers</a><button type="button" class="button secondary" data-action="retake" data-paper="' + paper.id + '">Retake this paper</button></div><div class="review-toolbar"><h2>Answer review</h2><div><button type="button" class="button ' + (reviewFilter === 'all' ? 'primary' : 'secondary') + '" data-filter="all">All</button> <button type="button" class="button ' + (reviewFilter === 'missed' ? 'primary' : 'secondary') + '" data-filter="missed">Missed</button> <button type="button" class="button ' + (reviewFilter === 'flagged' ? 'primary' : 'secondary') + '" data-filter="flagged">Flagged</button></div></div>' + (reviews || '<p class="muted">No items in this view.</p>') + '</div>';
  }

  function route() {
    var current = currentRoute();
    var paper = paperById(current.id);
    if (current.page === 'setup' && paper) setup(paper);
    else if (current.page === 'exam' && paper) renderExam(paper);
    else if (current.page === 'results' && paper) renderResults(paper);
    else home();
    window.scrollTo(0, 0);
    app.focus({ preventScroll: true });
  }
  function goToQuestion(index) {
    var paper = paperById(currentRoute().id);
    var attempt = attempts[paper.id];
    attempt.currentIndex = Math.max(0, Math.min(59, index));
    navOpen = false;
    store();
    renderExam(paper);
    window.scrollTo(0, 0);
    app.focus({ preventScroll: true });
  }
  function showSubmitDialog(paper) {
    var attempt = attempts[paper.id];
    var items = questions(paper);
    var answered = items.filter(function (item, index) { return isAnswered(attempt, item, index); }).length;
    document.getElementById('dialog-message').textContent = (60 - answered) + ' questions are not ' + (attempt.mode === 'immediate' ? 'checked' : 'answered') + '. Submitting ends this attempt and reveals the full answer review.';
    dialog.showModal();
    dialog.addEventListener('close', function onClose() { dialog.removeEventListener('close', onClose); if (dialog.returnValue === 'confirm') finishAttempt(paper.id, 'submitted'); }, { once: true });
  }
  function startAttempt(paper, mode) {
    attempts[paper.id] = { paperId: paper.id, mode: mode, startedAt: Date.now(), finishedAt: null, finishReason: null, currentIndex: 0, answers: {}, checked: {}, flags: {} };
    store();
    location.hash = '#exam/' + paper.id;
    route();
  }

  app.addEventListener('click', function (event) {
    var action = event.target.closest('[data-action]');
    var jump = event.target.closest('[data-jump]');
    var filter = event.target.closest('[data-filter]');
    var choice = event.target.closest('[data-choice]');
    var current = currentRoute();
    var paper = paperById(current.id);
    if (filter && paper) { reviewFilter = filter.dataset.filter; renderResults(paper); return; }
    if (jump && paper) { goToQuestion(Number(jump.dataset.jump)); return; }
    if (choice && paper && current.page === 'exam') {
      var attempt = attempts[paper.id]; var index = attempt.currentIndex; var item = questions(paper)[index];
      if (attempt.mode === 'immediate' && attempt.checked[index]) return;
      var option = Number(choice.dataset.choice); var selected = (attempt.answers[index] || []).slice();
      if (selected.includes(option)) selected = selected.filter(function (value) { return value !== option; });
      else if (selected.length < item.correct.length) selected.push(option);
      attempt.answers[index] = selected; store();
      app.querySelectorAll('.answer-option').forEach(function (button) { var active = selected.includes(Number(button.dataset.choice)); button.classList.toggle('selected', active); button.setAttribute('aria-pressed', String(active)); });
      var check = app.querySelector('[data-action="check"]'); if (check) check.disabled = selected.length !== item.correct.length;
      app.querySelector('.question-nav').innerHTML = navMarkup(paper, attempt, questions(paper));
      return;
    }
    if (!action) return;
    var kind = action.dataset.action;
    if (kind === 'start') { var selectedMode = app.querySelector('input[name="mode"]:checked').value; startAttempt(paperById(action.dataset.paper), selectedMode); return; }
    if (kind === 'retake') { location.hash = '#setup/' + action.dataset.paper; return; }
    if (kind === 'open-nav') { navOpen = true; app.querySelector('.question-nav').classList.add('open'); app.querySelector('.exam-scrim').classList.add('open'); action.setAttribute('aria-expanded', 'true'); return; }
    if (kind === 'close-nav') { navOpen = false; app.querySelector('.question-nav')?.classList.remove('open'); app.querySelector('.exam-scrim')?.classList.remove('open'); app.querySelector('.nav-open-button')?.setAttribute('aria-expanded', 'false'); return; }
    if (!paper || current.page !== 'exam') return;
    var attempt = attempts[paper.id]; var index = attempt.currentIndex; var item = questions(paper)[index];
    if (kind === 'previous') { goToQuestion(index - 1); return; }
    if (kind === 'next') { if (index === 59) showSubmitDialog(paper); else goToQuestion(index + 1); return; }
    if (kind === 'flag') { attempt.flags[index] = !attempt.flags[index]; store(); renderExam(paper); return; }
    if (kind === 'check') { if ((attempt.answers[index] || []).length !== item.correct.length) return; attempt.checked[index] = true; store(); var y = window.scrollY; renderExam(paper); window.scrollTo(0, y); app.querySelector('.feedback')?.focus(); return; }
    if (kind === 'confirm-submit') { showSubmitDialog(paper); return; }
  });
  app.addEventListener('change', function (event) {
    if (event.target.name === 'mode') app.querySelectorAll('.mode-card').forEach(function (card) { card.classList.toggle('selected', card.querySelector('input').checked); });
  });
  document.addEventListener('keydown', function (event) { if (event.key === 'Escape' && navOpen) { navOpen = false; app.querySelector('.question-nav')?.classList.remove('open'); app.querySelector('.exam-scrim')?.classList.remove('open'); } });
  window.addEventListener('hashchange', route);
  setInterval(function () { var current = currentRoute(); if (current.page === 'exam') updateTimer(attempts[current.id]); }, 1000);
  validatePapers();
  route();
})();
