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
let statusChart = null;

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
  updateCharts();
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

  if (typeof AOS !== "undefined") {
    AOS.refresh();
  }
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
    Swal.fire({
      icon: "warning",
      title: "Perhatian",
      text: "Tanggal dan kegiatan wajib diisi.",
      confirmButtonColor: "#6366f1",
    });
    return;
  }

  if (editingId) {
    const idx = reports.findIndex((r) => r.id === editingId);
    if (idx !== -1) {
      reports[idx] = { ...reports[idx], ...reportData, updatedAt: new Date().toISOString() };
    }
    Swal.fire({
      icon: "success",
      title: "Berhasil",
      text: "Laporan berhasil diperbarui.",
      timer: 1500,
      showConfirmButton: false,
      confirmButtonColor: "#6366f1",
    });
  } else {
    reports.push({
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      ...reportData,
      createdAt: new Date().toISOString(),
    });
    Swal.fire({
      icon: "success",
      title: "Berhasil",
      text: "Laporan berhasil disimpan.",
      timer: 1500,
      showConfirmButton: false,
      confirmButtonColor: "#6366f1",
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
  Swal.fire({
    icon: "question",
    title: "Yakin ingin menghapus?",
    text: "Laporan ini akan dihapus permanen.",
    showCancelButton: true,
    confirmButtonColor: "#dc2626",
    cancelButtonColor: "#64748b",
    confirmButtonText: "Hapus",
    cancelButtonText: "Batal",
  }).then((result) => {
    if (result.isConfirmed) {
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

      Swal.fire({
        icon: "success",
        title: "Terhapus",
        text: "Laporan berhasil dihapus.",
        timer: 1500,
        showConfirmButton: false,
        confirmButtonColor: "#dc2626",
      });
    }
  });
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
      Swal.fire({
        icon: "question",
        title: "Impor Data",
        text: `Impor ${imported.length} laporan? Data akan digabungkan dengan yang ada.`,
        showCancelButton: true,
        confirmButtonColor: "#6366f1",
        cancelButtonColor: "#64748b",
        confirmButtonText: "Impor",
        cancelButtonText: "Batal",
      }).then((result) => {
        if (result.isConfirmed) {
          reports = [...reports, ...imported].map((r, i) => ({
            ...r,
            id: r.id || `imported-${Date.now()}-${i}`,
          }));
          save();
          Swal.fire({
            icon: "success",
            title: "Berhasil",
            text: "Data berhasil diimpor.",
            timer: 1500,
            showConfirmButton: false,
            confirmButtonColor: "#6366f1",
          });
        }
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: "Gagal mengimpor file: " + err.message,
        confirmButtonColor: "#dc2626",
      });
    }
  };
  reader.readAsText(file);
}

function initCharts() {
  const ctx = document.getElementById("statusChart");
  if (!ctx) return;

  statusChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Selesai", "Proses", "Tertunda"],
      datasets: [{
        data: [0, 0, 0],
        backgroundColor: ["#16a34a", "#ca8a04", "#dc2626"],
        borderColor: ["#fff", "#fff", "#fff"],
        borderWidth: 3,
        hoverOffset: 20,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: document.body.getAttribute("data-theme") === "dark" ? "#94a3b8" : "#64748b",
            font: { family: "Inter", size: 12 },
            padding: 20,
          },
        },
        tooltip: {
          backgroundColor: document.body.getAttribute("data-theme") === "dark" ? "#1e293b" : "#fff",
          titleColor: document.body.getAttribute("data-theme") === "dark" ? "#f8fafc" : "#0f172a",
          bodyColor: document.body.getAttribute("data-theme") === "dark" ? "#94a3b8" : "#64748b",
        },
      },
      cutout: "70%",
    },
  });
}

function updateCharts() {
  if (!statusChart) return;

  const selesai = reports.filter((r) => r.status === "Selesai").length;
  const proses = reports.filter((r) => r.status === "Proses").length;
  const tertunda = reports.filter((r) => r.status === "Tertunda").length;

  statusChart.data.datasets[0].data = [selesai, proses, tertunda];
  statusChart.update();
}

function initGSAP() {
  gsap.from(".stat-card", {
    duration: 0.8,
    y: 30,
    opacity: 0,
    stagger: 0.15,
    ease: "power3.out",
  });

  gsap.from(".card-body", {
    duration: 0.8,
    y: 30,
    opacity: 0,
    stagger: 0.1,
    ease: "power3.out",
    delay: 0.2,
  });
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

document.addEventListener("DOMContentLoaded", () => {
  if (typeof AOS !== "undefined") {
    AOS.init({
      duration: 800,
      easing: "ease-out",
      once: false,
      mirror: true,
    });
  }
});
