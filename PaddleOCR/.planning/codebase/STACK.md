# Technology Stack

**Analysis Date:** 2026-10-15

## Languages & Runtimes

- Python `>=3.8` is the primary language (`pyproject.toml:17`).
- Declared support for Python 3.8–3.13 classifiers (`pyproject.toml:41-46`).
- Legacy training stack pins CV/data deps in `requirements.txt:1-18`: `shapely`, `scikit-image`, `pyclipper`, `lmdb`, `tqdm`, `numpy`, `rapidfuzz`, `opencv-python`, `opencv-contrib-python`, `cython`, `Pillow`, `pyyaml`, `requests`, `albumentations`, `albucore`, `packaging`.
- TypeScript/Node is secondary for browser SDK: `node >=20.11`, ESM workspaces `packages/*`, `apps/*` (`paddleocr-js/package.json:22-28`).
- Go is tertiary for the hosted-API SDK in `api_sdk/go/` (sources `client.go`, `ocr.go`, `transport.go`).

## Core Frameworks (PaddlePaddle / PaddleX)

- Runtime inference is delegated to PaddleX: hard dep `paddlex[ocr-core]>=3.7.0,<3.8.0` (`pyproject.toml:50`).
- Optional PaddleX extras: `doc-parser` → `paddlex[ocr,genai-client]`; `ie` → `paddlex[ie]`; `trans` → `paddlex[trans]` (`pyproject.toml:67-69`).
- Single-model wrapper calls `paddlex.create_predictor(model_name, model_dir, ...)` (`paddleocr/_models/base.py:17`, `paddleocr/_models/base.py:76-78`).
- Pipeline wrapper calls `paddlex.create_pipeline(config, ...)` and `paddlex.inference.load_pipeline_config(name)` (`paddleocr/_pipelines/base.py:18-19`, `paddleocr/_pipelines/base.py:92`, `paddleocr/_pipelines/base.py:105`).
- Public surface re-exports `paddlex.inference.utils.benchmark.benchmark` (`paddleocr/__init__.py:15`).
- Legacy training code under `ppocr/modeling/` imports `paddle` / `paddle.nn` directly (e.g. `ppocr/modeling/necks/csp_pan.py:18-19`); training configs live in `configs/{cls,det,e2e,kie,rec,sr,table}/`.
- HTTP plumbing: `requests` sync (`paddleocr/_api_client/_http.py:19`), `aiohttp>=3.8.0` async (`paddleocr/_api_client/_async_http.py:19`, `pyproject.toml:53`), `PyYAML>=6` for pipeline configs (`pyproject.toml:51`, `paddleocr/_pipelines/base.py:17`).

## Packaging & Entry Points (CLI / API)

- Build backend `setuptools.build_meta`, pinned `setuptools==72.1.0` + `wheel` + `setuptools_scm` (`pyproject.toml:2-3`); `setup.py:18` is a `setup()` shim only.
- Ships packages `paddleocr`, `paddleocr.*` via setuptools find (`pyproject.toml:73-75`).
- Console script `paddleocr = paddleocr.__main__:console_entry` (`pyproject.toml:64`); `console_entry()` wraps `main()` with SIGPIPE handling (`paddleocr/__main__.py:21-28`) and `__main__` guard (`paddleocr/__main__.py:38-39`).
- CLI is `argparse` with `prog="paddleocr"` (`paddleocr/_cli.py:282`); registers pipelines, models, `install_hpi_deps`, `install_genai_server_deps`, `genai_server`, `doc2md`, `api` (`paddleocr/_cli.py:287-293`).
- Each model/pipeline class exposes `get_cli_subcommand_executor()` wired into subparsers (`paddleocr/_models/base.py:63-66`, `paddleocr/_pipelines/base.py:82-85`).
- Hosted-API SDK entry points: `PaddleOCRClient` / `AsyncPaddleOCRClient` plus `Model`, `OCROptions`, `PPStructureV3Options`, `PaddleOCRVLOptions` (`paddleocr/__init__.py:44-65`); TS sources in `api_sdk/typescript/src/`, Go in `api_sdk/go/`.
- Office-to-Markdown extras: `python-docx`, `python-pptx`, `openpyxl`, `pylatexenc` (`pyproject.toml:70`); implementation in `paddleocr/_doc2md/{base.py,core.py,registry.py,converters/,math/}`.
- JS monorepo tooling: `vitest`, `eslint`, `prettier`, `typescript-eslint`, `jsdom` (`paddleocr-js/package.json:47-57`).

## Hardware Backends

- Device parsing via `paddlex.utils.device.get_default_device/parse_device` (`paddleocr/_common_args.py:15`); default device `None` = auto GPU0 else CPU (`paddleocr/_constants.py:15`, `paddleocr/_common_args.py:131-133`).
- Supported engines: `paddle`, `paddle_static`, `paddle_dynamic`, `transformers`, `onnxruntime` (`paddleocr/_common_args.py:29-35`).
- Tuning knobs: `DEFAULT_USE_TENSORRT=False`, `DEFAULT_PRECISION="fp32"` (`fp32`/`fp16` only), `DEFAULT_ENABLE_MKLDNN=True`, `DEFAULT_MKLDNN_CACHE_CAPACITY=10`, `DEFAULT_CPU_THREADS=10`, `DEFAULT_USE_CINN=False` (`paddleocr/_constants.py:16-22`); exposed as `--device/--engine/--enable_hpi/--use_tensorrt/--precision/--enable_mkldnn/--mkldnn_cache_capacity/--cpu_threads/--enable_cinn` (`paddleocr/_common_args.py:134-188`).
- High-performance inference plugins installed via `paddlex --install hpi-{cpu,gpu,npu}` + `paddle2onnx` (`paddleocr/_cli.py:96-107`).
- GenAI serving backends: `vllm`, `sglang`, `fastdeploy` installed via `paddlex --install genai-{variant}-server` (`paddleocr/_cli.py:110-123`) and served from `paddlex.inference.genai.server` (`paddleocr/_cli.py:129`).

## External Services & Model Hubs

- Hosted OCR/doc-parsing API: `DEFAULT_BASE_URL="https://paddleocr.aistudio-app.com"`, `API_PATH="/api/v2/ocr/jobs"` (`paddleocr/_api_client/_http.py:34-35`).
- Auth/env: token from `PADDLEOCR_ACCESS_TOKEN`, base-URL override `PADDLEOCR_BASE_URL` (`paddleocr/_api_client/client.py:56-63`).
- Model weights are resolved by PaddleX at runtime from `model_name`/`model_dir` args (`paddleocr/_models/base.py:31-42`, `paddleocr/_models/base.py:71-78`); e.g. default `PP-OCRv6_medium_det` (`paddleocr/_models/text_detection.py:26-27`).
- Baidu BCE BOS hosts demo/model artifacts (e.g. `paddle-model-ecology.bj.bcebos.com/...` in `paddleocr/_pipelines/doc_understanding.py:85`; `paddleocr.bj.bcebos.com/...` in `deploy/paddlecloud/README.md:142`).
- No HuggingFace / ModelScope client code detected inside `paddleocr/`; hub downloads are PaddleX-internal.

## Versioning

- Runtime version via `importlib.metadata.version(__package__)`, fallback `"0.0.0"` (`paddleocr/_version.py:18-20`); re-exported as `__version__` (`paddleocr/__init__.py:67`).
- Build-time version from `setuptools_scm` with `release-branch-semver` and `git describe --match v[0-9]*` (`pyproject.toml:78-80`).
- `paddleocr --version` prints that version (`paddleocr/_cli.py:283-285`).

---
*Stack analysis: 2026-10-15*
