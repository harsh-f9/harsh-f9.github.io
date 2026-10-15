# Codebase Structure

**Analysis Date:** 2026-10-15

## Directory Layout

```text
PaddleOCR/
├── paddleocr/            # v3 Python package (pipelines, models, CLI, API)
├── ppocr/                # legacy v2 package stub (compat only)
├── ppstructure/          # legacy structure-system entry (compat only)
├── configs/              # training configs (det/rec/cls/table/kie)
├── tools/                # train/eval/infer/export scripts (legacy workflow)
├── deploy/               # serving & edge deployment (hubserving/cpp/lite/…)
├── applications/         # downstream demos
├── benchmark/            # det/rec benchmark scripts
├── api_sdk/              # cloud API docs/examples
├── mcp_server/           # MCP server package (paddleocr_mcp)
├── tests/                # pytest entry (ppstructure)
├── docs/ doc/ readme/    # mkdocs docs + language readmes
└── pyproject.toml setup.py train.sh  # packaging + training launcher
```

## Top-Level Dir Table

| Dir | Purpose | Key contents |
|-----|---------|--------------|
| `paddleocr/` | v3 runtime: wrappers + CLI + API client + office-to-md | `paddleocr/_pipelines/`, `paddleocr/_models/`, `paddleocr/_cli.py:57`, `paddleocr/_api_client/`, `paddleocr/_doc2md/` |
| `ppocr/` | Legacy v2 namespace, kept for imports | `ppocr/__init__.py` (stub) |
| `ppstructure/` | Legacy layout/table system entry | `ppstructure/predict_system.py`, `ppstructure/utility.py` |
| `configs/` | Training hyper-params per model family | `configs/rec/`, `configs/det/`, `configs/cls/`, `configs/table/`, e.g. `configs/rec/PP-FormuaNet/PP-FormulaNet-L.yaml` |
| `tools/` | Legacy train/eval/infer/export CLIs | `tools/train.py`, `tools/eval.py`, `tools/infer_rec.py`, `tools/infer_det.py`, `tools/infer_table.py`, `tools/export_model.py` |
| `deploy/` | Production serving targets | `deploy/hubserving/`, `deploy/cpp_infer/`, `deploy/lite/`, `deploy/slim/`, `deploy/ios_demo/`, `deploy/ppocr-android/`, `deploy/avh/` |
| `applications/` | End-user sample apps | `applications/README.md` |
| `benchmark/` | Throughput/accuracy measurement | `benchmark/run_det.sh`, `benchmark/analysis.py` |
| `api_sdk/` | Hosted API usage docs | `api_sdk/README.md`, `api_sdk/README_cn.md` |
| `mcp_server/` | MCP distribution (separate package `paddleocr_mcp`) | `mcp_server/pyproject.toml:5`, server sources |
| `tests/` | Active test suite | `tests/test_ppstructure.py` |
| `docs/` | mkdocs site (`mkdocs.yml`) | versioned EN/CN guides |

## Key Package Map

**`paddleocr/_pipelines/*` — 10 user-facing pipelines** (`paddleocr/_pipelines/__init__.py:15`):

- `paddleocr/_pipelines/base.py:54` — `PaddleXPipelineWrapper` + `PipelineCLISubcommandExecutor:112`
- `paddleocr/_pipelines/ocr.py:66` — `PaddleOCR`, CLI `ocr` (`ocr.py:427`)
- `paddleocr/_pipelines/pp_structurev3.py:31` — `PPStructureV3`, CLI `pp_structurev3` (`pp_structurev3.py:693`)
- `paddleocr/_pipelines/paddleocr_vl.py:37` — `PaddleOCRVL`, CLI `doc_parser` (`paddleocr_vl.py:300`)
- `paddleocr/_pipelines/doc_preprocessor.py:25`, `doc_understanding.py:26`, `pp_chatocrv4_doc.py:23`, `pp_doctranslation.py:24`, `table_recognition_v2.py:25`, `seal_recognition.py:25`, `formula_recognition.py:25`
- `paddleocr/_pipelines/utils.py:16` — `create_config_from_structure`; `_patch_layout_parsing.py:35` — bbox-overlap fix

**`paddleocr/_models/*` — 13 single-model predictors** (`paddleocr/_models/__init__.py:15`):

- `paddleocr/_models/base.py:30` — `PaddleXPredictorWrapper`; `base.py:85` — `PredictorCLISubcommandExecutor`
- Per-model: `text_detection.py:24`, `text_recognition.py`, `textline_orientation_classification.py`, `text_image_unwarping.py`, `doc_img_orientation_classification.py`, `layout_detection.py`, `table_classification.py`, `table_structure_recognition.py`, `table_cells_detection.py`, `seal_text_detection.py`, `formula_recognition.py`, `chart_parsing.py`, `doc_vlm.py:22`
- Shared mixins: `paddleocr/_models/_text_detection.py`, `_object_detection.py`, `_image_classification.py`, `_doc_vlm.py:25`

**Support packages:**

- `paddleocr/_utils/cli.py:31` — `-i/--input`, `perform_simple_inference:48`; `paddleocr/_utils/naming.py`, `langs.py`, `logging.py`, `deprecation.py`
- `paddleocr/_doc2md/` — office→Markdown: `core.py`, `base.py`, `registry.py`, `converters/docx.py`, `converters/xlsx.py`, `converters/pptx.py`, `math/omml.py`
- `paddleocr/_api_client/` — `client.py:42` sync, `async_client.py`, `models.py:91` options, `cli.py`, `_http.py`, `_poller.py`

## Entry Points (CLI/API/MCP)

- **Python API**: `import paddleocr` (`paddleocr/__init__.py:17` exports 10 pipelines + 13 models + `PaddleOCRClient/AsyncPaddleOCRClient` + `doc2md_convert:70`); e.g. `PaddleOCR().predict(input)`, `PPStructureV3().predict(input)`.
- **CLI**: `python -m paddleocr` → `paddleocr/__main__.py:38` → `paddleocr/_cli.py:301` `main()`. Pipelines in `_cli.py:57`, models in `_cli.py:75`, plus `install_hpi_deps:96`, `install_genai_server_deps:110`, `genai_server:126`, `doc2md:168`, `api:275`. Console script defined via packaging (`pyproject.toml`, `setup.py`).
- **Cloud API**: `PaddleOCRClient` (`paddleocr/_api_client/client.py:42`) + options (`models.py:91`); CLI via `register_api_command` (`paddleocr/_cli.py:275`); samples in `api_sdk/`.
- **MCP**: standalone package `paddleocr_mcp` (`mcp_server/pyproject.toml:5`), entry `paddleocr_mcp = "paddleocr_mcp.__main__:main"` (`pyproject.toml:29`), deps `mcp/fastmcp/httpx/paddleocr` (`pyproject.toml:9`).
- **Legacy**: `tools/infer_*.py` + `ppstructure/predict_system.py` + `deploy/hubserving/*module.py` (v2 serving path, not the v3 default).

## Config System

- **Constructor kwargs** beat YAML: every wrapper stores `self._params`, then `_get_merged_paddlex_config` deep-merges over `load_pipeline_config(name)` (`paddleocr/_pipelines/base.py:90`); `None` values are skipped by `create_config_from_structure` (`_pipelines/utils.py:16`).
- **Common inference args** shared by all wrappers (`paddleocr/_common_args.py:38`): `device/engine/engine_config/enable_hpi/use_tensorrt/precision/enable_mkldnn/mkldnn_cache_capacity/cpu_threads/enable_cinn`; defaults in `paddleocr/_constants.py:15`; device/engine→PaddleX translation in `prepare_common_init_args:102`; CLI flags added by `add_common_cli_opts:129` (pipelines allow multi-device, models single).
- **PaddleX YAML**: pass `paddlex_config=<path|name>` to any pipeline constructor or `--paddlex_config` on CLI (`base.py:126`); snapshot effective config with `export_paddlex_config_to_yaml` (`base.py:74`).
- **Training configs** (`configs/`): YAML per det/rec/cls/table/kie family consumed by `tools/train.py` + `train.sh`, separate from inference-time PaddleX YAML above.
- **Model selection**: `model_name` (registry) vs `model_dir` (local path) on every `_models` wrapper (`base.py:31`); pipeline `*_model_name/*_model_dir` pairs fan out to sub-modules (see `ocr.py:247`, `pp_structurev3.py:307`, `paddleocr_vl.py:235`).

---
*Structure analysis: 2026-10-15*
