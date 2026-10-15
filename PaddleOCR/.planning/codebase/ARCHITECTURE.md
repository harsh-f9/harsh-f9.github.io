# Architecture

**Analysis Date:** 2026-10-15

## System Overview

PaddleOCR v3 is a thin Python façade over `paddlex` pipelines and predictors.
`paddleocr/` holds wrappers, CLI, and API clients; heavy inference lives in
the `paddlex[ocr-core]` dependency (`pyproject.toml:49`). Two abstract bases
define the whole system:

- `paddleocr/_pipelines/base.py:54` — `PaddleXPipelineWrapper`: owns
  `paddlex_pipeline`, merges YAML config + constructor overrides, exposes
  `predict_iter`/`predict`/`close`.
- `paddleocr/_models/base.py:30` — `PaddleXPredictorWrapper`: owns
  `paddlex_predictor` for single models, same `predict`/`close` shape.
- `paddleocr/_abstract.py:18` — `CLISubcommandExecutor`: `add_subparser` +
  `execute_with_args` contract implemented by every pipeline and model.

Three product layers sit on those bases:

1. **OCR layer** — `PaddleOCR` classic detect+classify+recognize.
2. **Doc-parsing layer** — `PPStructureV3`, table/seal/formula/chat sub-pipelines.
3. **VLM layer** — `PaddleOCRVL` (`v1`/`v1.5`/`v1.6`) and `DocVLM`/`DocUnderstanding`.

```text
┌──────────────────────────────────────────────────────────────┐
│ User surface: CLI / Python API / Cloud API / MCP             │
│ `paddleocr/_cli.py:57` `paddleocr/__init__.py:17`            │
│ `paddleocr/_api_client/client.py:42` `mcp_server/`           │
├──────────────────┬───────────────────┬───────────────────────┤
│ OCR pipeline     │ Doc-parsing pipes  │ VLM pipelines/models  │
│ `paddleocr/      │ `paddleocr/        │ `paddleocr/_pipelines/ │
│  _pipelines/     │  _pipelines/       │  paddleocr_vl.py:37`  │
│  ocr.py:66`      │  pp_structurev3.py │ `paddleocr/_models/   │
│                  │  :31` + 6 more     │  doc_vlm.py:22`       │
├──────────────────┴───────────────────┴───────────────────────┤
│ Model wrappers (13 predictors) `paddleocr/_models/__init__.py:15` │
├──────────────────────────────────────────────────────────────┤
│ PaddleX runtime: `create_pipeline` / `create_predictor`      │
│ `paddleocr/_pipelines/base.py:102` `paddleocr/_models/base.py:71` │
└──────────────────────────────────────────────────────────────┘
```

## Pipeline Flow

### OCR (`PaddleOCR`)

1. `__init__` resolves `lang`/`ocr_version` to det+rec model names
   (`paddleocr/_pipelines/ocr.py:113`, `_get_ocr_model_names:318`).
   Default: `PP-OCRv6_medium_det` + `PP-OCRv6_medium_rec` (`ocr.py:330`).
   Versions: `PP-OCRv3/v4/v5/v6` (`ocr.py:58`).
2. Overrides map flat kwargs onto nested PaddleX keys via
   `create_config_from_structure` (`ocr.py:247`, `paddleocr/_pipelines/utils.py:16`).
3. `predict_iter(input, ...)` delegates to `paddlex_pipeline.predict`
   (`ocr.py:179`); `predict` materializes to list (`ocr.py:208`);
   legacy `ocr()` is deprecated (`ocr.py:239`).
4. Stages: `DocPreprocessor` (orientation + unwarping) → `TextDetection` →
   `TextLineOrientation` (optional) → `TextRecognition`.

### PP-StructureV3 (layout-first doc parsing)

1. Class `PPStructureV3` (`paddleocr/_pipelines/pp_structurev3.py:31`),
   PaddleX name `PP-StructureV3` (`pp_structurev3.py:144`).
2. `predict_iter` (`pp_structurev3.py:148`) / `predict` (`pp_structurev3.py:223`)
   accept per-call toggles: `use_seal/table/formula/chart/region_detection`,
   layout thresholds, det/rec thresholds, HTML/Markdown flags.
3. Sub-pipelines composed by config override (`pp_structurev3.py:307`):
   `DocPreprocessor` + `GeneralOCR` + `LayoutDetection` + `TableRecognition` +
   `SealRecognition` + `FormulaRecognition` + `ChartRecognition` + `RegionDetection`.
4. `concatenate_markdown_pages` (`pp_structurev3.py:300`) joins per-page Markdown.
5. Import side effect applies float64 bbox-overlap patches
   (`pp_structurev3.py:24`, `paddleocr/_pipelines/_patch_layout_parsing.py:35`).

### PaddleOCR-VL (VLM doc parsing)

1. Class `PaddleOCRVL` (`paddleocr/_pipelines/paddleocr_vl.py:37`).
   Versions `v1/v1.5/v1.6`, default `v1.6` (`paddleocr_vl.py:25`).
   PaddleX names `PaddleOCR-VL[-1.5/-1.6]` (`paddleocr_vl.py:89`).
2. `VLRecognition.genai_config` selects backend: `native`, `vllm-server`,
   `sglang-server`, `fastdeploy-server`, `mlx-vlm-server`, `llama-cpp-server`
   (`paddleocr_vl.py:27`, `paddleocr_vl.py:267`).
3. `predict_iter` (`paddleocr_vl.py:100`) forwards sampling knobs
   (`temperature/top_p/repetition_penalty/max_new_tokens/min/max_pixels`),
   `layout_shape_mode`, `prompt_label`, `vlm_extra_args`.
4. Helpers: `concatenate_markdown_pages` (`paddleocr_vl.py:216`),
   `restructure_pages(merge_tables, relevel_titles)` (`paddleocr_vl.py:219`).

### HPD-Parsing and specialist pipelines

- `DocPreprocessor` (`paddleocr/_pipelines/doc_preprocessor.py:25`, PaddleX
  `doc_preprocessor:47`): orientation-classify + unwarping front-end reused by
  OCR/StructureV3/VL via `use_doc_preprocessor` flags.
- `DocUnderstanding` (`paddleocr/_pipelines/doc_understanding.py:26`):
  single `DocUnderstanding` module, dict input validated by CLI
  (`doc_understanding.py:75`).
- `PPChatOCRv4Doc` (`paddleocr/_pipelines/pp_chatocrv4_doc.py:23`, PaddleX
  `PP-ChatOCRv4-doc:81`): `visual_predict_iter:104` + vector-store
  `save/load_vector:84`, `save/load_visual_info_list:96`.
- `TableRecognitionPipelineV2` (`table_recognition_v2.py:25`),
  `SealRecognition` (`seal_recognition.py:25`),
  `FormulaRecognitionPipeline` (`formula_recognition.py:25`),
  `PPDocTranslation` (`pp_doctranslation.py:24`): same wrapper pattern,
  registered in `paddleocr/_pipelines/__init__.py:15` and
  `paddleocr/_cli.py:57`.

## Model Layer

- Registry: 13 predictors exported from `paddleocr/_models/__init__.py:15`
  (`ChartParsing`, `DocImgOrientationClassification`, `DocVLM`,
  `FormulaRecognition`, `LayoutDetection`, `SealTextDetection`,
  `TableCellsDetection`, `TableClassification`, `TableStructureRecognition`,
  `TextDetection`, `TextImageUnwarping`, `TextLineOrientationClassification`,
  `TextRecognition`).
- Each file sets `default_model_name`, e.g. `TextDetection`
  (`paddleocr/_models/text_detection.py:24`, default
  `PP-OCRv6_medium_det:26`); `DocVLM` (`paddleocr/_models/doc_vlm.py:22`,
  default `PP-DocBee2-3B:24`).
- Shared mixins: `paddleocr/_models/_text_detection.py`,
  `paddleocr/_models/_object_detection.py`,
  `paddleocr/_models/_image_classification.py`,
  `paddleocr/_models/_doc_vlm.py:25` (`BaseDocVLM` + dict-input CLI mixin).
- Creation: `create_predictor(model_name, model_dir, **engine/device kwargs)`
  (`paddleocr/_models/base.py:71`); extra VLM init args via
  `_get_extra_paddlex_predictor_init_args` (`base.py:68`, `_doc_vlm.py:34`).

## Data Flow (image/PDF -> JSON/Markdown)

1. Input is a path, URL, or list (`-i/--input` required,
   `paddleocr/_utils/cli.py:31`).
2. Wrapper `predict_iter` streams PaddleX result objects
   (`paddleocr/_utils/cli.py:64`); `predict` returns `list`.
3. CLI prints each result (`res.print()`) and optionally saves all outputs
   (`res.save_all(save_path)`) (`paddleocr/_utils/cli.py:71`).
4. Structure/VL results expose Markdown pages; concatenation/restructure
   helpers produce final `.md` (`pp_structurev3.py:300`, `paddleocr_vl.py:216`).
5. Office docs bypass OCR: `paddleocr/_doc2md/` converters
   (`converters/docx.py`, `converters/xlsx.py`, `converters/pptx.py`) with
   `doc2md_convert/supported_formats` (`paddleocr/__init__.py:70`).

## Extension Points

- New pipeline: subclass `PaddleXPipelineWrapper`
  (`paddleocr/_pipelines/base.py:54`), set `_paddlex_pipeline_name`,
  implement `_get_paddlex_config_overrides` with `create_config_from_structure`
  (`paddleocr/_pipelines/utils.py:16`), add `get_cli_subcommand_executor`,
  export in `_pipelines/__init__.py:15` and register in `_cli.py:57`.
- New model: subclass `PaddleXPredictorWrapper`
  (`paddleocr/_models/base.py:30`), set `default_model_name`, add executor
  extending `PredictorCLISubcommandExecutor` (`base.py:85`), export in
  `_models/__init__.py:15`, register in `_cli.py:75`.
- Runtime tuning without code: pass `paddlex_config` YAML path + `device`,
  `engine`, `precision`, `enable_mkldnn`, `cpu_threads`
  (`paddleocr/_common_args.py:38`, `paddleocr/_constants.py:15`); dump merged
  config via `export_paddlex_config_to_yaml` (`base.py:74`).

---
*Architecture analysis: 2026-10-15*
