# 👁️ Computer Vision

> Comprehensive study repository for the **Computer Vision (AI-311)** course.

## 📘 Course Overview

| Attribute | Details |
|-----------|---------|
| **Course Code** | AI-311 |
| **Course Title** | Computer Vision |
| **Program** | BSAI-6A |
| **Credit Hours** | 3(2-1) — Theory + Lab |
| **Semester** | VI |
| **Instructor** | Ms. Esha Nawaz |
| **Prerequisites** | Programming Fundamentals, Artificial Neural Networks |

### 🎯 Syllabus Topics
- **Introduction to CV** — Problems faced in computer vision, history & modern advancements
- **Image Processing** — Image filtering, image pyramids, Fourier transforms, Hough transform
- **Camera Models** — Camera model setup, camera model from parameters, camera calibration
- **Multiple View Geometry** — Relationships of planes, points, and lines
- **Transformations** — 2D/3D transformations, decomposition & estimation, rotation about camera center, concatenation
- **Feature Detection** — Harris corners, scale-space pyramid, SIFT, statistical feature extraction (GLCM, LBP), directional filters (HoG)
- **Feature Description & Matching** — HOG, SIFT, SURF
- **Applications of CV** — Image stitching, converting single images into 3D models, video geometry (2D & 3D)
- **Deep Learning for CV** — Image detection/localization, R-CNN, Fast/Faster R-CNN, YOLO, RetinaNet
- **Image Segmentation** — UNet, SegNet, MaskRCNN, watershed/meanshift, graph clustering
- **Image Generation** — GANs (Generative Adversarial Networks)

---

## 📂 Folder Structure

```
Computer Vision/
├── 📄 Readme.md
├── 📁 Outline/
│   └── 📄 Outline.docx                   # Official course outline (AI-311)
├── 📁 Mids/
│   ├── 📁 Assignment/                    # Assignment #1 + Assignment #2 (GAN image generation)
│   ├── 📁 Lab/                           # Lab 1 (intro) & Lab 2 (CNN classification)
│   └── 📁 Notes/                         # CV notes PDF + ~20 handwritten concept images
└── 📁 finals/
    ├── 📄 hog (017).ipynb                # HOG feature extraction notebook
    ├── 📁 ass/                           # Assignment-related files
    ├── 📁 exam prep/                     # Topper exam notes (HTML) — all topics
    ├── 📁 lab/                           # Lab notebooks + manuals + datasets
    ├── 📁 Lab Manual/                    # CV lab manuals (017 & 037)
    ├── 📁 Practicle/                     # Skin Disease Classification practical + Flask app
    ├── 📁 Project/                       # Skin Disease Classifier project (final)
    └── 📁 Slides/                        # Mask R-CNN, SEGNET, UNet presentations
```

---

## 📁 Detailed Breakdown

### 🗂️ Outline
- **`Outline.docx`** — Official course outline for AI-311: course description, weekly plan (30 lectures + 15 labs), learning objectives, assessment scheme (Internal 35% / Mid 25% / Final 40%), and grading model.

### 🗂️ Mids

| Subfolder | Contents |
|-----------|----------|
| **Assignment** | `vision Assignment 1.docx` (Multiple View Geometry) + `Assignment 2/` — GAN image generation (`CV A#2.pdf` + 4 AI-generated images) |
| **Lab** | `Lab 1/` — intro lab (`1st lab.docx`, `2023-BS-AI-017.pdf`); `Lab 2/` — CNN image classification (`Computer_Vision_Lab_02_CNN_Image_Classification.pdf` + circle/square train & test datasets ~100+ PNG images) |
| **Notes** | `computer vision notes.pdf` + ~20 handwritten note images covering Fourier transforms, camera projection matrix, image processing concepts |

### 🗂️ Finals

#### 📌 Exam Prep
- **`cv notes.html`** — "One Night Before Exam" topper notes covering: Historical/Classical CV, Image Localization & Object Detection, R-CNN, Fast/Faster R-CNN, YOLO (with 8 solved numericals), U-Net, SegNet, Mask R-CNN, GANs, OS Paging & Segmentation, CNN Segmentation Q&A, and Assignment 2 full solutions

#### 📌 Lab (`finals/lab/`)
- **Notebooks:** `hog.ipynb`, `sift.ipynb`, `meanshift.ipynb`, `watershed segmentation.ipynb`, `felzenszwalb.ipynb`, `image segmentation.ipynb`, `segmentation_using_cnn.ipynb`, `cnn_with_detection.ipynb`, `cnnclassification_checkpoint.ipynb`, `linear_regression.ipynb`, `pre_trainedmodel.ipynb`, `RAG+MERGED.ipynb`, `Lab_08.ipynb`
- **Manuals (PDF):** `Computer_Vision_Lab_02_CNN_Image_Classification.pdf`, `Harris_Corner_Detection_Lab_Manual.pdf`, `Fourier_and_Hough_Transform_BS.pdf`, `Image_Pyramids_Explanation.pdf`, `Camera_Model_Setup_Lecture.pdf`, `Transform_Domain_Lab_Manual.pdf`
- **Docs:** `1st lab (1).docx`, `interactive lab task (1).docx`, `Lab Task object detection.docx`, `Introduction To Computer Vision – Lecture 1 (complete Slides).docx`

#### 📌 Lab Manual
- **`2023-BS-AI-017.pdf`**, **`Lab manual CV 017.docx`**, **`Lab manual CV 037.pdf`**, **`Manual.docx`** — compiled lab manuals for the course

#### 📌 Practical (`finals/Practicle/`)
- **`Skin_Disease_Classification_Report_Professional.docx` / `.pdf`** — formal practical report
- **`project skin.ipynb`** — training/inference notebook
- **`Lab manual.pdf`** — lab manual
- **`code/`** — Complete **DermaScan** Flask web app:
  - `train_model.py` — MobileNetV2 two-phase training script (head → fine-tune top 50 layers)
  - `app.py` — Flask web application (drag-and-drop upload, top-3 predictions)
  - `index.html` — frontend UI with confidence bars, urgency indicator
  - `requirements.txt` — Python dependencies
  - `Dataset/` — DermNet-based skin disease dataset (train + test) with **20 disease classes** (Acne & Rosacea, Melanoma, Eczema, Psoriasis, etc.)

#### 📌 Project (`finals/Project/`)
- **`Skin_Disease_Classifier_Documentation.docx`** — full project report (ensemble architecture, two-stage fine-tuning, TTA, ipywidgets frontend)
- **`skin disease.pdf`**, **`skin_disease.ipynb`**, **`project skin.ipynb`** — project notebooks & presentation
- **`Skin Disease.zip`** — zipped project files
- **`Important - Dataset link - Google Drive.txt`** — dataset source link

#### 📌 Slides (`finals/Slides/`)
- **`mask-rcnn.pptx`**, **`unet.pptx`**, **`SEGNET.pptx`** — segmentation architecture presentations
- **`Transformations in 2D3D.pdf`** + `pdf.pdf`, `pdf (1-4).pdf` — lecture slide PDFs

---

## ⭐ Key Files Quick Access

| Purpose | File |
|---------|------|
| 📋 Course Outline | `Outline/Outline.docx` |
| 📝 Mid Exam Notes | `Mids/Notes/computer vision notes.pdf` |
| ✍️ Assignment #1 | `Mids/Assignment/vision Assignment 1.docx` |
| ✍️ Assignment #2 (GAN) | `Mids/Assignment/Assignment 2/CV A#2.pdf` |
| 🎓 Topper Exam Notes | `finals/exam prep/cv notes.html` |
| 🔬 HOG Notebook | `finals/hog (017).ipynb` |
| 🧪 Lab Notebooks | `finals/lab/` |
| 🛠️ Practical App | `finals/Practicle/code/app.py` |
| 🎯 Final Project | `finals/Project/Skin_Disease_Classifier_Documentation.docx` |
| 🎞️ Slides | `finals/Slides/mask-rcnn.pptx`, `unet.pptx`, `SEGNET.pptx` |

---

## 🛠️ Tools & Software

- **Python + Jupyter Notebook** — for all lab exercises and project notebooks
- **OpenCV / scikit-image** — image processing, feature detection (HOG, SIFT, Harris, segmentation)
- **TensorFlow / Keras** — CNN classification, deep learning models (MobileNetV2, ensemble backbones)
- **Flask** — web deployment of the Skin Disease Classifier
- **Google Colab** — GPU-accelerated training environment
- **Microsoft Office** (Word / PowerPoint) — for `.docx` / `.pptx` documents and reports

---

*Last updated: Course repository for AI-311 — Semester VI*

