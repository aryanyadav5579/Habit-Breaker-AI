// Habit Breaker AI — Popup Script

const els = {
  apiBaseInput: document.getElementById("apiBaseUrl"),
  emailInput: document.getElementById("email"),
  passwordInput: document.getElementById("password"),
  statusEl: document.getElementById("status"),
  policyEl: document.getElementById("policy"),
  loginSection: document.getElementById("loginSection"),
  authSection: document.getElementById("authSection"),
  statsBar: document.getElementById("statsBar"),
  lastDomainEl: document.getElementById("lastDomain"),
  queuedLogsEl: document.getElementById("queuedLogs"),
  idleStateEl: document.getElementById("idleState"),
  messageEl: document.getElementById("message"),
  focusBtn: document.getElementById("focus")
};

let focusActive = false;

// Event bindings
document.getElementById("login").addEventListener("click", login);
document.getElementById("sync")?.addEventListener("click", syncNow);
document.getElementById("logout")?.addEventListener("click", logoutUser);
document.getElementById("track")?.addEventListener("click", trackActiveTab);
els.focusBtn?.addEventListener("click", toggleFocus);

init();

async function init() {
  const stored = await chrome.storage.local.get(["apiBaseUrl", "hb_token", "hb_settings"]);
  if (els.apiBaseInput) els.apiBaseInput.value = stored.apiBaseUrl || "https://habitbreaker.onrender.com";
  renderPolicy(stored.hb_settings, null);

  if (stored.hb_token) {
    showAuthSection();
    await refreshStats();
  } else {
    showLoginSection();
    setStatus("Login to connect");
  }
}

async function login() {
  const apiBaseUrl = cleanBaseUrl(els.apiBaseInput?.value);
  setStatus("Logging in...");
  try {
    const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: els.emailInput.value,
        password: els.passwordInput.value
      }),
      credentials: "include"
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: "Login failed" }));
      throw new Error(err.detail || "Login failed");
    }
    const data = await response.json();
    await chrome.storage.local.set({ apiBaseUrl, hb_token: data.access_token });

    // Send token to background
    await chrome.runtime.sendMessage({ type: "SET_TOKEN", token: data.access_token });

    setStatus(`Connected as ${data.user.full_name}`);
    showAuthSection();
    await refreshStats();
  } catch (error) {
    setStatus("❌ " + error.message);
  }
}

async function logoutUser() {
  await chrome.runtime.sendMessage({ type: "CLEAR_TOKEN" });
  showLoginSection();
  setStatus("Logged out");
  els.policyEl.textContent = "Login to connect and sync.";
}

async function syncNow() {
  setStatus("Syncing...");
  const res = await chrome.runtime.sendMessage({ type: "SYNC_NOW" });
  if (res?.ok) {
    const stored = await chrome.storage.local.get(["hb_settings"]);
    renderPolicy(stored.hb_settings, new Date().toLocaleTimeString());
    setStatus("✓ Synced at " + new Date().toLocaleTimeString());
    await refreshStats();
  } else {
    setStatus("Sync failed");
  }
}

async function trackActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url || tab.url.startsWith("chrome://")) {
    showMessage("No trackable tab active");
    return;
  }
  showMessage(`Tracked: ${new URL(tab.url).hostname}`);
}

async function toggleFocus() {
  focusActive = !focusActive;
  await chrome.runtime.sendMessage({ type: "SET_FOCUS", active: focusActive });
  els.focusBtn.textContent = focusActive ? "⏹ Stop focus mode" : "▶ Start 50m focus";
  showMessage(focusActive ? "Focus mode activated!" : "Focus mode stopped.");
}

async function refreshStats() {
  const state = await chrome.runtime.sendMessage({ type: "GET_STATE" });
  if (!state) return;

  focusActive = state.focusActive || false;
  if (els.focusBtn) {
    els.focusBtn.textContent = focusActive ? "⏹ Stop focus mode" : "▶ Start 50m focus";
  }

  if (els.statsBar) els.statsBar.style.display = "flex";
  if (els.lastDomainEl) els.lastDomainEl.textContent = state.lastDomain || "—";
  if (els.queuedLogsEl) els.queuedLogsEl.textContent = state.queuedLogs || 0;
  if (els.idleStateEl) els.idleStateEl.textContent = state.idleState || "active";
}

function renderPolicy(settings, lastSyncAt) {
  if (!settings) {
    els.policyEl.textContent = "Login and sync to receive site lists and blocking rules.";
    return;
  }
  const mode = settings.blocking_enabled ? "🚫 Blocking active" :
    settings.child_safe_mode ? "🛡 Child-safe mode" : "⚠ Warnings only";
  const sites = settings.distracting_websites?.length || 0;
  const synced = lastSyncAt ? `Last sync: ${lastSyncAt}` : "Ready";
  els.policyEl.textContent = `${mode} · ${sites} distracting sites · ${synced}`;
}

function showLoginSection() {
  if (els.loginSection) els.loginSection.style.display = "block";
  if (els.authSection) els.authSection.style.display = "none";
  if (els.statsBar) els.statsBar.style.display = "none";
}

function showAuthSection() {
  if (els.loginSection) els.loginSection.style.display = "none";
  if (els.authSection) els.authSection.style.display = "block";
}

function cleanBaseUrl(value) {
  return (value || "https://habitbreaker.onrender.com").replace(/\/+$/, "");
}

function setStatus(message) {
  if (els.statusEl) els.statusEl.textContent = message;
}

function showMessage(text, duration = 3000) {
  if (!els.messageEl) return;
  els.messageEl.textContent = text;
  els.messageEl.style.display = "block";
  setTimeout(() => { els.messageEl.style.display = "none"; }, duration);
}
