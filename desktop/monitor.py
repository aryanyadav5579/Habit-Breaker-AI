"""
Habit Breaker AI — Desktop Background Monitor
Windows-first implementation (scalable to macOS/Linux).

Features:
- Active window tracking (win32gui / win32process)
- Idle time detection (GetLastInputInfo)
- App switch frequency monitoring
- Blocked app enforcement (kill process or popup warning)
- Bedtime lock enforcement
- Daily summary log file
- Offline queue with flush-on-reconnect
- --dry-run mode (observe without blocking)
- Graceful shutdown on SIGINT / SIGTERM
- Per-user policy sync every 5 minutes
"""

import argparse
import json
import logging
import os
import signal
import subprocess
import sys
import threading
import time
import winsound
from collections import deque
from datetime import datetime, timedelta
from pathlib import Path

import psutil
import requests

# ─────────────────────────────────────────────────────────────────
# Optional Windows-specific imports
# ─────────────────────────────────────────────────────────────────

try:
    import ctypes
    import ctypes.wintypes
    import win32gui
    import win32process
    HAS_WIN32 = True
except ImportError:
    HAS_WIN32 = False
    print("[Monitor] win32gui/win32process not available — using psutil fallback")


# ─────────────────────────────────────────────────────────────────
# Configuration
# ─────────────────────────────────────────────────────────────────

API_BASE = os.environ.get("HABIT_BREAKER_API", "https://habitbreaker.onrender.com")
TOKEN_FILE = Path.home() / ".habitbreaker" / "token.json"
LOG_DIR = Path.home() / ".habitbreaker" / "logs"
POLL_INTERVAL = int(os.environ.get("POLL_INTERVAL", "10"))          # seconds
SYNC_INTERVAL = int(os.environ.get("SYNC_INTERVAL", "300"))         # 5 minutes
IDLE_THRESHOLD = int(os.environ.get("IDLE_THRESHOLD", "60"))        # seconds
OFFLINE_QUEUE_LIMIT = 200


# ─────────────────────────────────────────────────────────────────
# Logging setup
# ─────────────────────────────────────────────────────────────────

LOG_DIR.mkdir(parents=True, exist_ok=True)
log_filename = LOG_DIR / f"monitor_{datetime.now().strftime('%Y-%m-%d')}.log"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(log_filename, encoding="utf-8"),
        logging.StreamHandler(sys.stdout)
    ]
)
log = logging.getLogger("HabitBreaker")


# ─────────────────────────────────────────────────────────────────
# State
# ─────────────────────────────────────────────────────────────────

state = {
    "token": None,
    "settings": {},
    "blocked_apps": [],
    "blocked_websites": [],
    "last_window": None,
    "last_switch_time": time.time(),
    "switch_count": 0,
    "offline_queue": deque(maxlen=OFFLINE_QUEUE_LIMIT),
    "last_sync": 0,
    "running": True,
    "dry_run": False,
    "daily_stats": {
        "productive_minutes": 0,
        "distracting_minutes": 0,
        "idle_minutes": 0,
        "blocked_apps_triggered": 0,
        "date": datetime.now().strftime("%Y-%m-%d")
    }
}


# ─────────────────────────────────────────────────────────────────
# Auth
# ─────────────────────────────────────────────────────────────────

def load_token():
    """Load token from ~/.habitbreaker/token.json"""
    TOKEN_FILE.parent.mkdir(parents=True, exist_ok=True)
    if TOKEN_FILE.exists():
        try:
            data = json.loads(TOKEN_FILE.read_text())
            state["token"] = data.get("access_token")
            log.info("Token loaded from %s", TOKEN_FILE)
        except Exception as exc:
            log.warning("Could not load token: %s", exc)


def save_token(token: str):
    TOKEN_FILE.parent.mkdir(parents=True, exist_ok=True)
    TOKEN_FILE.write_text(json.dumps({"access_token": token}))
    state["token"] = token


def login(email: str, password: str) -> bool:
    try:
        res = requests.post(
            f"{API_BASE}/api/auth/login",
            json={"email": email, "password": password},
            timeout=15
        )
        res.raise_for_status()
        data = res.json()
        save_token(data["access_token"])
        log.info("Logged in as %s", data["user"]["full_name"])
        return True
    except Exception as exc:
        log.error("Login failed: %s", exc)
        return False


# ─────────────────────────────────────────────────────────────────
# API helpers
# ─────────────────────────────────────────────────────────────────

def auth_headers():
    return {
        "Authorization": f"Bearer {state['token']}",
        "Content-Type": "application/json"
    } if state["token"] else {}


def api_post(path: str, payload: dict, attempt: int = 1) -> bool:
    if not state["token"]:
        return False
    try:
        res = requests.post(
            f"{API_BASE}/api{path}",
            json=payload,
            headers=auth_headers(),
            timeout=15
        )
        if res.status_code == 401:
            log.warning("Token expired — re-authentication required")
            state["token"] = None
            return False
        res.raise_for_status()
        return True
    except requests.Timeout:
        log.debug("Request timeout for %s", path)
        return False
    except requests.ConnectionError:
        log.debug("Offline — queuing log")
        return False
    except Exception as exc:
        if attempt < 3:
            time.sleep(2 * attempt)
            return api_post(path, payload, attempt + 1)
        log.debug("API error [%s]: %s", path, exc)
        return False


def send_activity(payload: dict):
    if state["dry_run"]:
        log.info("[DRY RUN] Would log: %s", json.dumps(payload, default=str)[:120])
        return

    success = api_post("/activity/log", payload)
    if not success:
        state["offline_queue"].append(payload)


def flush_offline_queue():
    if not state["token"] or not state["offline_queue"]:
        return
    flushed = 0
    while state["offline_queue"]:
        payload = state["offline_queue"].popleft()
        if not api_post("/activity/log", payload):
            state["offline_queue"].appendleft(payload)
            break
        flushed += 1
    if flushed:
        log.info("Flushed %d queued activity logs", flushed)


# ─────────────────────────────────────────────────────────────────
# Settings sync
# ─────────────────────────────────────────────────────────────────

def sync_settings():
    if not state["token"]:
        return
    try:
        res = requests.get(
            f"{API_BASE}/api/extension/bootstrap",
            headers=auth_headers(),
            timeout=15
        )
        if res.status_code == 401:
            log.warning("Token expired during sync")
            return
        res.raise_for_status()
        data = res.json()
        state["settings"] = data.get("settings", {})
        state["blocked_apps"] = data.get("blocked_apps", [])
        state["blocked_websites"] = data.get("blocked_websites", [])
        state["last_sync"] = time.time()
        log.info(
            "Settings synced: blocking=%s, blocked_apps=%d",
            state["settings"].get("blocking_enabled"),
            len(state["blocked_apps"])
        )
        flush_offline_queue()
    except Exception as exc:
        log.debug("Sync failed: %s", exc)


# ─────────────────────────────────────────────────────────────────
# Window & idle detection
# ─────────────────────────────────────────────────────────────────

def get_active_window_info():
    """Return (process_name, window_title) for the foreground window."""
    if HAS_WIN32:
        try:
            hwnd = win32gui.GetForegroundWindow()
            title = win32gui.GetWindowText(hwnd)
            _, pid = win32process.GetWindowThreadProcessId(hwnd)
            proc = psutil.Process(pid)
            return proc.name(), title
        except Exception:
            pass

    # psutil fallback: find focused process (best effort)
    try:
        for proc in psutil.process_iter(["pid", "name", "status"]):
            if proc.info.get("status") == "running":
                return proc.info["name"], ""
    except Exception:
        pass

    return None, ""


def get_idle_seconds() -> int:
    """Return number of seconds since last user input."""
    if not HAS_WIN32:
        return 0
    try:
        class LASTINPUTINFO(ctypes.Structure):
            _fields_ = [("cbSize", ctypes.c_uint), ("dwTime", ctypes.c_uint)]
        info = LASTINPUTINFO()
        info.cbSize = ctypes.sizeof(info)
        ctypes.windll.user32.GetLastInputInfo(ctypes.byref(info))
        ms_since_input = ctypes.windll.kernel32.GetTickCount() - info.dwTime
        return max(0, ms_since_input // 1000)
    except Exception:
        return 0


# ─────────────────────────────────────────────────────────────────
# App blocking
# ─────────────────────────────────────────────────────────────────

def is_app_blocked(process_name: str) -> bool:
    name_lower = process_name.lower()
    for entry in state["blocked_apps"]:
        blocked = (entry.get("process_name") or entry).lower()
        if blocked and (name_lower == blocked or name_lower.startswith(blocked.replace(".exe", ""))):
            return True
    return False


def enforce_app_block(process_name: str, window_title: str):
    if state["dry_run"]:
        log.info("[DRY RUN] Would block: %s — %s", process_name, window_title)
        return

    try:
        winsound.Beep(880, 400)
    except Exception:
        pass

    log.warning("BLOCKING: %s (%s)", process_name, window_title)

    try:
        for proc in psutil.process_iter(["pid", "name"]):
            if proc.info["name"].lower() == process_name.lower():
                proc.kill()
                log.info("Terminated %s (PID %d)", process_name, proc.info["pid"])
                state["daily_stats"]["blocked_apps_triggered"] += 1
    except Exception as exc:
        log.error("Could not terminate %s: %s", process_name, exc)


# ─────────────────────────────────────────────────────────────────
# Bedtime check
# ─────────────────────────────────────────────────────────────────

def check_bedtime() -> bool:
    """Return True if current time is within the bedtime lock window."""
    bedtime = state["settings"].get("bedtime_schedule", {})
    start_str = bedtime.get("start")
    end_str = bedtime.get("end")
    if not start_str or not end_str:
        return False
    try:
        now = datetime.now()
        start_h, start_m = map(int, start_str.split(":"))
        end_h, end_m = map(int, end_str.split(":"))
        start_dt = now.replace(hour=start_h, minute=start_m, second=0, microsecond=0)
        end_dt = now.replace(hour=end_h, minute=end_m, second=0, microsecond=0)
        if start_dt > end_dt:  # crosses midnight
            return now >= start_dt or now <= end_dt
        return start_dt <= now <= end_dt
    except Exception:
        return False


# ─────────────────────────────────────────────────────────────────
# Daily summary
# ─────────────────────────────────────────────────────────────────

def write_daily_summary():
    today = datetime.now().strftime("%Y-%m-%d")
    summary_path = LOG_DIR / f"summary_{today}.json"
    summary = {
        **state["daily_stats"],
        "timestamp": datetime.now().isoformat(),
        "offline_queued": len(state["offline_queue"])
    }
    summary_path.write_text(json.dumps(summary, indent=2))
    log.info("Daily summary saved to %s", summary_path)


# ─────────────────────────────────────────────────────────────────
# Main monitoring loop
# ─────────────────────────────────────────────────────────────────

def monitor_loop():
    last_process = None
    last_log_time = time.time()

    while state["running"]:
        try:
            now = time.time()

            # Periodic settings sync
            if now - state["last_sync"] >= SYNC_INTERVAL:
                sync_settings()

            process_name, window_title = get_active_window_info()
            idle_seconds = get_idle_seconds()
            is_idle = idle_seconds >= IDLE_THRESHOLD

            # Track app switching
            if process_name and process_name != last_process:
                state["switch_count"] += 1
                state["last_switch_time"] = now
                last_process = process_name

            # Bedtime lock check
            if check_bedtime() and not state["dry_run"]:
                log.info("Bedtime lock active — no tracking")
                time.sleep(POLL_INTERVAL)
                continue

            # App blocking
            if (
                process_name
                and state["settings"].get("blocking_enabled")
                and is_app_blocked(process_name)
            ):
                enforce_app_block(process_name, window_title)

            # Calculate switching frequency per minute
            minutes_since_switch = max((now - state["last_switch_time"]) / 60, 0.001)
            switch_frequency = round(state["switch_count"] / minutes_since_switch)

            # Build activity log payload
            duration = int(now - last_log_time)
            last_log_time = now

            if process_name:
                payload = {
                    "source": "desktop",
                    "app_name": process_name,
                    "window_title": window_title[:512] if window_title else "",
                    "duration_seconds": duration,
                    "idle_seconds": min(idle_seconds, duration),
                    "metadata": {
                        "switch_frequency": switch_frequency,
                        "is_idle": is_idle,
                        "platform": "windows",
                        "dry_run": state["dry_run"]
                    }
                }
                send_activity(payload)

            # Update daily stats
            if not is_idle and process_name:
                state["daily_stats"]["productive_minutes"] += POLL_INTERVAL / 60
            elif is_idle:
                state["daily_stats"]["idle_minutes"] += POLL_INTERVAL / 60

        except Exception as exc:
            log.error("Monitor loop error: %s", exc, exc_info=False)

        time.sleep(POLL_INTERVAL)

    write_daily_summary()
    log.info("Monitor shutdown complete")


# ─────────────────────────────────────────────────────────────────
# Graceful shutdown
# ─────────────────────────────────────────────────────────────────

def shutdown(signum, frame):
    log.info("Shutdown signal received (signal %d)", signum)
    state["running"] = False
    write_daily_summary()


# ─────────────────────────────────────────────────────────────────
# Entry point
# ─────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Habit Breaker AI Desktop Monitor")
    parser.add_argument("--dry-run", action="store_true", help="Log activity without blocking or sending data")
    parser.add_argument("--login", action="store_true", help="Prompt for email/password and save token")
    parser.add_argument("--api", default=None, help="Override API base URL")
    args = parser.parse_args()

    global API_BASE
    if args.api:
        API_BASE = args.api.rstrip("/")

    state["dry_run"] = args.dry_run

    if args.dry_run:
        log.info("=" * 60)
        log.info("DRY RUN MODE — observing without blocking or logging")
        log.info("=" * 60)

    # Login flow
    if args.login:
        email = input("Email: ")
        password = input("Password: ")
        if not login(email, password):
            sys.exit(1)
    else:
        load_token()

    if not state["token"]:
        log.warning("No token found. Run with --login to authenticate.")
        log.warning("Continuing without authentication — activity will not be sent to server.")

    # Initial sync
    sync_settings()

    # Signal handlers
    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    log.info("=" * 60)
    log.info("Habit Breaker AI Desktop Monitor started")
    log.info("API: %s", API_BASE)
    log.info("Poll interval: %ds", POLL_INTERVAL)
    log.info("Blocking: %s", state["settings"].get("blocking_enabled", False))
    log.info("Dry run: %s", state["dry_run"])
    log.info("Log file: %s", log_filename)
    log.info("=" * 60)

    monitor_loop()


if __name__ == "__main__":
    main()
