#!/usr/bin/env python3
"""
Cowork ↔ Claude Code Autonomous Bridge
=======================================
Watches production/cowork-inbox.md for tasks written by Cowork (Claude no desktop).
When status changes to PENDING, triggers Claude Code non-interactively to execute the task.
Claude Code executes with full permissions, then marks the task DONE.

Usage:
    python tools/cowork-watcher.py

Requirements:
    pip install watchdog
"""

import sys
import time
import subprocess
import logging
from pathlib import Path

# ── Config ────────────────────────────────────────────────────────────────────
PROJECT_DIR = Path(__file__).parent.parent.resolve()
INBOX = PROJECT_DIR / "production" / "cowork-inbox.md"
LOG_FILE = PROJECT_DIR / "production" / "session-logs" / "cowork-watcher.log"
POLL_INTERVAL = 5  # seconds between inbox checks (fallback if watchdog fails)

# ── Logging ───────────────────────────────────────────────────────────────────
LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE, encoding="utf-8"),
        logging.StreamHandler(sys.stdout),
    ],
)
log = logging.getLogger("cowork-watcher")

# ── Core logic ────────────────────────────────────────────────────────────────
def get_status() -> str:
    """Read the current status from the inbox file."""
    if not INBOX.exists():
        return "NO_INBOX"
    content = INBOX.read_text(encoding="utf-8")
    for line in content.splitlines():
        stripped = line.strip()
        if stripped in ("PENDING", "DONE", "IDLE", "IN_PROGRESS"):
            return stripped
    return "UNKNOWN"


def trigger_claude_code():
    """Run Claude Code non-interactively to execute the pending task."""
    log.info("🚀 Tarefa PENDING detectada — acionando Claude Code...")

    prompt = (
        "Leia o arquivo production/cowork-inbox.md. "
        "Há uma tarefa com Status: PENDING. "
        "Execute-a completamente e com autonomia total. "
        "Após concluir: atualize Status para DONE, escreva o resultado em ## Resultado, "
        "e adicione uma entrada no ## Histórico com a data e um resumo do que foi feito. "
        "Use git add, git commit e git push sempre que houver arquivos novos ou modificados."
    )

    try:
        result = subprocess.run(
            ["claude", "--print", "--dangerously-skip-permissions", prompt],
            cwd=str(PROJECT_DIR),
            capture_output=True,
            text=True,
            encoding="utf-8",
        )
        if result.returncode == 0:
            log.info("✅ Claude Code concluiu a tarefa.")
            log.debug(f"Output: {result.stdout[:500]}")
        else:
            log.error(f"❌ Claude Code retornou erro: {result.stderr[:500]}")
    except FileNotFoundError:
        log.error("❌ Comando 'claude' não encontrado. Verifique se Claude Code está no PATH.")
    except Exception as e:
        log.error(f"❌ Erro ao acionar Claude Code: {e}")


# ── Watcher ───────────────────────────────────────────────────────────────────
def run_with_watchdog():
    """Use watchdog for efficient file system event monitoring."""
    from watchdog.observers import Observer
    from watchdog.events import FileSystemEventHandler

    class InboxHandler(FileSystemEventHandler):
        def __init__(self):
            self._last_status = get_status()
            self._running = False

        def on_modified(self, event):
            if Path(event.src_path).resolve() != INBOX.resolve():
                return
            self._check()

        def _check(self):
            if self._running:
                return
            status = get_status()
            if status == "PENDING" and self._last_status != "IN_PROGRESS":
                self._running = True
                self._last_status = "IN_PROGRESS"
                trigger_claude_code()
                self._last_status = get_status()
                self._running = False
            else:
                self._last_status = status

    handler = InboxHandler()
    observer = Observer()
    observer.schedule(handler, str(INBOX.parent), recursive=False)
    observer.start()

    # Check immediately on startup in case file is already PENDING
    import threading
    threading.Timer(1.0, handler._check).start()

    log.info(f"👁️  Watchdog monitorando: {INBOX}")
    log.info("   Pressione Ctrl+C para parar.\n")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        log.info("Parando watcher...")
        observer.stop()
    observer.join()


def run_polling():
    """Fallback: simple polling loop if watchdog is not available."""
    log.info(f"👁️  Polling a cada {POLL_INTERVAL}s: {INBOX}")
    log.info("   (instale watchdog para detecção instantânea: pip install watchdog)\n")

    last_status = get_status()
    running = False

    # Trigger immediately if already PENDING on startup
    if last_status == "PENDING":
        running = True
        last_status = "IN_PROGRESS"
        trigger_claude_code()
        last_status = get_status()
        running = False

    while True:
        try:
            status = get_status()
            if status == "PENDING" and not running and last_status != "IN_PROGRESS":
                running = True
                last_status = "IN_PROGRESS"
                trigger_claude_code()
                last_status = get_status()
                running = False
            elif status != last_status:
                log.info(f"📋 Status: {last_status} → {status}")
                last_status = status
            time.sleep(POLL_INTERVAL)
        except KeyboardInterrupt:
            log.info("Parando watcher...")
            break
        except Exception as e:
            log.error(f"Erro no loop: {e}")
            time.sleep(POLL_INTERVAL)


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    log.info("=" * 60)
    log.info("  Cowork ↔ Claude Code Autonomous Bridge")
    log.info(f"  Projeto: {PROJECT_DIR}")
    log.info(f"  Inbox:   {INBOX}")
    log.info("=" * 60)

    if not INBOX.exists():
        log.warning(f"Inbox não encontrado: {INBOX}")
        log.warning("Será criado automaticamente quando Cowork escrever a primeira tarefa.")

    if "--poll" in sys.argv:
        run_polling()
    else:
        try:
            import watchdog  # noqa
            run_with_watchdog()
        except ImportError:
            log.warning("watchdog não instalado — usando polling. Execute: pip install watchdog")
            run_polling()
