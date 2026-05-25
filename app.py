import logging
import os
from pathlib import Path
from typing import Any

import joblib
import numpy as np
from flask import Flask, jsonify, render_template, request, send_from_directory
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
CORS(
    app,
    resources={
        r"/predict": {"origins": os.getenv("CORS_ALLOWED_ORIGINS", "*")},
        r"/health": {"origins": os.getenv("CORS_ALLOWED_ORIGINS", "*")},
    },
)

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
    except Exception:
        logger.exception("Failed to load model artifacts")
        model = None
        scaler = None
        return False

    expected_count = len(EXPECTED_FEATURES)
    scaler_features = getattr(scaler, "n_features_in_", None)
    model_features = getattr(model, "n_features_in_", None)

    if scaler_features not in (None, expected_count):
        logger.error(
            "Scaler feature mismatch: expected %s but artifact requires %s",
            expected_count,
            scaler_features,
        )
        return False

    if model_features not in (None, expected_count):
        logger.error(
            "Model feature mismatch: expected %s but artifact requires %s",
            expected_count,
            model_features,
        )
        return False

    logger.info("Model artifacts loaded from %s", BASE_DIR)
    return True


def get_risk_level(probability: float) -> str:
    if probability < 0.2:
        return "Low"
    if probability < 0.4:
        return "Moderate"
    if probability < 0.6:
        return "High"
    return "Very High"


def validate_payload(data: Any) -> tuple[dict[str, float] | None, dict[str, Any] | None]:
    if not isinstance(data, dict):
        return None, {"error": "JSON body must be an object."}

    missing_features = [feature for feature in EXPECTED_FEATURES if feature not in data]
    extra_features = sorted(feature for feature in data if feature not in EXPECTED_FEATURES)
    converted: dict[str, float] = {}
    invalid_features: dict[str, str] = {}

    for feature in EXPECTED_FEATURES:
        if feature not in data:
            continue

        try:
            numeric_value = float(data[feature])
        except (TypeError, ValueError):
            invalid_features[feature] = f"Expected a numeric value, received {data[feature]!r}"
            continue

        if not np.isfinite(numeric_value):
            invalid_features[feature] = "Value must be finite."
            continue

        converted[feature] = numeric_value

    derived_errors: dict[str, str] = {}

    if "Systolic_BP" in converted and "Diastolic_BP" in converted:
        if converted["Systolic_BP"] <= converted["Diastolic_BP"]:
            derived_errors["Diastolic_BP"] = "Diastolic_BP must be lower than Systolic_BP."

        expected_pulse_pressure = converted["Systolic_BP"] - converted["Diastolic_BP"]
        actual_pulse_pressure = converted.get("Pulse_Pressure")
        if actual_pulse_pressure is not None and not np.isclose(
            actual_pulse_pressure,
            expected_pulse_pressure,
            atol=1e-6,
        ):
            derived_errors["Pulse_Pressure"] = (
                "Pulse_Pressure must equal Systolic_BP - Diastolic_BP."
            )

    if {
        "Sedentary Hours Per Day",
        "Exercise Hours Per Week",
        "Physical Activity Days Per Week",
        "Sedentary_Ratio",
    }.issubset(converted):
        sedentary = converted["Sedentary Hours Per Day"]
        exercise = converted["Exercise Hours Per Week"]
        activity_days = converted["Physical Activity Days Per Week"]
        total_hours = (sedentary * 7) + exercise + (activity_days * 2)
        expected_ratio = (sedentary * 7) / total_hours if total_hours > 0 else 0.0
        if not np.isclose(converted["Sedentary_Ratio"], expected_ratio, atol=1e-6):
            derived_errors["Sedentary_Ratio"] = (
                "Sedentary_Ratio does not match the submitted activity inputs."
            )

    if all(feature in converted for feature in CONTINENT_FLAGS):
        flag_sum = sum(int(converted[feature]) for feature in CONTINENT_FLAGS)
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

    ordered = {feature: converted[feature] for feature in EXPECTED_FEATURES}
    return ordered, None


def predict_probability(features: dict[str, float]) -> float:
    if model is None or scaler is None:
        raise RuntimeError("Model is not loaded.")

    feature_vector = np.array(
        [features[feature] for feature in EXPECTED_FEATURES],
        dtype=float,
    ).reshape(1, -1)
    scaled_features = scaler.transform(feature_vector)
    probability = float(model.predict_proba(scaled_features)[0][1])
    return max(0.0, min(1.0, probability))


@app.route("/")
def home():
    return render_template("heart_disease_prediction.html")


@app.route("/images/<path:filename>")
def images(filename: str):
    return send_from_directory(BASE_DIR / "images", filename)


@app.route("/health")
def health_check():
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
    except Exception:
        logger.exception("Prediction failed")
        return jsonify({"error": "Prediction failed."}), 500

    return jsonify(
        {
            "status": "success",
            "prediction": probability,
            "risk_level": get_risk_level(probability),
            "features_used": len(features),
        }
    )


models_loaded = load_models()


if __name__ == "__main__":
    if not models_loaded:
        raise SystemExit(
            "Model artifacts could not be loaded. Ensure the .pkl files are present."
        )

    debug_mode = os.getenv("FLASK_DEBUG", "").lower() in {"1", "true", "yes"}
    app.run(
        host=os.getenv("FLASK_HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", "5001")),
        debug=debug_mode,
        threaded=True,
    )
