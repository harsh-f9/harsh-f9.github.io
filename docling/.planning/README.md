# Agent Navigation Manual (.planning)

> [!IMPORTANT]
> **To any AI coding agent reading this folder:**
> This `.planning/` directory contains complete business, architectural, and developer intelligence for the **Docling** repository.
> Follow this guide to parse the documents quickly and find the exact context you need.

---

## 1. Directory Structure

```text
.planning/
├── README.md                      # THIS FILE: Primary agent navigation guide
├── docling-codebase-blueprint.md   # Executive architecture blueprint & layer map
├── PROJECT.md                     # Living project context, core value, key decisions
├── REQUIREMENTS.md                # 18 traceable functional & non-functional requirements
├── ROADMAP.md                     # 5 capability phases & system evolution
├── STATE.md                       # Current project velocity, maturity, and continuity
├── config.json                    # GSD workflow configuration
│
├── codebase/                      # 7 Standard GSD Codebase Mapping Documents
│   ├── STACK.md                   # Languages, runtimes, package manager, ML frameworks
│   ├── INTEGRATIONS.md            # OCR engines, Hugging Face models, remote client
│   ├── ARCHITECTURE.md            # Layer breakdown (Tach), pipelines, data flow
│   ├── STRUCTURE.md               # Repository file layout & monorepo package mapping
│   ├── CONVENTIONS.md             # Code style, typing rules, ASD-STE100, linting
│   ├── TESTING.md                 # Pytest suites, golden reference data, CI gates
│   └── CONCERNS.md                # Technical debt, memory bottlenecks, GIL limits
│
├── features/                      # Reusable Feature Blueprints (How to build each feature)
│   ├── FEATURE_CATALOG.md         # Master index & cross-project feature matrix
│   ├── 01_UNIFIED_DOCUMENT_MODEL.md       # Multimodal AST & spatial provenance
│   ├── 02_MULTI_FORMAT_PARSER_PIPELINE.md # Format dispatch & pipeline caching
│   ├── 03_HYBRID_PDF_AND_OCR_PIPELINE.md  # Dual-path PDF parsing & reading order
│   ├── 04_TABLE_STRUCTURE_EXTRACTION.md   # TableFormer & OTSL table recovery
│   ├── 05_VLM_AND_MULTIMODAL_ENRICHMENT.md# Multi-engine VLM adapter (MLX, vLLM, etc.)
│   ├── 06_RAG_AWARE_CHUNKING.md           # Structure-preserving hierarchical chunker
│   ├── 07_MODULAR_SLIM_PACKAGING.md       # Zero-copy monorepo slim packaging
│   └── 08_REMOTE_SERVICE_CLIENT.md        # Asynchronous job-polling client SDK
│
└── onboarding/
    └── SUMMARY.md                 # GSD onboarding index and next command router
```

---

## 2. Where Should You Look? (Task Routing)

Find your current task below to see which documents to read:

| Agent Intent / Task | Start Here | Secondary Documents |
| :--- | :--- | :--- |
| **"I need to understand what this project does and its core architecture"** | [docling-codebase-blueprint.md](file:///C:/Projects1/Others/docling/.planning/docling-codebase-blueprint.md) | [PROJECT.md](file:///C:/Projects1/Others/docling/.planning/PROJECT.md), [ARCHITECTURE.md](file:///C:/Projects1/Others/docling/.planning/codebase/ARCHITECTURE.md) |
| **"I want to build a similar feature in my own / another project"** | [FEATURE_CATALOG.md](file:///C:/Projects1/Others/docling/.planning/features/FEATURE_CATALOG.md) | Read the matching blueprint in [features/](file:///C:/Projects1/Others/docling/.planning/features/) (e.g. `01_UNIFIED_...`, `03_HYBRID_...`) |
| **"I need to write or edit Python code in this repo"** | [CONVENTIONS.md](file:///C:/Projects1/Others/docling/.planning/codebase/CONVENTIONS.md) | [STRUCTURE.md](file:///C:/Projects1/Others/docling/.planning/codebase/STRUCTURE.md), [STACK.md](file:///C:/Projects1/Others/docling/.planning/codebase/STACK.md) |
| **"I need to run, fix, or add tests"** | [TESTING.md](file:///C:/Projects1/Others/docling/.planning/codebase/TESTING.md) | [CONVENTIONS.md](file:///C:/Projects1/Others/docling/.planning/codebase/CONVENTIONS.md) |
| **"I need to understand OCR, vision models, or external services"** | [INTEGRATIONS.md](file:///C:/Projects1/Others/docling/.planning/codebase/INTEGRATIONS.md) | [05_VLM_AND_MULTIMODAL_ENRICHMENT.md](file:///C:/Projects1/Others/docling/.planning/features/05_VLM_AND_MULTIMODAL_ENRICHMENT.md) |
| **"I need to understand potential bugs, memory risks, or bottlenecks"** | [CONCERNS.md](file:///C:/Projects1/Others/docling/.planning/codebase/CONCERNS.md) | [ARCHITECTURE.md](file:///C:/Projects1/Others/docling/.planning/codebase/ARCHITECTURE.md) |
| **"I am executing a GSD workflow (e.g. plan-phase, execute-phase)"** | [STATE.md](file:///C:/Projects1/Others/docling/.planning/STATE.md) | [ROADMAP.md](file:///C:/Projects1/Others/docling/.planning/ROADMAP.md), [REQUIREMENTS.md](file:///C:/Projects1/Others/docling/.planning/REQUIREMENTS.md) |

---

## 3. Recommended Sequential Reading Order (New Agent)

If you are entering this project for the first time with no prior context:

1. **Step 1:** Read [docling-codebase-blueprint.md](file:///C:/Projects1/Others/docling/.planning/docling-codebase-blueprint.md) (5-minute overview of architecture, pipeline layers, and design decisions).
2. **Step 2:** Read [codebase/ARCHITECTURE.md](file:///C:/Projects1/Others/docling/.planning/codebase/ARCHITECTURE.md) (Understand Tach layers, conversion lifecycle, and data flow).
3. **Step 3:** Read [codebase/CONVENTIONS.md](file:///C:/Projects1/Others/docling/.planning/codebase/CONVENTIONS.md) (Understand ASD-STE100, typing rules, and model requirements).
4. **Step 4:** If replicating features, browse [features/FEATURE_CATALOG.md](file:///C:/Projects1/Others/docling/.planning/features/FEATURE_CATALOG.md).

---

## 4. Key Architectural Invariants

Always observe these invariants when modifying code:
1. **Canonical AST:** Never invent custom return formats for new document types. Every backend must output into [`DoclingDocument`](file:///C:/Projects1/Others/docling/docling/datamodel/document.py).
2. **Acyclic Tach Layers:** Imports must follow strict hierarchical order: `foundation` -> `core` -> `models` -> `pipeline` -> `clients` -> `entrypoints`. Run `uv run tach check` to verify.
3. **No Heavy Imports in Minimal Base:** Do not import `torch`, `torchvision`, or `transformers` at the top level of `docling/__init__.py`. Keep them inside stage factories so `docling-slim` remains ~50MB.
4. **Golden Reference Data:** Run `DOCLING_GEN_TEST_DATA=1 uv run pytest tests/test_e2e_conversion.py` only when conversion outputs intentionally change, and review the git diff carefully.

---
*Manual compiled: 2026-10-15*
