# Semester VI
A collection of Jupyter Notebooks, assignments, labs and project work for Semester VI coursework.

> NOTE: This repository is primarily composed of Jupyter Notebooks. If you open notebooks on GitHub, outputs may be hidden — run them locally or via Binder/Colab for full interactivity.

Contents
- Overview
- Notebooks & Projects (see below)
- How to run notebooks (local / Binder /Colab)
- Environment & dependencies
- Conventions & structure
- Reproducibility
- Contributing
- License & contact

---

## Overview
This repository collects course materials, lab notebooks, assignments and project work for Semester VI. Each notebook is intended to be self-contained and reproducible: installations, data sources and execution instructions are included where necessary.

Use this README as the starting point to:
- Find a specific lecture/lab or assignment notebook
- Recreate the execution environment
- Run notebooks interactively or convert them to HTML/PDF for review/grading

---

## Notebooks & Projects
(Replace this list with the actual notebook filenames and short descriptions. I tried to read the repo contents, but I couldn't access them — please paste the list here or allow me to add the README directly to the repo so I can auto-fill this section.)

Example format:
- notebooks/01-intro.ipynb — Introductory concepts and setup
- notebooks/02-data-prep.ipynb — Data loading and preprocessing
- assignments/assignment-1.ipynb — Assignment 1: classification problem
- projects/final-project.ipynb — Final project report and code

---

## How to run the notebooks

### Prerequisites
- Python 3.9+ (or the version specified in environment.yml)
- git
- Either JupyterLab or Jupyter Notebook (nbclassic)

Recommended: create an isolated environment with conda.

Example (using conda):
```bash
conda env create -f environment.yml
conda activate semester-vi
jupyter lab
```

Or using pip:
```bash
python -m venv .venv
source .venv/bin/activate   # or .venv\\Scripts\\activate on Windows
pip install -r requirements.txt
jupyter lab
```

### Running a single notebook
- Open JupyterLab (recommended) or Jupyter Notebook.
- Navigate to the notebook and open it.
- If a kernel is missing, select "Kernel → Change kernel" and choose the environment you set up.

### Binder (online, no install)
If you want to run the notebooks without local install, add a Binder badge (example):
```markdown
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/<owner>/<repo>/HEAD)
```
Replace `<owner>` and `<repo>` with `hamnasz` and `Semester-VI`. Binder builds from the default branch and requires either `environment.yml`, `requirements.txt`, or `Dockerfile` at the repository root.

### Google Colab
To open notebooks in Colab:
1. Upload the notebook to Google Drive or
2. Use the URL pattern:
   https://colab.research.google.com/github/<owner>/<repo>/blob/<branch>/path/to/notebook.ipynb

---

## Environment & dependencies

Suggested files:
- environment.yml (Conda) — recommended for reproducibility
- requirements.txt (pip) — alternative

Example environment.yml:
```yaml
name: semester-vi
channels:
  - conda-forge
dependencies:
  - python=3.10
  - jupyterlab
  - numpy
  - scipy
  - pandas
  - scikit-learn
  - matplotlib
  - seaborn
  - notebook
  - ipykernel
  - nbconvert
  - pip
  - pip:
    - some-pypi-only-package
```

Example minimal requirements.txt:
```
jupyterlab
numpy
pandas
scikit-learn
matplotlib
seaborn
nbconvert
```

Kernel registration (after creating env):
```bash
python -m ipykernel install --user --name semester-vi --display-name "Python (semester-vi)"
```

---

## Notebook conventions
To keep the repository consistent and easy to grade/read:
- Filenames: use two-digit prefixes for ordering, e.g. `01-intro.ipynb`, `02-data-prep.ipynb`.
- Notebook metadata:
  - Add a title and short description at the top.
  - Include "Run all" friendly sections, and mark long-running cells clearly.
- Clear outputs before committing (optional): use `nbstripout` or the GitHub UI to reduce noise in diffs.
- Version data inputs where possible (store small datasets in `data/` with README that describes sources and license).

---

## Reproducibility
- Pin package versions in environment.yml or requirements.txt.
- Include any data or provide download scripts (e.g., `scripts/fetch_data.sh`) with checksums if possible.
- Set random seeds in notebooks and document nondeterministic steps (e.g., GPU training).

---

## Converting notebooks to HTML/PDF (for submission/grading)
To convert to HTML:
```bash
jupyter nbconvert --to html path/to/notebook.ipynb
```
To convert to PDF (via LaTeX):
```bash
jupyter nbconvert --to pdf path/to/notebook.ipynb
```
Alternatively, use the Jupyter UI: File → Export Notebook As.

---

## Continuous Integration (optional)
You can add CI to ensure notebooks run (or at least convert) on each push. Example with GitHub Actions (basic):
```yaml
name: Test notebooks
on: [push, pull_request]
jobs:
  nbconvert:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.10'
      - name: Install dependencies
        run: |
          python -m pip install -r requirements.txt
      - name: Convert notebooks to ensure they parse
        run: |
          jupyter nbconvert --to html notebooks/*.ipynb
```
For full testing of outputs, consider `pytest` + `nbval`.

---

## File structure (recommended)
- notebooks/            — course notebooks and labs
- assignments/          — assignment notebooks
- projects/             — project notebooks, reports and datasets
- data/                 — small datasets or scripts to download data
- scripts/              — helper scripts (data download, preprocessing)
- environment.yml
- requirements.txt
- README.md

---

## Contributing
- If you make changes to notebooks, clear or comment outputs where appropriate.
- Add new dependencies to `environment.yml` and/or `requirements.txt`.
- Create pull requests for substantial changes; use descriptive titles and include which notebooks to review.

---

## License
Specify a license for the repository (e.g., MIT, CC-BY for notebooks). If you want a recommendation:
- Code: MIT License
- Notebook content and written material: CC BY 4.0

Example: add a `LICENSE` file in the repo root.

---

## Contact / Maintainer
- Maintainer: hamnasz
- Email / contact: (add your contact info here)

---

## Acknowledgements
- Acknowledge course instructors, data sources, and any third-party libraries or references used.
