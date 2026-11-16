const STORAGE_KEY = "laporan_kegiatan_harian";

const form = document.getElementById("reportForm");
const editIdInput = document.getElementById("editId");
const dateInput = document.getElementById("date");
const activityInput = document.getElementById("activity");
const descriptionInput = document.getElementById("description");
const statusSelect = document.getElementById("status");
const submitBtn = document.getElementById("submitBtn");
const cancelEditBtn = document.getElementById("cancelEdit");
const toggleFormBtn = document.getElementById("toggleForm");
const tbody = document.querySelector("#reportList table tbody");
const emptyState = document.getElementById("emptyState");

const searchInput = document.getElementById("searchInput");
const filterStatus = document.getElementById("filterStatus");
const filterDate = document.getElementById("filterDate");

const exportBtn = document.getElementById("exportBtn");
const importBtn = document.getElementById("importBtn");
const importFile = document.getElementById("importFile");

const statTotal = document.getElementById("statTotal");
const statSelesai = document.getElementById("statSelesai");
const statProses = document.getElementById("statProses");
const statTertunda = document.getElementById("statTertunda");

let reports = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let editingId = null;

function showSaved() {
  let badge = document.querySelector(".saved-badge");
  if (!badge) {
    badge = document.createElement("div");
    badge.className = "saved-badge";
    badge.textContent = "Data tersimpan";
    document.body.appendChild(badge);
  }
  badge.classList.add("show");
  setTimeout(() => badge.classList.remove("show"), 2000);
}

function applyTheme(theme) {
  document.body.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
}

const savedTheme = localStorage.getItem("theme") || "light";
applyTheme(savedTheme);

function setToday() {
  const today = new Date().toISOString().split("T")[0];
  dateInput.value = today;
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  renderReports();
  updateStats();
  showSaved();
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text === null || text === undefined ? "" : text;
  return div.innerHTML;
}

function getStatusColorClass(status) {
  return `status-${status}`;
}

function renderReports() {
  tbody.innerHTML = "";

  const keyword = searchInput.value.toLowerCase().trim();
  const statusFilter = filterStatus.value;
  const dateFilter = filterDate.value;

  const filtered = reports.filter((r) => {
    const matchSearch =
      r.activity.toLowerCase().includes(keyword) ||
      (r.description || "").toLowerCase().includes(keyword);
    const matchStatus = statusFilter ? r.status === statusFilter : true;
    const matchDate = dateFilter ? r.date === dateFilter : true;
    return matchSearch && matchStatus && matchDate;
  });

  const sorted = [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date));

  if (sorted.length === 0) {
    emptyState.style.display = "block";
    tbody.innerHTML = `<tr><td colspan="5" class="empty-state">Tidak ada laporan yang cocok.</td></tr>`;
    return;
  }

  emptyState.style.display = "none";

  sorted.forEach((report, index) => {
    const tr = document.createElement("tr");
    tr.className = "row-added";
    tr.style.animationDelay = `${index * 0.05}s`;
    tr.innerHTML = `
      <td>${escapeHtml(report.date)}</td>
      <td><strong>${escapeHtml(report.activity)}</strong></td>
      <td>${escapeHtml(report.description || "-")}</td>
      <td><span class="status-badge ${getStatusColorClass(report.status)}">${escapeHtml(report.status)}</span></td>
      <td>
        <div class="action-group">
          <button class="btn btn-edit btn-sm" onclick="editReport('${report.id}')" title="Edit">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteReport('${report.id}')" title="Hapus">Hapus</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function updateStats() {
  statTotal.textContent = reports.length;
  statSelesai.textContent = reports.filter((r) => r.status === "Selesai").length;
  statProses.textContent = reports.filter((r) => r.status === "Proses").length;
  statTertunda.textContent = reports.filter((r) => r.status === "Tertunda").length;
}

function resetForm() {
  form.reset();
  editIdInput.value = "";
  editingId = null;
  submitBtn.textContent = "Simpan";
  cancelEditBtn.style.display = "none";
  toggleFormBtn.style.display = "none";
  setToday();
}

function addOrUpdateReport(e) {
  e.preventDefault();

  const reportData = {
    date: dateInput.value,
    activity: activityInput.value.trim(),
    description: descriptionInput.value.trim(),
    status: statusSelect.value,
  };

  if (!reportData.date || !reportData.activity) {
    alert("Tanggal dan kegiatan wajib diisi.");
    return;
  }

  if (editingId) {
    const idx = reports.findIndex((r) => r.id === editingId);
    if (idx !== -1) {
      reports[idx] = { ...reports[idx], ...reportData, updatedAt: new Date().toISOString() };
    }
  } else {
    reports.push({
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      ...reportData,
      createdAt: new Date().toISOString(),
    });
  }

  save();
  resetForm();
}

window.editReport = function (id) {
  const report = reports.find((r) => r.id === id);
  if (!report) return;

  editingId = id;
  editIdInput.value = id;
  dateInput.value = report.date;
  activityInput.value = report.activity;
  descriptionInput.value = report.description || "";
  statusSelect.value = report.status;
  submitBtn.textContent = "Perbarui";
  cancelEditBtn.style.display = "inline-flex";
  toggleFormBtn.style.display = "inline-block";

  form.scrollIntoView({ behavior: "smooth" });
};

window.deleteReport = function (id) {
  if (!confirm("Yakin ingin menghapus laporan ini?")) return;

  const tr = Array.from(tbody.querySelectorAll("tr")).find((row) => {
    const btn = row.querySelector(`button[onclick="deleteReport('${id}')"]`);
    return btn && btn.closest("tr") === row;
  });

  if (tr) {
    tr.classList.add("row-removed");
    tr.addEventListener("animationend", () => {
      reports = reports.filter((r) => r.id !== id);
      save();
    }, { once: true });
  } else {
    reports = reports.filter((r) => r.id !== id);
    save();
  }
};

function exportData() {
  const dataStr = JSON.stringify(reports, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `laporan-kegiatan-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showSaved();
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target.result);
      if (!Array.isArray(imported)) throw new Error("Format tidak valid");
      if (confirm(`Impor ${imported.length} laporan? Data akan digabungkan dengan yang ada.`)) {
        reports = [...reports, ...imported].map((r, i) => ({
          ...r,
          id: r.id || `imported-${Date.now()}-${i}`,
        }));
        save();
      }
    } catch (err) {
      alert("Gagal mengimpor file: " + err.message);
    }
  };
  reader.readAsText(file);
}

form.addEventListener("submit", addOrUpdateReport);
cancelEditBtn.addEventListener("click", resetForm);
toggleFormBtn.addEventListener("click", resetForm);
searchInput.addEventListener("input", renderReports);
filterStatus.addEventListener("change", renderReports);
filterDate.addEventListener("change", renderReports);

exportBtn.addEventListener("click", exportData);
importBtn.addEventListener("click", () => importFile.click());
importFile.addEventListener("change", (e) => {
  if (e.target.files.length) importData(e.target.files[0]);
  e.target.value = "";
});

setToday();
renderReports();
updateStats();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch((err) => {
      console.log("ServiceWorker registration failed: ", err);
    });
  });
}

window.addEventListener("alpine:init", () => {
  Alpine.data("themeCtrl", () => ({
    theme: localStorage.getItem("theme") || "light",
    init() {
      document.body.setAttribute("data-theme", this.theme);
    },
    toggle() {
      this.theme = this.theme === "light" ? "dark" : "light";
      document.body.setAttribute("data-theme", this.theme);
      localStorage.setItem("theme", this.theme);
    },
  }));
});
