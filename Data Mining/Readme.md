# ⛏️ Data Mining

> Comprehensive study repository for the **Data Mining (DS-303)** course.

## 📘 Course Overview

| Attribute | Details |
|-----------|---------|
| **Course Code** | DS-303 |
| **Course Title** | Data Mining |
| **Program** | BSAI-6A |
| **Credit Hours** | 3(2-1) — Theory + Lab |
| **Semester** | VI |
| **Instructor** | Muhammad Arham |

### 🎯 Syllabus Topics
- **Introduction to Data Mining** — Concepts, process & applications
- **Data Preprocessing** — Missing values, duplicates, noise handling, normalization, standardization, discretization
- **Summary Statistics** — Variance, standard deviation, data transformation
- **Association Rule Mining** — Market basket analysis, support / confidence / lift, Apriori algorithm, FP-Tree & FP-Growth
- **Python & OOP for Data Mining** — Lists, dictionaries, reusable data processing modules
- **Supervised Classification** — Decision Trees, Naïve Bayes, K-Nearest Neighbors (KNN), Support Vector Machines (SVM)
- **Unsupervised Learning & Clustering** — K-Means, K-Median, Hierarchical, Divisive, SOM
- **Outlier & Anomaly Detection** — Distance-based outliers, Isolation Forest
- **Web & Social Network Mining** — Data scraping, sentiment analysis, influence maximization
- **Data Mining Trends & Research Frontiers** — AutoML, IoT, smart cities, ensemble learning

---

## 📂 Folder Structure

```
Data Mining/
├── 📄 Readme.md
├── 📁 Outline/
│   ├── 📄 Detailed TOC.docx               # 15-lab detailed table of contents
│   └── 📄 docx.docx                       # Official course outline (DS-303)
├── 📁 Mids/
│   ├── 📁 Assignment/                     # DM Assignment #1 + solution
│   ├── 📁 Exam Prep/                      # Notes PDF, KDD video, audio explainer
│   ├── 📁 Lab/                            # KNIME workflows (Labs 1, 2 & 6)
│   ├── 📁 Quiz/                           # Quiz question paper + solution
│   └── 📁 Slides/                         # Intro + Lecture slides #1–8
└── 📁 Finals/
    ├── 📁 Exam Prep Material/             # Mind map, notes, lecture images
    ├── 📁 Lab Manual/                     # Compiled lab manuals + Labs 1–12 (datasets & workflows)
    ├── 📁 Notes/                          # Handwritten concept notes (19 images)
    ├── 📁 Practical/                      # Traffic Accident Severity ML report + notebook
    └── 📁 Slides/                         # K-Means, Outlier Detection, Web Mining, Trends
```

---

## 📁 Detailed Breakdown

### 🗂️ Outline
- **`Detailed TOC.docx`** — Detailed table of contents covering all 15 labs: from KNIME/Orange introductions and CRISP-DM, through data cleaning, preprocessing, association rule mining (Market Basket, Apriori, FP-Growth), Python/OOP, Decision Trees, Naïve Bayes/KNN, SVM, clustering, outlier detection, and scraping/sentiment analysis.
- **`docx.docx`** — Official course outline for DS-303: course description, prerequisites, CLOs, weekly breakup (30 lectures + 15 labs), assessment scheme (Internal 35% / Mid 25% / Final 40%), and grading model.

### 🗂️ Mids

| Subfolder | Contents |
|-----------|----------|
| **Assignment** | `Assignment 1 DM.docx` (handwritten — KDD process, variance/standard deviation, classification types, association rule mining, Apriori vs FP-Growth, supervised classifiers), `Assignemt solution.pdf`, reference image |
| **Exam Prep** | `Data Mining Notes.pdf`, `DM content for codes 011.pdf`, `Architecting_Knowledge__First_Principles_of_the_KDD_Pipeline.mp4` (KDD video), `الگورتھم_کا_جادو_یا_ڈیٹا_کی_صفائی.mp3` (Urdu audio explainer) |
| **Lab** | **KNIME workflows** — `Lab 1/` (Retail Sales Analysis workflow + Example Workflows), `Lab 2/` (KNIME_project2 with Decision Tree on churn data), `Lab 6/` (Market Basket Analysis workflow) |
| **Quiz** | `pdf (1).pdf` (quiz question paper), `Quiz Solution.pdf`, Gemini reference image |
| **Slides** | `Intro of DM.pptx` + `Lecture No. 1`–`8` (`.pptx`) covering preprocessing, association rules, classification, and clustering theory |

### 🗂️ Finals

#### 📌 Exam Prep Material
- **`datamining Mind map.pdf`** — visual concept mind map
- **`Notes.docx` / `Notes.pdf`** — consolidated final exam notes
- **`Lecture (1)`–`(6).png`** — lecture concept images

#### 📌 Lab Manual
- **Compiled manuals:** `2023-BS-AI-017.docx`/`.pdf`, `2023-bs-ai-150 Data Mining Lab Manual.docx`/`.pdf`, `Lab Manual Task.docx`
- **Lab exercises with datasets** (`.csv`):
  - **Lab 1** — `retail_sales_dataset.csv` (KNIME retail KPI analysis)
  - **Lab 2** — `Churn_Modelling.csv` + `untitled.ows` (CRISP-DM churn prediction, Orange)
  - **Lab 3** — `Healthcare.csv` (data cleaning, RapidMiner + Python)
  - **Lab 4** — `loan_prediction_dataset.csv` (normalization, standardization, discretization)
  - **Lab 5** — `Groceries_dataset.csv` (market basket analysis, Python + mlxtend)
  - **Lab 6** — `bank_transactions_data_2.csv` (Apriori algorithm)
  - **Lab 7** — `new_retail_data.csv` + `untitled.ows` (FP-Tree / FP-Growth)
  - **Lab 9** — `bank.csv` + `KNIME_project/` (Decision Tree classifier, 80/20 stratified split)
  - **Lab 10** — `Email spam.csv`, `spam dataset.csv` (Naïve Bayes vs KNN text classification)
  - **Lab 11** — `Example Workflows/` + `KNIME_project/` (SVM linear vs RBF kernels)
  - **Lab 12** — `untitled.ows` (customer segmentation / clustering)

#### 📌 Notes
- **`Note (1)`–`(19).png`** — ~19 handwritten concept notes covering key data mining topics

#### 📌 Practical
- **`Predictive Modeling and Analysis of Traffic Accident Severities Using Machine Learning Algorithms.pdf`** / **`.docx`** — formal IEEE-style research report
- **`Research Article.pdf`** — reference research article
- **`traffic-accidents-analyses.ipynb`** — end-to-end ML notebook (Random Forest 84.19%, Logistic Regression 83.16%, Decision Tree 79.23%, KNN 74.52%)

#### 📌 Slides
- **`_1-Supervised Learning Unsupervised Learning & Clustering.pptx`** — learning paradigms
- **`Lecture 2.1- K-mean Cluster.pptx`**, **`Lecture 2.2- K-median Cluster.pptx`** — clustering algorithms
- **`Lecture No. 3.pptx`** — hierarchical/divisive clustering & SOM
- **`Lecture No. 4-Outlier and Anomaly detection.pptx`** — anomaly detection
- **`Lecture No. 5-Web & Social Network Mining.pptx`** — web & social mining
- **`Lecture No. 6.pptx`** — web mining techniques
- **`Lecture No. 7-Data Mining Trends & Research Frontiers.pptx`** — trends & frontiers
- **`data mining notes.doc`** — supplementary notes

---

## ⭐ Key Files Quick Access

| Purpose | File |
|---------|------|
| 📋 Course Outline | `Outline/docx.docx` |
| 📑 Lab TOC (15 labs) | `Outline/Detailed TOC.docx` |
| ✍️ Assignment #1 | `Mids/Assignment/Assignment 1 DM.docx` |
| 📝 Mid Exam Notes | `Mids/Exam Prep/Data Mining Notes.pdf` |
| 🎓 Final Exam Notes | `Finals/Exam Prep Material/Notes.pdf` |
| 🗺️ Mind Map | `Finals/Exam Prep Material/datamining Mind map.pdf` |
| 📖 Lab Manual | `Finals/Lab Manual/2023-BS-AI-017.pdf` |
| 🧪 Lab Datasets | `Finals/Lab Manual/Lab 1/` → `Lab 12/` |
| 🔬 Practical Report | `Finals/Practical/Predictive_Modeling_Traffic_Accidents.docx` |
| 📓 Practical Notebook | `Finals/Practical/traffic-accidents-analyses.ipynb` |
| 🎞️ Slides | `Mids/Slides/`, `Finals/Slides/` |

---

## 🛠️ Tools & Software

- **KNIME Analytics Platform** — visual node-based data pipelines (retail KPIs, Apriori, Decision Trees)
- **Orange Data Mining** — canvas-based workflows (CRISP-DM churn prediction, clustering, FP-Growth)
- **RapidMiner Studio** — visual operators + embedded Python (data cleaning, preprocessing, outlier detection)
- **Python** — `pandas`, `mlxtend` (Apriori/FP-Growth/association rules), `scikit-learn` (classification, clustering, metrics)
- **Gephi** — network visualization for sentiment analysis (Labs 14)
- **Jupyter Notebook** — for lab exercises and the traffic accident practical
- **Microsoft Office** (Word) — for `.docx` documents and reports

---

*Last updated: Course repository for DS-303 — Semester VI*

