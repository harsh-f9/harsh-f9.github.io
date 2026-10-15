---
last_mapped_commit: 6fadbae317b09c4dd4051c0f1fc1746c6baf04bc
last_mapped_at: 2026-10-15
---
# External Integrations

**Analysis Date:** 2026-10-15

## Overview

Docling interfaces with deep learning model repositories, optical character recognition (OCR) runtimes, vision-language inference servers, and remote document conversion services.

---

## 1. Optical Character Recognition (OCR) Engines

Docling abstracts OCR through [`BaseOcrModel`](file:///C:/Projects1/Others/docling/docling/models/base_ocr_model.py) and a dynamic plugin factory ([`OcrFactory`](file:///C:/Projects1/Others/docling/docling/models/factories/ocr_factory.py)):

| Engine | Integration Class | Underlying Library / Backend | Purpose & Capabilities |
| :--- | :--- | :--- | :--- |
| **Auto OCR** | [`OcrAutoModel`](file:///C:/Projects1/Others/docling/docling/models/stages/ocr/auto_ocr_model.py) | Dynamic dispatch | Automatically selects the optimal available OCR engine for the requested language and platform. |
| **EasyOCR** | [`EasyOcrModel`](file:///C:/Projects1/Others/docling/docling/models/stages/ocr/easyocr_model.py) | `easyocr` (PyTorch) | Default general-purpose OCR for 80+ languages. |
| **RapidOCR** | [`RapidOcrModel`](file:///C:/Projects1/Others/docling/docling/models/stages/ocr/rapid_ocr_model.py) | `rapidocr_onnxruntime` | Fast, lightweight ONNX-based OCR with low memory consumption. |
| **Tesseract** | [`TesseractOcrModel`](file:///C:/Projects1/Others/docling/docling/models/stages/ocr/tesseract_ocr_model.py) | `pytesseract` (libtesseract) | Industry-standard open source OCR. |
| **Tesseract CLI** | [`TesseractOcrCliModel`](file:///C:/Projects1/Others/docling/docling/models/stages/ocr/tesseract_ocr_cli_model.py) | Subprocess `tesseract` | Avoids Python C-bindings; uses system executable directly. |
| **Mac OCR** | [`OcrMacModel`](file:///C:/Projects1/Others/docling/docling/models/stages/ocr/ocr_mac_model.py) | Apple Vision Framework | Hardware-accelerated OCR for macOS Apple Silicon. |
| **Nemotron OCR** | [`NemotronOcrModel`](file:///C:/Projects1/Others/docling/docling/models/stages/ocr/nemotron_ocr_model.py) | NVIDIA Nemotron | Enterprise-grade high-accuracy OCR. |
| **KServe v2 OCR**| [`KserveV2OcrModel`](file:///C:/Projects1/Others/docling/docling/models/stages/ocr/kserve_v2_ocr_model.py) | Remote KServe v2 Protocol | Remote inference over HTTP/gRPC to decoupled OCR microservices. |

---

## 2. Hugging Face Model Hub Integrations

Docling automatically downloads and caches model weights from Hugging Face Hub using [`hf_model_download.py`](file:///C:/Projects1/Others/docling/docling/models/utils/hf_model_download.py):

- **Layout Analysis Models:**
  - Detect document semantic structures: headings, text blocks, tables, figures, footnotes, headers, footers, code listings.
  - Implemented in [`LayoutModel`](file:///C:/Projects1/Others/docling/docling/models/stages/layout/layout_model.py) and [`LayoutObjectDetectionModel`](file:///C:/Projects1/Others/docling/docling/models/stages/layout/layout_object_detection_model.py).
- **Table Structure Models:**
  - Predict table cell bounding boxes, column/row spans, and OTSL (Open Table Structure Language) tokens.
  - Implemented in [`TableStructureModel`](file:///C:/Projects1/Others/docling/docling/models/stages/table_structure/table_structure_model.py) and [`TableStructureModelV2`](file:///C:/Projects1/Others/docling/docling/models/stages/table_structure/table_structure_model_v2.py).
- **Vision-Language Models (VLM):**
  - Extract structured data from charts, visual diagrams, and document pages.
  - Models: Granite Vision (`ibm-granite/granite-vision-3.1-2b`), SmolVLM, Qwen2-VL, MinerU2.5-Pro (`opendatalab/MinerU2.5-Pro-2604-1.2B`).
- **Automatic Speech Recognition (ASR):**
  - Transcribe audio/video attachments using OpenAI Whisper checkpoints (`whisper-tiny` through `whisper-large-v3-turbo`).

---

## 3. Vision-Language Inference Engines

Docling supports multiple pluggable backends for VLM execution via [`docling/models/inference_engines/vlm/`](file:///C:/Projects1/Others/docling/docling/models/inference_engines/vlm/):

1. **Hugging Face Transformers Engine** ([`transformers_engine.py`](file:///C:/Projects1/Others/docling/docling/models/inference_engines/vlm/transformers_engine.py)):
   - Standard PyTorch pipeline using Hugging Face AutoModelForVision2Seq.
2. **vLLM Engine** ([`vllm_engine.py`](file:///C:/Projects1/Others/docling/docling/models/inference_engines/vlm/vllm_engine.py)):
   - PagedAttention and continuous batching for production serving throughput.
3. **MLX Engine** ([`mlx_engine.py`](file:///C:/Projects1/Others/docling/docling/models/inference_engines/vlm/mlx_engine.py)):
   - Optimized for Apple Silicon unified memory using MLX.
4. **API Engine** ([`api_vlm_model.py`](file:///C:/Projects1/Others/docling/docling/models/vlm_pipeline_models/api_vlm_model.py)):
   - Dispatches image requests to external OpenAI-compatible or proprietary HTTP endpoints.

---

## 4. Remote Docling Serve Client

For decoupled deployments where document parsing runs on dedicated GPU clusters:
- **Client Package:** `docling-client` (or `docling.service_client`)
- **Key Modules:**
  - [`DoclingClient`](file:///C:/Projects1/Others/docling/docling/service_client/client.py) (Synchronous client)
  - [`_AsyncDoclingClient`](file:///C:/Projects1/Others/docling/docling/service_client/_async_client.py) (Asynchronous `httpx` client)
  - [`JobTracker`](file:///C:/Projects1/Others/docling/docling/service_client/job.py) (Polls job state, handles webhook callbacks and streaming results)
- **Protocol:** HTTP REST with JSON payloads and multi-part file uploads. Supports converting local files, URLs, or raw byte streams.

---

## 5. Storage & Cache

- **Model Cache:** Downloaded weights default to standard Hugging Face cache (`~/.cache/huggingface/hub`) or local directories configured via `HF_HOME`.
- **Pipeline Cache:** In-memory caching for compiled pipeline models across conversion requests using [`pipeline_cache.py`](file:///C:/Projects1/Others/docling/docling/utils/pipeline_cache.py).

---
*Integration analysis: 2026-10-15*
