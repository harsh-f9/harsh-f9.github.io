# Unstructured (OSS Pre-Processing Toolkit)

## What This Is

`unstructured` is the foundational open-source Python library for ingesting, partitioning, cleaning, chunking, and embedding unstructured documents (PDFs, Microsoft Word, PowerPoint, Excel, HTML, Markdown, emails, images, and audio). It deconstructs raw, messy, multimodal files into clean, structured, semantic `Element` dictionaries and chunks designed specifically for retrieval-augmented generation (RAG) and downstream LLM application development.

## Core Value

Reliably transform any raw document of any format into semantically enriched, structured chunks with preserved layout hierarchy and provenance metadata, enabling high-precision LLM retrieval without format-specific custom parser pipelines.

## Business Context

- **Customer**: AI engineers, enterprise software architects, data scientists, and developers building LLM applications, semantic search engines, enterprise search platforms, and automated document analysis workflows.
- **Revenue model**: Open-source core library freely available under Apache 2.0; monetized via commercial hosted services (Unstructured Serverless API, Transform v2 API, and Unstructured Platform Enterprise).
- **Success metric**: Document parsing accuracy (table cell spatial and content precision, text extraction adjusted CCT), throughput/latency, and developer adoption across the LLM ecosystem.
- **Strategy notes**: Maintain broad format compatibility and modular local execution in OSS, while offering enterprise-scale hosted layout transformers and multimodal APIs for mission-critical production workloads.

## Requirements

### Validated

- [x] Multi-format partitioning covering 25+ document types (PDF, DOCX, PPTX, XLSX, HTML, EML, MSG, Markdown, CSV, Audio, Images).
- [x] Universal `partition()` auto-dispatcher with multi-tier MIME/libmagic/magic-byte/extension sniffing.
- [x] Structured domain representation: `Element` base class with `Title`, `NarrativeText`, `ListItem`, `Header`, `Footer`, `Table`, `Image`, `Formula`, `Address`, `CheckBox`.
- [x] Provenance & layout metadata: page numbers, coordinates, detection probabilities, parent-child relationship tracking, and deterministic SHA-256 hash IDs.
- [x] Multi-strategy PDF processing: `fast` (direct extraction via `pdfminer`), `hi_res` (computer vision layout models + OCR), `ocr_only` (poppler rasterization + Tesseract/PaddleOCR), and `auto` dynamic heuristic routing.
- [x] Table structure recognition extracting raw text and structured `text_as_html` markup.
- [x] Context-aware chunking (`chunk_by_title` and `basic` chunking) with section boundary preservation, multipage section support, and table header carryover.
- [x] Functional text cleaning and regex entity extraction bricks.
- [x] Direct vector embedding integration (`unstructured.embed`) supporting OpenAI, Bedrock, VertexAI, VoyageAI, and HuggingFace.
- [x] Downstream staging adapters (`unstructured.staging`) for Weaviate, Argilla, Label Studio, Prodigy, Pandas DataFrames, and HuggingFace datasets.

### Active

- [ ] Optimization of memory utilization and lazy streaming generators for ultra-large (1000+ page) PDF documents.
- [ ] Improved multimodal image/figure captioning and visual bounding box grounding.
- [ ] Migration and consolidation of legacy staging serde functions into `unstructured.documents.elements`.
- [ ] Expansion of strict Pyright type checking across remaining legacy modules.

### Out of Scope

- **Building a proprietary vector database**: `unstructured` stages elements for external vector databases (Weaviate, Pinecone, Qdrant) rather than storing vectors internally.
- **Replacing general-purpose LLM orchestration**: `unstructured` focuses on ETL pre-processing and chunking; frameworks like LangChain, LlamaIndex, or Haystack consume its outputs.
- **GUI or Desktop Application**: The core project remains an embeddable Python library and CLI tool.

## Context

The explosion of Large Language Models (LLMs) created an urgent bottleneck: enterprises hold 80-90% of their operational knowledge in messy, unstructured documents (PDF manuals, scanned invoices, legal contracts, PowerPoint presentations, internal emails). Standard text extractors destroy layout information, mangle multi-column reading orders, lose tables, and truncate context. `unstructured` bridges this gap by treating document parsing as a semantic computer vision + NLP task.

## Constraints

- **Tech Stack**: Python `>=3.11, <3.14`, Hatchling build backend, `uv` package management.
- **System Dependencies**: Relies on external binaries (`libmagic`, `poppler-utils`, `tesseract-ocr`, `libreoffice`) for high-fidelity OCR and rendering.
- **Platform Compatibility**: Supports Linux (`x86_64`, `aarch64`), macOS (`arm64`), and Windows (`x86_64`), with platform-specific guards for CUDA/Torch/Paddle on Windows.
- **Licensing**: Apache 2.0 open-source license.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| **Modular Extras Matrix** | Core install remains lightweight (<50MB) while heavy vision/OCR/cloud dependencies are optional (`[all-docs]`, `[pdf]`, `[audio]`). | ✓ Good |
| **Unified `Element` Hierarchy** | Standardizing all document formats into a common list of `Element` dataclasses allows universal chunking, cleaning, and staging pipelines. | ✓ Good |
| **Deterministic Hash IDs** | Generate SHA-256 hashes from text, page number, sequence, and filename rather than random UUIDs to support idempotent vector DB indexing. | ✓ Good |
| **Separation of Ingest vs Core** | Decoupling 50+ cloud connectors into `unstructured-ingest` keeps core library focused purely on file-to-elements transformation. | ✓ Good |
| **Decorators for Cross-Cutting Concerns** | Composing partitioners with `@process_metadata`, `@add_chunking_strategy`, and `@partition_runtime_telemetry` provides clean separation of concerns. | ✓ Good |

---
*Last updated: 2026-10-15 after brownfield onboarding mapping*
