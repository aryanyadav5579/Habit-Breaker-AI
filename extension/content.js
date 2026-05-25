chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === "HABIT_BREAKER_WARNING") {
    showHabitBreakerWarning(message.message);
  }
});

function showHabitBreakerWarning(message) {
  const existing = document.getElementById("habit-breaker-warning");
  if (existing) {
    existing.remove();
  }

  const banner = document.createElement("div");
  banner.id = "habit-breaker-warning";
  banner.innerHTML = `
    <div class="habit-breaker-warning-icon">&#9888;</div>
    <div>
      <strong>Habit Breaker AI</strong>
      <p>${escapeHtml(message || "You are distracted from your current task.")}</p>
    </div>
    <button type="button" aria-label="Dismiss warning">x</button>
  `;

  const style = document.createElement("style");
  style.textContent = `
    #habit-breaker-warning {
      position: fixed;
      top: 16px;
      right: 16px;
      z-index: 2147483647;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      max-width: 380px;
      border: 1px solid rgba(245, 158, 11, 0.45);
      border-radius: 8px;
      background: #101c2f;
      color: #e5edf7;
      box-shadow: 0 18px 60px rgba(0, 0, 0, 0.35);
      padding: 14px;
      font-family: Inter, system-ui, sans-serif;
    }
    #habit-breaker-warning strong { display: block; font-size: 14px; margin-bottom: 4px; }
    #habit-breaker-warning p { margin: 0; font-size: 13px; line-height: 1.45; color: #cbd5e1; }
    #habit-breaker-warning button {
      margin-left: auto;
      border: 0;
      background: transparent;
      color: #94a3b8;
      cursor: pointer;
      font-size: 16px;
    }
    .habit-breaker-warning-icon {
      color: #f59e0b;
      font-size: 18px;
      line-height: 1;
    }
  `;

  document.documentElement.appendChild(style);
  document.body.appendChild(banner);
  banner.querySelector("button").addEventListener("click", () => banner.remove());
  window.setTimeout(() => banner.remove(), 9000);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

