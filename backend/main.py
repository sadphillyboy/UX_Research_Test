from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import pandas as pd
import numpy as np
import io
import traceback

from analysis import analyze_dataset

app = FastAPI(title="UX Research Non-Parametric Analysis Tool")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        filename = file.filename or ""

        if filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(contents))
        elif filename.endswith((".xlsx", ".xls")):
            df = pd.read_excel(io.BytesIO(contents))
        else:
            return JSONResponse(
                status_code=400,
                content={"error": "Unsupported file format. Please upload a CSV or Excel file."},
            )

        if df.empty:
            return JSONResponse(
                status_code=400,
                content={"error": "The uploaded file is empty."},
            )

        results = analyze_dataset(df)
        return JSONResponse(content=results)

    except Exception as e:
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"error": f"Analysis failed: {str(e)}"},
        )


@app.get("/api/health")
async def health():
    return {"status": "ok"}
