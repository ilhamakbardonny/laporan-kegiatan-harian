const STORAGE_KEY = "laporan_kegiatan_harian";
const PROFILE_KEY = "profil_laporan";

const form = document.getElementById("reportForm");
const editIdInput = document.getElementById("editId");
const dateInput = document.getElementById("date");
const activityInput = document.getElementById("activity");
const statusSelect = document.getElementById("status");
const submitBtn = document.getElementById("submitBtn");
const cancelEditBtn = document.getElementById("cancelEdit");
const toggleFormBtn = document.getElementById("toggleForm");
const tbody = document.querySelector("#reportList table tbody");
const emptyState = document.getElementById("emptyState");
const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");
const printBtn = document.getElementById("printBtn");
const printArea = document.getElementById("printArea");
const printPreview = document.getElementById("printPreview");

const searchInput = document.getElementById("searchInput");
const filterStatus = document.getElementById("filterStatus");
const filterDate = document.getElementById("filterDate");
const filterMonth = document.getElementById("filterMonth");

const exportBtn = document.getElementById("exportBtn");
const importBtn = document.getElementById("importBtn");
const importFile = document.getElementById("importFile");


const photoInput = document.getElementById("photo");
const photoPreview = document.getElementById("photoPreview");

const profileNama = document.getElementById("profileNama");
const profilePosisi = document.getElementById("profilePosisi");
const profileInstansi = document.getElementById("profileInstansi");
const saveProfileBtn = document.getElementById("saveProfile");

let reports = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let editingId = null;
let selectedPhoto = null;

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
  if (themeIcon) themeIcon.textContent = theme === "dark" ? "☀️" : "🌙";
}

const savedTheme = localStorage.getItem("theme") || "light";
applyTheme(savedTheme);

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const current = document.body.getAttribute("data-theme") || "light";
    applyTheme(current === "dark" ? "light" : "dark");
  });
}

function updatePhotoPreview() {
  if (photoPreview) {
    photoPreview.style.display = selectedPhoto ? "" : "none";
  }
}

function loadProfile() {
  try {
    const p = JSON.parse(localStorage.getItem(PROFILE_KEY)) || {};
    if (profileNama) profileNama.value = p.nama || "";
    if (profilePosisi) profilePosisi.value = p.posisi || "";
    if (profileInstansi) profileInstansi.value = p.instansi || "";
  } catch (e) { /* abaikan */ }
}

if (saveProfileBtn) {
  saveProfileBtn.addEventListener("click", () => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify({
      nama: profileNama ? profileNama.value.trim() : "",
      posisi: profilePosisi ? profilePosisi.value.trim() : "",
      instansi: profileInstansi ? profileInstansi.value.trim() : "",
    }));
    updatePrintPreview();
    showSaved();
  });
}

function setToday() {
  const today = new Date().toISOString().split("T")[0];
  dateInput.value = today;
}

function syncDateWithMonthFilter() {
  const m = filterMonth ? filterMonth.value : "";
  if (m) {
    const [y, mo] = m.split("-").map(Number);
    const lastDay = new Date(y, mo, 0).getDate();
    dateInput.min = `${m}-01`;
    dateInput.max = `${m}-${String(lastDay).padStart(2, "0")}`;
    if (!dateInput.value || dateInput.value.slice(0, 7) !== m) {
      dateInput.value = `${m}-01`;
    }
  } else {
    dateInput.removeAttribute("min");
    dateInput.removeAttribute("max");
    setToday();
  }
}
function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  renderReports();
  showSaved();
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text === null || text === undefined ? "" : text;
  return div.innerHTML.replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function getStatusColorClass(status) {
  return `status-${status}`;
}

function getFilteredReports() {
  const keyword = searchInput.value.toLowerCase().trim();
  const statusFilter = filterStatus.value;
  const dateFilter = filterDate.value;
  const monthFilter = filterMonth ? filterMonth.value : "";

  const filtered = reports.filter((r) => {
    const matchSearch =
      (r.activity || "").toLowerCase().includes(keyword) ||
      (r.description || "").toLowerCase().includes(keyword);
    const matchStatus = statusFilter ? r.status === statusFilter : true;
    const matchDate = dateFilter ? r.date === dateFilter : true;
    const matchMonth = monthFilter ? (r.date || "").slice(0, 7) === monthFilter : true;
    return matchSearch && matchStatus && matchDate && matchMonth;
  });

  return [...filtered].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
}

function renderReports() {
  updatePrintPreview();
  tbody.innerHTML = "";

  const sorted = getFilteredReports();

  if (sorted.length === 0) {
    emptyState.style.display = "block";
    return;
  }

  emptyState.style.display = "none";

  sorted.forEach((report, index) => {
    const tr = document.createElement("tr");
    tr.className = "row-added";
    tr.style.animationDelay = `${index * 0.05}s`;
    const docCell = report.photo
      ? `<img src="${escapeHtml(report.photo)}" alt="Dokumentasi" style="width:40px;height:40px;object-fit:cover;border-radius:6px;" />`
      : "-";
    tr.innerHTML = `
      <td>${escapeHtml(report.date)}</td>
      <td><strong>${escapeHtml(report.activity)}</strong></td>
      <td>${docCell}</td>
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

function resetForm() {
  form.reset();
  editIdInput.value = "";
  editingId = null;
  selectedPhoto = null;
  photoPreview.src = "";
  updatePhotoPreview();
  submitBtn.textContent = "Simpan";
  cancelEditBtn.style.display = "none";
  toggleFormBtn.style.display = "none";
  syncDateWithMonthFilter();
}

function addOrUpdateReport(e) {
  e.preventDefault();

  const reportData = {
    date: dateInput.value,
    activity: activityInput.value.trim(),
    photo: selectedPhoto || "",
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
  selectedPhoto = report.photo || "";
  photoPreview.src = selectedPhoto ? selectedPhoto : "";
  updatePhotoPreview();
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

function initGSAP() {
  if (typeof gsap === "undefined") return;

  gsap.from(".card-body", {
    duration: 0.8,
    y: 30,
    opacity: 0,
    stagger: 0.1,
    ease: "power3.out",
    delay: 0.2,
  });
}

function formatDateID(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

function formatMonthYearID(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d)) return "";
  return d.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
}

function renderPrintDoc() {
  const data = getFilteredReports(); // terbaru → terlama (sama seperti tabel aplikasi)

  const groups = {};
  data.forEach((r) => {
    const key = r.date || "-";
    if (!groups[key]) groups[key] = [];
    groups[key].push(r);
  });
  const dates = Object.keys(groups).sort();

  let p = {};
  try { p = JSON.parse(localStorage.getItem(PROFILE_KEY)) || {}; } catch (e) { /* abaikan */ }

  let periode = formatMonthYearID(new Date().toISOString().slice(0, 10));
  let tahun = String(new Date().getFullYear());
  if (filterMonth && filterMonth.value) {
    periode = formatMonthYearID(filterMonth.value + "-01");
  } else if (dates.length) {
    const min = dates[0];
    const max = dates[dates.length - 1];
    periode = min === max ? formatMonthYearID(min) : `${formatDateID(min)} – ${formatDateID(max)}`;
    tahun = max.slice(0, 4);
  }

  let kegiatanNo = 0;
  const rows = dates.map((date, i) => {
    const items = groups[date];
    const kegiatan = items
      .map((r) => `${++kegiatanNo}. ${escapeHtml(r.activity || "")}`)
      .join("<br>");
    const docs = items
      .map((r) => r.photo
        ? `<img src="${escapeHtml(r.photo)}" class="print-doc-img" alt="Dokumentasi" />`
        : "")
      .filter(Boolean)
      .join(" ");
    return `
      <tr>
        <td class="c">${i + 1}</td>
        <td>${escapeHtml(formatDateID(date))}</td>
        <td>${kegiatan}</td>
        <td class="c">${docs || "-"}</td>
      </tr>`;
  }).join("");

  return `
    <div class="print-doc">
      <div class="print-kop">
        <p>KEMENTERIAN PEKERJAAN UMUM</p>
        <p>DIREKTORAT JENDERAL CIPTA KARYA</p>
        <p>BALAI PENATAAN BANGUNAN PRASARANA DAN KAWASAN BENGKULU</p>
        <p class="print-kop-addr">Gedung PIP2B Jalan Pangeran Natadirja KM 7 Bengkulu, 38114 Tel/Fax : (0736) 28294</p>
      </div>
      <h2 class="print-title">LEMBAR KEGIATAN</h2>
      <table class="print-info">
        <tr><td>Nama</td><td>:</td><td>${escapeHtml(p.nama || "..............................")}</td></tr>
        <tr><td>Posisi</td><td>:</td><td>${escapeHtml(p.posisi || "..............................")}</td></tr>
        <tr><td>Instansi</td><td>:</td><td>${escapeHtml(p.instansi || "..............................")}</td></tr>
        <tr><td>Bulan</td><td>:</td><td>${escapeHtml(periode)}</td></tr>
        <tr><td>Tahun</td><td>:</td><td>${escapeHtml(tahun)}</td></tr>
      </table>
      <table class="print-table">
        <thead>
          <tr>
            <th style="width:6%">NO</th>
            <th style="width:16%">TANGGAL</th>
            <th>KEGIATAN YANG DILAKUKAN</th>
            <th style="width:22%">DOKUMENTASI</th>
          </tr>
        </thead>
        <tbody>${rows || `<tr><td colspan="4" class="c">Tidak ada data.</td></tr>`}</tbody>
      </table>
      <div class="print-sign">
        <p>Bengkulu, ${escapeHtml(formatDateID(new Date().toISOString().slice(0, 10)))}</p>
        <p>Pelaksana Tugas,</p>
        <p class="sign-name">${escapeHtml(p.nama || "..............................")}</p>
        <p>${escapeHtml(p.posisi || "")}</p>
      </div>
    </div>`;
}

function updatePrintPreview() {
  const html = renderPrintDoc();
  if (printArea) printArea.innerHTML = html;
  if (printPreview) printPreview.innerHTML = html;
}

form.addEventListener("submit", addOrUpdateReport);
cancelEditBtn.addEventListener("click", resetForm);
toggleFormBtn.addEventListener("click", resetForm);
searchInput.addEventListener("input", renderReports);
filterStatus.addEventListener("change", renderReports);
filterDate.addEventListener("change", renderReports);
if (filterMonth) {
  filterMonth.addEventListener("change", () => {
    syncDateWithMonthFilter();
    renderReports();
    });
}

if (printBtn) {
  printBtn.addEventListener("click", () => {
    updatePrintPreview();
    window.print();
  });
}

photoInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    selectedPhoto = ev.target.result;
    photoPreview.src = selectedPhoto;
    updatePhotoPreview();
  };
  reader.readAsDataURL(file);
});

exportBtn.addEventListener("click", exportData);
importBtn.addEventListener("click", () => importFile.click());
importFile.addEventListener("change", (e) => {
  if (e.target.files.length) importData(e.target.files[0]);
  e.target.value = "";
});

loadProfile();
setToday();
syncDateWithMonthFilter();
updatePhotoPreview();
renderReports();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch((err) => {
      console.log("ServiceWorker registration failed: ", err);
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initGSAP();
  if (typeof AOS !== "undefined") {
    AOS.init({
      duration: 800,
      easing: "ease-out",
      once: true,
      mirror: false,
    });
  }
});
