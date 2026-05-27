"use client";

import { useMemo, useState } from "react";

type FormDataType = {
  Age: string;
  Sex: string;
  Cholesterol: string;
  "Heart Rate": string;
  Diabetes: string;
  "Family History": string;
  Smoking: string;
  Obesity: string;
  "Alcohol Consumption": string;
  "Exercise Hours Per Week": string;
  "Diet Quality": string;
  "Previous Heart Problems": string;
  "Medication Use": string;
  "Stress Level": string;
  "Sedentary Hours Per Day": string;
  Income: string;
  BMI: string;
  Triglycerides: string;
  "Physical Activity Days Per Week": string;
  "Sleep Hours Per Day": string;
  "Systolic BP": string;
  "Diastolic BP": string;
  Continent: string;
};

type ResultType = {
  status?: string;
  prediction?: number;
  risk_percentage?: number;
  risk_level?: string;
  features_used?: number;
  error?: string;
};

const initialFormData: FormDataType = {
  Age: "",
  Sex: "",
  Cholesterol: "",
  "Heart Rate": "",
  Diabetes: "",
  "Family History": "",
  Smoking: "",
  Obesity: "",
  "Alcohol Consumption": "",
  "Exercise Hours Per Week": "",
  "Diet Quality": "",
  "Previous Heart Problems": "",
  "Medication Use": "",
  "Stress Level": "",
  "Sedentary Hours Per Day": "",
  Income: "",
  BMI: "",
  Triglycerides: "",
  "Physical Activity Days Per Week": "",
  "Sleep Hours Per Day": "",
  "Systolic BP": "",
  "Diastolic BP": "",
  Continent: "",
};

export default function Home() {
  const [formData, setFormData] = useState<FormDataType>(initialFormData);
  const [result, setResult] = useState<ResultType | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const pulsePressure = useMemo(() => {
    const systolic = Number(formData["Systolic BP"]);
    const diastolic = Number(formData["Diastolic BP"]);

    if (!systolic || !diastolic) return 0;
    return systolic - diastolic;
  }, [formData]);

  const sedentaryRatio = useMemo(() => {
    const sedentary = Number(formData["Sedentary Hours Per Day"]);
    const exercise = Number(formData["Exercise Hours Per Week"]);
    const activityDays = Number(formData["Physical Activity Days Per Week"]);

    const totalHours = sedentary * 7 + exercise + activityDays * 2;

    if (totalHours <= 0) return 0;
    return (sedentary * 7) / totalHours;
  }, [formData]);

  const buildPredictionPayload = () => {
    const systolic = Number(formData["Systolic BP"]);
    const diastolic = Number(formData["Diastolic BP"]);
    const bmi = Number(formData.BMI);
    const triglycerides = Number(formData.Triglycerides);
    const continent = formData.Continent;

    const payload: Record<string, number> = {
      Age: Number(formData.Age),
      Sex: Number(formData.Sex),
      Cholesterol: Number(formData.Cholesterol),
      "Heart Rate": Number(formData["Heart Rate"]),
      Diabetes: Number(formData.Diabetes),
      "Family History": Number(formData["Family History"]),
      Smoking: Number(formData.Smoking),
      Obesity: Number(formData.Obesity),
      "Alcohol Consumption": Number(formData["Alcohol Consumption"]),
      "Exercise Hours Per Week": Number(formData["Exercise Hours Per Week"]),
      Diet: Number(formData["Diet Quality"]),
      "Previous Heart Problems": Number(formData["Previous Heart Problems"]),
      "Medication Use": Number(formData["Medication Use"]),
      "Stress Level": Number(formData["Stress Level"]),
      "Sedentary Hours Per Day": Number(formData["Sedentary Hours Per Day"]),
      Income: Number(formData.Income),
      BMI: bmi,
      Triglycerides: triglycerides,
      "Physical Activity Days Per Week": Number(
        formData["Physical Activity Days Per Week"]
      ),
      "Sleep Hours Per Day": Number(formData["Sleep Hours Per Day"]),
      Systolic_BP: systolic,
      Diastolic_BP: diastolic,
      Pulse_Pressure: systolic - diastolic,

      Cont_Australia: continent === "Australia" ? 1 : 0,
      Cont_Europe: continent === "Europe" ? 1 : 0,
      "Cont_North America": continent === "North America" ? 1 : 0,
      "Cont_South America": continent === "South America" ? 1 : 0,

      Hypertension: systolic >= 140 || diastolic >= 90 ? 1 : 0,
      Metabolic_Risk: bmi >= 30 || triglycerides >= 150 ? 1 : 0,
      Sedentary_Ratio: sedentaryRatio,
    };

    return payload;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (pulsePressure <= 0) {
      setResult({
        error: "Diastolic BP must be lower than Systolic BP.",
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const payload = buildPredictionPayload();

      const response = await fetch("http://127.0.0.1:5001/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setResult({
          error:
            data.error ||
            "Invalid prediction payload. Check all required values.",
        });
        return;
      }

      setResult(data);
    } catch {
      setResult({
        error: "Cannot connect to Flask backend. Please run python app.py.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData(initialFormData);
    setResult(null);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <section className="mb-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-[32px] bg-white p-8 shadow-2xl">
            <h1 className="mb-4 text-4xl font-extrabold text-gray-950 md:text-6xl">
              Heart Disease Prediction System
            </h1>

            <p className="text-lg leading-8 text-gray-600">
              Enter patient health details and get a prediction using your Flask
              machine learning backend.
            </p>
          </div>

          <div className="rounded-[32px] bg-gradient-to-br from-red-500 to-teal-500 p-8 text-white shadow-2xl">
            <div className="mb-4 text-7xl">❤️</div>

            <h2 className="mb-3 text-3xl font-extrabold">
              Smart Health Risk Screening
            </h2>

            <p className="leading-7 text-white/90">
              This Next.js frontend sends the data to your Python Flask ML model
              and displays the predicted risk level.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-white/15 p-4">
                <p className="text-2xl font-extrabold">
                  {pulsePressure > 0 ? pulsePressure : "--"}
                </p>
                <p className="text-sm text-white/80">Pulse Pressure</p>
              </div>

              <div className="rounded-2xl bg-white/15 p-4">
                <p className="text-2xl font-extrabold">
                  {sedentaryRatio ? sedentaryRatio.toFixed(2) : "--"}
                </p>
                <p className="text-sm text-white/80">Sedentary Ratio</p>
              </div>
            </div>
          </div>
        </section>

        <form
          onSubmit={handleSubmit}
          className="rounded-[32px] bg-white p-6 shadow-2xl md:p-8"
        >
          <Section title="Patient Profile">
            <Input
              label="Age"
              name="Age"
              value={formData.Age}
              onChange={handleChange}
              min="18"
              max="120"
            />

            <Select
              label="Sex"
              name="Sex"
              value={formData.Sex}
              onChange={handleChange}
              options={[
                ["1", "Male"],
                ["0", "Female"],
              ]}
            />

            <Input
              label="Annual Income"
              name="Income"
              value={formData.Income}
              onChange={handleChange}
              min="0"
            />
          </Section>

          <Section title="Clinical Measurements">
            <Input
              label="Cholesterol"
              name="Cholesterol"
              value={formData.Cholesterol}
              onChange={handleChange}
              min="100"
              max="500"
            />

            <Input
              label="Heart Rate"
              name="Heart Rate"
              value={formData["Heart Rate"]}
              onChange={handleChange}
              min="40"
              max="220"
            />

            <Input
              label="BMI"
              name="BMI"
              value={formData.BMI}
              onChange={handleChange}
              min="10"
              max="60"
              step="0.1"
            />

            <Input
              label="Triglycerides"
              name="Triglycerides"
              value={formData.Triglycerides}
              onChange={handleChange}
              min="50"
              max="600"
            />

            <Input
              label="Systolic BP"
              name="Systolic BP"
              value={formData["Systolic BP"]}
              onChange={handleChange}
              min="80"
              max="220"
            />

            <Input
              label="Diastolic BP"
              name="Diastolic BP"
              value={formData["Diastolic BP"]}
              onChange={handleChange}
              min="40"
              max="140"
            />

            <CalculatedBox
              label="Pulse Pressure"
              value={pulsePressure > 0 ? String(pulsePressure) : "Auto calculated"}
            />
          </Section>

          <Section title="Lifestyle Details">
            <Select
              label="Smoking"
              name="Smoking"
              value={formData.Smoking}
              onChange={handleChange}
              options={[
                ["0", "No"],
                ["1", "Yes"],
              ]}
            />

            <Select
              label="Alcohol Consumption"
              name="Alcohol Consumption"
              value={formData["Alcohol Consumption"]}
              onChange={handleChange}
              options={[
                ["0", "None"],
                ["1", "Moderate"],
                ["2", "Heavy"],
              ]}
            />

            <Input
              label="Exercise Hours Per Week"
              name="Exercise Hours Per Week"
              value={formData["Exercise Hours Per Week"]}
              onChange={handleChange}
              min="0"
              max="80"
              step="0.5"
            />

            <Input
              label="Physical Activity Days Per Week"
              name="Physical Activity Days Per Week"
              value={formData["Physical Activity Days Per Week"]}
              onChange={handleChange}
              min="0"
              max="7"
            />

            <Input
              label="Sedentary Hours Per Day"
              name="Sedentary Hours Per Day"
              value={formData["Sedentary Hours Per Day"]}
              onChange={handleChange}
              min="0"
              max="24"
              step="0.5"
            />

            <Input
              label="Sleep Hours Per Day"
              name="Sleep Hours Per Day"
              value={formData["Sleep Hours Per Day"]}
              onChange={handleChange}
              min="3"
              max="14"
              step="0.5"
            />

            <Input
              label="Stress Level"
              name="Stress Level"
              value={formData["Stress Level"]}
              onChange={handleChange}
              min="1"
              max="10"
            />

            <Select
              label="Diet Quality"
              name="Diet Quality"
              value={formData["Diet Quality"]}
              onChange={handleChange}
              options={[
                ["1", "Healthy"],
                ["2", "Average"],
                ["3", "Unhealthy"],
              ]}
            />

            <CalculatedBox
              label="Sedentary Ratio"
              value={sedentaryRatio ? sedentaryRatio.toFixed(4) : "Auto calculated"}
            />
          </Section>

          <Section title="Medical History">
            <Select
              label="Diabetes"
              name="Diabetes"
              value={formData.Diabetes}
              onChange={handleChange}
              options={[
                ["0", "No"],
                ["1", "Yes"],
              ]}
            />

            <Select
              label="Family History"
              name="Family History"
              value={formData["Family History"]}
              onChange={handleChange}
              options={[
                ["0", "No"],
                ["1", "Yes"],
              ]}
            />

            <Select
              label="Obesity"
              name="Obesity"
              value={formData.Obesity}
              onChange={handleChange}
              options={[
                ["0", "No"],
                ["1", "Yes"],
              ]}
            />

            <Select
              label="Previous Heart Problems"
              name="Previous Heart Problems"
              value={formData["Previous Heart Problems"]}
              onChange={handleChange}
              options={[
                ["0", "No"],
                ["1", "Yes"],
              ]}
            />

            <Select
              label="Medication Use"
              name="Medication Use"
              value={formData["Medication Use"]}
              onChange={handleChange}
              options={[
                ["0", "No"],
                ["1", "Yes"],
              ]}
            />

            <Select
              label="Continent"
              name="Continent"
              value={formData.Continent}
              onChange={handleChange}
              options={[
                ["Asia", "Asia"],
                ["Africa", "Africa"],
                ["Australia", "Australia"],
                ["Europe", "Europe"],
                ["North America", "North America"],
                ["South America", "South America"],
              ]}
            />
          </Section>

          <div className="mt-8 flex flex-col gap-4 md:flex-row">
            <button
              type="button"
              onClick={handleReset}
              className="rounded-full bg-gray-100 px-8 py-4 text-lg font-bold text-gray-700 transition hover:bg-gray-200"
            >
              Clear Form
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-full bg-gradient-to-r from-red-500 to-teal-500 px-8 py-4 text-lg font-bold text-white shadow-lg transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Predicting..." : "Predict Heart Disease"}
            </button>
          </div>
        </form>

        {result && (
          <section className="mt-8 rounded-[32px] bg-white p-8 text-center shadow-2xl">
            {result.error ? (
              <>
                <h2 className="mb-3 text-3xl font-extrabold text-red-600">
                  Error
                </h2>
                <p className="text-gray-600">{result.error}</p>
              </>
            ) : (
              <>
                <h2 className="mb-3 text-3xl font-extrabold text-gray-950">
                  Prediction Result
                </h2>

                <div
                  className={`my-5 text-5xl font-extrabold ${
                    result.risk_level === "High" ||
                    result.risk_level === "Very High"
                      ? "text-red-600"
                      : result.risk_level === "Moderate"
                      ? "text-yellow-600"
                      : "text-green-600"
                  }`}
                >
                  {result.risk_level} Risk
                </div>

                {result.risk_percentage !== undefined && (
                  <p className="text-xl font-bold text-gray-700">
                    Risk Probability: {result.risk_percentage.toFixed(2)}%
                  </p>
                )}

                <p className="mx-auto mt-4 max-w-2xl leading-7 text-gray-600">
                  {result.risk_level === "High" ||
                  result.risk_level === "Very High"
                    ? "The model detected a higher risk. Please consult a medical professional for proper check-up and advice."
                    : result.risk_level === "Moderate"
                    ? "The model detected a moderate risk. Improve lifestyle habits and consider regular health checks."
                    : "The model detected a lower risk. Maintain a healthy lifestyle and regular health check-ups."}
                </p>

                {result.features_used !== undefined && (
                  <p className="mt-3 text-sm text-gray-500">
                    Features used by model: {result.features_used}
                  </p>
                )}
              </>
            )}
          </section>
        )}
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="mb-5 border-l-4 border-red-500 pl-3 text-2xl font-extrabold text-gray-950">
        {title}
      </h2>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {children}
      </div>
    </section>
  );
}

function Input({
  label,
  name,
  value,
  onChange,
  step = "1",
  min,
  max,
}: {
  label: string;
  name: keyof FormDataType;
  value: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  step?: string;
  min?: string;
  max?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-gray-700">
        {label}
      </label>

      <input
        type="number"
        step={step}
        min={min}
        max={max}
        name={name}
        value={value}
        onChange={onChange}
        required
        className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-800 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
      />
    </div>
  );
}

function Select({
  label,
  name,
  value,
  onChange,
  options,
}: {
  label: string;
  name: keyof FormDataType;
  value: string;
  onChange: React.ChangeEventHandler<HTMLSelectElement>;
  options: string[][];
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-gray-700">
        {label}
      </label>

      <select
        name={name}
        value={value}
        onChange={onChange}
        required
        className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-800 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
      >
        <option value="">Select</option>

        {options.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}

function CalculatedBox({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-gray-700">
        {label}
      </label>

      <div className="rounded-2xl border border-dashed border-teal-400 bg-teal-50 px-4 py-3 font-bold text-teal-700">
        {value}
      </div>
    </div>
  );
}