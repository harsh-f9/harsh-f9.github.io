# Testing Patterns

**Analysis Date:** 2026-10-15

## Test Layout (`tests/` vs `test_tipc/`)

- `tests/` is the pytest suite (43 files). `test_tipc/` is the legacy train-infer shell harness; `benchmark/` is perf logging. Do not mix them.
- `tests/` layout by area:
  - `tests/models/test_*.py` + `tests/pipelines/test_*.py` — per-model/pipeline `test_predict` + `test_predict_params` pairs (e.g. `tests/models/test_text_detection.py:39-72`, `tests/pipelines/test_ocr.py:40-84`).
  - `tests/api_client/test_{core,http,cli,resources}.py` — offline SDK logic with mocks; no network.
  - `tests/{unit,tools,utils,security,ppocr}/` — isolated regression tests that stub heavy deps (`tests/unit/test_patch_layout_parsing.py:32-47`, `tests/tools/test_program_safe_yaml.py:34-71`, `tests/security/test_lmdb_pickle.py:35-67`).
  - `tests/testing_utils.py:17-50` + `tests/conftest.py:22-28` + `tests/test_files/` (`table.jpg`, `formula.png`, `seal.png`) — shared helpers, sys.path fix, fixture images.
- `test_tipc/` layout: `test_train_inference_python.sh:1-343` (train→eval→export→infer matrix), per-model txt configs in `test_tipc/configs/` (~70 dirs), `test_tipc/common_func.sh`, `test_tipc/compare_results.py`, `test_tipc/readme.md:1-60` (TIPC support matrix). Invoked manually per model, not by pytest.

## How To Run

```bash
pytest --verbose tests/                                              # default CI (excludes resource_intensive via pyproject addopts)
pytest --verbose tests/ -m "not resource_intensive and not py38_incompatible"  # Python 3.8 path (.github/workflows/tests.yml:80)
pytest tests/api_client tests/utils tests/tools -v                   # fast offline subset (no weights/network)
pytest -m resource_intensive tests/models/test_doc_vlm.py -v         # opt-in heavy model test
```

- Markers defined in `pyproject.toml:82-87` (`resource_intensive`, `py38_incompatible`; default `-m 'not resource_intensive'`). Most model/pipeline files set `pytestmark = pytest.mark.py38_incompatible` (e.g. `tests/models/test_text_detection.py:25`); VL/doc tests add `@pytest.mark.resource_intensive` (`tests/models/test_doc_vlm.py:32`, `tests/pipelines/test_pp_structurev3.py:32`).
- CI matrix (`ubuntu-latest`, py `3.8/3.9/3.13`) installs `paddlepaddle` CPU + `paddlex>=3.7.0,<3.8.0` then `pytest --verbose tests/` (`.github/workflows/tests.yml:30-83`). Style gate is separate (`pre-commit run --all-files` in `.github/workflows/codestyle.yml:38-41`).
- Canonical test shapes to copy:
  - Inference: module fixture + `parametrize(image_path)` + `check_simple_inference_result()` (`tests/models/test_text_detection.py:28-49`, `tests/pipelines/test_ocr.py:25-56`).
  - Param forwarding: `monkeypatch` the inner predictor and assert kwargs pass through (`tests/testing_utils.py:28-50`, used at `tests/models/test_text_detection.py:61-72`).
  - HTTP: `HTTPServer` + `mock_server` fixture, assert path/headers/body JSON and error mapping (`tests/api_client/test_http.py:71-82`, `tests/api_client/test_http.py:85-214`).
  - Heavy-dep isolation: `importlib.spec_from_file_location` + `monkeypatch.setitem(sys.modules, ...)` stubs (`tests/unit/test_patch_layout_parsing.py:32-40`, `tests/tools/test_program_safe_yaml.py:34-71`).

## Coverage Gaps

- `tests/test_ppstructure.py:1-13` is a license-header-only stub — no coverage there.
- Heavy paths are excluded by default: `resource_intensive` (DocVLM at `tests/models/test_doc_vlm.py:39-49`, doc-understanding, PPStructureV3) and most `py38_incompatible` model tests need paddlex weights + `tests/test_files/` images. Local `pytest tests/` without models only exercises `api_client/utils/tools/security`.
- Legacy runtime has almost no pytest coverage: `tools/infer_*.py`, `tools/train.py`, `tools/eval.py`, `tools/export_model.py` — only `load_config`/`_parse_opt` safe-YAML behavior is pinned (`tests/tools/test_program_safe_yaml.py:74-95`). `ppocr/` coverage is limited to postprocess/augment/pickle cases (`tests/ppocr/test_rec_postprocess.py:24-60`, `tests/ppocr/test_iaa_augment.py`, `tests/security/test_lmdb_pickle.py:99-150`).
- Known-but-unasserted bugs live in `TEST_REPORT.md:54-61` (async poll timeout ignored, Go/TS SDK parallels, CLI `store_true` sending `False`). The blocking `fetch_jsonl` BOS-auth bug (`TEST_REPORT.md:31-48`) has no regression test asserting `fetch_jsonl` uses an auth-free request.
- `test_tipc/*.sh` and `benchmark/` are unmeasured by pytest; failures surface only as shell `status_check` log lines (`test_tipc/test_train_inference_python.sh:139`, `test_tipc/test_train_inference_python.sh:304`).

## Benchmark Approach

- Scope: detection training throughput (DB/EAST/PSE on ICDAR2015, ResNet/MobileNet backbones, bs 8/16) per `benchmark/readme.md:4-15`. This measures `tools/` + `ppocr/` training, not the `paddleocr` pip package.
- Run: `bash benchmark/run_det.sh` from repo root (`benchmark/readme.md:17-22`). It `pip install -r requirements.txt`, `wget`s ICDAR2015 + pretrained backbones (`benchmark/run_det.sh:6-11`), then loops models × fp32 × batch-size × `sp/mp` (1 vs 8 GPU) via `benchmark/run_benchmark_det.sh` (`benchmark/run_det.sh:14-36`).
- Analyze: `benchmark/analysis.py:92-157` (`TimeAnalyzer` extracts keyword records) then `analysis():192-264` computes skipped-average IPS/FPS and emits JSON `run_info` (`benchmark/analysis.py:267-354`). Expected outputs are `det_res18_db_v2.0_{sp,mp}_bs{8,16}_fp32_1` logs (`benchmark/readme.md:24-30`).
- TIPC (correctness, not speed): `bash test_tipc/test_train_inference_python.sh <txt-config> <MODE>` with `MODE` in `lite_train_lite_infer|lite_train_whole_infer|whole_train_whole_infer|whole_infer` (`test_tipc/test_train_inference_python.sh:4-6`). `func_inference()` sweeps cpu/gpu × mkldnn/trt × precision × batch (`test_tipc/test_train_inference_python.sh:99-179`); train path sweeps trainers/AMP/multi-gpu (`test_tipc/test_train_inference_python.sh:217-343`). Results append to `test_tipc/output/<model>/<MODE>/results_python.log`.

---

*Testing analysis: 2026-10-15*
