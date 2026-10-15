---
last_mapped_commit: 5c1115c5d07184f02e11020783a2370769014dfb
last_mapped_at: 2026-10-15
---
# Directory Structure & Layout

**Analysis Date:** 2026-10-15

## Repository Organization

```
unstructured/
├── .github/                       # CI/CD workflows, issue templates, actions
├── docker/                        # Multi-platform container definitions (Wolfi Linux)
├── example-docs/                  # Rich corpus of sample files for testing (25+ formats)
│   ├── eml/                       # Sample email messages
│   ├── layout-parser-paper-*.pdf  # Academic papers for PDF testing
│   ├── fake*.docx, pptx, xlsx     # Synthetic Microsoft Office test documents
│   └── ...
├── scripts/                       # Dev tooling, release automation, benchmarks
├── test_unstructured/             # Comprehensive pytest test suite for core library
│   ├── chunking/                  # Tests for basic & title chunking
│   ├── cleaners/                  # Tests for text cleaners & extractors
│   ├── documents/                 # Tests for Element hierarchy and metadata
│   ├── embed/                     # Tests for embedding provider clients
│   ├── file_utils/                # Tests for filetype and encoding detection
│   ├── partition/                 # Tests for individual format partitioners
│   └── staging/                   # Tests for export and staging adapters
├── test_unstructured_ingest/      # Integration test harness for ingest connectors
├── typings/                       # MyPy/Pyright type stubs for untyped dependencies
├── unstructured/                  # Primary source package
└── ... root configuration files (pyproject.toml, uv.lock, Makefile, Dockerfile)
```

---

## Detailed Source Breakdown: `unstructured/`

### 1. Root Utilities & Entry Points

- `unstructured/cli.py`: Command-line interface entry point (`unstructured` command).
- `unstructured/logger.py`: Centralized logging configuration using standard Python `logging`.
- `unstructured/errors.py`: Custom exception hierarchy (`UnsupportedFileFormatError`, `DecompressedSizeExceededError`).
- `unstructured/safe_http.py`: Hardened HTTP client preventing SSRF and blocking oversized payloads.
- `unstructured/telemetry.py`: Telemetry decorator tracking partitioner usage and document types.
- `unstructured/utils.py`: Reflection helpers, dependency checking (`dependency_exists`), arguments mapping.

---

### 2. `unstructured/documents/` (Domain Model)

- `elements.py`:
  - Definitive classes: `Element`, `Text`, `Title`, `NarrativeText`, `ListItem`, `Header`, `Footer`, `Table`, `TableChunk`, `CompositeElement`, `Image`, `Formula`, `CheckBox`, `FormKeysValues`.
  - `ElementMetadata`: Class containing all metadata attributes (`filename`, `coordinates`, `text_as_html`, `page_number`, `parent_id`, etc.).
  - `ConsolidationStrategy`: Logic for merging metadata across chunked elements.
  - `assign_and_map_hash_ids()`: Deterministic SHA-256 element identifier generation.
- `coordinates.py`: Coordinate systems (`PixelSpace`, `RelativeCoordinateSystem`, `Point`, `Points`).
- `mappings.py`: Cross-model category mapping (e.g., mapping layout model outputs to `ElementType`).
- `ontology.py`: Ontological definitions and tag classifications.
- `html_sanitization.py`: HTML cleaning using `nh3`.

---

### 3. `unstructured/file_utils/` (File Inspection & Typing)

- `model.py`:
  - `FileType` enum: Single source of truth for all file types, extensions, MIME types, required pip extras, and partitioner module references.
- `filetype.py`:
  - Multi-tier `detect_filetype()` function.
  - Specialized differentiators (`_ZipFileDifferentiator`, OLE storage inspectors).
- `encoding.py`:
  - File encoding detection using `charset-normalizer`.
- `file_conversion.py`:
  - LibreOffice subprocess wrapper for converting `.doc`, `.ppt`, `.xls` to modern OpenXML formats.

---

### 4. `unstructured/partition/` (Document Extractors)

- `auto.py`: High-level entry point `partition()` with automatic routing.
- `strategies.py`: Strategy constants (`fast`, `hi_res`, `ocr_only`, `auto`).
- `pdf.py`: PDF orchestrator managing `pdfminer`, OCR engines, and layout models.
- `pdf_image/`:
  - `ocr.py`: OCR pipeline interfacing with Tesseract and PaddleOCR.
  - `pdfminer_processing.py`: Low-level PDF stream parsing.
  - `inference_utils.py`: Layout model bounding-box alignment.
- Format-Specific Partitioners:
  - `docx.py` / `doc.py`: Microsoft Word document processing.
  - `pptx.py` / `ppt.py`: Microsoft PowerPoint presentation processing.
  - `xlsx.py` / `csv.py` / `tsv.py`: Spreadsheet and tabular data extraction.
  - `html/`: HTML parsing and DOM tree walk.
  - `email.py` / `msg.py`: RFC-822 EML and Outlook `.msg` parsing.
  - `audio.py`: Whisper-based audio transcription with time boundaries.
  - `image.py`: Bitmap image parsing via OCR / Vision APIs.
  - `xml.py`, `md.py`, `rst.py`, `rtf.py`, `epub.py`, `org.py`: Markup and text formats.
  - `json.py`, `ndjson.py`, `text.py`: Structured data formats.
  - `api.py`: Remote Unstructured API delegation.

---

### 5. `unstructured/chunking/` (RAG Optimization)

- `dispatch.py`: `@add_chunking_strategy` decorator wrapping partitioners.
- `basic.py`: `chunk_elements()` sequential threshold chunking.
- `title.py`: `chunk_by_title()` heading-preserving semantic chunking.
- `base.py`: Low-level chunk consolidation and text boundary splitting.

---

### 6. `unstructured/cleaners/` & `unstructured/nlp/`

- `cleaners/core.py`: Ligature removal, unicode bullet cleaning, whitespace normalization.
- `cleaners/extract.py`: Regex extraction for emails, phone numbers, IP addresses, dates.
- `cleaners/translate.py`: Translation pipelines.
- `nlp/tokenize.py`: Sentence and word boundary tokenization.
- `nlp/patterns.py`: Compiled regular expressions for text classification.

---

### 7. `unstructured/embed/` (Dense Vector Embedding)

- `interfaces.py`: `BaseEmbeddingEncoder` abstract interface.
- Implementations: `openai.py`, `bedrock.py`, `vertexai.py`, `huggingface.py`, `voyageai.py`, `octoai.py`, `mixedbreadai.py`.

---

### 8. `unstructured/staging/` (Downstream Adapters)

- `base.py`: Conversion to/from dicts, JSON, NDJSON, and Pandas DataFrames.
- `weaviate.py`: Weaviate vector database object formatter.
- `argilla.py`, `label_studio.py`, `prodigy.py`, `label_box.py`: Annotation exports.
- `huggingface.py`: HuggingFace dataset generator.

---

### 9. `unstructured/metrics/` (Evaluation Framework)

- `evaluate.py`: Benchmark runner for text extraction quality.
- `text_extraction.py`: Character Error Rate (CER), Word Error Rate (WER) metrics.
- `table_structure.py` & `table/`: Table cell and structure accuracy metrics.
- `element_type.py`: Precision/Recall for layout element classification.
