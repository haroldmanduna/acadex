#!/usr/bin/env python3
"""
ACADEX All-Subject ZIMSEC Question Paper Generator
Builds authentic ZIMSEC-aligned practice papers across Primary, O-Level & A-Level.
Outputs JSON question bank + ReportLab PDF examination documents.
"""

import json
import os
import sys
from pathlib import Path
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

ROOT = Path(__file__).resolve().parent.parent
PDF_DIR = ROOT / "pdfs"
DATA_FILE = ROOT / "data" / "acadex-maths.json"
JS_DATA_FILE = ROOT / "acadex-data.js"

GREEN = HexColor("#0a7a3c")
DARK = HexColor("#0f172a")
MUTED = HexColor("#475569")
BORDER = HexColor("#cbd5e1")
BG_CARD = HexColor("#f8fafc")

def xml_safe(text: str) -> str:
    return (
        str(text or "")
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )

def make_styles():
    font_reg, font_bold, font_it = "Helvetica", "Helvetica-Bold", "Helvetica-Oblique"
    ss = getSampleStyleSheet()
    return {
        "center": ParagraphStyle("c", parent=ss["Normal"], alignment=TA_CENTER, fontName=font_bold, fontSize=12, leading=15, textColor=DARK),
        "center2": ParagraphStyle("c2", parent=ss["Normal"], alignment=TA_CENTER, fontName=font_bold, fontSize=10, leading=13, textColor=MUTED),
        "center_bold": ParagraphStyle("cb", parent=ss["Normal"], alignment=TA_CENTER, fontName=font_bold, fontSize=11, leading=14, textColor=DARK),
        "left": ParagraphStyle("l", parent=ss["Normal"], alignment=TA_LEFT, fontName=font_reg, fontSize=9.5, leading=13.5, textColor=DARK),
        "left_bold": ParagraphStyle("lb", parent=ss["Normal"], alignment=TA_LEFT, fontName=font_bold, fontSize=9.5, leading=13.5, textColor=DARK),
        "right": ParagraphStyle("r", parent=ss["Normal"], alignment=TA_RIGHT, fontName=font_bold, fontSize=9, leading=12, textColor=MUTED),
        "inst": ParagraphStyle("i", parent=ss["Normal"], alignment=TA_JUSTIFY, fontName=font_reg, fontSize=8.5, leading=12, textColor=MUTED),
        "inst_b": ParagraphStyle("ib", parent=ss["Normal"], alignment=TA_LEFT, fontName=font_bold, fontSize=8.5, leading=12, textColor=DARK),
        "scheme": ParagraphStyle("s", parent=ss["Normal"], alignment=TA_LEFT, fontName=font_it, fontSize=8.5, leading=12, textColor=MUTED),
        "sec": ParagraphStyle("sec", parent=ss["Normal"], alignment=TA_CENTER, fontName=font_bold, fontSize=11, leading=14, textColor=GREEN),
    }

def header_footer(canvas, doc, paper):
    canvas.saveState()
    w, h = A4
    canvas.setFillColor(GREEN)
    canvas.rect(0, h - 8 * mm, w, 8 * mm, fill=1, stroke=0)
    canvas.setFillColor(white)
    canvas.setFont("Helvetica-Bold", 8)
    subj = paper.get("subject", "ACADEX").upper()
    canvas.drawString(16 * mm, h - 5.5 * mm, f"ACADEX  ·  ZIMSEC-STYLE PRACTICE  ·  {subj}")
    canvas.drawRightString(w - 16 * mm, h - 5.5 * mm, f"{paper.get('code')}  {paper.get('session')} {paper.get('year')}")
    canvas.setFillColor(MUTED)
    canvas.setFont("Helvetica-Oblique", 8)
    canvas.drawCentredString(w / 2, 10 * mm, "Original ACADEX practice paper in official ZIMSEC exam format  ·  www.acadex.co.zw")
    canvas.setFont("Helvetica", 8)
    canvas.drawRightString(w - 16 * mm, 10 * mm, f"Page {doc.page}")
    canvas.restoreState()

def build_pdf(paper, out_path: Path):
    styles = make_styles()
    doc = SimpleDocTemplate(
        str(out_path),
        pagesize=A4,
        leftMargin=16 * mm,
        rightMargin=16 * mm,
        topMargin=16 * mm,
        bottomMargin=16 * mm,
        title=f"ACADEX {paper['code']} {paper['session']} {paper['year']}",
        author="ACADEX",
    )
    story = []
    story.append(Paragraph("ZIMBABWE SCHOOL EXAMINATIONS COUNCIL  (style)", styles["center"]))
    story.append(Paragraph("ACADEX PRACTICE EXAMINATION", styles["center2"]))
    story.append(Paragraph(f"{paper['level'].upper()}  ·  {paper['subject'].upper()}", styles["center2"]))
    story.append(Spacer(1, 3 * mm))
    story.append(Paragraph(f"<b>{xml_safe(paper['subject'].upper())}</b>  &nbsp;&nbsp; {paper['code']}", styles["center"]))
    story.append(Paragraph(f"{paper['paper'].upper()}  &nbsp;  {paper['session']} {paper['year']}", styles["center2"]))
    story.append(Paragraph(paper.get("duration", "2 hours"), styles["center2"]))
    story.append(Spacer(1, 4 * mm))

    # Candidate info box
    cand = [
        [
            Paragraph("<b>Candidate Name:</b>", styles["left_bold"]),
            Paragraph("____________________________________________________", styles["left"]),
        ],
        [
            Paragraph("<b>Centre Number:</b>", styles["left_bold"]),
            Paragraph("___________________ &nbsp;&nbsp;&nbsp;&nbsp; <b>Candidate Number:</b> ___________________", styles["left"]),
        ],
    ]
    t = Table(cand, colWidths=[38 * mm, 140 * mm])
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
    ]))
    story.append(t)
    story.append(Spacer(1, 3 * mm))

    # Instructions box
    inst_rows = [
        [Paragraph("<b>TIME ALLOCATION &amp; INSTRUCTIONS TO CANDIDATES</b>", styles["inst_b"])],
        [Paragraph(xml_safe(paper.get("extra", "Write your name, Centre number and candidate number in the spaces provided.")), styles["inst"])],
        [Paragraph(xml_safe(paper.get("instructions", "Answer all questions. Show all working clearly on the examination script.")), styles["inst"])],
    ]
    itbl = Table(inst_rows, colWidths=[178 * mm])
    itbl.setStyle(TableStyle([
        ("BOX", (0, 0), (-1, -1), 0.75, BORDER),
        ("BACKGROUND", (0, 0), (-1, -1), BG_CARD),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(itbl)
    story.append(Spacer(1, 5 * mm))

    # Questions
    current_sec = None
    for q in paper.get("questions", []):
        sec = q.get("section")
        if sec and sec != current_sec:
            current_sec = sec
            story.append(Spacer(1, 3 * mm))
            story.append(Paragraph(f"<b>SECTION {sec}</b>", styles["sec"]))
            story.append(Spacer(1, 2 * mm))

        q_flow = []
        n_str = f"<b>{q['n']}.</b>"
        txt_str = xml_safe(q["text"])
        topic_str = f"<i>[{q.get('topic', '')}]</i>"
        marks_str = f"<b>[{q.get('marks', 2)}]</b>"

        q_tbl = Table([
            [
                Paragraph(n_str, styles["left_bold"]),
                Paragraph(f"{txt_str} &nbsp; {topic_str}", styles["left"]),
                Paragraph(marks_str, styles["right"]),
            ]
        ], colWidths=[10 * mm, 153 * mm, 15 * mm])
        q_tbl.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 2),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ]))
        q_flow.append(q_tbl)

        # Options if MCQ
        if q.get("options"):
            for opt in q["options"]:
                q_flow.append(Paragraph(f"&nbsp;&nbsp;&nbsp;&nbsp;{xml_safe(opt)}", styles["left"]))
            q_flow.append(Spacer(1, 1 * mm))

        # Sub parts if any
        if q.get("parts"):
            for p in q["parts"]:
                p_tbl = Table([
                    [
                        Paragraph(f"&nbsp;&nbsp;&nbsp;&nbsp;<b>({p.get('label','a')})</b>", styles["left_bold"]),
                        Paragraph(xml_safe(p.get("text","")), styles["left"]),
                        Paragraph(f"<b>[{p.get('marks',1)}]</b>", styles["right"]),
                    ]
                ], colWidths=[15 * mm, 148 * mm, 15 * mm])
                p_tbl.setStyle(TableStyle([
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("TOPPADDING", (0, 0), (-1, -1), 1),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
                ]))
                q_flow.append(p_tbl)

        q_flow.append(Spacer(1, 3 * mm))
        story.append(KeepTogether(q_flow))

    doc.build(story, onFirstPage=lambda c, d: header_footer(c, d, paper), onLaterPages=lambda c, d: header_footer(c, d, paper))
    return len(paper.get("questions", []))

print("Helper loaded successfully")
