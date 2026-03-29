#!/usr/bin/env python3
"""
queue-orchestrator.py — Fungineer Task Queue Orchestrator

Fluxo:
  1. Faz git pull a cada 30s para pegar tasks novas do Claude mobile
  2. Lê task-queue.md e pega a próxima task PENDING
  3. Escreve no cowork-inbox.md (despacha pro Claude Code)
  4. Aguarda cowork-inbox.md virar DONE
  5. A cada 10 tasks completadas: instrui o Claude Code a commitar e pushar
  6. Após commit: escreve em verify-queue.md para o Cowork verificar visualmente
  7. Loop
"""

import os
import re
import time
import subprocess
import sys
from datetime import datetime

# ── Caminhos ─────────────────────────────────────────────────────────────────
PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INBOX_FILE  = os.path.join(PROJECT_DIR, "production", "cowork-inbox.md")
QUEUE_FILE  = os.path.join(PROJECT_DIR, "production", "task-queue.md")
VERIFY_FILE = os.path.join(PROJECT_DIR, "production", "verify-queue.md")
LOG_FILE    = os.path.join(PROJECT_DIR, "production", "session-logs", "orchestrator.log")

TASKS_PER_COMMIT = 10
POLL_INTERVAL    = 5    # segundos entre checks do inbox
GIT_PULL_EVERY   = 30   # segundos entre git pulls

# ── Utilitários ───────────────────────────────────────────────────────────────

def log(msg: str):
    ts = datetime.now().strftime("%H:%M:%S")
    line = f"[{ts}] {msg}"
    print(line, flush=True)
    os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(line + "\n")


def git_pull():
    try:
        result = subprocess.run(
            ["git", "pull", "--rebase", "--autostash"],
            cwd=PROJECT_DIR,
            capture_output=True,
            text=True,
            timeout=30
        )
        if "Already up to date" not in result.stdout:
            log(f"🔄 git pull: {result.stdout.strip()}")
    except Exception as e:
        log(f"⚠️  git pull falhou: {e}")


def read_file(path: str) -> str:
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def write_file(path: str, content: str):
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)


# ── Parser do task-queue.md ───────────────────────────────────────────────────

def parse_tasks(content: str) -> list[dict]:
    """Extrai tasks do task-queue.md."""
    tasks = []
    blocks = re.split(r"---TASK---", content)
    for block in blocks[1:]:  # ignora cabeçalho
        end_match = re.search(r"---END---", block)
        if not end_match:
            continue
        body = block[:end_match.start()].strip()
        task = {}
        for line in body.splitlines():
            if ":" in line:
                key, _, val = line.partition(":")
                task[key.strip()] = val.strip()
        if "ID" in task and "Status" in task:
            tasks.append(task)
    return tasks


def get_next_pending(tasks: list[dict]) -> dict | None:
    for t in tasks:
        if t.get("Status") == "PENDING":
            return t
    return None


def update_task_status(task_id: str, new_status: str):
    content = read_file(QUEUE_FILE)
    # Encontra o bloco da task e atualiza o Status
    pattern = rf"(---TASK---.*?ID:\s*{re.escape(task_id)}.*?Status:\s*)\w+(.*?---END---)"
    updated = re.sub(pattern, rf"\g<1>{new_status}\g<2>", content, flags=re.DOTALL)
    write_file(QUEUE_FILE, updated)


def get_metadata(key: str) -> int:
    content = read_file(QUEUE_FILE)
    m = re.search(rf"{re.escape(key)}:\s*(\d+)", content)
    return int(m.group(1)) if m else 0


def set_metadata(key: str, value: int):
    content = read_file(QUEUE_FILE)
    updated = re.sub(rf"({re.escape(key)}:\s*)\d+", rf"\g<1>{value}", content)
    write_file(QUEUE_FILE, updated)


# ── cowork-inbox.md ───────────────────────────────────────────────────────────

def inbox_status() -> str:
    content = read_file(INBOX_FILE)
    m = re.search(r"## Status\n(\w+)", content)
    return m.group(1) if m else "UNKNOWN"


def dispatch_task(task: dict, should_commit: bool, batch_num: int, completed_in_batch: int):
    """Escreve a task no cowork-inbox.md."""
    task_id   = task.get("ID", "???")
    desc      = task.get("Descrição", task.get("Descricao", ""))
    screen    = task.get("Tela", "")
    verify    = task.get("Como verificar", "")

    commit_instruction = ""
    if should_commit:
        commit_instruction = f"""

⚠️ ESTA É A TASK {completed_in_batch + 1}/10 DO BATCH {batch_num}.
Após implementar, faça commit e push com a mensagem:
```
feat: batch {batch_num} — {completed_in_batch + 1} tasks implementadas

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```
"""
    else:
        commit_instruction = f"\n⚠️ NÃO commite ainda. Task {completed_in_batch + 1}/{TASKS_PER_COMMIT} do batch {batch_num}."

    inbox_content = f"""# Cowork → Claude Code Inbox

> Arquivo de comunicação entre Cowork (Claude no desktop) e Claude Code.

---

## Status
PENDING

## Tarefa

### Task {task_id} — {desc}

**Tela afetada:** {screen}
**Descrição completa:** {desc}
**Como verificar:** {verify}
{commit_instruction}

Implemente a mudança acima. Siga os padrões do projeto (GDScript, snake_case, data-driven).
"""
    write_file(INBOX_FILE, inbox_content)
    log(f"📤 Despachada task {task_id}: {desc[:60]}...")


def wait_for_done() -> bool:
    """Aguarda cowork-inbox.md virar DONE. Retorna True se OK."""
    log("⏳ Aguardando Claude Code completar a task...")
    while True:
        time.sleep(POLL_INTERVAL)
        status = inbox_status()
        if status == "DONE":
            log("✅ Task completada pelo Claude Code.")
            return True
        elif status == "ERROR":
            log("❌ Claude Code reportou erro.")
            return False


# ── verify-queue.md ───────────────────────────────────────────────────────────

def request_visual_verification(batch_num: int, tasks_in_batch: list[dict]):
    """Escreve em verify-queue.md para o Cowork verificar visualmente."""
    task_list = "\n".join(
        f"- Task {t.get('ID')}: {t.get('Descrição', t.get('Descricao', ''))} "
        f"[Tela: {t.get('Tela', '?')}] — {t.get('Como verificar', '')}"
        for t in tasks_in_batch
    )

    content = f"""# Verify Queue — Fungineer

> Cowork: abre o jogo, navega pelas telas listadas, verifica visualmente.
> Quando terminar, troque o Status para APPROVED ou REJECTED.
> Se REJECTED, preencha a seção Correções.

## Status
PENDING

## Batch
{batch_num}

## Tasks deste batch
{task_list}

## Resultado
<!-- Preencher após verificação -->

## Correções necessárias
<!-- Se REJECTED, liste as correções aqui — uma por linha -->

"""
    write_file(VERIFY_FILE, content)
    log(f"🔍 Batch {batch_num} pronto para verificação visual. Abrindo verify-queue.md...")


def wait_for_verification() -> tuple[bool, list[str]]:
    """Aguarda verify-queue.md virar APPROVED ou REJECTED."""
    log("👁️  Aguardando verificação visual do Cowork...")
    while True:
        time.sleep(10)
        content = read_file(VERIFY_FILE)
        m = re.search(r"## Status\n(\w+)", content)
        status = m.group(1) if m else "PENDING"
        if status == "APPROVED":
            log("✅ Batch aprovado na verificação visual.")
            return True, []
        elif status == "REJECTED":
            # Extrai correções
            m2 = re.search(r"## Correções necessárias\n(.*?)(?:\n##|$)", content, re.DOTALL)
            corrections = []
            if m2:
                for line in m2.group(1).strip().splitlines():
                    line = line.strip().lstrip("-").strip()
                    if line and not line.startswith("<!--"):
                        corrections.append(line)
            log(f"❌ Batch rejeitado. {len(corrections)} correção(ões) necessária(s).")
            return False, corrections


def inject_corrections(corrections: list[str], batch_num: int):
    """Injeta tasks de correção no início da fila."""
    content = read_file(QUEUE_FILE)
    # Pega o próximo ID disponível
    ids = re.findall(r"ID:\s*(\d+)", content)
    next_id = max((int(i) for i in ids), default=0) + 1

    correction_blocks = ""
    for i, corr in enumerate(corrections):
        task_id = f"C{batch_num:02d}{i+1:02d}"
        correction_blocks += f"""
---TASK---
ID: {task_id}
Status: PENDING
Tela: (ver descrição)
Descrição: [CORREÇÃO] {corr}
Como verificar: Verificar visualmente que a correção foi aplicada.
---END---
"""

    # Insere após o comentário de exemplo (ou após "## Tasks")
    insert_point = content.find("## Tasks\n")
    if insert_point == -1:
        content += correction_blocks
    else:
        # Insere logo após o bloco de comentário de exemplo
        example_end = content.find("-->", insert_point)
        if example_end != -1:
            insert_at = example_end + 3
            content = content[:insert_at] + "\n" + correction_blocks + content[insert_at:]
        else:
            content += correction_blocks

    write_file(QUEUE_FILE, content)
    log(f"🔧 {len(corrections)} task(s) de correção injetadas na fila.")


# ── Loop principal ─────────────────────────────────────────────────────────────

def main():
    log("🚀 Queue Orchestrator iniciado.")
    log(f"   Projeto: {PROJECT_DIR}")
    log(f"   Commit a cada {TASKS_PER_COMMIT} tasks.")

    last_pull = 0
    batch_tasks_done = []  # tasks completadas no batch atual

    while True:
        # Git pull periódico
        now = time.time()
        if now - last_pull >= GIT_PULL_EVERY:
            git_pull()
            last_pull = now

        # Lê a fila
        if not os.path.exists(QUEUE_FILE):
            log("⏸  task-queue.md não encontrado. Aguardando...")
            time.sleep(10)
            continue

        content  = read_file(QUEUE_FILE)
        tasks    = parse_tasks(content)
        pending  = get_next_pending(tasks)

        if not pending:
            time.sleep(10)
            continue

        # Metadados do batch atual
        batch_num         = get_metadata("Batch atual")
        completed_in_batch = get_metadata("Tasks completadas neste batch")

        # Determina se esta task fecha o batch
        is_10th = (completed_in_batch + 1) >= TASKS_PER_COMMIT

        # Despacha
        update_task_status(pending["ID"], "IN_PROGRESS")
        batch_tasks_done.append(pending)
        dispatch_task(pending, should_commit=is_10th, batch_num=batch_num + 1, completed_in_batch=completed_in_batch)

        # Aguarda conclusão
        ok = wait_for_done()
        if not ok:
            # Claude Code deu erro — mantém IN_PROGRESS e pausa
            update_task_status(pending["ID"], "PENDING")
            log("⚠️  Tentando novamente em 30s...")
            time.sleep(30)
            continue

        # Marca como DONE
        update_task_status(pending["ID"], "DONE")

        # Atualiza contagem
        new_count = completed_in_batch + 1
        set_metadata("Tasks completadas neste batch", new_count % TASKS_PER_COMMIT)

        if is_10th:
            # Fechou o batch — solicita verificação visual
            new_batch = batch_num + 1
            set_metadata("Batch atual", new_batch)
            set_metadata("Último commit", new_batch)
            request_visual_verification(new_batch, batch_tasks_done)
            batch_tasks_done = []

            # Aguarda verificação
            approved, corrections = wait_for_verification()
            if not approved and corrections:
                inject_corrections(corrections, new_batch)

        time.sleep(2)


if __name__ == "__main__":
    main()
