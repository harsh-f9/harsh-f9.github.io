---
last_mapped_commit: 6fadbae317b09c4dd4051c0f1fc1746c6baf04bc
last_mapped_at: 2026-10-15
---
# Testing Practices & Framework

**Analysis Date:** 2026-10-15

## Framework & Tooling

- **Test Runner:** `pytest`
- **Execution Command:** `uv run pytest -v tests` (or `make test`)
- **Coverage & Boundaries:** Module coverage verified by `scripts/check_tach_module_coverage.py`.

---

## Test Organization

The [`tests/`](file:///C:/Projects1/Others/docling/tests/) directory contains over 130 test files structured by domain:

### 1. Ingestion Backend Tests

- Verifies format parsing fidelity and edge cases for Office, PDF, XML, and Web documents:
  - [`test_backend_msword_lists.py`](file:///C:/Projects1/Others/docling/tests/test_backend_msword_lists.py)
  - [`test_backend_pptx_charts.py`](file:///C:/Projects1/Others/docling/tests/test_backend_pptx_charts.py)
  - [`test_backend_opendocument.py`](file:///C:/Projects1/Others/docling/tests/test_backend_opendocument.py)
  - [`test_backend_pdfium.py`](file:///C:/Projects1/Others/docling/tests/test_backend_pdfium.py)
  - [`test_backend_xbrl.py`](file:///C:/Projects1/Others/docling/tests/test_backend_xbrl.py)

### 2. Stage Model & Computer Vision Tests

- Exercises OCR engines, layout object detection, table structure, and reading order:
  - [`test_e2e_ocr_conversion.py`](file:///C:/Projects1/Others/docling/tests/test_e2e_ocr_conversion.py)
  - [`test_table_structure_model_v2.py`](file:///C:/Projects1/Others/docling/tests/test_table_structure_model_v2.py)
  - [`test_readingorder_table_orientation.py`](file:///C:/Projects1/Others/docling/tests/test_readingorder_table_orientation.py)
  - [`test_reading_order_pdf_snapshots.py`](file:///C:/Projects1/Others/docling/tests/test_reading_order_pdf_snapshots.py)
  - [`test_picture_description_vlm_engine_model.py`](file:///C:/Projects1/Others/docling/tests/test_picture_description_vlm_engine_model.py)

### 3. Pipeline & Concurrency Tests

- Verifies thread isolation, backpressure, queue shutdown, and memory leaks:
  - [`test_threaded_pipeline.py`](file:///C:/Projects1/Others/docling/tests/test_threaded_pipeline.py)
  - [`test_pipeline_cache.py`](file:///C:/Projects1/Others/docling/tests/test_pipeline_cache.py)
  - [`test_native_pdf_pipeline.py`](file:///C:/Projects1/Others/docling/tests/test_native_pdf_pipeline.py)

### 4. Service Client & CLI Tests

- Verifies remote client payloads, retry behaviors, and CLI argument parsing:
  - [`test_cli.py`](file:///C:/Projects1/Others/docling/tests/test_cli.py)
  - [`test_service_client_integration.py`](file:///C:/Projects1/Others/docling/tests/test_service_client_integration.py)
  - [`test_service_client_payload_fidelity.py`](file:///C:/Projects1/Others/docling/tests/test_service_client_payload_fidelity.py)

---

## Reference (Golden) Data Protocol

Docling compares end-to-end conversion outputs against committed reference snapshots in `tests/data/`.

### Regenerating Reference Data

When document conversion models, parsing logic, or AST formats intentionally change:

```bash
DOCLING_GEN_TEST_DATA=1 uv run pytest tests/test_e2e_conversion.py
```

**Important:** Never regenerate golden data without carefully inspecting the resulting `git diff` to ensure unintended regressions have not occurred.

---

## Non-Trivial Test Policy

1. **Verify Real Contracts:** Tests verify actual business behavior, edge cases, or regression boundaries.
2. **Avoid Trivial Tests:** Do not write tests that merely assert trivial class instantiation or validate standard library mechanics.
3. **Restrict Mocking:** Avoid heavy mocking. Use real backends and document samples unless exercising genuine remote external failure modes (e.g. network timeout in [`test_service_client_fake_service.py`](file:///C:/Projects1/Others/docling/tests/test_service_client_fake_service.py)).

---
*Testing analysis: 2026-10-15*
