"""
Gemini API wrapper for the PumLaewPai chatbot.
Uses google-genai SDK; reads API key from Streamlit secrets.
"""
from __future__ import annotations

import json

import streamlit as st
from google import genai
from google.genai import types

MODEL = "gemini-2.5-flash"  # fast + cheap; works for this use case

SYSTEM_PROMPT = """You are a friendly assistant for PumLaewPai, a Thailand national parks explorer.

RULES:
1. Only answer using the park records provided in the context. If the answer isn't supported by the context, say so honestly in the user's language.
2. Detect the user's language. If they wrote in Thai, answer in Thai. If English, answer in English. If mixed, follow their lead.
3. Cite which park(s) your answer is based on. After the answer, list parks like "Sources: <name_th> (Region: …)".
4. Never invent trail names, entry fees, or seasonal info that isn't in the context — recommend they verify with the park.
5. For safety questions, default to cautious advice and remind them to check current park conditions.
6. Keep answers short — 2-4 sentences for simple questions; longer only when the user asks for detail.
7. Suggest 2 follow-up questions after each answer (as a short bullet list).

Tone: warm, like a local friend who knows the parks. No emojis.
"""


@st.cache_resource
def get_client() -> genai.Client:
    api_key = st.secrets.get("GEMINI_API_KEY", "")
    if not api_key:
        raise RuntimeError(
            "GEMINI_API_KEY missing. Add it to .streamlit/secrets.toml."
        )
    return genai.Client(api_key=api_key)


def ask_gemini(user_message: str, context_parks: list[dict]) -> str:
    """Send the user message + relevant park context to Gemini, return text."""
    client = get_client()

    context_block = json.dumps(context_parks, ensure_ascii=False, indent=2)
    prompt = (
        f"{SYSTEM_PROMPT}\n\n"
        f"PARK CONTEXT (only use these {len(context_parks)} records to answer):\n"
        f"{context_block}\n\n"
        f"USER QUESTION:\n{user_message}"
    )

    resp = client.models.generate_content(
        model=MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            temperature=0.3,
            max_output_tokens=600,
        ),
    )
    return resp.text or "(no answer)"
