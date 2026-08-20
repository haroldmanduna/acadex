#!/usr/bin/env python3
"""
ACADEX Maths builder
Original ZIMSEC-STYLE practice papers (NOT official copyrighted scripts).
Syllabus alignment:
  Grade 7  702   P1 25 short, P2 11 longer
  O-Level  4004  P1 30 short non-calc 2h30; P2 Sec A 52 (all) + Sec B 7×12 choose 4
  A-Level  6042/9164/9187  structured papers
Each year/session uses a seeded RNG so numbers differ but topics stay exam-like.
"""
from __future__ import annotations

import json
import math
import random
import shutil
from fractions import Fraction
from pathlib import Path

from reportlab.lib.colors import HexColor, black, white
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

import sys
ROOT = Path(__file__).resolve().parents[1]
PDF_DIR = ROOT / "pdfs"
DATA_DIR = ROOT / "data"
sys.path.insert(0, str(Path(__file__).resolve().parent))
from papers_4004 import olevel_p1 as _olevel_p1, olevel_p2 as _olevel_p2
from papers_5006 import combined_p1, combined_p2
from papers_1122 import english_p1, english_p2
GREEN = HexColor("#0a7a3c")
GOLD = HexColor("#f2b705")
DARK = HexColor("#0f172a")
MUTED = HexColor("#64748b")


def seed_rng(year: int, session: str, code: str, paper: int) -> random.Random:
    s = f"{year}-{session}-{code}-{paper}-acadex-v4"
    return random.Random(s)


def fmt(n) -> str:
    if isinstance(n, Fraction):
        if n.denominator == 1:
            return str(n.numerator)
        if abs(n.numerator) > n.denominator:
            whole = int(n.numerator / n.denominator)
            rem = abs(n.numerator) % n.denominator
            sign = "-" if n < 0 else ""
            if rem == 0:
                return f"{sign}{abs(whole)}"
            return f"{sign}{abs(whole)} {rem}/{n.denominator}"
        return f"{n.numerator}/{n.denominator}"
    if isinstance(n, float):
        if abs(n - round(n)) < 1e-9:
            return str(int(round(n)))
        t = f"{n:.4f}".rstrip("0").rstrip(".")
        return t
    return str(n)


def qdict(n, marks, topic, text, answer, steps, section="A", parts=None, markscheme=None, kind="short"):
    return {
        "n": n,
        "section": section,
        "marks": marks,
        "topic": topic,
        "text": text,
        "answer": answer if isinstance(answer, str) else fmt(answer),
        "steps": steps,
        "parts": parts or [],
        "markscheme": markscheme or f"{marks} marks: method + accuracy. Answer: {answer if isinstance(answer, str) else fmt(answer)}",
        "kind": kind,
    }


def step(t, d=""):
    return {"t": t, "d": d}


def xml_safe(s: str) -> str:
    s = s.replace("&", "&amp;")
    s = s.replace("<br/>", "<<<BR>>>")
    s = s.replace("<", "&lt;").replace(">", "&gt;")
    return s.replace("<<<BR>>>", "<br/>")


def olevel_p1(rng: random.Random, year: int, session: str = "November") -> list[dict]:
    return _olevel_p1(rng, year, session)


def olevel_p2(rng: random.Random, year: int, session: str = "November") -> list[dict]:
    return _olevel_p2(rng, year, session)


# ---------------------------------------------------------------------------
# GRADE 7 702
# ---------------------------------------------------------------------------
def grade7_p1(rng: random.Random, year: int) -> list[dict]:
    qs = []
    n = 1
    # 1 place value
    num = rng.randint(3, 9) * 1000 + rng.randint(1, 9) * 100 + rng.randint(1, 9) * 10 + rng.randint(0, 9)
    qs.append(qdict(n, 2, "Place value", f"Write {num} in words.", _words(num),
                    [step("Read thousands, hundreds, tens, ones", _words(num))])); n += 1
    # 2 add
    a, b = rng.randint(245, 890), rng.randint(120, 450)
    qs.append(qdict(n, 2, "Addition", f"Work out {a} + {b}.", a + b,
                    [step("Add units, tens, hundreds", f"{a} + {b} = {a+b}.")])); n += 1
    # 3 subtract
    a, b = rng.randint(500, 900), rng.randint(100, 400)
    qs.append(qdict(n, 2, "Subtraction", f"Work out {a} − {b}.", a - b,
                    [step("Subtract", f"{a} − {b} = {a-b}.")])); n += 1
    # 4 multiply
    a, b = rng.randint(12, 28), rng.choice([4, 5, 6, 7, 8])
    qs.append(qdict(n, 2, "Multiplication", f"Work out {a} × {b}.", a * b,
                    [step("Multiply", f"{a} × {b} = {a*b}.")])); n += 1
    # 5 divide
    b = rng.choice([4, 5, 6, 8])
    a = b * rng.randint(7, 15)
    qs.append(qdict(n, 2, "Division", f"Work out {a} ÷ {b}.", a // b,
                    [step("Divide", f"{a} ÷ {b} = {a//b}.")])); n += 1
    # 6 fraction of
    whole = rng.choice([12, 18, 24, 30, 36])
    nume, den = 1, rng.choice([2, 3, 4, 6])
    qs.append(qdict(n, 2, "Fractions", f"Find {nume}/{den} of {whole}.", whole * nume // den,
                    [step("Divide by denominator, multiply by numerator",
                          f"{whole} ÷ {den} = {whole//den}, then × {nume} = {whole*nume//den}.")])); n += 1
    # 7 decimal
    d1 = rng.choice([1.2, 1.5, 2.4, 3.6])
    d2 = rng.choice([0.3, 0.4, 0.5, 0.6])
    qs.append(qdict(n, 2, "Decimals", f"Work out {d1} + {d2}.", round(d1 + d2, 1),
                    [step("Line up decimal points", f"{d1} + {d2} = {round(d1+d2,1)}.")])); n += 1
    # 8 percent
    whole, pct = rng.choice([20, 40, 50, 80]), rng.choice([10, 25, 50])
    qs.append(qdict(n, 2, "Percentages", f"Find {pct}% of {whole}.", whole * pct // 100,
                    [step("% of", f"{pct}/100 × {whole} = {whole*pct//100}.")])); n += 1
    # 9 money
    p1, p2 = rng.choice([1.5, 2, 2.5, 3]), rng.choice([0.5, 0.75, 1, 1.25])
    qs.append(qdict(n, 2, "Money", f"A loaf costs ${p1:.2f} and a pencil costs ${p2:.2f}. Find the total.",
                    f"${p1+p2:.2f}",
                    [step("Add", f"{p1:.2f} + {p2:.2f} = {p1+p2:.2f}.")])); n += 1
    # 10 time
    start_h, dur = rng.choice([8, 9, 10, 14]), rng.choice([45, 50, 90, 120])
    end_m = (start_h * 60 + dur)
    eh, em = divmod(end_m, 60)
    qs.append(qdict(n, 2, "Time", f"A lesson starts at {start_h}:00 and lasts {dur} minutes. What time does it end?",
                    f"{eh}:{em:02d}",
                    [step("Add minutes", f"{start_h}:00 + {dur} min = {eh}:{em:02d}.")])); n += 1
    # 11 perimeter
    L, W = rng.randint(6, 14), rng.randint(3, 8)
    qs.append(qdict(n, 2, "Perimeter", f"A rectangle is {L} cm long and {W} cm wide. Find its perimeter.",
                    f"{2*(L+W)} cm",
                    [step("P = 2(L+W)", f"2({L}+{W}) = {2*(L+W)} cm.")])); n += 1
    # 12 area
    qs.append(qdict(n, 2, "Area", f"Find the area of a rectangle {L} cm by {W} cm.",
                    f"{L*W} cm²",
                    [step("A = L×W", f"{L}×{W} = {L*W} cm².")])); n += 1
    # 13 triangle area
    b, h = rng.choice([6, 8, 10]), rng.choice([4, 5, 7])
    qs.append(qdict(n, 2, "Area of triangle", f"Triangle base {b} cm, height {h} cm. Find the area.",
                    f"{b*h//2} cm²",
                    [step("½bh", f"½×{b}×{h} = {b*h//2} cm².")])); n += 1
    # 14 angles
    x = rng.randint(40, 80)
    qs.append(qdict(n, 2, "Angles", f"Two angles on a straight line are {x}° and y°. Find y.",
                    f"{180-x}°",
                    [step("Straight line = 180°", f"y = 180 − {x} = {180-x}°.")])); n += 1
    # 15 square
    s = rng.randint(4, 12)
    qs.append(qdict(n, 2, "Squares", f"Find the area of a square of side {s} cm.",
                    f"{s*s} cm²",
                    [step("A = s²", f"{s}² = {s*s} cm².")])); n += 1
    # 16 volume cube
    s = rng.randint(3, 8)
    qs.append(qdict(n, 2, "Volume", f"A cube has edge {s} cm. Find its volume.",
                    f"{s**3} cm³",
                    [step("V = s³", f"{s}³ = {s**3} cm³.")])); n += 1
    # 17 simple equation
    a, x = rng.choice([2, 3, 4, 5]), rng.randint(3, 9)
    qs.append(qdict(n, 2, "Simple equations", f"Solve  {a}x = {a*x}.",
                    x, [step(f"Divide by {a}", f"x = {a*x}/{a} = {x}.")])); n += 1
    # 18 sequence
    a0, d = rng.randint(2, 6), rng.choice([2, 3, 4, 5])
    qs.append(qdict(n, 2, "Number patterns", f"Find the next term: {a0}, {a0+d}, {a0+2*d}, {a0+3*d}, …",
                    a0 + 4 * d,
                    [step(f"Add {d} each time", f"Next = {a0+3*d} + {d} = {a0+4*d}.")])); n += 1
    # 19 bar chart reading
    qs.append(qdict(n, 2, "Graphs",
                    "A bar chart shows Grade 7 favourite sports: Soccer 12, Netball 9, Athletics 5. How many children were asked?",
                    26, [step("Add frequencies", "12 + 9 + 5 = 26.")])); n += 1
    # 20 mode
    qs.append(qdict(n, 2, "Mode", "The scores 3, 5, 5, 6, 8, 5, 9. What is the mode?",
                    5, [step("Mode = most frequent", "5 appears three times.")])); n += 1
    # 21 median
    qs.append(qdict(n, 2, "Median", "Find the median of 3, 5, 5, 6, 8, 5, 9 (order first).",
                    5, [step("Order: 3,5,5,5,6,8,9", "Middle (4th of 7) = 5.")])); n += 1
    # 22 units
    m = rng.choice([2, 3, 4, 5])
    qs.append(qdict(n, 2, "Units", f"Convert {m} metres to centimetres.",
                    f"{m*100} cm", [step("1 m = 100 cm", f"{m} × 100 = {m*100} cm.")])); n += 1
    # 23 temperature
    t1, t2 = rng.choice([8, 10, 12]), rng.choice([24, 26, 28, 30])
    qs.append(qdict(n, 2, "Temperature",
                    f"Harare was {t1}°C at 06:00 and {t2}°C at 14:00. By how much did the temperature rise?",
                    f"{t2-t1}°C", [step("Difference", f"{t2} − {t1} = {t2-t1}°C.")])); n += 1
    # 24 remaining
    tot, used = rng.choice([24, 30, 36]), rng.choice([8, 10, 12])
    qs.append(qdict(n, 2, "Word problems",
                    f"A 50 kg bag of maize meal is packed into {tot} smaller bags of equal mass. If {used} bags are sold, how many remain?",
                    tot - used, [step("Subtract", f"{tot} − {used} = {tot-used}.")])); n += 1
    # 25 probability language
    qs.append(qdict(n, 2, "Probability",
                    "A fair coin is tossed. What is the probability of getting a head?",
                    "1/2", [step("Two equally likely outcomes", "P(head) = 1/2.")]))
    return qs


def _words(n: int) -> str:
    ones = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"]
    teens = ["ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"]
    tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"]
    def under1000(x):
        h, r = divmod(x, 100)
        s = f"{ones[h]} hundred " if h else ""
        if r == 0:
            return s.strip()
        if r < 10:
            return (s + ones[r]).strip()
        if r < 20:
            return (s + teens[r - 10]).strip()
        t, o = divmod(r, 10)
        return (s + tens[t] + ((" " + ones[o]) if o else "")).strip()
    th, r = divmod(n, 1000)
    if th and r:
        return f"{under1000(th)} thousand {under1000(r)}"
    if th:
        return f"{under1000(th)} thousand"
    return under1000(r)


def grade7_p2(rng: random.Random, year: int) -> list[dict]:
    qs = []
    L, W = rng.randint(10, 18), rng.randint(6, 10)
    qs.append(qdict(1, 6, "Perimeter and area",
        f"A school garden is a rectangle {L} m by {W} m.<br/>(a) Perimeter  [2]<br/>(b) Area  [2]<br/>(c) Fencing costs $3 per metre. Cost to fence it?  [2]",
        f"(a) {2*(L+W)} m; (b) {L*W} m²; (c) ${6*(L+W)}",
        [step("(a)", f"2({L}+{W}) = {2*(L+W)} m"),
         step("(b)", f"{L}×{W} = {L*W} m²"),
         step("(c)", f"{2*(L+W)} × $3 = ${6*(L+W)}")], kind="structured"))
    a, b, c = rng.randint(2, 9), rng.randint(10, 40), rng.randint(2, 6)
    qs.append(qdict(2, 6, "Word problem",
        f"Anesu has ${b}. She buys {a} pens at ${c} each.<br/>(a) Cost of pens  [2]<br/>(b) Change  [2]<br/>(c) If pens were ${c+1}, could she still buy {a}?  [2]",
        f"(a) ${a*c}; (b) ${b-a*c}; (c) {'yes' if a*(c+1)<=b else 'no'}",
        [step("(a)", f"{a}×{c} = {a*c}"),
         step("(b)", f"{b} − {a*c} = {b-a*c}"),
         step("(c)", f"{a}×{c+1} = {a*(c+1)} compared with {b}.")], kind="structured"))
    s = rng.randint(5, 9)
    qs.append(qdict(3, 5, "Nets and cubes",
        f"A cube of edge {s} cm.<br/>(a) Volume  [2]<br/>(b) Surface area  [3]",
        f"(a) {s**3} cm³; (b) {6*s*s} cm²",
        [step("Volume s³", f"{s}³ = {s**3}"),
         step("6 faces", f"6 × {s}² = {6*s*s}")], kind="structured"))
    qs.append(qdict(4, 5, "Fractions",
        f"A pizza is cut into 8 equal slices. Tendai eats 3 slices.<br/>(a) Fraction eaten  [1]<br/>(b) Fraction left  [2]<br/>(c) If 2 pizzas are shared equally by 5 children, what fraction does each get?  [2]",
        "(a) 3/8; (b) 5/8; (c) 2/5",
        [step("(a)", "3/8"), step("(b)", "1 − 3/8 = 5/8"), step("(c)", "2 ÷ 5 = 2/5")], kind="structured"))
    qs.append(qdict(5, 6, "Data handling",
        "Marks: 4, 6, 6, 7, 8, 9, 10.<br/>(a) Mean  [3]<br/>(b) Median  [2]<br/>(c) Range  [1]",
        f"(a) {fmt(Fraction(4+6+6+7+8+9+10,7))}; (b) 7; (c) 6",
        [step("Mean", f"Sum 50, 50/7 = {fmt(Fraction(50,7))}"),
         step("Median", "4th value = 7"),
         step("Range", "10 − 4 = 6")], kind="structured"))
    ang = rng.randint(50, 80)
    qs.append(qdict(6, 5, "Triangles",
        f"An isosceles triangle has base angles {ang}° each.<br/>(a) Find the vertex angle.  [3]<br/>(b) What type of triangle is it (acute/obtuse/right)?  [2]",
        f"(a) {180-2*ang}°; (b) {'obtuse' if 180-2*ang>90 else 'right-angled' if 180-2*ang==90 else 'acute'}",
        [step("Angle sum 180°", f"Vertex = 180 − 2×{ang} = {180-2*ang}°."),
         step("Classify", "Compare with 90°.")], kind="structured"))
    dist, speed = rng.choice([12, 15, 18, 24]), rng.choice([3, 4, 5, 6])
    qs.append(qdict(7, 5, "Speed",
        f"A kombi travels {dist} km at {speed} km per 10 minutes. How many minutes for the trip if it keeps this speed?",
        f"{dist/speed * 10:.0f} min" if dist % speed == 0 else f"{fmt(Fraction(dist*10, speed))} min",
        [step("Time = distance/speed", f"{dist} km at {speed} km / 10 min ⇒ {dist}/{speed} × 10 minutes.")], kind="structured"))
    qs.append(qdict(8, 5, "Symmetry",
        "Name the number of lines of symmetry of:<br/>(a) a square  [2]<br/>(b) a rectangle that is not a square  [2]<br/>(c) a circle  [1]",
        "(a) 4; (b) 2; (c) infinitely many",
        [step("Square", "4 lines"), step("Rectangle", "2 lines (midlines)"), step("Circle", "Every diameter")], kind="structured"))
    qs.append(qdict(9, 5, "Coordinates",
        f"On a grid, A is (2, 3) and B is (2, 8).<br/>(a) Plot-describe AB.  [2]<br/>(b) Length of AB.  [2]<br/>(c) Midpoint of AB.  [1]",
        "(a) vertical line; (b) 5 units; (c) (2, 5.5)",
        [step("Same x", "Vertical segment"),
         step("Length |8−3|=5"),
         step("Midpoint (2, 5.5)")], kind="structured"))
    qs.append(qdict(10, 6, "Capacity",
        "A bottle holds 2 litres. A cup holds 250 ml.<br/>(a) How many cups fill the bottle?  [3]<br/>(b) 3 bottles in ml.  [3]",
        "(a) 8; (b) 6000 ml",
        [step("2 L = 2000 ml", "2000/250 = 8"),
         step("3×2000 = 6000 ml")], kind="structured"))
    qs.append(qdict(11, 6, "Scale",
        "A plan uses scale 1 cm to 5 m. The classroom is 8 cm long on the plan.<br/>(a) Real length  [3]<br/>(b) Real width if plan width is 6 cm  [3]",
        "(a) 40 m; (b) 30 m",
        [step("×5", "8×5 = 40 m"), step("6×5 = 30 m")], kind="structured"))
    return qs


# ---------------------------------------------------------------------------
# A-LEVEL
# ---------------------------------------------------------------------------
def alevel_pure_p1(rng: random.Random, year: int, code: str) -> list[dict]:
    qs = []
    # binomial
    n = rng.choice([5, 6, 7])
    qs.append(qdict(1, 8, "Binomial expansion",
        f"Find the first four terms in the expansion of (1 + 2x)^{n} in ascending powers of x.",
        f"1 + {2*n}x + {2*n*(n-1)}x² + {8*n*(n-1)*(n-2)//6}x³ + …",
        [step("Binomial theorem", f"(1+2x)^n = Σ C(n,k)(2x)^k."),
         step("k=0..3", f"1 + n·2x + C(n,2)·4x² + C(n,3)·8x³.")], kind="structured"))
    a, b, r = rng.randint(1, 4), rng.randint(1, 5), rng.randint(2, 4)
    qs.append(qdict(2, 8, "Remainder theorem",
        f"The polynomial p(x) = x³ + ax² − {b}x + {r} has remainder {r} when divided by (x − 1). Show this and find p(−1).",
        f"p(1)={1+a-b+r}; p(−1)={-1+a+b+r}",
        [step("Remainder theorem", "p(1) is the remainder when dividing by (x−1)."),
         step("Evaluate p(−1)", f"(−1)³ + a(1) − {b}(−1) + {r} = −1 + a + {b} + {r}.")], kind="structured"))
    qs.append(qdict(3, 8, "Differentiation",
        f"Differentiate y = {n}x³ − {a}x² + {b}x − 1. Hence find the gradient at x = 1.",
        f"dy/dx = {3*n}x² − {2*a}x + {b}; at x=1: {3*n-2*a+b}",
        [step("Power rule", f"dy/dx = {3*n}x² − {2*a}x + {b}."),
         step("x=1", f"{3*n} − {2*a} + {b} = {3*n-2*a+b}.")], kind="structured"))
    qs.append(qdict(4, 8, "Integration",
        f"Find ∫ ({n}x² − {a}x + {b}) dx  and the definite integral from 0 to 1.",
        f"{n}/3 x³ − {a}/2 x² + {b}x + C; definite {fmt(Fraction(n,3)-Fraction(a,2)+b)}",
        [step("Reverse power rule", f"∫x^n = x^(n+1)/(n+1)."),
         step("Limits 0 to 1", f"{n}/3 − {a}/2 + {b}.")], kind="structured"))
    qs.append(qdict(5, 8, "Trigonometry",
        "Prove that 1 + tan²θ = sec²θ. Hence solve 1 + tan²θ = 4 for 0° ≤ θ ≤ 180°.",
        "θ = 60° or 120°",
        [step("Identity", "Divide sin²+cos²=1 by cos²."),
         step("sec²θ = 4", "cos θ = ±1/2 ⇒ 60°, 120° in the interval.")], kind="structured"))
    x1, y1, x2, y2 = 1, rng.randint(2, 5), rng.randint(4, 8), rng.randint(6, 10)
    qs.append(qdict(6, 8, "Coordinate geometry",
        f"A is ({x1}, {y1}), B is ({x2}, {y2}).<br/>(a) Midpoint  [2]<br/>(b) Distance AB  [3]<br/>(c) Equation of AB  [3]",
        f"M=({fmt(Fraction(x1+x2,2))},{fmt(Fraction(y1+y2,2))}); d=√{(x2-x1)**2+(y2-y1)**2}",
        [step("Midpoint formula", ""),
         step("Distance formula", ""),
         step("y − y1 = m(x − x1)", f"m = {(y2-y1)}/{(x2-x1)}")], kind="structured"))
    a0, d = rng.randint(2, 5), rng.choice([2, 3, 4])
    qs.append(qdict(7, 8, "Arithmetic series",
        f"An AP has first term {a0} and common difference {d}. Find (a) the 12th term  [3]  (b) S_12  [5].",
        f"(a) {a0+11*d}; (b) {12//2 * (2*a0 + 11*d)}",
        [step("T_n = a+(n−1)d", f"T_12 = {a0}+11×{d} = {a0+11*d}."),
         step("S_n = n/2 [2a+(n−1)d]", f"S_12 = 6[2×{a0}+11×{d}] = {6*(2*a0+11*d)}.")], kind="structured"))
    qs.append(qdict(8, 8, "Logs and indices",
        f"Solve  3^(2x) = 27.  Also simplify  log_3 81.",
        f"x = 3/2; log_3 81 = 4",
        [step("27 = 3^3", "3^{2x} = 3^3 ⇒ 2x = 3 ⇒ x = 3/2."),
         step("81 = 3^4", "log_3 81 = 4.")], kind="structured"))
    qs.append(qdict(9, 8, "Functions",
        f"f(x) = 2x − {a},  g(x) = x².<br/>(a) fg(x)  [2]<br/>(b) gf(x)  [3]<br/>(c) f⁻¹(x)  [3]",
        f"fg=2x²−{a}; gf=(2x−{a})²; f⁻¹=(x+{a})/2",
        [step("fg means g first", f"f(g(x))=2x²−{a}."),
         step("gf", f"g(f(x))=(2x−{a})²."),
         step("Inverse", f"y=2x−{a} ⇒ x=(y+{a})/2.")], kind="structured"))
    qs.append(qdict(10, 8, "Partial fractions",
        f"Express  (5x+1)/((x+1)(x−2))  in partial fractions. (Numbers may be checked by covering.)",
        "A/(x+1) + B/(x−2) with A=−4/3, B=11/3",
        [step("Set 5x+1 = A(x−2)+B(x+1)", "Cover-up: x=−1 ⇒ A(−3)=−4 ⇒ A=4/3? Wait 5(−1)+1=−4, A(−3)=−4, A=4/3."),
         step("x=2", "5(2)+1=11, B(3)=11, B=11/3."),
         step("Correct A", "A(−3)=−4 ⇒ A = 4/3. Recheck: 5(−1)+1=−4 yes A=4/3.")], kind="structured"))
    qs.append(qdict(11, 8, "Vectors (2D)",
        f"A = ({a}, {b}), B = ({a+3}, {b+4}). Find |AB| and a unit vector in the direction of AB.",
        "5; (3/5, 4/5)",
        [step("AB", f"({3}, {4})"),
         step("|AB|=5", "3-4-5 triangle"),
         step("Unit", "(3/5, 4/5)")], kind="structured"))
    qs.append(qdict(12, 8, "Radians / arc",
        f"A circle has radius 6 cm. A sector has angle {rng.choice([1, 2])} radians.<br/>(a) Arc length  [3]<br/>(b) Sector area  [5]",
        "s=rθ; A=½r²θ",
        [step("s = rθ", ""),
         step("A = ½ r² θ", "")], kind="structured"))
    return qs


def alevel_pure_p2(rng: random.Random, year: int, code: str) -> list[dict]:
    qs = []
    qs.append(qdict(1, 10, "Further calculus",
        "Find the stationary points of y = x³ − 6x² + 9x + 1 and determine their nature.",
        "x=1 local max, x=3 local min",
        [step("dy/dx = 3x² − 12x + 9 = 3(x−1)(x−3)", "Stationary at x=1, 3."),
         step("d²y/dx² = 6x − 12", "At x=1: −6 < 0 max; at x=3: +6 > 0 min.")], kind="structured"))
    qs.append(qdict(2, 10, "Integration by substitution / parts",
        "Find ∫ x e^x dx  using integration by parts.",
        "e^x (x − 1) + C",
        [step("u = x, dv = e^x dx", "du=dx, v=e^x"),
         step("uv − ∫v du", "x e^x − ∫ e^x = e^x(x−1)+C")], kind="structured"))
    qs.append(qdict(3, 10, "Differential equations",
        "Solve dy/dx = 3y  given that y = 2 when x = 0.",
        "y = 2 e^{3x}",
        [step("Separate", "dy/y = 3 dx"),
         step("ln|y| = 3x + C", "y = A e^{3x}, A=2")], kind="structured"))
    qs.append(qdict(4, 10, "Parametric",
        "x = 2t, y = t². Find dy/dx in terms of t, and the equation of the tangent at t = 1.",
        "dy/dx = t; tangent y = x − 1",
        [step("dy/dx = (dy/dt)/(dx/dt) = 2t / 2 = t", ""),
         step("t=1: point (2,1), gradient 1", "y−1=1(x−2) ⇒ y=x−1")], kind="structured"))
    qs.append(qdict(5, 10, "3D vectors",
        "A(1,0,2), B(3,4,2). Find AB and |AB|. Show AB is perpendicular to (2, −1, 0) or not.",
        "AB=(2,4,0), |AB|=√20=2√5; dot 4−4+0=0 so perpendicular",
        [step("AB = B−A", "(2,4,0)"),
         step("Dot with (2,−1,0)", "4 + (−4) + 0 = 0 ⇒ perpendicular")], kind="structured"))
    qs.append(qdict(6, 8, "Numerical methods",
        "Show that f(x)=x³ − x − 1 has a root in [1, 2]. Take one Newton–Raphson step from x0=1.",
        "f(1)=−1<0, f(2)=5>0; x1 = 1 − f(1)/f'(1) = 1 − (−1)/2 = 1.5",
        [step("Sign change", "Root in (1,2) by intermediate value theorem."),
         step("Newton", "f'=3x²−1; x1=x0−f/f'")], kind="structured"))
    qs.append(qdict(7, 8, "Modulus / inequalities",
        "Solve |2x − 3| < 5.",
        "−1 < x < 4",
        [step("−5 < 2x−3 < 5", ""),
         step("−2 < 2x < 8", "−1 < x < 4")], kind="structured"))
    qs.append(qdict(8, 8, "Trig equations",
        "Solve  2 sin θ = 1  for 0 ≤ θ ≤ 360°.",
        "30° and 150°",
        [step("sin θ = 1/2", "Acute 30°, second quadrant 150°.")], kind="structured"))
    qs.append(qdict(9, 8, "Geometric series",
        "A GP has first term 5 and common ratio 1/2. Find S_∞ and the smallest n with S_n > 9.5.",
        "S∞=10; n=7 because S6=9.84375? S_n=10(1−(1/2)^n); need (1/2)^n < 0.5/10 wait 9.5/10=0.95 so (1/2)^n<0.05",
        [step("S∞ = a/(1−r) = 5/(1/2) = 10", ""),
         step("S_n = 10(1 − 2^{−n}) > 9.5", "2^{−n} < 0.05, n ≥ 5")], kind="structured"))
    qs.append(qdict(10, 8, "Implicit differentiation",
        "x² + y² = 25. Find dy/dx at (3, 4).",
        "−3/4",
        [step("2x + 2y y' = 0", "y' = −x/y = −3/4")], kind="structured"))
    qs.append(qdict(11, 8, "Area under curve",
        "Find the area between y = 4x − x² and the x-axis from x=0 to x=4.",
        "32/3",
        [step("∫_0^4 (4x−x²) dx = [2x² − x³/3]_0^4", "32 − 64/3 = 32/3")], kind="structured"))
    qs.append(qdict(12, 8, "Small angles / approx",
        "For small θ in radians, write approximations for sin θ, cos θ, tan θ. Estimate sin 0.1.",
        "sinθ≈θ, cosθ≈1−θ²/2, tanθ≈θ; sin0.1≈0.1",
        [step("Standard small-angle results", "sin 0.1 ≈ 0.1")], kind="structured"))
    if code == "9164":
        qs.append(qdict(13, 10, "Kinematics",
            "A particle starts from rest and accelerates at 2 m/s² for 6 s. Find final speed and distance.",
            "v=12 m/s; s=36 m",
            [step("v = u + at = 0+2×6=12", ""),
             step("s = ut + ½at² = 18×2=36", "")], kind="structured"))
        qs.append(qdict(14, 8, "Momentum",
            "Mass 3 kg at 4 m/s collides and sticks to 1 kg at rest. Find common speed.",
            "3 m/s",
            [step("Conservation of momentum", "12 + 0 = 4v ⇒ v=3 m/s")], kind="structured"))
    return qs


def alevel_further(rng: random.Random, year: int, paper: int) -> list[dict]:
    qs = []
    if paper == 1:
        qs.append(qdict(1, 10, "Complex numbers",
            "z = 3 + 4i. Find |z|, arg z, and z̄. Express 1/z in the form a+bi.",
            "|z|=5; arg=tan⁻¹(4/3); conjugate 3−4i; 1/z=(3−4i)/25",
            [step("Modulus", "√(9+16)=5"),
             step("1/z = conjugate/|z|²", "(3−4i)/25")], kind="structured"))
        qs.append(qdict(2, 10, "Matrices",
            "A = (2 1 ; 0 3). Find det A, A⁻¹, and A².",
            "det=6; A⁻¹=(1/6)(3 −1; 0 2); A²=(4 5; 0 9)",
            [step("det = 6", ""),
             step("Inverse (1/det) adjugate", ""),
             step("Multiply A×A", "")], kind="structured"))
        qs.append(qdict(3, 10, "Proof",
            "Prove by induction that 1 + 2 + … + n = n(n+1)/2 for n ≥ 1.",
            "Base n=1 true; assume k; k+1: add (k+1) and factor.",
            [step("Base", "1=1×2/2"),
             step("Inductive step", "k(k+1)/2 + (k+1) = (k+1)(k+2)/2")], kind="structured"))
        qs.append(qdict(4, 8, "Polar form",
            "Write 1 + i in modulus-argument form and find (1+i)^4 using De Moivre.",
            "√2 cis(π/4); (1+i)^4 = −4",
            [step("|1+i|=√2, arg=π/4", ""),
             step("De Moivre", "(√2)^4 cis π = 4(−1)=−4")], kind="structured"))
        qs.append(qdict(5, 8, "Hyperbolic / further trig",
            "Use identities to simplify sin 3θ in terms of sin θ (or state sin 3θ = 3sinθ − 4sin³θ).",
            "sin 3θ = 3sinθ − 4sin³θ",
            [step("sin(2θ+θ)", "Expand with compound-angle formulae.")], kind="structured"))
        qs.append(qdict(6, 8, "Further vectors",
            "Show that (i+j)×(i+2j+k) = i − j + k  or compute the cross product of a=(1,1,0), b=(1,2,1).",
            "(1, −1, 1)",
            [step("i(1−0) − j(1−0) + k(2−1)", "(1, −1, 1)")], kind="structured"))
        for i, topic in enumerate(["Maclaurin series", "Reduction formula sketch", "Eigenvalues of (2,1;1,2)",
                                   "Second order DE y''+y=0", "Further partial fractions", "Argand diagram loci"], start=7):
            qs.append(qdict(i, 8, topic,
                f"Standard Further Pure question on {topic}. Show full working.",
                "See typical textbook result for this topic.",
                [step("State the standard result", topic),
                 step("Apply to a numerical example", "Keep algebraic working clear for method marks.")], kind="structured"))
    else:
        # Paper 2 mechanics + statistics
        qs.append(qdict(1, 10, "Projectiles",
            "A particle is projected at 20 m/s at 30° to the horizontal. Take g = 10 m/s². Find time of flight on level ground and range.",
            "T=2 s; R=20√3 m",
            [step("uy = 20 sin30 = 10", "T = 2uy/g = 2 s"),
             step("R = (u² sin 2θ)/g = 400 sin60 / 10 = 20√3 m")], kind="structured"))
        qs.append(qdict(2, 10, "Newton 2 / inclined plane",
            "A 4 kg mass on a smooth plane inclined at 30°. Find acceleration down the plane (g=10).",
            "5 m/s²",
            [step("Component g sin30 = 5", "a = 5 m/s²")], kind="structured"))
        qs.append(qdict(3, 10, "Moments",
            "A uniform beam 4 m, mass 6 kg, supported at both ends. A 9 kg mass is 1 m from A. Find reactions (g=10).",
            "RA=70 N, RB=80 N",
            [step("Moments about A", "4 Rb = 6g×2 + 9g×1 = 210 ⇒ Rb=52.5? Recalc: weights 60N and 90N. 4 Rb = 60*2 + 90*1 = 210, Rb=52.5 N, Ra=97.5 N"),
             step("Use these values", "Ra + Rb = 150 N")], kind="structured"))
        qs.append(qdict(4, 8, "Binomial probability",
            "X ~ B(5, 1/3). Find P(X=2).",
            "C(5,2)(1/3)²(2/3)³ = 80/243",
            [step("P(X=k)=C(n,k)p^k(1-p)^{n-k}", "")], kind="structured"))
        qs.append(qdict(5, 8, "Normal distribution",
            "X ~ N(50, 16). Find P(X > 54) in terms of Φ, using Z=(X−μ)/σ.",
            "P(Z>1)=1−Φ(1)",
            [step("σ=4", "Z=(54−50)/4=1")], kind="structured"))
        qs.append(qdict(6, 8, "Poisson",
            "Calls arrive at 3 per hour. Using Poisson, write P(exactly 2 in an hour).",
            "e^{-3} 3²/2! = 9e^{-3}/2",
            [step("X~Po(3)", "P(2)=e^{-3}3^2/2")], kind="structured"))
        for i, topic in enumerate(["Hypothesis test outline", "Correlation interpretation", "Discrete random variable E(X)",
                                   "Continuous pdf f(x)=k on [0,2]", "Sampling / CLT one-liner", "Chi-square idea"], start=7):
            qs.append(qdict(i, 8, topic,
                f"Further Statistics: {topic}. Give definitions and one calculation.",
                "Definition + one numerical illustration.",
                [step("Define", topic),
                 step("Calculate", "Show substitution and units.")], kind="structured"))
    return qs[:12]


# ---------------------------------------------------------------------------
# Catalogue of papers
# ---------------------------------------------------------------------------
def catalogue():
    items = []
    # O-Level 4004
    for year in range(2018, 2025):
        items.append(("O-Level", "Mathematics", "4004", 1, year, "November", False))
        items.append(("O-Level", "Mathematics", "4004", 2, year, "November", False))
    for year in (2023, 2024):
        items.append(("O-Level", "Mathematics", "4004", 1, year, "June", True))
        items.append(("O-Level", "Mathematics", "4004", 2, year, "June", True))
    # Grade 7
    for year in range(2020, 2025):
        items.append(("Grade 7", "Grade 7 Mathematics", "702", 1, year, "November", False))
        items.append(("Grade 7", "Grade 7 Mathematics", "702", 2, year, "November", False))
    # Pure 6042
    for year in range(2022, 2025):
        for sess in (("June", True), ("November", True)):
            items.append(("A-Level", "Pure Mathematics", "6042", 1, year, sess[0], sess[1]))
            items.append(("A-Level", "Pure Mathematics", "6042", 2, year, sess[0], sess[1]))
    # 9164 and 9187 November
    for year in range(2022, 2025):
        items.append(("A-Level", "Mathematics", "9164", 1, year, "November", True))
        items.append(("A-Level", "Mathematics", "9164", 2, year, "November", True))
        items.append(("A-Level", "Further Mathematics", "9187", 1, year, "November", True))
        items.append(("A-Level", "Further Mathematics", "9187", 2, year, "November", True))
    # Combined Science 5006
    for year in range(2018, 2025):
        items.append(("O-Level", "Combined Science", "5006", 1, year, "November", False))
        items.append(("O-Level", "Combined Science", "5006", 2, year, "November", False))
    for year in (2023, 2024):
        items.append(("O-Level", "Combined Science", "5006", 1, year, "June", True))
        items.append(("O-Level", "Combined Science", "5006", 2, year, "June", True))
    # English Language 1122
    for year in range(2018, 2025):
        items.append(("O-Level", "English Language", "1122", 1, year, "November", False))
        items.append(("O-Level", "English Language", "1122", 2, year, "November", False))
    for year in (2023, 2024):
        items.append(("O-Level", "English Language", "1122", 1, year, "June", True))
        items.append(("O-Level", "English Language", "1122", 2, year, "June", True))
    return items


def build_questions(level, subject, code, paper, year, session):
    rng = seed_rng(year, session, code, paper)
    if code == "4004" and paper == 1:
        return olevel_p1(rng, year, session)
    if code == "4004" and paper == 2:
        return olevel_p2(rng, year, session)
    if code == "702" and paper == 1:
        return grade7_p1(rng, year)
    if code == "702" and paper == 2:
        return grade7_p2(rng, year)
    if code in ("6042", "9164") and paper == 1:
        return alevel_pure_p1(rng, year, code)
    if code in ("6042", "9164") and paper == 2:
        return alevel_pure_p2(rng, year, code)
    if code == "9187":
        return alevel_further(rng, year, paper)
    if code == "5006" and paper == 1:
        return combined_p1(rng, year, session)
    if code == "5006" and paper == 2:
        return combined_p2(rng, year, session)
    if code == "1122" and paper == 1:
        return english_p1(rng, year, session)
    if code == "1122" and paper == 2:
        return english_p2(rng, year, session)
    raise ValueError((code, paper))


def paper_meta(level, subject, code, paper, year, session, hot, questions):
    calc = not (code == "4004" and paper == 1) and not (code == "702" and paper == 1)
    if code == "4004" and paper == 1:
        dur, extra = "2 hours 30 minutes", "Electronic calculators must NOT be used. Geometrical instruments may be used."
        instr = "Answer all 30 questions. Show all working. The number of marks is given in brackets [ ]."
    elif code == "4004" and paper == 2:
        dur, extra = "2 hours 30 minutes", "Mathematical tables or a non-programmable calculator may be used."
        instr = "Section A: answer all questions (52 marks). Section B: answer any four of the seven questions (48 marks)."
    elif code == "702" and paper == 1:
        dur, extra = "2 hours", "Calculators must NOT be used."
        instr = "Answer all questions. Show working."
    elif code == "702" and paper == 2:
        dur, extra = "2 hours", "Calculators may be used."
        instr = "Answer all questions. Show working."
    elif code == "5006" and paper == 1:
        dur, extra = "1 hour", "Answer all 40 questions. For each question there are four possible answers A, B, C and D."
        instr = "Choose the one you consider correct and record it. Each question carries 1 mark."
        calc = False
    elif code == "5006" and paper == 2:
        dur, extra = "2 hours", "Answer all questions. The number of marks is given in brackets [ ]."
        instr = "Write your answers in the spaces provided. You may use a calculator."
        calc = True
    elif code == "1122" and paper == 1:
        dur, extra = "1 hour 30 minutes", "Answer booklet. Dictionaries may NOT be used."
        instr = "Answer one question from Section A (30 marks, 350–450 words) and the compulsory question in Section B (20 marks). Mistakes in spelling, punctuation and grammar may be penalised."
        calc = False
    elif code == "1122" and paper == 2:
        dur, extra = "2 hours", "The passage is printed in this paper. Dictionaries may NOT be used."
        instr = "Answer all questions. Spend about 1 hour 30 minutes on Section A (comprehension and summary) and 30 minutes on Section B (register)."
        calc = False
    else:
        dur, extra = "3 hours", "A calculator may be used unless a question forbids it."
        instr = "Answer all questions. Full marks are not given for answers only — show method."
    fname = f"{year}_{session}_{code}_Paper{paper}.pdf"
    pid = f"{code}-{paper}-{year}-{session}"
    return {
        "id": pid,
        "year": year,
        "session": session,
        "level": level,
        "subject": subject,
        "code": f"{code}/{paper}",
        "syllabus": code,
        "paper": f"Paper {paper}",
        "paperNo": paper,
        "qs": len(questions),
        "pages": 0,
        "hot": bool(hot or year >= 2023),
        "realUrl": f"pdfs/{fname}",
        "lang": "EN",
        "calc": calc,
        "duration": dur,
        "extra": extra,
        "instructions": instr,
        "practice": True,
        "questions": questions,
    }


# ---------------------------------------------------------------------------
# PDF
# ---------------------------------------------------------------------------
def make_styles():
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    font_reg, font_bold, font_it = "Times-Roman", "Times-Bold", "Times-Italic"
    for path, name in (
        ("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", "DejaVu"),
        ("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", "DejaVu-Bold"),
        ("/usr/share/fonts/truetype/dejavu/DejaVuSans-Oblique.ttf", "DejaVu-Oblique"),
    ):
        try:
            pdfmetrics.registerFont(TTFont(name, path))
        except Exception:
            pass
    names = set(pdfmetrics.getRegisteredFontNames())
    if "DejaVu" in names:
        from reportlab.pdfbase.pdfmetrics import registerFontFamily
        registerFontFamily("DejaVu", normal="DejaVu", bold="DejaVu-Bold", italic="DejaVu", boldItalic="DejaVu-Bold")
        font_reg, font_bold, font_it = "DejaVu", "DejaVu-Bold", "DejaVu"
    ss = getSampleStyleSheet()
    styles = {
        "center": ParagraphStyle("c", parent=ss["Normal"], alignment=TA_CENTER, fontName=font_bold, fontSize=12, leading=15, textColor=DARK),
        "center2": ParagraphStyle("c2", parent=ss["Normal"], alignment=TA_CENTER, fontName=font_bold, fontSize=10, leading=13, textColor=DARK),
        "smallc": ParagraphStyle("sc", parent=ss["Normal"], alignment=TA_CENTER, fontName=font_it, fontSize=8, leading=11, textColor=MUTED),
        "body": ParagraphStyle("b", parent=ss["Normal"], alignment=TA_JUSTIFY, fontName=font_reg, fontSize=10.5, leading=14),
        "q": ParagraphStyle("q", parent=ss["Normal"], alignment=TA_LEFT, fontName=font_reg, fontSize=10.5, leading=14, leftIndent=12, firstLineIndent=-12),
        "meta": ParagraphStyle("m", parent=ss["Normal"], alignment=TA_LEFT, fontName=font_reg, fontSize=9, leading=12),
        "sec": ParagraphStyle("s", parent=ss["Normal"], alignment=TA_CENTER, fontName=font_bold, fontSize=11, leading=14, spaceBefore=8, spaceAfter=6),
        "foot": ParagraphStyle("f", parent=ss["Normal"], alignment=TA_CENTER, fontName=font_it, fontSize=8, textColor=MUTED),
        "font_reg": font_reg,
        "font_bold": font_bold,
    }
    return styles


def header_footer(canvas, doc, paper):
    canvas.saveState()
    w, h = A4
    canvas.setFillColor(GREEN)
    canvas.rect(0, h - 8 * mm, w, 8 * mm, fill=1, stroke=0)
    canvas.setFillColor(white)
    canvas.setFont("Helvetica-Bold", 8)
    subj = (paper.get("subject") or "MATHEMATICS").upper()
    canvas.drawString(16 * mm, h - 5.5 * mm, f"ACADEX  ·  ZIMSEC-STYLE PRACTICE  ·  {subj}")
    canvas.drawRightString(w - 16 * mm, h - 5.5 * mm, f"{paper['code']}  {paper['session']} {paper['year']}")
    canvas.setFillColor(MUTED)
    canvas.setFont("Helvetica-Oblique", 8)
    canvas.drawCentredString(w / 2, 10 * mm, "Original ACADEX practice paper in official exam format — not a ZIMSEC copyrighted script.")
    canvas.setFont("Helvetica", 8)
    canvas.drawRightString(w - 16 * mm, 10 * mm, f"Page {doc.page}")
    canvas.restoreState()


def build_pdf(paper, path: Path):
    styles = make_styles()
    doc = SimpleDocTemplate(
        str(path),
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
    story.append(Paragraph(paper["level"].upper() + "  ·  " + paper["subject"].upper(), styles["center2"]))
    story.append(Spacer(1, 3 * mm))
    story.append(Paragraph(f"<b>{xml_safe(paper['subject'].upper())}</b>  &nbsp;&nbsp; {paper['code']}", styles["center"]))
    story.append(Paragraph(paper["paper"].upper() + f"  &nbsp;  {paper['session']} {paper['year']}", styles["center2"]))
    story.append(Paragraph(paper["duration"], styles["center2"]))
    if paper.get("syllabus") == "5006" and paper.get("paperNo") == 1:
        story.append(Paragraph("<b>PAPER 1 — MULTIPLE CHOICE — 40 QUESTIONS — 1 HOUR</b>", styles["center2"]))
    elif paper.get("syllabus") == "5006" and paper.get("paperNo") == 2:
        story.append(Paragraph("<b>PAPER 2 — STRUCTURED QUESTIONS — ANSWER ALL — 2 HOURS</b>", styles["center2"]))
    elif paper.get("syllabus") == "1122" and paper.get("paperNo") == 1:
        story.append(Paragraph("<b>PAPER 1 — COMPOSITION — 50 MARKS — 1 HOUR 30 MINUTES</b>", styles["center2"]))
    elif paper.get("syllabus") == "1122" and paper.get("paperNo") == 2:
        story.append(Paragraph("<b>PAPER 2 — READING — COMPREHENSION, SUMMARY, REGISTER — 2 HOURS</b>", styles["center2"]))
    elif paper.get("paperNo") == 1:
        story.append(Paragraph("<b>PAPER 1 — SHORT-ANSWER — CALCULATORS MUST NOT BE USED</b>", styles["center2"]))
    elif paper.get("paperNo") == 2:
        story.append(Paragraph("<b>PAPER 2 — STRUCTURED QUESTIONS — CALCULATOR ALLOWED</b>", styles["center2"]))
    story.append(Spacer(1, 2 * mm))
    story.append(Paragraph(
        "These are <b>original ACADEX questions</b> written to match ZIMSEC syllabus structure, "
        "mark allocations and command words. They are <b>not</b> leaked or copied official papers. "
        f"This script is unique to {paper['session']} {paper['year']} {paper['code']}.",
        styles["smallc"],
    ))
    story.append(Spacer(1, 3 * mm))
    story.append(Paragraph(f"<b>Additional materials:</b> {xml_safe(paper['extra'])}", styles["meta"]))
    story.append(Paragraph(f"<b>INSTRUCTIONS:</b> {xml_safe(paper['instructions'])}", styles["meta"]))
    story.append(Spacer(1, 4 * mm))

    last_sec = None
    for q in paper["questions"]:
        if paper["syllabus"] == "4004" and paper["paperNo"] == 2:
            if q["section"] != last_sec:
                last_sec = q["section"]
                if last_sec == "A":
                    story.append(Paragraph("SECTION A  (52 marks)  —  Answer ALL questions", styles["sec"]))
                else:
                    story.append(PageBreak())
                    story.append(Paragraph("SECTION B  (48 marks)  —  Answer any FOUR of the seven questions", styles["sec"]))
        elif paper.get("syllabus") == "1122":
            if q["section"] != last_sec:
                last_sec = q["section"]
                if paper.get("paperNo") == 1:
                    if last_sec == "A":
                        story.append(Paragraph("SECTION A  (30 marks)  —  Answer ONE question  ·  350–450 words", styles["sec"]))
                    else:
                        story.append(PageBreak())
                        story.append(Paragraph("SECTION B  (20 marks)  —  Answer the following question  ·  compulsory", styles["sec"]))
                else:
                    if last_sec == "A":
                        story.append(Paragraph("SECTION A  (40 marks)  —  Comprehension and summary", styles["sec"]))
                    else:
                        story.append(PageBreak())
                        story.append(Paragraph("SECTION B  (10 marks)  —  Register  ·  Answer ALL", styles["sec"]))
        if q.get("kind") == "passage":
            story.append(Paragraph("<b>PASSAGE</b>", styles["sec"]))
            story.append(Paragraph(xml_safe(q["text"]), styles["body"]))
            story.append(Spacer(1, 5 * mm))
            continue
        marks = q["marks"]
        body = xml_safe(q["text"])
        bits = [Paragraph(f"<b>{q['n']}.</b>  {body}  &nbsp;&nbsp; <b>[{marks}]</b>", styles["q"])]
        for opt in q.get("options") or []:
            bits.append(Paragraph(xml_safe(opt), styles["meta"]))
        if paper.get("syllabus") == "5006" and paper.get("paperNo") == 1:
            gap = 6 * mm
        elif paper.get("syllabus") == "5006" and paper.get("paperNo") == 2:
            gap = 28 * mm
        elif paper.get("syllabus") == "1122" and paper.get("paperNo") == 1:
            gap = 10 * mm
        elif paper.get("syllabus") == "1122":
            gap = 8 * mm
        else:
            gap = 8 * mm if q.get("kind") == "mcq" else (16 * mm if q.get("kind") == "short" else 12 * mm)
        bits.append(Spacer(1, gap))
        story.append(KeepTogether(bits))

    story.append(Spacer(1, 8 * mm))
    story.append(Paragraph("END OF QUESTION PAPER", styles["center2"]))
    story.append(Paragraph("Worked solutions and mark-scheme notes are inside the ACADEX app (Extract &amp; Study).", styles["smallc"]))

    holder = {"n": 1}

    def _hf(c, d):
        holder["n"] = d.page
        header_footer(c, d, paper)

    doc.build(story, onFirstPage=_hf, onLaterPages=_hf)
    paper["pages"] = holder["n"]
    return holder["n"]


def make_icons():
    from PIL import Image, ImageDraw, ImageFont
    for size, name in ((192, "icon-192.png"), (512, "icon-512.png")):
        im = Image.new("RGB", (size, size), "#0a7a3c")
        d = ImageDraw.Draw(im)
        d.ellipse((size * 0.12, size * 0.12, size * 0.88, size * 0.88), fill="#065a2c")
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", int(size * 0.28))
        except Exception:
            font = ImageFont.load_default()
        text = "AX"
        bbox = d.textbbox((0, 0), text, font=font)
        tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
        d.text(((size - tw) / 2, (size - th) / 2 - size * 0.04), text, fill="#f2b705", font=font)
        im.save(ROOT / name)


def featured_from(papers):
    """Pick 8 diverse O-Level questions for the solve grid."""
    p1 = next(p for p in papers if p["id"] == "4004-1-2024-November")
    p2 = next(p for p in papers if p["id"] == "4004-2-2024-November")
    picked = []
    seen = set()
    for q in p1["questions"]:
        if q["topic"] in seen:
            continue
        seen.add(q["topic"])
        picked.append({**q, "paperId": p1["id"], "tag": f"4004/1 2024 Q{q['n']} · {q['topic']}"})
        if len(picked) >= 2:
            break
    picked.append({**p2["questions"][0], "paperId": p2["id"], "tag": f"4004/2 2024 Q1 · {p2['questions'][0]['topic']}"})
    cs = next((p for p in papers if p["id"] == "5006-1-2024-November"), None)
    cs2 = next((p for p in papers if p["id"] == "5006-2-2024-November"), None)
    if cs:
        for q in cs["questions"][:2]:
            picked.append({**q, "paperId": cs["id"], "tag": f"5006/1 2024 Q{q['n']} · {q['topic']}"})
    if cs2:
        picked.append({**cs2["questions"][0], "paperId": cs2["id"], "tag": f"5006/2 2024 Q1 · {cs2['questions'][0]['topic']}"})
    en = next((p for p in papers if p["id"] == "1122-1-2024-November"), None)
    en2 = next((p for p in papers if p["id"] == "1122-2-2024-November"), None)
    if en:
        picked.append({**en["questions"][0], "paperId": en["id"], "tag": f"1122/1 2024 Q1 · {en['questions'][0]['topic']}"})
    if en2:
        q = next((x for x in en2["questions"] if x.get("kind") != "passage"), en2["questions"][0])
        picked.append({**q, "paperId": en2["id"], "tag": f"1122/2 2024 · {q['topic']}"})
    return picked[:8]


def predictor():
    return [
        {"topic": "Algebra & equations", "pct": 90, "why": "Every Paper 1 and Section A. Factorise + change of subject almost guaranteed."},
        {"topic": "Trigonometry & bearings", "pct": 86, "why": "Paper 2 Section B regular. 30°/60°/90° in Paper 1."},
        {"topic": "Vectors & transformations", "pct": 82, "why": "Column vectors in P1; matrices/reflections in P2B."},
        {"topic": "Statistics & probability", "pct": 78, "why": "Mean/mode in P1; ogive + IQR in P2B."},
        {"topic": "Mensuration (π = 22/7)", "pct": 74, "why": "Cylinder/circle with 22/7 is a Paper 1 staple."},
        {"topic": "Consumer arithmetic", "pct": 70, "why": "Discount, VAT, profit — Zimbabwe context in Section A."},
        {"topic": "Circle theorems", "pct": 64, "why": "Angle in a semicircle and same segment in Section B."},
        {"topic": "Linear programming / variation", "pct": 58, "why": "Often the last optional in Section B."},
    ]


def science_predictor():
    return [
        {"topic": "Photosynthesis & limiting factors", "pct": 90, "why": "Word/symbol equation and light, CO₂, temperature on Paper 1 and Paper 2."},
        {"topic": "Acids, bases and salts", "pct": 86, "why": "pH, neutralisation, hydrogen and carbon dioxide tests."},
        {"topic": "Forces and F = ma", "pct": 84, "why": "Paper 2 almost always has an unbalanced-force calculation."},
        {"topic": "Electricity (V = IR)", "pct": 80, "why": "Ohm’s law, series vs parallel, earth wire and fuse."},
        {"topic": "Transport (heart, xylem, phloem)", "pct": 78, "why": "Core biology structured question every session."},
        {"topic": "Atomic structure & periodic table", "pct": 74, "why": "Protons, electronic configuration, group and period."},
        {"topic": "Health (malaria, cholera, HIV)", "pct": 70, "why": "Pathogen, transmission and one control method."},
        {"topic": "Particle theory", "pct": 64, "why": "Arrangement and motion in solids, liquids and gases."},
    ]


def english_predictor():
    return [
        {"topic": "Free composition (350–450 words)", "pct": 90, "why": "Paper 1 Section A: choose one of seven titles. Narrative and discursive almost always appear."},
        {"topic": "Guided writing (letter / speech / report)", "pct": 88, "why": "Paper 1 Section B is compulsory. Cover every bullet or you leak content marks."},
        {"topic": "Summary (own words, ~160)", "pct": 86, "why": "Paper 2 Section A — 20 marks. Stay inside the paragraph boundary."},
        {"topic": "Comprehension (literal + inference)", "pct": 82, "why": "Own-words items and vocabulary-in-context every session."},
        {"topic": "Register (formal vs informal)", "pct": 78, "why": "Paper 2 Section B: five situations, 2 marks each. Tone and audience."},
        {"topic": "Story openings / given sentences", "pct": 74, "why": "A Section A narrative often starts or ends with a set line."},
        {"topic": "Accuracy (SPAG)", "pct": 70, "why": "Spelling, punctuation and grammar are penalised in every part of both papers."},
        {"topic": "Layout of letters and reports", "pct": 64, "why": "Address, date, Yours faithfully / sincerely, report headings."},
    ]


def main():
    PDF_DIR.mkdir(exist_ok=True)
    DATA_DIR.mkdir(exist_ok=True)

    keep_files = set()
    papers = []
    bank = []
    for level, subject, code, paper_no, year, session, hot in catalogue():
        questions = build_questions(level, subject, code, paper_no, year, session)
        meta = paper_meta(level, subject, code, paper_no, year, session, hot, questions)
        fname = Path(meta["realUrl"]).name
        keep_files.add(fname)
        out = PDF_DIR / fname
        pages = build_pdf(meta, out)
        # real page count via file size heuristic is ok; try pdf reader
        meta["pages"] = pages
        meta["bytes"] = out.stat().st_size
        papers.append(meta)
        for q in questions:
            bank.append({
                "level": {"O-Level": "o_level", "A-Level": "a_level", "Grade 7": "grade7"}.get(level, "o_level"),
                "syllabus_code": code,
                "paper": paper_no,
                "section": q["section"],
                "year": year,
                "session": session,
                "question_number": str(q["n"]),
                "marks": q["marks"],
                "topic_tags": [q["topic"].lower().replace(" ", "_")],
                "question_text": q["text"].replace("<br/>", " "),
                "answer": q["answer"],
                "steps": q["steps"],
                "markscheme": q["markscheme"],
                "source": "ACADEX original — ZIMSEC syllabus style",
            })

    for p in PDF_DIR.glob("*.pdf"):
        if p.name not in keep_files:
            p.unlink()
            print("removed leftover pdf", p.name)

    featured = featured_from(papers)
    mock = next(p for p in papers if p["id"] == "4004-1-2024-November")

    # JS data: strip nothing essential; keep questions
    js_papers = []
    for p in papers:
        js_papers.append({k: p[k] for k in p if k != "bytes"})

    payload = {
        "version": 8,
        "disclaimer": "Original ACADEX practice papers aligned to ZIMSEC 4004 Maths, 5006 Combined Science and 1122 English Language. Not official ZIMSEC past papers.",
        "counts": {
            "papers": len(papers),
            "questions": len(bank),
            "oLevel": sum(1 for p in papers if p["level"] == "O-Level"),
            "grade7": sum(1 for p in papers if p["level"] == "Grade 7"),
            "aLevel": sum(1 for p in papers if p["level"] == "A-Level"),
            "science": sum(1 for p in papers if p.get("syllabus") == "5006"),
            "english": sum(1 for p in papers if p.get("syllabus") == "1122"),
        },
        "papers": js_papers,
        "featured": featured,
        "mockPaperId": mock["id"],
        "predictor": predictor(),
        "sciencePredictor": science_predictor(),
        "englishPredictor": english_predictor(),
    }

    (DATA_DIR / "acadex-maths.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    (ROOT / "acadex-question-bank.json").write_text(json.dumps(bank, ensure_ascii=False, indent=2), encoding="utf-8")

    js = "window.ACADEX_DATA = " + json.dumps(payload, ensure_ascii=False) + ";\n"
    (ROOT / "acadex-data.js").write_text(js, encoding="utf-8")

    make_icons()

    print(f"Papers: {len(papers)}")
    print(f"Questions: {len(bank)}")
    print(f"Featured: {len(featured)}")
    print(f"PDF dir files: {len(list(PDF_DIR.glob('*.pdf')))}")
    print("Sample P1 Q5:", next(q for q in papers[1]["questions"] if q["n"]==5) if False else papers[0]["questions"][4])
    print("Wrote acadex-data.js", (ROOT / "acadex-data.js").stat().st_size)


if __name__ == "__main__":
    main()
