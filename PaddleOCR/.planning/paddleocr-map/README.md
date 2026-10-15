# PaddleOCR Architecture Map — AGENT ENTRYPOINT

> If you are an AI agent: start here. This folder is self-contained. Parse files in priority order below. All source citations use `path:line` relative to repo root `C:\Projects1\Others\PaddleOCR`. Machine index: `AGENT_INDEX.json` in this same folder.

## Agent Parse Guide
1. Read `AGENT_INDEX.json` first (file manifest + feature→section map + entry-point map).
2. Then read in order: `01-BUSINESS_OVERVIEW.md` → `02-FEATURE_CATALOG.md` → `03-PIPELINE_BLUEPRINTS.md` → `04-DATAFLOW_AND_MODELS.md` → `05-INTEGRATION_MAP.md` → `06-REBUILD_GUIDE.md`.
3. To rebuild ONE feature: find its F-ID in `AGENT_INDEX.json` (e.g. `F2`), read that section in `02-FEATURE_CATALOG.md` (Why/Where/How Connected/Reuse Hint), then same-numbered blueprint in `03-PIPELINE_BLUEPRINTS.md`.
4. Citation rule: every `Where` cites `paddleocr/_pipelines/*.py:<line>` and `paddleocr/_models/*.py:<line>`; base classes are `paddleocr/_pipelines/base.py:54` and `paddleocr/_models/base.py:30`.
5. Fallback detail: `../codebase/*.md` (7 GSD files) mirrors this folder with deeper evidence. Graph skipped (no `../config.json`).
6. Known gap: `F4 HPD-Parsing` has no local wrapper — served endpoint only, see `02-FEATURE_CATALOG.md:37-42` and source `README.md:65-68`.

---

# PaddleOCR Architecture Map — Portable Artifact

Self-contained map for a future agent that only reads this folder.
Source repo: `C:\Projects1\Others\PaddleOCR` (PaddleOCR 3.x, PaddlePaddle-based OCR + Document AI).
Generated: 2026-10-15 via 7 parallel GSD mapper subagents (tech/arch/quality/concerns + 3 feature synthesizers). All claims cite `path:line` inside the source repo.

## Reading order
1. `01-BUSINESS_OVERVIEW.md` — what/why: PDF+image → LLM-ready JSON/Markdown, users (RAG/Agents), tiers.
2. `02-FEATURE_CATALOG.md` — 10 features (F1–F10), each: Why / Where (exact files) / How Connected / Reuse Hint.
3. `03-PIPELINE_BLUEPRINTS.md` — rebuild recipes for OCR, PP-StructureV3, PaddleOCR-VL, HPD, ChatOCR, Translation.
4. `04-DATAFLOW_AND_MODELS.md` — end-to-end dataflow + 13-model registry + postprocess/configs.
5. `05-INTEGRATION_MAP.md` — entry points (Python/CLI/MCP/LangChain/JS), hubs, hardware matrix.
6. `06-REBUILD_GUIDE.md` — 5-step template to rebuild any one feature in your own project + checklist.

Full GSD codebase docs (7 files) live in `../codebase/` (STACK, INTEGRATIONS, ARCHITECTURE, STRUCTURE, CONVENTIONS, TESTING, CONCERNS) — same evidence, more detail.

## How to reuse one feature (summary)
1. Pick F-number from `02-FEATURE_CATALOG.md`.
2. Copy its Where files + How Connected upstream/downstream.
3. Follow its Reuse Hint + matching blueprint in `03-PIPELINE_BLUEPRINTS.md`.
4. Wire I/O per `04-DATAFLOW_AND_MODELS.md`, entry point per `05-INTEGRATION_MAP.md`.
5. Apply checklist in `06-REBUILD_GUIDE.md`.

## Verification
- `wc`: 503 lines across 6 files; `../codebase/`: 536 lines across 7 files.
- Cited paths spot-checked: `paddleocr/_pipelines/ocr.py`, `pp_structurev3.py`, `paddleocr_vl.py`, `_models/base.py`, `_abstract.py`, `_cli.py` all exist.
- Known gap (documented in 02/03): HPD-Parsing has no `paddleocr/_pipelines/hpd*` wrapper — served via custom vLLM/OpenAI-compatible endpoint per `README.md:65-68`.
- Knowledge graph (`gsd-graphify`) skipped: `../config.json` absent → feature disabled by config gate.
