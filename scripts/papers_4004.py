"""Unique ZIMSEC 4004 Paper 1 / Paper 2 generators.
Paper 1 = 30 short, non-calculator, 100 marks.
Paper 2 = Section A 52 (all) + Section B 7×12 choose 4, calculator.
Each (year, session) picks different question TYPES, not only different numbers.
"""
from __future__ import annotations

import math
import random
from fractions import Fraction


def fmt(n) -> str:
    if isinstance(n, Fraction):
        if n.denominator == 1:
            return str(n.numerator)
        if abs(n.numerator) > n.denominator:
            whole = int(abs(n.numerator) // n.denominator)
            rem = abs(n.numerator) % n.denominator
            sign = "-" if n < 0 else ""
            if rem == 0:
                return f"{sign}{whole}"
            return f"{sign}{whole} {rem}/{n.denominator}"
        return f"{n.numerator}/{n.denominator}"
    if isinstance(n, float):
        if abs(n - round(n)) < 1e-9:
            return str(int(round(n)))
        return f"{n:.4f}".rstrip("0").rstrip(".")
    return str(n)


def qdict(n, marks, topic, text, answer, steps, section="A", markscheme=None, kind="short"):
    return {
        "n": n, "section": section, "marks": marks, "topic": topic, "text": text,
        "answer": answer if isinstance(answer, str) else fmt(answer),
        "steps": steps, "parts": [],
        "markscheme": markscheme or f"{marks} marks. Answer: {answer if isinstance(answer, str) else fmt(answer)}",
        "kind": kind,
    }


def step(t, d=""):
    return {"t": t, "d": d}


def flavour(year, session, rng):
    towns = {
        2018: ("Bulawayo", "Entumbane", "a crate of oranges"),
        2019: ("Mutare", "Sakubva", "a bunch of bananas"),
        2020: ("Gweru", "Mkoba", "a bag of potatoes"),
        2021: ("Masvingo", "Mucheke", "a 50 kg maize bag"),
        2022: ("Bindura", "Chipadze", "a crate of tomatoes"),
        2023: ("Chitungwiza", "Unit L", "a sack of onions"),
        2024: ("Harare", "Mbare Musika", "a crate of tomatoes"),
    }
    t = towns.get(year, towns[2024])
    if session == "June":
        t = (t[0], t[1], t[2].replace("crate", "box"))
    return {"town": t[0], "suburb": t[1], "goods": t[2],
            "school": rng.choice(["St Mary's", "Prince Edward", "Fletcher High", "Gifford High", "Moleli"])}


def _pad100(qs):
    total = sum(q["marks"] for q in qs)
    i = len(qs) - 1
    while total < 100 and i >= 0:
        qs[i]["marks"] += 1
        qs[i]["markscheme"] = f"{qs[i]['marks']} marks. Answer: {qs[i]['answer']}"
        total += 1
        i -= 1
    return qs


# ----- Paper 1 variant families (each returns one short question) -----
def p1_bodmas(rng, fl):
    a, b, c, d = rng.randint(2, 9), rng.randint(2, 8), rng.randint(2, 6), rng.randint(1, 7)
    val = a + b * c - d
    return qdict(0, 2, "Number operations",
        f"Evaluate  {a} + {b} × {c} − {d}.", val,
        [step("BODMAS — multiply first", f"{b} × {c} = {b*c}"),
         step("Then add/subtract", f"{a} + {b*c} − {d} = {val}")])


def p1_brackets(rng, fl):
    a, b, c = rng.randint(2, 6), rng.randint(2, 8), rng.randint(2, 5)
    val = (a + b) * c
    return qdict(0, 3, "Number operations",
        f"Insert one pair of brackets to make this true:  {a} + {b} × {c} = {val}. Write the corrected expression.",
        f"({a} + {b}) × {c} = {val}",
        [step("Without brackets", f"{a} + {b}×{c} = {a+b*c}, not {val}."),
         step("With brackets around the sum", f"({a}+{b})×{c} = {val}.")])


def p1_primes(rng, fl):
    n = rng.choice([36, 48, 60, 72, 84, 90, 96])
    # prime factorisation
    x, fac = n, []
    p = 2
    while x > 1:
        while x % p == 0:
            fac.append(p)
            x //= p
        p += 1 if p == 2 else 2
    s = " × ".join(map(str, fac))
    return qdict(0, 3, "Prime factors",
        f"Express {n} as a product of its prime factors.",
        s,
        [step("Divide by primes", f"{n} = {s}")])


def p1_directed(rng, fl):
    p, q = rng.randint(5, 14), rng.randint(6, 16)
    val = -p - (-q)
    return qdict(0, 2, "Directed numbers",
        f"Evaluate  −{p} − (−{q}).", val,
        [step("Minus a negative is plus", f"−{p} + {q} = {val}")])


def p1_temp(rng, fl):
    night, day = rng.randint(-4, 6), rng.randint(18, 32)
    return qdict(0, 2, "Directed numbers",
        f"Overnight in {fl['town']} the temperature was {night}°C. By 14:00 it was {day}°C. Find the rise.",
        f"{day-night}°C",
        [step("Rise = day − night", f"{day} − ({night}) = {day-night}°C")])


def p1_frac_add(rng, fl):
    f1 = Fraction(rng.choice([1, 2, 3]), rng.choice([3, 4, 5, 6]))
    f2 = Fraction(rng.choice([1, 2]), rng.choice([2, 3, 4, 5]))
    if f1.denominator == f2.denominator:
        f2 = Fraction(1, f1.denominator + 2)
    ans = f1 + f2
    return qdict(0, 3, "Fractions",
        f"Work out  {fmt(f1)} + {fmt(f2)}. Give a mixed number if possible.",
        ans,
        [step("Common denominator", f"{fmt(f1)} + {fmt(f2)} = {fmt(ans)}")])


def p1_frac_of(rng, fl):
    whole = rng.choice([24, 30, 36, 40, 48, 60])
    den = rng.choice([3, 4, 5, 6])
    while whole % den:
        whole += 1
    num = rng.choice([1, 2])
    if num >= den:
        num = 1
    ans = whole * num // den
    return qdict(0, 2, "Fractions",
        f"A tank in {fl['suburb']} holds {whole} litres. It is {num}/{den} full. How many litres are in the tank?",
        f"{ans} litres",
        [step(f"{num}/{den} of {whole}", f"{whole} ÷ {den} × {num} = {ans}")])


def p1_frac_div(rng, fl):
    a, b, c, d = 3, 4, 2, 5
    a, b = rng.choice([2, 3, 4]), rng.choice([3, 5, 7])
    c, d = rng.choice([1, 2]), rng.choice([2, 3, 4])
    ans = Fraction(a, b) / Fraction(c, d)
    return qdict(0, 3, "Fractions",
        f"Work out  {a}/{b} ÷ {c}/{d}.",
        ans,
        [step("Multiply by the reciprocal", f"{a}/{b} × {d}/{c} = {fmt(ans)}")])


def p1_percent_of(rng, fl):
    whole = rng.choice([40, 50, 80, 120, 200, 250])
    pct = rng.choice([10, 15, 20, 25, 30, 40])
    return qdict(0, 2, "Percentages",
        f"Find {pct}% of {whole}.",
        whole * pct // 100,
        [step("% means /100", f"{pct}/100 × {whole} = {whole*pct//100}")])


def p1_percent_increase(rng, fl):
    price = rng.choice([80, 100, 120, 200, 250])
    pct = rng.choice([10, 15, 20, 25])
    new = price * (100 + pct) // 100
    return qdict(0, 3, "Percentages",
        f"A school jersey costs ${price}. The price rises by {pct}%. Find the new price.",
        f"${new}",
        [step(f"Increase by {pct}%", f"{price} × {100+pct}/100 = {new}")])


def p1_percent_expr(rng, fl):
    part = rng.choice([12, 15, 18, 24, 30])
    whole = rng.choice([40, 50, 60, 80])
    ans = Fraction(part * 100, whole)
    return qdict(0, 2, "Percentages",
        f"Express {part} as a percentage of {whole}.",
        f"{fmt(ans)}%",
        [step("(part/whole)×100%", f"{part}/{whole} × 100% = {fmt(ans)}%")])


def p1_ratio_share(rng, fl):
    r1, r2 = rng.choice([2, 3, 4, 5]), rng.choice([3, 5, 7])
    while r1 == r2:
        r2 = rng.choice([3, 5, 7, 8])
    parts = r1 + r2
    share = rng.choice([12, 18, 24, 30, 36, 48, 60])
    while share % parts:
        share += 1
    one = share // parts
    return qdict(0, 3, "Ratio",
        f"Share ${share} in the ratio {r1} : {r2}.",
        f"${one*r1} and ${one*r2}",
        [step("Total parts", f"{parts} parts, one part = {one}"),
         step("Shares", f"{r1}×{one} = {one*r1}, {r2}×{one} = {one*r2}")])


def p1_ratio_map(rng, fl):
    r1, r2 = 2, 5
    r1, r2 = rng.choice([2, 3]), rng.choice([5, 7, 8])
    small = r1 * rng.choice([4, 5, 6])
    big = small * r2 // r1
    return qdict(0, 3, "Ratio",
        f"A map of {fl['town']} uses scale {r1} : {r2*100000}. A road is {small} cm on the map. Find the real length in km. (1 : 100 000 means 1 cm ↔ 1 km if {r1}:{r2} is first simplified — instead: scale {r1} cm to {r2} km.)",
        f"{small * r2 / r1:.0f} km" if (small * r2) % r1 == 0 else f"{fmt(Fraction(small*r2, r1))} km",
        [step(f"{r1} cm represents {r2} km", f"{small} cm → {small}×{r2}/{r1} = {fmt(Fraction(small*r2, r1))} km")])


def p1_hcf_lcm(rng, fl):
    x1 = rng.choice([12, 18, 24, 30, 36, 48])
    x2 = rng.choice([16, 20, 28, 42, 54])
    while x1 == x2:
        x2 += 6
    h = math.gcd(x1, x2)
    l = x1 * x2 // h
    return qdict(0, 3, "HCF and LCM",
        f"Find the HCF and LCM of {x1} and {x2}.",
        f"HCF = {h}, LCM = {l}",
        [step("HCF", f"gcd = {h}"), step("LCM = ab/HCF", f"{x1}×{x2}/{h} = {l}")])


def p1_stdform(rng, fl):
    k = rng.randint(2, 9)
    e = rng.choice([3, 4, 5, 6])
    if rng.random() < 0.5:
        return qdict(0, 2, "Standard form",
            f"Write {k * 10**e} in standard form.",
            f"{k} × 10^{e}",
            [step("a × 10^n with 1 ≤ a < 10", f"{k} × 10^{e}")])
    # other way
    return qdict(0, 2, "Standard form",
        f"Work out ({k} × 10^{e}) ÷ 10. Give the answer in standard form.",
        f"{k} × 10^{e-1}",
        [step("Divide by 10 = 10^1", f"{k} × 10^{e-1}")])


def p1_indices(rng, fl):
    base = rng.choice([2, 3, 4, 5])
    e1, e2 = rng.randint(2, 5), rng.randint(2, 4)
    if rng.random() < 0.5:
        return qdict(0, 2, "Indices",
            f"Simplify  {base}^{e1} × {base}^{e2}. Leave as a power of {base}.",
            f"{base}^{e1+e2}",
            [step("a^m × a^n = a^(m+n)", f"{base}^{e1+e2}")])
    return qdict(0, 2, "Indices",
        f"Simplify  ({base}^{e1})^{e2}. Leave as a power of {base}.",
        f"{base}^{e1*e2}",
        [step("(a^m)^n = a^(mn)", f"{base}^{e1*e2}")])


def p1_sets(rng, fl):
    nA, nB = rng.randint(10, 18), rng.randint(8, 16)
    both = rng.randint(2, min(6, nA, nB) - 1)
    if rng.random() < 0.5:
        union = nA + nB - both
        return qdict(0, 2, "Sets",
            f"n(A) = {nA}, n(B) = {nB}, n(A ∩ B) = {both}. Find n(A ∪ B).",
            union,
            [step("n(A∪B) = n(A)+n(B)−n(A∩B)", f"{nA}+{nB}−{both} = {union}")])
    onlyA = nA - both
    return qdict(0, 2, "Sets",
        f"In a class of {fl['school']}, n(A) = {nA} (play soccer), n(A ∩ B) = {both} (play both). How many play soccer only?",
        onlyA,
        [step("Soccer only = n(A) − n(A∩B)", f"{nA} − {both} = {onlyA}")])


def p1_expand(rng, fl):
    p, q, r = rng.randint(2, 6), rng.randint(1, 5), rng.randint(1, 6)
    return qdict(0, 2, "Algebra expand",
        f"Expand and simplify  {p}(x + {q}) − {r}x.",
        f"{p-r}x + {p*q}" if p != r else str(p * q),
        [step("Expand", f"{p}x + {p*q} − {r}x = {p-r}x + {p*q}")])


def p1_expand_foil(rng, fl):
    a, b = rng.randint(1, 4), rng.randint(1, 5)
    # (x+a)(x+b)
    return qdict(0, 3, "Algebra expand",
        f"Expand  (x + {a})(x + {b}).",
        f"x² + {a+b}x + {a*b}",
        [step("FOIL", f"x² + {b}x + {a}x + {a*b} = x² + {a+b}x + {a*b}")])


def p1_factor_linear(rng, fl):
    g = rng.choice([2, 3, 4, 5, 6])
    u, v = rng.randint(2, 7), rng.randint(1, 8)
    return qdict(0, 2, "Factorisation",
        f"Factorise completely  {g*u}x + {g*v}.",
        f"{g}({u}x + {v})",
        [step("HCF", f"{g}({u}x + {v})")])


def p1_factor_quad(rng, fl):
    r1, r2 = rng.choice([1, 2, 3, 4]), rng.choice([2, 3, 5, 6])
    return qdict(0, 3, "Quadratic factorisation",
        f"Factorise  x² + {r1+r2}x + {r1*r2}.",
        f"(x + {r1})(x + {r2})",
        [step("Numbers that multiply to c and add to b", f"{r1} and {r2}")])


def p1_factor_diffsq(rng, fl):
    a = rng.choice([2, 3, 4, 5, 6])
    return qdict(0, 3, "Difference of squares",
        f"Factorise  x² − {a*a}.",
        f"(x − {a})(x + {a})",
        [step("x² − a² = (x−a)(x+a)", f"a = {a}")])


def p1_linear(rng, fl):
    a = rng.choice([2, 3, 4, 5, 6])
    x = rng.randint(2, 9)
    b = rng.choice([1, 2, 3, 4, 5, 7])
    c = a * x + b
    return qdict(0, 2, "Linear equations",
        f"Solve  {a}x + {b} = {c}.",
        x,
        [step(f"Subtract {b}", f"{a}x = {c-b}"),
         step(f"Divide by {a}", f"x = {x}")])


def p1_linear_brackets(rng, fl):
    a = rng.choice([2, 3, 4, 5])
    b = rng.randint(1, 6)
    x = rng.randint(2, 8)
    c = a * (x + b)
    return qdict(0, 3, "Linear equations",
        f"Solve  {a}(x + {b}) = {c}.",
        x,
        [step("Expand or divide first", f"x + {b} = {c//a} ⇒ x = {x}")])


def p1_subject(rng, fl):
    if rng.random() < 0.5:
        return qdict(0, 3, "Change of subject",
            "Make h the subject of  A = 2πr(r + h).",
            "h = A/(2πr) − r",
            [step("Divide by 2πr", "A/(2πr) = r + h"),
             step("Subtract r", "h = A/(2πr) − r")])
    return qdict(0, 3, "Change of subject",
        "Make r the subject of  C = 2πr.",
        "r = C/(2π)",
        [step("Divide both sides by 2π", "r = C/(2π)")])


def p1_ineq(rng, fl):
    a = rng.choice([2, 3, 4])
    xsol = rng.randint(2, 6)
    b = rng.randint(1, 5)
    rhs = a * xsol + b
    return qdict(0, 2, "Inequalities",
        f"Solve  {a}x + {b} < {rhs}.",
        f"x < {xsol}",
        [step(f"Subtract {b}", f"{a}x < {rhs-b}"),
         step(f"Divide by {a}", f"x < {xsol}")])


def p1_simult(rng, fl):
    x, y = rng.randint(2, 6), rng.randint(1, 5)
    return qdict(0, 3, "Simultaneous equations",
        f"Solve<br/>x + y = {x+y}<br/>x − y = {x-y}.",
        f"x = {x}, y = {y}",
        [step("Add", f"2x = {2*x} ⇒ x = {x}"),
         step("Substitute", f"y = {y}")])


def p1_seq_nth(rng, fl):
    a0 = rng.randint(2, 8)
    d = rng.choice([2, 3, 4, 5])
    return qdict(0, 2, "Sequences",
        f"The nth term is {a0} + {d}(n − 1). Find the 8th term.",
        a0 + 7 * d,
        [step("n = 8", f"{a0} + {d}×7 = {a0+7*d}")])


def p1_seq_find_nth(rng, fl):
    a0 = rng.randint(3, 9)
    d = rng.choice([2, 3, 4])
    return qdict(0, 3, "Sequences",
        f"A sequence is {a0}, {a0+d}, {a0+2*d}, {a0+3*d}, … Find an expression for the nth term.",
        f"{a0} + {d}(n − 1)  or  {d}n + {a0-d}",
        [step("Common difference", f"d = {d}"),
         step("nth term = a + (n−1)d", f"{a0} + {d}(n−1)")])


def p1_triangle(rng, fl):
    ang1 = rng.randint(35, 70)
    ang2 = rng.randint(30, 70)
    ang3 = 180 - ang1 - ang2
    return qdict(0, 2, "Angles in a triangle",
        f"In triangle ABC, Â = {ang1}° and B̂ = {ang2}°. Find Ĉ.",
        f"{ang3}°",
        [step("Angle sum 180°", f"Ĉ = 180 − {ang1} − {ang2} = {ang3}°")])


def p1_parallel(rng, fl):
    a = rng.randint(40, 70)
    return qdict(0, 2, "Parallel lines",
        f"AB ∥ CD. A transversal makes an acute angle of {a}° with AB. Find the co-interior angle on CD.",
        f"{180-a}°",
        [step("Co-interior angles sum to 180°", f"{180-a}°")])


def p1_polygon(rng, fl):
    sides = rng.choice([5, 6, 8, 9, 10, 12])
    if rng.random() < 0.5:
        return qdict(0, 2, "Polygons",
            f"A regular polygon has {sides} sides. Find each exterior angle.",
            f"{360//sides}°",
            [step("360° / n", f"360/{sides} = {360//sides}°")])
    interior = ((sides - 2) * 180) // sides
    return qdict(0, 3, "Polygons",
        f"A regular polygon has {sides} sides. Find each interior angle.",
        f"{interior}°",
        [step("Interior = 180 − exterior", f"exterior {360//sides}°, interior {interior}°")])


def p1_pythag(rng, fl):
    trips = [(3, 4, 5), (5, 12, 13), (6, 8, 10), (8, 15, 17), (9, 12, 15)]
    k = rng.choice([1, 2])
    t = rng.choice(trips)
    aa, bb, cc = t[0] * k, t[1] * k, t[2] * k
    if rng.random() < 0.5:
        return qdict(0, 3, "Pythagoras",
            f"A right-angled triangle has shorter sides {aa} cm and {bb} cm. Find the hypotenuse.",
            f"{cc} cm",
            [step("c² = a² + b²", f"{aa}² + {bb}² = {cc}² ⇒ c = {cc} cm")])
    return qdict(0, 3, "Pythagoras",
        f"A ladder of length {cc} m leans against a wall. The foot is {aa} m from the wall. How far up the wall does it reach?",
        f"{bb} m",
        [step("b² = c² − a²", f"{cc}² − {aa}² = {bb}² ⇒ {bb} m")])


def p1_trig(rng, fl):
    hyp = rng.choice([8, 10, 12, 16])
    kind = rng.choice(["sin30", "cos60", "tan45"])
    if kind == "sin30":
        return qdict(0, 3, "Trigonometry",
            f"In right-angled triangle PQR, P̂ = 30° and hypotenuse PR = {hyp} cm. Find PQ, opposite 30°.",
            f"{hyp//2} cm",
            [step("sin 30° = 1/2", f"PQ = {hyp}/2 = {hyp//2} cm")])
    if kind == "cos60":
        return qdict(0, 3, "Trigonometry",
            f"In right-angled triangle XYZ, X̂ = 60° and hypotenuse XZ = {hyp} cm. Find XY, adjacent to 60°.",
            f"{hyp//2} cm",
            [step("cos 60° = 1/2", f"XY = {hyp}/2 = {hyp//2} cm")])
    adj = rng.choice([6, 8, 10, 12])
    return qdict(0, 3, "Trigonometry",
        f"tan 45° = 1. In a right-angled triangle the adjacent side to 45° is {adj} cm. Find the opposite side.",
        f"{adj} cm",
        [step("tan 45° = opp/adj = 1", f"opp = {adj} cm")])


def p1_area_tri(rng, fl):
    b, h = rng.choice([6, 8, 10, 12, 14]), rng.choice([5, 7, 9, 11])
    return qdict(0, 2, "Mensuration (area)",
        f"A triangular plot has base {b} m and perpendicular height {h} m. Find its area.",
        f"{fmt(Fraction(b*h,2))} m²",
        [step("½bh", f"½×{b}×{h} = {fmt(Fraction(b*h,2))} m²")])


def p1_circle(rng, fl):
    r = rng.choice([7, 14, 21])
    if rng.random() < 0.5:
        area = Fraction(22, 7) * r * r
        return qdict(0, 3, "Circle",
            f"Area of a circle radius {r} cm. Take π = 22/7.",
            f"{fmt(area)} cm²",
            [step("πr²", f"22/7 × {r}² = {fmt(area)} cm²")])
    circ = Fraction(22, 7) * 2 * r
    return qdict(0, 3, "Circle",
        f"Circumference of a circle radius {r} cm. Take π = 22/7.",
        f"{fmt(circ)} cm",
        [step("2πr", f"2 × 22/7 × {r} = {fmt(circ)} cm")])


def p1_volume(rng, fl):
    if rng.random() < 0.5:
        L, W, H = rng.randint(5, 12), rng.randint(3, 8), rng.randint(2, 7)
        return qdict(0, 2, "Volume",
            f"A cuboid water tank measures {L} m by {W} m by {H} m. Find its volume.",
            f"{L*W*H} m³",
            [step("lwh", f"{L}×{W}×{H} = {L*W*H} m³")])
    h = rng.choice([3, 4, 5, 6, 10])
    vol = Fraction(22, 7) * 7 * 7 * h
    return qdict(0, 3, "Volume of cylinder",
        f"A cylindrical drum has radius 7 cm and height {h} cm. Find its volume. π = 22/7.",
        f"{fmt(vol)} cm³",
        [step("πr²h", f"22/7 × 49 × {h} = {fmt(vol)} cm³")])


def p1_gradient(rng, fl):
    x1, y1 = rng.randint(1, 5), rng.randint(1, 6)
    dx, dy = rng.choice([2, 3, 4]), rng.choice([2, 4, 6, 8])
    x2, y2 = x1 + dx, y1 + dy
    return qdict(0, 2, "Coordinate geometry",
        f"Find the gradient of the line joining ({x1}, {y1}) and ({x2}, {y2}).",
        fmt(Fraction(dy, dx)),
        [step("m = (y2−y1)/(x2−x1)", f"{dy}/{dx} = {fmt(Fraction(dy, dx))}")])


def p1_midpoint(rng, fl):
    x1, y1 = rng.randint(0, 6), rng.randint(0, 8)
    x2, y2 = rng.randint(2, 10), rng.randint(2, 10)
    return qdict(0, 2, "Midpoint",
        f"Find the midpoint of ({x1}, {y1}) and ({x2}, {y2}).",
        f"({fmt(Fraction(x1+x2,2))}, {fmt(Fraction(y1+y2,2))})",
        [step("((x1+x2)/2, (y1+y2)/2)", "")])


def p1_line_eq(rng, fl):
    m = rng.choice([1, 2, 3])
    c = rng.choice([-3, -1, 2, 4, 5])
    return qdict(0, 2, "Straight line",
        f"Write the equation of the line with gradient {m} passing through (0, {c}).",
        f"y = {m}x + {c}",
        [step("y = mx + c", f"m = {m}, c = {c}")])


def p1_prob(rng, fl):
    red, blue, green = rng.randint(3, 7), rng.randint(2, 6), rng.randint(1, 5)
    tot = red + blue + green
    if rng.random() < 0.5:
        return qdict(0, 2, "Probability",
            f"A bag contains {red} red, {blue} blue and {green} green beads. P(red)?",
            f"{red}/{tot}",
            [step("red/total", f"{red}/{tot}")])
    return qdict(0, 2, "Probability",
        f"A bag contains {red} red, {blue} blue and {green} green beads. P(not green)?",
        f"{tot-green}/{tot}",
        [step("1 − P(green)", f"{tot-green}/{tot}")])


def p1_mean(rng, fl):
    data = [rng.randint(4, 12) for _ in range(5)]
    return qdict(0, 2, "Statistics (mean)",
        f"Find the mean of {', '.join(map(str, data))}.",
        fmt(Fraction(sum(data), 5)),
        [step("sum / 5", f"{sum(data)}/5 = {fmt(Fraction(sum(data),5))}")])


def p1_mean_freq(rng, fl):
    xs = [2, 3, 4, 5]
    fs = [rng.randint(2, 6) for _ in xs]
    n = sum(fs)
    fx = sum(x * f for x, f in zip(xs, fs))
    rows = ", ".join(f"{x} ({f})" for x, f in zip(xs, fs))
    return qdict(0, 3, "Statistics (mean)",
        f"Marks (frequency): {rows}. Find the mean mark.",
        fmt(Fraction(fx, n)),
        [step("Σfx / Σf", f"{fx}/{n} = {fmt(Fraction(fx,n))}")])


def p1_matrix(rng, fl):
    a11, a12 = rng.randint(1, 4), rng.randint(0, 3)
    a21, a22 = rng.randint(1, 4), rng.randint(0, 3)
    b1, b2 = rng.randint(1, 5), rng.randint(1, 5)
    r1 = a11 * b1 + a12 * b2
    r2 = a21 * b1 + a22 * b2
    return qdict(0, 3, "Matrices",
        f"Work out  ({a11}  {a12} ; {a21}  {a22})({b1} ; {b2}).",
        f"({r1} ; {r2})",
        [step("Row × column", f"({r1} ; {r2})")])


def p1_vector(rng, fl):
    u1, u2 = rng.randint(1, 6), rng.randint(-3, 5)
    v1, v2 = rng.randint(-2, 5), rng.randint(1, 6)
    k = rng.choice([2, 3])
    return qdict(0, 3, "Vectors",
        f"u = ({u1} ; {u2}), v = ({v1} ; {v2}). Find {k}u + v.",
        f"({k*u1+v1} ; {k*u2+v2})",
        [step(f"{k}u", f"({k*u1} ; {k*u2})"),
         step("Add v", f"({k*u1+v1} ; {k*u2+v2})")])


def p1_consumer_profit(rng, fl):
    cost = rng.choice([20, 25, 40, 50, 80, 100])
    sp = cost + rng.choice([5, 8, 10, 12, 15, 20])
    pct = Fraction((sp - cost) * 100, cost)
    return qdict(0, 3, "Consumer arithmetic",
        f"A trader at {fl['suburb']} buys {fl['goods']} for ${cost} and sells for ${sp}. Percentage profit?",
        f"{fmt(pct)}%",
        [step("profit/CP × 100%", f"{sp-cost}/{cost} × 100% = {fmt(pct)}%")])


def p1_consumer_discount(rng, fl):
    price = rng.choice([50, 80, 100, 120, 200])
    pct = rng.choice([10, 15, 20, 25])
    new = price * (100 - pct) // 100
    return qdict(0, 3, "Consumer arithmetic",
        f"A shirt in {fl['town']} is marked ${price}. In a sale it is {pct}% off. Sale price?",
        f"${new}",
        [step(f"{100-pct}% of {price}", f"{new}")])


def p1_simple_interest(rng, fl):
    P = rng.choice([200, 400, 500, 800])
    r = rng.choice([5, 8, 10])
    t = rng.choice([2, 3, 4])
    I = P * r * t // 100
    return qdict(0, 3, "Simple interest",
        f"Simple interest on ${P} at {r}% per year for {t} years. Find the interest.",
        f"${I}",
        [step("I = PRT/100", f"{P}×{r}×{t}/100 = {I}")])


# 30 slots, each a list of alternative generators — shuffled by year seed
P1_SLOTS = [
    [p1_bodmas, p1_brackets, p1_primes],
    [p1_directed, p1_temp],
    [p1_frac_add, p1_frac_of, p1_frac_div],
    [p1_percent_of, p1_percent_increase, p1_percent_expr],
    [p1_ratio_share, p1_ratio_map],
    [p1_hcf_lcm],
    [p1_stdform],
    [p1_indices],
    [p1_sets],
    [p1_expand, p1_expand_foil],
    [p1_factor_linear, p1_factor_diffsq],
    [p1_factor_quad],
    [p1_linear, p1_linear_brackets],
    [p1_subject],
    [p1_ineq],
    [p1_simult],
    [p1_seq_nth, p1_seq_find_nth],
    [p1_triangle, p1_parallel],
    [p1_polygon],
    [p1_pythag],
    [p1_trig],
    [p1_area_tri],
    [p1_circle],
    [p1_volume],
    [p1_gradient, p1_line_eq],
    [p1_midpoint],
    [p1_prob],
    [p1_mean, p1_mean_freq],
    [p1_matrix, p1_vector],
    [p1_consumer_profit, p1_consumer_discount, p1_simple_interest],
]


def olevel_p1(rng: random.Random, year: int, session: str = "November") -> list:
    fl = flavour(year, session, rng)
    slots = list(P1_SLOTS)
    # shuffle within two bands so paper order is not identical every year
    band_a, band_b = slots[:10], slots[10:]
    rng.shuffle(band_a)
    rng.shuffle(band_b)
    slots = band_a + band_b
    qs = []
    for group in slots:
        fn = group[rng.randrange(len(group))]
        qs.append(fn(rng, fl))
    for i, q in enumerate(qs, 1):
        q["n"] = i
    return _pad100(qs)



# ----- Paper 2: ZIMSEC 4004/2 format (formal exam English, syllabus slots) -----
# Section A — 6 compulsory (52). Section B — 7 of 12 marks, answer any 4 (48).
# Same TOPIC SLOTS every year (real ZIMSEC). Different numbers/equations per paper.


def p2_q1_algebra(rng, n):
    a, b = rng.randint(2, 5), rng.randint(1, 4)
    r1, r2 = rng.choice([2, 3, 4]), rng.choice([1, 5, 6])
    while r1 == r2:
        r2 += 1
    g = rng.choice([2, 3, 4])
    u, v = rng.randint(2, 6), rng.randint(1, 5)
    k = rng.choice([3, 4, 5])
    rhs = a * k
    xsol = k + b
    return qdict(n, 10, "Algebra",
        f"(a) Expand and simplify  ({a}x − {b})(x + {b}).  [3]<br/>"
        f"(b) Factorise completely  {g*u}x² + {g*v}x.  [2]<br/>"
        f"(c) Solve  {a}(x − {b}) = {rhs}.  [3]<br/>"
        f"(d) Simplify  (x² − {r1*r1})/(x − {r1}).  [2]",
        f"(a) {a}x² + {a*b-b}x − {b*b}; (b) {g}x({u}x + {v}); (c) x = {xsol}; (d) x + {r1}",
        [step("(a) FOIL", f"{a}x² + {a*b}x − {b}x − {b*b} = {a}x² + {a*b-b}x − {b*b}"),
         step("(b) common factor", f"{g}x({u}x + {v})"),
         step("(c) divide by {a}".format(a=a), f"x − {b} = {k} ⇒ x = {xsol}"),
         step("(d) difference of squares", f"(x−{r1})(x+{r1})/(x−{r1}) = x+{r1}, x≠{r1}")],
        section="A", kind="structured",
        markscheme="(a) 3 (b) 2 (c) 3 (d) 2 = 10")


def p2_q2_geometry(rng, n):
    a1 = rng.randint(38, 72)
    a2 = rng.randint(28, 58)
    while a1 + a2 >= 180:
        a2 = rng.randint(28, 50)
    co = 180 - a1
    x = 180 - a1 - a2
    return qdict(n, 8, "Geometry",
        f"AB is parallel to CD. Transversal PQ meets AB at X and CD at Y.<br/>"
        f"(a) Angle AXY = {a1}°. Find the corresponding angle at Y. Give a reason.  [2]<br/>"
        f"(b) Find the co-interior (allied) angle to {a1}°. Give a reason.  [2]<br/>"
        f"(c) In triangle PQR, P̂ = {a1}° and Q̂ = {a2}°. Calculate R̂.  [2]<br/>"
        f"(d) State whether triangle PQR is acute, right-angled or obtuse. Give a reason.  [2]",
        f"(a) {a1}° corresponding angles, AB ∥ CD; (b) {co}° co-interior; (c) {x}°",
        [step("(a) corresponding angles", f"{a1}°, AB ∥ CD"),
         step("(b) co-interior sum to 180°", f"{co}°"),
         step("(c) angle sum of a triangle", f"180 − {a1} − {a2} = {x}°"),
         step("(d) compare with 90°", "acute if all < 90°, obtuse if one > 90°")],
        section="A", kind="structured")


def p2_q3_mensuration(rng, n):
    # Standard solids — π = 22/7, no story
    variant = rng.choice(["cylinder", "path", "prism"])
    if variant == "cylinder":
        r, h = 7, rng.choice([5, 6, 8, 10, 12])
        vol = Fraction(22, 7) * r * r * h
        csa = Fraction(22, 7) * 2 * r * h
        return qdict(n, 8, "Mensuration",
            f"A closed cylinder has radius {r} cm and height {h} cm. Take π = 22/7.<br/>"
            f"(a) Calculate the volume.  [3]<br/>"
            f"(b) Calculate the curved surface area.  [3]<br/>"
            f"(c) Calculate the total surface area.  [2]",
            f"(a) {fmt(vol)} cm³; (b) {fmt(csa)} cm²; (c) {fmt(csa + 2*Fraction(22,7)*r*r)} cm²",
            [step("(a) V = πr²h", f"22/7 × {r}² × {h} = {fmt(vol)} cm³"),
             step("(b) CSA = 2πrh", f"{fmt(csa)} cm²"),
             step("(c) TSA = 2πrh + 2πr²", "")],
            section="A", kind="structured")
    if variant == "path":
        L, W, w = rng.choice([12, 14, 16, 18]), rng.choice([8, 9, 10]), rng.choice([1, 2])
        inner, outer = L * W, (L + 2 * w) * (W + 2 * w)
        return qdict(n, 8, "Mensuration",
            f"A rectangle measures {L} cm by {W} cm. A border of width {w} cm is drawn around the outside.<br/>"
            f"(a) Find the area of the rectangle.  [2]<br/>"
            f"(b) Find the area of the outer rectangle.  [3]<br/>"
            f"(c) Hence find the area of the border.  [3]",
            f"(a) {inner} cm²; (b) {outer} cm²; (c) {outer-inner} cm²",
            [step("(a) lw", f"{L}×{W} = {inner}"),
             step("(b) (l+2w)(w+2w)", f"{L+2*w}×{W+2*w} = {outer}"),
             step("(c) outer − inner", f"{outer-inner}")],
            section="A", kind="structured")
    # triangular prism
    a, b, c, L = 3, 4, 5, rng.choice([8, 10, 12])
    k = rng.choice([1, 2])
    a, b, c, L = a * k, b * k, c * k, L
    return qdict(n, 8, "Mensuration",
        f"A triangular prism has cross-section a right-angled triangle with sides {a} cm, {b} cm and {c} cm. The length of the prism is {L} cm.<br/>"
        f"(a) Area of the triangular cross-section.  [3]<br/>"
        f"(b) Volume of the prism.  [3]<br/>"
        f"(c) Total length of the edges of the prism.  [2]",
        f"(a) {a*b//2} cm²; (b) {a*b//2*L} cm³; (c) {2*(a+b+c)+3*L} cm",
        [step("(a) ½ab", f"½×{a}×{b} = {a*b//2}"),
         step("(b) area × length", f"{a*b//2}×{L} = {a*b//2*L}"),
         step("(c) 3 lengths + 2 of each triangle side", "")],
        section="A", kind="structured")


def p2_q4_coordinate(rng, n):
    m = rng.choice([1, 2, 3, -1, -2])
    c = rng.choice([-5, -3, -1, 2, 4, 6])
    x1, y1 = rng.randint(1, 4), rng.randint(1, 6)
    x2 = x1 + rng.choice([2, 3, 4])
    y2 = y1 + m * (x2 - x1) if rng.random() < 0.4 else y1 + rng.choice([2, 4, 6])
    return qdict(n, 8, "Coordinate geometry",
        f"The line L has equation  y = {m}x + {c}.<br/>"
        f"(a) Write down the gradient of L and the coordinates of the y-intercept.  [2]<br/>"
        f"(b) Find the coordinates of the point where L meets the x-axis.  [2]<br/>"
        f"(c) Find the gradient of the line joining A({x1}, {y1}) and B({x2}, {y2}).  [2]<br/>"
        f"(d) Write the equation of the line parallel to L that passes through (0, 1).  [2]",
        f"(a) gradient {m}, (0, {c}); (b) ({fmt(Fraction(-c,m))}, 0); (c) {fmt(Fraction(y2-y1, x2-x1))}; (d) y = {m}x + 1",
        [step("(a) y = mx + c", f"m = {m}, intercept (0, {c})"),
         step("(b) y = 0", f"0 = {m}x + {c} ⇒ x = {fmt(Fraction(-c,m))}"),
         step("(c) m = (y2−y1)/(x2−x1)", f"{y2-y1}/{x2-x1}"),
         step("(d) same gradient", f"y = {m}x + 1")],
        section="A", kind="structured")


def p2_q5_statistics(rng, n):
    xs = [rng.randint(1, 3) + i for i in range(5)]
    fs = [rng.randint(2, 8) for _ in xs]
    ntot = sum(fs)
    fx = sum(x * f for x, f in zip(xs, fs))
    rows = ", ".join(f"x={x}, f={f}" for x, f in zip(xs, fs))
    mode = xs[fs.index(max(fs))]
    return qdict(n, 9, "Statistics",
        f"The table shows values of x with frequencies f:<br/>{rows}.<br/>"
        f"(a) State the modal value of x.  [1]<br/>"
        f"(b) Calculate Σf and Σfx.  [3]<br/>"
        f"(c) Calculate the mean of x.  [3]<br/>"
        f"(d) Find the range of x.  [2]",
        f"(a) {mode}; (b) Σf={ntot}, Σfx={fx}; (c) {fmt(Fraction(fx, ntot))}; (d) {max(xs)-min(xs)}",
        [step("(a) highest frequency", str(mode)),
         step("(b)", f"Σf = {ntot}, Σfx = {fx}"),
         step("(c) mean = Σfx/Σf", f"{fx}/{ntot} = {fmt(Fraction(fx, ntot))}"),
         step("(d) max − min", f"{max(xs)} − {min(xs)} = {max(xs)-min(xs)}")],
        section="A", kind="structured")


def p2_q6_matrices(rng, n):
    a, b, c, d = rng.randint(1, 4), rng.randint(0, 3), rng.randint(1, 4), rng.randint(0, 3)
    p, q = rng.randint(1, 5), rng.randint(1, 5)
    r1 = a * p + b * q
    r2 = c * p + d * q
    det = a * d - b * c
    return qdict(n, 9, "Matrices",
        f"A = ({a}  {b} ; {c}  {d})  and  column vector u = ({p} ; {q}).<br/>"
        f"(a) Calculate Au.  [3]<br/>"
        f"(b) Find det A.  [2]<br/>"
        f"(c) Describe fully the transformation represented by (0 −1 ; 1  0).  [2]<br/>"
        f"(d) Find the image of the point ({p}, {q}) under a reflection in the y-axis.  [2]",
        f"(a) ({r1} ; {r2}); (b) {det}; (c) rotation 90° anticlockwise about O; (d) ({-p}, {q})",
        [step("(a) row × column", f"({r1} ; {r2})"),
         step("(b) ad − bc", f"{a}×{d} − {b}×{c} = {det}"),
         step("(c)", "(x,y) → (−y, x), 90° anticlockwise about O"),
         step("(d) (x,y) → (−x, y)", f"({-p}, {q})")],
        section="A", kind="structured")


def p2_q7_quadratic(rng, n):
    r1, r2 = rng.choice([1, 2, 3]), rng.choice([4, 5, 6, 8])
    while r1 == r2:
        r2 += 1
    # ax²+bx+c = (x-r1)(x-r2) = x²-(r1+r2)x+r1 r2
    bcoef, ccoef = -(r1 + r2), r1 * r2
    return qdict(n, 12, "Quadratic equations",
        f"(a) Factorise  x² − {r1+r2}x + {r1*r2}.  [3]<br/>"
        f"(b) Hence solve  x² − {r1+r2}x + {r1*r2} = 0.  [2]<br/>"
        f"(c) Write down the roots of  (x − {r1})(x − {r2}) = 0.  [1]<br/>"
        f"(d) Sketch y = (x − {r1})(x − {r2}), showing the intercepts with both axes.  [3]<br/>"
        f"(e) State the coordinates of the turning point.  [3]",
        f"(a) (x−{r1})(x−{r2}); (b) x={r1} or x={r2}; (e) ({fmt(Fraction(r1+r2,2))}, {(r1-r2)**2*(-1)//4})",
        [step("(a)", f"(x − {r1})(x − {r2})"),
         step("(b)", f"x = {r1} or x = {r2}"),
         step("(d) x-intercepts and y-intercept {r1*r2}", "U-shape (positive x²)"),
         step("(e) midpoint of roots, substitute", f"x = {fmt(Fraction(r1+r2,2))}")],
        section="B", kind="structured")


def p2_q8_trig(rng, n):
    # Right-angled + exact ratios OR sine rule setup
    variant = rng.choice(["right", "sine"])
    if variant == "right":
        hyp = rng.choice([10, 12, 16, 20])
        return qdict(n, 12, "Trigonometry",
            f"In triangle ABC, Ĉ = 90°, Â = 30° and AC = {hyp} cm (hypotenuse).<br/>"
            f"(a) Write down sin 30° and cos 60°.  [2]<br/>"
            f"(b) Calculate BC (opposite 30°).  [3]<br/>"
            f"(c) Calculate AB (adjacent to 30°).  [3]<br/>"
            f"(d) Show that tan 30° = 1/√3 and hence find BC/AB.  [4]",
            f"(a) 1/2, 1/2; (b) {hyp//2} cm; (c) {hyp}√3/2 cm",
            [step("(a)", "sin 30° = 1/2, cos 60° = 1/2"),
             step("(b) sin 30° = BC/AC", f"BC = {hyp}/2 = {hyp//2} cm"),
             step("(c) cos 30° = √3/2 = AB/AC", f"AB = {hyp}√3/2 cm"),
             step("(d) opp/adj", "BC/AB = 1/√3")],
            section="B", kind="structured")
    # sine rule: a/sin A = b/sin B
    Aang = rng.choice([40, 50, 70])
    Bang = rng.choice([30, 45, 60])
    a_side = rng.choice([8, 10, 12])
    return qdict(n, 12, "Trigonometry",
        f"In triangle ABC, Â = {Aang}°, B̂ = {Bang}° and BC = a = {a_side} cm.<br/>"
        f"(a) Calculate Ĉ.  [2]<br/>"
        f"(b) Write the sine rule.  [2]<br/>"
        f"(c) Calculate AB = c.  [5]<br/>"
        f"(d) State whether the triangle is acute or obtuse, with a reason.  [3]",
        f"(a) {180-Aang-Bang}°; (c) c = {a_side} sin({Aang})/sin({Bang})  [leave in sin form if no calculator tables]",
        [step("(a) angle sum", f"C = 180 − {Aang} − {Bang} = {180-Aang-Bang}°"),
         step("(b)", "a/sin A = b/sin B = c/sin C"),
         step("(c)", f"c / sin {Aang}° = {a_side} / sin {Bang}°"),
         step("(d)", "all angles < 90° ⇒ acute" if max(Aang, Bang, 180-Aang-Bang) < 90 else "obtuse")],
        section="B", kind="structured")


def p2_q9_circle(rng, n):
    ang = rng.choice([26, 32, 36, 40, 44, 48])
    return qdict(n, 12, "Circle theorems",
        f"O is the centre of a circle. A, B and C lie on the circumference. AB is a diameter. Angle BAC = {ang}°.<br/>"
        f"(a) Find angle ACB. Give a reason.  [3]<br/>"
        f"(b) Find angle ABC.  [2]<br/>"
        f"(c) Find angle BOC (angle at the centre standing on arc BC). Give a reason.  [4]<br/>"
        f"(d) Point D lies on the remaining circumference. Find angle BDC. Give a reason.  [3]",
        f"(a) 90° (angle in a semicircle); (b) {90-ang}°; (c) {2*ang}° (angle at centre = 2 × angle at circumference); (d) {ang}° (angles in the same segment)",
        [step("(a) angle in a semicircle", "ACB = 90° because AB is a diameter"),
         step("(b) angle sum in triangle ABC", f"ABC = 90 − {ang} = {90-ang}°"),
         step("(c) angle at the centre is twice the angle at the circumference, same arc BC", f"BOC = 2 × {ang} = {2*ang}°"),
         step("(d) angles in the same segment", f"BDC = BAC = {ang}°")],
        section="B", kind="structured")


def p2_q10_vectors(rng, n):
    a1, a2 = rng.randint(2, 6), rng.randint(1, 5)
    b1, b2 = rng.randint(-3, 5), rng.randint(2, 6)
    return qdict(n, 12, "Vectors",
        f"The position vectors of A and B are a = ({a1} ; {a2}) and b = ({b1} ; {b2}). M is the midpoint of AB.<br/>"
        f"(a) Find vector AB.  [3]<br/>"
        f"(b) Find |AB|.  [3]<br/>"
        f"(c) Find the position vector of M.  [3]<br/>"
        f"(d) Show that AM = ½ AB.  [3]",
        f"(a) ({b1-a1} ; {b2-a2}); (b) √{(b1-a1)**2 + (b2-a2)**2}; (c) ({fmt(Fraction(a1+b1,2))} ; {fmt(Fraction(a2+b2,2))})",
        [step("(a) AB = b − a", f"({b1}−{a1} ; {b2}−{a2}) = ({b1-a1} ; {b2-a2})"),
         step("(b) |AB| = √(x²+y²)", f"√{(b1-a1)**2 + (b2-a2)**2}"),
         step("(c) OM = (a+b)/2", ""),
         step("(d) M midpoint ⇒ AM = ½ AB", "")],
        section="B", kind="structured")


def p2_q11_ogive(rng, n):
    n_st = rng.choice([40, 50, 60, 80])
    return qdict(n, 12, "Cumulative frequency",
        f"{n_st} candidates sat a Mathematics paper marked out of 50. A cumulative frequency curve (ogive) is drawn.<br/>"
        f"(a) State the median position on the cumulative-frequency axis.  [2]<br/>"
        f"(b) Describe how to read the median mark from the ogive.  [3]<br/>"
        f"(c) The lower quartile is at position n/4 and the upper quartile at 3n/4. Write these positions as numbers.  [3]<br/>"
        f"(d) Define the interquartile range and state one advantage of the IQR over the range.  [4]",
        f"(a) {n_st/2}; (c) Q1 at {n_st/4}, Q3 at {3*n_st/4}; (d) IQR = Q3 − Q1, less affected by outliers",
        [step("(a) n/2", f"{n_st}/2 = {n_st/2}"),
         step("(b)", "from cf = n/2 across to the curve, down to the mark axis"),
         step("(c)", f"Q1: {n_st/4}, Q3: {3*n_st/4}"),
         step("(d)", "IQR = Q3 − Q1; uses the middle 50%, so extreme values have less effect")],
        section="B", kind="structured")


def p2_q12_transform(rng, n):
    px, py = rng.choice([1, 2, 3]), rng.choice([1, 2, 4])
    qx, qy = px + rng.choice([2, 3]), py
    rx, ry = px, py + rng.choice([2, 3])
    vx, vy = rng.choice([1, 2, -1]), rng.choice([-2, -1, 2])
    return qdict(n, 12, "Transformations",
        f"Triangle PQR has P({px}, {py}), Q({qx}, {qy}) and R({rx}, {ry}).<br/>"
        f"(a) P' is the image of P under reflection in the y-axis. Write down the coordinates of P'.  [2]<br/>"
        f"(b) Q is translated by the vector ({vx} ; {vy}). Find the image Q''.  [3]<br/>"
        f"(c) The matrix (0 −1 ; 1  0) represents a transformation T. Describe T fully.  [4]<br/>"
        f"(d) Find T(Q), the image of Q under T.  [3]",
        f"(a) ({-px}, {py}); (b) ({qx+vx}, {qy+vy}); (c) rotation 90° anticlockwise about O; (d) ({-qy}, {qx})",
        [step("(a) (x, y) → (−x, y)", f"P'({-px}, {py})"),
         step("(b) add the vector", f"({qx}+{vx}, {qy}+{vy})"),
         step("(c) (x, y) → (−y, x)", "rotation 90° anticlockwise about the origin"),
         step("(d)", f"({qx}, {qy}) → ({-qy}, {qx})")],
        section="B", kind="structured")


def p2_q13_variation(rng, n):
    kdir = rng.choice([12, 18, 24, 36])
    # y = kx, when x=3, y=kdir so k = kdir/3
    x0 = rng.choice([3, 4, 6])
    while kdir % x0:
        x0 = rng.choice([3, 4, 6])
    k = kdir // x0
    x1 = rng.choice([8, 10, 12])
    y1 = k * x1
    # inverse z = c/x
    cinv = rng.choice([12, 24, 36])
    return qdict(n, 12, "Variation",
        f"(a) y varies directly as x. When x = {x0}, y = {kdir}.<br/>"
        f"&nbsp;&nbsp;&nbsp;(i) Find the equation connecting y and x.  [3]<br/>"
        f"&nbsp;&nbsp;&nbsp;(ii) Find y when x = {x1}.  [2]<br/>"
        f"(b) z varies inversely as x. When x = 3, z = {cinv//3 if cinv%3==0 else 8}. Let this value of z be z₀.<br/>"
        f"&nbsp;&nbsp;&nbsp;(i) Find z when x = 6.  [4]<br/>"
        f"&nbsp;&nbsp;&nbsp;(ii) Describe what happens to z when x is doubled.  [3]",
        f"(a) y = {k}x; y({x1}) = {y1}; (b) inverse: product constant, doubling x halves z",
        [step("(a)(i) y = kx", f"{kdir} = k×{x0} ⇒ k = {k}"),
         step("(a)(ii)", f"y = {k}×{x1} = {y1}"),
         step("(b) z = c/x", "if x doubles, z is halved")],
        section="B", kind="structured")


def olevel_p2(rng: random.Random, year: int, session: str = "November") -> list:
    """Fixed ZIMSEC 4004/2 slots; numbers/equations change with year seed."""
    qs = [
        p2_q1_algebra(rng, 1),
        p2_q2_geometry(rng, 2),
        p2_q3_mensuration(rng, 3),
        p2_q4_coordinate(rng, 4),
        p2_q5_statistics(rng, 5),
        p2_q6_matrices(rng, 6),
        p2_q7_quadratic(rng, 7),
        p2_q8_trig(rng, 8),
        p2_q9_circle(rng, 9),
        p2_q10_vectors(rng, 10),
        p2_q11_ogive(rng, 11),
        p2_q12_transform(rng, 12),
        p2_q13_variation(rng, 13),
    ]
    for q in qs:
        q["kind"] = "structured"
        if q["n"] <= 6:
            q["section"] = "A"
        else:
            q["section"] = "B"
            q["marks"] = 12
    # Section A must total 52: 10+8+8+8+9+9
    return qs
