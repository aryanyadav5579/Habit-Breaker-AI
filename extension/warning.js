const params = new URLSearchParams(window.location.search);
document.getElementById("domain").textContent = params.get("domain") || "blocked site";
document.getElementById("message").textContent =
  params.get("message") || "Habit Breaker AI blocked this website during a protected focus or study window.";

document.getElementById("back").addEventListener("click", () => {
  window.history.length > 1 ? window.history.back() : window.location.replace("about:blank");
});

document.getElementById("close").addEventListener("click", () => {
  chrome.tabs.getCurrent((tab) => {
    if (tab?.id) chrome.tabs.remove(tab.id);
  });
});

