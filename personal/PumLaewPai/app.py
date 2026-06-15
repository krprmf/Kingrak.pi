"""
PumLaewPai — Thailand National Parks Explorer
=============================================
Run with:
    source .venv/bin/activate
    streamlit run app.py
"""
import sys
from pathlib import Path

import folium
import pandas as pd
import streamlit as st
from streamlit_folium import st_folium

# allow `from lib...` from project root
sys.path.insert(0, str(Path(__file__).resolve().parent))
from lib.data import REGION_COLOR, load_parks, load_parks_records  # noqa: E402
from lib.retrieval import park_to_context, retrieve  # noqa: E402

st.set_page_config(
    page_title="PumLaewPai",
    layout="wide",
    initial_sidebar_state="expanded",
)

df = load_parks()

# ────────────────────────────────────────────────────────────────
# Light custom styling — softer headings + chat popover bottom-left
# ────────────────────────────────────────────────────────────────
st.markdown(
    """
    <style>
      .block-container { padding-top: 3rem; padding-bottom: 6rem; max-width: 1100px; }
      h1 { font-weight: 500; letter-spacing: -0.02em; }
      h2, h3, h4 { font-weight: 500; color: #3A4A2F; }
      .stMetric { background: #FFFBF5; border-radius: 10px; padding: 1rem; }
      hr { border-color: #E8DFC6 !important; }
      [data-testid="stSidebar"] { background-color: #F0EAD8; }
      iframe[title="streamlit_folium.st_folium"] { border-radius: 12px; }

      /* Pin the chat FAB to bottom-left of the viewport */
      div[data-testid="stPopover"] {
        position: fixed !important;
        bottom: 1.5rem !important;
        left: 1.5rem !important;
        z-index: 9999;
        width: auto !important;
      }
      /* Circular icon-only FAB */
      div[data-testid="stPopover"] > button {
        background: #3A4A2F !important;
        color: #FFFBF5 !important;
        border: none !important;
        border-radius: 50% !important;
        width: 56px !important;
        height: 56px !important;
        min-height: 56px !important;
        padding: 0 !important;
        box-shadow: 0 6px 18px rgba(58, 74, 47, 0.32);
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
      }
      div[data-testid="stPopover"] > button:hover {
        background: #4A5A3C !important;
        color: #FFFBF5 !important;
        box-shadow: 0 8px 22px rgba(58, 74, 47, 0.4);
        transform: translateY(-1px);
        transition: all 0.2s ease;
      }
      /* Hide text label, keep only the icon */
      div[data-testid="stPopover"] > button p {
        display: none !important;
      }
      div[data-testid="stPopover"] > button [data-testid="stIconMaterial"] {
        font-size: 1.5rem !important;
        color: #FFFBF5 !important;
      }
      /* Popover panel — soft cream card */
      div[data-baseweb="popover"] [data-testid="stPopoverBody"] {
        background: #FFFBF5;
        border: 1px solid #E8DFC6;
        border-radius: 14px;
        padding: 1rem;
        width: 380px !important;
        max-width: 90vw;
      }
    </style>
    """,
    unsafe_allow_html=True,
)

# ────────────────────────────────────────────────────────────────
# Sidebar
# ────────────────────────────────────────────────────────────────
st.sidebar.markdown("### Filters")
st.sidebar.markdown("<br>", unsafe_allow_html=True)

region_options = ["All regions"] + sorted(df["regionEn"].dropna().unique().tolist())
selected_region = st.sidebar.selectbox("Region", region_options)

search_query = st.sidebar.text_input(
    "Search park name", placeholder="e.g. khao yai / เขาใหญ่"
)

only_with_area = st.sidebar.checkbox("Only parks with area data", value=False)
only_with_coords = st.sidebar.checkbox("Only parks shown on map", value=False)

st.sidebar.markdown("<br><br>", unsafe_allow_html=True)
st.sidebar.caption(
    "Park names are kept in Thai script — the official spellings from "
    "the Department of National Parks."
)

# ────────────────────────────────────────────────────────────────
# Apply filters
# ────────────────────────────────────────────────────────────────
filtered = df.copy()

if selected_region != "All regions":
    filtered = filtered[filtered["regionEn"] == selected_region]

if search_query:
    filtered = filtered[
        filtered["nameTh"].str.contains(search_query, na=False, case=False)
    ]

if only_with_area:
    filtered = filtered[filtered["areaSqKm"].notna()]

if only_with_coords:
    filtered = filtered[filtered["latitude"].notna()]

# ────────────────────────────────────────────────────────────────
# Header
# ────────────────────────────────────────────────────────────────
st.title("PumLaewPai")
st.markdown(
    "<p style='color:#6B7A58; font-size:1.05rem; margin-top:-0.5rem;'>"
    "A quiet wander through Thailand's 156 national parks."
    "</p>",
    unsafe_allow_html=True,
)
st.markdown("<br>", unsafe_allow_html=True)

# ────────────────────────────────────────────────────────────────
# Metrics
# ────────────────────────────────────────────────────────────────
col1, col2, col3, col4 = st.columns(4)
col1.metric("All parks", f"{len(df):,}")
col2.metric("In this view", f"{len(filtered):,}")
total_area = filtered["areaSqKm"].sum()
col3.metric("Total area (sq.km)", f"{total_area:,.0f}" if total_area else "—")
mapped = filtered["latitude"].notna().sum()
col4.metric("On map", f"{mapped:,}")

st.markdown("<br>", unsafe_allow_html=True)
st.divider()

# ────────────────────────────────────────────────────────────────
# Map
# ────────────────────────────────────────────────────────────────
st.markdown("#### Where they are")

mappable = filtered[filtered["latitude"].notna() & filtered["longitude"].notna()]

if len(mappable) == 0:
    st.info("No parks with coordinates in this view.")
else:
    center_lat = float(mappable["latitude"].mean())
    center_lng = float(mappable["longitude"].mean())
    zoom = 6 if selected_region == "All regions" else 8

    m = folium.Map(
        location=[center_lat, center_lng],
        zoom_start=zoom,
        tiles="CartoDB Positron",
    )

    for _, p in mappable.iterrows():
        provinces_str = ", ".join(p["provinces"])
        area_str = f"{p['areaSqKm']:,.1f} sq.km" if pd.notna(p["areaSqKm"]) else "—"
        color = REGION_COLOR.get(p["regionEn"], "#7FA571")

        popup_html = f"""
        <div style="font-family: serif; min-width: 200px;">
          <div style="font-size: 1.05rem; font-weight: 600; color: #3A4A2F; margin-bottom: 6px;">
            {p['nameTh']}
          </div>
          <div style="font-size: 0.85rem; color: #6B7A58; line-height: 1.6;">
            <b>Region</b> &nbsp;{p['regionEn']}<br>
            <b>Provinces</b> &nbsp;{provinces_str}<br>
            <b>Area</b> &nbsp;{area_str}<br>
            <b>Year</b> &nbsp;{int(p['areaYear']) if pd.notna(p['areaYear']) else '—'}
          </div>
          <div style="margin-top: 8px;">
            <a href="{p['dnpUrl']}" target="_blank" style="color: #7FA571; font-size: 0.8rem; text-decoration: none;">
              open DNP page →
            </a>
          </div>
        </div>
        """

        folium.CircleMarker(
            location=[p["latitude"], p["longitude"]],
            radius=6,
            popup=folium.Popup(popup_html, max_width=300),
            tooltip=p["nameTh"],
            color=color,
            weight=2,
            fill=True,
            fillColor=color,
            fillOpacity=0.7,
        ).add_to(m)

    st_folium(m, use_container_width=True, height=520, returned_objects=[])

st.markdown("<br>", unsafe_allow_html=True)
st.divider()

# ────────────────────────────────────────────────────────────────
# Region chart
# ────────────────────────────────────────────────────────────────
st.markdown("#### Parks by region")
region_counts = (
    df["regionEn"].value_counts().rename_axis("Region").rename("Parks")
)
st.bar_chart(region_counts, height=280, color="#7FA571")

st.markdown("<br>", unsafe_allow_html=True)
st.divider()

# ────────────────────────────────────────────────────────────────
# Table
# ────────────────────────────────────────────────────────────────
st.markdown(f"#### Parks list · {len(filtered)} in view")

display_df = filtered.copy()
display_df["provinces"] = display_df["provinces"].apply(lambda x: ", ".join(x))
display_df = display_df[
    ["nameTh", "provinces", "regionEn", "areaSqKm", "areaYear", "dnpUrl"]
].rename(
    columns={
        "nameTh": "Park name",
        "provinces": "Provinces",
        "regionEn": "Region",
        "areaSqKm": "Area (sq.km)",
        "areaYear": "Data year",
        "dnpUrl": "Link",
    }
)

st.dataframe(
    display_df,
    use_container_width=True,
    hide_index=True,
    column_config={
        "Link": st.column_config.LinkColumn("Link", display_text="open"),
        "Area (sq.km)": st.column_config.NumberColumn(format="%.2f"),
        "Data year": st.column_config.NumberColumn(format="%d"),
    },
)

# ────────────────────────────────────────────────────────────────
# Footer
# ────────────────────────────────────────────────────────────────
st.markdown("<br>", unsafe_allow_html=True)
st.divider()
st.caption(
    "An independent open-source project · not affiliated with the Department of "
    "National Parks. Verify details with the park before traveling.  "
    "Data: catalog.dnp.go.th · data.go.th · License: MIT  ·  "
    "Map: OpenStreetMap contributors, CartoDB"
)

# ────────────────────────────────────────────────────────────────
# Chat — Gemini RAG, pinned bottom-left
# ────────────────────────────────────────────────────────────────
if "chat_messages" not in st.session_state:
    st.session_state.chat_messages = []

chat = st.popover(
    "Ask the parks",
    icon=":material/park:",
    use_container_width=False,
    help="Ask anything about Thai national parks",
)
with chat:
        st.markdown(
            "<div style='font-size:0.9rem; color:#6B7A58; margin-bottom:0.5rem;'>"
            "Ask anything about Thailand's national parks. Answers cite which "
            "parks they came from."
            "</div>",
            unsafe_allow_html=True,
        )

        # Render history
        for msg in st.session_state.chat_messages:
            with st.chat_message(msg["role"]):
                st.markdown(msg["content"])

        prompt = st.chat_input("e.g. waterfalls near Chiang Mai")
        if prompt:
            st.session_state.chat_messages.append({"role": "user", "content": prompt})
            with st.chat_message("user"):
                st.markdown(prompt)

            with st.chat_message("assistant"):
                with st.spinner("Thinking…"):
                    try:
                        from lib.llm import ask_gemini

                        records = load_parks_records()
                        top = retrieve(prompt, records, k=15)
                        context = [park_to_context(p) for p in top]
                        answer = ask_gemini(prompt, context)
                    except RuntimeError as e:
                        answer = (
                            f"_{e}_\n\nAdd your key to "
                            "`.streamlit/secrets.toml` and restart Streamlit."
                        )
                    except Exception as e:
                        answer = f"_Sorry, the chatbot hit an error:_ `{e}`"
                st.markdown(answer)
                st.session_state.chat_messages.append(
                    {"role": "assistant", "content": answer}
                )
