# Codebase Concerns

**Analysis Date:** 2026-10-15

## Coupling Risks (paddleocr facade vs ppocr legacy)

- **Facade delegates all behavior to external `paddlex`, which is not in this repo.**
  - Evidence: `paddleocr/__init__.py:15` (`from paddlex.inference.utils.benchmark import benchmark`); `paddleocr/_pipelines/base.py:18,20` (`create_pipeline`, `load_pipeline_config`); `paddleocr/_pipelines/base.py:102-109` (pipeline creation = `create_pipeline(...)`, only catches `DependencyError`).
  - Impact: A `paddlex` upgrade/rename breaks every pipeline here; stack traces land outside this repo.
  - Mitigation: Pin/test the exact `paddlex` API surface used (`create_pipeline`, `load_pipeline_config`, `AttrDict` config keys); add a contract test that instantiates each wrapper with a mocked `paddlex`.

- **String-keyed config overrides are fragile to upstream renames.**
  - Evidence: `paddleocr/_pipelines/ocr.py:248-316` (`STRUCTURE` dict with keys like `"SubModules.TextDetection.limit_side_len"`); `paddleocr/_pipelines/base.py:90-100` (blind `_merge_dicts` of overrides into upstream config).
  - Impact: A renamed PaddleX config key silently misconfigures inference (wrong thresholds, ignored model dirs). No schema validation at merge time.
  - Mitigation: Validate merged config keys against `load_pipeline_config()` output; fail loudly on unknown keys.

- **Legacy training stack coexists unpackaged alongside the facade.**
  - Evidence: `pyproject.toml:73-76` (`packages.find.include = ["paddleocr", "paddleocr.*"]` only) vs `ppocr/`, `ppstructure/`, `tools/`, `configs/` still in repo; `setup.py:15-18` is a bare `setup()` shim.
  - Impact: Contributors unclear which stack is canonical; legacy code rots (see `tools/infer/utility.py:460` `# HACK`, `:488` `# XXX ... no way to get the data type`).
  - Mitigation: Document `ppocr/`+`tools/` as train-only/legacy in `README.md`; or move to a `legacy/` tree so `paddleocr/` is unambiguously the runtime.

## Version Pin Risks

- **Narrow `paddlex` window (`>=3.7.0,<3.8.0`) across 4 extras.**
  - Evidence: `pyproject.toml:50` (`paddlex[ocr-core]>=3.7.0,<3.8.0`); `pyproject.toml:67-71` (same pin repeated for `doc-parser`, `ie`, `trans`, `all`).
  - Impact: Any `paddlex` 3.8 release forces a lockstep repo release; users mixing extras can resolve inconsistently.
  - Mitigation: Centralize the pin in one variable/comment; add CI that installs `paddlex==3.7.*` latest and runs `tests/`.

- **Unbounded `paddlex --install` targets in CLI.**
  - Evidence: `paddleocr/_cli.py:96-124` (`subprocess.check_call(["paddlex", "--install", hpip])`, variants `cpu/gpu/npu`, `genai-{vllm,sglang,fastdeploy}-server`, plus `paddle2onnx` at `:101`).
  - Impact: Install-time drift: same `paddleocr` version pulls different accelerator backends over time. (Note: argv is fixed, no `shell=True` — injection-safe.)
  - Mitigation: Pin versions in these install commands or print the resolved versions after install.

- **`mcp_server` floats on `paddleocr>=3.7.0` with no upper bound.**
  - Evidence: `mcp_server/pyproject.toml:9-18` (`paddleocr>=3.7.0`, `mcp>=1.5.0`, `fastmcp>=2.0.0`); own version `0.8.5` at `:7`.
  - Impact: A breaking `paddleocr` 4.x silently satisfies the requirement and breaks the MCP server.
  - Mitigation: Add `<4` (or matching `<3.8.0`) upper bound; test `mcp_server` against the `paddleocr` release candidate.

## Hardware/Deploy Fragmentation

- **14 deploy targets, some stale.**
  - Evidence: `deploy/` contains `android_demo/ ios_demo/ cpp_infer/ lite/ paddle2onnx/ hubserving/ slim/ avh/ paddlecloud/ paddleocr_vl_docker/ ppocr-android/` + `README.md:26` links `./pdserving/README.md`, but no `pdserving/` dir exists in `deploy/`.
  - Impact: Broken doc link; users cannot tell which targets are supported (HubServing vs PaddleX serving vs VL docker).
  - Mitigation: Fix/remove the `pdserving` link; add a support-status table (active/deprecated) at top of `deploy/README.md`.

- **Known-unfinished platform work marked TODO.**
  - Evidence: `deploy/lite/ocr_db_crnn.cc:653` (`TODO: support autolog`); `deploy/cpp_infer/src/utils/utility.h:85` (`TODO windows`); `deploy/paddleocr_vl_docker/accelerators/*/compose.yaml` + `*/vlm.Dockerfile` (`TODO: Allow using/regular user(s)`, e.g. `nvidia-gpu/compose.yaml:18,38`, `metax-gpu/vlm.Dockerfile:1,32`).
  - Impact: Containers run as root; Windows C++ path and Lite autolog incomplete.
  - Mitigation: Track as issues; at minimum document "runs as root" in `deploy/paddleocr_vl_docker` README until fixed.

## Doc Drift

- **Two doc trees (`doc/` vs `docs/`) with cross-links to the old one.**
  - Evidence: `deploy/README.md:16,24-30` references `../doc/deployment_en.png`, `../doc/doc_en/...`; `mkdocs.yml:12` sets `edit_uri: edit/main/docs/` (new tree); `docs/` holds `version2.x/` + `version3.x/`.
  - Impact: Edits in `docs/` don't fix pages users still reach via `doc/`; image/link rot.
  - Mitigation: Redirect or delete `doc/` references from `deploy/`; keep one canonical tree (`docs/version3.x/`).

- **2.x → 3.x compat surface documented ad hoc.**
  - Evidence: `paddleocr/_pipelines/ocr.py:65` (`# Be comptable [sic] with PaddleOCR 2.x interfaces`); `docs/version3.x/pipeline_usage/OCR.en.md:1172` (deprecated-2.x-params section); `paddleocr/_utils/deprecation.py:30,36-38` (warn-only deprecation helpers).
  - Impact: Deprecated params warn but never error, so removal timeline is unenforceable.
  - Mitigation: Announce a removal version in each warning message; grep `warn_deprecated_param` call sites and attach versions.

## Duplication

- **Self-admitted config-override duplication across pipelines.**
  - Evidence: `paddleocr/_pipelines/pp_doctranslation.py:323` (`# HACK: We should consider reducing duplication.` before a ~80-line `STRUCTURE` dict); same key-prefix patterns repeated in `pp_chatocrv4_doc.py`, `pp_structurev3.py`, `paddleocr_vl.py`.
  - Impact: Adding one shared option (e.g. `use_textline_orientation`) requires N parallel edits; drift likely.
  - Mitigation: Extract a shared `STRUCTURE`-builder for `DocPreprocessor`/`GeneralOCR` subkeys in `paddleocr/_pipelines/utils.py`.

- **Manual CLI boilerplate per pipeline (acknowledged).**
  - Evidence: `paddleocr/_pipelines/ocr.py:15-17` (`TODO: Should we use a third-party CLI library...`); each pipeline re-implements `_update_subcommand` + `execute_with_args` (e.g. `ocr.py:430-604`, `pp_doctranslation.py:891-925`).
  - Impact: Flag renames (like the 11-entry `_DEPRECATED_PARAM_NAME_MAPPING` at `ocr.py:44-56`) must be mirrored in argparse code.
  - Mitigation: Generate argparse args from the wrapper `__init__` signature as the TODO suggests, or centralize flag definitions.

- **Three inference entry points + three SDK languages.**
  - Evidence: `paddleocr/_pipelines/` (new) vs `tools/infer/` (legacy) vs `deploy/cpp_infer/` + `deploy/lite/`; `api_sdk/README.md:24-32` (Python SDK lives in `paddleocr/_api_client/`, TypeScript/Go in `api_sdk/`).
  - Impact: Bug fixes (e.g. input validation) must land in multiple places to stick.
  - Mitigation: Declare `paddleocr/` the reference implementation; add parity tests for SDKs (`tests/api_client/` per `api_sdk/README.md:36-40`).

## Security/Input-Handling Notes

- **API keys accepted as CLI flags (self-flagged FIXME).**
  - Evidence: `paddleocr/_pipelines/pp_doctranslation.py:902-923` (`--qianfan_api_key` → `params["chat_bot_config"]["api_key"]`); `paddleocr/_pipelines/pp_chatocrv4_doc.py:671-705` (same, plus DocBee config); `paddleocr/_pipelines/paddleocr_vl.py:377-381` (`--vl_rec_api_key`).
  - Impact: Secrets leak into shell history/process tables.
  - Mitigation: Implement the FIXMEs: prefer `QIANFAN_API_KEY`/`VL_REC_API_KEY` env vars, warn when `--*_api_key` is passed (consistent with existing `warn_deprecated_param` pattern).

- **Hardcoded placeholder credential in ChatOCR path.**
  - Evidence: `paddleocr/_pipelines/pp_chatocrv4_doc.py:706-716` (`"api_key": "fake_key"` for `PP-DocBee` when `pp_docbee_base_url` is set).
  - Impact: Confusing failure mode against authenticated endpoints; placeholder could reach wire.
  - Mitigation: Default to empty/None and raise a clear error if the endpoint requires auth.

- **Thin server-side input validation in the API client.**
  - Evidence: `paddleocr/_api_client/_core.py:38-42` (`validate_input_source` checks only presence/mutual-exclusivity of `file_url`/`file_path` — no scheme, size, or path-traversal checks); `paddleocr/_api_client/_http.py:34-35` (hardcoded `https://paddleocr.aistudio-app.com` default — good, TLS by default, no `verify=False` found).
  - Impact: Oversized/local-path inputs fail late at the server instead of fast locally.
  - Mitigation: Validate URL scheme (`https only` or allowlist), file existence/size in `validate_input_source` before submission.

---

*Concerns audit: 2026-10-15*
