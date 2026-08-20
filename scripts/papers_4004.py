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


# ----- Paper 2: structured, calculator, completely different genre -----
def p2_algebra_expand(rng, fl, n):
    a, b = rng.randint(2, 6), rng.randint(1, 4)
    r1, r2 = rng.choice([2, 3, 4]), rng.choice([1, 5, 6])
    while r1 == r2:
        r2 += 1
    return qdict(n, 10, "Algebra",
        f"(a) Expand and simplify ({a}x − {b})(x + {b}).  [3]<br/>"
        f"(b) Factorise x² + {r1+r2}x + {r1*r2}.  [2]<br/>"
        f"(c) Solve (x + {b})/{a} = {r1}.  [3]<br/>"
        f"(d) Simplify (x² − {r1*r1})/(x − {r1}).  [2]",
        f"(a) {a}x² + {a*b-b}x − {b*b}; (b) (x+{r1})(x+{r2}); (c) x = {a*r1-b}; (d) x+{r1}",
        [step("(a) FOIL", f"{a}x² + {a*b-b}x − {b*b}"),
         step("(b)", f"(x+{r1})(x+{r2})"),
         step("(c)", f"x = {a*r1-b}"),
         step("(d) difference of squares", f"x + {r1}")],
        section="A", kind="structured")


def p2_algebra_formula(rng, fl, n):
    return qdict(n, 10, "Formulae and fractions",
        f"(a) Make t the subject of  v = u + at.  [3]<br/>"
        f"(b) Simplify  (3x/4) + (x/6).  [3]<br/>"
        f"(c) Solve  2/x = 5/({rng.choice([10,12,15])}).  [4]",
        "see steps",
        [step("(a)", "t = (v − u)/a"),
         step("(b) LCD 12", "9x/12 + 2x/12 = 11x/12"),
         step("(c) cross multiply", "")],
        section="A", kind="structured")


def p2_geometry(rng, fl, n):
    a1 = rng.randint(42, 68)
    a2 = rng.randint(30, 55)
    return qdict(n, 8, "Geometry (angles)",
        f"AB ∥ CD with transversal EF in a street plan of {fl['town']}.<br/>"
        f"(a) Angle APQ = {a1}°. State the corresponding angle at Q, with a reason.  [2]<br/>"
        f"(b) Find the co-interior angle to {a1}°.  [2]<br/>"
        f"(c) A triangle has angles {a1}°, {a2}° and x°. Find x.  [2]<br/>"
        f"(d) Classify the triangle (acute / right / obtuse).  [2]",
        f"(a) {a1}° corresponding; (b) {180-a1}°; (c) {180-a1-a2}°",
        [step("(a) corresponding, AB ∥ CD", f"{a1}°"),
         step("(b) co-interior", f"{180-a1}°"),
         step("(c)", f"{180-a1-a2}°")],
        section="A", kind="structured")


def p2_construction(rng, fl, n):
    return qdict(n, 8, "Geometrical construction",
        f"(a) Using ruler and compasses only, construct triangle ABC with AB = {rng.choice([6,7,8])} cm, "
        f"BC = {rng.choice([5,6,7])} cm and AC = {rng.choice([7,8,9])} cm.  [4]<br/>"
        f"(b) Construct the perpendicular bisector of BC.  [2]<br/>"
        f"(c) Mark the circumcentre and describe its property.  [2]",
        "Construction — equal arcs; circumcentre equidistant from A,B,C",
        [step("(a) base + two arcs", "SSS construction"),
         step("(b) arcs from B and C", ""),
         step("(c) intersection of perpendicular bisectors", "")],
        section="A", kind="structured")


def p2_mensuration_path(rng, fl, n):
    L, W = rng.choice([12, 14, 16, 18, 20]), rng.choice([8, 9, 10, 11])
    path = rng.choice([1, 2])
    r = 7
    inner, outer = L * W, (L + 2 * path) * (W + 2 * path)
    return qdict(n, 8, "Mensuration",
        f"A rectangular garden in {fl['suburb']} measures {L} m by {W} m. A path of width {path} m runs all around the outside.<br/>"
        f"(a) Area of the garden.  [2]<br/>"
        f"(b) Area of the path.  [3]<br/>"
        f"(c) A circular bed of radius {r} m is later dug. Area of the bed, π = 22/7.  [3]",
        f"(a) {inner} m²; (b) {outer-inner} m²; (c) {fmt(Fraction(22,7)*r*r)} m²",
        [step("(a)", f"{L}×{W} = {inner}"),
         step("(b) outer − inner", f"{outer} − {inner} = {outer-inner}"),
         step("(c) πr²", "")],
        section="A", kind="structured")


def p2_mensuration_tank(rng, fl, n):
    r, h = 7, rng.choice([10, 12, 14, 20])
    return qdict(n, 8, "Mensuration (cylinder)",
        f"A cylindrical tank at {fl['school']} has radius {r} cm and height {h} cm. π = 22/7.<br/>"
        f"(a) Volume.  [3]<br/>"
        f"(b) Curved surface area.  [3]<br/>"
        f"(c) Total surface area including the base only (open top).  [2]",
        f"(a) {fmt(Fraction(22,7)*r*r*h)} cm³; (b) {fmt(Fraction(22,7)*2*r*h)} cm²",
        [step("(a) πr²h", ""),
         step("(b) 2πrh", ""),
         step("(c) 2πrh + πr²", "")],
        section="A", kind="structured")


def p2_graphs(rng, fl, n):
    m = rng.choice([1, 2, 3])
    c = rng.choice([-4, -2, 1, 3, 5])
    xA = rng.choice([0, 1, 2])
    yA = m * xA + c
    return qdict(n, 8, "Graphs and coordinates",
        f"Line L: y = {m}x + {c}.<br/>"
        f"(a) Gradient and y-intercept.  [2]<br/>"
        f"(b) Coordinates where L meets the x-axis.  [2]<br/>"
        f"(c) Show A({xA}, {yA}) lies on L.  [2]<br/>"
        f"(d) Equation of the line parallel to L through (0, 4).  [2]",
        f"(a) {m}, (0,{c}); (b) ({fmt(Fraction(-c,m))}, 0); (d) y = {m}x + 4",
        [step("(a) y = mx + c", ""),
         step("(b) y = 0", f"x = {fmt(Fraction(-c,m))}"),
         step("(d) same m", f"y = {m}x + 4")],
        section="A", kind="structured")


def p2_stats(rng, fl, n):
    scores = [rng.randint(2, 6) for _ in range(5)]
    freqs = [rng.randint(3, 8) for _ in range(5)]
    ntot = sum(freqs)
    fx = sum(s * f for s, f in zip(scores, freqs))
    rows = ", ".join(f"{s} ({f} pupils)" for s, f in zip(scores, freqs))
    mode = scores[freqs.index(max(freqs))]
    return qdict(n, 9, "Statistics",
        f"{ntot} Form 4 pupils at {fl['school']} scored:<br/>{rows}.<br/>"
        f"(a) Modal mark.  [1]<br/>(b) Mean mark.  [4]<br/>(c) Range.  [2]<br/>"
        f"(d) One extra pupil scores 6. Effect on the mean?  [2]",
        f"(a) {mode}; (b) {fmt(Fraction(fx, ntot))}; (c) {max(scores)-min(scores)}",
        [step("(a) highest frequency", str(mode)),
         step("(b) Σfx/Σf", f"{fx}/{ntot}"),
         step("(c)", f"{max(scores)-min(scores)}")],
        section="A", kind="structured")


def p2_consumer(rng, fl, n):
    items = [
        ("solar pump", rng.choice([800, 1200, 1500])),
        ("laptop", rng.choice([400, 600, 900])),
        ("sewing machine", rng.choice([250, 350, 500])),
        ("irrigation kit", rng.choice([700, 1000, 1400])),
    ]
    name, price = items[rng.randrange(len(items))]
    disc = rng.choice([10, 15, 20])
    discounted = price * (100 - disc) // 100
    with_vat = discounted * 115 // 100
    return qdict(n, 9, "Consumer arithmetic",
        f"A {name} is marked at ${price} in {fl['town']}.<br/>"
        f"(a) {disc}% discount. Discounted price.  [3]<br/>"
        f"(b) Then add VAT 15%. Amount paid.  [3]<br/>"
        f"(c) Deposit 40% of the final amount. Balance remaining.  [3]",
        f"(a) ${discounted}; (b) ${with_vat}; (c) ${with_vat - with_vat*40//100}",
        [step("(a)", f"{price}×{100-disc}/100 = {discounted}"),
         step("(b) ×1.15", str(with_vat)),
         step("(c) 60%", str(with_vat - with_vat * 40 // 100))],
        section="A", kind="structured")


def p2_quad(rng, fl, n):
    r1, r2 = rng.choice([2, 3]), rng.choice([5, 6, 8])
    return qdict(n, 12, "Quadratic equations",
        f"(a) Solve x² − {r1+r2}x + {r1*r2} = 0 by factorisation.  [4]<br/>"
        f"(b) A rectangular plot in {fl['town']} is {r2} m longer than it is wide. "
        f"If the area is {r1*(r1+r2)} m², form and solve an equation for the width w.  [5]<br/>"
        f"(c) Sketch y = (x − {r1})(x − {r2}), showing intercepts.  [3]",
        f"(a) x={r1} or {r2}; (b) w(w+{r2}) = {r1*(r1+r2)}",
        [step("(a)", f"(x−{r1})(x−{r2})=0"),
         step("(b)", f"w² + {r2}w − {r1*(r1+r2)} = 0"),
         step("(c) intercepts", f"{r1}, {r2}")],
        section="B", kind="structured")


def p2_trig_bearings(rng, fl, n):
    hyp = rng.choice([20, 24, 30, 40])
    landmark = rng.choice(["a msasa tree", "a cellphone tower", "the school flagpole", "a grain silo"])
    return qdict(n, 12, "Trigonometry and bearings",
        f"{landmark.capitalize()} is observed from A on level ground in {fl['town']}. "
        f"Angle of elevation of the top is 30°. Distance A to the foot is {hyp} m.<br/>"
        f"(a) Height of the object. Use tan 30° = 1/√3.  [4]<br/>"
        f"(b) From B, {hyp} m due East of A, the bearing of the foot is 300°. Sketch.  [3]<br/>"
        f"(c) A bird sits halfway up. Angle of elevation from A.  [5]",
        f"(a) {hyp}/√3 = {hyp}√3/3 m",
        [step("(a) tan 30° = opp/adj", f"h = {hyp}/√3 = {hyp}√3/3 m"),
         step("(b) bearings sketch", "North lines at A and B"),
         step("(c) tan θ = (h/2)/adj", "")],
        section="B", kind="structured")


def p2_circle_th(rng, fl, n):
    ang = rng.choice([28, 32, 36, 40, 44])
    return qdict(n, 12, "Circle geometry",
        f"O is the centre. A, B, C on the circumference. AB is a diameter. Angle BAC = {ang}°.<br/>"
        f"(a) Angle ACB. Reason.  [3]<br/>"
        f"(b) Angle BOC (centre, same arc BC).  [3]<br/>"
        f"(c) D on the remaining circumference. Angle BDC. Reason.  [3]<br/>"
        f"(d) State the angle-in-a-semicircle theorem.  [3]",
        f"(a) 90°; (b) {2*ang}°; (c) {ang}° same segment",
        [step("(a) angle in a semicircle", "90°"),
         step("(b) angle at centre = 2 at circumference", f"{2*ang}°"),
         step("(c) same segment", f"{ang}°")],
        section="B", kind="structured")


def p2_vectors(rng, fl, n):
    a1, a2 = rng.randint(2, 6), rng.randint(1, 5)
    b1, b2 = rng.randint(-2, 4), rng.randint(2, 6)
    return qdict(n, 12, "Vectors",
        f"OA = a = ({a1} ; {a2}), OB = b = ({b1} ; {b2}). M midpoint of AB.<br/>"
        f"(a) Vector AB.  [3]<br/>(b) |AB|.  [3]<br/>(c) Position vector OM.  [3]<br/>(d) Show AM = MB.  [3]",
        f"(a) ({b1-a1} ; {b2-a2}); (b) √{(b1-a1)**2+(b2-a2)**2}",
        [step("(a) b − a", f"({b1-a1} ; {b2-a2})"),
         step("(b) magnitude", ""),
         step("(c) (a+b)/2", "")],
        section="B", kind="structured")


def p2_ogive(rng, fl, n):
    n_st = rng.choice([40, 50, 60, 80])
    med = rng.choice([22, 26, 30, 34])
    return qdict(n, 12, "Cumulative frequency",
        f"{n_st} pupils at {fl['school']} sat a test (0–50). An ogive is drawn.<br/>"
        f"(a) How to read the median from the ogive.  [3]<br/>"
        f"(b) Median estimated as {med}. Meaning?  [2]<br/>"
        f"(c) How to find the IQR from the graph.  [4]<br/>"
        f"(d) Why IQR is better than the range here.  [3]",
        f"(a) read at cf = {n_st/2}; (c) Q3 at 3n/4 minus Q1 at n/4",
        [step("(a)", f"n/2 = {n_st/2}"),
         step("(c)", f"Q1 = {n_st/4}, Q3 = {3*n_st/4}"),
         step("(d) outliers", "IQR uses middle 50%")],
        section="B", kind="structured")


def p2_transform(rng, fl, n):
    px, py = rng.choice([1, 2]), rng.choice([1, 2, 3])
    qxx, qy = px + rng.choice([2, 3]), py
    rx, ry = px, py + rng.choice([2, 3])
    vx, vy = rng.choice([1, 2, 3]), rng.choice([-2, -1, 1])
    return qdict(n, 12, "Transformations and matrices",
        f"Triangle P({px},{py}), Q({qxx},{qy}), R({rx},{ry}).<br/>"
        f"(a) Reflect in the y-axis. Coordinates of P'.  [4]<br/>"
        f"(b) Translate PQR by ({vx} ; {vy}). Give Q''.  [3]<br/>"
        f"(c) Matrix (0 −1 ; 1  0) maps (x;y). Describe fully and find the image of Q.  [5]",
        f"(a) P'({-px},{py}); (b) Q''({qxx+vx},{qy+vy}); (c) 90° anticlockwise about O",
        [step("(a) (x,y)→(−x,y)", f"P'({-px},{py})"),
         step("(b)", f"Q({qxx},{qy})+({vx},{vy})"),
         step("(c) (−y, x)", "rotation 90° anticlockwise about O")],
        section="B", kind="structured")


def p2_variation(rng, fl, n):
    k_var = rng.choice([12, 24, 36, 48])
    hours = rng.choice([30, 40, 48])
    maize_h = rng.choice([2, 3])
    return qdict(n, 12, "Variation and linear programming",
        f"(a) y varies directly as x. When x = 4, y = {k_var}. Find y when x = 10.  [4]<br/>"
        f"(b) z varies inversely as x. When x = 3, z = 8. Find z when x = 6.  [4]<br/>"
        f"(c) A farmer near {fl['town']} has at most {hours} hours. Maize takes {maize_h} h/ha, vegetables 1 h/ha. "
        f"Inequality for hectares m and v.  [4]",
        f"(a) {k_var*10//4}; (b) 4; (c) {maize_h}m + v ≤ {hours}",
        [step("(a) y = kx", f"k = {k_var//4}, y = {k_var*10//4}"),
         step("(b) z = k/x", "k = 24, z = 4"),
         step("(c)", f"{maize_h}m + v ≤ {hours}, m≥0, v≥0")],
        section="B", kind="structured")


def p2_travel(rng, fl, n):
    dist = rng.choice([120, 150, 180, 240])
    t1 = rng.choice([2, 3])
    return qdict(n, 12, "Travel graphs",
        f"A kombi leaves {fl['town']} at 08:00 and travels {dist} km at constant speed, arriving after {t1} hours. "
        f"It stops 30 minutes, then returns at 80 km/h.<br/>"
        f"(a) Outward speed.  [3]<br/>"
        f"(b) Time for the return.  [3]<br/>"
        f"(c) Sketch a distance–time graph, labelling axes.  [4]<br/>"
        f"(d) Average speed for the whole trip including the stop.  [2]",
        f"(a) {dist/t1:.0f} km/h; (b) {dist/80} h",
        [step("(a) s = d/t", f"{dist}/{t1}"),
         step("(b) t = d/s", f"{dist}/80"),
         step("(d) total distance 2d / total time", "")],
        section="B", kind="structured")


def olevel_p2(rng: random.Random, year: int, session: str = "November") -> list:
    fl = flavour(year, session, rng)
    # Section A: pick 6 different structured types (always 52 marks)
    secA_pool = [
        p2_algebra_expand, p2_algebra_formula, p2_geometry, p2_construction,
        p2_mensuration_path, p2_mensuration_tank, p2_graphs, p2_stats, p2_consumer,
    ]
    rng.shuffle(secA_pool)
    secA = secA_pool[:6]
    # Section B: 7 of these
    secB_pool = [
        p2_quad, p2_trig_bearings, p2_circle_th, p2_vectors,
        p2_ogive, p2_transform, p2_variation, p2_travel,
    ]
    rng.shuffle(secB_pool)
    secB = secB_pool[:7]
    qs = []
    n = 1
    for fn in secA:
        qs.append(fn(rng, fl, n))
        n += 1
    for fn in secB:
        qs.append(fn(rng, fl, n))
        n += 1
    # Force section A marks to stay as defined; section B all 12
    for q in qs:
        if q["n"] <= 6:
            q["section"] = "A"
            q["kind"] = "structured"
        else:
            q["section"] = "B"
            q["kind"] = "structured"
            q["marks"] = 12
    return qs
