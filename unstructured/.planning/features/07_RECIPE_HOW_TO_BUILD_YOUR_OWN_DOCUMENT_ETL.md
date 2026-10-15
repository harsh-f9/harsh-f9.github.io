# Master Recipe: How to Build Your Own Document ETL Pipeline for LLMs & RAG

**Target Audience:** Autonomous Agents, AI Engineers, and System Architects building custom document pre-processing in another repository.

---

## Executive Overview

If you need to build an enterprise-grade document pre-processing pipeline in your own codebase (whether in Python, TypeScript, Go, or Rust), do **not** build a monolithic parser. Instead, replicate the proven, modular 6-stage architecture developed by `unstructured`:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        6-STAGE ETL ARCHITECTURE                        │
├───────────────┬────────────────────────────────────────────────────────┤
│ 1. INGEST     │ Sniff MIME/magic bytes + differentiate zip/OLE streams │
│ 2. PARTITION  │ Dispatch to format handler (fast vs OCR vs vision)     │
│ 3. NORMALIZE  │ Apply cleaning bricks (ligatures, bullets, hyphens)    │
│ 4. CHUNK      │ Structure-aware grouping (Titles, soft/hard limits)    │
│ 5. EMBED      │ Attach dense vectors directly to chunk objects         │
│ 6. STAGE      │ Export to Vector DB (Weaviate, Pinecone) or JSON       │
└───────────────┴────────────────────────────────────────────────────────┘
```

---

## Step-by-Step Architectural Blueprint

### Step 1: Design the Core Domain Model (Never Use Raw Strings)
Represent every fragment of the document as a typed object containing text and a rich metadata container:
- **`Element` Types**: `Title`, `NarrativeText`, `ListItem`, `Table`, `Image`.
- **`Metadata`**: `filename`, `page_number`, `coordinates`, `parent_id`, `text_as_html`.
- **Deterministic Hash IDs**: Avoid random UUIDs. Generate SHA-256 hashes from `f"{filename}:{page}:{sequence}:{text}"`. This ensures that re-indexing identical documents is 100% idempotent in your vector database.

### Step 2: Build a Resilient Ingestion & File Sniffer
Never trust the file extension:
- Accept both disk paths and in-memory streams (`IO[bytes]`).
- Check magic header bytes:
  - `%PDF` $\to$ PDF
  - `\x89PNG` / `\xff\xd8\xff` $\to$ Images
  - `PK\x03\x04` $\to$ Differentiate ZIP by checking internal file manifests (`word/document.xml` $\to$ DOCX, `xl/workbook.xml` $\to$ XLSX).
  - `\xd0\xcf\x11\xe0` $\to$ Differentiate OLE compound storage (`WordDocument` $\to$ DOC, `Workbook` $\to$ XLS).

### Step 3: Implement Dual-Mode Partitioning for PDFs
Do not run computer vision on everything:
- **Heuristic Text Check**: Sample the first 3 pages. If average word count $> 10$, treat as a digital PDF and extract characters directly (using `pdfminer.six` or `pypdf`). This executes in milliseconds.
- **OCR Fallback**: If digital text is missing, rasterize pages to bitmap images via `poppler` and run OCR (Tesseract or PaddleOCR).
- **Vision Layout (Optional)**: For complex multi-column documents, run an object detection model (YOLOX/LayoutLMv3) to establish reading order.

### Step 4: Handle Tables with Special Care
- Never flatten tables into plain text.
- Convert tables into structured HTML strings (`<table>...</table>`) stored in `element.metadata.text_as_html`.
- When a table is too long for a single chunk, split the rows across multiple `TableChunk` elements, and **always duplicate the header row** (`<thead>`) on continuation chunks so vector embeddings retain semantic meaning.

### Step 5: Implement Semantic, Structure-Aware Chunking
Never split purely by fixed character or token counts:
- Use `Title` elements as topic boundaries.
- **Soft Limit (`new_after_n_chars`)**: e.g., 700 characters. Once reached, wait for the next paragraph or title before closing the chunk.
- **Hard Limit (`max_characters`)**: e.g., 1000 characters. Never exceed this ceiling.
- **Merge Small Fragments (`combine_text_under_n_chars`)**: e.g., 200 characters. Prevent tiny standalone subheadings from creating low-information chunks.

### Step 6: Direct Vector Attachment & Decoupled Staging
- Pass chunked elements to an embedding provider (OpenAI, Bedrock, VertexAI).
- Store the float array directly on `chunk.embeddings`.
- Use dedicated staging adapters to format the elements for your target sink (Weaviate, Pinecone, Qdrant, or local JSON).

---

## Complete Self-Contained Implementation Blueprint

Here is a functional, production-ready Python starter pipeline you can drop directly into your own project:

```python
import hashlib
import io
import os
import zipfile
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional
import pypdf

# 1. DOMAIN MODEL
@dataclass
class DocumentMetadata:
    filename: Optional[str] = None
    page_number: Optional[int] = None
    parent_id: Optional[str] = None
    text_as_html: Optional[str] = None

@dataclass
class DocumentElement:
    category: str  # "Title", "NarrativeText", "Table"
    text: str
    metadata: DocumentMetadata
    element_id: Optional[str] = None
    embeddings: Optional[List[float]] = None

    def compute_hash_id(self, sequence: int) -> str:
        raw = f"{self.metadata.filename}:{self.metadata.page_number}:{sequence}:{self.text}"
        self.element_id = hashlib.sha256(raw.encode("utf-8")).hexdigest()[:32]
        return self.element_id

# 2. FILE TYPE SNIFFER
class FileSniffer:
    @staticmethod
    def detect_type(stream: io.BytesIO, filename: Optional[str] = None) -> str:
        pos = stream.tell()
        header = stream.read(1024)
        stream.seek(pos)

        if header.startswith(b"%PDF"):
            return "pdf"
        if header.startswith(b"PK\x03\x04"):
            try:
                with zipfile.ZipFile(stream, "r") as zf:
                    names = zf.namelist()
                    if "word/document.xml" in names:
                        return "docx"
                    if "xl/workbook.xml" in names:
                        return "xlsx"
            except Exception:
                pass
            return "zip"
        if filename and filename.endswith(".txt"):
            return "text"
        return "unknown"

# 3. PARTITIONING ENGINE
class DocumentPartitioner:
    @classmethod
    def partition_pdf(cls, stream: io.BytesIO, filename: str) -> List[DocumentElement]:
        reader = pypdf.PdfReader(stream)
        elements = []
        for page_idx, page in enumerate(reader.pages):
            text = page.extract_text() or ""
            paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
            for p in paragraphs:
                is_title = len(p) < 80 and not p.endswith(".")
                cat = "Title" if is_title else "NarrativeText"
                meta = DocumentMetadata(filename=filename, page_number=page_idx + 1)
                elements.append(DocumentElement(category=cat, text=p, metadata=meta))
        return elements

# 4. CONTEXT-AWARE CHUNKER
class SemanticChunker:
    @staticmethod
    def chunk(elements: List[DocumentElement], max_chars: int = 1000, new_after: int = 600) -> List[DocumentElement]:
        chunks = []
        cur_texts = []
        cur_pages = []
        cur_len = 0
        cur_meta = DocumentMetadata()

        def flush():
            nonlocal cur_texts, cur_pages, cur_len, cur_meta
            if cur_texts:
                meta = DocumentMetadata(
                    filename=cur_meta.filename,
                    page_number=cur_pages[0] if cur_pages else 1
                )
                chunks.append(DocumentElement(
                    category="CompositeElement",
                    text="\n\n".join(cur_texts),
                    metadata=meta
                ))
                cur_texts, cur_pages, cur_len = [], [], 0

        for el in elements:
            el_len = len(el.text)
            if el.category == "Title" and cur_len >= 200:
                flush()
            if (cur_len + el_len) > max_chars and cur_texts:
                flush()

            cur_texts.append(el.text)
            cur_pages.append(el.metadata.page_number)
            cur_len += el_len
            cur_meta = el.metadata

            if cur_len >= new_after and el.category != "Title":
                flush()

        flush()
        # Compute deterministic hashes
        for idx, c in enumerate(chunks):
            c.compute_hash_id(idx)
        return chunks

# 5. PIPELINE ORCHESTRATOR
def process_document(file_bytes: bytes, filename: str) -> List[DocumentElement]:
    stream = io.BytesIO(file_bytes)
    file_type = FileSniffer.detect_type(stream, filename)
    
    if file_type == "pdf":
        raw_elements = DocumentPartitioner.partition_pdf(stream, filename)
    else:
        # Fallback raw text
        text = stream.read().decode("utf-8", errors="replace")
        raw_elements = [DocumentElement("NarrativeText", text, DocumentMetadata(filename=filename, page_number=1))]

    chunks = SemanticChunker.chunk(raw_elements, max_chars=800, new_after=500)
    return chunks
```

---

## Summary Checklist for Autonomous Agents
When you need to parse or preprocess documents in any new project, verify that your implementation satisfies:
1. **[ ] Dual input support**: Handles `filename` and `io.BytesIO` streams equally.
2. **[ ] Deterministic IDs**: Binds SHA-256 hashes based on text and page sequence.
3. **[ ] Spatial metadata**: Preserves page numbers and bounding boxes.
4. **[ ] Table HTML preservation**: Tables retain `text_as_html` and repeated headers.
5. **[ ] Title-aware chunking**: Cuts on semantic boundaries rather than arbitrary token lengths.
6. **[ ] Decoupled staging**: Separates document transformation from vector DB loading.
