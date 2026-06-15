"""Shared data loader — used by app.py and pages/*"""
import json
from pathlib import Path

import pandas as pd
import streamlit as st

REGION_EN = {
    "เหนือ": "North",
    "อีสาน": "Northeast",
    "กลาง": "Central",
    "ตะวันออก": "East",
    "ตะวันตก": "West",
    "ใต้": "South",
}

REGION_COLOR = {
    "North": "#7B9E89",
    "Northeast": "#C48F65",
    "Central": "#A8B59A",
    "East": "#8FA8B7",
    "West": "#B89878",
    "South": "#6B9E94",
}

DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "processed" / "parks.json"


@st.cache_data
def load_parks() -> pd.DataFrame:
    records = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    df = pd.DataFrame(records)
    df["regionEn"] = df["region"].map(REGION_EN)
    return df


@st.cache_data
def load_parks_records() -> list[dict]:
    """Raw list-of-dicts version — used by chatbot retrieval."""
    return json.loads(DATA_PATH.read_text(encoding="utf-8"))
