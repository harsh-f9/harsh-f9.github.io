# 06 — Rebuild Guide (port one PaddleOCR feature elsewhere)

## 1. How To Rebuild One Feature Elsewhere (5-step template)
Example: port `TextDetection` to a new repo/runtime.

- **Step 1 — Define I/O schema.** Fix input (`str|Path|ndarray|list`) and output (boxes+scores JSON). Copy option dataclass shape from `paddleocr/_api_client/models.py:72-80`; wire keys camelCase via `snake_to_camel()` (`paddleocr/_utils/naming.py:18-26`).
- **Step 2 — Pick detector + recognizer.** Subclass predictor wrapper (`paddleocr/_models/base.py:30-47`) with `default_model_name` (e.g. `PP-OCRv6_medium_det` at `paddleocr/_models/text_detection.py:26-27`); pipeline composes via `create_pipeline` + `load_pipeline_config` (`paddleocr/_pipelines/base.py:92-105`). Concrete mixin pattern: `TextDetectionMixin+PaddleXPredictorWrapper` (`paddleocr/_models/text_detection.py:24-40`); pipeline ex `paddleocr/_pipelines/ocr.py:22-42`.
- **Step 3 — Add preprocess/postprocess.** Normalize device/engine with `parse_common_args` + `prepare_common_init_args` (`paddleocr/_common_args.py:38-126`); CLI flags via `add_common_cli_opts` (`paddleocr/_common_args.py:129-188`). Keep 2.x aliases in `_DEPRECATED_PARAM_NAME_MAPPING` (`paddleocr/_pipelines/ocr.py:44-56`).
- **Step 4 — Add serializer to Markdown/JSON.** Reuse hosted result types (`paddleocr/_api_client/results.py`) and `_ocr_result_to_dict` / `_doc_parsing_result_to_dict` (`paddleocr/_api_client/cli.py:333-357`); doc2md converters live in `paddleocr/_doc2md/converters/`.
- **Step 5 — Add eval + deploy.** Add pytest pair + TIPC config, then pick a `deploy/` target (below).

## 2. Minimal Dependency Set
From `pyproject.toml:49-55` (+ `requirements.txt:1-18` for training):
```bash
pip install "paddlex[ocr-core]>=3.7.0,<3.8.0" "PyYAML>=6" requests "aiohttp>=3.8.0" "typing-extensions>=4.12"
pip install "paddleocr[doc-parser]"   # only if DocPreprocessor/VL needed (pyproject.toml:67)
pip install paddlepaddle            # CPU default; GPU/XPU/NPU per docs/version3.x/other_devices_support/
pip install "paddleocr[doc2md]"      # only for office→md: python-docx/pptx, openpyxl, pylatexenc (pyproject.toml:70)
```
- Build: `setuptools==72.1.0` + `setuptools_scm` (`pyproject.toml:2-3`); version via `importlib.metadata` fallback `0.0.0` (`paddleocr/_version.py:18-20`).
- MCP extra: `mcp>=1.5.0, fastmcp>=2.0.0, httpx, pillow, puremagic` (`mcp_server/pyproject.toml:9-18`, `requires-python>=3.10`).
- JS/Go SDKs need no Paddle runtime (cloud-only per `api_sdk/README.md:5-7`).

## 3. Test Strategy (tests/ + test_tipc/ how to copy)
- Fast offline: `pytest tests/api_client tests/utils tests/tools -v` (mocked HTTP via `HTTPServer` fixture `tests/api_client/test_http.py:71-82`).
- Copy inference shape: fixture + `parametrize(image)` + `check_simple_inference_result()` (`tests/models/test_text_detection.py:28-49`, `tests/pipelines/test_ocr.py:25-56`); helpers `tests/testing_utils.py:17-50`, fixtures `tests/test_files/`, path fix `tests/conftest.py:22-28`.
- Copy param-forwarding test: `monkeypatch` inner predictor, assert kwargs (`tests/models/test_text_detection.py:61-72`).
- Copy isolation pattern for heavy deps: `importlib.spec_from_file_location` + `sys.modules` stubs (`tests/unit/test_patch_layout_parsing.py:32-40`, `tests/tools/test_program_safe_yaml.py:34-71`).
- Markers `resource_intensive`, `py38_incompatible` (`pyproject.toml:82-87`); default excludes intensive (`addopts`); run heavy opt-in: `pytest -m resource_intensive tests/models/test_doc_vlm.py -v`.
- TIPC (train→export→infer matrix): `bash test_tipc/test_train_inference_python.sh <cfg> <MODE>` (`test_tipc/test_train_inference_python.sh:4-6`); configs `test_tipc/configs/` (~70 dirs); CPU/GPU×MKLDNN/TRT sweep in `func_inference()` (`test_tipc/test_train_inference_python.sh:99-179`).
- SDK validation: `pytest tests/api_client/`, `npm run lint && npm test` (TS), `go test ./...` (Go) per `api_sdk/README.md:36-50`.

## 4. Common Pitfalls
- **Facade vs legacy duplication.** `paddleocr/` delegates to PaddleX; `ppocr/`+`tools/`+`configs/` is train-only legacy, not shipped (`pyproject.toml:73-76` includes only `paddleocr`, `paddleocr/_pipelines/base.py:102-109`). Don't import `ppocr` from new `paddleocr/` code; don't fix bugs in one tree only (3 entry points: `paddleocr/_pipelines/` vs `tools/infer/` vs `deploy/cpp_infer/`+`lite/`).
- **Version pins.** `paddlex[ocr-core]>=3.7.0,<3.8.0` repeated 4× (`pyproject.toml:50,67-71`); lockstep on 3.8. `install_hpi_deps`/`install_genai_server_deps` float unpinned (`paddleocr/_cli.py:96-124`); `mcp_server` floats `paddleocr>=3.7.0` no upper bound (`mcp_server/pyproject.toml:9-18`).
- **String-keyed STRUCTURE overrides** (`paddleocr/_pipelines/ocr.py:248-316`, merged blindly `paddleocr/_pipelines/base.py:90-100`) + ~80-line duplicated dicts (`paddleocr/_pipelines/pp_doctranslation.py:323`); validate keys vs `load_pipeline_config()`.
- **Stale deploy/docs.** `deploy/README.md:26` links missing `pdserving/`; `deploy/` has 14 targets of mixed freshness; two doc trees `doc/` vs `docs/` (canonical `docs/version3.x/`).
- **Secrets/validation.** API keys as CLI flags (`paddleocr/_pipelines/pp_doctranslation.py:902-923`); placeholder `"api_key":"fake_key"` (`paddleocr/_pipelines/pp_chatocrv4_doc.py:706-716`); thin `validate_input_source` (`paddleocr/_api_client/_core.py:38-42`).

## Copy-paste checklist
- [ ] I/O dataclass + `snake_to_camel` test (`tests/utils/test_naming.py:18-33`)
- [ ] Wrapper subclass + `default_model_name` + `get_cli_subcommand_executor()`; register in `paddleocr/_cli.py:57-93`
- [ ] `paddleocr/__init__.py:17-131` re-export; Apache header on new files
- [ ] `yaml.SafeLoader` only (`tests/tools/test_program_safe_yaml.py:74-95`); deprecation map updated
- [ ] `test_predict` + `test_predict_params` + offline mocks; TIPC config if training
- [ ] `pre-commit run --all-files` (black 24.10.0, flake8 E9/F63/F7/F82/E721); pin `paddlex` surface
