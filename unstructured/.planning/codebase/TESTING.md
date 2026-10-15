---
last_mapped_commit: 5c1115c5d07184f02e11020783a2370769014dfb
last_mapped_at: 2026-10-15
---
# Testing Strategies & Test Suite Architecture

**Analysis Date:** 2026-10-15

## Test Framework & Tooling

The test architecture relies on `pytest` combined with specialized plugins to ensure high coverage and multi-platform reliability:

- **Runner**: `pytest>=9.0.2`
- **Parallel Execution**: `pytest-xdist>=3.8.0` (`pytest -n auto`)
- **Coverage**: `pytest-cov>=7.0.0`
- **Mocking**: `pytest-mock>=3.15.1` (fixtures `mocker`)
- **Time Freezing**: `freezegun>=1.5.5` for deterministic timestamp testing
- **Benchmarking**: `pytest-benchmark>=5.2.3` for layout model and OCR performance profiling

---

## Test Directory Layout

The test suite directly mirrors the source tree within `test_unstructured/`:

```
test_unstructured/
├── chunking/               # Tests for chunk_by_title, basic chunking, table chunking
│   ├── test_basic.py
│   ├── test_dispatch.py
│   └── test_title.py
├── cleaners/               # Tests for regex extractors, bullet cleaners, ligatures
│   ├── test_core.py
│   └── test_extract.py
├── documents/              # Tests for Element hierarchy, Coordinates, Metadata, Serialization
│   ├── test_coordinates.py
│   ├── test_elements.py
│   └── test_ontology.py
├── embed/                  # Unit tests with mocked network calls for OpenAI, Bedrock, VertexAI
├── file_utils/             # Tests for MIME sniffing, zip differentiation, encoding detection
│   ├── test_encoding.py
│   └── test_filetype.py
├── partition/              # Individual partitioner test suites across all 25+ file types
│   ├── pdf_image/          # Deep tests for PDF strategies (fast, hi_res, OCR fallbacks)
│   ├── test_auto.py        # Automatic routing tests
│   ├── test_docx.py
│   ├── test_html.py
│   ├── test_pdf.py
│   ├── test_pptx.py
│   └── ...
├── staging/                # Tests for serialization to JSON, Pandas, Weaviate, HuggingFace
└── test_unstructured_ingest/ # Separate connector & cloud integration test suite
```

---

## Test Corpus: `example-docs/`

The repository maintains a comprehensive test fixture corpus in `example-docs/`:
- **PDFs**: `layout-parser-paper-fast.pdf`, multi-column layouts, forms, scanned pages, rotated pages, password-protected PDFs.
- **Office Docs**: Real and synthetic `.docx`, `.doc`, `.pptx`, `.ppt`, `.xlsx`, `.csv`.
- **Media**: `.eml` email trees with attachments, `.msg` binary Outlook files, `.wav`/`.mp3` audio clips.
- **Web & Markup**: `.html` with complex nested tables, `.xml`, `.md`, `.epub`, `.rtf`.

---

## Common Testing Patterns

### 1. File vs. Stream Equivalence Tests

Every partitioner is systematically tested to confirm that partitioning a file from disk produces identical output to passing an in-memory byte stream (`io.BytesIO`):

```python
def test_partition_pdf_from_file_and_stream_produce_identical_elements():
    filename = "example-docs/layout-parser-paper-fast.pdf"
    with open(filename, "rb") as f:
        stream_elements = partition_pdf(file=f)
    file_elements = partition_pdf(filename=filename)
    
    assert file_elements == stream_elements
```

### 2. External Engine & Subprocess Mocking

When testing PDF or OCR logic in environments that lack GPU acceleration or native Tesseract binaries:
- `unittest.mock.patch` intercepts calls to `pdf2image.convert_from_path` and `pytesseract.image_to_data`.
- Synthetic bounding boxes and OCR word arrays are returned to test the downstream element assembly without hardware dependencies.

### 3. Golden Baseline Assertions

Partition tests verify that:
- Elements have expected classifications (e.g. `isinstance(elements[0], Title)`).
- Metadata fields are correctly extracted (e.g., `element.metadata.page_number == 1`).
- Bounding box coordinates exist and are non-negative when layout analysis is enabled.
- Table elements contain populated `element.metadata.text_as_html` with valid HTML `<table>` tags.

---

## Execution Commands

### Running Core Unit Tests

```bash

# Run all core tests

pytest test_unstructured/

# Run fast tests in parallel across CPU cores

pytest test_unstructured/ -n auto

# Run tests for a specific partitioner with coverage

pytest test_unstructured/partition/test_pdf.py --cov=unstructured.partition.pdf
```

### Running Ingest Tests

```bash

# Ingest connector suite

pytest test_unstructured_ingest/
```

### Evaluation & Metrics Benchmarking

The `unstructured.metrics` subpackage allows developers to run quantitative benchmarks against ground-truth document datasets:

```python
from unstructured.metrics.evaluate import measure_text_extraction_accuracy

# Measures Character Error Rate (CER) and Word Error Rate (WER)

results = measure_text_extraction_accuracy(output_dir, ground_truth_dir)
```
