"""
=============================================================
  SKIN DISEASE CLASSIFIER — IMPROVED TRAINING SCRIPT
  Dataset: 20 Skin Diseases (Kaggle - haroonalam16)
  Model:   MobileNetV2 Transfer Learning (ImageNet weights)
  Classes: Acne, Benign_tumors, Infestations_Bites,
           Moles, Sun_Sunlight_Damage, Unknown_Normal
=============================================================
  HOW TO USE:
    1. Set TRAIN_DIR and TEST_DIR below
    2. Run:  python train_model.py
    3. Model saved as:  skin_model.keras
=============================================================
"""

import os
import numpy as np
import matplotlib.pyplot as plt
from sklearn.utils.class_weight import compute_class_weight

import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.models import Model
from tensorflow.keras.layers import (
    GlobalAveragePooling2D, Dense, Dropout, BatchNormalization
)
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.callbacks import (
    EarlyStopping, ReduceLROnPlateau, ModelCheckpoint
)
from tensorflow.keras.optimizers import Adam

# ─────────────────────────────────────────────
# SETTINGS  (edit these paths)
# ─────────────────────────────────────────────
TRAIN_DIR  = r"F:\skin_app\train"
TEST_DIR   = r"F:\skin_app\test"
MODEL_OUT  = "skin_model.keras"   # saved model path

IMG_SIZE   = 224
BATCH_SIZE = 32
EPOCHS     = 20        # early stopping will cut this short if needed

# ─────────────────────────────────────────────
# DATA GENERATORS
# ─────────────────────────────────────────────
train_gen = ImageDataGenerator(
    rescale=1.0 / 255,
    rotation_range=30,
    zoom_range=0.25,
    width_shift_range=0.15,
    height_shift_range=0.15,
    brightness_range=[0.6, 1.4],
    horizontal_flip=True,
    vertical_flip=False,
    shear_range=0.1,
    fill_mode="nearest",
    validation_split=0.15          # 15 % of train used for validation
)

val_gen = ImageDataGenerator(
    rescale=1.0 / 255,
    validation_split=0.15
)

test_gen = ImageDataGenerator(rescale=1.0 / 255)

train_data = train_gen.flow_from_directory(
    TRAIN_DIR,
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode="categorical",
    subset="training",
    shuffle=True
)

val_data = val_gen.flow_from_directory(
    TRAIN_DIR,
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode="categorical",
    subset="validation",
    shuffle=False
)

test_data = test_gen.flow_from_directory(
    TEST_DIR,
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode="categorical",
    shuffle=False
)

num_classes = train_data.num_classes
print(f"\n✅ Classes ({num_classes}):", train_data.class_indices)

# ─────────────────────────────────────────────
# CLASS WEIGHTS  (handle imbalanced dataset)
# ─────────────────────────────────────────────
labels = train_data.classes
class_weights = compute_class_weight(
    class_weight="balanced",
    classes=np.unique(labels),
    y=labels
)
class_weight_dict = dict(enumerate(class_weights))
print("\n📊 Class weights:", class_weight_dict)

# ─────────────────────────────────────────────
# MODEL  — MobileNetV2 + custom head
# ─────────────────────────────────────────────
base = MobileNetV2(
    input_shape=(IMG_SIZE, IMG_SIZE, 3),
    include_top=False,
    weights="imagenet"
)

# Phase 1: freeze base, train only the head
base.trainable = False

x = base.output
x = GlobalAveragePooling2D()(x)
x = BatchNormalization()(x)
x = Dense(512, activation="relu")(x)
x = Dropout(0.4)(x)
x = Dense(256, activation="relu")(x)
x = Dropout(0.3)(x)
output = Dense(num_classes, activation="softmax")(x)

model = Model(inputs=base.input, outputs=output)

model.compile(
    optimizer=Adam(learning_rate=1e-3),
    loss="categorical_crossentropy",
    metrics=["accuracy"]
)

print("\n🧠 Model summary:")
model.summary()

# ─────────────────────────────────────────────
# CALLBACKS
# ─────────────────────────────────────────────
callbacks = [
    EarlyStopping(
        monitor="val_accuracy",
        patience=4,
        restore_best_weights=True,
        verbose=1
    ),
    ReduceLROnPlateau(
        monitor="val_loss",
        factor=0.3,
        patience=2,
        min_lr=1e-7,
        verbose=1
    ),
    ModelCheckpoint(
        "best_head.keras",
        monitor="val_accuracy",
        save_best_only=True,
        verbose=1
    )
]

# ─────────────────────────────────────────────
# PHASE 1 TRAINING  (head only)
# ─────────────────────────────────────────────
print("\n🚀 Phase 1: Training classification head …")
history1 = model.fit(
    train_data,
    epochs=10,
    validation_data=val_data,
    class_weight=class_weight_dict,
    callbacks=callbacks
)

# ─────────────────────────────────────────────
# PHASE 2 FINE-TUNING  (unfreeze top 50 layers)
# ─────────────────────────────────────────────
print("\n🔓 Phase 2: Fine-tuning top layers …")
base.trainable = True
for layer in base.layers[:-50]:
    layer.trainable = False

model.compile(
    optimizer=Adam(learning_rate=1e-5),   # much lower LR
    loss="categorical_crossentropy",
    metrics=["accuracy"]
)

callbacks[2] = ModelCheckpoint(
    MODEL_OUT,
    monitor="val_accuracy",
    save_best_only=True,
    verbose=1
)

history2 = model.fit(
    train_data,
    epochs=EPOCHS,
    validation_data=val_data,
    class_weight=class_weight_dict,
    callbacks=callbacks
)

# ─────────────────────────────────────────────
# EVALUATE ON TEST SET
# ─────────────────────────────────────────────
print("\n📈 Evaluating on test set …")
loss, acc = model.evaluate(test_data, verbose=1)
print(f"\n🎯 Test accuracy: {acc * 100:.2f}%")

# ─────────────────────────────────────────────
# SAVE MODEL + CLASS INDEX MAP
# ─────────────────────────────────────────────
model.save(MODEL_OUT)
print(f"\n💾 Model saved → {MODEL_OUT}")

import json
class_index = {str(v): k for k, v in train_data.class_indices.items()}
with open("class_indices.json", "w") as f:
    json.dump(class_index, f, indent=2)
print("💾 Class indices saved → class_indices.json")

# ─────────────────────────────────────────────
# PLOT TRAINING CURVES
# ─────────────────────────────────────────────
acc1  = history1.history["accuracy"]      + history2.history["accuracy"]
vacc1 = history1.history["val_accuracy"]  + history2.history["val_accuracy"]
loss1 = history1.history["loss"]          + history2.history["loss"]
vloss1= history1.history["val_loss"]      + history2.history["val_loss"]

fig, axes = plt.subplots(1, 2, figsize=(14, 5))
axes[0].plot(acc1,  label="Train Acc")
axes[0].plot(vacc1, label="Val Acc")
axes[0].set_title("Accuracy")
axes[0].legend()

axes[1].plot(loss1,  label="Train Loss")
axes[1].plot(vloss1, label="Val Loss")
axes[1].set_title("Loss")
axes[1].legend()

plt.tight_layout()
plt.savefig("training_curves.png", dpi=120)
plt.show()
print("📊 Training curves saved → training_curves.png")
