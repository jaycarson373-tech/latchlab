import "./style.css";
import {
  VAULTS,
  STAGE_NAMES,
  challenge,
  solve,
  checkAnswer,
  freshState,
  validState,
  totalPoints,
} from "./engine.js";
import { createScene } from "./scene.js";
const $ = (s) => document.querySelector(s),
  two = (n) => String(n).padStart(2, "0");
let state;
try {
  state = JSON.parse(localStorage.getItem("latchlab.progress.v1"));
} catch {}
if (!validState(state)) state = freshState();
let selected = 0,
  player = "bot",
  pace = 850,
  active = null,
  scene = null;
const logs = VAULTS.map(() => []);
function toast(message) {
  $("#toast").textContent = message;
  $("#toast").hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => ($("#toast").hidden = true), 4500);
}
function save() {
  try {
    localStorage.setItem("latchlab.progress.v1", JSON.stringify(state));
  } catch {
    toast(
      "Progress is available for this visit. Browser storage is unavailable.",
    );
  }
}
function addLog(index, message, kind = "") {
  logs[index].push({
    message,
    kind,
    time: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
  });
  if (logs[index].length > 80) logs[index].shift();
  if (index === selected) drawLog();
}
function drawLog() {
  const box = $("#log");
  box.replaceChildren();
  if (!logs[selected].length) {
    const empty = document.createElement("div");
    empty.className = "log-empty";
    const mark = document.createElement("strong");
    mark.textContent = "[ ·_· ]";
    empty.append(mark, document.createTextNode("Quiet in here. Too quiet."));
    box.append(empty);
  } else
    for (const line of logs[selected]) {
      const row = document.createElement("div");
      row.className = `log-line ${line.kind}`;
      const time = document.createElement("span");
      time.textContent = line.time + " / ";
      row.append(time, document.createTextNode(line.message));
      box.append(row);
    }
  box.scrollTop = box.scrollHeight;
}
function render() {
  const v = VAULTS[selected],
    stage = state.stages[selected],
    done = stage === v.stages,
    running = active?.index === selected;
  for (const id of ["vault-name", "panel-name", "scene-name"])
    $("#" + id).textContent = v.name;
  for (const id of ["panel-number", "scene-number"])
    $("#" + id).textContent = two(selected + 1);
  $("#ticket-number").textContent = "VAULT " + two(selected + 1);
  $("#vault-status").textContent = done ? "CRACKED ✓" : "UNCRACKED";
  $("#points").textContent = v.points.toLocaleString();
  $("#total-points").textContent = totalPoints(state).toLocaleString() + " PTS";
  $("#difficulty").textContent = two(selected + 1) + " / " + v.level;
  $("#scene-caption").textContent = v.caption.toUpperCase();
  $("#vault-facts").replaceChildren();
  for (const text of [
    `${v.stages} puzzles, one inside the next`,
    "Play yourself or send a solver",
    "Practice points · no cash value",
  ]) {
    const li = document.createElement("li");
    li.textContent = text;
    $("#vault-facts").append(li);
  }
  $("#vault-picker").replaceChildren();
  VAULTS.forEach((vault, i) => {
    const b = document.createElement("button");
    b.setAttribute("aria-label", `Vault ${i + 1}: ${vault.name}`);
    b.setAttribute("aria-current", String(i === selected));
    const n = document.createElement("b"),
      s = document.createElement("small");
    n.textContent = two(i + 1);
    s.textContent = state.stages[i] === vault.stages ? "✓ OPEN" : vault.name;
    b.append(n, s);
    b.onclick = () => select(i);
    $("#vault-picker").append(b);
  });
  $("#progress-text").textContent = `${stage} / ${v.stages}`;
  $("#progress-bar").style.width = (stage / v.stages) * 100 + "%";
  $("#run-label").textContent = done
    ? "VAULT UNLOCKED"
    : running
      ? "WORKING ON IT"
      : stage
        ? "READY TO CONTINUE"
        : "READY WHEN YOU ARE";
  $("#log-state").textContent = running
    ? "WORKING"
    : done
      ? "COMPLETE"
      : "STANDING BY";
  $("#room-state").textContent = active
    ? "Solver at work"
    : "Playground online";
  $("#launch").disabled = !!active;
  $("#launch").textContent = done
    ? "Replay this vault"
    : stage
      ? "Continue cracking"
      : "Let’s crack it ✳";
  $("#stop").hidden = !running;
  $("#answer-form").hidden = player !== "human" || !running;
  $("#players")
    .querySelectorAll("button")
    .forEach((b) => {
      b.classList.toggle("selected", b.dataset.player === player);
      b.disabled = !!active;
    });
  $("#ai-controls").hidden = player !== "ai";
  $("#pace-controls").hidden = player !== "bot";
  $("#human-hint").hidden = player !== "human";
  $("#setting-title").textContent =
    player === "bot"
      ? "Set the pace"
      : player === "ai"
        ? "Connect your model"
        : "Follow the clues";
  $("#player-hint").textContent =
    player === "bot"
      ? "Our built-in solver. No key, no setup."
      : player === "human"
        ? "Your brain. Your answers. Your victory."
        : "Your own model, answering real puzzles.";
  scene?.update(selected, done, running);
  drawLog();
}
function select(i) {
  selected = (i + 5) % 5;
  history.replaceState(null, "", `#vault/${selected + 1}`);
  render();
  return { vault: selected + 1, name: VAULTS[selected].name };
}
function readRoute() {
  const match = location.hash.match(/^#vault\/([1-5])$/);
  selected = match ? Number(match[1]) - 1 : 0;
  render();
}
addEventListener("hashchange", readRoute);
$("#prev").onclick = () => select(selected - 1);
$("#next").onclick = () => select(selected + 1);
addEventListener("keydown", (e) => {
  if (e.target.closest("input,select,textarea") || $("#modal").open) return;
  if (e.key === "ArrowLeft") select(selected - 1);
  if (e.key === "ArrowRight") select(selected + 1);
});
$("#players").onclick = (e) => {
  const b = e.target.closest("[data-player]");
  if (b && !active) {
    player = b.dataset.player;
    render();
  }
};
$("#pace-controls").onclick = (e) => {
  const b = e.target.closest("[data-pace]");
  if (b) {
    pace = Number(b.dataset.pace);
    $("#pace-controls")
      .querySelectorAll("button")
      .forEach((x) => x.classList.toggle("selected", x === b));
  }
};
$("#provider").onchange = () => {
  $("#api-key").value = "";
  $("#model").value =
    $("#provider").value === "openai" ? "gpt-4.1-mini" : "openai/gpt-4.1-mini";
};
function showModal(title, html) {
  $("#modal-title").textContent = title;
  $("#modal-body").innerHTML = html;
  $("#modal").showModal();
}
$("#close-modal").onclick = () => $("#modal").close();
$("#modal").onclick = (e) => {
  if (e.target === $("#modal")) {
    const r = $("#modal").getBoundingClientRect();
    if (
      e.clientX < r.left ||
      e.clientX > r.right ||
      e.clientY < r.top ||
      e.clientY > r.bottom
    )
      $("#modal").close();
  }
};
$("#stages-button").onclick = () =>
  showModal(
    VAULTS[selected].name + " / the locks",
    STAGE_NAMES.slice(0, VAULTS[selected].stages)
      .map(
        (name, i) =>
          `<div class="stage-row"><b>${i < state.stages[selected] ? "✓" : two(i + 1)}</b><span>${name}</span></div>`,
      )
      .join(""),
  );
$("#how-button").onclick = () =>
  showModal(
    "A little lock logic.",
    `<div class="modal-copy"><h3>01 / Choose your vault</h3><p>Five vaults, from Ember to Obsidian. Each has a chain of number, word, and logic puzzles. Use the numbered buttons, arrow keys, or swipe the vault.</p><h3>02 / Send a mind inside</h3><p>Lab bot is a deterministic built-in solver, not an AI model. Choose You to solve clues yourself, or Your AI to call your own OpenAI or OpenRouter model. AI calls use your provider credits; answers are checked locally.</p><h3>03 / Open it up</h3><p>Complete every stage to earn practice points. Progress stays in this browser. Pause whenever you like and continue later. Replaying replaces that vault’s progress; points cannot be farmed.</p><h3>Practice, with purpose</h3><p>There is no token, wallet requirement, real-money prize, or blockchain payout in this edition. This is an independent puzzle playground inspired by dcrypt.fun, with its own brand and implementation.</p><h3>Your key stays yours</h3><p>Your API key is held only in the current page and sent directly to the provider you select. It is never saved to browser storage or sent to a Latchlab server. Closing or refreshing this page clears it.</p></div>`,
  );
function pause() {
  if (!active) return;
  const run = active;
  active = null;
  run.controller.abort();
  addLog(run.index, "Run paused. Your solved stages are saved.");
  render();
}
$("#stop").onclick = pause;
function currentChallenge(i) {
  return challenge(i, state.stages[i], state.seed);
}
function accept(i, answer) {
  const c = currentChallenge(i);
  if (!checkAnswer(c, answer)) {
    addLog(
      i,
      `“${String(answer).slice(0, 140)}” is not the answer. Try again.`,
      "error",
    );
    return false;
  }
  state.stages[i]++;
  save();
  addLog(i, `Correct: ${answer}. Lock ${state.stages[i]} opened.`, "success");
  $("#feed").textContent =
    `${VAULTS[i].name} / lock ${state.stages[i]} opened.`;
  if (state.stages[i] === VAULTS[i].stages) {
    addLog(i, `VAULT OPEN. +${VAULTS[i].points} practice points.`, "success");
    toast(`${VAULTS[i].name} cracked. Nice work!`);
    $("#feed").textContent =
      `${VAULTS[i].name} cracked. ${VAULTS[i].points} points earned.`;
  }
  render();
  return true;
}
const wait = (ms, signal) =>
  new Promise((resolve, reject) => {
    let timer;
    const cancel = () => {
      clearTimeout(timer);
      reject(new DOMException("Paused", "AbortError"));
    };
    if (signal.aborted) return cancel();
    timer = setTimeout(() => {
      signal.removeEventListener("abort", cancel);
      resolve();
    }, ms);
    signal.addEventListener("abort", cancel, { once: true });
  });
async function askAI(c, settings, signal) {
  const endpoint =
    settings.provider === "openai"
      ? "https://api.openai.com/v1/chat/completions"
      : "https://openrouter.ai/api/v1/chat/completions";
  const response = await fetch(endpoint, {
    method: "POST",
    signal: AbortSignal.any([signal, AbortSignal.timeout(45000)]),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${settings.key}`,
    },
    body: JSON.stringify({
      model: settings.model,
      messages: [
        {
          role: "system",
          content:
            "Solve the puzzle. Reply with only the answer: no explanation, formatting, or punctuation beyond what the answer needs.",
        },
        { role: "user", content: c.prompt },
      ],
      ...(settings.provider === "openai"
        ? { max_completion_tokens: 256 }
        : { max_tokens: 256 }),
    }),
  });
  if (!response.ok) {
    const messages = {
      401: "API key rejected. Check your provider and key.",
      403: "This model is not available to this API key.",
      429: "Provider rate limit or credit limit reached. Try again later.",
    };
    throw new Error(
      messages[response.status] ||
        `Provider returned HTTP ${response.status}. Check your model ID and provider account.`,
    );
  }
  const data = await response.json();
  const answer = data.choices?.[0]?.message?.content;
  if (typeof answer !== "string" || !answer.trim())
    throw new Error("The provider returned no answer. Try another model.");
  return answer.trim();
}
async function start() {
  if (active) return;
  const i = selected,
    v = VAULTS[i];
  if (state.stages[i] === v.stages) {
    showModal(
      "Replay this vault?",
      `<div class="modal-copy"><p>This replaces ${v.name}’s solved stages and removes its ${v.points} points until you solve it again.</p><button class="button dark" id="confirm-replay">Replay ${v.name}</button></div>`,
    );
    $("#confirm-replay").onclick = () => {
      state.stages[i] = 0;
      logs[i] = [];
      save();
      $("#modal").close();
      render();
    };
    return;
  }
  const settings = {
    provider: $("#provider").value,
    key: $("#api-key").value.trim(),
    model: $("#model").value.trim(),
  };
  if (player === "ai" && (!settings.key || !settings.model)) {
    toast("Enter your provider API key and model ID first.");
    $("#api-key").focus();
    return;
  }
  const run = { index: i, controller: new AbortController(), player };
  active = run;
  addLog(
    i,
    `${player === "bot" ? "Lab bot" : player === "human" ? "You" : settings.model} entered ${v.name}.`,
  );
  render();
  if (player === "human") {
    addLog(i, currentChallenge(i).prompt);
    $("#answer").focus();
    return;
  }
  try {
    while (active === run && state.stages[i] < v.stages) {
      const c = currentChallenge(i);
      addLog(i, `Stage ${state.stages[i] + 1}: ${c.prompt}`);
      await wait(pace, run.controller.signal);
      let answer;
      if (run.player === "ai") {
        answer = await askAI(c, settings, run.controller.signal);
      } else {
        answer = solve(c);
      }
      if (active !== run) return;
      if (!accept(i, answer)) {
        addLog(
          i,
          "Solver stopped on an incorrect answer. Switch to You to finish this clue.",
          "error",
        );
        break;
      }
    }
  } catch (error) {
    if (active === run) {
      const message =
        error.name === "TimeoutError"
          ? "Provider timed out. Try again."
          : error instanceof TypeError
            ? "Could not reach the provider. Check your connection or provider browser access."
            : error.message;
      addLog(i, message, "error");
      toast(message);
    }
  } finally {
    settings.key = "";
    if (active === run) {
      active = null;
      render();
    }
  }
}
$("#launch").onclick = start;
$("#answer-form").onsubmit = (e) => {
  e.preventDefault();
  if (active?.player !== "human" || active.index !== selected) return;
  const i = selected;
  if (accept(i, $("#answer").value)) {
    if (state.stages[i] === VAULTS[i].stages) {
      active = null;
      render();
    } else addLog(i, currentChallenge(i).prompt);
  }
  $("#answer").value = "";
  $("#answer").focus();
};
$("#reset").onclick = () =>
  showModal(
    "Start fresh?",
    `<div class="modal-copy"><p>This clears all five vaults and your practice score on this device.</p><button class="button dark" id="confirm-reset">Reset all progress</button></div>`,
  );
$("#modal-body").addEventListener("click", (e) => {
  if (e.target.id === "confirm-reset") {
    pause();
    state = freshState();
    logs.forEach((l) => (l.length = 0));
    save();
    $("#modal").close();
    render();
    toast("A clean slate. Five fresh vaults.");
  }
});
try {
  scene = createScene($("#scene"), (delta) => select(selected + delta));
} catch (error) {
  $("#scene").hidden = true;
  $("#scene-fallback").hidden = false;
  console.warn("3D view unavailable; puzzle controls remain available.", error);
}
readRoute();
const context = document.modelContext;
if (context?.registerTool) {
  const lifecycle = new AbortController();
  for (const tool of [
    {
      name: "get_vault_progress",
      description: "Read the five vaults and local practice progress.",
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      execute: async () => ({
        vaults: VAULTS.map((v, i) => ({
          vault: i + 1,
          name: v.name,
          solved: state.stages[i],
          stages: v.stages,
        })),
        points: totalPoints(state),
      }),
    },
    {
      name: "select_vault",
      description:
        "Show a vault in the visible interface without starting a solver.",
      inputSchema: {
        type: "object",
        properties: { vault: { type: "integer", minimum: 1, maximum: 5 } },
        required: ["vault"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false },
      execute: async (input) => {
        if (
          !Number.isInteger(input?.vault) ||
          input.vault < 1 ||
          input.vault > 5
        )
          throw new Error("Vault must be 1–5.");
        return select(input.vault - 1);
      },
    },
  ]) {
    try {
      Promise.resolve(
        context.registerTool(tool, { signal: lifecycle.signal }),
      ).catch(() => {});
    } catch {}
  }
  addEventListener("pagehide", () => lifecycle.abort(), { once: true });
}
