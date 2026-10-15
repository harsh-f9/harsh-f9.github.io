---
last_mapped_commit: 6fadbae317b09c4dd4051c0f1fc1746c6baf04bc
last_mapped_at: 2026-10-15
---
# Technical Concerns & Areas of Risk

**Analysis Date:** 2026-10-15

## 1. Memory Consumption & Model Footprint

### High VRAM / RAM Usage

- Running full multi-stage PDF pipelines ([`StandardPdfPipeline`](file:///C:/Projects1/Others/docling/docling/pipeline/standard_pdf_pipeline.py)) involves loading multiple deep learning models simultaneously:
  1. Layout Object Detection (~100-300MB)
  2. TableFormer / TableStructureModel (~300-500MB)
  3. EasyOCR / RapidOCR (~100-200MB)
  4. Vision-Language Model / Granite Vision (2B+ parameters, ~4-8GB VRAM)
- **Risk:** High-resolution multi-page PDF documents processed concurrently can lead to Out-Of-Memory (OOM) crashes on consumer GPUs or low-spec cloud instances.
- **Mitigation:**
  - Use `docling-slim` for non-vision workflows.
  - Use [`NativePdfPipeline`](file:///C:/Projects1/Others/docling/docling/pipeline/native_pdf_pipeline.py) when PDF text is already digitized and programmatic.
  - Offload conversion workloads to remote GPU clusters using [`DoclingClient`](file:///C:/Projects1/Others/docling/docling/service_client/client.py).

---

## 2. Dependency Size & Distribution Weight

### Monolithic Python Wheels

- The standard `docling` package requires PyTorch, torchvision, transformers, and multiple OCR libraries, resulting in multi-gigabyte virtual environments.
- **Risk:** Slow cold-start times in serverless environments (AWS Lambda, Google Cloud Run) and Docker container bloat.
- **Mitigation:** The `docling-slim` split (`packages/docling-slim/`) provides a minimal ~50MB library footprint with fine-grained extras (`[format-pdf]`, `[format-office]`).

---

## 3. Concurrency & Python GIL Bottlenecks

### Threading in StandardPdfPipeline

- While C++ extensions (`docling-parse`) and ONNX/PyTorch backends release the Global Interpreter Lock (GIL) during computation, Python-level page assembly, spatial tree queries (`rtree`), and graph traversal in reading order models execute on the main Python runtime.
- **Risk:** CPU core saturation without linear throughput gains when `doc_batch_concurrency` is configured too high.
- **Mitigation:** Rely on process-level scaling (via Docling Serve or Celery worker pools) rather than high intra-process thread counts for massive batch jobs.

---

## 4. Reading Order & Visual Separator Fragility

### Column Separators vs. Table Grids

- The separator-aware reading order model ([`reading_order_rb.py`](file:///C:/Projects1/Others/docling/docling/models/postprocessing/reading_order_rb.py)) uses visible shape lines to determine column barriers.
- **Risk:** Decorative border lines, underlined headers, or complex multi-line tables can be falsely identified as column barriers, altering reading sequence.
- **Mitigation:** Strict candidate filtering rejects lines crossing text or graphic bounding boxes; transient barrier nodes are pruned before document assembly.

---

## 5. Schema Evolution & Downstream RAG Breakage

### AST Stability

- Downstream GenAI applications depend on stable identifiers and JSON schemas for `DoclingDocument`.
- **Risk:** Modifying node hierarchies or provenance bounding box coordinate systems can silently break vector chunking and citation engines.
- **Mitigation:** Canonical contracts are maintained in `docling-core` with strict Pydantic v2 validation and backward compatibility regression tests.

---
*Concerns analysis: 2026-10-15*
