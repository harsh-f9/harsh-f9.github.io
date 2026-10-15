# Coding Conventions

**Analysis Date:** 2026-10-15

## Code Style (yapf / pre-commit / CI)

- Pre-commit entry: `.pre-commit-config.yaml:21-46`. Run `pre-commit run --all-files` (CI runs it via `.github/workflows/codestyle.yml:38-41` on Python 3.10).
- Python formatter is black pinned at `24.10.0` (`.pre-commit-config.yaml:30-34`). No `tool.black` section in `pyproject.toml:1-87`; use black defaults.
- flake8 is fatal-error-only: `--select=E9,F63,F7,F82,E721` (`.pre-commit-config.yaml:41-45`), excluded for `benchmark/` and `test_tipc/`. Fix all F-errors; other style issues are black's job.
- C/C++/CUDA/proto formatted with `clang-format==13.0.0` via `.clang_format.hook:4` + `.clang_format.hook:20`; hook wired at `.pre-commit-config.yaml:23-28`.
- Generic hygiene hooks: large-file cap 512KB, CRLF/tab removal, EOF/trailing-whitespace (`.pre-commit-config.yaml:6-20`). `langchain-paddleocr/` and `paddleocr-js/` are excluded (`.pre-commit-config.yaml:1`).
- Legacy intent is pep8/80-col: `.style.yapf:1-3` (`based_on_style=pep8`, `column_limit=80`). Follow 80-col for `tools/` and `ppocr/` edits even though black enforces the new code in `paddleocr/`.
- License header: every Python file starts with the 13-line Apache-2.0 header, e.g. `paddleocr/__init__.py:1-13`, `tests/conftest.py:1-13`. Copy it verbatim into new files.

## Naming & Module Patterns

- Public surface is re-exported in `paddleocr/__init__.py:17-67` with explicit `__all__` at `paddleocr/__init__.py:84-131`. Add new public class/helper there; keep lazy `doc2md` imports as in `paddleocr/__init__.py:70-81`.
- Classes are `PascalCase` matching model/pipeline names (`PaddleOCR`, `PPStructureV3`, `TextDetection` in `paddleocr/__init__.py:17-43`). Files/modules are `snake_case` with leading underscore for private (`paddleocr/_pipelines/ocr.py`, `paddleocr/_utils/naming.py`).
- Functions/params are `snake_case`; wire-protocol keys are `camelCase` via `snake_to_camel()` (`paddleocr/_utils/naming.py:18-26`). Test the mapping in `tests/utils/test_naming.py:18-33` when adding options.
- Shared base pattern: `PaddleXPredictorWrapper` (`paddleocr/_models/base.py:30-47`) exposes `predict_iter()`/`predict()` (`paddleocr/_models/base.py:53-58`). Pipelines follow `PaddleXPipelineWrapper` (`paddleocr/_pipelines/base.py`). New model/pipeline subclasses the matching wrapper and implements `default_model_name` + `get_cli_subcommand_executor()`.
- CLI pattern: each wrapper provides a `*CLISubcommandExecutor` with `add_subparser()` / `execute_with_args()` (`paddleocr/_abstract.py:18-25`, `paddleocr/_models/base.py:85-107`). Register new subcommands in `_register_pipelines()` / `_register_models()` (`paddleocr/_cli.py:57-93`) and build args via `paddleocr/_utils/cli.py`.
- Deprecated CLI aliases live in an explicit map, e.g. `_DEPRECATED_PARAM_NAME_MAPPING` (`paddleocr/_pipelines/ocr.py:44-56`). Add renames there with `warn_deprecated_param`, do not silently drop flags.
- Legacy `tools/` scripts use `infer_<task>.py` names (`tools/infer_rec.py`, `tools/infer_det.py`) and bootstrap `sys.path` at `tools/infer_rec.py:26-28`. New training/inference entry logic goes in `tools/program.py`, not in ad-hoc scripts.

## Docstring / Type Practices

- New SDK code (`paddleocr/_doc2md/`, `paddleocr/_api_client/`) uses full annotations: `source: Union[str, Path]`, `-> ConvertResult` (`paddleocr/_doc2md/core.py:24-29`), `Optional[bool/int/float/str]` dataclass options (`paddleocr/_api_client/models.py:72-80`). Annotate all new public signatures.
- New SDK docstrings use `Args:` / `Returns:` / `Examples:` blocks (`paddleocr/_doc2md/core.py:30-45`). Exception classes get one-line purpose docstrings (`paddleocr/_api_client/errors.py:16-85`).
- Legacy `paddleocr/_pipelines/` and `paddleocr/_models/` often omit annotations (e.g. `def __init__(self, doc_orientation_classify_model_name=None, ...)` in `paddleocr/_pipelines/ocr.py:67-96`, `def predict(self, *args, **kwargs)` in `paddleocr/_models/base.py:56-58`). When touching these, use `None`-default kwargs and validate explicitly (`paddleocr/_pipelines/ocr.py:97-119`); do not add untested strict typing.
- `tools/program.py:75-85` docstrings are `Args:`/`Returns:` prose (`load_config`, `merge_config`). Match that for training utilities.

## Config Conventions (YAML in `configs/`)

- Canonical layout per `configs/det/det_mv3_db.yml:1-133`: top-level `Global`, `Architecture`, `Loss`, `Optimizer`, `PostProcess`, `Metric`, `Train`, `Eval`. Keep section names and capitalization exactly.
- `Global` holds run control: `use_gpu/use_xpu/use_mlu`, `epoch_num`, `print_batch_step`, `save_model_dir`, `eval_batch_step`, `pretrained_model` (`configs/det/det_mv3_db.yml:1-18`). Paths are repo-relative (`./output/`, `./train_data/`).
- Data pipelines are inline op lists under `Train.dataset.transforms` / `Eval.dataset.transforms` (`configs/det/det_mv3_db.yml:71-99`). Op names are class names (`DecodeImage`, `DetLabelEncode`, `NormalizeImage`); keep `KeepKeys.keep_keys` in sync with the dataloader.
- Override from CLI with `-c config.yml -o Global.epoch_num=10` (`tools/program.py:44-72`); dotted keys merged by `merge_config()` (`tools/program.py:88-115`). Only override existing top-level keys.
- Always load YAML with `yaml.SafeLoader` (`tools/program.py:71`, `tools/program.py:84`). The safe-loader invariant is regression-tested (`tests/tools/test_program_safe_yaml.py:74-95`). Never use `yaml.load` without `SafeLoader`.
- `Architecture.algorithm` must be in the allowlist asserted in `tools/program.py:905-956` (DB, CRNN, SVTR, PP-FormulaNet-*, etc.). Adding an algorithm requires updating that assert plus config dirs (`configs/det|rec|cls|kie|table|e2e|sr/`).

## Error & Logging Patterns

- SDK errors: raise the typed hierarchy in `paddleocr/_api_client/errors.py:16-85` (`InvalidRequestError` for bad input, `AuthError` 401/403, `RateLimitError`, `JobFailedError`, `PollTimeoutError`, `NetworkError`). Validation helpers raise `InvalidRequestError` with explicit messages (`paddleocr/_api_client/_core.py:40-42`, `paddleocr/_api_client/_resources.py:36-42`). Catch `PaddleOCRAPIError` as the base.
- Pipeline/model errors: `ValueError` for bad user params (`paddleocr/_pipelines/ocr.py:98-99`, `paddleocr/_common_args.py:54-67`), `RuntimeError` for missing backends with install hint, chaining with `from e` (`paddleocr/_models/base.py:80-82`). Preserve `FileNotFoundError`/`ValueError`/`RuntimeError` un-wrapped and wrap the rest (`paddleocr/_doc2md/core.py:53-58`).
- New `paddleocr/` code logs via the shared `logger` from `paddleocr/_utils/logging.py:21` (named `paddleocr`, stderr, default `ERROR` at `paddleocr/_utils/logging.py:24-36`). Use `logger.info` for progress, `logger.error` before `sys.exit(n)` as in `paddleocr/_cli.py:180-209`; set `INFO` only in `main()` (`paddleocr/_cli.py:302`). Never `print()` in library code.
- Legacy training code uses `ppocr.utils.logging.get_logger(log_file, log_ranks)` (`tools/program.py:892`) plus `logger.info/warning` for train/eval status (`tools/program.py:508-548`). Pass the `logger` object through; do not create module loggers there.

---

*Convention analysis: 2026-10-15*
