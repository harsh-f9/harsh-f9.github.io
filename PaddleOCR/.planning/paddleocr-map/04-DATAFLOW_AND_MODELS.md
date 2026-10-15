# Dataflow and Models

## 1. End-to-end dataflow (ingest → serialize)

1. **Ingest.** Input is a path, URL, or list; `-i/--input` required
   (`paddleocr/_utils/cli.py:31`). `DocUnderstanding`/`DocVLM` take a dict
   `{image, query}` validated by `custom_type(dict)`
   (`paddleocr/_pipelines/doc_understanding.py:75`,
   `paddleocr/_models/_doc_vlm.py:38`).
2. **Preprocess.** `DocPreprocessor` wrapper
   (`paddleocr/_pipelines/doc_preprocessor.py:25`, PaddleX name
   `doc_preprocessor:47`): `DocOrientationClassify` (0/90/180/270) +
   `DocUnwarping` (UVDoc dewarp). Reused via `use_doc_preprocessor` flags in
   OCR (`paddleocr/_pipelines/ocr.py:291`), StructureV3
   (`pp_structurev3.py:315`), VL (`paddleocr_vl.py:243`).
3. **Layout.** `LayoutDetection` (PP-DocLayout_plus-L) segments page into
   text/table/figure/formula/seal/chart blocks with bboxes + labels.
4. **Detection.** `TextDetection` crops lines/words inside text blocks
   (`limit_side_len/limit_type/thresh/box_thresh/unclip_ratio`);
   seal/table-cells variants run on their regions.
5. **Recognition.** `TextRecognition` decodes crops → `(text, score)`;
   `return_word_box` adds word boxes (`ocr.py:309`). Formula/chart/table
   specialists decode their own regions (LaTeX / HTML / CSV-ish).
6. **Structure.** Reading-order sort + block merge; tables → HTML
   (`use_ocr_results_with_table_cells`, e2e flags in `pp_structurev3.py:177`);
   optional float64 bbox-overlap patch
   (`paddleocr/_pipelines/_patch_layout_parsing.py:35`).
7. **Serialize.** `predict_iter` streams PaddleX result objects;
   `predict` materializes to list (`paddleocr/_models/base.py:53`);
   CLI prints (`res.print()`) and saves (`res.save_all(save_path)`)
   (`paddleocr/_utils/cli.py:48`). Markdown pages joined via
   `concatenate_markdown_pages` (`pp_structurev3.py:300`,
   `paddleocr_vl.py:216`) or `restructure_pages` (`paddleocr_vl.py:219`).
   Office docs bypass OCR via `paddleocr/_doc2md/` converters.

## 2. Model registry (`paddleocr/_models/*.py`)

Base: `PaddleXPredictorWrapper` (`paddleocr/_models/base.py:30`) with
`model_name | model_dir`, `predict_iter/predict` (`base.py:53`),
`create_predictor` (`base.py:71`), CLI mixin
`PredictorCLISubcommandExecutor` (`base.py:85`). Shared mixins:
`_text_detection.py`, `_object_detection.py`, `_image_classification.py`,
`_doc_vlm.py:25` (`BaseDocVLM` + dict-input CLI mixin).

| Wrapper (file) | Purpose | Default model |
|---|---|---|
| `TextDetection` (`text_detection.py:24`) | DB-based text box detection | `PP-OCRv6_medium_det` (`:27`) |
| `TextRecognition` (`text_recognition.py`) | CTC/attention line recognition | `PP-OCRv6_medium_rec` (`:37`) |
| `TextLineOrientationClassification` (`textline_orientation_classification.py:23`) | 0/180° line flip | `PP-LCNet_x0_25_textline_ori` |
| `TextImageUnwarping` (`text_image_unwarping.py:33`) | Photo-doc dewarp (UVDoc) | `UVDoc` (`:34`) |
| `DocImgOrientationClassification` (`doc_img_orientation_classification.py:23`) | Page 0/90/180/270 | `PP-LCNet_x1_0_doc_ori` |
| `LayoutDetection` (`layout_detection.py:23`) | Block segmentation | `PP-DocLayout_plus-L` (`:24`) |
| `TableClassification` (`table_classification.py:23`) | Wired vs wireless table | `PP-LCNet_x1_0_table_cls` |
| `TableStructureRecognition` (`table_structure_recognition.py:33`) | Cell structure (SLANet) | `SLANet` (`:34`) |
| `TableCellsDetection` (`table_cells_detection.py:23`) | Cell boxes (RT-DETR) | `RT-DETR-L_wired_table_cell_det` |
| `SealTextDetection` (`seal_text_detection.py:26`) | Curved seal text boxes | `PP-OCRv4_mobile_seal_det` |
| `FormulaRecognition` (`formula_recognition.py:33`) | Formula → LaTeX | `PP-FormulaNet_plus-M` (`:34`) |
| `ChartParsing` (`chart_parsing.py:24`) | Chart → table | `PP-Chart2Table` (`:25`) |
| `DocVLM` (`doc_vlm.py:22`) | VQA/doc understanding VLM | `PP-DocBee2-3B` (`:25`) |

Extra VLM init args hook: `_get_extra_paddlex_predictor_init_args`
(`base.py:68`, `_doc_vlm.py:34`).

## 3. Postprocess & metrics (legacy `ppocr/` training stack)

- **Detection.** `DBPostProcess` (`ppocr/postprocess/db_postprocess.py:29`):
  `thresh/box_thresh/unclip_ratio` (`:34`), `polygons/boxes_from_bitmap`
  (`:59`/`:109`), `unclip` via pyclipper (`:160`), `__call__` maps score maps
  → `{"points": boxes}` (`:227`). Siblings: `east/fce/sast/ct/pg/drrg/
  picodet_postprocess.py`, `locality_aware_nms.py`, `table_postprocess.py`,
  `cls_postprocess.py`, VQA `vqa_token_*_postprocess.py`.
- **Recognition.** `BaseRecLabelDecode` + `CTCLabelDecode`
  (`ppocr/postprocess/rec_postprocess.py:23`/`:201`): argmax + blank-strip +
  dup-removal → `(text, mean_conf)`; `return_word_box` path uses
  `get_word_info` (`:72`). Variants in same file: attention/SAR/SATRN/PRENR/
  NRTR/ParseQ/CAN/CPPD/LaTeXOCR/UniMERNet decodes.
- **Metrics** (`ppocr/metrics/`): `RecMetric`
  (`rec_metric.py:23`, acc + edit-distance/BLEU via `bleu.py`),
  `det_metric.py` (IoU, see `eval_det_iou.py`), `cls_metric.py`,
  `table_metric.py`, `kie_metric.py`, `e2e_metric.py`, `ct_metric.py`,
  `sr_metric.py`, VQA `vqa_token_*_metric.py`, `distillation_metric.py`.
- Note: v3 inference (`paddleocr/`) delegates postprocess to PaddleX
  predictors; `ppocr/postprocess|metrics` serve the `tools/` train/eval loop.

## 4. Config & training (`configs/`, `tools/`, `benchmark/`)

- **Training configs.** `configs/<det|rec|cls|table|kie>/*.yaml`, e.g.
  `configs/rec/PP-FormuaNet/PP-FormulaNet-L.yaml`: `Global` (epochs, lr
  schedule, `rec_char_dict_path`, `input_size [768,768]`) (`:1`),
  `Optimizer` AdamW + LinearWarmupCosine (`:27`), `Architecture`
  (`model_type: rec`, Vary-VIT backbone + PPFormulaNet head) (`:36`).
  Consumed by `tools/train.py` (via `train.sh`), separate from inference
  PaddleX YAML passed as `paddlex_config` (`base.py:126`).
- **Tools.** `tools/infer_rec.py` builds model + postprocess
  (`:33`-`:36`: `build_model`, `build_post_process`, `load_model`,
  `get_image_file_list`); siblings `infer_det/cls/e2e/kie/table/sr.py`,
  plus `tools/train.py`, `tools/eval.py`, `tools/export_model.py`
  (inference-model export for serving).
- **Benchmark.** `benchmark/run_det.sh`, `benchmark/analysis.py`
  (throughput/accuracy measurement; see STRUCTURE.md dir table).
- **Runtime tuning without code.** `device/engine/precision/enable_mkldnn/
  cpu_threads` (`paddleocr/_common_args.py:38`, defaults
  `paddleocr/_constants.py:15`); snapshot effective config with
  `export_paddlex_config_to_yaml` (`base.py:74`).
