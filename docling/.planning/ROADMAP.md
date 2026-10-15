# Roadmap: Docling System Capabilities

## Overview

This roadmap defines the architectural evolution and capability layers of the Docling document processing platform. Each phase represents a cohesive set of features, explaining why it was introduced, how it is implemented, and how it connects across the system.

---

## Phases Overview

- [x] **Phase 1: Universal Document Representation & Multi-Format Ingestion** - Canonical AST (`DoclingDocument`), backend abstractions, and multi-format decoders (Office, Web, XML, Markdown).
- [x] **Phase 2: Dual-Path PDF Parsing & Layout Intelligence** - Fast programmatic C++ parsing (`docling-parse`), deep learning layout object detection, and pluggable OCR engines.
- [x] **Phase 3: Deep Visual Understanding & Table Structure Recovery** - TableFormer / OTSL token prediction, separator-aware reading order graph traversal, and formula extraction.
- [x] **Phase 4: Modular Packaging & Footprint Optimization** - Architectural layer enforcement (`tach`), `docling-slim` separation, fine-grained extras, and serverless enablement.
- [x] **Phase 5: RAG Chunking, Vision-Language Models & Remote Serving** - Structure-preserving RAG chunkers (`HierarchicalChunker`, `HybridChunker`), VLM engines (Granite Vision, MinerU2), and asynchronous `DoclingClient` SDK.

---

## Phase Details

### Phase 1: Universal Document Representation & Multi-Format Ingestion
**Goal:** Eliminate format fragmentation by standardizing all document ingestion into a single, canonical, structure-preserving document AST.
**Requirements:** [REQ-CORE-01, REQ-CORE-02, REQ-FORMAT-02, REQ-FORMAT-03, REQ-FORMAT-05]
**Why Implemented:** Downstream AI workflows (LLMs, RAG) should never deal with proprietary format quirks of Word, Excel, PowerPoint, or HTML. Standardizing to a unified AST unlocks universal serializers (Markdown, HTML, JSON).
**Key Components:**
- [`docling.backend.abstract_backend.AbstractDocumentBackend`](file:///C:/Projects1/Others/docling/docling/backend/abstract_backend.py)
- [`docling.pipeline.simple_pipeline.SimplePipeline`](file:///C:/Projects1/Others/docling/docling/pipeline/simple_pipeline.py)
- [`docling.document_converter.DocumentConverter`](file:///C:/Projects1/Others/docling/docling/document_converter.py)
- `docling-core` (`DoclingDocument`, `TextItem`, `TableItem`, `PictureItem`, `GroupItem`)

### Phase 2: Dual-Path PDF Parsing & Layout Intelligence
**Goal:** Deliver industry-leading PDF extraction speed on digital documents while falling back to deep learning computer vision on scanned pages.
**Requirements:** [REQ-CORE-03, REQ-CORE-04, REQ-FORMAT-01, REQ-MODEL-01, REQ-MODEL-02]
**Why Implemented:** Running neural networks over clean digital PDFs wastes significant compute and memory. Dual-path routing extracts native text vectors at near-instantaneous speeds while running object detection and OCR only when required.
**Key Components:**
- [`docling.pipeline.standard_pdf_pipeline.StandardPdfPipeline`](file:///C:/Projects1/Others/docling/docling/pipeline/standard_pdf_pipeline.py)
- [`docling.pipeline.native_pdf_pipeline.NativePdfPipeline`](file:///C:/Projects1/Others/docling/docling/pipeline/native_pdf_pipeline.py)
- [`docling.backend.docling_parse_backend.ThreadedDoclingParseDocumentBackend`](file:///C:/Projects1/Others/docling/docling/backend/docling_parse_backend.py)
- [`docling.models.factories.ocr_factory.OcrFactory`](file:///C:/Projects1/Others/docling/docling/models/factories/ocr_factory.py)
- [`docling.models.stages.layout.layout_model.LayoutModel`](file:///C:/Projects1/Others/docling/docling/models/stages/layout/layout_model.py)

### Phase 3: Deep Visual Understanding & Table Structure Recovery
**Goal:** Accurately extract complex nested tables with spanning cells, reconstruct natural multi-column reading flow, and caption visual diagrams.
**Requirements:** [REQ-MODEL-03, REQ-MODEL-04, REQ-MODEL-05]
**Why Implemented:** Tables and multi-column layouts represent the highest source of hallucinations in LLMs when extracted as flat unstructured text. Visual structural recovery restores cell coordinates, row/col spans, and correct reading sequence.
**Key Components:**
- [`docling.models.stages.table_structure.table_structure_model_v2.TableStructureModelV2`](file:///C:/Projects1/Others/docling/docling/models/stages/table_structure/table_structure_model_v2.py)
- [`docling.models.postprocessing.reading_order_rb.ReadingOrderModel`](file:///C:/Projects1/Others/docling/docling/models/postprocessing/reading_order_rb.py)
- [`docling.models.stages.picture_description.picture_description_vlm_engine_model.PictureDescriptionVlmEngineModel`](file:///C:/Projects1/Others/docling/docling/models/stages/picture_description/picture_description_vlm_engine_model.py)

### Phase 4: Modular Packaging & Footprint Optimization
**Goal:** Enable Docling adoption in serverless, edge, and lightweight container environments by eliminating mandatory multi-gigabyte PyTorch/CUDA dependencies.
**Requirements:** [REQ-DIST-01, REQ-DIST-02, REQ-DIST-03]
**Why Implemented:** Many users only need to parse DOCX or call remote conversion APIs and cannot tolerate heavy deep learning installation overhead.
**Key Components:**
- Monorepo workspace configuration in root [`pyproject.toml`](file:///C:/Projects1/Others/docling/pyproject.toml)
- [`packages/docling/pyproject.toml`](file:///C:/Projects1/Others/docling/packages/docling/pyproject.toml) (Meta-package)
- [`packages/docling-slim/README.md`](file:///C:/Projects1/Others/docling/packages/docling-slim/README.md)
- [`tach.toml`](file:///C:/Projects1/Others/docling/tach.toml) (Acyclic layer boundary enforcement)

### Phase 5: RAG Chunking, Vision-Language Models & Remote Serving
**Goal:** Seamlessly integrate document intelligence into downstream GenAI RAG applications and enable distributed enterprise scaling.
**Requirements:** [REQ-CHUNK-01, REQ-CHUNK-02, REQ-CHUNK-03, REQ-CLIENT-01, REQ-CLIENT-02, REQ-CLIENT-03]
**Why Implemented:** Naive character or token chunking splits tables in half and cuts paragraphs without context. RAG-aware chunkers preserve heading hierarchy and table semantics. Distributed service clients enable centralized GPU cluster scaling.
**Key Components:**
- [`docling.chunking.HierarchicalChunker`](file:///C:/Projects1/Others/docling/docling/chunking/__init__.py)
- [`docling.chunking.HybridChunker`](file:///C:/Projects1/Others/docling/docling/chunking/__init__.py)
- [`docling.pipeline.vlm_pipeline.VlmPipeline`](file:///C:/Projects1/Others/docling/docling/pipeline/vlm_pipeline.py)
- [`docling.service_client.client.DoclingClient`](file:///C:/Projects1/Others/docling/docling/service_client/client.py)
- [`docling.service_client._async_client._AsyncDoclingClient`](file:///C:/Projects1/Others/docling/docling/service_client/_async_client.py)

---
*Roadmap status: Validated & Maintained*
