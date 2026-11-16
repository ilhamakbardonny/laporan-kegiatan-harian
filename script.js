const STORAGE_KEY = "laporan_kegiatan_harian";

const form = document.getElementById("reportForm");
const dateInput = document.getElementById("date");
const activityInput = document.getElementById("activity");
const descriptionInput = document.getElementById("description");
const statusSelect = document.getElementById("status");
const tbody = document.querySelector("#reportList table tbody");

let reports = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

function setToday() {
  const today = new Date().toISOString().split("T")[0];
  dateInput.value = today;
}

function renderReports() {
  tbody.innerHTML = "";

  if (reports.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-state">Belum ada laporan. Silakan tambahkan laporan baru di atas.</td>
      </tr>
    `;
    return;
  }

  const sorted = [...reports].sort((a, b) => new Date(b.date) - new Date(a.date));

  sorted.forEach((report) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${report.date}</td>
      <td>${escapeHtml(report.activity)}</td>
      <td>${escapeHtml(report.description || "-")}</td>
      <td><span class="status-badge status-${report.status}">${report.status}</span></td>
      <td>
        <button class="btn btn-outline" onclick="deleteReport('${report.id}')">Hapus</button>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  renderReports();
}

function addReport(e) {
  e.preventDefault();

  const report = {
    id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
    date: dateInput.value,
    activity: activityInput.value.trim(),
    description: descriptionInput.value.trim(),
    status: statusSelect.value,
    createdAt: new Date().toISOString(),
  };

  reports.push(report);
  save();

  form.reset();
  setToday();
}

window.deleteReport = function (id) {
  if (!confirm("Yakin ingin menghapus laporan ini?")) return;

  reports = reports.filter((r) => r.id !== id);
  save();
};

form.addEventListener("submit", addReport);

setToday();
renderReports();
