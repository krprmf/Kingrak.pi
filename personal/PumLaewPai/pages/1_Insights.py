"""
Insights — Top 10, largest per region, multi-province highlight, summary stats.
"""
import sys
from pathlib import Path

import pandas as pd
import streamlit as st

# allow `from lib.data import ...` when running from project root
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from lib.data import load_parks  # noqa: E402

st.set_page_config(page_title="Insights · PumLaewPai", layout="wide")

st.markdown(
    """
    <style>
      .block-container { padding-top: 3rem; padding-bottom: 3rem; max-width: 1100px; }
      h1 { font-weight: 500; letter-spacing: -0.02em; }
      h2, h3, h4 { font-weight: 500; color: #3A4A2F; }
      hr { border-color: #E8DFC6 !important; }
      [data-testid="stSidebar"] { background-color: #F0EAD8; }
    </style>
    """,
    unsafe_allow_html=True,
)

df = load_parks()

# ────────────────────────────────────────────────────────────────
# Header
# ────────────────────────────────────────────────────────────────
st.title("Insights")
st.markdown(
    "<p style='color:#6B7A58; font-size:1.05rem; margin-top:-0.5rem;'>"
    "A few quiet observations about Thailand's national parks."
    "</p>",
    unsafe_allow_html=True,
)
st.markdown("<br>", unsafe_allow_html=True)

# ────────────────────────────────────────────────────────────────
# Quick summary
# ────────────────────────────────────────────────────────────────
total_area = df["areaSqKm"].sum()
multi_prov = df[df["provinces"].apply(len) > 1]
preparing = df[df["nameTh"].str.contains("เตรียมการ", na=False)]

c1, c2, c3, c4 = st.columns(4)
c1.metric("Total parks", f"{len(df):,}")
c2.metric("Total area (sq.km)", f"{total_area:,.0f}")
c3.metric("Multi-province parks", f"{len(multi_prov):,}")
c4.metric("In preparation", f"{len(preparing):,}")

st.markdown("<br>", unsafe_allow_html=True)
st.divider()

# ────────────────────────────────────────────────────────────────
# Top 10 largest parks
# ────────────────────────────────────────────────────────────────
st.markdown("#### The ten largest parks")

top10 = (
    df.dropna(subset=["areaSqKm"])
    .nlargest(10, "areaSqKm")
    .copy()
)
top10["provinces"] = top10["provinces"].apply(lambda x: ", ".join(x))

display_top10 = top10[["nameTh", "provinces", "regionEn", "areaSqKm"]].rename(
    columns={
        "nameTh": "Park name",
        "provinces": "Provinces",
        "regionEn": "Region",
        "areaSqKm": "Area (sq.km)",
    }
)

# Horizontal bar — easier to read than vertical for 10 items
import plotly.express as px

fig = px.bar(
    top10.iloc[::-1],  # reverse so largest at top
    x="areaSqKm",
    y="nameTh",
    orientation="h",
    color="regionEn",
    color_discrete_map={
        "North": "#7B9E89",
        "Northeast": "#C48F65",
        "Central": "#A8B59A",
        "East": "#8FA8B7",
        "West": "#B89878",
        "South": "#6B9E94",
    },
    labels={"areaSqKm": "Area (sq.km)", "nameTh": "", "regionEn": "Region"},
    height=420,
)
fig.update_layout(
    plot_bgcolor="rgba(0,0,0,0)",
    paper_bgcolor="rgba(0,0,0,0)",
    margin=dict(l=0, r=0, t=10, b=0),
    legend=dict(orientation="h", y=-0.15, yanchor="top"),
)
fig.update_xaxes(gridcolor="#E8DFC6")
st.plotly_chart(fig, use_container_width=True)

st.markdown("<br>", unsafe_allow_html=True)
st.divider()

# ────────────────────────────────────────────────────────────────
# Largest park per region
# ────────────────────────────────────────────────────────────────
st.markdown("#### The flagship of each region")
st.caption("The single largest park in each of Thailand's six regions.")

flagship = (
    df.dropna(subset=["areaSqKm"])
    .loc[df.groupby("regionEn")["areaSqKm"].idxmax()]
    .sort_values("areaSqKm", ascending=False)
    .copy()
)
flagship["provinces"] = flagship["provinces"].apply(lambda x: ", ".join(x))
flagship_disp = flagship[["regionEn", "nameTh", "provinces", "areaSqKm", "dnpUrl"]].rename(
    columns={
        "regionEn": "Region",
        "nameTh": "Park name",
        "provinces": "Provinces",
        "areaSqKm": "Area (sq.km)",
        "dnpUrl": "Link",
    }
)
st.dataframe(
    flagship_disp,
    use_container_width=True,
    hide_index=True,
    column_config={
        "Link": st.column_config.LinkColumn("Link", display_text="open"),
        "Area (sq.km)": st.column_config.NumberColumn(format="%.2f"),
    },
)

st.markdown("<br>", unsafe_allow_html=True)
st.divider()

# ────────────────────────────────────────────────────────────────
# Summary stats per region
# ────────────────────────────────────────────────────────────────
st.markdown("#### Region at a glance")

region_summary = (
    df.groupby("regionEn")
    .agg(
        parks=("nameTh", "count"),
        total_area=("areaSqKm", "sum"),
        avg_area=("areaSqKm", "mean"),
        median_area=("areaSqKm", "median"),
    )
    .sort_values("parks", ascending=False)
    .reset_index()
    .rename(
        columns={
            "regionEn": "Region",
            "parks": "Parks",
            "total_area": "Total area (sq.km)",
            "avg_area": "Mean area",
            "median_area": "Median area",
        }
    )
)
st.dataframe(
    region_summary,
    use_container_width=True,
    hide_index=True,
    column_config={
        "Total area (sq.km)": st.column_config.NumberColumn(format="%.0f"),
        "Mean area": st.column_config.NumberColumn(format="%.0f"),
        "Median area": st.column_config.NumberColumn(format="%.0f"),
    },
)

st.markdown("<br>", unsafe_allow_html=True)
st.divider()

# ────────────────────────────────────────────────────────────────
# Multi-province parks
# ────────────────────────────────────────────────────────────────
st.markdown(f"#### Parks that cross provincial borders · {len(multi_prov)} of them")
st.caption("These parks stretch across two or more provinces — coordinating their management is part of why they're noteworthy.")

mp = multi_prov.copy()
mp["province_count"] = mp["provinces"].apply(len)
mp["provinces_str"] = mp["provinces"].apply(lambda x: ", ".join(x))
mp = mp.sort_values(["province_count", "areaSqKm"], ascending=[False, False])

mp_disp = mp[["nameTh", "provinces_str", "province_count", "regionEn", "areaSqKm"]].rename(
    columns={
        "nameTh": "Park name",
        "provinces_str": "Provinces",
        "province_count": "Provinces (count)",
        "regionEn": "Region",
        "areaSqKm": "Area (sq.km)",
    }
)
st.dataframe(
    mp_disp,
    use_container_width=True,
    hide_index=True,
    column_config={
        "Area (sq.km)": st.column_config.NumberColumn(format="%.2f"),
    },
)

# ────────────────────────────────────────────────────────────────
# Footer
# ────────────────────────────────────────────────────────────────
st.markdown("<br>", unsafe_allow_html=True)
st.divider()
st.caption(
    "Data: catalog.dnp.go.th · data.go.th · "
    "Coordinates: OpenStreetMap (geocoded via Nominatim)"
)
