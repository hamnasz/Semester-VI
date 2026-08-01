# Deep Learning

This directory contains Deep Learning course materials, experiments, and example notebooks used during Semester VI.

## Contents (overview)
- Notebooks/ : Jupyter notebooks with lectures, exercises, and experiments (primary content).
- data/ : Datasets (or dataset download scripts). Datasets may be too large to store directly in the repo — see instructions below.
- models/ : Saved model checkpoints and training logs (typically not committed; see .gitignore).
- utils/ : Helper scripts, data loaders, and utility functions.
- requirements.txt : Python package dependencies (or environment.yml for conda).
- README.md : This file.

## Quick start

1. Clone the repo
   ```bash
   git clone https://github.com/hamnasz/Semester-VI.git
   cd "Semester-VI/Deep Learning"
   ```

2. Create environment
   - Using pip:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     pip install -r requirements.txt
     ```
   - Or using conda (if environment.yml provided):
     ```bash
     conda env create -f environment.yml
     conda activate deep-learning
     ```

3. Run notebooks
   - Start Jupyter:
     ```bash
     jupyter lab
     ```
   - Open the notebooks in the Notebooks/ directory and run cells in order.
   - If using Google Colab, open the notebook and connect to a runtime (notebooks may include a Colab badge).

## Typical files (update to match actual folder)
- Notebooks/
  - 01-intro-to-deep-learning.ipynb — basics: neurons, activation, loss, gradient descent
  - 02-cnn-image-classification.ipynb — convolutional networks and training on CIFAR/MNIST
  - 03-transfer-learning.ipynb — fine-tuning pretrained models
  - 04-rnn-and-transformers.ipynb — sequence models and transformers
- requirements.txt — list of pip dependencies (e.g., numpy, scipy, pandas, matplotlib, scikit-learn, torch/ tensorflow, torchvision)
- data/README.md — describes sources and how to download datasets

## Data and large files
- Datasets and model checkpoints are often large and should be stored outside the Git repository (e.g., Google Drive, Zenodo, or an S3 bucket).
- Provide download scripts (e.g., scripts/download_data.sh) or dataset links in data/README.md.
- Add large files to .gitignore and consider using Git LFS for versioning large binaries.

## Reproducibility
- Record package versions in requirements.txt, or include environment.yml for conda users.
- Include seeds and explicit instructions in each notebook for reproducibility.
- Where applicable, add a training log or a JSON file with hyperparameters for runs in models/.

## Contributing
- If you want to add notebooks or experiments:
  - Fork the repository, add your notebook(s) under Notebooks/ with a clear name and short description at the top.
  - Keep notebooks tidy: clear outputs before committing (use nbstripout or jupyter nbconvert).
  - Add or update requirements.txt if new packages are needed.
  - Open a pull request describing the changes.

## Citation
If you use these notebooks or experiments in academic work, please cite the repository or the course as appropriate. Example:

- Hamna Sz — Semester VI Deep Learning notebooks (GitHub repository). https://github.com/hamnasz/Semester-VI

## Contact
For questions or issues, open an issue in the repo or contact the maintainer: hamnasz (GitHub).

---

Notes for repo owner
- I could not list the folder contents during an earlier attempt; please replace the "Typical files" list with the real filenames or let me fetch them and regenerate the README automatically.
- If you prefer that I include a short description for each actual notebook file, tell me and I'll update this README to match the repository contents.
