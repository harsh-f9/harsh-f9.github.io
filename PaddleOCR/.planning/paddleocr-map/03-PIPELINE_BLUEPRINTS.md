# Pipeline Blueprints

All v3 pipelines subclass `PaddleXPipelineWrapper` (`paddleocr/_pipelines/base.py:54`).
It merges YAML + constructor overrides (`base.py:90`), builds via
`create_pipeline` (`base.py:102`), exposes `predict_iter`/`predict`/`close`.
CLI contract is `CLISubcommandExecutor` (`paddleocr/_abstract.py:18`).
Overrides use `create_config_from_structure` (`paddleocr/_pipelines/utils.py:16`).
`None` values are skipped, so unset kwargs keep YAML defaults.

## 1. OCR — `PaddleOCR`

- Class: `paddleocr/_pipelines/ocr.py:66`. PaddleX name `"OCR"` (`ocr.py:176`).
- CLI: `ocr` (`ocr.py:427`). Legacy `ocr()` deprecated (`ocr.py:239`).
- Stages: `DocPreprocessor` (orientation-classify + unwarping, optional) →
  `TextDetection` → `TextLineOrientation` (optional) → `TextRecognition`.
- Key functions: `predict_iter` (`ocr.py:179`), `predict` (`ocr.py:208`),
  `_get_paddlex_config_overrides` (`ocr.py:247`),
  `_get_ocr_model_names` (`ocr.py:318`).
- Model auto-select: default `PP-OCRv6_medium_det` + `PP-OCRv6_medium_rec`
  (`ocr.py:330`); versions `PP-OCRv3/v4/v5/v6` (`ocr.py:58`); `lang` ignored when
  explicit model names/dirs given (`ocr.py:123`).
- Config inputs: `*_model_name/*_model_dir` pairs, `use_doc_orientation_classify`,
  `use_doc_unwarping`, `use_textline_orientation`, `text_det_*` (limit_side_len,
  limit_type, thresh, box_thresh, unclip_ratio, input_shape),
  `text_rec_score_thresh`, `text_rec_input_shape`, `return_word_box`,
  `lang`, `ocr_version`, plus common args (`device/engine/precision/...`) and
  `paddlex_config` YAML path. Per-call `predict_iter` toggles (`ocr.py:179`).
- I/O: `image/PDF path | URL | list` → per-item result with `boxes` (quad polys),
  `rec_texts`, `rec_scores` (+ word boxes if `return_word_box`).
  `res.print()` / `res.save_all(save_path)` (`paddleocr/_utils/cli.py:48`).

```python
pipe = PaddleOCR(lang="ch")          # resolves det+rec names (ocr.py:113)
results = pipe.predict("img.jpg", text_det_thresh=0.3)
for r in results: r.print(); r.save_all("./out")
pipe.close()
```

## 2. PP-StructureV3 — `PPStructureV3`

- Class: `paddleocr/_pipelines/pp_structurev3.py:31`. PaddleX name
  `"PP-StructureV3"` (`pp_structurev3.py:144`). CLI `pp_structurev3`
  (`pp_structurev3.py:693`).
- Import side effect applies float64 bbox-overlap patches
  (`pp_structurev3.py:24`, `paddleocr/_pipelines/_patch_layout_parsing.py:35`).
- Stages: `DocPreprocessor` + `GeneralOCR` + `LayoutDetection` +
  `TableRecognition` (classify → wired/wireless structure + cells det) +
  `SealRecognition` + `FormulaRecognition` + `ChartRecognition` +
  `RegionDetection`. Composition via config override (`pp_structurev3.py:307`).
- Key functions: `predict_iter` (`pp_structurev3.py:148`),
  `predict` (`pp_structurev3.py:223`),
  `concatenate_markdown_pages` (`pp_structurev3.py:300`).
- Config inputs: all OCR knobs plus `layout_*` (threshold, nms, unclip_ratio,
  merge_bboxes_mode), `use_seal/table/formula/chart/region_detection`,
  `format_block_content`, `markdown_ignore_labels`, table e2e flags
  (`use_e2e_wired/wireless_table_rec_model`, default False/True),
  `use_table_orientation_classify`, `use_ocr_results_with_table_cells`.
- I/O: `PDF/image` → per-page `{markdown, json blocks (label+bbox+content),
  html tables}`. Join pages with `concatenate_markdown_pages`.

```python
pipe = PPStructureV3(use_table_recognition=True, use_seal_recognition=False)
pages = pipe.predict("doc.pdf")
md = pipe.concatenate_markdown_pages([p.markdown for p in pages])
```

## 3. PaddleOCR-VL — `PaddleOCRVL`

- Class: `paddleocr/_pipelines/paddleocr_vl.py:37`. Versions `v1/v1.5/v1.6`,
  default `v1.6` (`paddleocr_vl.py:25`); PaddleX names
  `PaddleOCR-VL[-1.5/-1.6]` (`paddleocr_vl.py:89`). CLI `doc_parser`
  (`paddleocr_vl.py:300`).
- Stages: `DocPreprocessor` → `LayoutDetection` (optional) → `VLRecognition`
  (VLM per block) + optional seal/chart/OCR-for-image-block.
- Backends via `VLRecognition.genai_config`: `native`, `vllm-server`,
  `sglang-server`, `fastdeploy-server`, `mlx-vlm-server`, `llama-cpp-server`
  (`paddleocr_vl.py:27`).
- Key functions: `predict_iter` (`paddleocr_vl.py:100`),
  `concatenate_markdown_pages` (`paddleocr_vl.py:216`),
  `restructure_pages(merge_tables, relevel_titles)` (`paddleocr_vl.py:219`),
  overrides (`paddleocr_vl.py:235`).
- Config inputs: `pipeline_version`, `vl_rec_model_name/dir/backend/server_url/
  max_concurrency/api_model_name/api_key`, layout knobs, sampling knobs
  (`temperature/top_p/repetition_penalty/max_new_tokens/min/max_pixels`),
  `layout_shape_mode`, `prompt_label`, `vlm_extra_args`, `merge_layout_blocks`.
- I/O: `image/PDF` → per-page `{markdown, blocks with labels+bboxes}`.

```python
pipe = PaddleOCRVL(pipeline_version="v1.6", vl_rec_backend="native")
pages = pipe.predict("doc.pdf", temperature=0.0, max_new_tokens=4096)
pages = pipe.restructure_pages(pages, merge_tables=True)
```

## 4. HPD-Parsing (specialist single-model pipelines)

- No `hpd*` module exists in `paddleocr/_pipelines/` (verified listing:
  `base, doc_preprocessor, doc_understanding, formula_recognition, ocr,
  paddleocr_vl, pp_chatocrv4_doc, pp_doctranslation, pp_structurev3,
  seal_recognition, table_recognition_v2, utils`). High-precision parsing is
  covered by these specialist wrappers, same `PaddleXPipelineWrapper` pattern:
- `TableRecognitionPipelineV2` (`paddleocr/_pipelines/table_recognition_v2.py:25`),
  `SealRecognition` (`seal_recognition.py:25`),
  `FormulaRecognitionPipeline` (`formula_recognition.py:25`).
- Stages per pipe: crop/region in → classify/detect → structure/recognize →
  HTML/LaTeX/text out. Reused as sub-pipelines inside StructureV3/ChatOCR.
- Config inputs: `*_model_name/*_model_dir`, `*_batch_size`, det thresholds,
  `paddlex_config`, common device args.
- I/O: `image crop` → `{boxes | html | latex | text + scores}`.

```python
from paddleocr import TableRecognitionPipelineV2  # check _pipelines/__init__.py:15
pipe = TableRecognitionPipelineV2()
res = pipe.predict("table.png")
```

## 5. ChatOCR — `PPChatOCRv4Doc`

- Class: `paddleocr/_pipelines/pp_chatocrv4_doc.py:23`. PaddleX name
  `"PP-ChatOCRv4-doc"` (`pp_chatocrv4_doc.py:81`). CLI `pp_chatocrv4_doc`.
- Stages: `LayoutParser` (DocPreprocessor + GeneralOCR + Layout + Table + Seal)
  → `visual_predict` → `build_vector` (retriever index) → `mllm_pred`
  (optional) → `chat` (LLM key extraction).
- Key functions: `visual_predict_iter` (`pp_chatocrv4_doc.py:104`),
  `build_vector` (`pp_chatocrv4_doc.py:212`), `mllm_pred`
  (`pp_chatocrv4_doc.py:229`), `chat` (`pp_chatocrv4_doc.py:236`),
  `save/load_vector` (`pp_chatocrv4_doc.py:84`), `save/load_visual_info_list`
  (`pp_chatocrv4_doc.py:96`). CLI flow: visual → vector → chat
  (`pp_chatocrv4_doc.py:718`).
- Config inputs: layout/OCR/seal/table knobs (as StructureV3) plus
  `retriever_config` (embedding model, e.g. qianfan `embedding-v1`),
  `mllm_chat_bot_config` (PP-DocBee endpoint), `chat_bot_config`
  (e.g. `ernie-3.5-8k`) (`pp_chatocrv4_doc.py:690`).
- I/O: `image/PDF + key_list` → `{chat_res: {key: value}}`; intermediate
  `visual_info` list and `vector_info` are serializable.

```python
pipe = PPChatOCRv4Doc(retriever_config={...}, chat_bot_config={...})
visual = pipe.visual_predict("invoice.pdf")      # [{visual_info, layout_parsing_result}]
vec = pipe.build_vector([v["visual_info"] for v in visual])
out = pipe.chat(["amount", "date"], [v["visual_info"] for v in visual], vector_info=vec)
```

## 6. Translation — `PPDocTranslation`

- Class: `paddleocr/_pipelines/pp_doctranslation.py:24`. PaddleX name
  `"PP-DocTranslation"` (`pp_doctranslation.py:101`). CLI `pp_doctranslation`.
- Stages: `LayoutParser` (same family as StructureV3) → `visual_predict`
  (per-page markdown) → `load_from_markdown` (resume) → `translate`
  (LLM chunk translation) → markdown out.
- Key functions: `visual_predict_iter` (`pp_doctranslation.py:104`),
  `translate_iter` (`pp_doctranslation.py:248`),
  `load_from_markdown` (`pp_doctranslation.py:312`),
  `concatenate_markdown_pages` (`pp_doctranslation.py:315`). CLI flow
  (`pp_doctranslation.py:910`).
- Config inputs: layout/OCR/table/seal/formula/chart knobs + `chat_bot_config`
  (LLM endpoint); per-call `target_language` (default `"zh"`), `chunk_size`
  (default 5000), `glossary`, `task_description/output_format/rules_str`,
  few-shot demos, `llm_request_interval`.
- I/O: `PDF/image` → `ori_md_info_list` → translated markdown pages.

```python
pipe = PPDocTranslation(chat_bot_config={...})
vis = pipe.visual_predict("doc_en.pdf")
mds = [v["layout_parsing_result"].markdown for v in vis]
out = pipe.translate(mds, target_language="zh", chunk_size=5000)
```
