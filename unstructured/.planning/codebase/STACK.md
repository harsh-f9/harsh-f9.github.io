---
last_mapped_commit: 5c1115c5d07184f02e11020783a2370769014dfb
last_mapped_at: 2026-10-15
---
# Technology Stack

**Analysis Date:** 2026-10-15

## Overview

`unstructured` is an enterprise-grade Python library designed to transform unstructured and semi-structured documents (PDFs, Microsoft Office documents, HTML, images, emails, audio, spreadsheets, etc.) into structured data elements optimized for LLM ingestion, semantic search, and RAG (Retrieval Augmented Generation) pipelines.

---

## Languages & Runtimes

| Component | Specification | Details |
|-----------|---------------|---------|
| **Language** | Python | Supported versions: `>=3.11, <3.14` (3.11, 3.12, 3.13) |
| **Type Checking** | Pyright | Strict mode enabled (`typeCheckingMode = "strict"`), Linux target platform, stubPath `./typings` |
| **Linting & Formatting** | Ruff | Configured with `line-length = 100`, `target-version = "py311"`, rules covering pyflakes, pycodestyle, isort, flake8-comprehensions, simplify, etc. |
| **Package Management** | `uv` & Hatchling | `pyproject.toml` with `hatchling` build-backend, lockfile managed via `uv.lock` |
| **Containerization** | Docker | Wolfi-based multi-platform images (`linux/amd64`, `linux/arm64`) with pre-compiled system utilities |

---

## Core Runtime Dependencies

These packages are installed in the base `unstructured` package without requiring extra flags:

| Package | Version Constraint | Primary Role |
|---------|-------------------|--------------|
| `beautifulsoup4` | `>=4.14.3, <5.0.0` | HTML/XML parsing and DOM element extraction |
| `html5lib` | `>=1.1, <2.0.0` | Permissive HTML5 tree construction |
| `lxml` | `>=5.0.0, <7.0.0` | High-performance C-based XML and HTML parsing, XPath processing |
| `nh3` | `>=0.3.0, <1.0.0` | Fast Rust-based HTML sanitization and safety guarantees |
| `charset-normalizer` | `>=3.4.4, <4.0.0` | Automatic character encoding detection and conversion |
| `filetype` | `>=1.2.0, <2.0.0` | Secondary pure-Python filetype detection based on magic numbers |
| `python-magic` | `>=0.4.27, <1.0.0` | Primary libmagic bindings for OS-level MIME detection |
| `python-oxmsg` | `>=0.0.2, <1.0.0` | Low-level extraction of Microsoft Outlook `.msg` compound binary formats |
| `python-iso639` | `>=2026.1.31, <2027.0.0`| ISO 639 language code conversions and normalization |
| `langdetect` | `>=1.0.9, <2.0.0` | Fast language identification from textual segments |
| `rapidfuzz` | `>=3.14.3, <4.0.0` | High-speed C++ fuzzy string matching for headers and metadata alignment |
| `regex` | `>=2024.0.0, <2027.0.0`| Extended regular expressions (Unicode scripts, boundary matches) |
| `requests` | `>=2.32.5, <3.0.0` | HTTP client for remote document fetching and API communication |
| `spacy` | `>=3.7.0, <4.0.0` | NLP primitives, sentence segmentation, tokenization |
| `numba` | `>=0.60.0, <1.0.0` | JIT compilation for computational numerical tasks |
| `numpy` | `>=1.26.0, <3.0.0` | Coordinate arrays, matrix operations, bounding box manipulation |
| `psutil` | `>=7.2.2, <8.0.0` | System memory and process profiling during heavy document OCR |
| `typing-extensions` | `>=4.15.0, <5.0.0`| Modern typing constructs (`ParamSpec`, `TypeAlias`, `TypeGuard`) |
| `unstructured-client`| `>=0.25.9, <1.0.0`| Official client for delegating to Unstructured Serverless/Enterprise APIs |
| `wrapt` | `>=2.1.1, <3.0.0` | Transparent method decoration (telemetry, caching, metadata decorators) |
| `filelock` | `>=3.12.0, <4.0.0` | Concurrency-safe model cache locking |
| `tqdm` | `>=4.67.3, <5.0.0` | Progress bars for batch partitioning operations |

---

## Modular "Extras" Dependency Matrix

`unstructured` isolates heavy computational libraries and domain-specific parsers behind `pip` extras:

### 1. Document Format Handlers

- **`docx` / `doc`**: `python-docx>=1.2.0` (Native OpenXML parser; `.doc` converted via LibreOffice or parsed via `olefile`)
- **`pptx` / `ppt`**: `python-pptx>=1.0.2` (Native PowerPoint slide, text shape, table extractor)
- **`xlsx` / `csv` / `tsv`**: `openpyxl>=3.1.5`, `pandas>=2.0.0`, `xlrd>=2.0.1`, `networkx>=3.2.0`, `msoffcrypto-tool>=6.0.0`
- **`epub`, `rtf`, `rst`, `odt`, `org`**: `pypandoc-binary>=1.16.2` (Universal document format bridge)
- **`md`**: `markdown>=3.10.1`

### 2. Vision, PDF & OCR

- **`pdf` / `image`**:
  - `pdfminer.six`: Fast native text/character/font bounding box extraction from PDF stream
  - `pypdf`, `pikepdf`: PDF object hierarchy, metadata, encryption, stream extraction
  - `pdf2image`: Converts PDF pages to PIL images via `pdftoppm`
  - `unstructured-inference`: Deep learning layout models (YOLOX, LayoutLMv3, detectron2)
  - `unstructured-pytesseract`: Tesseract OCR wrapper for optical character recognition
  - `pi-heif`: Support for HEIC/HEIF photos
  - `google-cloud-vision`: Optional Google Cloud Vision OCR integration
- **`paddleocr`**: `paddlepaddle>=3.3.0`, `unstructured-paddleocr==2.10.0` (Alternative OCR engine with strong CJK performance)

### 3. Multimodal & Advanced Intelligence

- **`audio`**: `openai-whisper>=20231117` (Speech-to-text with segment timestamps for audio files)
- **`chunking-tokens`**: `tiktoken>=0.12.0` (BPE token-accurate chunk boundaries for OpenAI models)
- **`huggingface`**: `torch`, `transformers`, `sentencepiece` (Local embeddings and transformers)
- **`ingest`**: `unstructured-ingest>=1.4.0` (Upstream / downstream connectors for 50+ cloud providers and vector DBs)

---

## System-Level OS Dependencies

Certain features rely on underlying native C/C++ utilities installed at the OS level:

1. **`libmagic`** (Required for MIME detection):
   - Linux: `apt-get install libmagic-dev`
   - macOS: `brew install libmagic`
   - Windows: Bundled or uses `python-magic-bin` / fallback `filetype`
2. **`poppler-utils`** (Required for PDF image rendering via `pdf2image`):
   - Provides `pdftoppm`, `pdfinfo`, `pdftotext`
3. **`tesseract-ocr`** (Required for OCR on scanned PDFs and images):
   - Native engine with language packs (e.g. `tesseract-ocr-eng`, `tesseract-ocr-deu`)
4. **`libreoffice`** (Optional, for legacy Microsoft formats `.doc`, `.ppt`, `.xls`):
   - Headless document conversion to modern OpenXML formats

---

## Build, Test & CI Tooling

- **Build System**: Hatchling (`[build-system] requires = ["hatchling"]`)
- **Testing**:
  - `pytest>=9.0.2`
  - `pytest-cov>=7.0.0`
  - `pytest-mock>=3.15.1`
  - `pytest-xdist>=3.8.0` (Parallel execution)
  - `pytest-benchmark>=5.2.3`
  - `freezegun>=1.5.5`
- **Linting & Code Quality**: Ruff (`ruff check`, `ruff format`), Pyright (`pyright .`)
- **Version Control Hooks**: Pre-commit (`.pre-commit-config.yaml` with Ruff, trailing whitespace, check-yaml)
