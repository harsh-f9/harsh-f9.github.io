# 05 — Integration Map

## 1. Entry Points

### Python API (facade)
- Facade re-exports 13 models + 10 pipelines + clients in `paddleocr/__init__.py:17-65`, `__all__` at `paddleocr/__init__.py:84-131`.
- Single model: `paddlex.create_predictor(model_name, model_dir)` in `paddleocr/_models/base.py:76-78`; `predict()/predict_iter()` at `paddleocr/_models/base.py:53-58`.
- Pipeline: `paddlex.create_pipeline(config)` + `load_pipeline_config(name)` in `paddleocr/_pipelines/base.py:92-105`.
- Example: `from paddleocr import PaddleOCR; p=PaddleOCR(); p.predict("img.jpg")` (`paddleocr/_pipelines/ocr.py:67-119`).

### CLI
- Binary: `paddleocr = paddleocr.__main__:console_entry` (`pyproject.toml:64`); SIGPIPE wrapper `paddleocr/__main__.py:21-28`.
- Parser `prog="paddleocr"` (`paddleocr/_cli.py:282`); registers 10 pipelines (`paddleocr/_cli.py:57-73`), 13 models (`paddleocr/_cli.py:75-93`), `install_hpi_deps`/`install_genai_server_deps`/`genai_server`/`doc2md`/`api` (`paddleocr/_cli.py:287-293`).
- Each class exposes `get_cli_subcommand_executor()` (`paddleocr/_models/base.py:63-66`, `paddleocr/_pipelines/base.py:82-85`); contract in `paddleocr/_abstract.py:18-25`.
- Cloud call: `paddleocr api --model_type ocr|doc_parsing --file_path x.jpg` (`paddleocr/_api_client/cli.py:30-40`).

### HTTP (hosted API)
- Sync `PaddleOCRClient` / async `AsyncPaddleOCRClient` (`paddleocr/__init__.py:44-45`); submit→poll→fetch in `paddleocr/_api_client/client.py:81-100`.
- Sync transport `requests` (`paddleocr/_api_client/_http.py:19`), async `aiohttp>=3.8.0` (`paddleocr/_api_client/_async_http.py:19`, `pyproject.toml:53`).
- Base `https://paddleocr.aistudio-app.com` + `/api/v2/ocr/jobs` (`paddleocr/_api_client/_http.py:34-35`); token `PADDLEOCR_ACCESS_TOKEN`, URL override `PADDLEOCR_BASE_URL` (`paddleocr/_api_client/client.py:56-63`).

### MCP
- Pkg `paddleocr_mcp 0.8.5`, `requires-python>=3.10` (`mcp_server/pyproject.toml:6-8`); entry `paddleocr_mcp.__main__:main` (`mcp_server/pyproject.toml:29-30`).
- `FastMCP` stdio default, `--http` = Streamable HTTP (`mcp_server/paddleocr_mcp/__main__.py:24-56`); `--model`/`--ppocr_source` at `mcp_server/paddleocr_mcp/__main__.py:36-46`.
- Tasks `mcp_server/paddleocr_mcp/tasks/`, adapters `mcp_server/paddleocr_mcp/inference/{ocr/,paddleocr_vl/,pp_structurev3/,shared/}`.
- Docs `docs/version3.x/integrations/mcp_server.md`, skills `docs/version3.x/integrations/skills.md`.

### LangChain / JS / Go
- LangChain pkg `langchain-paddleocr 0.2.2`, deps `paddleocr>=3.7.0, langchain-core>=1.2.5,<2.0.0` (`langchain-paddleocr/pyproject.toml:6-17`); loaders in `langchain-paddleocr/langchain_paddleocr/document_loaders/` (`paddleocr_vl.py`).
- TS SDK `api_sdk/typescript/src/`; Go SDK `api_sdk/go/` (`client.go`, `transport.go`, `poller.go`, `models.go`); both call hosted API, not local inference (`api_sdk/README.md:5-7`).
- Office→MD extra: `paddleocr/_doc2md/{base.py,core.py,registry.py,converters/,math/}`; `paddleocr doc2md -i in.docx` (`paddleocr/_cli.py:168-272`).

## 2. External Model Hubs (HF / ModelScope / AIStudio evidence)
- PaddleX is sole weight layer; no HF/ModelScope SDK imports in `paddleocr/` (`paddleocr/_models/base.py:76-78`, `paddleocr/_pipelines/base.py:92-105`).
- Default weight e.g. `PP-OCRv6_medium_det` (`paddleocr/_models/text_detection.py:26-27`); resolved via `model_name`/`model_dir` (`paddleocr/_models/base.py:31-42`).
- AI Studio cloud is official remote (`paddleocr/_api_client/_http.py:34-35`); MCP enum `LOCAL|AISTUDIO|QIANFAN|SELF_HOSTED` (`mcp_server/paddleocr_mcp/providers.py:21-25`), transports local/aistudio_api/http (`mcp_server/paddleocr_mcp/providers.py:28-32`).
- Static BCE BOS artifacts only (not SDKs): demo image (`paddleocr/_pipelines/doc_understanding.py:85`), pretrain sets (`deploy/paddlecloud/README.md:70-158`).

## 3. Hardware Deploy Matrix (CPU/GPU/XPU/NPU)
- Device parse via `paddlex.utils.device` (`paddleocr/_common_args.py:15`); auto GPU0 else CPU (`paddleocr/_constants.py:15`, `paddleocr/_common_args.py:131-133`).
- Engines `paddle,paddle_static,paddle_dynamic,transformers,onnxruntime` (`paddleocr/_common_args.py:29-35`); flags `--device/--engine/--enable_hpi/--use_tensorrt/--precision/--enable_mkldnn/--cpu_threads/--enable_cinn` (`paddleocr/_common_args.py:134-188`).
- Defaults `USE_TENSORRT=False, PRECISION=fp32, MKLDNN=True, CPU_THREADS=10, CINN=False` (`paddleocr/_constants.py:16-22`).
- HPI plugins: `paddlex --install hpi-{cpu,gpu,npu}` + `paddle2onnx` (`paddleocr/_cli.py:96-107`); GenAI `vllm|sglang|fastdeploy` (`paddleocr/_cli.py:110-123`, served `paddleocr/_cli.py:129`).
- `deploy/` targets: `cpp_infer/ lite/ paddle2onnx/ hubserving/ paddlecloud/ docker/hubserving/ slim/ avh/ android_demo/ ios_demo/ ppocr-android/ paddleocr_vl_docker/`; schemes in `deploy/README.md:24-28` (Python, C++ `deploy/cpp_infer/readme.md`, Lite `deploy/lite/readme.md`, ONNX `deploy/paddle2onnx/readme.md`).
- Device docs: `docs/version3.x/other_devices_support/` (XPU/NPU install + `multi_devices_use_guide.md`); serving `docs/version3.x/inference_deployment/{serving/,local_inference/,cross_platform/}`.
- Note: `deploy/README.md:26` links missing `pdserving/` dir (stale).

## 4. Agent Ecosystem Wiring (Dify / RAGFlow / MCP)
- MCP server is the agent entry: stdio for Claude/Desktop, `--http --host --port` for remote agents (`mcp_server/paddleocr_mcp/__main__.py:48-63`).
- Provider switch `--ppocr_source local|aistudio|qianfan|self_hosted` (`mcp_server/paddleocr_mcp/__main__.py:41-46`); tokens via `PADDLEOCR_MCP_AISTUDIO_ACCESS_TOKEN` / `PADDLEOCR_MCP_QIANFAN_API_KEY` (`mcp_server/paddleocr_mcp/__main__.py:101-109`).
- GenAI server is OpenAI-compatible: call via server URL or OpenAI client (`paddleocr/_cli.py:144-148`).
- LangChain path: `PaddleOCRVLLoader` in `langchain-paddleocr/langchain_paddleocr/document_loaders/paddleocr_vl.py` → Document objects for RAG.
- Dify/RAGFlow: no in-repo plugins (`docs/version3.x/integrations/` holds only `mcp_server` + `skills` docs); wire via MCP-HTTP or hosted `POST /api/v2/ocr/jobs` (`paddleocr/_api_client/_http.py:34-35`).
