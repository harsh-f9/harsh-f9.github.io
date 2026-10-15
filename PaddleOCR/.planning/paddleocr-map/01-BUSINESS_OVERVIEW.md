# 01 — Business Overview of PaddleOCR

## What PaddleOCR Is

PaddleOCR v3 is a Document AI engine that converts PDFs/images (plus Word/Excel/PPT via office-to-Markdown) into structured, LLM-ready JSON/Markdown.
The `paddleocr/` package is a thin Python facade over the `paddlex[ocr-core]` runtime (`pyproject.toml:50`): 10 pipeline wrappers + 13 single-model predictors + CLI + cloud/MCP clients (`paddleocr/__init__.py:17-65`).
Two abstract bases define everything: `PaddleXPipelineWrapper` (`paddleocr/_pipelines/base.py:54`) and `PaddleXPredictorWrapper` (`paddleocr/_models/base.py:30`).
Positioning statement: "Global Leading OCR Toolkit & Document AI Engine" (`README.md:9`), "70k+ Stars… bedrock for RAG and Agentic applications" (`README.md:32`).

## Business Problem Solved

Unstructured visuals (scans, photos, PDFs with tables/formulas/seals/charts, multilingual text) cannot feed LLMs directly.
PaddleOCR solves image/PDF → structured JSON/Markdown: `predict_iter` streams PaddleX results, `predict` materializes lists, CLI prints/saves via `res.print()`/`res.save_all()` (`paddleocr/_utils/cli.py:48-71`).
Layout-first path (`PPStructureV3`) adds coordinates per block/cell; VLM path (`PaddleOCRVL`) emits Markdown/JSON pages joined by `concatenate_markdown_pages` (`paddleocr/_pipelines/pp_structurev3.py:300`, `paddleocr/_pipelines/paddleocr_vl.py:216`).
Office docs bypass vision entirely via `paddleocr/_doc2md/converters/{docx,xlsx,pptx}.py` exposed as `doc2md_convert` (`paddleocr/__init__.py:70`).

## Primary Users & Use Cases

- **RAG builders**: parse manuals/reports into chunkable Markdown/JSON; per-page concat + `restructure_pages(merge_tables, relevel_titles)` (`paddleocr/_pipelines/paddleocr_vl.py:219`).
- **Agent developers**: tool-callable parsing via MCP server (`mcp_server/pyproject.toml:5`, entry `paddleocr_mcp.__main__:main`) and OpenAI-compatible GenAI serving (`paddleocr/_cli.py:144-148`); `langchain-paddleocr` loader package exists as sibling.
- **Ecosystem integrations**: "deeply integrated with Dify, RAGFlow, Pathway, Cherry Studio" (`README.md:58`); no Dify/RAGFlow source in-repo (see `../codebase/INTEGRATIONS.md:20`) — integrations are downstream consumers.
- **KIE / form mining**: ChatOCRv4 path adds `visual_predict_iter` + vector store `save/load_vector`, `save/load_visual_info_list` (`paddleocr/_pipelines/pp_chatocrv4_doc.py:84-102`) for retrieval-grounded extraction.
- **Translation workflows**: `PPDocTranslation` preserves layout while translating, with DOCX export (`README.md:101`).

## Product Tiers

| Tier | Entry point | PaddleX name | Notes |
|---|---|---|---|
| PP-OCRv6 tiny/small/medium | `PaddleOCR` (`paddleocr/_pipelines/ocr.py:66`) | `OCR` (`ocr.py:176`) | `ocr_version` ∈ v3/v4/v5/v6 (`ocr.py:58`); default v6 medium det+rec (`ocr.py:330` per ARCHITECTURE); 1.5M/7.7M/34.5M params (`README.md:79`) |
| PP-StructureV3 | `PPStructureV3` (`paddleocr/_pipelines/pp_structurev3.py:31`) | `PP-StructureV3` (`pp_structurev3.py:144`) | Layout-first, fine-grained coordinates; toggles `use_seal/table/formula/chart/region_detection` (`pp_structurev3.py:148`) |
| PaddleOCR-VL-1.6 (0.9B) | `PaddleOCRVL` (`paddleocr/_pipelines/paddleocr_vl.py:37`) | `PaddleOCR-VL[-1.5/-1.6]` (`paddleocr_vl.py:89-96`) | Default `v1.6` (`paddleocr_vl.py:25`); backends native/vllm/sglang/fastdeploy/mlx/llama-cpp (`paddleocr_vl.py:27-34`) |
| HPD-Parsing | No wrapper in `paddleocr/_pipelines/` (10 pipelines only, `__init__.py:15-24`) | Served via custom vLLM runtime | Announced `README.md:65-68`: hierarchical parallel decoding + P-MTP, OpenAI-compatible serving; treat as external/served tier, not local pipeline |

Specialist add-ons share the same wrapper pattern: `TableRecognitionPipelineV2`, `SealRecognition`, `FormulaRecognitionPipeline`, `PPChatOCRv4Doc`, `PPDocTranslation`, `DocPreprocessor`, `DocUnderstanding` (all in `paddleocr/_pipelines/__init__.py:15-24`).

## Value Metrics

- **Accuracy**: PP-OCRv6 +4.6% det / +5.1% rec over v5, "surpassing mainstream VLMs" with 34.5M params (`README.md:49,75`); VL-1.6 96.3% on OmniDocBench v1.6, SOTA text/formula/table (`README.md:40,89`); VL-1.5 94.5% (`README.md:110`).
- **Speed/throughput**: 5.2× CPU end-to-end speedup, 6.1× on Apple M4 tiny, 0.13s A100 (`README.md:49,78`); HPD peak 4,752 tok/s (`README.md:66`).
- **Languages**: 100+ claimed (`README.md:47`); v6 single model = 50 langs incl. CJK + 46 Latin (`ocr.py:60-62`, `README.md:76`); VL up to 109–111 langs (`README.md:113,128`).
- **Adoption**: 70k+ stars, 6k+ dependent repos (`README.md:32`, badge `README.md:16`); Python 3.8–3.13, CPU/GPU/XPU/NPU (`README.md:17-19`, `pyproject.toml:17`).

## File Evidence Index

- Facade/exports: `paddleocr/__init__.py:17-65`
- Bases: `paddleocr/_pipelines/base.py:54`, `paddleocr/_models/base.py:30`, `paddleocr/_abstract.py:18`
- Runtime dep: `pyproject.toml:50`
- CLI: `paddleocr/_cli.py:57-75,282-293`, `paddleocr/__main__.py:21-39`
- Cloud/MCP: `paddleocr/_api_client/client.py:42`, `mcp_server/paddleocr_mcp/__main__.py:24-56`
- Analysis sources: `../codebase/{ARCHITECTURE,STRUCTURE,STACK,INTEGRATIONS}.md`
