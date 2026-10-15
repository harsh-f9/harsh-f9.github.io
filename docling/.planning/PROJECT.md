# Docling

## What This Is

Docling is an open-source Python SDK and CLI for parsing and converting complex documents (PDFs, Office formats, HTML, Markdown, images, audio, and XML) into a unified, rich `DoclingDocument` representation tailored for generative AI, LLM reasoning, and downstream RAG workflows. It bridges raw multi-modal business documents and AI applications by accurately preserving visual layout, reading order, complex table structures, code blocks, formulas, and document metadata.

## Core Value

Convert any document format reliably into a single, high-fidelity, structure-preserving data representation that generative AI models can reason over without losing semantic context or spatial provenance.

## Business Context

- **Customer / Target Audience**: AI engineers, enterprise software developers, LLM application builders, data scientists, and automated document processing pipelines.
- **Problem Solved**: Standard document parsers either extract raw unformatted text (losing columns, tables, and reading order) or output heavy proprietary formats that require bespoke post-processing. OCR engines alone do not understand document hierarchy. Docling unifies OCR, layout object detection, table structure recovery, and multi-format parsing under one open standard.
- **Primary Use Cases**:
  - Retrieval-Augmented Generation (RAG) indexing.
  - Enterprise document automation (invoices, financial reports, legal filings, technical whitepapers).
  - Multimodal AI training and evaluation dataset generation.
- **Success Metrics**: High extraction fidelity on challenging two-column and tabular PDFs, low latency on programmatic documents, minimal memory footprint for serverless environments via `docling-slim`, and zero semantic loss during format translation.

## Requirements

### Validated & Core Capabilities

- **Unified Multi-Format Ingestion**: Convert PDF, DOCX, PPTX, XLSX, ODT, ODS, ODP, HTML, Markdown, AsciiDoc, EPUB, XML (USPTO, JATS, DocLang, XBRL), Audio, Video, and Images into `DoclingDocument`.
- **Hybrid PDF Conversion**: Dual-path parsing combining fast programmatic vector extraction (`docling-parse`) with deep learning vision models when text is scanned or missing.
- **Table Structure Recovery**: Extract complex bordered and borderless tables with row/column spans using TableFormer and OTSL token sequences.
- **Reading Order Reconstruction**: Topological spatial graph sort augmented with vector shape barrier lines to handle complex multi-column scientific papers.
- **Hierarchical & Hybrid Chunking**: Context-aware document chunking respecting section headers, lists, and table boundaries for high-precision RAG embeddings.
- **Modular Packaging**: Zero-copy monorepo separating a minimal ~50MB library (`docling-slim`) from full ML extras (`docling`) and client SDK (`docling-client`).
- **Remote Service Integration**: Asynchronous, job-based HTTP client (`DoclingClient`) connecting to distributed Docling Serve GPU clusters.

### Active & In-Progress Initiatives

- **MinerU2.5-Pro VLM Integration**: Two-step full-page vision-language model parsing with Transformers, MLX, and OpenAI-compatible API engines.
- **VLM Pipeline Streaming**: Streaming token generation and partial document rendering for low-latency visual conversions.
- **Advanced Formula & Code VLM Extraction**: LaTeX formula recovery and code block language detection.

### Out of Scope

- **Desktop GUI**: Docling provides CLI and Python SDK; visual user interfaces belong to separate frontend products or Docling Serve Web UI.
- **Direct Vector Database Hosting**: Docling produces structured chunks and metadata; database storage and vector embedding indexing belong to vector stores (Milvus, Qdrant, Chroma).

## Constraints

- **Compatibility**: Python 3.10+ compatibility across Linux, macOS (Apple Silicon / Intel), and Windows.
- **Architecture Boundaries**: Acyclic layer boundaries strictly enforced via `tach` (`foundation` -> `core` -> `models` -> `pipeline` -> `clients` -> `entrypoints`).
- **Dependency Isolation**: Base library (`docling-slim`) must never import PyTorch, torchvision, or transformers at root import time.
- **Documentation Standards**: Simplified Technical English (ASD-STE100) across documentation and code comments.

## Key Decisions

| Decision | Rationale | Outcome |
| :--- | :--- | :--- |
| **Unified AST Representation** | Downstream GenAI tools should not care whether the input was a DOCX, PDF, or HTML page. | ✓ Excellent (Universal interoperability) |
| **Separation of docling-slim & docling** | Heavy PyTorch/CUDA dependencies prevented adoption in serverless and lightweight container environments. | ✓ Excellent (Reduced base footprint to ~50MB) |
| **Pluggable OCR & Model Factories** | Users need freedom to choose between EasyOCR, Tesseract, RapidOCR, Mac Vision, or remote KServe without code changes. | ✓ Excellent (Decoupled model lifecycle via `pluggy`) |
| **Dual-Path PDF Pipeline** | Running heavy neural networks on digital PDFs with embedded text is wasteful. Native PDF pipeline runs 10x-50x faster. | ✓ Excellent (Dramatic throughput optimization) |
| **Visible Shape Rule Barriers** | Multi-column documents with subtle separator lines were misread in standard reading order passes. | ✓ Good (Fixed complex reading order regressions) |

---
*Last updated: 2026-10-15*
