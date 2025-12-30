from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import pandas as pd
import numpy as np
from fastapi.middleware.cors import CORSMiddleware

# -------------------------
# App & CORS
# -------------------------
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------
# Load trained pipeline
# -------------------------
model_pipeline = joblib.load("final_preterm_full_pipeline.pkl")

pipe = joblib.load("final_preterm_full_pipeline.pkl")
print(type(pipe))
print(pipe)

# -------------------------
# Helper converters
# -------------------------
def to_int(val):
    try:
        return int(val)
    except:
        return np.nan

def to_float(val):
    try:
        return float(val)
    except:
        return np.nan

# -------------------------
# ORDINAL MAPS (MATCH TRAINING)
# -------------------------
MEDUC_MAP = {
    "8th grade or less": 1,
    "9th-12th grade, no diploma": 2,
    "High school graduate / GED": 3,
    "Some college credit": 4,
    "Associate degree": 5,
    "Bachelor's degree": 6,
    "Master's degree": 7,
    "Doctorate / Professional degree": 8,
}

CIG_MAP = {
    "0": 0,
    "1-5": 1,
    "6-10": 2,
    "11-20": 3,
    "21-40": 4,
    "41+": 5
}

PRECARE_MAP = {
    "1-3": 1,
    "4-6": 2,
    "7-end": 3,
    "No care": 4
}

PREVIS_MAP = {
    "0 visits": 1,
    "1-2 visits": 2,
    "3-4 visits": 3,
    "5-6 visits": 4,
    "7-8 visits": 5,
    "9-10 visits": 6,
    "11-12 visits": 7,
    "13-14 visits": 8,
    "15-16 visits": 9,
    "17-18 visits": 10,
    "19 or more visits": 11
}

DPLURAL_MAP = {
    "No": 1,
    "Yes": 2
}
# MARITAL_MAP = {
#     "Married":1,
#     "Unmarried":2
# }

def map_birth_order(val):
    try:
        return min(int(val), 8)
    except:
        return 9
    
# def map_race(val):
#     return val if val else "Unknown"

def map_paternity(val):
    if val == "Yes":
        return "Y"
    if val == "No":
        return "N"
    if val == "Unknown":
        return "U"
    return "X"

def map_marital(val):
    if val == "Married":
        return 1
    if val == "Unmarried":
        return 2
    return np.nan

def yn(val):
    if val is None:
        return np.nan
    val = val.strip().lower()
    if val == "yes":
        return 1
    if val == "no":
        return 0
    return np.nan


class FormData(BaseModel):
    # Numeric
    mother_age: str
    father_age: str | None = None
    prior_living_children: str
    prior_deceased_children: str | None = "0"
    prior_terminations: str | None = "0"
    months_last_live_birth: str | None = "0"
    months_last_other_pregnancy: str | None = "0"
    months_last_pregnancy: str | None = "0"
    height: str
    bmi: str | None = None
    weight_gain: str | None = None
    num_prev_csection: str | None = "0"

    # Ordinal
    mother_education: str
    father_education: str | None = None
    cig_before: str | None = "0"
    cig_t1: str | None = "0"
    cig_t2: str | None = "0"
    cig_t3: str | None = "0"
    prenatal_month: str | None = "No care"
    prenatal_visits: str | None = "0 visits"
    birth_order: str
    plural_birth: str

        # One-hot / binary
    paternity: str
    marital_status: str

    pre_diabetes: str
    gest_diabetes: str
    pre_hyper: str
    gest_hyper: str
    eclampsia: str | None = "No"
    prev_preterm: str
    infertility_treat: str | None = "No"
    fertility_drugs: str | None = "No"
    art: str | None = "No"
    prev_csection: str | None = "No"

    gonorrhea: str | None = "No"
    syphilis: str | None = "No"
    chlamydia: str | None = "No"
    hep_b: str | None = "No"
    hep_c: str | None = "No"


@app.post("/predict")
def predict(data: FormData):

    features = {
        # -------- Numeric --------
        "mager": to_int(data.mother_age),
        "fagecomb": to_int(data.father_age),
        "priorlive": to_int(data.prior_living_children),
        "priordead": to_int(data.prior_deceased_children),
        "priorterm": to_int(data.prior_terminations),
        "illb_r": to_int(data.months_last_live_birth),
        "ilop_r": to_int(data.months_last_other_pregnancy),
        "ilp_r": to_int(data.months_last_pregnancy),
        "m_ht_in": to_int(data.height),
        "bmi": to_float(data.bmi),
        "wtgain": to_float(data.weight_gain),
        "rf_cesarn": to_int(data.num_prev_csection),

        # -------- Ordinal --------
        "meduc": MEDUC_MAP.get(data.mother_education, 9),
        "feduc": MEDUC_MAP.get(data.father_education, 9),

        "cig0_r": CIG_MAP.get(data.cig_before, 6),
        "cig1_r": CIG_MAP.get(data.cig_t1, 6),
        "cig2_r": CIG_MAP.get(data.cig_t2, 6),
        "cig3_r": CIG_MAP.get(data.cig_t3, 6),

        "precare5": PRECARE_MAP.get(data.prenatal_month, 5),
        "previs_rec": PREVIS_MAP.get(data.prenatal_visits, 12),

        "dplural": DPLURAL_MAP.get(data.plural_birth, 1),
        "tbo_rec": map_birth_order(data.birth_order),
        "dmar": map_marital(data.marital_status),
                # -------- Binary medical --------
        "rf_pdiab": yn(data.pre_diabetes),
        "rf_gdiab": yn(data.gest_diabetes),
        "rf_phype": yn(data.pre_hyper),
        "rf_ghype": yn(data.gest_hyper),
        "rf_ehype": yn(data.eclampsia),
        "rf_ppterm": yn(data.prev_preterm),
        "rf_inftr": yn(data.infertility_treat),
        "rf_fedrg": yn(data.fertility_drugs),
        "rf_artec": yn(data.art),
        "rf_cesar": yn(data.prev_csection),

        # -------- Infections --------
        "ip_gon": yn(data.gonorrhea),
        "ip_syph": yn(data.syphilis),
        "ip_chlam": yn(data.chlamydia),
        "ip_hepb": yn(data.hep_b),
        "ip_hepc": yn(data.hep_c),

        # -------- Categorical (encoded in pipeline) --------
        
        "mar_p": map_paternity(data.paternity),
    }
    # Columns that go into one-hot
    onehot_cols = [
        "ip_gon", "ip_chlam", "rf_ghype", "rf_cesar",
        "rf_inftr", "rf_phype", "rf_artec", "ip_hepb",
        "mar_p", "rf_ppterm", "ip_syph", "rf_pdiab",
        "rf_ehype", "ip_hepc", "rf_gdiab", "rf_fedrg"
    ]

    # Cast them to strings before creating DataFrame
    for col in onehot_cols:
        features[col] = str(features[col])


    df = pd.DataFrame([features])
    print(df.dtypes)
    print(df)

    prediction = model_pipeline.predict(df)[0]

    return {
        "prediction": int(prediction),
        "risk": "High Risk of Preterm Birth" if prediction == 1 else "Low Risk of Preterm Birth"
    }
