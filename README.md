# Time-to-Death Counter (Makeham-Style)

This project is a **purely educational and entertainment** tool that estimates a person's remaining lifetime using a very simplified mortality model inspired by **Makeham's law**.

It is **not** medical advice, actuarial advice, or a real predictor of individual lifespan. Real-life mortality is affected by many complex factors, and this model ignores almost all of them.

## How it works

The app:
- Asks for your **age**, **sex**, **height**, **weight**, **overall health**, and **smoking** status.
- Uses a very rough **Makeham-style force of mortality**:
  - \\( \mu(x) = A + B c^x \\) where \\(x\\) is age.
  - We adjust \\(A, B\\) with crude multipliers based on your answers.
- Numerically approximates your **remaining life expectancy** (in years) and estimates a **date of death** by adding that to today's date.

Again: this is a toy model and should not be taken seriously.

## Project structure

- `main.py` – Entry point for the CLI app.
- `ttd_counter/mortality_model.py` – Makeham-style mortality model and life expectancy calculation.
- `ttd_counter/cli.py` – Command-line interaction and input validation.
- `ttd_counter/utils.py` – Shared utilities (e.g., converting years to an estimated date).
- `api.py` – FastAPI app exposing the mortality model over HTTP.
- `frontend/` – React single-page app for the web interface.
- `requirements.txt` – Python dependencies.

## Running the CLI app

1. Make sure you have **Python 3.9+** installed.
2. In this directory, run:

```bash
python main.py
```

3. Answer the on-screen questions to get:
   - Estimated remaining years of life.
   - Estimated date of death.

## Running the web app (development)

### 1. Backend API (FastAPI)

1. Install Python dependencies (ideally in a virtualenv):

```bash
pip install -r requirements.txt
```

2. Start the FastAPI server (served on `http://localhost:8000` by default):

```bash
uvicorn api:app --reload
```

The main endpoint is:

- `POST /api/estimate`

**Request body (JSON):**

```json
{
  "age": 34.5,
  "sex": "male",
  "height_cm": 178.0,
  "weight_kg": 75.0,
  "health": "good",
  "smoking": "never"
}
```

**Response body (JSON):**

```json
{
  "remaining_years": 45.3,
  "death_date": "2071-03-10",
  "message": "This is a toy calculation only and not medical or actuarial advice. Do not use it for real decisions."
}
```

If the crude model thinks you have already exceeded the modeled maximum age, it returns:

```json
{
  "remaining_years": 0.0,
  "death_date": null,
  "message": "According to this crude model, you've already exceeded the modeled maximum age. No remaining life expectancy is computed."
}
```

### 2. Frontend (React + Vite)

The `frontend/` directory contains a small React single-page app that talks to the FastAPI backend.

1. Install Node dependencies (from within `frontend/`):

```bash
cd frontend
npm install
```

2. Start the dev server:

```bash
npm run dev
```

This will start the frontend on `http://localhost:5173`, which is already allowed by CORS in the FastAPI app.

3. Open the browser at `http://localhost:5173`, complete the multi-step questionnaire, and view the (toy) estimate.

The web form supports both **metric** and **imperial** units for height and weight:

- Height: enter either centimeters or feet/inches.
- Weight: enter either kilograms or pounds.

All values are converted to centimeters and kilograms in the browser before being sent to the API, which continues to operate internally in metric units.

## Disclaimer

- This tool is **not** accurate.
- It is **not** personalized medical or actuarial advice.
- Do not use it for any serious decision-making.

