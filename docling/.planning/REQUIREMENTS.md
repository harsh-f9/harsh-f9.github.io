# Requirements

**Project:** Docling
**Baseline:** v2.139.0

## 1. Core Document Abstraction & Pipelines (CORE)

- **[REQ-CORE-01] Universal Document Representation**: The system must serialize all parsed documents into a canonical `DoclingDocument` AST structure with hierarchical node trees (`GroupItem`, `SectionHeaderItem`, `TextItem`, `TableItem`, `PictureItem`).
- **[REQ-CORE-02] Spatial Provenance**: Every extracted item must maintain its bounding box coordinates, page index, and origin reference relative to the source page canvas.
- **[REQ-CORE-03] Multi-Pipeline Dispatch**: `DocumentConverter` must automatically route input files based on MIME type or format options to the appropriate pipeline (`SimplePipeline`, `StandardPdfPipeline`, `NativePdfPipeline`, `VlmPipeline`, `AsrPipeline`).
- **[REQ-CORE-04] Bounded Queue Concurrency**: Multi-stage PDF processing must use isolated bounded queues with back-pressure to prevent memory runaway during concurrent batch execution.

## 2. Ingestion Backends & Format Support (FORMAT)

- **[REQ-FORMAT-01] PDF Native & Vision**: Support both digital PDF parsing via `docling-parse` C++ bindings and scanned PDF parsing with OCR fallback.
- **[REQ-FORMAT-02] Office Documents**: Parse Microsoft Word (.docx), PowerPoint (.pptx), Excel (.xlsx), and OpenDocument (.odt, .ods, .odp) formats preserving styles, tables, and outlines.
- **[REQ-FORMAT-03] Web & Markup**: Parse HTML, XHTML, Markdown, AsciiDoc, and LaTeX into structured semantic nodes.
- **[REQ-FORMAT-04] Multimodal Media**: Extract audio transcriptions using OpenAI Whisper models and process video frames through visual sampling.
- **[REQ-FORMAT-05] Specialized XML**: Support domain-specific XML dialects including USPTO patents, JATS academic articles, DocLang archives, and XBRL financial reports.

## 3. Computer Vision & Stage Models (MODEL)

- **[REQ-MODEL-01] Layout Object Detection**: Segment document pages into semantic regions (headers, paragraphs, figures, tables, code blocks) using deep learning object detectors.
- **[REQ-MODEL-02] Pluggable OCR Factory**: Enable dynamic selection between EasyOCR, Tesseract, RapidOCR, Mac Vision, Nemotron, or KServe v2 via `pluggy` plugins.
- **[REQ-MODEL-03] Table Structure Extraction**: Accurately predict cell coordinates, row/col spans, and OTSL structure tokens for complex financial and scientific tables.
- **[REQ-MODEL-04] Rule-Based Reading Order**: Sort document elements into natural reading flow using spatial topological rules and vector separator line boundaries.
- **[REQ-MODEL-05] Vision-Language Modeling (VLM)**: Support direct end-to-end page understanding and picture captioning using models like Granite Vision, SmolVLM, Qwen2-VL, and MinerU2.5-Pro across Transformers, vLLM, and MLX engines.

## 4. Chunking & Downstream RAG (CHUNK)

- **[REQ-CHUNK-01] Hierarchical Chunking**: Partition documents into coherent token-bounded segments that respect section headers, lists, and hierarchical document nesting.
- **[REQ-CHUNK-02] Hybrid Chunking**: Combine structural boundary detection with tokenizer-specific token counting to prevent cutting sentences or table rows midway.
- **[REQ-CHUNK-03] Rich Metadata Preservation**: Attach page numbers, bounding boxes, document titles, and heading path breadcrumbs to every emitted chunk.

## 5. Architecture, Packaging & Distribution (DIST)

- **[REQ-DIST-01] Minimal Slim Package**: Provide `docling-slim` (~50MB) with an 8-package core dependency set for lightweight and serverless environments.
- **[REQ-DIST-02] Monorepo Workspace**: Maintain single shared source code in `docling/` while publishing separate wheels for `docling`, `docling-slim`, and `docling-client`.
- **[REQ-DIST-03] Layer Boundary Isolation**: Enforce zero circular dependencies across Tach architectural layers (`foundation`, `core`, `models`, `pipeline`, `clients`, `entrypoints`).

## 6. Service Client & Remote Execution (CLIENT)

- **[REQ-CLIENT-01] Synchronous & Asynchronous SDK**: Provide `DoclingClient` and `_AsyncDoclingClient` for communicating with remote Docling Serve instances.
- **[REQ-CLIENT-02] Job Lifecycle Management**: Support job submission, status polling, webhooks, and streaming result retrieval.
- **[REQ-CLIENT-03] Payload Fidelity**: Ensure remote conversion results match local SDK `ConversionResult` structures byte-for-byte.

---
*Requirements status: Active & Maintained*
