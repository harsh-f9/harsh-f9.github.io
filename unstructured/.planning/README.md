# Agent Navigation Guide & Knowledge Manifest

> **Notice for Autonomous Agents & AI Assistants:**  
> This directory (`.planning/`) contains the complete architectural map, business domain context, requirement traceability matrix, and developer implementation blueprints for the `unstructured` document ETL engine.
>
> If you are an autonomous agent tasked with understanding, modifying, or replicating any feature from this repository into another project, **use this document as your primary routing table**.

---

## Fast Feature Routing Table

Find the feature you need to build or analyze, and open the corresponding file:

| Feature / Objective | Where to Read | Primary Source Code Reference |
|---------------------|---------------|-------------------------------|
| **Executive Summary & Full Synthesis** | [`UNSTRUCTURED_CODEBASE_MAP_AND_FEATURE_BLUEPRINTS.md`](file:///C:/Projects1/Others/unstructured/.planning/UNSTRUCTURED_CODEBASE_MAP_AND_FEATURE_BLUEPRINTS.md) | Full repository |
| **Document Element Data Model & Hash IDs** | [`features/01_DOCUMENT_ELEMENT_DATA_MODEL.md`](file:///C:/Projects1/Others/unstructured/.planning/features/01_DOCUMENT_ELEMENT_DATA_MODEL.md) | `unstructured/documents/elements.py` |
| **Filetype Sniffing & Zip/OLE Differentiators** | [`features/02_SMART_FILETYPE_DETECTION.md`](file:///C:/Projects1/Others/unstructured/.planning/features/02_SMART_FILETYPE_DETECTION.md) | `unstructured/file_utils/filetype.py`, `model.py` |
| **Multi-Strategy Partitioning (Fast vs OCR vs Vision)** | [`features/03_PARTITIONING_ENGINE_AND_STRATEGIES.md`](file:///C:/Projects1/Others/unstructured/.planning/features/03_PARTITIONING_ENGINE_AND_STRATEGIES.md) | `unstructured/partition/auto.py`, `pdf.py` |
| **Table Structure, HTML & Header Carryover** | [`features/04_TABLE_EXTRACTION_AND_REPRESENTATION.md`](file:///C:/Projects1/Others/unstructured/.planning/features/04_TABLE_EXTRACTION_AND_REPRESENTATION.md) | `unstructured/partition/pdf_image/ocr.py`, `chunking/dispatch.py` |
| **Context-Aware Semantic Chunking for RAG** | [`features/05_CONTEXT_AWARE_CHUNKING_FOR_RAG.md`](file:///C:/Projects1/Others/unstructured/.planning/features/05_CONTEXT_AWARE_CHUNKING_FOR_RAG.md) | `unstructured/chunking/title.py`, `basic.py` |
| **Vector Embeddings & Vector DB Staging** | [`features/06_EMBEDDING_AND_STAGING_PIPELINE.md`](file:///C:/Projects1/Others/unstructured/.planning/features/06_EMBEDDING_AND_STAGING_PIPELINE.md) | `unstructured/embed/`, `unstructured/staging/` |
| **End-to-End Reusable Starter Recipe** | [`features/07_RECIPE_HOW_TO_BUILD_YOUR_OWN_DOCUMENT_ETL.md`](file:///C:/Projects1/Others/unstructured/.planning/features/07_RECIPE_HOW_TO_BUILD_YOUR_OWN_DOCUMENT_ETL.md) | 150-line complete starter implementation |
| **Architecture, Layers & Data Flow** | [`codebase/ARCHITECTURE.md`](file:///C:/Projects1/Others/unstructured/.planning/codebase/ARCHITECTURE.md) | All pipeline modules |
| **Runtime, Dependencies & Extras Matrix** | [`codebase/STACK.md`](file:///C:/Projects1/Others/unstructured/.planning/codebase/STACK.md) | `pyproject.toml`, `uv.lock` |
| **Directory Map & File Responsibilities** | [`codebase/STRUCTURE.md`](file:///C:/Projects1/Others/unstructured/.planning/codebase/STRUCTURE.md) | Entire repository tree |
| **Code Style, Types & Design Patterns** | [`codebase/CONVENTIONS.md`](file:///C:/Projects1/Others/unstructured/.planning/codebase/CONVENTIONS.md) | Decorators, Pyright strict typing |
| **Testing, Fixture Corpus & Mocks** | [`codebase/TESTING.md`](file:///C:/Projects1/Others/unstructured/.planning/codebase/TESTING.md) | `test_unstructured/`, `example-docs/` |
| **Technical Debt, Fragile Areas & Risks** | [`codebase/CONCERNS.md`](file:///C:/Projects1/Others/unstructured/.planning/codebase/CONCERNS.md) | Windows quirks, RAM profiling |
| **Business Vision & Strategic Context** | [`PROJECT.md`](file:///C:/Projects1/Others/unstructured/.planning/PROJECT.md) | Customer profile, monetization, scope |
| **Requirements Traceability Matrix** | [`REQUIREMENTS.md`](file:///C:/Projects1/Others/unstructured/.planning/REQUIREMENTS.md) | 37 functional requirements mapped |
| **Execution Phases & Roadmap** | [`ROADMAP.md`](file:///C:/Projects1/Others/unstructured/.planning/ROADMAP.md) | 7 architectural phases |

---

## Agent Reading Protocols

Depending on your mission, follow one of these three reading paths:

### Protocol A: "I need to build a document processing / chunking feature in my own project"
1. Read the matching feature guide in [`features/`](file:///C:/Projects1/Others/unstructured/.planning/features/). Every feature document contains:
   - **WHY**: The exact problem it solves and failure modes of naive alternatives.
   - **WHERE**: Precise filenames, class names, and line ranges in `unstructured`.
   - **HOW**: Data flow, interfaces, and decorators connecting it to the system.
   - **REUSABLE BLUEPRINT**: A clean, self-contained code recipe you can adapt.
2. If building an entire ETL pipeline from scratch, read [`features/07_RECIPE_HOW_TO_BUILD_YOUR_OWN_DOCUMENT_ETL.md`](file:///C:/Projects1/Others/unstructured/.planning/features/07_RECIPE_HOW_TO_BUILD_YOUR_OWN_DOCUMENT_ETL.md) first.

### Protocol B: "I need to modify, debug, or extend this repository (`unstructured`)"
1. Read [`codebase/ARCHITECTURE.md`](file:///C:/Projects1/Others/unstructured/.planning/codebase/ARCHITECTURE.md) to understand the 6-stage transformation pipeline.
2. Read [`codebase/CONVENTIONS.md`](file:///C:/Projects1/Others/unstructured/.planning/codebase/CONVENTIONS.md) for strict Pyright typing, dual stream/file inputs, and decorator rules.
3. Read [`codebase/TESTING.md`](file:///C:/Projects1/Others/unstructured/.planning/codebase/TESTING.md) for pytest guidelines and mock fixtures in `example-docs/`.
4. Read [`codebase/CONCERNS.md`](file:///C:/Projects1/Others/unstructured/.planning/codebase/CONCERNS.md) to avoid known pitfalls (e.g. Windows OS dependencies or PDF memory spikes).

### Protocol C: "I need full business & architectural onboarding"
1. Read [`UNSTRUCTURED_CODEBASE_MAP_AND_FEATURE_BLUEPRINTS.md`](file:///C:/Projects1/Others/unstructured/.planning/UNSTRUCTURED_CODEBASE_MAP_AND_FEATURE_BLUEPRINTS.md).
2. Read [`PROJECT.md`](file:///C:/Projects1/Others/unstructured/.planning/PROJECT.md) and [`ROADMAP.md`](file:///C:/Projects1/Others/unstructured/.planning/ROADMAP.md).

---

## Directory Schema Summary

```
.planning/
├── README.md                                                 # <-- You are here (Agent navigation manifest)
├── UNSTRUCTURED_CODEBASE_MAP_AND_FEATURE_BLUEPRINTS.md       # Master comprehensive synthesis
├── PROJECT.md                                                # Product vision, customer context, key decisions
├── REQUIREMENTS.md                                           # 37 requirements mapped across 7 phases
├── ROADMAP.md                                                # 7 execution phases and milestone progress
├── STATE.md                                                  # Living project state and GSD metrics
├── config.json                                               # GSD tooling configuration
│
├── codebase/                                                 # Comprehensive codebase maps
│   ├── STACK.md                                              # Languages, packaging, core/optional dependencies
│   ├── INTEGRATIONS.md                                       # External APIs, embeddings, vector sinks, engines
│   ├── ARCHITECTURE.md                                       # End-to-end data flow, layers, abstractions
│   ├── STRUCTURE.md                                          # Directory tree and module responsibilities
│   ├── CONVENTIONS.md                                        # Code style, typing, decorators, naming rules
│   ├── TESTING.md                                            # Pytest suite, mocks, fixture corpus, metrics
│   └── CONCERNS.md                                           # Debt, risks, Windows caveats, memory profiling
│
├── features/                                                 # Deep implementation recipes for replication
│   ├── 01_DOCUMENT_ELEMENT_DATA_MODEL.md                     # Element hierarchy, coordinates, hash IDs
│   ├── 02_SMART_FILETYPE_DETECTION.md                        # Multi-tier sniffing, zip/OLE differentiators
│   ├── 03_PARTITIONING_ENGINE_AND_STRATEGIES.md              # PDF multi-strategy engine (fast vs OCR vs vision)
│   ├── 04_TABLE_EXTRACTION_AND_REPRESENTATION.md             # HTML tables, structure inference, header carryover
│   ├── 05_CONTEXT_AWARE_CHUNKING_FOR_RAG.md                  # Semantic title chunking, soft/hard limits
│   ├── 06_EMBEDDING_AND_STAGING_PIPELINE.md                  # In-memory vector attachment & Weaviate staging
│   └── 07_RECIPE_HOW_TO_BUILD_YOUR_OWN_DOCUMENT_ETL.md       # Complete 150-line standalone starter recipe
│
└── onboarding/
    └── SUMMARY.md                                            # Brownfield onboarding summary
```
