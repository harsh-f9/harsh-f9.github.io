# Requirements: Unstructured Document Pre-Processing Engine

**Defined:** 2026-10-15
**Core Value:** Reliably transform any raw document of any format into semantically enriched, structured chunks with preserved layout hierarchy and provenance metadata, enabling high-precision LLM retrieval without format-specific custom parser pipelines.

## v1 Requirements

Requirements implemented and active in the codebase.

### 1. File Detection & Ingestion (`DETECT`)

- [x] **DETECT-01**: Caller can supply either a filesystem path (`filename`) or an in-memory binary stream (`file`).
- [x] **DETECT-02**: System automatically sniffs filetype via multi-tier fallback (Content-Type header $\to$ libmagic binary inspection $\to$ Python `filetype` library $\to$ filename extension).
- [x] **DETECT-03**: Specialized file format differentiators distinguish compound formats (e.g. DOCX vs XLSX vs ZIP, or OLE compound documents DOC vs XLS vs MSG).
- [x] **DETECT-04**: System automatically detects text character encoding via `charset-normalizer`.
- [x] **DETECT-05**: SSRF protection and memory limit validation when fetching remote documents via HTTP (`safe_http.py`).

### 2. Document Domain Representation (`MODEL`)

- [x] **MODEL-01**: Document content is parsed into an ordered sequence of typed `Element` instances (`Title`, `NarrativeText`, `ListItem`, `Header`, `Footer`, `Table`, `Image`, `Formula`, `Address`, `CheckBox`, etc.).
- [x] **MODEL-02**: Every element maintains an `ElementMetadata` object capturing `filename`, `page_number`, `coordinates`, `languages`, `parent_id`, and `data_source`.
- [x] **MODEL-03**: Spatial coordinates are represented as bounding points linked to a specific `CoordinateSystem` (`PixelSpace`, `RelativeCoordinateSystem`).
- [x] **MODEL-04**: Deterministic SHA-256 hash IDs are calculated via `assign_and_map_hash_ids()` ensuring idempotent re-runs across indexing pipelines.
- [x] **MODEL-05**: Elements provide lossless JSON serialization (`.to_dict()`) and deserialization (`from_dict()`).

### 3. Multi-Format Partitioning & PDF Strategies (`PART`)

- [x] **PART-01**: Universal `partition()` auto-dispatcher routes any supported document type to its registered partitioner.
- [x] **PART-02**: PDF `fast` strategy extracts digital text streams directly via `pdfminer.six` with bounding coordinates.
- [x] **PART-03**: PDF `hi_res` strategy utilizes deep vision layout models (`unstructured-inference`) to detect bounding boxes for titles, narrative text, and tables.
- [x] **PART-04**: PDF `ocr_only` strategy rasterizes pages to bitmap images via `poppler` and extracts text via Tesseract or PaddleOCR.
- [x] **PART-05**: PDF `auto` strategy dynamically measures text density to select between `fast` and `hi_res`.
- [x] **PART-06**: Table extraction produces structured HTML (`text_as_html`) and cell grids (`table_as_cells`) alongside plain text.
- [x] **PART-07**: Native support for Microsoft Office OpenXML documents (`docx`, `pptx`, `xlsx`) without headless office dependencies.
- [x] **PART-08**: Legacy Microsoft Office binary support (`doc`, `ppt`, `xls`) via LibreOffice conversion or OLE parsing.
- [x] **PART-09**: Native email support for RFC-822 (`.eml`) and Outlook binary (`.msg`) with attachment tree extraction.
- [x] **PART-10**: Web and markup support for HTML, XML, Markdown, EPUB, RTF, RST, and Org-mode.

### 4. Text Cleaning & Entity Extraction (`CLEAN`)

- [x] **CLEAN-01**: Cleaning bricks normalize unicode bullets, ordered lists, ligatures (`ﬁ` $\to$ `fi`), non-ASCII characters, and trailing whitespace.
- [x] **CLEAN-02**: Hyphenated words split across line breaks are rejoined into unified tokens.
- [x] **CLEAN-03**: Regex extractors isolate domain entities (email addresses, phone numbers, IP addresses).
- [x] **CLEAN-04**: Language translation bricks translate text elements via HuggingFace / Helsinki-NLP models.

### 5. Semantic & Context-Aware Chunking (`CHUNK`)

- [x] **CHUNK-01**: `@add_chunking_strategy` decorator enables seamless chunking on any partitioner call via kwargs.
- [x] **CHUNK-02**: `basic` chunking packs sequential elements into chunks constrained by `max_characters` or `new_after_n_chars`.
- [x] **CHUNK-03**: `by_title` chunking segments documents along semantic headings (`Title`), preventing cross-topic contamination in RAG.
- [x] **CHUNK-04**: Table chunking supports isolating tables or splitting oversized tables into `TableChunk` objects with repeated table headers.
- [x] **CHUNK-05**: Metadata consolidation applies explicit field strategies (`FIRST`, `STRING_CONCATENATE`, `LIST_UNIQUE`, `DROP`) across merged elements.

### 6. Embedding & Multimodal Capabilities (`EMBED` & `AUDIO`)

- [x] **EMBED-01**: `BaseEmbeddingEncoder` interface attaches dense vector embeddings (`element.embeddings`) directly to text elements.
- [x] **EMBED-02**: Embedding providers supported: OpenAI, AWS Bedrock, Google VertexAI, VoyageAI, Mixedbread AI, OctoAI, and local HuggingFace sentence-transformers.
- [x] **AUDIO-01**: `partition_audio()` transcribes audio files (`mp3`, `wav`, `m4a`, `flac`) using OpenAI Whisper.
- [x] **AUDIO-02**: Audio elements preserve segment timestamp metadata (`segment_start_seconds`, `segment_end_seconds`).

### 7. Downstream Staging & Serialization (`STAGE`)

- [x] **STAGE-01**: Conversion of elements to flattened Pandas DataFrames (`convert_to_dataframe`).
- [x] **STAGE-02**: Vector database payload formatting for Weaviate.
- [x] **STAGE-03**: Annotation dataset exports for Argilla, Label Studio, Prodigy, Labelbox, and Datasaur.
- [x] **STAGE-04**: Export to HuggingFace `Dataset` format.

---

## v2 Requirements

Deferred or active enhancements for future iterations:

- **STREAM-01**: Zero-memory generator streaming for PDF pages to process arbitrarily large files (5,000+ pages) without RAM spikes.
- **VISION-02**: Native multimodal Vision-Language Model (VLM) partitioner (e.g. GPT-4o, Claude 3.5 Sonnet, Gemini Flash) generating rich synthetic descriptions for charts and infographics.
- **SERDE-03**: Complete deprecation and migration of `staging/base.py` serde logic into `unstructured.documents.elements`.

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| Built-in Vector Search Index | Handled by dedicated vector stores (Weaviate, Pinecone, Qdrant). |
| Document Generation / Editing | Focus is strictly on ingestion and extraction, not PDF/DOCX generation. |
| User Interface / Web App | Library is designed as a backend SDK and CLI engine. |

---

## Traceability Matrix

| Requirement ID | Architectural Component | Phase Mapping | Status |
|----------------|-------------------------|---------------|--------|
| DETECT-01..05  | `unstructured.file_utils` | Phase 1 (Ingestion & Typing) | Completed |
| MODEL-01..05   | `unstructured.documents`  | Phase 2 (Domain Abstraction) | Completed |
| PART-01..10    | `unstructured.partition`  | Phase 3 (Partitioning Engine)| Completed |
| CLEAN-01..04   | `unstructured.cleaners`   | Phase 4 (Enrichment Bricks)  | Completed |
| CHUNK-01..05   | `unstructured.chunking`   | Phase 5 (RAG Chunking)       | Completed |
| EMBED-01..02   | `unstructured.embed`      | Phase 6 (Vector Embeddings)  | Completed |
| AUDIO-01..02   | `unstructured.partition.audio` | Phase 6 (Multimodal Audio)| Completed |
| STAGE-01..04   | `unstructured.staging`    | Phase 7 (Downstream Staging) | Completed |

**Coverage:**
- v1 requirements: 30 total
- Mapped to phases: 30
- Unmapped: 0

---
*Requirements defined: 2026-10-15*
