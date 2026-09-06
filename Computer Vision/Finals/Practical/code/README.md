# DermaScan — AI Skin Disease Classifier

## Project Structure
```
skin_app/
├── train_model.py        ← Improved training script (MobileNetV2)
├── app.py                ← Flask web app
├── requirements.txt
├── templates/
│   └── index.html        ← Beautiful frontend
├── static/
│   └── uploads/          ← Temp upload storage
├── skin_model.keras      ← Saved model (after training)
└── class_indices.json    ← Class name map (after training)
```

## Setup

### 1. Install dependencies
```bash
pip install -r requirements.txt
```

### 2. Train the model
Edit the `TRAIN_DIR` and `TEST_DIR` paths in `train_model.py` to point at your dataset, then run:
```bash
python train_model.py
```
This will generate `skin_model.keras` and `class_indices.json`.

### 3. Run the web app
```bash
python app.py
```
Open your browser at **http://localhost:5000**

---

## What's Improved

### Model Architecture
| Old (Custom CNN) | New (MobileNetV2) |
|---|---|
| 3 Conv layers from scratch | ImageNet pre-trained weights |
| 224×224 input | 224×224 input |
| ~66% accuracy @ 5 epochs | Expected 85%+ after fine-tuning |
| No class weighting | Balanced class weights |

### Training
- **Two-phase training**: first train only the classification head (10 epochs), then fine-tune top 50 MobileNetV2 layers (20 epochs)
- **Class weights**: automatically computed to handle the imbalanced dataset (Acne: 2425 images vs Sun damage: 310 images)
- **CLAHE preprocessing**: improves contrast for dark or uneven lighting in skin images
- **EarlyStopping + ReduceLROnPlateau**: prevents overfitting, adapts learning rate

### Frontend
- Drag-and-drop image upload
- Top-3 disease predictions with confidence bars
- Disease descriptions, symptoms, and advice per condition
- Urgency indicator (normal / see a doctor)
- Low-confidence warning (threshold: 40%)
- Works on mobile

### Prediction
- Top-3 ranked results (not just top-1)
- CLAHE contrast enhancement before inference
- Confidence threshold gate — returns "Uncertain" below 40%
