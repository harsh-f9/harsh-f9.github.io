---
last_mapped_commit: 5c1115c5d07184f02e11020783a2370769014dfb
last_mapped_at: 2026-10-15
---
# Coding Conventions & Development Patterns

**Analysis Date:** 2026-10-15

## Code Style & Formatting

The codebase enforces strict quality and formatting rules defined in `pyproject.toml` and verified by `ruff` and `pyright`:

- **Line Length:** 100 characters max (`line-length = 100`).
- **Python Target:** Python 3.11 (`target-version = "py311"`).
- **Linter:** `ruff` with rules for Pyflakes (`F`), pycodestyle (`E`, `W`), isort (`I`), flake8-commas (`COM`), flake8-comprehensions (`C4`), flake8-simplify (`SIM`), pyupgrade (`UP`), and pytest style (`PT`).
- **Type Checking:** `pyright` in **strict mode** (`typeCheckingMode = "strict"`).
  - All public functions and methods must have full type signatures.
  - Use modern typing constructs from `typing_extensions` (`ParamSpec`, `TypeAlias`, `TypeGuard`, `TypedDict`).
  - Strict type narrowing via `isinstance` or `cast`.

---

## Architectural & Design Patterns

### 1. Dual-Input Interface Convention (File Path vs. Stream)

Almost every partitioner function accepts either a path on disk or an open file-like stream:

```python
def partition_foo(
    filename: Optional[str] = None,
    *,
    file: Optional[IO[bytes]] = None,
    ...
) -> list[Element]:
    exactly_one(filename=filename, file=file)
    ...
```

- The helper `exactly_one()` validates that callers supply one and only one input source.
- Partitioners do not assume disk access; they work transparently in serverless memory buffers.

### 2. Optional Dependency Guards

Because `unstructured` supports 25+ document formats without requiring every heavy dependency at install time, it avoids top-level imports of optional libraries:

```python
from unstructured.utils import dependency_exists, requires_dependencies

if dependency_exists("pandas"):
    import pandas as pd

@requires_dependencies("docx", extras="docx")
def partition_docx(...):
    import docx
    ...
```

- If a user calls `partition_docx` without `python-docx` installed, `@requires_dependencies` raises a clear, actionable `ImportError` instructing the user to run `pip install "unstructured[docx]"`.

### 3. Pipeline Decorator Composition

Partitioners are composed using stackable functional decorators that inject cross-cutting capabilities:

```python
@partition_runtime_telemetry()
@process_metadata()
@add_chunking_strategy
def partition_html(...):
    ...
```

- `@partition_runtime_telemetry()`: Collects anonymized runtime and file type metrics.
- `@process_metadata()`: Injects document-level metadata (`metadata_filename`) and converts random UUIDs to deterministic SHA-256 IDs.
- `@add_chunking_strategy`: Intercepts output elements and applies chunking (`basic` or `by_title`) if `chunking_strategy` kwarg is passed.

### 4. Deterministic Identity & Hierarchy Mapping

- Every `Element` has an `.id`. By default, accessing `.id` lazily generates a `uuid.uuid4()`.
- However, for repeatable RAG indexing, `assign_and_map_hash_ids()` computes a SHA-256 hash using:
  `data = f"{filename}{text}{page_number}{sequence_number_on_page}"`
- When IDs are mapped, all child elements (`parent_id`) are updated in lockstep to maintain unbroken parent-child hierarchy trees.

### 5. Metadata Consolidation Rules

When chunking merges multiple raw elements into a single `CompositeElement`, metadata cannot be simply overwritten. `ConsolidationStrategy` defines explicit merge rules per metadata key:
- `FIRST`: Preserves the first encountered value (e.g. `filename`, `page_number`).
- `LIST_UNIQUE`: Unions list items while preserving order (e.g. `languages`).
- `STRING_CONCATENATE`: Concatenates strings with separators (e.g. `text_as_html`).
- `DROP`: Discards spatial coordinates or transient values (e.g. `coordinates`, `category_depth`).

---

## Naming Conventions

| Entity | Pattern | Examples |
|--------|---------|----------|
| **Modules / Files** | Lowercase snake_case | `pdf_image_utils.py`, `html_sanitization.py` |
| **Classes** | UpperCamelCase | `ElementMetadata`, `TableChunk`, `BaseEmbeddingEncoder` |
| **Functions / Methods**| Lowercase snake_case | `partition_pdf()`, `chunk_by_title()`, `id_to_hash()` |
| **Constants** | UPPER_SNAKE_CASE | `UNSTRUCTURED_INCLUDE_DEBUG_METADATA`, `OCR_AGENT_PADDLE` |
| **Enums** | UpperCamelCase class, UPPER_SNAKE members | `FileType.DOCX`, `ConsolidationStrategy.LIST_CONCATENATE` |
| **Private Helpers** | Leading underscore | `_ZipFileDifferentiator`, `_kvform_pairs_to_dict()` |

---

## Error Handling & Logging

- **Logging**: Use the preconfigured logger:
  ```python
  from unstructured.logger import logger
  logger.info("Partitioning document %s", filename)
  logger.warning("Falling back to OCR because no text detected in %s", filename)
  ```
- **Exceptions**: Use domain-specific exceptions subclassed from standard Python errors (e.g., `UnsupportedFileFormatError(ValueError)`).
- **Graceful Degradation**: Never allow OCR or layout failures to silently corrupt user data; log structured warnings and fall back to plain-text extraction or raw image blocks where possible.
