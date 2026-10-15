---
last_mapped_commit: 6fadbae317b09c4dd4051c0f1fc1746c6baf04bc
last_mapped_at: 2026-10-15
---
# Technology Stack

**Analysis Date:** 2026-10-15

## Languages

**Primary:**
- Python 3.10 - 3.14 (core SDK, CLI, pipeline stages, backend adapters, data models)

**Secondary:**
- C++ (underlying PDF parser via `docling-parse` binding)
- Shell / Make / YAML (build automation, CI/CD workflows, developer scripts)

## Runtime

**Environment:**
- CPython 3.10+ (tested on Linux x86_64/aarch64, macOS Apple Silicon/Intel, Windows x86_64)
- Hardware acceleration: CUDA (NVIDIA GPUs), MPS (Apple Silicon), ROCm, CPU fallback

**Package Manager & Build Backend:**
- `uv` (modern Python package manager and workspace runner)
- `hatchling` (PEP 517 build backend)
- Lockfile: `uv.lock` (fully locked dependencies)

## Frameworks & Core Libraries

**Data Modeling & Contracts:**
- `pydantic` (>=2.0.0, <3.0.0) - High-performance data validation, immutable settings, and schema contracts
- `docling-core` (>=2.98.0, <3.0.0) - Unified `DoclingDocument` representation, AST nodes, serializers, and hierarchical chunkers
- `pydantic-settings` (>=2.3.0, <3.0.0) - Environment variable binding and configuration management

**CLI & Terminal UX:**
- `typer` - Type-hint driven CLI framework for `docling` and `docling-tools`
- `rich` - Terminal tables, colorized logging, error diagnostics, and formatting
- `tqdm` - Progress meters and batch conversion progress reporters

**Extensibility & Plugin Management:**
- `pluggy` (>=1.0.0, <2.0.0) - Plugin hook architecture for discovery and registration of custom OCR, layout, table structure, and picture description engines

**Deep Learning & Vision-Language Modeling:**
- `torch` & `torchvision` - Tensor computation and vision model backbones
- `transformers` - Hugging Face model loader, tokenizer management, generation loops
- `accelerate` - Multi-device placement and mixed-precision inference
- `mlx` / `mlx-vlm` (optional, macOS) - Apple Silicon native tensor and vision-language inference
- `vllm` (optional) - High-throughput LLM/VLM serving engine

**Computer Vision & Geometry:**
- `pillow` (PIL) - Image rasterization, cropping, color conversion
- `numpy` - Vectorized coordinate transforms and bounding box math
- `scipy` - Spatial cluster calculations and reading order heuristics
- `rtree` - Spatial indexing for bounding box intersections, containment, and overlap queries

**Format Parsers & Ingestion Backends:**
- `docling-parse` - Fast C++ PDF parser for programmatic font/glyph/vector extraction
- `pypdfium2` - PDFium rasterizer and fallback parser
- `python-docx` - Microsoft Word (.docx) document structure parsing
- `python-pptx` - Microsoft PowerPoint (.pptx) slide and shape extraction
- `openpyxl` - Microsoft Excel (.xlsx) sheet and cell extraction
- `odfdo` - OpenDocument (.odt, .ods, .odp) extraction
- `beautifulsoup4` - HTML / XML cleaning and tag extraction
- `marko` - Markdown AST parser
- `mail-parser` - Email (.eml, .msg) format parsing

**Testing & Quality Control:**
- `pytest` - Test suite orchestration and assertions
- `ruff` - Linter and code formatter
- `tach` - Architectural layer and module dependency boundary enforcement
- `ty` / `mypy` - Static type checking
- `dprint` - Markdown, JSON, and document formatting

## Key Dependencies (Categorized)

**Base Runtime (docling-slim minimal footprint ~50MB):**
- `pydantic` - Core schemas and serialization
- `docling-core` - Canonical document representation
- `pydantic-settings` - Configuration management
- `filetype` - Magic byte format detection
- `requests` & `certifi` - HTTP document fetching
- `pluggy` - Plugin hook system
- `tqdm` - Progress tracking
- `langcodes` - BCP-47 language tag normalization

**Heavy ML & Vision Optional Extras (docling standard):**
- `torch` / `torchvision` - Deep learning framework
- `transformers` - Model hub integration
- `easyocr` / `rapidocr-onnxruntime` / `pytesseract` - Pluggable OCR engines
- `docling-parse` - Native C++ PDF parser

## Configuration

**Environment Configuration:**
- Managed via `docling.datamodel.settings.settings` using `pydantic-settings`.
- Environment variable prefix: `DOCLING_` (e.g., `DOCLING_DEVICE=cuda`, `DOCLING_PERF_DOC_BATCH_CONCURRENCY=4`, `DOCLING_GEN_TEST_DATA=1`).

**Build & Tooling Configuration:**
- Root `pyproject.toml` defines workspace members (`packages/docling`, `packages/docling-client`, `packages/docling-slim`), ruff lint rules, and pytest markers.
- `tach.toml` defines 6 architectural layers (`foundation`, `core`, `models`, `pipeline`, `clients`, `entrypoints`) with forbidden circular imports.
- `Makefile` provides standardized commands: `make setup`, `make test`, `make check`, `make validate`, `make fix`.

## Platform Requirements

**Development:**
- Python 3.10+
- `uv` package manager
- Optional: C++ compiler for native extensions, OCR libraries (Tesseract binaries if using CLI Tesseract)

**Production:**
- Standalone CLI execution, Python library embedding, or Docker containerized microservice via Docling Serve.
- Runs on CPU-only nodes, Apple Silicon (MPS / MLX), or CUDA GPUs.

---
*Stack analysis: 2026-10-15*
*Update after major dependency changes*
