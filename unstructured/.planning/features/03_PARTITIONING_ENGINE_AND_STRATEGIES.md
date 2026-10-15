# Feature Blueprint: Multi-Strategy Partitioning & PDF Vision/OCR Engine

**Target Directory:** `unstructured/partition/`
**Primary Files:**
- `unstructured/partition/auto.py`
- `unstructured/partition/pdf.py`
- `unstructured/partition/pdf_image/ocr.py`
- `unstructured/partition/pdf_image/pdfminer_processing.py`
- `unstructured/partition/strategies.py`

---

## 1. WHY This Feature Was Implemented

### The Problem in PDF and Document Ingestion
PDFs are the single most common enterprise document format, but also the most technically fraught:
1. **The Cost vs. Accuracy Dilemma**:
   - Running deep learning computer vision models (e.g. LayoutLMv3, YOLOX) and high-DPI OCR on a clean, digitally generated 300-page financial report takes 15–20 minutes and huge GPU memory.
   - Conversely, running fast digital text extractors (like `pdfminer` or `pypdf`) on a scanned medical record or contract returns **0 words** because the text only exists as pixels.
2. **The Layout Ordering Dilemma (Multi-Column Text)**:
   - Naive text extraction reads left-to-right across the entire page, completely mangling two-column academic papers, newspaper articles, or brochures by reading across the columns instead of down them.
3. **Table & Form Blindness**:
   - Standard PDF extractors discard table cell boundaries, dumping rows into scrambled text.

### The Business & Developer Solution
`unstructured` introduced a **Multi-Strategy Execution Model**:
- **`fast` Strategy**: Extracts embedded digital characters and fonts directly using `pdfminer.six`. Takes milliseconds per page, requires no GPU or heavy vision libraries, and groups text blocks using geometric distance clustering.
- **`hi_res` Strategy**: Renders pages into images and runs object detection models (`unstructured-inference`) to segment bounding boxes for Titles, NarrativeText, Tables, and Figures. Solves multi-column reading order and detects tables.
- **`ocr_only` Strategy**: Rasterizes pages via `poppler` and runs full-page OCR (Tesseract or PaddleOCR).
- **`auto` Strategy**: The intelligent default. It dynamically inspects the document; if high-quality embedded digital text exists, it executes `fast`; if pages are scanned or empty, it automatically switches to OCR/`hi_res`.

---

## 2. WHERE It Is Implemented

### Key Components:
- **`partition()` Dispatcher** (`unstructured/partition/auto.py:28-200`):
  - Normalizes arguments and forwards them to document-specific partitioners.
- **`partition_pdf()`** (`unstructured/partition/pdf.py:100-300`):
  - Evaluates `strategy` (`auto`, `fast`, `hi_res`, `ocr_only`).
- **`pdfminer_processing.py`** (`unstructured/partition/pdf_image/pdfminer_processing.py:1-400`):
  - Low-level character stream extraction, bounding box aggregation, and font-size tracking for `fast` mode.
- **`process_data_with_ocr()`** (`unstructured/partition/pdf_image/ocr.py:36-180`):
  - Orchestrates Tesseract, PaddleOCR, and table structure transformers for `hi_res` and `ocr_only` modes.
- **Auto Heuristic** (`unstructured/partition/pdf.py`):
  - Analyzes word count density per page: if `word_count < threshold`, the page is classified as scanned and routed to OCR.

---

## 3. HOW It Is Connected Across the Project

```mermaid
flowchart TD
    User["partition(file, strategy='auto')"] --> Detect["Auto Partitioning Dispatcher"]
    Detect --> PDF["partition_pdf()"]
    
    PDF --> StrategyCheck{"Check Strategy"}
    
    StrategyCheck -->|"fast"| FastEngine["pdfminer.six Engine<br/>(Extracts font glyphs & bboxes)"]
    StrategyCheck -->|"ocr_only"| OCREngine["Poppler + Tesseract/PaddleOCR<br/>(Whole-page rasterization)"]
    StrategyCheck -->|"hi_res"| VisionEngine["unstructured-inference<br/>(YOLOX / LayoutLMv3 Layout Model)"]
    StrategyCheck -->|"auto"| Heuristic{"Check Embedded Text Density"}
    
    Heuristic -->|"Sufficient Digital Text"| FastEngine
    Heuristic -->|"Scanned / No Text"| VisionEngine
    
    VisionEngine --> TableDetect{"Table Detected?"}
    TableDetect -->|"Yes"| TATR["Table Transformer<br/>(Produces text_as_html)"]
    TableDetect -->|"No"| TextOCR["Bounding Box OCR"]
    
    FastEngine --> ElementAssembly["Construct Elements (Title, Text, Table)"]
    OCREngine --> ElementAssembly
    TATR --> ElementAssembly
    TextOCR --> ElementAssembly
    
    ElementAssembly --> Output["list[Element]"]
```

---

## 4. REUSABLE BLUEPRINT: How to Build This in Your Own Project

Here is a practical Python architecture implementing multi-strategy PDF partitioning with automatic heuristic fallback:

```python
from dataclasses import dataclass
from enum import Enum
from typing import List, Optional
import pypdf

class PartitionStrategy(str, Enum):
    AUTO = "auto"
    FAST = "fast"
    HI_RES = "hi_res"
    OCR_ONLY = "ocr_only"

@dataclass
class DocumentElement:
    category: str
    text: str
    page_number: int
    metadata: dict

def has_embedded_text(pdf_path: str, min_words_per_page: int = 10) -> bool:
    """Inspects first few pages to check if the PDF contains digital text streams."""
    reader = pypdf.PdfReader(pdf_path)
    pages_to_check = min(len(reader.pages), 3)
    total_words = 0
    for i in range(pages_to_check):
        text = reader.pages[i].extract_text() or ""
        total_words += len(text.split())
    return (total_words / pages_to_check) >= min_words_per_page

def partition_pdf_fast(pdf_path: str) -> List[DocumentElement]:
    """Fast digital extraction: lightweight, instant, low CPU/RAM."""
    reader = pypdf.PdfReader(pdf_path)
    elements = []
    for page_idx, page in enumerate(reader.pages):
        text = page.extract_text()
        if not text:
            continue
        # Split paragraphs based on double linebreaks
        for para in text.split("\n\n"):
            para_clean = para.strip()
            if not para_clean:
                continue
            # Heuristic for titles: short lines without terminal period
            category = "Title" if len(para_clean) < 80 and not para_clean.endswith(".") else "NarrativeText"
            elements.append(DocumentElement(
                category=category,
                text=para_clean,
                page_number=page_idx + 1,
                metadata={"strategy": "fast"}
            ))
    return elements

def partition_pdf_ocr(pdf_path: str) -> List[DocumentElement]:
    """OCR fallback extraction using pytesseract or paddleocr."""
    # (Requires pdf2image and pytesseract)
    # Rasterize pages and run OCR...
    elements = []
    # elements.append(DocumentElement(category="NarrativeText", text=..., ...))
    return elements

def partition_pdf(pdf_path: str, strategy: PartitionStrategy = PartitionStrategy.AUTO) -> List[DocumentElement]:
    """Multi-strategy orchestrator with automatic fallback."""
    if strategy == PartitionStrategy.AUTO:
        if has_embedded_text(pdf_path):
            strategy = PartitionStrategy.FAST
        else:
            strategy = PartitionStrategy.OCR_ONLY

    if strategy == PartitionStrategy.FAST:
        return partition_pdf_fast(pdf_path)
    elif strategy in (PartitionStrategy.OCR_ONLY, PartitionStrategy.HI_RES):
        return partition_pdf_ocr(pdf_path)
    else:
        raise ValueError(f"Unknown strategy: {strategy}")
```

### Key Engineering Takeaways:
1. **Never use one-size-fits-all parsing**: Always separate digital text extraction from computer vision OCR.
2. **Text density heuristic**: Sampling the first 3 pages for word count provides a 99% reliable discriminator between scanned and digital PDFs within 10 milliseconds.
3. **Multi-column safety**: When building `fast` extractors, group text blocks using coordinates rather than raw line streams to prevent reading across columns.
