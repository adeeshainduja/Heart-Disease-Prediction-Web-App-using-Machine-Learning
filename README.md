# ❤️ Heart Disease Prediction Web App using Machine Learning

<div align="center">

![Heart Disease Prediction Web App](images/AI%20Heart%20Attack%20Prediction%20System1.png)

**A Flask-based machine learning web application that predicts heart disease risk using a Logistic Regression model.**

![Python](https://img.shields.io/badge/Python-3.x-blue?style=for-the-badge&logo=python)
![Flask](https://img.shields.io/badge/Flask-Web%20App-black?style=for-the-badge&logo=flask)
![Scikit-learn](https://img.shields.io/badge/scikit--learn-ML-orange?style=for-the-badge&logo=scikitlearn)
![Bootstrap](https://img.shields.io/badge/Bootstrap-UI-purple?style=for-the-badge&logo=bootstrap)

</div>

---

## 📌 Overview

The **Heart Disease Prediction Web App** is a machine learning project that predicts the risk of heart disease using patient health and lifestyle data.

The system uses a trained **Logistic Regression** model with a **Standard Scaler** for preprocessing. Users can enter medical and lifestyle details through a web form, and the application displays a risk prediction with a readable risk level.

This project is created for **educational and portfolio purposes**.

---

## ✨ Features

- Modern web-based user interface
- Patient health data input form
- Heart disease risk prediction using Machine Learning
- Logistic Regression model integration
- Standard Scaler preprocessing
- Risk level output such as Low, Moderate, High, or Very High
- Flask backend with prediction API
- Basic validation for user input
- Health check endpoint
- Responsive UI with image assets

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, JavaScript, Bootstrap |
| Backend | Python, Flask |
| Machine Learning | scikit-learn, NumPy, joblib |
| Model | Logistic Regression |
| Deployment Support | Waitress / Gunicorn |
| Assets | PNG images and icons |

---

## 🧠 Machine Learning Model

The application uses:

- `logistic_regression_model.pkl` — trained Logistic Regression model
- `standard_scaler.pkl` — scaler used to normalize input features

The model receives numerical health-related features and returns a prediction probability. The backend converts this probability into a user-friendly risk level.

---

## 🗂️ Project Structure

```text
Heart-Disease-Prediction-Web-App-using-Machine-Learning/
│
├── app.py
├── requirements.txt
├── logistic_regression_model.pkl
├── standard_scaler.pkl
├── .gitignore
│
├── templates/
│   └── heart_disease_prediction.html
│
└── images/
    ├── Primary logo.png
    ├── Wordmark logo.png
    ├── Favicon app icon.png
    └── other image assets
```

---

## 🚀 How to Run the Project

### 1. Clone the repository

```bash
git clone https://github.com/adeeshainduja/Heart-Disease-Prediction-Web-App-using-Machine-Learning.git
```

```bash
cd Heart-Disease-Prediction-Web-App-using-Machine-Learning
```

### 2. Create a virtual environment

```bash
python -m venv .venv
```

### 3. Activate the virtual environment

For Windows:

```bash
.venv\Scripts\activate
```

For macOS / Linux:

```bash
source .venv/bin/activate
```

### 4. Install required packages

```bash
pip install -r requirements.txt
```

### 5. Run the application

```bash
python app.py
```

### 6. Open in browser

```text
http://127.0.0.1:5001
```

---

## 🔗 API Endpoints

### `GET /`

Loads the main heart disease prediction web page.

### `GET /health`

Checks whether the application and model are ready.

Example response:

```json
{
  "status": "ok",
  "model_loaded": true,
  "model_features": 30
}
```

### `POST /predict`

Accepts patient input data and returns a heart disease risk prediction.

Example response:

```json
{
  "status": "success",
  "prediction": 0.42,
  "risk_level": "High",
  "features_used": 30
}
```

---

## 📊 Input Features

The model uses numeric health and lifestyle features such as:

- Age
- Sex
- Income
- Cholesterol
- Heart Rate
- BMI
- Triglycerides
- Systolic Blood Pressure
- Diastolic Blood Pressure
- Pulse Pressure
- Smoking status
- Alcohol use
- Exercise hours
- Sleep hours
- Sedentary hours
- Diabetes
- Hypertension
- Metabolic risk
- Continent-related encoded values

---

## 📸 Screenshots

![Application Screenshot](images/hart.png)

![System Architecture](images/hartarchi.png)

![Mermaid Diagram](images/hartmermaid.png)

---

## ⚠️ Disclaimer

This application is developed for **educational and demonstration purposes only**.

It is **not a medical diagnosis system** and should not be used as a replacement for professional medical advice, clinical testing, or emergency care.

---

## 👨‍💻 Author

**Adeesha Induja**

GitHub: [adeeshainduja](https://github.com/adeeshainduja)

---

<div align="center">

**Built with Python, Flask, Machine Learning, and a clean web interface.**

</div>
