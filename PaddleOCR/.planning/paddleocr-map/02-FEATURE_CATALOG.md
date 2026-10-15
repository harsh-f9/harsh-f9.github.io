# 02 — Feature Catalog

| # | Feature | Pipeline class | PaddleX name | Key models |
|---|---|---|---|---|
| F1 | Universal OCR (det+rec+orientation) | `PaddleOCR` (`paddleocr/_pipelines/ocr.py:66`) | `OCR` (`ocr.py:176`) | `TextDetection` det (`_models/text_detection.py:27`), `TextRecognition` rec (`_models/text_recognition.py:37`), `TextLineOrientationClassification` (`_models/textline_orientation_classification.py:24`) |
| F2 | Document Parsing (layout/table/formula/chart/seal) | `PPStructureV3` (`_pipelines/pp_structurev3.py:31`) | `PP-StructureV3` (`pp_structurev3.py:144`) | `LayoutDetection` (`_models/layout_detection.py:24`), table cls/struct/cells, seal, formula, chart |
| F3 | VLM Parsing | `PaddleOCRVL` (`_pipelines/paddleocr_vl.py:37`) | `PaddleOCR-VL[-1.5/-1.6]` (`paddleocr_vl.py:89-96`) | Layout det + VL rec module; `DocVLM` default `PP-DocBee2-3B` (`_models/doc_vlm.py:22-25`) |
| F4 | HPD high-throughput parsing | none in `_pipelines/__init__.py:15-24` | served (custom vLLM) | per `README.md:65-68` |
| F5 | ChatOCRv4 KIE | `PPChatOCRv4Doc` (`_pipelines/pp_chatocrv4_doc.py:23`) | `PP-ChatOCRv4-doc` (`pp_chatocrv4_doc.py:81`) | Layout+OCR+table+seal + retriever/MLLM configs (`pp_chatocrv4_doc.py:68-70`) |
| F6 | Doc Translation | `PPDocTranslation` (`_pipelines/pp_doctranslation.py:24`) | config-built (see `pp_doctranslation.py:315-320`) | Layout+OCR+table+seal+formula reuse |
| F7 | TableRec v2 | `TableRecognitionPipelineV2` (`_pipelines/table_recognition_v2.py:25`) | `table_recognition_v2` (`table_recognition_v2.py:69`) | `TableClassification` (`_models/table_classification.py:24`), struct `SLANet` (`_models/table_structure_recognition.py:34`), cells (`_models/table_cells_detection.py:24`) |
| F8 | Seal | `SealRecognition` (`_pipelines/seal_recognition.py:25`) | config-built | `SealTextDetection` (`_models/seal_text_detection.py:27`) + `TextRecognition` |
| F9 | Formula | `FormulaRecognitionPipeline` (`_pipelines/formula_recognition.py:25`) | `formula_recognition` (`formula_recognition.py:57`) | `FormulaRecognition` default `PP-FormulaNet_plus-M` (`_models/formula_recognition.py:34`) |
| F10 | Doc Preprocessor | `DocPreprocessor` (`_pipelines/doc_preprocessor.py:25`) | `doc_preprocessor` (`doc_preprocessor.py:48`) | `DocImgOrientationClassification` (`_models/doc_img_orientation_classification.py:24`), `TextImageUnwarping` `UVDoc` (`_models/text_image_unwarping.py:34`) |

## F1 — Universal OCR

- **Why**: scene/textbook/ID/street/industrial text in 100+ langs must become searchable text; fastest path without layout overhead (`README.md:44-49`).
- **Where**: `paddleocr/_pipelines/ocr.py:66` (class), `:113-115` lang→model resolution, `:179-206` `predict_iter`, `:239-241` deprecated `ocr()`, `:247-290` config overrides.
- **How Connected**: upstream `DocPreprocessor` (orientation+unwarp) → `TextDetection` → optional `TextLineOrientation` → `TextRecognition`; downstream consumed standalone or as `GeneralOCR` inside StructureV3/ChatOCR/TableV2.
- **Reuse Hint**: subclass `PaddleXPipelineWrapper` (`_pipelines/base.py:54`), map `*_model_name` via `create_config_from_structure` (`_pipelines/utils.py:16`); call `PaddleOCR(lang="en").predict(path)`.

## F2 — Document Parsing (PP-StructureV3)

- **Why**: complex PDFs need reading order + coordinates (cells, blocks) that VLMs skip; emits Markdown/JSON with bboxes (`README.md:41`).
- **Where**: `paddleocr/_pipelines/pp_structurev3.py:31`, `:148-221` `predict_iter` toggles, `:300-301` `concatenate_markdown_pages`; bbox patch `_patch_layout_parsing.py:35` applied at `:24-26`.
- **How Connected**: upstream `DocPreprocessor` + `TextDetection/Recognition`; lateral `LayoutDetection` routes regions to table/seal/formula/chart/region sub-modules; downstream Markdown/JSON feeds RAG chunkers.
- **Reuse Hint**: instantiate `PPStructureV3(use_table_recognition=True, …)` and toggle per-call flags; join pages with `concatenate_markdown_pages`.

## F3 — VLM Parsing (PaddleOCR-VL)

- **Why**: highest accuracy on tables/formulas/seals/charts/ancient docs (96.3% OmniDocBench v1.6, `README.md:40`); single 0.9B model replaces multi-stage tuning.
- **Where**: `paddleocr/_pipelines/paddleocr_vl.py:37`, versions `:25-26`, backends `:27-34`, sampling/layout/prompt knobs `:100-120`, helpers `:216-223`.
- **How Connected**: upstream optional `DocPreprocessor` + `LayoutDetection`; core VL rec module decodes blocks to Markdown/JSON; downstream `restructure_pages` merges tables/relevels titles for RAG.
- **Reuse Hint**: `PaddleOCRVL(pipeline_version="v1.6", vl_rec_backend="native")`; switch to `vllm-server` + `vl_rec_server_url` for serving.

## F4 — HPD High-Throughput Parsing

- **Why**: batch doc lakes need tokens/sec, not single-doc latency; 4,752 tok/s claim (`README.md:66`).
- **Where**: announced `README.md:65-68`; **no wrapper** in `paddleocr/_pipelines/` — use served endpoint (OpenAI-compatible) or local custom vLLM runtime per tutorial link.
- **How Connected**: external tier; same Markdown/JSON contract as F3, consumed by identical RAG loaders.
- **Reuse Hint**: deploy HPD server per tutorial, point OpenAI client at it; keep F2/F3 code paths unchanged.

## F5 — ChatOCRv4 (KIE)

- **Why**: forms/invoices need grounded Q&A + retrieval, not full-page dump; vector store + visual info persist context (`pp_chatocrv4_doc.py:84-102`).
- **Where**: `paddleocr/_pipelines/pp_chatocrv4_doc.py:23`, `:84-102` save/load vector/visual, `:104+` `visual_predict_iter`.
- **How Connected**: upstream layout+OCR+table+seal; lateral `retriever_config` + `mllm/chat_bot_config` (`:68-70`); downstream answers cite visual blocks.
- **Reuse Hint**: run `visual_predict_iter` once, `save_vector`/`save_visual_info_list`, then query against loaded store.

## F6 — Doc Translation

- **Why**: multilingual enterprises need layout-preserving translation with editable output (DOCX export, `README.md:101`).
- **Where**: `paddleocr/_pipelines/pp_doctranslation.py:24`, markdown concat `:315-316`, CLI executor `:562+`.
- **How Connected**: reuses F2 sub-stack (layout/OCR/table/seal/formula) then translates block text; downstream same Markdown/DOCX writers.
- **Reuse Hint**: clone `pp_structurev3.py:307`-style overrides, insert translation LLM step between block recognition and markdown assembly.

## F7 — TableRec v2

- **Why**: standalone table→HTML/Markdown with cell coordinates for spreadsheets and RAG tables.
- **Where**: `paddleocr/_pipelines/table_recognition_v2.py:25`, `:72-80` `predict_iter` (layout/OCR toggles, `overall_ocr_res` passthrough).
- **How Connected**: upstream optional `DocPreprocessor` + `TextDetection/Recognition` (or injected `overall_ocr_res`); lateral wired/wireless struct + cells detectors; downstream HTML cells feed F2/F5.
- **Reuse Hint**: call with `use_ocr_model=True` for end-to-end, or pass cached `overall_ocr_res` when F1 already ran.

## F8 — Seal Recognition

- **Why**: CJK official docs carry round/oval seals that generic OCR misses; dedicated curved-text detector.
- **Where**: `paddleocr/_pipelines/seal_recognition.py:25`, params `:26-52`; model `paddleocr/_models/seal_text_detection.py:27`.
- **How Connected**: upstream optional doc-preprocess + layout gating; downstream seal strings merge into F2/F5 block stream.
- **Reuse Hint**: use standalone for seal audit, or enable `use_seal_recognition` inside `PPStructureV3.predict_iter` (`pp_structurev3.py:155`).

## F9 — Formula Recognition

- **Why**: papers/textbooks need LaTeX, not garbled symbols; `PP-FormulaNet_plus-M` (`_models/formula_recognition.py:34`).
- **Where**: `paddleocr/_pipelines/formula_recognition.py:25`, `:60-80` `predict_iter` with `use_layout_detection` + `layout_det_res` injection.
- **How Connected**: upstream layout regions (or full page); downstream LaTeX blocks embed in F2/F3 Markdown.
- **Reuse Hint**: pass `layout_det_res` from a prior layout call to skip re-detection; read LaTeX from result `.print()`/saved outputs.

## F10 — Doc Preprocessor (Unwarping/Orientation)

- **Why**: skewed photos/scans destroy all downstream accuracy; cheap fix (rotate + dewarp) before expensive models.
- **Where**: `paddleocr/_pipelines/doc_preprocessor.py:25`, `:51-62` `predict_iter(use_doc_orientation_classify, use_doc_unwarping)`; models `PP-LCNet_x1_0_doc_ori` (`doc_img_orientation_classification.py:24`), `UVDoc` (`text_image_unwarping.py:34`).
- **How Connected**: front-end of F1/F2/F3/F7/F8/F9 via `use_doc_orientation_classify`/`use_doc_unwarping` flags; reusable standalone cleaner.
- **Reuse Hint**: run `DocPreprocessor().predict(img)` first for photo inputs; disable (`False`) for born-digital PDFs to save latency.
