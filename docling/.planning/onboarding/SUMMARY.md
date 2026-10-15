# Docling Onboarding Summary

**Onboarding Date:** 2026-10-15
**Project:** Docling (v2.139.0)
**Repository Root:** `C:/Projects1/Others/docling`

---

## 1. Onboarding Status

| Component | Status | Path |
| :--- | :--- | :--- |
| **Codebase Map (7 Docs)** | Complete & Stamped | [`.planning/codebase/`](file:///C:/Projects1/Others/docling/.planning/codebase/) |
| **Project Context** | Initialized | [`.planning/PROJECT.md`](file:///C:/Projects1/Others/docling/.planning/PROJECT.md) |
| **System Requirements** | Documented | [`.planning/REQUIREMENTS.md`](file:///C:/Projects1/Others/docling/.planning/REQUIREMENTS.md) |
| **Phased Capability Roadmap** | Structured | [`.planning/ROADMAP.md`](file:///C:/Projects1/Others/docling/.planning/ROADMAP.md) |
| **Living State** | Synchronized | [`.planning/STATE.md`](file:///C:/Projects1/Others/docling/.planning/STATE.md) |
| **Feature Catalog & Blueprints** | 8 Detailed Blueprints | [`.planning/features/`](file:///C:/Projects1/Others/docling/.planning/features/) |

---

## 2. Key Architecture Takeaways for Agents

1. **Unified AST (`DoclingDocument`)**: Everything converts to `DoclingDocument`. All serializers (Markdown, HTML, JSON) and chunkers operate on this canonical tree.
2. **Dual-Path PDF Pipeline**: Fast programmatic extraction via `docling-parse` for digital PDFs; deep learning computer vision (layout object detection + OCR fallback) for scanned documents.
3. **Table & Separator Recovery**: TableFormer predicts OTSL token sequences; reading order graph traversal uses vector shape lines to prevent cross-column text interleaving.
4. **Zero-Copy Slim Packaging**: The root repository publishes `docling-slim` (~50MB base) with granular extras, while `packages/docling` publishes the full meta-package.
5. **Enforced Layer Boundaries**: `tach` enforces acyclic dependencies across 6 architectural layers (`foundation` -> `core` -> `models` -> `pipeline` -> `clients` -> `entrypoints`).

---

## 3. Recommended Next Commands

- Inspect the feature blueprints:
  ```bash
  cat .planning/features/FEATURE_CATALOG.md
  ```
- Build or query the project knowledge graph:
  ```bash
  /gsd-graphify build
  /gsd-graphify status
  ```
- Plan new feature phases:
  ```bash
  /gsd-plan-phase
  ```
