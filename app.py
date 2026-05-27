import logging
import os
from pathlib import Path
from typing import Any

import joblib
import numpy as np
from flask import Flask, jsonify, request
from flask_cors import CORS


BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "logistic_regression_model.pkl"
SCALER_PATH = BASE_DIR / "standard_scaler.pkl"

EXPECTED_FEATURES = [
    "Age",
    "Sex",
    "Cholesterol",
    "Heart Rate",
    "Diabetes",
    "Family History",
    "Smoking",
    "Obesity",
    "Alcohol Consumption",
    "Exercise Hours Per Week",
    "Diet",
    "Previous Heart Problems",
    "Medication Use",
    "Stress Level",
    "Sedentary Hours Per Day",
    "Income",
    "BMI",
    "Triglycerides",
    "Physical Activity Days Per Week",
    "Sleep Hours Per Day",
    "Systolic_BP",
    "Diastolic_BP",
    "Pulse_Pressure",
    "Cont_Australia",
    "Cont_Europe",
    "Cont_North America",
    "Cont_South America",
    "Hypertension",
    "Metabolic_Risk",
    "Sedentary_Ratio",
]

CONTINENT_FLAGS = [
    "Cont_Australia",
    "Cont_Europe",
    "Cont_North America",
    "Cont_South America",
]

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO").upper())
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

model = None
scaler = None


def load_models() -> bool:
    global model, scaler

    if not MODEL_PATH.exists():
        logger.error("Model file not found: %s", MODEL_PATH)
        return False

    if not SCALER_PATH.exists():
        logger.error("Scaler file not found: %s", SCALER_PATH)
        return False

    try:
        model = joblib.load(MODEL_PATH)
        scaler = joblib.load(SCALER_PATH)
        logger.info("Model artifacts loaded from %s", BASE_DIR)
        return True
    except Exception:
        logger.exception("Failed to load model artifacts")
        model = None
        scaler = None
        return False


def get_risk_level(probability: float) -> str:
    if probability < 0.2:
        return "Low"
    if probability < 0.4:
        return "Moderate"
    if probability < 0.6:
        return "High"
    return "Very High"


def validate_payload(data: Any):
    if not isinstance(data, dict):
        return None, {"error": "JSON body must be an object."}

    missing_features = [feature for feature in EXPECTED_FEATURES if feature not in data]
    extra_features = sorted(feature for feature in data if feature not in EXPECTED_FEATURES)

    converted = {}
    invalid_features = {}

    for feature in EXPECTED_FEATURES:
        if feature not in data:
            continue

        try:
            value = float(data[feature])
        except (TypeError, ValueError):
            invalid_features[feature] = f"Expected numeric value, received {data[feature]!r}"
            continue

        if not np.isfinite(value):
            invalid_features[feature] = "Value must be finite."
            continue

        converted[feature] = value

    derived_errors = {}

    if "Systolic_BP" in converted and "Diastolic_BP" in converted:
        if converted["Systolic_BP"] <= converted["Diastolic_BP"]:
            derived_errors["Diastolic_BP"] = "Diastolic BP must be lower than Systolic BP."

        expected_pulse = converted["Systolic_BP"] - converted["Diastolic_BP"]
        actual_pulse = converted.get("Pulse_Pressure")

        if actual_pulse is not None and not np.isclose(actual_pulse, expected_pulse, atol=1e-6):
            derived_errors["Pulse_Pressure"] = "Pulse Pressure must equal Systolic BP - Diastolic BP."

    activity_fields = {
        "Sedentary Hours Per Day",
        "Exercise Hours Per Week",
        "Physical Activity Days Per Week",
        "Sedentary_Ratio",
    }

    if activity_fields.issubset(converted):
        sedentary = converted["Sedentary Hours Per Day"]
        exercise = converted["Exercise Hours Per Week"]
        activity_days = converted["Physical Activity Days Per Week"]

        total_hours = sedentary * 7 + exercise + activity_days * 2
        expected_ratio = (sedentary * 7) / total_hours if total_hours > 0 else 0.0

        if not np.isclose(converted["Sedentary_Ratio"], expected_ratio, atol=1e-6):
            derived_errors["Sedentary_Ratio"] = "Sedentary Ratio does not match activity inputs."

    if all(flag in converted for flag in CONTINENT_FLAGS):
        flag_sum = sum(int(converted[flag]) for flag in CONTINENT_FLAGS)
        if flag_sum > 1:
            derived_errors["continent"] = "Only one continent flag can be set to 1."

    if missing_features or invalid_features or derived_errors:
        return None, {
            "error": "Invalid prediction payload.",
            "missing_features": missing_features,
            "invalid_features": invalid_features,
            "derived_feature_errors": derived_errors,
            "extra_features": extra_features,
            "expected_features": EXPECTED_FEATURES,
        }

    ordered_features = {feature: converted[feature] for feature in EXPECTED_FEATURES}
    return ordered_features, None


def predict_probability(features: dict[str, float]) -> float:
    if model is None or scaler is None:
        raise RuntimeError("Model is not loaded.")

    feature_vector = np.array(
        [features[feature] for feature in EXPECTED_FEATURES],
        dtype=float,
    ).reshape(1, -1)

    scaled_features = scaler.transform(feature_vector)

    if hasattr(model, "predict_proba"):
        probability = float(model.predict_proba(scaled_features)[0][1])
    else:
        prediction = float(model.predict(scaled_features)[0])
        probability = prediction

    return max(0.0, min(1.0, probability))


@app.route("/")
def home():
    return jsonify(
        {
            "message": "Heart Disease Prediction Flask API is running.",
            "predict_url": "/predict",
            "health_url": "/health",
        }
    )


@app.route("/health")
def health():
    models_ready = model is not None and scaler is not None

    return jsonify(
        {
            "status": "ok" if models_ready else "degraded",
            "model_loaded": models_ready,
            "model_features": len(EXPECTED_FEATURES),
        }
    ), 200 if models_ready else 503


@app.route("/predict", methods=["POST"])
def predict():
    if model is None or scaler is None:
        return jsonify({"error": "Model is not loaded on the server."}), 503

    payload = request.get_json(silent=True)
    features, error = validate_payload(payload)

    if error:
        return jsonify(error), 400

    try:
        probability = predict_probability(features)
        risk_level = get_risk_level(probability)

        return jsonify(
            {
                "status": "success",
                "prediction": probability,
                "risk_percentage": round(probability * 100, 2),
                "risk_level": risk_level,
                "features_used": len(features),
            }
        )

    except Exception:
        logger.exception("Prediction failed")
        return jsonify({"error": "Prediction failed."}), 500


models_loaded = load_models()


if __name__ == "__main__":
    if not models_loaded:
        raise SystemExit(
            "Model artifacts could not be loaded. Make sure .pkl files are in the same folder as app.py."
        )

    app.run(
        host="0.0.0.0",
        port=5001,
        debug=True,
        threaded=True,
    )