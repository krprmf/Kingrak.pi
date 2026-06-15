"""
Inspect raw DNP datasets — detect encoding, schema, samples, and missing values.
Writes a markdown report to data/processed/inspection_report.md
"""
from __future__ import annotations

import sys
from pathlib import Path

import chardet
import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw"
OUT = ROOT / "data" / "processed" / "inspection_report.md"

CSV_ENCODINGS = ("utf-8", "utf-8-sig", "cp874", "tis-620")


def detect_encoding(path: Path) -> str:
    with path.open("rb") as f:
        raw = f.read(50_000)
    guess = chardet.detect(raw)
    return guess.get("encoding") or "utf-8"


def read_csv_robust(path: Path) -> tuple[pd.DataFrame, str]:
    detected = detect_encoding(path)
    candidates = [detected, *CSV_ENCODINGS]
    last_err: Exception | None = None
    for enc in candidates:
        if not enc:
            continue
        try:
            df = pd.read_csv(path, encoding=enc)
            return df, enc
        except (UnicodeDecodeError, UnicodeError) as e:
            last_err = e
    raise RuntimeError(f"Could not decode {path.name}: {last_err}")


def read_xlsx(path: Path) -> pd.DataFrame:
    return pd.read_excel(path, engine="openpyxl")


def summarize(name: str, df: pd.DataFrame, encoding: str | None = None) -> str:
    lines: list[str] = []
    lines.append(f"## {name}")
    if encoding:
        lines.append(f"- **Encoding:** `{encoding}`")
    lines.append(f"- **Shape:** {df.shape[0]} rows × {df.shape[1]} cols")

    lines.append("\n### Columns")
    lines.append("| # | Column | Dtype | Non-null | Nulls | Sample |")
    lines.append("|---|---|---|---|---|---|")
    for i, col in enumerate(df.columns):
        s = df[col]
        sample = next((str(v) for v in s.dropna().head(1).tolist()), "")
        sample = sample.replace("\n", " ").replace("|", "\\|")[:60]
        lines.append(
            f"| {i} | `{col}` | {s.dtype} | {s.notna().sum()} | {s.isna().sum()} | {sample} |"
        )

    lines.append("\n### Sample rows (head 5)")
    lines.append("```")
    lines.append(df.head(5).to_string(index=False))
    lines.append("```")
    return "\n".join(lines) + "\n"


def main() -> int:
    if not RAW.exists():
        print(f"ERROR: {RAW} not found", file=sys.stderr)
        return 1

    OUT.parent.mkdir(parents=True, exist_ok=True)
    sections: list[str] = ["# DNP Raw Data Inspection Report\n"]

    files = sorted(RAW.iterdir())
    if not files:
        print(f"ERROR: no files in {RAW}", file=sys.stderr)
        return 1

    for path in files:
        if path.name.startswith("."):
            continue
        print(f"→ inspecting {path.name}")
        try:
            if path.suffix.lower() == ".csv":
                df, enc = read_csv_robust(path)
                sections.append(summarize(path.name, df, encoding=enc))
            elif path.suffix.lower() in (".xlsx", ".xls"):
                df = read_xlsx(path)
                sections.append(summarize(path.name, df))
            else:
                continue
        except Exception as e:
            sections.append(f"## {path.name}\n\n**ERROR:** {e}\n")

    OUT.write_text("\n".join(sections), encoding="utf-8")
    print(f"\n✓ Report written: {OUT.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
