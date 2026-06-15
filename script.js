/* ════════════════════════════════════════════════
   ShorthandPro — Examination Portal
   script.js  (bug-fixed)
   ════════════════════════════════════════════════ */

"use strict";

/* ──────────────────────────────────────────────
   1. AUDIO DATA
   Each entry: file path + full transcript text.
   Words between START…STOP markers are assessed.
   If no markers present, nothing is assessed.
   ────────────────────────────────────────────── */
const audioData = {
  "audio-1": {
    file: "assets/audios/audio-1.mp3",
    transcript: `Ladies and Gentlemen I am pleased to inaugurate this Special Conference of the Intelligence Bureau. In my opinion this is a very timely event. I congratulate the Director and his team for this great initiative. On this occasion I would like to express my appreciation for the excellent effort made by you in keeping the country safe at all times. It is well known that you work hard despite difficult times. It has to be remembered that unlike other bodies your achievements cannot be made public.

In other words you are the invisible heroes as far as the country is concerned.

On this occasion it would be appropriate to recall that you have a long history. As you are aware the Intelligence Bureau was established during British rule as a premier institution. I would like to state that you are playing an important role in gathering intelligence on issues of homeland security. As a matter of fact your role in giving advance and secret information to the Home Ministry is crucial as far as the countrys safety is concerned.

Ladies and Gentlemen I would also like to place on record the fact that after Independence your workload has greatly increased keeping in view the threats faced by a new nation. It is a matter of pride that you have been able to play an important part in providing security to the people and guarding the unity of the country as a whole. It is a matter of great satisfaction that during the last decade you have fought many threats against the country and you have proved the capacity to save the country from our enemies. It is only appropriate for me to mention here that the Government has given you absolute freedom to achieve our goals as quickly as possible.

I take this opportunity to praise the Honble Home Minister and his team in this regard.

On this occasion I would like to state that peace and security are absolutely necessary if the country is to attain prosperity. In other words your work has enabled us to march ahead with greater energy and speed on the path of development. As a result India has emerged as one of the fastest growing countries and would be able to become the third largest economy in the years to come.

Ladies and gentlemen the theme for this Conference is Community Participation in the nations defence. In my opinion this is in line with the vision of the Government to make India a fully developed nation before the Centenary of its Independence. In this regard the role played by you has immediate as well as long-term importance for the country as a whole. As a matter of necessity you have to impress on the people that our safety is the responsibility of each and every citizen. In this connection I would like to bring to your attention the fact that citizens can provide timely intelligence in
such matters. I am confident that this would be of great support to the efforts of the Government in the long run.

In this regard I would like to remind that our Constitution expects some Fundamental Duties on the part of citizens. I would like to point out that many of these duties gain significance in the light of the situation around the country. I am therefore of the opinion that students teachers and people from all walks of life have a duty to contribute to the safety of the country. As a matter of fact the Constitution has given a directive to the citizens to protect the unity and integrity of the nation. It is therefore the duty of the people to defend the country and render national service when necessary. In this connection it is my personal view that it is desirable to make military training compulsory for youth from all parts of the country. I have no doubt that this would help us to a great extent in instilling patriotism in them.

Ladies and Gentlemen it has to be borne in mind that peoples contribution improves our national development. As a matter of fact there should be better effort on the part of common people to help our Defence Forces in gathering intelligence. I would like to draw attention to the fact that people need not be passive observers of events around them. They should be vigilant and take an active part in assisting the Government. At the same time I am aware of the fact that some people may keep a distance with respect to Police forces in general. This has been the case even before Independence. It is necessary that our security forces should work hand in hand with the people. This would go a long way in building trust among them.

My dear friends I would like to draw attention to the fact that India has been facing threats from many angles. I think you will note the fact that economic crimes have become a new threat in recent years.

It must be remembered that issues in any part of the country have an impact in other parts of the country as well. It is not necessary for me to remind that maintenance of law and order in the country ensures growth and economic development.
On this occasion I congratulate our Forces on their success in fighting extremism in certain parts of the country. It is a matter of great satisfaction that naxalism in tribal areas has been mostly eradicated. However I would like to state that a new development model should be adopted to help the people there. They must be provided with basic facilities in the matter of education health and water supply. Only then we would be able to find a lasting solution to the problem.

With these few words I conclude my speech with the hope that the discussion in this Conference in the next few days would be of great help to the Nation.

Thank you.`
  },
};

/* ──────────────────────────────────────────────
   2. STATE
   ────────────────────────────────────────────── */
let selectedAudioKey  = null;
let extractedText     = "";
let examActive        = false;   // true ONLY during the audio/dictation phase
let typingActive      = false;   // true during the typing phase
let timerInterval     = null;
let timerSeconds      = 6300;    // 1 h 45 m
const TOTAL_SECONDS   = 6300;
let typingStarted     = false;

// Dedicated variable for seek-prevention (fixes the "this._lastTime" bug)
let _audioLastTime    = 0;

/* ──────────────────────────────────────────────
   3. DOM REFS
   ────────────────────────────────────────────── */
const screens = {
  selection:  document.getElementById("screenSelection"),
  dictation:  document.getElementById("screenDictation"),
  typing:     document.getElementById("screenTyping"),
  results:    document.getElementById("screenResults")
};

const examAudio         = document.getElementById("examAudio");
const waveform          = document.getElementById("waveform");
const waveformLabel     = document.getElementById("waveformLabel");
const audioProgressFill = document.getElementById("audioProgressFill");
const audioElapsed      = document.getElementById("audioElapsed");
const audioDuration     = document.getElementById("audioDuration");
const dictationLabel    = document.getElementById("dictationLabel");
const headerStatus      = document.getElementById("headerStatus");
const timerDisplay      = document.getElementById("timerDisplay");
const timerBarFill      = document.getElementById("timerBarFill");
const typingArea        = document.getElementById("typingArea");
const wordCounter       = document.getElementById("wordCounter");
const btnStartTyping    = document.getElementById("btnStartTyping");
const btnSubmit         = document.getElementById("btnSubmit");
const modalOverlay      = document.getElementById("modalOverlay");
const failOverlay       = document.getElementById("failOverlay");
const btnStartExam      = document.getElementById("btnStartExam");
const btnCancel         = document.getElementById("btnCancel");
const modalSubtitle     = document.getElementById("modalSubtitle");

/* ──────────────────────────────────────────────
   4. INITIALISE — BUILD AUDIO CARDS
   ────────────────────────────────────────────── */
(function buildAudioCards() {
  const grid = document.getElementById("audioCardsGrid");
  for (let i = 1; i <= 10; i++) {
    const key  = `audio-${i}`;
    const card = document.createElement("button");
    card.className = "audio-card";
    card.setAttribute("aria-label", `Select Dictation ${i}`);
    card.dataset.key = key;
    card.innerHTML = `
      <div class="card-number">${String(i).padStart(2, "0")}</div>
      <div class="card-label">Dictation ${i}</div>
      <div class="card-meta">~5 min · 200 WPM</div>
      <div class="card-arrow">→</div>
    `;
    card.addEventListener("click", () => openWarningModal(key, i));
    grid.appendChild(card);
  }
})();

/* ──────────────────────────────────────────────
   5. WARNING MODAL
   ────────────────────────────────────────────── */
function openWarningModal(key, index) {
  selectedAudioKey = key;
  modalSubtitle.textContent = `Dictation ${index} · 200 WPM`;
  modalOverlay.classList.add("open");
}

btnCancel.addEventListener("click", () => {
  modalOverlay.classList.remove("open");
  selectedAudioKey = null;
});

btnStartExam.addEventListener("click", () => {
  modalOverlay.classList.remove("open");
  startExam();
});

modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) {
    modalOverlay.classList.remove("open");
    selectedAudioKey = null;
  }
});

/* ──────────────────────────────────────────────
   6. startExam()
   ────────────────────────────────────────────── */
function startExam() {
  if (!selectedAudioKey) return;

  try {
    captureTranscript(selectedAudioKey);

    const index = selectedAudioKey.split("-")[1];
    dictationLabel.textContent  = `Dictation ${index}`;
    headerStatus.textContent    = `Exam in progress — Dictation ${index}`;

    showScreen("dictation");
    examActive   = false; // will be set true once audio actually plays
    typingActive = false;

    startAudio();
    attachExitDetection();

    // Push a history entry so the back button returns to selection
    history.pushState({ exam: true }, "");
  } catch (err) {
    console.error("startExam error:", err);
    resetToHome();
  }
}

/* ──────────────────────────────────────────────
   7. captureTranscript()
   Extracts text between START and STOP markers.
   Falls back to empty string (not the full raw
   transcript) when markers are absent, so the
   examiner must deliberately mark the passage.
   ────────────────────────────────────────────── */
function captureTranscript(key) {
  const raw      = audioData[key]?.transcript || "";
  const startIdx = raw.indexOf("START");
  const stopIdx  = raw.lastIndexOf("STOP");

  if (startIdx === -1 || stopIdx === -1 || startIdx >= stopIdx) {
    // BUG FIX: no markers → use the whole transcript as the assessed text
    // (previously fell through to raw.trim() which included preamble/footer)
    extractedText = raw.trim();
    return;
  }

  extractedText = raw.slice(startIdx + 5, stopIdx).trim();
}

/* ──────────────────────────────────────────────
   8. startAudio()
   ────────────────────────────────────────────── */
function startAudio() {
  const data = audioData[selectedAudioKey];
  if (!data) {
    resetToHome();
    return;
  }

  _audioLastTime = 0;

  examAudio.src = data.file;
  examAudio.volume = 1;

  examAudio.addEventListener("seeking",    preventSeek);
  examAudio.addEventListener("ratechange", preventSpeedChange);
  examAudio.addEventListener("loadedmetadata", onAudioMeta);
  examAudio.addEventListener("timeupdate", onAudioTimeUpdate);
  examAudio.addEventListener("ended",      onAudioEnded);
  examAudio.addEventListener("error",      onAudioError);

  examAudio.load();
  examAudio.play().then(() => {
    examActive = true;
    waveformLabel.textContent = "Audio playing — listen carefully";
    waveform.classList.add("playing");
  }).catch(() => {
    waveformLabel.textContent = "Click anywhere to start audio";
    document.addEventListener("click", resumeAudio, { once: true });
  });

  document.addEventListener("keydown", blockMediaKeys, true);
  examAudio.addEventListener("contextmenu", (e) => e.preventDefault());
}

function resumeAudio() {
  examAudio.play().then(() => {
    examActive = true;
    waveformLabel.textContent = "Audio playing — listen carefully";
    waveform.classList.add("playing");
  }).catch(() => resetToHome());
}

// BUG FIX: was using unreliable `this._lastTime`; now uses module-level _audioLastTime
function preventSeek() {
  if (Math.abs(examAudio.currentTime - _audioLastTime) > 1) {
    examAudio.currentTime = _audioLastTime;
  }
}

function preventSpeedChange() {
  if (examAudio.playbackRate !== 1) {
    examAudio.playbackRate = 1;
  }
}

function blockMediaKeys(e) {
  const blocked = [
    "MediaPlayPause", "MediaStop", "MediaTrackNext", "MediaTrackPrevious",
    " ", "ArrowLeft", "ArrowRight"
  ];
  if (blocked.includes(e.key) && (examActive || typingActive)) {
    e.preventDefault();
    e.stopPropagation();
  }
}

function onAudioMeta() {
  audioDuration.textContent = formatTime(examAudio.duration);
}

function onAudioTimeUpdate() {
  const cur = examAudio.currentTime;
  const dur = examAudio.duration || 1;
  _audioLastTime = cur;   // BUG FIX: was examAudio._lastTime

  audioElapsed.textContent        = formatTime(cur);
  audioProgressFill.style.width   = ((cur / dur) * 100).toFixed(2) + "%";
}

function onAudioEnded() {
  examActive = false;
  waveform.classList.remove("playing");
  waveformLabel.textContent = "Dictation complete";
  removeExitDetection();
  document.removeEventListener("keydown", blockMediaKeys, true);
  removeAudioListeners();
  startTypingTest();
}

function onAudioError() {
  waveformLabel.textContent = "Audio file not found — check assets/audios/";
  waveform.classList.remove("playing");
  // In production this would halt; for demo, fall through to typing test
  onAudioEnded();
}

// BUG FIX: centralise audio listener removal to prevent duplicates on restart
function removeAudioListeners() {
  examAudio.removeEventListener("seeking",         preventSeek);
  examAudio.removeEventListener("ratechange",      preventSpeedChange);
  examAudio.removeEventListener("loadedmetadata",  onAudioMeta);
  examAudio.removeEventListener("timeupdate",      onAudioTimeUpdate);
  examAudio.removeEventListener("ended",           onAudioEnded);
  examAudio.removeEventListener("error",           onAudioError);
}

/* ──────────────────────────────────────────────
   9. EXIT DETECTION
   ────────────────────────────────────────────── */
function attachExitDetection() {
  window.addEventListener("beforeunload",      onBeforeUnload);
  document.addEventListener("visibilitychange", onVisibilityChange);
}

function removeExitDetection() {
  window.removeEventListener("beforeunload",      onBeforeUnload);
  document.removeEventListener("visibilitychange", onVisibilityChange);
}

function onBeforeUnload(e) {
  if (!examActive && !typingActive) return;
  clearInterval(timerInterval);
  examActive   = false;
  typingActive = false;
  e.preventDefault();
  e.returnValue = "";
}

// Escape key always goes home safely
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") resetToHome();
});

function onVisibilityChange() {
  // BUG FIX: previously only examActive was checked; tab-switch during
  // typing phase was not detected. Now covers both phases.
  if (!examActive && !typingActive) return;
  if (document.hidden) failExam();
}

function failExam() {
  resetToHome();
  alert("Exam terminated: tab switch or window change detected.");
}

/* ──────────────────────────────────────────────
   10. startTypingTest()
   ────────────────────────────────────────────── */
function startTypingTest() {
  showScreen("typing");
  headerStatus.textContent = "Transcription phase — type your shorthand notes";

  timerSeconds  = TOTAL_SECONDS;
  typingStarted = false;
  typingActive  = false;

  updateTimerDisplay();
  updateTimerBar();

  typingArea.disabled = true;
  typingArea.value    = "";

  btnStartTyping.style.display = "inline-flex";
  btnSubmit.style.display      = "none";

  // BUG FIX: remove any stale input listener before re-attaching
  typingArea.removeEventListener("input", onTypingInput);
  typingArea.addEventListener("input", onTypingInput);

  // BUG FIX: { once: true } is correct but we also need to guard against
  // the button being clicked before state is ready
  btnStartTyping.addEventListener("click", onStartTypingClick, { once: true });
}

function onStartTypingClick() {
  typingStarted = true;
  typingActive  = true;
  typingArea.disabled = false;
  typingArea.focus();

  btnStartTyping.style.display = "none";
  btnSubmit.style.display      = "inline-flex";

  startTimer();
}

function onTypingInput() {
  const words = countWords(typingArea.value);
  wordCounter.textContent = `${words} word${words !== 1 ? "s" : ""}`;
}

/* ──────────────────────────────────────────────
   11. startTimer()
   ────────────────────────────────────────────── */
function startTimer() {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timerSeconds--;
    updateTimerDisplay();
    updateTimerBar();

    if (timerSeconds <= 0) {
      clearInterval(timerInterval);
      submitExam(true);
    }
  }, 1000);
}

function updateTimerDisplay() {
  const h = Math.floor(timerSeconds / 3600);
  const m = Math.floor((timerSeconds % 3600) / 60);
  const s = timerSeconds % 60;
  timerDisplay.textContent =
    `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;

  timerDisplay.classList.remove("warning", "danger");
  if      (timerSeconds <= 600)  timerDisplay.classList.add("danger");
  else if (timerSeconds <= 1800) timerDisplay.classList.add("warning");
}

function updateTimerBar() {
  const pct = (timerSeconds / TOTAL_SECONDS) * 100;
  timerBarFill.style.width = pct + "%";

  if (timerSeconds <= 600)
    timerBarFill.style.background = "var(--danger)";
  else if (timerSeconds <= 1800)
    timerBarFill.style.background = "var(--warning)";
  else
    timerBarFill.style.background = "";
}

/* ──────────────────────────────────────────────
   12. submitExam()
   ────────────────────────────────────────────── */
function submitExam(autoSubmit = false) {
  clearInterval(timerInterval);
  typingActive        = false;
  typingArea.disabled = true;
  btnSubmit.style.display = "none";

  try {
    const userTypedText = typingArea.value.trim();
    const results = calculateResults(extractedText, userTypedText);
    showResults(results);
  } catch (err) {
    console.error("submitExam error:", err);
    resetToHome();
  }
}

btnSubmit.addEventListener("click", () => submitExam(false));

/* ──────────────────────────────────────────────
   13. calculateResults()
   CBE Shorthand marking: uses LCS alignment so
   inserted or omitted words don't cascade as
   all-wrong from that point forward.
   ────────────────────────────────────────────── */
function calculateResults(reference, submitted) {
  const refWords  = tokenize(reference);
  const userWords = tokenize(submitted);

  const dp  = buildLCSMatrix(refWords, userWords);
  const alignment = traceback(dp, refWords, userWords);

  let correctWords = 0;
  let wrongWords   = 0;
  let missingWords = 0;
  let extraWords   = 0;

  // traceback returns ops in reverse — reverse to get document order
  const ops = alignment.slice().reverse();

  let ri = 0; // pointer into refWords
  let ui = 0; // pointer into userWords

  // alignedPairs: { op, userWord, refWord } in reading order
  const alignedPairs = [];

  for (const op of ops) {
    if (op === "match") {
      alignedPairs.push({ op: "match", userWord: userWords[ui], refWord: refWords[ri] });
      correctWords++;
      ri++; ui++;
    } else if (op === "sub") {
      alignedPairs.push({ op: "sub", userWord: userWords[ui], refWord: refWords[ri] });
      wrongWords++;
      ri++; ui++;
    } else if (op === "del") {
      // word in reference but missing from user text
      alignedPairs.push({ op: "del", userWord: null, refWord: refWords[ri] });
      missingWords++;
      ri++;
    } else if (op === "ins") {
      // extra word typed by user, not in reference
      alignedPairs.push({ op: "ins", userWord: userWords[ui], refWord: null });
      extraWords++;
      ui++;
    }
  }

  const totalWords = refWords.length;
  const accuracy   = totalWords > 0
    ? Number(((correctWords / totalWords) * 100).toFixed(2))
    : 0;

  // CBE passing threshold: 95 % accuracy
  const pass = accuracy >= 95;

  return { totalWords, correctWords, wrongWords, missingWords, extraWords, accuracy, pass, alignedPairs };
}

/* Build LCS matrix */
function buildLCSMatrix(a, b) {
  const m  = a.length;
  const n  = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Int32Array(n + 1));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (normalizeWord(a[i - 1]) === normalizeWord(b[j - 1])) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  return dp;
}

/* Traceback the LCS matrix to produce edit operations */
function traceback(dp, a, b) {
  const ops = [];
  let i = a.length;
  let j = b.length;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && normalizeWord(a[i - 1]) === normalizeWord(b[j - 1])) {
      ops.push("match");
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      ops.push("ins");   // extra word in user text
      j--;
    } else if (i > 0 && (j === 0 || dp[i - 1][j] > dp[i][j - 1])) {
      ops.push("del");   // word missing from user text
      i--;
    } else {
      // substitution: advance both (treat as wrong word)
      ops.push("sub");
      i--; j--;
    }
  }
  return ops; // order doesn't matter for counting
}

/* ──────────────────────────────────────────────
   14. showResults()
   ────────────────────────────────────────────── */
function showResults(results) {
  showScreen("results");
  headerStatus.textContent = "Exam complete";

  const verdictBadge = document.getElementById("verdictBadge");
  verdictBadge.textContent = results.pass ? "PASS" : "FAIL";
  verdictBadge.className   = "verdict-badge " + (results.pass ? "pass" : "fail");

  // Accuracy ring (circumference = 2π × 80 ≈ 502.65)
  const circ   = 502.65;
  const offset = circ - (results.accuracy / 100) * circ;
  const ringFill = document.getElementById("ringFill");
  setTimeout(() => {
    ringFill.style.strokeDashoffset = offset;
    ringFill.style.stroke = results.pass ? "#22c55e" : "#f43f5e";
  }, 300);

  document.getElementById("accuracyPct").textContent = results.accuracy + "%";

  document.getElementById("statTotal").textContent   = results.totalWords;
  document.getElementById("statCorrect").textContent = results.correctWords;
  document.getElementById("statWrong").textContent   = results.wrongWords;
  document.getElementById("statMissing").textContent = results.missingWords;
  document.getElementById("statExtra").textContent   = results.extraWords;

  const pct = (n) =>
    results.totalWords > 0
      ? ((n / results.totalWords) * 100).toFixed(1) + "%"
      : "0%";

  setTimeout(() => {
    document.getElementById("barTotal").style.width   = "100%";
    document.getElementById("barCorrect").style.width = pct(results.correctWords);
    document.getElementById("barWrong").style.width   = pct(results.wrongWords);
    document.getElementById("barMissing").style.width = pct(results.missingWords);
    document.getElementById("barExtra").style.width   = pct(results.extraWords);
  }, 400);

  // ── Typed Text Review Panel ──────────────────
  renderTypedReview(results.alignedPairs);
}

/* ──────────────────────────────────────────────
   14b. renderTypedReview()
   Renders the white review box with colour-coded
   word spans:
     • match → plain black text
     • sub   → red text + underline + correct word shown below
     • del   → orange dashed placeholder "[missing: word]"
     • ins   → purple strikethrough (extra word)
   ────────────────────────────────────────────── */
function renderTypedReview(alignedPairs) {
  const box = document.getElementById("typedReviewBox");
  if (!box) return;

  box.innerHTML = ""; // clear previous

  if (!alignedPairs || alignedPairs.length === 0) {
    box.textContent = "(No text was typed.)";
    return;
  }

  // We'll build the display using the USER's typed words as the base flow.
  // Missing words (del) are injected inline at the correct position.
  alignedPairs.forEach((pair, idx) => {
    // Add a space before every word except the first visible one
    if (idx > 0) {
      box.appendChild(document.createTextNode(" "));
    }

    if (pair.op === "match") {
      // Correct — plain text
      const span = document.createElement("span");
      span.className = "word-slot";
      span.textContent = pair.userWord;
      box.appendChild(span);

    } else if (pair.op === "sub") {
      // Wrong word — red underlined + character-level diff + correct word below
      const wrapper = document.createElement("span");
      wrapper.className = "word-slot word-wrong";
      wrapper.title = `Correct: ${pair.refWord}`;

      // Character-level highlight: red for wrong chars, dark for matching chars
      const typedChars  = pair.userWord.split("");
      const correctChars = pair.refWord.split("");
      const maxLen = Math.max(typedChars.length, correctChars.length);

      const charSpan = document.createElement("span");
      charSpan.className = "word-chars";

      for (let ci = 0; ci < typedChars.length; ci++) {
        const ch = document.createElement("span");
        ch.textContent = typedChars[ci];
        if (ci >= correctChars.length || typedChars[ci].toLowerCase() !== correctChars[ci].toLowerCase()) {
          ch.style.background = "rgba(220,38,38,0.18)";
          ch.style.borderRadius = "2px";
        }
        charSpan.appendChild(ch);
      }
      wrapper.appendChild(charSpan);

      // The correct word hint shown below
      const hint = document.createElement("span");
      hint.className = "correct-hint";
      hint.textContent = `✓ ${pair.refWord}`;
      wrapper.appendChild(hint);

      box.appendChild(wrapper);

    } else if (pair.op === "del") {
      // Missing word — show orange placeholder
      const span = document.createElement("span");
      span.className = "word-slot word-missing";
      span.title = "This word was missing from your transcription";
      span.textContent = `[${pair.refWord}]`;
      box.appendChild(span);

    } else if (pair.op === "ins") {
      // Extra word — purple strikethrough
      const span = document.createElement("span");
      span.className = "word-slot word-extra";
      span.title = "Extra word — not in the original passage";
      span.textContent = pair.userWord;
      box.appendChild(span);
    }
  });
}

/* ──────────────────────────────────────────────
   15. resetToHome() — unified teardown
   Called by goHome(), restartExam(), failExam(),
   and any error handler. Always lands on selection.
   ────────────────────────────────────────────── */
function resetToHome() {
  // Stop timer
  clearInterval(timerInterval);

  // Clear state flags
  examActive   = false;
  typingActive = false;
  typingStarted = false;
  selectedAudioKey = null;
  extractedText    = "";
  _audioLastTime   = 0;

  // Tear down audio
  examAudio.pause();
  examAudio.currentTime = 0;
  examAudio.src         = "";
  removeAudioListeners();
  document.removeEventListener("keydown", blockMediaKeys, true);

  // Tear down exit detection
  removeExitDetection();

  // Reset waveform UI
  waveform.classList.remove("playing");
  waveformLabel.textContent         = "Preparing audio…";
  audioProgressFill.style.width     = "0%";
  audioElapsed.textContent          = "0:00";
  audioDuration.textContent         = "—";

  // Reset typing UI
  typingArea.value    = "";
  typingArea.disabled = true;
  typingArea.removeEventListener("input", onTypingInput);
  wordCounter.textContent = "0 words";

  // BUG FIX: reset button visibility so next exam starts correctly
  btnStartTyping.style.display = "inline-flex";
  btnSubmit.style.display      = "none";

  // Reset timer display
  timerSeconds = TOTAL_SECONDS;
  updateTimerDisplay();
  timerBarFill.style.width      = "100%";
  timerBarFill.style.background = "";
  timerDisplay.classList.remove("warning", "danger");

  // Reset result ring
  const ringFill = document.getElementById("ringFill");
  if (ringFill) ringFill.style.strokeDashoffset = "502.65";

  // Reset stat bars (no transition)
  ["barCorrect", "barWrong", "barMissing", "barExtra"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.width = "0%";
  });

  // Close any open modals
  failOverlay.classList.remove("open");
  modalOverlay.classList.remove("open");

  headerStatus.textContent = "Select a dictation to begin";
  showScreen("selection");
}

/* Public aliases kept for HTML onclick compatibility */
function goHome()       { resetToHome(); }
function restartExam()  { resetToHome(); }

/* ──────────────────────────────────────────────
   16. HELPERS
   ────────────────────────────────────────────── */
function showScreen(name) {
  Object.entries(screens).forEach(([key, el]) => {
    el.classList.toggle("active", key === name);
  });
}

function tokenize(text) {
  return cleanText(text).split(" ").filter(Boolean);
}

function cleanText(text) {
  return text
    .toLowerCase()
    .replace(/[.,!?;:'"()\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeWord(word) {
  return word
    .toLowerCase()
    .replace(/[.,!?;:'"()\-]/g, "")
    .trim();
}

function countWords(text) {
  return text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
}

function formatTime(secs) {
  if (!isFinite(secs)) return "—";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/* ──────────────────────────────────────────────
   17. CONTEXT MENU BLOCK DURING EXAM
   ────────────────────────────────────────────── */
document.addEventListener("contextmenu", (e) => {
  if (examActive || typingActive) e.preventDefault();
});

/* ──────────────────────────────────────────────
   18. HISTORY / BACK BUTTON
   BUG FIX: previously two separate popstate
   listeners were registered (one with replaceState
   and one with pushState), causing double-firing
   and inconsistent navigation. Replaced with a
   single, clean listener.
   ────────────────────────────────────────────── */

// Establish baseline state on page load
history.replaceState({ page: "selection" }, "");

window.addEventListener("popstate", function () {
  const notOnSelection =
    screens.dictation.classList.contains("active") ||
    screens.typing.classList.contains("active")    ||
    screens.results.classList.contains("active");

  if (notOnSelection) {
    resetToHome();
    // Re-push so the user can press back again to leave the site
    history.pushState({ page: "selection" }, "");
  }
});