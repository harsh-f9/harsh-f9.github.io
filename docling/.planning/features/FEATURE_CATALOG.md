# Docling Feature Catalog & Engineering Blueprints

This catalog provides deep developer and business context for the core capabilities of Docling. Future AI coding agents or engineers can study these artifacts to understand **why** a feature was implemented, **where** it lives in the codebase, **how** it connects across the project, and **how to replicate** the architectural pattern in other projects.

---

## Feature Matrix

| ID | Feature | Business & Developer Rationale (Why) | Primary Implementation (Where) | System Integration (How) | Blueprint Link |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **FEAT-01** | **Unified Document Model** | Eliminates downstream data fragmentation across disparate file types. | `docling-core` (`DoclingDocument`), [`datamodel/document.py`](file:///C:/Projects1/Others/docling/docling/datamodel/document.py) | Connects all format backends directly to unified serializers (Markdown, HTML, JSON) and chunkers. | [01_UNIFIED_DOCUMENT_MODEL.md](file:///C:/Projects1/Others/docling/.planning/features/01_UNIFIED_DOCUMENT_MODEL.md) |
| **FEAT-02** | **Multi-Format Ingestion Pipeline** | Provides single-line document conversion for 35+ file types without user-facing format branching. | [`docling/document_converter.py`](file:///C:/Projects1/Others/docling/docling/document_converter.py), [`docling/backend/`](file:///C:/Projects1/Others/docling/docling/backend/) | Uses `FormatOption` registry to bind MIME types to specialized backends and pipeline classes. | [02_MULTI_FORMAT_PARSER_PIPELINE.md](file:///C:/Projects1/Others/docling/.planning/features/02_MULTI_FORMAT_PARSER_PIPELINE.md) |
| **FEAT-03** | **Dual-Path Hybrid PDF & OCR** | Avoids expensive neural network inference on digital PDFs while guaranteeing OCR recovery on scanned pages. | [`docling/pipeline/standard_pdf_pipeline.py`](file:///C:/Projects1/Others/docling/docling/pipeline/standard_pdf_pipeline.py), [`native_pdf_pipeline.py`](file:///C:/Projects1/Others/docling/docling/pipeline/native_pdf_pipeline.py) | Coordinates C++ `docling-parse` text extraction, layout detection, and pluggable OCR fallback. | [03_HYBRID_PDF_AND_OCR_PIPELINE.md](file:///C:/Projects1/Others/docling/.planning/features/03_HYBRID_PDF_AND_OCR_PIPELINE.md) |
| **FEAT-04** | **Table Structure Recovery (OTSL)** | Prevents severe LLM hallucination on financial and scientific tables by restoring row/col spans. | [`docling/models/stages/table_structure/`](file:///C:/Projects1/Others/docling/docling/models/stages/table_structure/) | Layout detector detects table boxes -> TableFormer predicts OTSL token sequences -> re-assembled into grid. | [04_TABLE_STRUCTURE_EXTRACTION.md](file:///C:/Projects1/Others/docling/.planning/features/04_TABLE_STRUCTURE_EXTRACTION.md) |
| **FEAT-05** | **VLM & Multimodal Enrichment** | Unlocks visual reasoning over charts, figures, and end-to-end scanned documents via modern VLMs. | [`docling/pipeline/vlm_pipeline.py`](file:///C:/Projects1/Others/docling/docling/pipeline/vlm_pipeline.py), [`docling/models/inference_engines/vlm/`](file:///C:/Projects1/Others/docling/docling/models/inference_engines/vlm/) | Bridges Transformers, vLLM, and Apple MLX runtimes to Granite Vision, SmolVLM, and MinerU2. | [05_VLM_AND_MULTIMODAL_ENRICHMENT.md](file:///C:/Projects1/Others/docling/.planning/features/05_VLM_AND_MULTIMODAL_ENRICHMENT.md) |
| **FEAT-06** | **RAG-Aware Chunking** | Prevents splitting tables or losing heading breadcrumbs during vector embedding generation. | [`docling/chunking/`](file:///C:/Projects1/Others/docling/docling/chunking/__init__.py), `docling-core` | Traverses `DoclingDocument` tree to produce token-bounded chunks with full heading context and bounding boxes. | [06_RAG_AWARE_CHUNKING.md](file:///C:/Projects1/Others/docling/.planning/features/06_RAG_AWARE_CHUNKING.md) |
| **FEAT-07** | **Modular Slim Packaging** | Enables lightweight serverless deployments (~50MB) without forcing gigabytes of PyTorch/CUDA wheels. | Root [`pyproject.toml`](file:///C:/Projects1/Others/docling/pyproject.toml), [`packages/`](file:///C:/Projects1/Others/docling/packages/) | Zero-copy mono-repo workspace publishing `docling-slim`, `docling` meta-package, and `docling-client`. | [07_MODULAR_SLIM_PACKAGING.md](file:///C:/Projects1/Others/docling/.planning/features/07_MODULAR_SLIM_PACKAGING.md) |
| **FEAT-08** | **Remote Service Client SDK** | Allows low-resource clients to offload heavy conversions to scalable GPU worker clusters. | [`docling/service_client/`](file:///C:/Projects1/Others/docling/docling/service_client/) | Asynchronous HTTP client with job submission, polling, progress tracking, and identical API signatures. | [08_REMOTE_SERVICE_CLIENT.md](file:///C:/Projects1/Others/docling/.planning/features/08_REMOTE_SERVICE_CLIENT.md) |

---

## How Future Agents Should Use These Blueprints

Each blueprint document follows a standardized 5-part architecture template:
1. **Problem Statement & Business Rationale**: Why the feature was necessary and what tradeoffs were balanced.
2. **Architecture & Component Map**: The exact classes, modules, and interfaces involved.
3. **Data Flow & Sequence**: Step-by-step lifecycle from raw input to output.
4. **Cross-Project Connection**: How the feature interfaces with other layers (Tach boundaries, error handling, configuration).
5. **Replication Guide (How to Build in Another Project)**: A concrete implementation recipe with pseudocode, core abstractions, and common pitfalls to avoid.

---
*Feature catalog generated: 2026-10-15*
