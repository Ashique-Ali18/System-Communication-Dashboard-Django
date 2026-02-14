/* =========================
   CSRF Helpers (Django)
========================= */
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

const csrftoken = () => getCookie("csrftoken");

/* =========================
   Fetch / Post Helpers
========================= */
async function fetchJSON(url) {
  const res = await fetch(url, { credentials: "same-origin" });
  if (!res.ok) throw new Error("Failed to load: " + url);
  return await res.json();
}

async function postJSON(url, data) {
  const res = await fetch(url, {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": csrftoken(),
    },
    body: JSON.stringify(data),
  });

  const out = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(out.error || "Request failed");
  return out;
}

function hideModal(modalId) {
  const el = document.getElementById(modalId);
  if (!el) return;
  bootstrap.Modal.getOrCreateInstance(el).hide();
}

/* =========================
   Premium Timestamp Format
========================= */
function formatDate(ts) {
  const d = new Date(ts);

  const datePart = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);

  const timePart = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(d);

  return `${datePart} — ${timePart}`;
}

/* =========================
   Toast
========================= */
const toastEl = document.getElementById("appToast");
const toastText = document.getElementById("toastText");
const toast = toastEl ? bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 2500 }) : null;

function showToast(msg, type = "success") {
  if (!toastEl || !toastText || !toast) {
    alert(msg);
    return;
  }
  toastEl.classList.remove("text-bg-success", "text-bg-danger");
  toastEl.classList.add(type === "danger" ? "text-bg-danger" : "text-bg-success");
  toastText.textContent = msg;
  toast.show();
}

/* =========================
   Cache + Search Filter
========================= */
let cache = { emails: [], sms: [], wa: [] };

function q(id) {
  return (document.getElementById(id)?.value || "").trim().toLowerCase();
}

function applyFilters() {
  const emailQuery = q("searchEmail");
  const smsQuery = q("searchSms");
  const waQuery = q("searchWa");

  const filteredEmails = cache.emails.filter((r) =>
    (r.email_to || "").toLowerCase().includes(emailQuery)
  );

  const filteredSms = cache.sms.filter((r) => {
    const mob = (r.mobile_number || "").toLowerCase();
    const msg = (r.message || "").toLowerCase();
    return mob.includes(smsQuery) || msg.includes(smsQuery);
  });

  const filteredWa = cache.wa.filter((r) => {
    const mob = (r.mobile_number || "").toLowerCase();
    const msg = (r.message || "").toLowerCase();
    return mob.includes(waQuery) || msg.includes(waQuery);
  });

  renderEmail(filteredEmails);
  renderMessages(filteredSms, "smsBody", "sms");
  renderMessages(filteredWa, "waBody", "whatsapp");
}

/* =========================
   Delete (Confirm Modal)
========================= */
let pendingDelete = null; // { type, id, label }

function openDeleteModal(type, id, label) {
  pendingDelete = { type, id, label };

  const info = document.getElementById("deleteInfo");
  if (info) info.textContent = label;

  const modalEl = document.getElementById("modalDelete");
  if (!modalEl) return;
  bootstrap.Modal.getOrCreateInstance(modalEl).show();
}

/* =========================
   Render Tables
========================= */
function renderEmail(rows) {
  const body = document.getElementById("emailBody");
  if (!body) return;

  body.innerHTML = "";

  if (!rows.length) {
    body.innerHTML = `<tr><td colspan="4" class="text-muted">No emails yet.</td></tr>`;
    return;
  }

  rows.forEach((r, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td></td>
      <td>${formatDate(r.created_at)}</td>
      <td>
        <button class="btn btn-outline-danger btn-sm btn-del"
          data-type="email"
          data-id="${r.id}"
          data-label="Email to: ${String(r.email_to || "").replaceAll('"', "")}"
        ><i class="bi bi-trash"></i> Delete</button>
      </td>
    `;
    tr.children[1].textContent = r.email_to;
    body.appendChild(tr);
  });
}

function renderMessages(rows, tbodyId, type) {
  const body = document.getElementById(tbodyId);
  if (!body) return;

  body.innerHTML = "";

  if (!rows.length) {
    body.innerHTML = `<tr><td colspan="5" class="text-muted">No data yet.</td></tr>`;
    return;
  }

  rows.forEach((r, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td></td>
      <td></td>
      <td>${formatDate(r.created_at)}</td>
      <td>
        <button class="btn btn-outline-danger btn-sm btn-del"
          data-type="${type}"
          data-id="${r.id}"
          data-label="Mobile: ${String(r.mobile_number || "").replaceAll('"', "")}"
        ><i class="bi bi-trash"></i> Delete</button>
      </td>
    `;
    tr.children[1].textContent = r.mobile_number;
    tr.children[2].textContent = r.message;
    body.appendChild(tr);
  });
}

/* =========================
   Counts
========================= */
function updateCounts(stats) {
  const ce = document.getElementById("countEmails");
  const cs = document.getElementById("countSms");
  const cw = document.getElementById("countWhatsapp");

  if (ce) ce.textContent = stats.emails;
  if (cs) cs.textContent = stats.sms;
  if (cw) cw.textContent = stats.whatsapp;
}

/* =========================
   Load All
========================= */
async function loadAll() {
  try {
    const [emails, sms, wa, stats] = await Promise.all([
      fetchJSON("/api/email/"),
      fetchJSON("/api/sms/"),
      fetchJSON("/api/whatsapp/"),
      fetchJSON("/api/stats/"),
    ]);

    cache.emails = emails;
    cache.sms = sms;
    cache.wa = wa;

    updateCounts(stats);
    applyFilters();
  } catch (err) {
    console.error(err);
    showToast("Failed to load data.", "danger");
  }
}

/* =========================
   Form Submits
========================= */
document.getElementById("formEmail")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);

  try {
    await postJSON("/api/email/", { email_to: fd.get("email_to") });
    e.target.reset();
    hideModal("modalEmail");
    await loadAll();
    showToast("Email log saved.");
  } catch (err) {
    showToast(err.message || "Failed to save email.", "danger");
  }
});

document.getElementById("formSms")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);

  try {
    await postJSON("/api/sms/", {
      mobile_number: fd.get("mobile_number"),
      message: fd.get("message"),
    });
    e.target.reset();
    hideModal("modalSms");
    await loadAll();
    showToast("SMS log saved.");
  } catch (err) {
    showToast(err.message || "Failed to save SMS.", "danger");
  }
});

document.getElementById("formWa")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);

  try {
    await postJSON("/api/whatsapp/", {
      mobile_number: fd.get("mobile_number"),
      message: fd.get("message"),
    });
    e.target.reset();
    hideModal("modalWa");
    await loadAll();
    showToast("WhatsApp log saved.");
  } catch (err) {
    showToast(err.message || "Failed to save WhatsApp.", "danger");
  }
});

/* =========================
   Search listeners
========================= */
document.getElementById("searchEmail")?.addEventListener("input", applyFilters);
document.getElementById("searchSms")?.addEventListener("input", applyFilters);
document.getElementById("searchWa")?.addEventListener("input", applyFilters);

/* =========================
   Delete listeners
========================= */
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".btn-del");
  if (!btn) return;

  openDeleteModal(btn.dataset.type, Number(btn.dataset.id), btn.dataset.label || "");
});

document.getElementById("btnConfirmDelete")?.addEventListener("click", async () => {
  if (!pendingDelete) return;

  try {
    await postJSON("/api/delete/", { type: pendingDelete.type, id: pendingDelete.id });
    hideModal("modalDelete");
    pendingDelete = null;

    await loadAll();
    showToast("Deleted successfully.");
  } catch (err) {
    showToast(err.message || "Delete failed.", "danger");
  }
});

/* =========================
   Export CSV (client-side)
========================= */
function downloadCSV(filename, rows, headers) {
  const escape = (v) => `"${String(v ?? "").replaceAll('"', '""')}"`;

  const csv = [
    headers.map(escape).join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}

document.getElementById("exportEmail")?.addEventListener("click", () => {
  downloadCSV("emails.csv", cache.emails, ["id", "email_to", "created_at"]);
});

document.getElementById("exportSms")?.addEventListener("click", () => {
  downloadCSV("sms.csv", cache.sms, ["id", "mobile_number", "message", "created_at"]);
});

document.getElementById("exportWa")?.addEventListener("click", () => {
  downloadCSV("whatsapp.csv", cache.wa, ["id", "mobile_number", "message", "created_at"]);
});

/* =========================
   Start
========================= */
loadAll();
/* =========================
   Theme Toggle (Lux <-> Darkly)
========================= */
const themeLink = document.getElementById("themeStylesheet");
const btnTheme = document.getElementById("btnTheme");

const THEMES = {
  light: "https://cdn.jsdelivr.net/npm/bootswatch@5.3.3/dist/lux/bootstrap.min.css",
  dark: "https://cdn.jsdelivr.net/npm/bootswatch@5.3.3/dist/darkly/bootstrap.min.css",
};

function applyTheme(mode) {
  if (!themeLink) return;

  themeLink.href = THEMES[mode] || THEMES.light;
  localStorage.setItem("theme", mode);

  // also set attribute so your CSS can change background if needed
  document.body.dataset.theme = mode;

  if (btnTheme) {
    btnTheme.innerHTML =
      mode === "dark"
        ? `<i class="bi bi-sun"></i> Light`
        : `<i class="bi bi-moon-stars"></i> Dark`;
  }
}

btnTheme?.addEventListener("click", () => {
  const current = localStorage.getItem("theme") || "light";
  applyTheme(current === "dark" ? "light" : "dark");
});

// run on page load
applyTheme(localStorage.getItem("theme") || "light");