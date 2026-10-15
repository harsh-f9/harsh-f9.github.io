---
last_mapped_commit: 6fadbae317b09c4dd4051c0f1fc1746c6baf04bc
last_mapped_at: 2026-10-15
---
# Codebase Structure

**Analysis Date:** 2026-10-15

## Directory Layout

```text
docling/
├── .agents/                 # Developer skills and instructions
│   └── skills/              # Contribution skills (dignified-python, review, etc.)
├── .github/                 # GitHub actions CI/CD, dprint configuration, issue templates
├── .plans/                  # Historical and active engineering feature plans
│   ├── active/              # In-progress plans (docling-slim, mineru2-pro, etc.)
│   └── completed/           # Completed engineering milestones
├── .planning/               # GSD project memory, codebase map, roadmaps, feature catalog
│   ├── codebase/            # 7 codebase mapping documents (STACK, ARCHITECTURE, etc.)
│   ├── features/            # Deep-dive feature blueprints for cross-project replication
│   └── onboarding/          # Onboarding index and summary
├── docling/                 # Core Python package source (shared by all distributions)
│   ├── backend/             # Format-specific ingestion backends
│   │   ├── xml/             # USPTO, JATS, DocLang, XBRL backends
│   │   ├── json/            # Docling JSON backend
│   │   ├── abstract_backend.py
│   │   ├── docling_parse_backend.py
│   │   ├── msword_backend.py
│   │   ├── mspowerpoint_backend.py
│   │   ├── msexcel_backend.py
│   │   ├── html_backend.py
│   │   ├── md_backend.py
│   │   └── pdf_backend.py
│   ├── chunking/            # Document chunking abstractions (Hierarchical & Hybrid)
│   ├── cli/                 # Typer-based command line interface
│   │   ├── main.py          # Main CLI commands ('docling convert', 'docling benchmark')
│   │   ├── tools.py         # Secondary tool commands ('docling-tools')
│   │   └── export_utils.py  # CLI export formatting helpers
│   ├── datamodel/           # Pydantic schemas and typed data contracts
│   │   ├── base_models.py   # InputFormat, ConversionStatus, ErrorItem
│   │   ├── document.py      # ConversionResult, InputDocument
│   │   ├── pipeline_options.py # Strongly-typed options for all pipelines
│   │   └── settings.py      # Pydantic-settings environment configurations
│   ├── experimental/        # Experimental pipelines and prototype stages
│   ├── models/              # ML/CV models and stage processing
│   │   ├── factories/       # Pluggy plugin factories (BaseFactory, OcrFactory)
│   │   ├── inference_engines/ # VLM engines (transformers, vllm, mlx, api)
│   │   ├── plugins/         # Default plugin registrations
│   │   ├── postprocessing/  # Rule-based reading order and list marker models
│   │   ├── stages/          # Stage models (layout, ocr, table_structure, assemble)
│   │   └── utils/           # Model downloader and token generation utils
│   ├── pipeline/            # Pipeline execution engines
│   │   ├── base_pipeline.py
│   │   ├── simple_pipeline.py
│   │   ├── standard_pdf_pipeline.py
│   │   ├── threaded_standard_pdf_pipeline.py
│   │   ├── native_pdf_pipeline.py
│   │   ├── vlm_pipeline.py
│   │   ├── asr_pipeline.py
│   │   └── video_pipeline.py
│   ├── service_client/      # Remote Docling Serve client SDK
│   │   ├── client.py        # Synchronous DoclingClient
│   │   ├── _async_client.py # Asynchronous HTTP client
│   │   └── job.py           # Remote job lifecycle tracker
│   ├── utils/               # Shared utilities (accelerator, profiling, geometry, locks)
│   ├── document_converter.py# Primary SDK conversion interface
│   ├── document_extractor.py# Key-value and schema extraction interface
│   └── exceptions.py        # Unified exception taxonomy
├── packages/                # Monorepo distribution packages
│   ├── docling/             # Full meta-package (pip install docling)
│   ├── docling-slim/        # Minimal base library (pip install docling-slim)
│   └── docling-client/      # Standalone API client (pip install docling-client)
├── docs/                    # MkDocs documentation site and usage examples
├── tests/                   # Pytest test suite, fixtures, and golden reference data
├── scripts/                 # Build, validation, and maintenance scripts
├── pyproject.toml           # Root configuration, workspace settings, dependencies
├── tach.toml                # Architectural layer rules and import boundary enforcement
└── Makefile                 # Standard developer build targets
```

---

## Key File Locations & Entry Points

| Role | File Path | Description |
| :--- | :--- | :--- |
| **Main Python SDK Entry** | [`docling/document_converter.py`](file:///C:/Projects1/Others/docling/docling/document_converter.py) | High-level `DocumentConverter` class for single/batch conversions. |
| **Main CLI Entry** | [`docling/cli/main.py`](file:///C:/Projects1/Others/docling/docling/cli/main.py) | Typer CLI application for terminal workflows. |
| **Extraction Entry** | [`docling/document_extractor.py`](file:///C:/Projects1/Others/docling/docling/document_extractor.py) | `DocumentExtractor` for targeted document data extraction. |
| **Remote Client Entry** | [`docling/service_client/client.py`](file:///C:/Projects1/Others/docling/docling/service_client/client.py) | `DoclingClient` for calling remote Docling Serve instances. |
| **PDF Conversion Engine** | [`docling/pipeline/standard_pdf_pipeline.py`](file:///C:/Projects1/Others/docling/docling/pipeline/standard_pdf_pipeline.py) | Multi-stage CV conversion pipeline. |
| **Plugin Registry** | [`docling/models/plugins/defaults.py`](file:///C:/Projects1/Others/docling/docling/models/plugins/defaults.py) | Registers default OCR, layout, table, and picture models. |
| **Layer Boundaries** | [`tach.toml`](file:///C:/Projects1/Others/docling/tach.toml) | Declares modules and acyclic import constraints. |

---

## Monorepo Distribution Model

Docling utilizes a zero-copy workspace pattern:
1. **`docling-slim` (Root `pyproject.toml`):**
   - Contains all Python code in `docling/`.
   - Ships with an 8-package baseline (~50MB) without PyTorch or Transformers.
   - Provides granular extras: `[format-pdf]`, `[format-office]`, `[cli]`, `[ocr-tesseract]`.
2. **`packages/docling`:**
   - Meta-package depending on `docling-slim[standard]==<version>`.
   - Bundles all standard capabilities for typical data science users.
3. **`packages/docling-client`:**
   - Meta-package depending on `docling-slim[service-client]==<version>`.
   - Provides client-only capabilities with minimal network dependencies.

---
*Structure analysis: 2026-10-15*
