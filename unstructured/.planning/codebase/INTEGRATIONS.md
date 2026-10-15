---
last_mapped_commit: 5c1115c5d07184f02e11020783a2370769014dfb
last_mapped_at: 2026-10-15
---
# External Integrations & Ecosystem

**Analysis Date:** 2026-10-15

## Overview

`unstructured` acts as the universal adapter between unstructured enterprise data sources and modern AI/LLM storage/compute systems. It integrates across multiple layers:
1. **Source Connectors** (File ingestion from SaaS, clouds, databases)
2. **AI & Vision Inference Engines** (Local deep learning models and hosted OCR/Vision APIs)
3. **Embedding Providers** (Generating vector embeddings directly on partitioned document elements)
4. **Downstream Staging Targets** (Vector databases, annotation platforms, ML datasets)

---

## 1. Cloud AI & Hosted APIs

### Unstructured API / Platform (`unstructured-client`)

- **Location**: `unstructured/partition/api.py`
- **Purpose**: Offloads heavy document parsing, high-resolution layout analysis, and advanced table extraction to Unstructured Serverless or private enterprise instances.
- **Protocol**: HTTPS REST calls using `unstructured-client` SDK.
- **Authentication**: API Key via `UNSTRUCTURED_API_KEY` environment variable or explicit `api_key` argument; configurable `api_url` endpoint.
- **Capabilities**: High-accuracy table recognition (`text_as_html`), multimodal layout parsing, OCR offloading.

### Google Cloud Vision

- **Location**: `unstructured/partition/pdf_image/ocr.py`
- **Purpose**: Cloud-based OCR alternative to local Tesseract/PaddleOCR for difficult, noisy, or multi-script documents.
- **Authentication**: Standard GCP Application Default Credentials (`GOOGLE_APPLICATION_CREDENTIALS`).

---

## 2. Embedding Providers (`unstructured.embed`)

The `unstructured.embed` package provides a unified interface (`BaseEmbeddingEncoder`) allowing vector embeddings to be generated directly for partitioned and chunked elements.

| Provider | Module | Configuration Requirements | Supported Models |
|----------|--------|----------------------------|------------------|
| **OpenAI** | `unstructured/embed/openai.py` | `OPENAI_API_KEY` | `text-embedding-3-small`, `text-embedding-3-large`, `text-embedding-ada-002` |
| **AWS Bedrock** | `unstructured/embed/bedrock.py` | AWS IAM credentials (`boto3`) | Amazon Titan Embeddings, Cohere Embed |
| **Google VertexAI** | `unstructured/embed/vertexai.py` | GCP credentials / Project ID | `textembedding-gecko`, multimodal embedding models |
| **HuggingFace** | `unstructured/embed/huggingface.py` | Local PyTorch or HuggingFace Inference API (`HF_TOKEN`) | Any sentence-transformers model (e.g. `all-MiniLM-L6-v2`, `bge-large-en-v1.5`) |
| **Voyage AI** | `unstructured/embed/voyageai.py` | `VOYAGE_API_KEY` | `voyage-large-2`, `voyage-code-2`, `voyage-3` |
| **Mixedbread AI** | `unstructured/embed/mixedbreadai.py` | `MXBAI_API_KEY` | `deepset/mxbai-embed-large-v1` |
| **OctoAI** | `unstructured/embed/octoai.py` | `OCTOAI_API_KEY` | Hosted embedding endpoints |

### Integration Mechanism:

```python
from unstructured.embed.openai import OpenAIEmbeddingEncoder
from unstructured.partition.html import partition_html

elements = partition_html(url="https://example.com")
encoder = OpenAIEmbeddingEncoder(model_name="text-embedding-3-small")
elements = encoder.embed_documents(elements)

# elements[0].embeddings now contains list[float]

```

---

## 3. Staging & Downstream Sinks (`unstructured.staging`)

`unstructured` standardizes document output into an array of `Element` objects, which can then be serialized or dispatched directly into downstream systems:

### Vector Databases

- **Weaviate** (`unstructured/staging/weaviate.py`):
  - Converts elements directly into Weaviate data objects with schema-aligned metadata properties and vector coordinates.

### Data Annotation & Quality Tools

- **Argilla** (`unstructured/staging/argilla.py`): Creates Argilla `FeedbackDataset` records for human feedback loops on extraction and categorization.
- **Label Studio** (`unstructured/staging/label_studio.py`): Formats elements with bounding boxes into Label Studio tasks for object detection and NER verification.
- **Prodigy** (`unstructured/staging/prodigy.py`): Prepares stream annotations for Prodigy active learning pipelines.
- **Labelbox** (`unstructured/staging/label_box.py`): Exports predictions and coordinate geometry for enterprise labeling.
- **Datasaur** (`unstructured/staging/datasaur.py`): Formats token-level elements for NLP labeling.

### Data Science & Serialization Formats

- **Pandas** (`unstructured/staging/base.py:convert_to_dataframe`): Flattens element hierarchies and metadata into structured DataFrames.
- **HuggingFace Datasets** (`unstructured/staging/huggingface.py`): Packages elements into `datasets.Dataset` instances ready for model fine-tuning.
- **Baseplate** (`unstructured/staging/baseplate.py`): Deep learning training format.
- **JSON / NDJSON / CSV**: Native streaming and file serializers with full metadata fidelity.

---

## 4. Ingest Connectors (`unstructured-ingest`)

While core `unstructured` handles the parsing and processing of file streams, the optional `unstructured-ingest` plugin suite connects directly to cloud object stores and enterprise platforms:

- **Cloud Storage**: Amazon S3, Google Cloud Storage (GCS), Azure Blob Storage, Azure Data Lake (ADLS), Box, Dropbox, Google Drive, OneDrive.
- **Enterprise Collaboration**: Microsoft SharePoint, Confluence, Jira, Salesforce, Slack, Discord.
- **Databases & Search Engines**: MongoDB, PostgreSQL, Elasticsearch, OpenSearch, AstraDB, Couchbase, Neo4j, SingleStore, Databricks Volumes, Delta Lake.
- **Message Queues**: Apache Kafka.
- **Vector Stores**: Pinecone, Qdrant, Chroma, Milvus, Weaviate, KDB.AI, Vectara.

---

## 5. Local System & C-Level Engines

| Engine | Integration Method | Role in System |
|--------|--------------------|----------------|
| **Tesseract OCR** | Subprocess CLI (`unstructured-pytesseract`) | Optical character recognition on bitmap images |
| **PaddleOCR** | Python bindings (`paddlepaddle` + `unstructured-paddleocr`) | High-accuracy text detection and recognition for CJK & multilingual documents |
| **Poppler (`pdftoppm`)** | Subprocess CLI via `pdf2image` | Vector PDF rasterization into high-DPI images |
| **LibreOffice** | Subprocess headless CLI | Transcoding legacy Office documents (`.doc`, `.ppt`, `.xls`) to OpenXML (`.docx`, `.pptx`, `.xlsx`) |
| **OpenAI Whisper** | Python API (`whisper`) | Audio transcription with millisecond segment timestamps |
| **Pandoc** | Subprocess CLI via `pypandoc` | Document format conversion for EPUB, RTF, RST, Org-mode |
