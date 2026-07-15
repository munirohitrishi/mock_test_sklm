/* APPSC Group-2 Geography Mock Test — exam engine */
(function () {
  "use strict";

  const cfg = window.EXAM_CONFIG;
  const OPTION_LABELS = { A: "అ", B: "బ", C: "స", D: "ద" };

  let questions = [];
  let totalCount = 0;
  let current = 0;
  // status per index: 0 not-visited, 1 visited, 2 answered, 3 marked
  let status = [];
  let answers = {};            // { qid: "A" }
  let endTime = null;
  let timerInterval = null;
  let submitted = false;
  let warned15 = false, warned5 = false;

  const $ = (id) => document.getElementById(id);

  // ---------------- Load ----------------
  async function load() {
    try {
      const res = await fetch(cfg.apiQuestions, { credentials: "same-origin" });
      if (!res.ok) { window.location.href = "/register"; return; }
      const data = await res.json();
      questions = data.questions;
      totalCount = data.total_questions || questions.length;
      status = new Array(questions.length).fill(0);
      $("qTotal").textContent = questions.length;

      buildGrid();
      startTimer(data.duration_minutes || cfg.durationMinutes);
      requestFullscreen();
      render(0);
    } catch (e) {
      alert("ప్రశ్నలను లోడ్ చేయడంలో సమస్య. దయచేసి పేజీని రిఫ్రెష్ చేయండి.");
    }
  }

  // ---------------- Timer ----------------
  function startTimer(minutes) {
    endTime = Date.now() + minutes * 60 * 1000;
    tick();
    timerInterval = setInterval(tick, 1000);
  }

  function tick() {
    const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
    const h = String(Math.floor(remaining / 3600)).padStart(2, "0");
    const m = String(Math.floor((remaining % 3600) / 60)).padStart(2, "0");
    const s = String(remaining % 60).padStart(2, "0");
    const t = $("timer");
    t.textContent = `${h}:${m}:${s}`;

    if (remaining <= 300) { t.className = "timer danger"; }
    else if (remaining <= 900) { t.className = "timer warn"; }

    if (!warned15 && remaining <= 900 && remaining > 300) {
      warned15 = true;
      showOverlay("సమయ హెచ్చరిక", "పరీక్ష ముగియడానికి కేవలం 15 నిమిషాలు మిగిలి ఉన్నాయి.", false);
    }
    if (!warned5 && remaining <= 300) {
      warned5 = true;
      showOverlay("సమయ హెచ్చరిక", "పరీక్ష ముగియడానికి కేవలం 5 నిమిషాలు మిగిలి ఉన్నాయి!", false);
    }
    if (remaining <= 0) {
      clearInterval(timerInterval);
      submit(true);
    }
  }

  // ---------------- Navigator grid ----------------
  function buildGrid() {
    const grid = $("grid");
    grid.innerHTML = "";
    for (let i = 0; i < questions.length; i++) {
      const b = document.createElement("button");
      b.textContent = i + 1;
      b.dataset.i = i;
      b.addEventListener("click", () => { saveCurrent(); render(i); });
      grid.appendChild(b);
    }
  }

  function refreshGrid() {
    const btns = $("grid").children;
    for (let i = 0; i < btns.length; i++) {
      const b = btns[i];
      b.className = "";
      if (status[i] === 1) b.classList.add("vs");
      else if (status[i] === 2) b.classList.add("an");
      else if (status[i] === 3) b.classList.add("mr");
      if (i === current) b.classList.add("current");
    }
  }

  // ---------------- Render a question ----------------
  function render(i) {
    current = i;
    const q = questions[i];
    if (status[i] === 0) status[i] = 1; // mark visited

    $("qNum").textContent = i + 1;
    $("qTopic").textContent = q.topic || "";
    $("qText").textContent = q.question;

    const box = $("options");
    box.innerHTML = "";
    ["A", "B", "C", "D"].forEach((key) => {
      if (!(key in q.options)) return;
      const wrap = document.createElement("label");
      wrap.className = "option" + (answers[q.id] === key ? " selected" : "");
      const input = document.createElement("input");
      input.type = "radio";
      input.name = "opt";
      input.value = key;
      input.checked = answers[q.id] === key;
      input.addEventListener("change", () => {
        answers[q.id] = key;
        wrap.parentElement.querySelectorAll(".option").forEach(o => o.classList.remove("selected"));
        wrap.classList.add("selected");
      });
      const lbl = document.createElement("span");
      lbl.className = "lbl";
      lbl.textContent = OPTION_LABELS[key] + ")";
      const txt = document.createElement("span");
      txt.textContent = q.options[key];
      wrap.appendChild(input);
      wrap.appendChild(lbl);
      wrap.appendChild(txt);
      box.appendChild(wrap);
    });

    $("prevBtn").disabled = (i === 0);
    refreshGrid();
  }

  // record status when leaving a question
  function saveCurrent() {
    const q = questions[current];
    if (status[current] === 3) return; // keep marked-for-review as is
    status[current] = (answers[q.id] !== undefined && answers[q.id] !== "") ? 2 : 1;
  }

  // ---------------- Buttons ----------------
  function bind() {
    $("saveNextBtn").addEventListener("click", () => {
      saveCurrent();
      if (current < questions.length - 1) render(current + 1);
      else refreshGrid();
    });
    $("prevBtn").addEventListener("click", () => {
      saveCurrent();
      if (current > 0) render(current - 1);
    });
    $("clearBtn").addEventListener("click", () => {
      const q = questions[current];
      delete answers[q.id];
      status[current] = 1;
      render(current);
    });
    $("markBtn").addEventListener("click", () => {
      status[current] = 3;
      if (current < questions.length - 1) render(current + 1);
      else refreshGrid();
    });
    $("submitBtn").addEventListener("click", () => {
      saveCurrent();
      const answered = Object.keys(answers).length;
      const left = questions.length - answered;
      if (confirm(`మీరు ${answered} ప్రశ్నలకు సమాధానం ఇచ్చారు. ${left} ప్రశ్నలు మిగిలి ఉన్నాయి.\nపరీక్షను సబ్మిట్ చేయాలా? సబ్మిట్ చేసిన తర్వాత మార్చడం సాధ్యం కాదు.`)) {
        submit(false);
      }
    });
    $("ovBtn").addEventListener("click", hideOverlay);
  }

  // ---------------- Submit ----------------
  async function submit(auto) {
    if (submitted) return;
    submitted = true;
    if (timerInterval) clearInterval(timerInterval);
    try {
      const res = await fetch(cfg.apiSubmit, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: answers, auto: !!auto })
      });
      const data = await res.json();
      window.onbeforeunload = null;
      if (data.redirect) window.location.href = data.redirect;
      else window.location.href = "/result";
    } catch (e) {
      alert("సబ్మిట్ చేయడంలో సమస్య. మళ్ళీ ప్రయత్నించండి.");
      submitted = false;
    }
  }

  // ---------------- Fullscreen + overlay ----------------
  function requestFullscreen() {
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
  }

  function isFullscreen() {
    return document.fullscreenElement || document.webkitFullscreenElement;
  }

  document.addEventListener("fullscreenchange", onFsChange);
  document.addEventListener("webkitfullscreenchange", onFsChange);
  function onFsChange() {
    if (!submitted && !isFullscreen()) {
      showOverlay(
        "ఫుల్‌స్క్రీన్ నుండి బయటకు వచ్చారు",
        "పరీక్ష ఫుల్‌స్క్రీన్ మోడ్‌లో కొనసాగాలి. టైమర్ ఆగింది. కొనసాగించడానికి కింది బటన్ నొక్కండి.",
        true
      );
    }
  }

  let overlayResumeFs = false;
  function showOverlay(title, msg, resumeFs) {
    overlayResumeFs = resumeFs;
    $("ovTitle").textContent = title;
    $("ovMsg").textContent = msg;
    $("overlay").classList.add("show");
    if (resumeFs) pauseTimer();
  }
  function hideOverlay() {
    $("overlay").classList.remove("show");
    if (overlayResumeFs) {
      requestFullscreen();
      resumeTimer();
      overlayResumeFs = false;
    }
  }

  // Pause/resume by shifting endTime
  let pausedAt = null;
  function pauseTimer() {
    if (pausedAt === null) { pausedAt = Date.now(); if (timerInterval) clearInterval(timerInterval); }
  }
  function resumeTimer() {
    if (pausedAt !== null) {
      endTime += (Date.now() - pausedAt);
      pausedAt = null;
      tick();
      timerInterval = setInterval(tick, 1000);
    }
  }

  // Warn on navigating away
  window.onbeforeunload = function () {
    if (!submitted) return "పరీక్ష ఇంకా సబ్మిట్ కాలేదు. మీరు నిజంగా వెళ్ళాలనుకుంటున్నారా?";
  };

  // ---------------- init ----------------
  bind();
  load();
})();
