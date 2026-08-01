"""
=============================================================
  SKIN DISEASE CLASSIFIER — FLASK WEB APP
  Run:  python app.py
  Open: http://localhost:5000
=============================================================
"""

import os
import json
import uuid
import numpy as np
import cv2
from flask import Flask, render_template, request, jsonify
import tensorflow as tf

# ─────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────
MODEL_PATH   = "skin_model.keras"
CLASSES_PATH = "class_indices.json"
IMG_SIZE     = 224
UPLOAD_FOLDER = "static/uploads"
CONFIDENCE_THRESHOLD = 0.40   # below this → "Uncertain"

app = Flask(__name__)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ─────────────────────────────────────────────
# DISEASE INFO DATABASE
# ─────────────────────────────────────────────
DISEASE_INFO = {
    "Acne": {
        "description": "A common skin condition where hair follicles become plugged with oil and dead skin cells, causing pimples, blackheads, or whiteheads.",
        "symptoms": ["Whiteheads", "Blackheads", "Pimples", "Cysts", "Oily skin"],
        "advice": "Keep skin clean, avoid touching your face, and consider seeing a dermatologist for persistent acne.",
        "urgency": "low",
        "icon": "🔴"
    },
    "Benign_tumors": {
        "description": "Non-cancerous growths on the skin that do not invade nearby tissue or spread to other parts of the body.",
        "symptoms": ["Skin lumps", "Bumps under skin", "Slow-growing masses", "Smooth texture"],
        "advice": "While benign, any new or changing growth should be evaluated by a dermatologist to rule out malignancy.",
        "urgency": "medium",
        "icon": "🟡"
    },
    "Infestations_Bites": {
        "description": "Skin reactions caused by parasites, insects, or other organisms that bite or burrow into skin.",
        "symptoms": ["Intense itching", "Rash", "Small bumps", "Redness", "Visible bite marks"],
        "advice": "Treat with appropriate anti-parasitic medication. Wash clothing and bedding. Consult a doctor if spreading.",
        "urgency": "medium",
        "icon": "🟠"
    },
    "Moles": {
        "description": "Pigmented spots on the skin formed by clusters of melanocytes. Most are harmless but some can develop into melanoma.",
        "symptoms": ["Dark spots", "Raised or flat mark", "Brown or black color", "Round or oval shape"],
        "advice": "Monitor using the ABCDE rule (Asymmetry, Border, Color, Diameter, Evolution). See a doctor if changing.",
        "urgency": "medium",
        "icon": "🟤"
    },
    "Sun_Sunlight_Damage": {
        "description": "Skin damage caused by ultraviolet (UV) radiation from the sun, including sunburn, premature aging, and increased cancer risk.",
        "symptoms": ["Redness", "Peeling skin", "Dark spots", "Wrinkles", "Rough texture"],
        "advice": "Apply SPF 30+ sunscreen daily, wear protective clothing, and avoid peak sun hours (10am–4pm).",
        "urgency": "low",
        "icon": "☀️"
    },
    "Unknown_Normal": {
        "description": "The skin appears normal or the condition does not match known disease patterns in the database.",
        "symptoms": ["No clear disease markers detected"],
        "advice": "If you have concerns about your skin, consult a dermatologist for a professional assessment.",
        "urgency": "none",
        "icon": "✅"
    }
}

# ─────────────────────────────────────────────
# LOAD MODEL
# ─────────────────────────────────────────────
print("⏳ Loading model …")
model = None
class_indices = {}

try:
    model = tf.keras.models.load_model(MODEL_PATH)
    with open(CLASSES_PATH) as f:
        class_indices = json.load(f)   # {"0": "Acne", "1": "Benign_tumors", ...}
    print(f"✅ Model loaded. Classes: {class_indices}")
except Exception as e:
    print(f"⚠️  Could not load model: {e}")
    print("   Run train_model.py first to generate skin_model.keras")
    # Demo mode — predictions will be simulated
    class_indices = {
        "0": "Acne", "1": "Benign_tumors", "2": "Infestations_Bites",
        "3": "Moles",  "4": "Sun_Sunlight_Damage", "5": "Unknown_Normal"
    }


# ─────────────────────────────────────────────
# PREPROCESSING + PREDICTION
# ─────────────────────────────────────────────
def preprocess(img_path: str) -> np.ndarray:
    """Load image, apply CLAHE for better local contrast, normalise."""
    img = cv2.imread(img_path)
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    # CLAHE on L-channel for better contrast in dark/light images
    lab = cv2.cvtColor(img, cv2.COLOR_RGB2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l = clahe.apply(l)
    lab = cv2.merge([l, a, b])
    img = cv2.cvtColor(lab, cv2.COLOR_LAB2RGB)

    img = cv2.resize(img, (IMG_SIZE, IMG_SIZE))
    img = img.astype("float32") / 255.0
    return np.expand_dims(img, axis=0)


def predict(img_path: str) -> dict:
    """Return top-3 predictions with confidence and disease info."""
    if model is None:
        # Demo mode
        import random
        names = list(class_indices.values())
        probs = np.random.dirichlet(np.ones(len(names)) * 0.5)
        sorted_idx = np.argsort(probs)[::-1]
        top3 = [
            {
                "rank": i + 1,
                "disease": names[sorted_idx[i]],
                "confidence": float(probs[sorted_idx[i]]),
                "info": DISEASE_INFO.get(names[sorted_idx[i]], {})
            }
            for i in range(min(3, len(names)))
        ]
        top3[0]["is_top"] = True
        return {"predictions": top3, "demo_mode": True}

    img_array = preprocess(img_path)
    preds = model.predict(img_array, verbose=0)[0]
    sorted_idx = np.argsort(preds)[::-1]

    top3 = []
    for rank, idx in enumerate(sorted_idx[:3]):
        name = class_indices.get(str(idx), f"Class_{idx}")
        conf = float(preds[idx])
        top3.append({
            "rank": rank + 1,
            "disease": name,
            "confidence": conf,
            "confidence_pct": round(conf * 100, 1),
            "info": DISEASE_INFO.get(name, {})
        })

    # Mark as uncertain if top prediction is below threshold
    top3[0]["uncertain"] = top3[0]["confidence"] < CONFIDENCE_THRESHOLD
    top3[0]["is_top"] = True

    return {"predictions": top3, "demo_mode": False}


# ─────────────────────────────────────────────
# ROUTES
# ─────────────────────────────────────────────
@app.route("/")
def index():
    return render_template("index.html")


@app.route("/predict", methods=["POST"])
def predict_route():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "Empty filename"}), 400

    # Save with unique name
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in (".jpg", ".jpeg", ".png", ".bmp", ".webp"):
        return jsonify({"error": "Unsupported file type"}), 400

    fname = f"{uuid.uuid4().hex}{ext}"
    save_path = os.path.join(app.config["UPLOAD_FOLDER"], fname)
    file.save(save_path)

    try:
        result = predict(save_path)
        result["image_url"] = f"/static/uploads/{fname}"
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/health")
def health():
    return jsonify({"status": "ok", "model_loaded": model is not None})


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
