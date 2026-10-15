# Roadmap: Unstructured Document Pre-Processing System

## Overview

The `unstructured` system represents a cohesive, layered document ETL pipeline engineered to ingest raw binary data, resolve document semantics, preserve visual/spatial layout, and deliver high-fidelity chunked contexts for Retrieval Augmented Generation (RAG). This roadmap outlines the architectural phases of the platform, detailing goals, dependencies, requirements, and verification criteria for each subsystem.

---

## Phases

- [x] **Phase 1: Ingestion & Smart Filetype Detection** - Robust binary sniffing, MIME type resolution, compound format differentiation, and safe file streaming.
- [x] **Phase 2: Document Abstraction & Element Domain Model** - Unified `Element` class hierarchy, coordinate systems, metadata tracking, and deterministic SHA-256 IDs.
- [x] **Phase 3: Multi-Format Partitioning & PDF Vision/OCR Engine** - Multi-strategy PDF extraction (fast, hi_res, OCR), table transformer parsing, and 25+ document extractors.
- [x] **Phase 4: Cleaning, Normalization & Entity Extraction Bricks** - Composable NLP bricks for unicode cleanup, ligature repair, hyphen rejoining, and regex extraction.
- [x] **Phase 5: Context-Aware Semantic Chunking for RAG** - Structure-preserving chunking (`chunk_by_title`), table chunking with header repetition, and metadata consolidation.
- [x] **Phase 6: Multimodal Audio & Vector Embeddings** - Whisper audio transcription with segment timestamps, and direct vector embedding generation (`unstructured.embed`).
- [x] **Phase 7: Downstream Staging & Data Ecosystem** - Adapters for vector stores (Weaviate), annotation tools (Argilla, Label Studio), DataFrames, and datasets.

---

## Phase Details

### Phase 1: Ingestion & Smart Filetype Detection
**Goal**: Accurately identify file format and encoding from disk or stream without relying solely on file extensions.
**Depends on**: Nothing (entry stage)
**Requirements**: [DETECT-01, DETECT-02, DETECT-03, DETECT-04, DETECT-05]
**Success Criteria**:
  1. `detect_filetype()` correctly discriminates DOCX from raw ZIP and XLS from DOC across test corpus.
  2. Character encodings (UTF-8, Latin-1, Shift-JIS) are auto-detected without corrupting special characters.
  3. Memory bounds and SSRF protections prevent security exploits on remote URLs.

---

### Phase 2: Document Abstraction & Element Domain Model
**Goal**: Provide a single, immutable, serialized object representation for all document constituents.
**Depends on**: Phase 1
**Requirements**: [MODEL-01, MODEL-02, MODEL-03, MODEL-04, MODEL-05]
**Success Criteria**:
  1. All elements inherit from `Element` and carry type-safe `ElementMetadata`.
  2. Spatial coordinates can be converted between `PixelSpace` and `RelativeCoordinateSystem`.
  3. `assign_and_map_hash_ids()` produces identical IDs for identical text, page, and sequence across multiple runs.

---

### Phase 3: Multi-Format Partitioning & PDF Vision/OCR Engine
**Goal**: Convert raw documents into typed `Element` streams with layout-aware spatial geometry.
**Depends on**: Phase 1, Phase 2
**Requirements**: [PART-01, PART-02, PART-03, PART-04, PART-05, PART-06, PART-07, PART-08, PART-09, PART-10]
**Success Criteria**:
  1. `partition()` dispatches transparently to the appropriate partitioner based on file type.
  2. PDF `fast` extracts digital text in seconds; `hi_res` detects complex visual layouts; `ocr_only` extracts scanned text.
  3. Tables produce clean HTML `text_as_html` preserving row and column relationships.
  4. Office, email, markup, and spreadsheet partitioners extract text without requiring Microsoft Office installed.

---

### Phase 4: Cleaning, Normalization & Entity Extraction Bricks
**Goal**: Purify extracted text to remove OCR artifacts, linebreaks, and encoding noise.
**Depends on**: Phase 2, Phase 3
**Requirements**: [CLEAN-01, CLEAN-02, CLEAN-03, CLEAN-04]
**Success Criteria**:
  1. Bullets, ligatures, and split hyphens are cleanly repaired.
  2. Entity cleaners extract emails, phone numbers, and IP addresses via compiled regular expressions.

---

### Phase 5: Context-Aware Semantic Chunking for RAG
**Goal**: Pack elements into context-rich windows that optimize embedding search and avoid truncation.
**Depends on**: Phase 2, Phase 3
**Requirements**: [CHUNK-01, CHUNK-02, CHUNK-03, CHUNK-04, CHUNK-05]
**Success Criteria**:
  1. `chunk_by_title()` groups text under relevant headers without breaking sentences.
  2. Tables exceeding chunk boundaries are split into `TableChunk` elements that duplicate column headers.
  3. Metadata fields are merged deterministically using `ConsolidationStrategy`.

---

### Phase 6: Multimodal Audio & Vector Embeddings
**Goal**: Enrich document elements with dense vector embeddings and support spoken audio documents.
**Depends on**: Phase 2, Phase 5
**Requirements**: [EMBED-01, EMBED-02, AUDIO-01, AUDIO-02]
**Success Criteria**:
  1. `BaseEmbeddingEncoder` populates `.embeddings` on `Text` elements via OpenAI, Bedrock, VertexAI, or HuggingFace.
  2. `partition_audio()` transcribes audio files with millisecond segment timestamps.

---

### Phase 7: Downstream Staging & Data Ecosystem
**Goal**: Format processed elements for immediate insertion into vector databases, dataframes, and labeling tools.
**Depends on**: Phase 2, Phase 5, Phase 6
**Requirements**: [STAGE-01, STAGE-02, STAGE-03, STAGE-04]
**Success Criteria**:
  1. Elements export seamlessly to Pandas DataFrames and Weaviate batch upload objects.
  2. Annotation exports conform to Label Studio, Argilla, and Prodigy data schemas.

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Ingestion & Smart Filetype Detection | 1/1 | Complete | 2026-10-15 |
| 2. Document Abstraction & Element Domain Model | 1/1 | Complete | 2026-10-15 |
| 3. Multi-Format Partitioning & PDF Vision/OCR Engine | 1/1 | Complete | 2026-10-15 |
| 4. Cleaning, Normalization & Entity Extraction Bricks | 1/1 | Complete | 2026-10-15 |
| 5. Context-Aware Semantic Chunking for RAG | 1/1 | Complete | 2026-10-15 |
| 6. Multimodal Audio & Vector Embeddings | 1/1 | Complete | 2026-10-15 |
| 7. Downstream Staging & Data Ecosystem | 1/1 | Complete | 2026-10-15 |

---
*Roadmap generated: 2026-10-15*
