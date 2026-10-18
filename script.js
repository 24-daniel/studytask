// ---------- Logika murni (dapat diuji tanpa browser) ----------
const KEY = "studytask.v1";

function validateTask(input, today) {
  const title = String(input.title || "").trim();
  if (!title) return { ok: false, error: "Judul tugas wajib diisi." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.deadline || ""))
    return { ok: false, error: "Tanggal deadline wajib diisi." };
  if (input.deadline < today)
    return { ok: false, error: "Deadline tidak boleh di masa lalu." };
  const prio = ["rendah", "sedang", "tinggi"].includes(input.priority) ? input.priority : "sedang";
  return { ok: true, task: { title, course: String(input.course || "").trim(), deadline: input.deadline, priority: prio, done: false } };
}

// Perbandingan string YYYY-MM-DD aman dari masalah zona waktu
function todayStr(d = new Date()) {
  const p = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function isOverdue(task, today) { return !task.done && task.deadline < today; }

function filterTasks(tasks, mode) {
  if (mode === "aktif") return tasks.filter(t => !t.done);
  if (mode === "selesai") return tasks.filter(t => t.done);
  return tasks;
}

const RANK = { tinggi: 0, sedang: 1, rendah: 2 };
function sortTasks(tasks) {
  return [...tasks].sort((a, b) =>
    a.done - b.done || a.deadline.localeCompare(b.deadline) || RANK[a.priority] - RANK[b.priority]);
}

function stats(tasks, today) {
  return { total: tasks.length, selesai: tasks.filter(t => t.done).length,
           terlambat: tasks.filter(t => isOverdue(t, today)).length };
}

if (typeof module !== "undefined") module.exports = { validateTask, todayStr, isOverdue, filterTasks, sortTasks, stats };

// ---------- Bagian antarmuka (hanya di browser) ----------
if (typeof document !== "undefined") {
  let tasks = [];
  try { tasks = JSON.parse(localStorage.getItem(KEY)) || []; } catch { tasks = []; }
  const $ = id => document.getElementById(id);
  const save = () => localStorage.setItem(KEY, JSON.stringify(tasks));

  function render() {
    const today = todayStr();
    const list = $("list");
    list.replaceChildren();
    sortTasks(filterTasks(tasks, $("filter").value)).forEach(t => {
      const li = document.createElement("li");
      li.className = t.priority + (t.done ? " done" : "");
      const cb = document.createElement("input");
      cb.type = "checkbox"; cb.checked = t.done;
      cb.onchange = () => { t.done = cb.checked; save(); render(); };
      const info = document.createElement("div"); info.className = "info";
      const title = document.createElement("div"); title.className = "t";
      title.textContent = t.title;                 // textContent: aman dari XSS
      const meta = document.createElement("div"); meta.className = "meta";
      meta.textContent = `${t.course || "-"} | deadline ${t.deadline} | ${t.priority}`;
      if (isOverdue(t, today)) { const s = document.createElement("span"); s.className = "late"; s.textContent = " (terlambat)"; meta.append(s); }
      info.append(title, meta);
      const del = document.createElement("button"); del.textContent = "Hapus";
      del.onclick = () => { tasks = tasks.filter(x => x !== t); save(); render(); };
      li.append(cb, info, del);
      list.append(li);
    });
    const s = stats(tasks, today);
    $("stats").textContent = `${s.selesai}/${s.total} selesai, ${s.terlambat} terlambat`;
  }

  $("taskForm").addEventListener("submit", e => {
    e.preventDefault();
    const r = validateTask({ title: $("title").value, course: $("course").value,
      deadline: $("deadline").value, priority: $("priority").value }, todayStr());
    $("error").textContent = r.ok ? "" : r.error;
    if (!r.ok) return;
    tasks.push(r.task); save(); e.target.reset(); render();
  });
  $("filter").addEventListener("change", render);
  render();
}
