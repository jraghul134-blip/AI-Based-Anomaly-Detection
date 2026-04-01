from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from sklearn.ensemble import IsolationForest
import io

app = FastAPI(title="Network Anomaly Detection API")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/detect_anomalies")
async def detect_anomalies(file: UploadFile = File(...)):
    if not file.filename.endswith('.csv'):
        return {"error": "Only CSV files are supported."}
        
    contents = await file.read()
    
    try:
        df = pd.read_csv(io.BytesIO(contents))
    except Exception as e:
        return {"error": f"Failed to parse CSV: {str(e)}"}
    
    # Extract numeric columns for the AI model
    numeric_df = df.select_dtypes(include=['float64', 'int64'])
    if numeric_df.empty:
        return {"error": "CSV must contain at least one numeric column for AI analysis."}
        
    numeric_df = numeric_df.fillna(0)
    
    # Initialize Scikit-Learn Isolation Forest
    # Isolation Forest isolates anomalous data points by randomly selecting a feature and a random split value
    model = IsolationForest(n_estimators=100, contamination=0.05, random_state=42)
    
    # Fit the model and get predictions (1 = normal, -1 = anomaly)
    predictions = model.fit_predict(numeric_df)
    
    # Add column mapping -1 to a boolean 'True' indicating an anomaly
    df['is_anomaly'] = predictions == -1
    
    return {
        "status": "success",
        "filename": file.filename,
        "total_records": len(df),
        "anomalies_detected": int(df['is_anomaly'].sum()),
        "data": df.fillna("").to_dict(orient="records")
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
