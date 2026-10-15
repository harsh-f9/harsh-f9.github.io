---
last_mapped_commit: 6fadbae317b09c4dd4051c0f1fc1746c6baf04bc
last_mapped_at: 2026-10-15
---
# Coding Conventions & Standards

**Analysis Date:** 2026-10-15

## Overview

Docling enforces strict coding and design standards across all modules, verified automatically through pre-commit hooks and CI gates (`make check`, `make validate`).

---

## 1. Code Style & Architecture Standards

### Strong Typing & Python 3.10+ Compatibility

- All public APIs, functions, and internal methods must have explicit type annotations.
- Use modern Python 3.10+ syntax:
  - Pipe unions: `str | None` instead of `Optional[str]`.
  - Built-in generics: `list[str]`, `dict[str, Any]` instead of `typing.List`, `typing.Dict`.
  - Use `from typing_extensions import Self` for method chaining and validator returns.

### Structured Models Over Loose Dictionaries

- Data crossing module boundaries or serialized to disk must use Pydantic v2 models or `@dataclass`.
- Raw dictionaries (`dict[str, Any]`) are prohibited for durable schema contracts.
- Model configurations and pipeline options inherit from [`BaseOptions`](file:///C:/Projects1/Others/docling/docling/datamodel/pipeline_options.py) or [`BaseFormatOption`](file:///C:/Projects1/Others/docling/docling/datamodel/base_models.py).

### Path Handling

- Always use [`pathlib.Path`](file:///C:/Projects1/Others/docling/docling/document_converter.py) for path operations.
- `os.path` functions (`os.path.join`, `os.path.exists`) are prohibited in new or edited code unless required by an external library.

### Interface Certainty & Anti-Pattern Restrictions

- **Avoid `hasattr(...)` and broad `getattr(...)`**: Attribute-probing patterns usually disguise ambiguous interfaces. Use explicit interfaces, abstract base classes, or polymorphic dispatch instead.
- If an attribute probe is strictly required for compatibility with an undocumented third-party library, keep it narrowly scoped with an explanatory comment.

### Thread Safety & Concurrency

- Heavyweight models in [`docling/models/`](file:///C:/Projects1/Others/docling/docling/models/) are instantiated once and treated as read-only by worker threads.
- In pipelines with multi-threading (such as [`StandardPdfPipeline`](file:///C:/Projects1/Others/docling/docling/pipeline/standard_pdf_pipeline.py)), each run uses isolated bounded queues and private per-page run identifiers rather than mutable global state.

---

## 2. Communication & Documentation Standards

### ASD-STE100 Simplified Technical English

- Technical documentation, docstrings, and agent communications use ASD-STE100 Simplified Technical English.
- Rules:
  - Short, direct sentences (<= 20 words where possible).
  - Active voice ("The pipeline converts the document", not "The document is converted by the pipeline").
  - Exact identifiers, API names, and file paths.
  - State results, constraints, and limits clearly.

---

## 3. Tooling & Enforcement

### Static Analysis & Linters

- **Ruff**: Enforces PEP 8 style, import sorting, and linting rules:
  ```bash
  uv run ruff check --config=pyproject.toml docling tests
  uv run ruff format --config=pyproject.toml docling tests
  ```
- **Tach**: Verifies module boundaries and ensures zero circular dependencies:
  ```bash
  uv run --no-sync tach check
  ```
- **Dprint**: Enforces consistent whitespace and formatting in Markdown and JSON:
  ```bash
  uv run --no-sync dprint check --config .github/dprint.json
  ```
- **Type Checking**:
  ```bash
  uv run --no-sync ty check
  ```

---
*Conventions analysis: 2026-10-15*
