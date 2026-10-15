# External Integrations

**Analysis Date:** 2026-10-15

## Model Sources (HuggingFace / ModelScope / AI Studio)

- PaddleX is the model hub client: `create_predictor(model_name, model_dir)` (`paddleocr/_models/base.py:76-78`) and `create_pipeline(config)` + `load_pipeline_config(name)` (`paddleocr/_pipelines/base.py:92-105`). No direct HF/ModelScope SDK imports in `paddleocr/`.
- HuggingFace / ModelScope download code: not detected in `paddleocr/` or `ppocr/`; treat PaddleX as the sole weight-resolution layer.
- AI Studio hosted API is the official cloud path: base `https://paddleocr.aistudio-app.com`, path `/api/v2/ocr/jobs` (`paddleocr/_api_client/_http.py:34-35`); token env `PADDLEOCR_ACCESS_TOKEN`, URL override `PADDLEOCR_BASE_URL` (`paddleocr/_api_client/client.py:56-63`).
- MCP provider enum confirms AI Studio as a first-class remote: `LOCAL | AISTUDIO | QIANFAN | SELF_HOSTED` (`mcp_server/paddleocr_mcp/providers.py:21-25`) with transports local / aistudio_api / http (`mcp_server/paddleocr_mcp/providers.py:28-32`).
- Static BCE BOS artifact hosts (not SDKs): `paddle-model-ecology.bj.bcebos.com/...` demo image (`paddleocr/_pipelines/doc_understanding.py:85`); `paddleocr.bj.bcebos.com/...` and `paddleflow-public.hkg.bcebos.com/...` pretrain sets (`deploy/paddlecloud/README.md:70-158`).

## Agent Ecosystem (Dify / RAGFlow / LangChain / MCP)

- LangChain: sibling package `langchain-paddleocr 0.2.2`, `requires-python>=3.10`, deps `paddleocr>=3.7.0` + `langchain-core>=1.2.5,<2.0.0` + `pydantic` (`langchain-paddleocr/pyproject.toml:6-17`); source in `langchain-paddleocr/langchain_paddleocr/document_loaders/`; hatchling build (`langchain-paddleocr/pyproject.toml:2`).
- MCP server: package `paddleocr_mcp 0.8.5`, `requires-python>=3.10`, deps `mcp>=1.5.0`, `fastmcp>=2.0.0`, `httpx`, `numpy`, `paddleocr>=3.7.0`, `pillow`, `puremagic` (`mcp_server/pyproject.toml:6-18`); entry `paddleocr_mcp = paddleocr_mcp.__main__:main` (`mcp_server/pyproject.toml:29-30`).
- MCP runtime: `FastMCP` app with stdio (default) or Streamable HTTP (`mcp_server/paddleocr_mcp/__main__.py:24-56`); model select via `--model` / `PADDLEOCR_MCP_MODEL`, provider via `--ppocr_source` / `PADDLEOCR_MCP_PPOCR_SOURCE` (`mcp_server/paddleocr_mcp/__main__.py:36-46`); task handlers in `mcp_server/paddleocr_mcp/tasks/`, inference adapters in `mcp_server/paddleocr_mcp/inference/{ocr/,paddleocr_vl/,pp_structurev3/,shared/}`.
- MCP docs: `docs/version3.x/integrations/mcp_server.md` (+ `.en.md`); skills integration: `docs/version3.x/integrations/skills.md` (+ `.en.md`).
- GenAI server interop is OpenAI-compatible: startup prompt says call via server URL or "using the OpenAI client library" (`paddleocr/_cli.py:144-148`); backends `vllm | sglang | fastdeploy` (`paddleocr/_cli.py:120-123`).
- Dify / RAGFlow plugins: not detected in-repo (no `dify*`/`ragflow*` source dirs; `docs/version3.x/integrations/` contains only `mcp_server` + `skills` docs).

## Deployment Targets

- In-repo matrix (`deploy/`): `cpp_infer/`, `lite/`, `paddle2onnx/`, `hubserving/` (per-model `ocr_det/`, `ocr_rec/`, `ocr_cls/`, `ocr_system/`, `kie_ser*/`, `structure_*/`), `paddlecloud/`, `docker/hubserving/`, `slim/`, `avh/`, `android_demo/`, `ios_demo/`, `ppocr-android/`, `paddleocr_vl_docker/`.
- Supported schemes per `deploy/README.md:24-28`: Python inference, C++ inference (`deploy/cpp_infer/readme.md`), Serving (`deploy/hubserving/`), Paddle-Lite ARM CPU/OpenCL GPU (`deploy/lite/readme.md`), Paddle2ONNX (`deploy/paddle2onnx/readme.md`).
- Mobile/edge: native sources in `deploy/android_demo/`, `deploy/ios_demo/`, `deploy/ppocr-android/`; C++ Lite sample `deploy/lite/ocr_db_crnn.cc` with `Makefile`.
- Cloud images: `paddlecloud/paddleocr:2.5-cpu/gpu-cuda10.2-cudnn7` run examples (`deploy/paddlecloud/README.md:51-57`).
- Multi-language hosted-API SDKs (call cloud, not local inference per `api_sdk/README.md:5-7`): Python in `paddleocr/_api_client/` (`client.py`, `async_client.py`, `_http.py`, `_async_http.py`, `_poller.py`, `models.py`, `results.py`, `errors.py`); TypeScript in `api_sdk/typescript/src/`; Go in `api_sdk/go/` (`client.go`, `transport.go`, `poller.go`, `models.go`).
- Hosted-API validation: `python -m pytest tests/api_client/`, `npm run lint && npm test` in `api_sdk/typescript`, `go test ./...` in `api_sdk/go` (`api_sdk/README.md:36-50`); CLI subcommand `paddleocr api --model_type ocr|doc_parsing` (`paddleocr/_api_client/cli.py:30-40`).

## Internal Cross-Module Imports

- Facade: `paddleocr/__init__.py:17-65` re-exports `_models` (13 model classes), `_pipelines` (10 pipelines), `_api_client` (sync/async clients, options, errors), plus `benchmark` and `logger`.
- Model layer depends on: `paddlex.create_predictor` + `paddlex.utils.deps.DependencyError` + `.._abstract.CLISubcommandExecutor` + `.._common_args.{parse_common_args,prepare_common_init_args,add_common_cli_opts}` (`paddleocr/_models/base.py:17-25`).
- Pipeline layer depends on: `paddlex.create_pipeline`, `paddlex.inference.load_pipeline_config`, `paddlex.utils.config.AttrDict`, `yaml`, plus same `.._abstract` / `.._common_args` helpers (`paddleocr/_pipelines/base.py:17-28`).
- Concrete model example: `TextDetection` mixes `TextDetectionMixin` + `PaddleXPredictorWrapper`, CLI from `TextDetectionSubcommandExecutorMixin` + `PredictorCLISubcommandExecutor` (`paddleocr/_models/text_detection.py:24-40`); inference CLI helpers from `.._utils.cli` (`paddleocr/_models/text_detection.py:15-19`).
- Concrete pipeline example: `paddleocr/_pipelines/ocr.py:22-42` imports `.._utils.cli`, `.._utils.deprecation`, `.._utils.langs` (language sets), `.._utils.logging`, `.base`, `.utils.create_config_from_structure`.
- Device/engine normalization is shared: `paddlex.utils.device.get_default_device/parse_device` consumed by `prepare_common_init_args` (`paddleocr/_common_args.py:15`, `paddleocr/_common_args.py:102-126`).
- No `paddleocr/` → `ppocr/` imports (v3 facade delegates to PaddleX; `ppocr/` is the legacy training tree with `ppocr/modeling/`, `ppocr/data/`, `tools/train.py`).

---
*Integration audit: 2026-10-15*
