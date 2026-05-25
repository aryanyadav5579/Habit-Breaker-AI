// Habit Breaker AI — Chrome Extension Background Service Worker
// Manifest V3 compatible, production-ready

// ============================================================
// Configuration
// ============================================================

const CONFIG = {
  // Update this to your production backend URL
  API_BASE: "https://habitbreaker.onrender.com",
  SYNC_INTERVAL_MINUTES: 5,
  DEDUP_WINDOW_MS: 15000,
  IDLE_THRESHOLD_SECONDS: 60,
  OFFLINE_QUEUE_LIMIT: 50,
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 3000
};

// ============================================================
// State
// ============================================================

let state = {
  token: null,
  settings: {
    blocking_enabled: false,
    child_safe_mode: false,
    productive_websites: [],
    distracting_websites: []
  },
  blockedWebsites: [],
  blockedApps: [],
  lastTabUrl: null,
  lastTabTime: 0,
  lastTabDomain: null,
  focusActive: false,
  offlineQueue: [],        // logs queued while offline
  idleState: "active"
};

// ============================================================
// Helpers
// ============================================================

function extractDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

function isDomainBlocked(domain) {
  if (!domain) return false;
  return state.blockedWebsites.some((b) => {
    const normalized = b.domain || b;
    return domain === normalized || domain.endsWith("." + normalized);
  });
}

function isDomainDistracting(domain) {
  if (!domain) return false;
  return (state.settings.distracting_websites || []).some(
    (d) => domain === d || domain.endsWith("." + d)
  );
}

function getAuthHeaders() {
  return {
    "Content-Type": "application/json",
    ...(state.token ? { Authorization: `Bearer ${state.token}` } : {})
  };
}

function showNotification(title, message) {
  chrome.notifications.create(`hb-${Date.now()}`, {
    type: "basic",
    iconUrl: "icons/icon128.png",
    title,
    message,
    priority: 2
  });
}

// ============================================================
// API requests with retry and offline queue
// ============================================================

async function apiRequest(path, options = {}, attempt = 1) {
  if (!state.token) return null;

  try {
    const res = await fetch(`${CONFIG.API_BASE}/api${path}`, {
      credentials: "include",
      headers: getAuthHeaders(),
      ...options
    });

    if (res.status === 401) {
      // Token expired — clear it
      state.token = null;
      await chrome.storage.local.remove("hb_token");
      showNotification("⚠ Habit Breaker", "Session expired. Please log in again.");
      return null;
    }

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch (err) {
    if (attempt < CONFIG.MAX_RETRY_ATTEMPTS) {
      await new Promise((r) => setTimeout(r, CONFIG.RETRY_DELAY_MS * attempt));
      return apiRequest(path, options, attempt + 1);
    }
    console.warn(`[HabitBreaker] Request failed after ${attempt} attempts: ${path}`, err.message);
    return null;
  }
}

// ============================================================
// Offline queue management
// ============================================================

async function flushOfflineQueue() {
  if (!state.token || state.offlineQueue.length === 0) return;

  const batch = [...state.offlineQueue];
  state.offlineQueue = [];

  for (const log of batch) {
    try {
      await apiRequest("/activity/log", {
        method: "POST",
        body: JSON.stringify(log)
      });
    } catch {
      // Re-queue on failure
      if (state.offlineQueue.length < CONFIG.OFFLINE_QUEUE_LIMIT) {
        state.offlineQueue.push(log);
      }
    }
  }

  if (batch.length > 0) {
    console.log(`[HabitBreaker] Flushed ${batch.length} queued logs`);
  }
}

async function sendActivityLog(logPayload) {
  if (!state.token) return;

  const result = await apiRequest("/activity/log", {
    method: "POST",
    body: JSON.stringify(logPayload)
  });

  if (!result && state.offlineQueue.length < CONFIG.OFFLINE_QUEUE_LIMIT) {
    // Queue for later
    state.offlineQueue.push(logPayload);
  }

  return result;
}

// ============================================================
// Settings sync
// ============================================================

async function syncSettings() {
  const data = await apiRequest("/extension/bootstrap");
  if (data) {
    state.settings = data.settings || state.settings;
    state.blockedWebsites = data.blocked_websites || [];
    state.blockedApps = data.blocked_apps || [];
    await chrome.storage.local.set({
      hb_settings: state.settings,
      hb_blocked_websites: state.blockedWebsites,
      hb_blocked_apps: state.blockedApps
    });
    console.log("[HabitBreaker] Settings synced:", {
      blocking: state.settings.blocking_enabled,
      blockedSites: state.blockedWebsites.length
    });
    // Flush any queued logs
    await flushOfflineQueue();
  }
}

// ============================================================
// Tab activity tracking
// ============================================================

async function trackTab(tab) {
  if (!tab?.url || tab.url.startsWith("chrome://") || tab.url.startsWith("chrome-extension://")) {
    return;
  }

  const domain = extractDomain(tab.url);
  if (!domain) return;

  const now = Date.now();

  // Deduplication: same domain within window
  if (domain === state.lastTabDomain && (now - state.lastTabTime) < CONFIG.DEDUP_WINDOW_MS) {
    return;
  }

  // Calculate duration on previous site
  const duration = state.lastTabTime > 0 ? Math.round((now - state.lastTabTime) / 1000) : 30;

  state.lastTabDomain = domain;
  state.lastTabTime = now;
  state.lastTabUrl = tab.url;

  // Block check
  if (state.settings.blocking_enabled && isDomainBlocked(domain)) {
    chrome.tabs.update(tab.id, {
      url: chrome.runtime.getURL(`warning.html?domain=${encodeURIComponent(domain)}`)
    });

    await sendActivityLog({
      source: "browser",
      url: tab.url,
      domain,
      app_name: "Chrome",
      window_title: tab.title || domain,
      duration_seconds: 5,
      idle_seconds: 0,
      metadata: { blocked: true, extension: true }
    });

    showNotification("🚫 Site Blocked", `${domain} is blocked during this focus period.`);
    return;
  }

  // Distraction warning (if focus active)
  if (state.focusActive && isDomainDistracting(domain)) {
    showNotification(
      "⚠ Distraction Detected",
      `${domain} may distract you from your current task.`
    );
  }

  // Log activity
  await sendActivityLog({
    source: "browser",
    url: tab.url,
    domain,
    app_name: "Chrome",
    window_title: tab.title || domain,
    duration_seconds: Math.min(duration, 3600),
    idle_seconds: state.idleState === "idle" ? CONFIG.IDLE_THRESHOLD_SECONDS : 0,
    metadata: { extension: true, idle_state: state.idleState }
  });
}

// ============================================================
// Startup / Restore
// ============================================================

async function restoreState() {
  const stored = await chrome.storage.local.get([
    "hb_token",
    "hb_settings",
    "hb_blocked_websites",
    "hb_blocked_apps",
    "hb_offline_queue"
  ]);

  state.token = stored.hb_token || null;
  state.settings = stored.hb_settings || state.settings;
  state.blockedWebsites = stored.hb_blocked_websites || [];
  state.blockedApps = stored.hb_blocked_apps || [];
  state.offlineQueue = stored.hb_offline_queue || [];

  if (state.token) {
    await syncSettings();
  }
}

// ============================================================
// Event listeners
// ============================================================

// Tab activated (user switches tab)
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    await trackTab(tab);
  } catch {}
});

// Tab updated (URL changes in the same tab)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.active) {
    await trackTab(tab);
  }
});

// Idle state changes
chrome.idle.setDetectionInterval(CONFIG.IDLE_THRESHOLD_SECONDS);
chrome.idle.onStateChanged.addListener((newState) => {
  state.idleState = newState;
  console.log("[HabitBreaker] Idle state:", newState);
});

// Alarm for periodic sync
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "hb_sync") {
    syncSettings();
  }
});

// Message from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    switch (message.type) {
      case "SET_TOKEN":
        state.token = message.token;
        await chrome.storage.local.set({ hb_token: message.token });
        await syncSettings();
        sendResponse({ ok: true });
        break;

      case "CLEAR_TOKEN":
        state.token = null;
        state.settings = {};
        state.blockedWebsites = [];
        state.blockedApps = [];
        await chrome.storage.local.remove(["hb_token", "hb_settings", "hb_blocked_websites", "hb_blocked_apps"]);
        sendResponse({ ok: true });
        break;

      case "GET_STATE":
        sendResponse({
          token: !!state.token,
          settings: state.settings,
          blockedCount: state.blockedWebsites.length,
          queuedLogs: state.offlineQueue.length,
          lastDomain: state.lastTabDomain,
          idleState: state.idleState,
          focusActive: state.focusActive
        });
        break;

      case "SET_FOCUS":
        state.focusActive = message.active;
        sendResponse({ ok: true });
        break;

      case "SYNC_NOW":
        await syncSettings();
        sendResponse({ ok: true });
        break;

      case "FLUSH_QUEUE":
        await flushOfflineQueue();
        sendResponse({ flushed: true, remaining: state.offlineQueue.length });
        break;

      default:
        sendResponse({ error: "Unknown message type" });
    }
  })();
  return true; // Keep async messaging open
});

// ============================================================
// Extension install / update
// ============================================================

chrome.runtime.onInstalled.addListener(async () => {
  await restoreState();
  chrome.alarms.create("hb_sync", {
    periodInMinutes: CONFIG.SYNC_INTERVAL_MINUTES
  });
  console.log("[HabitBreaker] Extension installed/updated. Background worker running.");
});

// ============================================================
// Startup (service worker restart)
// ============================================================

chrome.runtime.onStartup.addListener(async () => {
  await restoreState();
  chrome.alarms.create("hb_sync", {
    periodInMinutes: CONFIG.SYNC_INTERVAL_MINUTES
  });
  console.log("[HabitBreaker] Service worker restarted.");
});
