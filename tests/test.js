const assert = require("assert");
const { validateTask, isOverdue, filterTasks, sortTasks, stats, todayStr } = require("../script.js");
const T = "2026-10-18";
let n = 0; const t = (name, fn) => { fn(); n++; console.log("OK  " + name); };

t("judul kosong ditolak", () => assert.equal(validateTask({ title: "  ", deadline: "2026-10-20" }, T).ok, false));
t("deadline kosong ditolak", () => assert.equal(validateTask({ title: "A", deadline: "" }, T).ok, false));
t("deadline lampau ditolak", () => assert.equal(validateTask({ title: "A", deadline: "2026-10-01" }, T).ok, false));
t("deadline hari ini diterima", () => assert.equal(validateTask({ title: "A", deadline: T }, T).ok, true));
t("prioritas tidak valid -> sedang", () => assert.equal(validateTask({ title: "A", deadline: T, priority: "x" }, T).task.priority, "sedang"));
t("terlambat hanya jika belum selesai", () => {
  assert.equal(isOverdue({ done: false, deadline: "2026-10-01" }, T), true);
  assert.equal(isOverdue({ done: true, deadline: "2026-10-01" }, T), false);
  assert.equal(isOverdue({ done: false, deadline: T }, T), false);
});
t("filter", () => {
  const l = [{ done: true }, { done: false }];
  assert.equal(filterTasks(l, "aktif").length, 1);
  assert.equal(filterTasks(l, "selesai").length, 1);
  assert.equal(filterTasks(l, "semua").length, 2);
});
t("urutan: belum selesai, deadline, prioritas", () => {
  const l = [{ done: true, deadline: "2026-01-01", priority: "tinggi" },
             { done: false, deadline: "2026-10-30", priority: "rendah" },
             { done: false, deadline: "2026-10-30", priority: "tinggi" },
             { done: false, deadline: "2026-10-20", priority: "rendah" }];
  const s = sortTasks(l);
  assert.deepEqual(s.map(x => x.deadline + x.priority),
    ["2026-10-20rendah", "2026-10-30tinggi", "2026-10-30rendah", "2026-01-01tinggi"]);
});
t("statistik", () => assert.deepEqual(stats([{ done: true, deadline: "2026-01-01" }, { done: false, deadline: "2026-01-01" }], T), { total: 2, selesai: 1, terlambat: 1 }));
t("todayStr format", () => assert.equal(todayStr(new Date(2026, 9, 5)), "2026-10-05"));
console.log(`\n${n} tes lulus`);
