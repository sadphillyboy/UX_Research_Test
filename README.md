# UX Research Non-Parametric Analysis Tool

A drag-and-drop tool for UX researchers to run non-parametric statistical tests on their data. Upload a CSV or Excel file and get instant analysis with visualizations and plain-language insights — no configuration needed.

## Features

- **Drag & Drop Upload** — Just drop your CSV or Excel file
- **Auto-Detection** — Automatically classifies columns as numeric, categorical, ordinal, or ID-like
- **Non-Parametric Tests** — Runs the appropriate tests based on your data:
  - **Mann-Whitney U** — Compares two independent groups
  - **Kruskal-Wallis H** — Compares three or more independent groups (with Dunn's post-hoc)
  - **Wilcoxon Signed-Rank** — Compares paired/repeated measurements
  - **Chi-Squared** — Tests association between categorical variables
  - **Spearman Correlation** — Measures monotonic relationships between numeric variables
- **Normality Assessment** — Shapiro-Wilk tests to justify non-parametric approach
- **Interactive Visualizations** — Histograms, box plots, scatter plots, heatmaps, correlation matrices
- **Plain-Language Insights** — Every result includes a human-readable interpretation
- **Effect Sizes** — Reports effect sizes (r, η², Cramér's V) with qualitative labels

## Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser, drag and drop your data file, and review the results.

## Data Format

The tool accepts:
- **CSV files** (`.csv`)
- **Excel files** (`.xlsx`, `.xls`)

Your data should have:
- One row per observation/participant
- Column headers in the first row
- A mix of numeric measurements and categorical grouping variables

### Example Data Structure

| participant_id | device  | age_group | task_time | satisfaction | sus_score |
|---------------|---------|-----------|-----------|-------------|-----------|
| 1             | mobile  | 18-24     | 42.3      | 4           | 72.5      |
| 2             | desktop | 25-34     | 28.1      | 5           | 85.0      |
| ...           | ...     | ...       | ...       | ...         | ...       |

## Architecture

- **Backend**: Python/FastAPI — handles file parsing, statistical analysis, and chart data generation
- **Frontend**: React + Vite + Tailwind CSS + Recharts — provides the drag-and-drop UI and interactive visualizations
