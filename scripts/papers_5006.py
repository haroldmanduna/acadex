"""ZIMSEC Combined Science 5006 — original practice papers.

Paper 1: 40 multiple-choice, 1 hour, 1 mark each.
Paper 2: 8 structured questions, 2 hours, 80 marks, all compulsory.
Biology / Chemistry / Physics in official exam English.

Each (year, session) is a different script: different stems, not only
different numbers. Questions stay inside the 5006 Combined Science syllabus.
"""
from __future__ import annotations

import random


def qdict(n, marks, topic, text, answer, steps, section="A", markscheme=None, kind="mcq", options=None):
    return {
        "n": n, "section": section, "marks": marks, "topic": topic, "text": text,
        "answer": answer, "steps": steps, "parts": [],
        "markscheme": markscheme or f"{marks} mark(s). Answer: {answer}",
        "kind": kind, "options": options or [],
    }


def step(t, d=""):
    return {"t": t, "d": d}


def letters(rng, opts, correct_i):
    """Label A–D; shuffle so the key is not always the same letter."""
    order = [0, 1, 2, 3]
    rng.shuffle(order)
    items = [opts[i] for i in order]
    ci = order.index(correct_i)
    labs = ["A", "B", "C", "D"]
    return [f"{labs[i]}) {items[i]}" for i in range(4)], labs[ci]


def pack(rng, topic, text, opts, correct_i, explain):
    labeled, ans = letters(rng, opts, correct_i)
    return topic, text, labeled, ans, [step(topic, explain)]


# ---------- Paper 1 MCQ families (each returns one question; several stems) ----------
def m_cell(rng):
    v = rng.choice(["chloro", "mito", "wall", "nucleus", "ribosome", "vacuole"])
    if v == "chloro":
        return pack(rng, "Cell structure", "Which organelle is the site of photosynthesis?",
                    ["nucleus", "chloroplast", "mitochondrion", "ribosome"], 1,
                    "Chlorophyll is in chloroplasts of plant cells.")
    if v == "mito":
        return pack(rng, "Cell structure", "Which organelle is the main site of aerobic respiration?",
                    ["chloroplast", "cell wall", "mitochondrion", "vacuole"], 2,
                    "Mitochondria are the site of aerobic respiration.")
    if v == "wall":
        return pack(rng, "Cell structure", "A cellulose cell wall is found in",
                    ["animal cells only", "plant cells only", "both animal and plant cells", "viruses only"], 1,
                    "Plant cells have a cellulose cell wall; animal cells do not.")
    if v == "nucleus":
        return pack(rng, "Cell structure", "The function of the nucleus is to",
                    ["store starch only", "control cell activities", "make glucose", "be a fluid-filled sac only"], 1,
                    "The nucleus contains DNA and controls cell activities.")
    if v == "ribosome":
        return pack(rng, "Cell structure", "Ribosomes are the site of",
                    ["photosynthesis", "protein synthesis", "lipid storage", "osmosis"], 1,
                    "Ribosomes assemble amino acids into proteins.")
    return pack(rng, "Cell structure", "The large permanent vacuole in a plant cell",
                ["controls cell division", "contains cell sap and helps keep the cell turgid",
                 "is the site of respiration", "makes cellulose"], 1,
                "The sap vacuole stores solution and supports the cell when turgid.")


def m_special(rng):
    v = rng.choice(["root", "palisade", "sperm", "cilia", "rbc"])
    if v == "root":
        return pack(rng, "Specialised cells", "Root hair cells are adapted to absorb water because they have",
                    ["a thick cuticle", "a large surface area", "chloroplasts", "cilia"], 1,
                    "The hair increases surface area for osmosis and ion uptake.")
    if v == "palisade":
        return pack(rng, "Specialised cells", "Palisade mesophyll cells contain many chloroplasts because they",
                    ["transport water", "carry out most photosynthesis in the leaf", "store urine", "make urea"], 1,
                    "They are near the upper surface and packed with chloroplasts.")
    if v == "sperm":
        return pack(rng, "Specialised cells", "A human sperm cell has a flagellum so that it can",
                    ["store yolk", "swim towards the egg", "photosynthesise", "carry oxygen"], 1,
                    "The tail (flagellum) allows motility.")
    if v == "cilia":
        return pack(rng, "Specialised cells", "Ciliated cells in the trachea",
                    ["absorb digested food", "sweep mucus and trapped particles", "pump blood", "make insulin"], 1,
                    "Beating cilia move mucus away from the lungs.")
    return pack(rng, "Specialised cells", "Red blood cells are adapted to carry oxygen because they contain",
                ["chlorophyll", "haemoglobin", "cellulose", "starch"], 1,
                "Haemoglobin binds oxygen.")


def m_osmosis(rng):
    v = rng.choice(["def", "water", "turgid", "flaccid"])
    if v == "def":
        return pack(rng, "Osmosis", "Osmosis is the movement of",
                    ["any solute from high to low concentration",
                     "water from a dilute solution to a more concentrated solution through a partially permeable membrane",
                     "oxygen through the stomata only",
                     "mineral ions against a concentration gradient only"], 1,
                    "Osmosis is net movement of water through a partially permeable membrane.")
    if v == "water":
        return pack(rng, "Osmosis", "Water enters a root hair cell mainly by",
                    ["transpiration pull only", "osmosis", "photosynthesis", "ejection"], 1,
                    "Soil solution is more dilute than cell sap, so water enters by osmosis.")
    if v == "turgid":
        return pack(rng, "Osmosis", "A plant cell placed in pure water becomes",
                    ["plasmolysed", "turgid", "crenated", "lignified"], 1,
                    "Water enters; the wall prevents bursting so the cell is turgid.")
    return pack(rng, "Osmosis", "A plant cell in a concentrated sugar solution may become",
                ["turgid", "plasmolysed", "photosynthetic", "a gamete"], 1,
                "Water leaves; the cytoplasm shrinks from the wall (plasmolysis).")


def m_photo(rng):
    v = rng.choice(["eq", "gas", "factor", "chloro", "starch", "stomata"])
    if v == "eq":
        return pack(rng, "Photosynthesis", "The word equation for photosynthesis is",
                    ["carbon dioxide + water → glucose + oxygen",
                     "glucose + oxygen → carbon dioxide + water",
                     "nitrogen + water → glucose + oxygen",
                     "glucose + carbon dioxide → oxygen + water"], 0,
                    "CO₂ + H₂O → C₆H₁₂O₆ + O₂ (light and chlorophyll).")
    if v == "gas":
        return pack(rng, "Photosynthesis", "Which gas is produced during photosynthesis?",
                    ["nitrogen", "oxygen", "hydrogen", "methane"], 1,
                    "Oxygen is released when water is split.")
    if v == "factor":
        return pack(rng, "Photosynthesis", "Which change increases the rate of photosynthesis, other factors being equal?",
                    ["decreasing light intensity", "increasing carbon dioxide (up to a point)",
                     "removing chlorophyll", "placing the plant in darkness"], 1,
                    "More CO₂ increases rate until another factor limits.")
    if v == "chloro":
        return pack(rng, "Photosynthesis", "The green pigment that absorbs light for photosynthesis is",
                    ["haemoglobin", "chlorophyll", "melanin", "carotene only"], 1,
                    "Chlorophyll absorbs light energy.")
    if v == "starch":
        return pack(rng, "Photosynthesis", "A leaf that has photosynthesised is tested with iodine. A blue-black colour shows",
                    ["protein", "reducing sugar", "starch", "lipid"], 2,
                    "Iodine solution turns blue-black with starch.")
    return pack(rng, "Photosynthesis", "Most carbon dioxide for photosynthesis enters the leaf through the",
                ["cuticle", "xylem", "stomata", "root hairs"], 2,
                "Stomata allow CO₂ in and O₂ / water vapour out.")


def m_digest(rng):
    v = rng.choice(["amylase", "protease", "lipase", "ileum", "stomach"])
    if v == "amylase":
        return pack(rng, "Digestion", "Salivary amylase begins the digestion of",
                    ["protein to amino acids", "starch to maltose", "fat to glycerol", "fibre to glucose"], 1,
                    "Amylase hydrolyses starch to maltose.")
    if v == "protease":
        return pack(rng, "Digestion", "Protease enzymes digest proteins to",
                    ["glucose", "amino acids", "fatty acids", "maltose"], 1,
                    "Proteins → peptides → amino acids.")
    if v == "lipase":
        return pack(rng, "Digestion", "Lipase, with bile, digests fats to",
                    ["amino acids", "maltose", "fatty acids and glycerol", "starch"], 2,
                    "Fats → fatty acids + glycerol.")
    if v == "ileum":
        return pack(rng, "Digestion", "The products of digestion are absorbed mainly in the",
                    ["oesophagus", "ileum (small intestine)", "trachea", "bladder"], 1,
                    "The ileum has villi, giving a large surface area.")
    return pack(rng, "Digestion", "Hydrochloric acid in the stomach",
                ["neutralises bile", "kills many bacteria and provides a low pH for protease",
                 "digests cellulose", "stores bile"], 1,
                "Acidic pH and a defence against pathogens.")


def m_enzyme(rng):
    v = rng.choice(["def", "temp", "ph", "spec"])
    if v == "def":
        return pack(rng, "Enzymes", "An enzyme is",
                    ["a carbohydrate that stores energy", "a biological catalyst",
                     "a waste product of respiration", "a type of mineral ion"], 1,
                    "Enzymes speed up reactions and are not used up.")
    if v == "temp":
        return pack(rng, "Enzymes", "A high temperature denatures an enzyme because it",
                    ["increases pH only", "changes the shape of the active site",
                     "adds a coenzyme", "turns it into starch"], 1,
                    "The active site shape no longer fits the substrate.")
    if v == "ph":
        return pack(rng, "Enzymes", "Each enzyme works best at its",
                    ["boiling point", "optimum pH and temperature", "freezing point", "ignition temperature"], 1,
                    "Activity falls away from the optimum.")
    return pack(rng, "Enzymes", "The lock-and-key model says the substrate fits the",
                ["nucleus", "active site", "cell wall", "vacuole"], 1,
                "Specific shape of the active site.")


def m_resp(rng):
    v = rng.choice(["aero", "anaero", "organ", "energy", "yeast"])
    if v == "aero":
        return pack(rng, "Respiration", "Aerobic respiration in humans is summarised by",
                    ["glucose + oxygen → carbon dioxide + water + energy",
                     "carbon dioxide + water → glucose + oxygen",
                     "glucose → lactic acid only",
                     "protein + oxygen → urea"], 0,
                    "Glucose is oxidised: C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + energy.")
    if v == "anaero":
        return pack(rng, "Respiration", "In human muscle during vigorous exercise, anaerobic respiration produces",
                    ["carbon dioxide and water", "lactic acid", "ethanol only", "oxygen"], 1,
                    "Glucose → lactic acid (+ little energy).")
    if v == "organ":
        return pack(rng, "Respiration", "Aerobic respiration takes place mainly in the",
                    ["chloroplast", "nucleus", "mitochondrion", "cell wall"], 2,
                    "Mitochondrion.")
    if v == "energy":
        return pack(rng, "Respiration", "The energy released in respiration is used in the body to",
                    ["make chlorophyll in blood", "drive processes such as muscle contraction and active transport",
                     "create new elements", "stop diffusion"], 1,
                    "ATP from respiration fuels life processes.")
    return pack(rng, "Respiration", "Anaerobic respiration in yeast produces",
                ["lactic acid only", "ethanol and carbon dioxide", "oxygen", "starch"], 1,
                    "Alcoholic fermentation: glucose → ethanol + CO₂.")


def m_transport(rng):
    v = rng.choice(["xylem", "phloem", "heart", "vessel", "double", "valve"])
    if v == "xylem":
        return pack(rng, "Transport in plants", "Xylem vessels transport",
                    ["sugars from leaves", "water and mineral ions from roots", "blood", "hormones only"], 1,
                    "Water and dissolved mineral ions, roots to leaves.")
    if v == "phloem":
        return pack(rng, "Transport in plants", "Phloem tissue transports",
                    ["water only upwards", "sucrose and amino acids", "oxygen", "soil particles"], 1,
                    "Translocation of sucrose and amino acids.")
    if v == "heart":
        return pack(rng, "Transport in humans", "Oxygenated blood is pumped to the body from the",
                    ["right atrium", "left ventricle", "right ventricle", "pulmonary vein only, without the heart"], 1,
                    "Left ventricle pumps into the aorta.")
    if v == "vessel":
        return pack(rng, "Transport in humans", "Which statement is correct?",
                    ["Capillaries have thick muscular walls", "Arteries carry blood away from the heart",
                     "Veins have the highest blood pressure", "Xylem carries blood"], 1,
                    "Arteries carry blood away from the heart; thick walls.")
    if v == "double":
        return pack(rng, "Transport in humans", "In double circulation, blood passes through the heart",
                    ["once per circuit of the body", "twice per circuit of the body", "not at all", "only at night"], 1,
                    "Pulmonary circuit then systemic circuit.")
    return pack(rng, "Transport in humans", "Valves in veins",
                ["increase blood pressure", "prevent backflow of blood", "oxygenate blood", "make red cells"], 1,
                    "They stop blood flowing backwards.")


def m_blood(rng):
    v = rng.choice(["rbc", "wbc", "plasma", "platelets"])
    if v == "rbc":
        return pack(rng, "Blood", "The main function of red blood cells is to",
                    ["clot blood", "transport oxygen", "fight all pathogens by phagocytosis only", "make urea"], 1,
                    "Haemoglobin carries oxygen.")
    if v == "wbc":
        return pack(rng, "Blood", "White blood cells",
                    ["carry oxygen only", "are involved in defence against pathogens",
                     "are fragments that clot blood", "transport sucrose"], 1,
                    "Phagocytosis and antibody production.")
    if v == "plasma":
        return pack(rng, "Blood", "Plasma transports",
                    ["only oxygen in haemoglobin", "dissolved substances such as carbon dioxide, urea and hormones",
                     "only starch grains", "only cellulose"], 1,
                    "Plasma is the liquid part of blood.")
    return pack(rng, "Blood", "Platelets are needed for",
                ["photosynthesis", "blood clotting", "making bile", "osmoregulation only"], 1,
                    "They help form a clot at a wound.")


def m_repro(rng):
    v = rng.choice(["poll", "fert", "contra", "testis", "ovary", "seed"])
    if v == "poll":
        return pack(rng, "Reproduction", "Pollination is",
                    ["fusion of gametes", "transfer of pollen from anther to stigma",
                     "dispersal of seeds", "germination of the seed"], 1,
                    "Pollen from anther to stigma.")
    if v == "fert":
        return pack(rng, "Human reproduction", "In humans, fertilisation normally occurs in the",
                    ["ovary", "oviduct / Fallopian tube", "uterus wall only", "cervix"], 1,
                    "Usually in the oviduct.")
    if v == "contra":
        return pack(rng, "Human reproduction", "A condom prevents pregnancy mainly by",
                    ["stimulating sperm production", "preventing sperm meeting an egg",
                     "increasing FSH always", "implantation of the embryo only"], 1,
                    "Barrier so sperm cannot reach the egg.")
    if v == "testis":
        return pack(rng, "Human reproduction", "Sperm are produced in the",
                    ["prostate only", "testes", "oviduct", "uterus"], 1,
                    "Testes produce sperm and testosterone.")
    if v == "ovary":
        return pack(rng, "Human reproduction", "Eggs (ova) are produced in the",
                    ["testes", "ovaries", "bladder", "vagina"], 1,
                    "Ovaries produce ova and hormones.")
    return pack(rng, "Reproduction", "After fertilisation in a flower, the ovule becomes the",
                ["petal", "seed", "anther", "sepal"], 1,
                    "Ovule → seed; ovary → fruit.")


def m_health(rng):
    v = rng.choice(["malaria", "cholera", "hiv", "tb", "vaccine"])
    if v == "malaria":
        return pack(rng, "Health", "Malaria is caused by a pathogen transmitted by",
                    ["a virus in air", "a bacterium in contaminated water",
                     "Plasmodium, via the Anopheles mosquito", "a fungus by contact"], 2,
                    "Protozoan Plasmodium; vector female Anopheles.")
    if v == "cholera":
        return pack(rng, "Health", "Cholera is spread mainly by",
                    ["air droplets only", "contaminated water / food", "mosquitoes", "sexual contact only"], 1,
                    "Vibrio cholerae in contaminated water or food.")
    if v == "hiv":
        return pack(rng, "Health", "HIV is a",
                    ["bacterium", "virus that attacks white blood cells / the immune system",
                     "protozoan", "deficiency of vitamin C"], 1,
                    "Virus that infects lymphocytes and weakens immunity.")
    if v == "tb":
        return pack(rng, "Health", "Tuberculosis (TB) is caused by a bacterium and is spread mainly by",
                    ["mosquitoes", "droplet infection (coughing, sneezing)", "contaminated rivers only", "ticks"], 1,
                    "Airborne droplets from an infected person.")
    return pack(rng, "Health", "A vaccine works by",
                ["killing all white cells", "stimulating the immune system to make memory cells / antibodies",
                 "replacing red cells", "neutralising stomach acid"], 1,
                    "The body is primed to respond quickly on later infection.")


def m_ecology(rng):
    v = rng.choice(["producer", "chain", "consumer", "decomp"])
    if v == "producer":
        return pack(rng, "Ecology", "In a food chain, a producer is an organism that",
                    ["eats animals only", "makes its own food by photosynthesis",
                     "breaks down dead matter only", "is always a fungus"], 1,
                    "Green plants (and some bacteria) produce organic food.")
    if v == "chain":
        return pack(rng, "Ecology", "The arrows in a food chain show",
                    ["the direction the animal walks", "the direction of energy flow",
                     "the age of the organism", "wind direction"], 1,
                    "Energy flows from the organism eaten to the consumer.")
    if v == "consumer":
        return pack(rng, "Ecology", "A herbivore is a",
                    ["producer", "primary consumer", "decomposer only", "pathogen"], 1,
                    "It feeds on plants.")
    return pack(rng, "Ecology", "Decomposers",
                ["only eat living animals", "break down dead organisms and recycle nutrients",
                 "photosynthesise in xylem", "cause malaria"], 1,
                    "Bacteria and fungi recycle mineral ions.")


def m_excrete(rng):
    v = rng.choice(["urea", "kidney", "lung", "skin"])
    if v == "urea":
        return pack(rng, "Excretion", "Urea is made in the",
                    ["kidney from urine", "liver from excess amino acids", "lungs from oxygen", "skin from sweat only"], 1,
                    "Deamination in the liver produces urea.")
    if v == "kidney":
        return pack(rng, "Excretion", "The kidney",
                    ["produces bile", "removes urea and excess water from the blood",
                     "stores glycogen only", "makes red cells"], 1,
                    "Osmoregulation and excretion of urea.")
    if v == "lung":
        return pack(rng, "Excretion", "The lungs excrete",
                    ["urea", "carbon dioxide", "bile", "undigested fibre"], 1,
                    "CO₂ is a waste product of respiration.")
    return pack(rng, "Excretion", "Sweat contains",
                ["only pure oil", "water, salts and a little urea", "starch", "haemoglobin"], 1,
                    "The skin is an excretory organ as well as cooling the body.")


def m_states(rng):
    v = rng.choice(["solid", "gas", "change", "liquid", "diffuse"])
    if v == "solid":
        return pack(rng, "Particle theory", "In a solid, particles are typically",
                    ["far apart and move freely", "close together and vibrate about fixed positions",
                     "close and slide over each other", "not attracted at all"], 1,
                    "Regular arrangement; vibrate about fixed positions.")
    if v == "gas":
        return pack(rng, "Particle theory", "A gas has",
                    ["fixed shape and volume", "fixed volume, no fixed shape",
                     "no fixed shape or volume", "particles that cannot move"], 2,
                    "Particles far apart; fills the container.")
    if v == "change":
        return pack(rng, "Particle theory", "The change from liquid to gas is",
                    ["melting", "evaporation / boiling", "freezing", "condensation"], 1,
                    "Liquid → gas.")
    if v == "liquid":
        return pack(rng, "Particle theory", "In a liquid, particles",
                    ["are fixed in a lattice", "are close but can slide past one another",
                     "are far apart with no forces", "do not move"], 1,
                    "Liquids flow and take the shape of the container.")
    return pack(rng, "Particle theory", "Diffusion is fastest in a",
                ["solid", "liquid", "gas", "crystal lattice at 0 K"], 2,
                    "Particles in a gas move rapidly and are far apart.")


def m_atom(rng):
    v = rng.choice(["proton", "electron", "isotope", "neutron", "mass"])
    if v == "proton":
        return pack(rng, "Atomic structure", "The particle with a positive charge in the nucleus is the",
                    ["electron", "proton", "neutron", "molecule"], 1,
                    "Proton: charge +1, in the nucleus.")
    if v == "electron":
        return pack(rng, "Atomic structure", "Electrons are found in",
                    ["the nucleus", "electron shells / energy levels", "neutrons only", "the vacuole"], 1,
                    "They occupy shells around the nucleus.")
    if v == "isotope":
        return pack(rng, "Atomic structure", "Isotopes of an element have",
                    ["the same mass number but different proton number",
                     "the same proton number but different nucleon number",
                     "different numbers of protons always", "no neutrons"], 1,
                    "Same Z (protons), different A (neutrons).")
    if v == "neutron":
        return pack(rng, "Atomic structure", "A neutron has",
                    ["charge +1", "charge −1", "no charge", "charge +2"], 2,
                    "Neutral particle in the nucleus.")
    z = rng.choice([
        (11, "sodium", "2,8,1"),
        (12, "magnesium", "2,8,2"),
        (17, "chlorine", "2,8,7"),
        (8, "oxygen", "2,6"),
    ])
    opts = ["2,8,1", "2,8,2", "2,8,7", "2,6"]
    return pack(rng, "Atomic structure",
                f"The electronic configuration of {z[1]} (proton number {z[0]}) is",
                opts, opts.index(z[2]),
                f"{z[0]} electrons fill shells: {z[2]}.")


def m_periodic(rng):
    v = rng.choice(["group", "period", "noble", "alkali", "halogen"])
    if v == "group":
        return pack(rng, "Periodic Table", "For main-group elements, the group number indicates the",
                    ["number of electron shells", "number of outer-shell electrons",
                     "mass number", "number of neutrons"], 1,
                    "Group ≈ number of outer electrons.")
    if v == "period":
        return pack(rng, "Periodic Table", "The period number of an element is the number of",
                    ["outer electrons", "occupied electron shells", "protons only", "neutrons"], 1,
                    "Period = number of occupied shells.")
    if v == "noble":
        return pack(rng, "Periodic Table", "Noble gases (Group 0/18) are",
                    ["very reactive metals", "unreactive because they have a full outer shell",
                     "halogens", "alkali metals"], 1,
                    "Full outer shell, unreactive.")
    if v == "alkali":
        return pack(rng, "Periodic Table", "Alkali metals (Group 1) become more reactive",
                    ["up the group", "down the group", "only in period 2", "when they lose the nucleus"], 1,
                    "The outer electron is more easily lost down the group.")
    return pack(rng, "Periodic Table", "The halogens are in",
                ["Group 1", "Group 7 / 17", "Group 0", "Period 1 only"], 1,
                    "Seven outer electrons; diatomic non-metals.")


def m_bond(rng):
    v = rng.choice(["ionic", "covalent", "nacl", "co2"])
    if v == "ionic":
        return pack(rng, "Bonding", "Ionic bonding is the",
                    ["sharing of a pair of electrons", "transfer of electrons from metal to non-metal, forming ions",
                     "attraction between nuclei only in metals", "hydrogen bonding in water only"], 1,
                    "Oppositely charged ions attract.")
    if v == "covalent":
        return pack(rng, "Bonding", "A covalent bond is",
                    ["the transfer of electrons", "a shared pair of electrons",
                     "a sea of protons", "an ionic lattice"], 1,
                    "Non-metals share electrons.")
    if v == "nacl":
        return pack(rng, "Bonding", "Sodium chloride is held together by",
                    ["covalent bonds only", "ionic bonds", "metallic bonds only", "hydrogen bonds only"], 1,
                    "Na⁺ and Cl⁻ in a giant ionic lattice.")
    return pack(rng, "Bonding", "A molecule of carbon dioxide contains",
                ["ionic bonds", "covalent bonds", "metallic bonds", "no bonds"], 1,
                    "C=O double covalent bonds.")


def m_acid(rng):
    v = rng.choice(["ph", "salt", "alkali", "carbonate", "metal"])
    if v == "ph":
        return pack(rng, "Acids and bases", "An acidic solution has",
                    ["pH 7", "pH less than 7", "pH greater than 7", "pH 14 only"], 1,
                    "Acids: pH < 7; excess H⁺.")
    if v == "salt":
        return pack(rng, "Acids and bases", "Which reaction is correct?",
                    ["acid + metal → salt + hydrogen", "acid + alkali → salt + oxygen",
                     "acid + carbonate → salt + hydrogen", "acid + metal → salt + water only"], 0,
                    "Suitable metals give salt + hydrogen.")
    if v == "alkali":
        return pack(rng, "Acids and bases", "Alkalis in aqueous solution contain",
                    ["H⁺", "OH⁻", "Na⁺ only", "Cl⁻ only"], 1,
                    "OH⁻ ions; pH > 7.")
    if v == "carbonate":
        return pack(rng, "Acids and bases", "Acid + carbonate produces",
                    ["salt + hydrogen", "salt + water + carbon dioxide", "salt + oxygen", "water only"], 1,
                    "Carbonates fizz with acid; CO₂ turns limewater milky.")
    return pack(rng, "Acids and bases", "A lighted splint is used to test for hydrogen. A positive result is",
                ["a pop sound", "limewater turning milky", "a glowing splint relighting", "bleaching litmus"], 0,
                    "Hydrogen burns with a squeaky pop.")


def m_indicator(rng):
    v = rng.choice(["litmus", "ui", "phen"])
    if v == "litmus":
        return pack(rng, "Indicators", "Blue litmus paper in an acid",
                    ["stays blue", "turns red", "turns green", "bleaches white always"], 1,
                    "Acids turn blue litmus red.")
    if v == "ui":
        return pack(rng, "Indicators", "Universal indicator in a strong alkali is",
                    ["red", "green", "purple / blue", "colourless always"], 2,
                    "pH 12–14 is purple/blue on UI.")
    return pack(rng, "Indicators", "Neutral solutions have pH",
                ["1", "7", "14", "0"], 1,
                    "pH 7 is neutral.")


def m_react(rng):
    v = rng.choice(["oxide", "displace", "rate", "k", "rust"])
    if v == "oxide":
        return pack(rng, "Redox", "When a metal is oxidised,",
                    ["oxygen is removed", "oxygen is added / electrons are lost",
                     "the metal always melts", "pH becomes 7 always"], 1,
                    "Oxidation: gain of oxygen or loss of electrons.")
    if v == "displace":
        return pack(rng, "Reactivity", "Which is correct?",
                    ["copper displaces magnesium from MgSO₄(aq)",
                     "magnesium displaces copper from CuSO₄(aq)",
                     "gold displaces zinc", "silver displaces sodium"], 1,
                    "A more reactive metal displaces a less reactive one.")
    if v == "rate":
        return pack(rng, "Rates of reaction", "The rate of a reaction increases when",
                    ["temperature decreases", "the surface area of a solid reactant increases",
                     "the catalyst is removed", "concentration decreases"], 1,
                    "Larger surface area → more collisions per second.")
    if v == "k":
        return pack(rng, "Reactivity", "Potassium is stored under oil because it",
                    ["is radioactive", "reacts vigorously with air and water",
                     "dissolves oil", "is a gas"], 1,
                    "Very reactive Group 1 metal.")
    return pack(rng, "Reactivity", "Iron rusts when it is in contact with",
                ["oil only", "oxygen and water", "nitrogen only", "argon"], 1,
                    "Rust is hydrated iron(III) oxide.")


def m_electro(rng):
    v = rng.choice(["need", "anode", "cathode", "cu"])
    if v == "need":
        return pack(rng, "Electrolysis", "Electrolysis requires",
                    ["a sugar solution", "a solid ionic compound with no mobile ions",
                     "a molten or aqueous ionic compound", "pure water with no ions, always"], 2,
                    "Free ions: molten or aqueous electrolyte.")
    if v == "anode":
        return pack(rng, "Electrolysis", "The anode is the",
                    ["negative electrode", "positive electrode", "electrolyte", "ammeter"], 1,
                    "Anions move to the anode.")
    if v == "cathode":
        return pack(rng, "Electrolysis", "During electrolysis, cations move to the",
                    ["anode", "cathode", "fuse", "voltmeter"], 1,
                    "Positive ions are reduced at the cathode.")
    return pack(rng, "Electrolysis", "Electrolysis of aqueous copper(II) sulfate with copper electrodes is used to",
                ["extract aluminium", "purify copper", "make sodium", "liquefy air"], 1,
                    "Copper is transferred from the impure anode to the cathode.")


def m_air(rng):
    v = rng.choice(["n2", "o2", "co2", "pollute"])
    if v == "n2":
        return pack(rng, "Air", "The most abundant gas in clean dry air is",
                    ["oxygen", "nitrogen", "carbon dioxide", "argon"], 1,
                    "About 78% nitrogen.")
    if v == "o2":
        return pack(rng, "Air", "The approximate percentage of oxygen in air is",
                    ["1%", "21%", "78%", "96%"], 1,
                    "About 21% oxygen.")
    if v == "co2":
        return pack(rng, "Air", "Carbon dioxide in air is tested with",
                    ["a lighted splint", "limewater, which turns milky", "blue litmus only", "iodine"], 1,
                    "Ca(OH)₂ + CO₂ → milky CaCO₃.")
    return pack(rng, "Air", "A pollutant gas from burning coal that causes acid rain is",
                ["argon", "sulfur dioxide", "oxygen", "nitrogen (as N₂)"], 1,
                    "SO₂ forms sulfuric acid in rain.")


def m_water(rng):
    v = rng.choice(["treat", "filter", "chlorine", "hard"])
    if v == "treat":
        return pack(rng, "Water", "Chlorine is added to drinking water to",
                    ["make it cloudy", "kill microorganisms", "add hardness", "remove all ions"], 1,
                    "Disinfection.")
    if v == "filter":
        return pack(rng, "Water", "In water treatment, filtration",
                    ["kills all viruses only", "removes solid particles", "adds fluoride only", "boils the water"], 1,
                    "Sand filters trap solids.")
    if v == "chlorine":
        return pack(rng, "Water", "Which is a correct order in treating river water for drinking?",
                    ["chlorination → screening", "screening → filtration → chlorination",
                     "boiling → mining", "electrolysis → rusting"], 1,
                    "Screen, settle, filter, then chlorinate.")
    return pack(rng, "Water", "Distilled water, compared with tap water, contains",
                ["more dissolved salts", "fewer dissolved salts", "more chlorine always", "sand"], 1,
                    "Distillation leaves dissolved solids behind.")


def m_measure(rng):
    v = rng.choice(["vol", "len", "si", "time", "temp"])
    if v == "vol":
        return pack(rng, "Measurement", "The volume of a liquid is measured with a",
                    ["metre rule", "measuring cylinder", "beam balance only", "stopwatch"], 1,
                    "Read the bottom of the meniscus.")
    if v == "len":
        return pack(rng, "Measurement", "Length is measured with a",
                    ["stopwatch", "newton meter", "metre rule / tape", "thermometer"], 2,
                    "Metre rule or tape.")
    if v == "si":
        return pack(rng, "Measurement", "The SI unit of mass is the",
                    ["kilogram", "newton", "metre per second", "degree Celsius"], 0,
                    "Kilogram (kg).")
    if v == "time":
        return pack(rng, "Measurement", "Time intervals in the laboratory are measured with a",
                    ["balance", "stopwatch / timer", "measuring cylinder", "ammeter"], 1,
                    "Stopclock or stopwatch.")
    return pack(rng, "Measurement", "Temperature is measured with a",
                ["voltmeter", "thermometer", "newton meter", "ruler"], 1,
                    "Usually in °C in school science.")


def m_density(rng):
    v = rng.choice(["def", "unit", "calc"])
    if v == "def":
        return pack(rng, "Density", "Density is",
                    ["mass × volume", "mass / volume", "volume / mass", "mass + volume"], 1,
                    "ρ = m/V.")
    if v == "unit":
        return pack(rng, "Density", "A unit of density is",
                    ["N", "g/cm³", "J", "W"], 1,
                    "g/cm³ or kg/m³.")
    m = rng.choice([20, 40, 50])
    vol = rng.choice([10, 20, 25])
    dens = m // vol
    opts = [f"{dens} g/cm³", f"{m * vol} g/cm³", f"{m + vol} g/cm³", f"{vol} g/cm³"]
    return pack(rng, "Density",
                f"An object has mass {m} g and volume {vol} cm³. Its density is",
                opts, 0, f"ρ = m/V = {m}/{vol} = {dens} g/cm³.")


def m_force(rng):
    v = rng.choice(["si", "newton", "weight", "friction", "unbal"])
    if v == "si":
        return pack(rng, "Forces", "The SI unit of force is the",
                    ["kilogram", "newton", "joule", "watt"], 1,
                    "1 N = 1 kg m/s².")
    if v == "newton":
        m = rng.choice([2, 3, 4, 5])
        a = rng.choice([2, 3, 4])
        f = m * a
        opts = [f"{m + a} N", f"{f} N", f"{m * 10} N", "0 N"]
        return pack(rng, "Forces",
                    f"A mass of {m} kg accelerates at {a} m/s². The unbalanced force is",
                    opts, 1, f"F = ma = {m} × {a} = {f} N.")
    if v == "weight":
        return pack(rng, "Forces", "The gravitational force on an object is its",
                    ["mass", "weight", "density", "volume"], 1,
                    "W = mg, a force in newtons.")
    if v == "friction":
        return pack(rng, "Forces", "Friction is a force that",
                    ["speeds objects up in all cases", "opposes motion between surfaces",
                     "has no direction", "is measured in kg"], 1,
                    "It acts opposite to the relative motion.")
    return pack(rng, "Forces", "If the resultant force on an object is zero, the object",
                ["must be at rest only", "is at rest or moves at constant velocity",
                 "must be accelerating", "must be falling"], 1,
                    "Newton’s first law.")


def m_motion(rng):
    v = rng.choice(["speed", "unit", "calc"])
    if v == "speed":
        return pack(rng, "Motion", "Average speed is",
                    ["distance × time", "distance / time", "time / distance", "mass / time"], 1,
                    "v = s/t.")
    if v == "unit":
        return pack(rng, "Motion", "The SI unit of speed is",
                    ["m/s", "N", "kg", "J"], 0,
                    "Metres per second.")
    dist = rng.choice([20, 40, 60, 100])
    t = rng.choice([4, 5, 10])
    sp = dist // t
    opts = [f"{sp} m/s", f"{dist * t} m/s", f"{dist + t} m/s", f"{t} m/s"]
    return pack(rng, "Motion",
                f"A learner runs {dist} m in {t} s. Average speed is",
                opts, 0, f"s/t = {dist}/{t} = {sp} m/s.")


def m_energy(rng):
    v = rng.choice(["form", "cons", "heat", "unit", "ke"])
    if v == "form":
        return pack(rng, "Energy", "Which energy conversion is correct?",
                    ["chemical → kinetic in a battery at rest",
                     "gravitational potential → kinetic as an object falls",
                     "sound → nuclear always", "light → mass always"], 1,
                    "Falling object: GPE → kinetic energy.")
    if v == "cons":
        return pack(rng, "Energy", "The principle of conservation of energy states that",
                    ["energy can be created", "energy cannot be created or destroyed",
                     "energy is always lost from the universe", "mass is energy only in circuits"], 1,
                    "Energy is transferred, not created or destroyed.")
    if v == "heat":
        return pack(rng, "Heat transfer", "Which statement is correct?",
                    ["Conduction occurs only in gases", "Convection occurs in solids only",
                     "Radiation does not need a medium", "Conduction is bulk movement of a fluid"], 2,
                    "Infrared radiation can travel through vacuum.")
    if v == "unit":
        return pack(rng, "Energy", "The SI unit of energy is the",
                    ["newton", "joule", "watt", "pascal"], 1,
                    "Joule (J).")
    return pack(rng, "Energy", "Kinetic energy depends on",
                ["colour only", "mass and speed", "volume only", "charge only"], 1,
                    "KE = ½mv².")


def m_heat(rng):
    v = rng.choice(["cond", "conv", "rad", "insul"])
    if v == "cond":
        return pack(rng, "Heat transfer", "Metals are good thermal conductors because they have",
                    ["no particles", "free electrons that transfer energy",
                     "a vacuum inside", "only covalent bonds"], 1,
                    "Delocalised electrons transfer energy quickly.")
    if v == "conv":
        return pack(rng, "Heat transfer", "Convection occurs in",
                    ["solids only", "fluids (liquids and gases)", "a vacuum", "crystals only"], 1,
                    "Warm fluid expands, becomes less dense and rises.")
    if v == "rad":
        return pack(rng, "Heat transfer", "A dull black surface, compared with a shiny silver surface,",
                    ["is a poor absorber of radiation", "is a good absorber and emitter of radiation",
                     "cannot emit radiation", "reflects all heat always"], 1,
                    "Dull black: good absorber and emitter.")
    return pack(rng, "Heat transfer", "A vacuum flask reduces heat loss by",
                ["convection and conduction (vacuum) and radiation (silvering)",
                 "making the tea denser", "electrolysis", "increasing surface area"], 0,
                    "Vacuum: no conduction/convection; silver: reflects radiation.")


def m_elec(rng):
    v = rng.choice(["ohm", "series", "unit", "safety", "parallel", "power"])
    if v == "ohm":
        return pack(rng, "Electricity", "Ohm’s law may be written",
                    ["V = I/R", "V = IR", "P = I/V", "R = VI"], 1,
                    "V = IR.")
    if v == "series":
        return pack(rng, "Electricity", "In a series circuit",
                    ["current is different in each component", "current is the same through each component",
                     "voltage is the same across each component always", "resistance always decreases"], 1,
                    "One path; same current.")
    if v == "unit":
        return pack(rng, "Electricity", "The SI unit of resistance is the",
                    ["ampere", "volt", "ohm", "watt"], 2,
                    "Ohm (Ω).")
    if v == "safety":
        return pack(rng, "Electrical safety", "A metal kettle is safer if it has",
                    ["a thicker live wire only", "an earth wire and a fuse / circuit breaker",
                     "no insulation", "a higher current always"], 1,
                    "Earth wire and a correctly rated fuse.")
    if v == "parallel":
        return pack(rng, "Electricity", "In a parallel circuit the potential difference across each branch is",
                    ["different and adds to the supply", "the same as the supply p.d.",
                     "always zero", "equal to the current"], 1,
                    "Each branch sees the supply voltage.")
    V = rng.choice([6, 12])
    R = rng.choice([2, 3, 4, 6])
    I = V // R
    opts = [f"{I} A", f"{V * R} A", f"{V + R} A", f"{R} A"]
    return pack(rng, "Electricity",
                f"A {R} Ω resistor is connected to a {V} V supply. The current is",
                opts, 0, f"I = V/R = {V}/{R} = {I} A.")


def m_magnet(rng):
    v = rng.choice(["poles", "field", "iron", "induce"])
    if v == "poles":
        return pack(rng, "Magnetism", "Which is true of magnets?",
                    ["North–north attract", "North–south attract", "South–south attract", "Like poles attract"], 1,
                    "Unlike poles attract; like poles repel.")
    if v == "field":
        return pack(rng, "Magnetism", "Magnetic field lines around a bar magnet",
                    ["start at south and end at north", "start at north and end at south, outside the magnet",
                     "are always circular like a ripple only", "do not exist in air"], 1,
                    "Direction is the way a north pole would move.")
    if v == "iron":
        return pack(rng, "Magnetism", "Which material is magnetic?",
                    ["copper", "iron", "plastic", "wood"], 1,
                    "Iron, cobalt, nickel (and some steels).")
    return pack(rng, "Magnetism", "A magnetic material can be magnetised by",
                ["heating it in water only", "stroking with a magnet or placing it in a coil with d.c.",
                 "painting it red", "dissolving it"], 1,
                    "Alignment of domains.")


def m_pressure(rng):
    v = rng.choice(["def", "unit", "calc", "liquid"])
    if v == "def":
        return pack(rng, "Pressure", "Pressure is defined as",
                    ["F × A", "F / A", "A / F", "F + A"], 1,
                    "P = F/A, force per unit area.")
    if v == "unit":
        return pack(rng, "Pressure", "The SI unit of pressure is the",
                    ["newton", "pascal", "joule", "watt"], 1,
                    "1 Pa = 1 N/m².")
    if v == "calc":
        F = rng.choice([20, 40, 50])
        A = rng.choice([2, 4, 5])
        P = F // A
        opts = [f"{P} N/m²", f"{F * A} N/m²", f"{F + A} N/m²", f"{A} N/m²"]
        return pack(rng, "Pressure",
                    f"A force of {F} N acts on an area of {A} m². The pressure is",
                    opts, 0, f"P = F/A = {F}/{A} = {P} N/m².")
    return pack(rng, "Pressure", "Liquid pressure increases with",
                ["depth and density of the liquid", "colour of the container",
                 "only the mass of the observer", "magnetic field only"], 0,
                    "P = ρgh.")


def m_light(rng):
    v = rng.choice(["refl", "refr", "normal", "plane"])
    if v == "refl":
        return pack(rng, "Light", "The law of reflection states that",
                    ["angle of incidence = angle of refraction always",
                     "angle of incidence = angle of reflection",
                     "light always bends towards the normal in air",
                     "a mirror absorbs all light"], 1,
                    "i = r, measured from the normal.")
    if v == "refr":
        return pack(rng, "Light", "When light travels from air into glass it",
                    ["speeds up and bends away from the normal",
                     "slows down and bends towards the normal",
                     "stops", "does not change direction ever"], 1,
                    "Glass is optically denser; speed decreases.")
    if v == "normal":
        return pack(rng, "Light", "The normal at a reflecting surface is",
                    ["parallel to the surface", "perpendicular to the surface",
                     "the incident ray", "always horizontal"], 1,
                    "A construction line at 90° to the surface.")
    return pack(rng, "Light", "The image in a plane mirror is",
                ["real and inverted", "virtual, upright and laterally inverted",
                 "real and magnified always", "on the surface of the mirror only"], 1,
                    "Same size, virtual, laterally inverted.")


def m_sound(rng):
    v = rng.choice(["need", "speed", "pitch", "loud"])
    if v == "need":
        return pack(rng, "Sound", "Sound cannot travel through",
                    ["air", "water", "a vacuum", "steel"], 2,
                    "Sound needs a medium; no particles in a vacuum.")
    if v == "speed":
        return pack(rng, "Sound", "Sound travels fastest in",
                    ["air", "water", "steel", "a vacuum"], 2,
                    "Particles are closest in a solid.")
    if v == "pitch":
        return pack(rng, "Sound", "The pitch of a sound depends on its",
                    ["amplitude", "frequency", "loudness only", "colour"], 1,
                    "Higher frequency → higher pitch.")
    return pack(rng, "Sound", "A louder sound has a greater",
                ["frequency only", "amplitude", "speed in the same medium always because it is loud", "wavelength always"], 1,
                    "Amplitude relates to loudness / energy.")


BIO_MAKERS = [m_cell, m_special, m_osmosis, m_photo, m_digest, m_enzyme, m_resp,
              m_transport, m_blood, m_repro, m_health, m_ecology, m_excrete]
CHEM_MAKERS = [m_states, m_atom, m_periodic, m_bond, m_acid, m_indicator, m_react,
               m_electro, m_air, m_water]
PHYS_MAKERS = [m_measure, m_density, m_force, m_motion, m_energy, m_heat, m_elec,
               m_magnet, m_pressure, m_light, m_sound]


def combined_p1(rng: random.Random, year: int, session: str = "November") -> list:
    """40 MCQ: about 14 Bio + 13 Chem + 13 Phys, shuffled; unique mix per seed."""
    chosen = []
    for makers, n in ((BIO_MAKERS, 14), (CHEM_MAKERS, 13), (PHYS_MAKERS, 13)):
        # sample makers with limited repeats so the paper is not one stem copied
        bag = list(makers)
        rng.shuffle(bag)
        while len(bag) < n:
            bag.extend(makers)
            rng.shuffle(bag)
        chosen.extend(bag[:n])
    rng.shuffle(chosen)
    qs = []
    seen = set()
    n = 1
    for fn in chosen:
        topic, text, opts, ans, steps = fn(rng)
        key = text
        # if a stem collides, draw once more from the same family
        if key in seen:
            topic, text, opts, ans, steps = fn(rng)
            key = text
        seen.add(key)
        qs.append(qdict(n, 1, topic, text, ans, steps, kind="mcq", options=opts,
                        markscheme=f"1 mark. Correct option {ans}."))
        n += 1
    assert len(qs) == 40
    return qs


# ---------- Paper 2 structured: 8 × 10 marks, variants differ by year ----------
def p2_cells(rng, n):
    v = rng.choice(["compare", "osmosis", "special", "enzyme"])
    if v == "compare":
        return qdict(n, 10, "Cells and organisation",
            "(a) Name two structures found in a plant cell but not in an animal cell.  [2]<br/>"
            "(b) State the function of the cell membrane.  [2]<br/>"
            "(c) Describe how to prepare a slide of onion epidermis to view under a light microscope.  [3]<br/>"
            "(d) Explain why muscle cells contain many mitochondria.  [3]",
            "(a) cell wall / chloroplast / large sap vacuole; (b) controls entry and exit of substances; "
            "(c) thin strip, water, coverslip; (d) ATP for contraction",
            [step("(a)", "Cell wall (cellulose), chloroplasts, large permanent vacuole."),
             step("(b)", "Partially permeable; controls what enters and leaves the cell."),
             step("(c)", "Thin sample, drop of water, coverslip at an angle, no air bubbles; low power then high power."),
             step("(d)", "Contraction needs energy (ATP) from aerobic respiration in mitochondria.")],
            kind="structured")
    if v == "osmosis":
        return qdict(n, 10, "Diffusion and osmosis",
            "(a) Define diffusion.  [2]<br/>"
            "(b) Define osmosis.  [2]<br/>"
            "(c) A peeled potato chip is placed in concentrated sugar solution. Describe and explain what happens to its mass.  [3]<br/>"
            "(d) Explain why root hair cells have a large surface area.  [3]",
            "(a) net movement of particles from high to low concentration; "
            "(b) water through a partially permeable membrane; "
            "(c) mass decreases — water leaves by osmosis; (d) more water/ions absorbed",
            [step("(a)", "Net movement of particles down a concentration gradient."),
             step("(b)", "Net movement of water from dilute to concentrated solution through a partially permeable membrane."),
             step("(c)", "Chip loses water by osmosis; mass decreases; may become flaccid."),
             step("(d)", "Large surface area increases the rate of osmosis and ion uptake.")],
            kind="structured")
    if v == "special":
        return qdict(n, 10, "Specialised cells",
            "(a) State one adaptation of a palisade mesophyll cell and link it to photosynthesis.  [2]<br/>"
            "(b) State one adaptation of a red blood cell for oxygen transport.  [2]<br/>"
            "(c) Describe how a sperm cell is adapted to reach and fertilise an egg.  [3]<br/>"
            "(d) Explain why ciliated cells line the trachea.  [3]",
            "(a) many chloroplasts / packed cells; (b) haemoglobin / biconcave / no nucleus; "
            "(c) flagellum, mitochondria, acrosome; (d) sweep mucus",
            [step("(a)", "Many chloroplasts / close to upper surface — absorb light."),
             step("(b)", "Haemoglobin; biconcave disc; no nucleus — more space for haemoglobin."),
             step("(c)", "Flagellum for swimming; mitochondria for energy; acrosome enzymes to penetrate the egg."),
             step("(d)", "Cilia beat to move mucus and trapped pathogens away from the lungs.")],
            kind="structured")
    return qdict(n, 10, "Enzymes",
        "(a) What is meant by a biological catalyst?  [2]<br/>"
        "(b) Name the enzyme that digests starch and the product formed.  [2]<br/>"
        "(c) Describe the effect of increasing temperature on enzyme activity up to and beyond the optimum.  [3]<br/>"
        "(d) Explain the lock-and-key model of enzyme action.  [3]",
        "(a) speeds up a reaction, not used up; (b) amylase, maltose; "
        "(c) rate rises then falls as enzyme denatures; (d) substrate fits active site",
        [step("(a)", "A protein that speeds up a reaction without being used up."),
         step("(b)", "Amylase; starch → maltose."),
         step("(c)", "Rate increases as particles collide more; beyond optimum the enzyme denatures and activity falls."),
         step("(d)", "Substrate fits the active site (lock and key); reaction occurs; products leave.")],
        kind="structured")


def p2_photo_resp(rng, n):
    v = rng.choice(["photo", "digest", "resp", "diet"])
    if v == "photo":
        return qdict(n, 10, "Photosynthesis",
            "(a) Write the balanced symbol equation for photosynthesis.  [3]<br/>"
            "(b) Name the green pigment and the organelle where it is found.  [2]<br/>"
            "(c) State two factors that can limit the rate of photosynthesis.  [2]<br/>"
            "(d) Describe a test for starch in a destarched leaf that has been exposed to light.  [3]",
            "(a) 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂; (b) chlorophyll, chloroplast; "
            "(c) light, CO₂, temperature; (d) boil, ethanol, iodine → blue-black",
            [step("(a)", "6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂ (light, chlorophyll)."),
             step("(b)", "Chlorophyll in chloroplasts."),
             step("(c)", "Light intensity, CO₂ concentration, temperature."),
             step("(d)", "Boil to stop reactions; ethanol to remove chlorophyll; iodine — blue-black if starch present.")],
            kind="structured")
    if v == "digest":
        return qdict(n, 10, "Human nutrition",
            "(a) Name the enzyme in saliva and the substrate it acts on.  [2]<br/>"
            "(b) State where bile is made and where it is stored.  [2]<br/>"
            "(c) Describe two ways the ileum is adapted for absorption.  [3]<br/>"
            "(d) Explain the role of hydrochloric acid in the stomach.  [3]",
            "(a) amylase, starch; (b) liver, gall bladder; "
            "(c) villi, thin wall, blood supply; (d) kills bacteria, pH for protease",
            [step("(a)", "Salivary amylase acts on starch."),
             step("(b)", "Made in the liver; stored in the gall bladder."),
             step("(c)", "Villi / microvilli (large area); thin epithelium; capillary and lacteal."),
             step("(d)", "Kills many microorganisms; provides acid pH for protease (pepsin).")],
            kind="structured")
    if v == "resp":
        return qdict(n, 10, "Respiration",
            "(a) Write the word equation for aerobic respiration.  [2]<br/>"
            "(b) Name the organelle where aerobic respiration occurs.  [1]<br/>"
            "(c) Distinguish between aerobic and anaerobic respiration in human muscle.  [4]<br/>"
            "(d) Suggest why a sprinter may have an oxygen debt after a race.  [3]",
            "(a) glucose + oxygen → carbon dioxide + water + energy; (b) mitochondrion; "
            "(c) oxygen, products, energy yield; (d) lactic acid oxidised later",
            [step("(a)", "Glucose + oxygen → carbon dioxide + water + energy."),
             step("(b)", "Mitochondrion."),
             step("(c)", "Aerobic: oxygen, much energy, CO₂ + water. Anaerobic in muscle: no oxygen, little energy, lactic acid."),
             step("(d)", "Lactic acid must be oxidised in the liver; extra oxygen is needed after exercise.")],
            kind="structured")
    return qdict(n, 10, "Diet and health",
        "(a) Name two components of a balanced diet other than carbohydrate.  [2]<br/>"
        "(b) State one function of protein in the body.  [2]<br/>"
        "(c) Name the deficiency disease caused by a lack of vitamin C and one caused by a lack of iron.  [2]<br/>"
        "(d) Explain why fibre (roughage) is needed in the diet.  [4]",
        "(a) protein / fat / vitamins / minerals / water / fibre; (b) growth and repair; "
        "(c) scurvy, anaemia; (d) adds bulk, prevents constipation",
        [step("(a)", "Protein, fat, vitamins, minerals, water, fibre (any two besides carbohydrate)."),
         step("(b)", "Growth and repair of tissues / enzymes / some hormones."),
         step("(c)", "Vitamin C — scurvy. Iron — anaemia."),
         step("(d)", "Fibre cannot be digested; adds bulk and helps peristalsis / prevents constipation.")],
        kind="structured")


def p2_transport(rng, n):
    v = rng.choice(["plant", "heart", "blood", "immune"])
    if v == "plant":
        return qdict(n, 10, "Transport in plants",
            "(a) State what is transported in xylem and in phloem.  [2]<br/>"
            "(b) Define transpiration.  [2]<br/>"
            "(c) Explain how the structure of xylem is adapted to its function.  [3]<br/>"
            "(d) Suggest two environmental conditions that increase the rate of transpiration.  [3]",
            "(a) xylem: water+minerals; phloem: sucrose/amino acids; "
            "(b) loss of water vapour from leaves; (c) hollow, lignin; (d) wind, heat, dry air, light",
            [step("(a)", "Xylem: water and mineral ions. Phloem: sucrose and amino acids."),
             step("(b)", "Evaporation of water from mesophyll and loss of water vapour through stomata."),
             step("(c)", "Hollow tubes (no cytoplasm); lignin strengthens and is waterproof; continuous columns."),
             step("(d)", "Higher temperature, wind, low humidity, light (stomata open) — any two with a reason.")],
            kind="structured")
    if v == "heart":
        return qdict(n, 10, "Transport in humans",
            "(a) Name the four chambers of the human heart.  [2]<br/>"
            "(b) Name the blood vessel that carries oxygenated blood from the lungs to the heart.  [1]<br/>"
            "(c) Describe the path of oxygenated blood from the lungs to a capillary in the body.  [4]<br/>"
            "(d) Give two differences between an artery and a vein.  [3]",
            "(a) RA RV LA LV; (b) pulmonary vein; "
            "(c) pulmonary vein → LA → LV → aorta → artery → capillary; "
            "(d) wall thickness, valves, direction, pressure",
            [step("(a)", "Right atrium, right ventricle, left atrium, left ventricle."),
             step("(b)", "Pulmonary vein."),
             step("(c)", "Lungs → pulmonary vein → left atrium → left ventricle → aorta → artery → capillary."),
             step("(d)", "Artery: thick muscular wall, high pressure, away from heart, no valves (except leaving heart). Vein: thinner wall, valves, to the heart.")],
            kind="structured")
    if v == "blood":
        return qdict(n, 10, "Blood",
            "(a) Name three components of blood.  [3]<br/>"
            "(b) State the function of red blood cells.  [2]<br/>"
            "(c) Describe how a white blood cell can destroy a bacterium.  [3]<br/>"
            "(d) Explain why plasma is needed.  [2]",
            "(a) RBC, WBC, platelets, plasma; (b) transport oxygen; "
            "(c) phagocytosis or antibodies; (d) transports dissolved substances",
            [step("(a)", "Red cells, white cells, platelets, plasma (any three)."),
             step("(b)", "Transport oxygen (haemoglobin)."),
             step("(c)", "Phagocytosis: engulf and digest; or lymphocytes produce antibodies."),
             step("(d)", "Transports CO₂, urea, hormones, glucose, heat.")],
            kind="structured")
    return qdict(n, 10, "Immunity",
        "(a) What is a pathogen?  [2]<br/>"
        "(b) Distinguish between an antigen and an antibody.  [2]<br/>"
        "(c) Explain how a vaccine can protect a person against a disease.  [4]<br/>"
        "(d) Suggest why antibiotics are not used to treat a viral infection such as influenza.  [2]",
        "(a) disease-causing microorganism; (b) antigen on pathogen, antibody from lymphocytes; "
        "(c) memory cells; (d) viruses are not bacteria / live inside cells",
        [step("(a)", "A microorganism that causes disease."),
         step("(b)", "Antigen: molecule on a pathogen. Antibody: protein made by lymphocytes that binds to it."),
         step("(c)", "Harmless antigen introduced; lymphocytes make antibodies and memory cells; faster response on infection."),
         step("(d)", "Antibiotics act on bacteria, not viruses.")],
        kind="structured")


def p2_repro_health(rng, n):
    v = rng.choice(["plant", "human", "malaria", "cholera"])
    if v == "plant":
        return qdict(n, 10, "Plant reproduction",
            "(a) Define pollination.  [2]<br/>"
            "(b) Name the male and female parts of a flower that produce gametes.  [2]<br/>"
            "(c) Distinguish between self-pollination and cross-pollination.  [3]<br/>"
            "(d) State what the ovule and the ovary become after fertilisation.  [3]",
            "(a) pollen from anther to stigma; (b) anther, ovary/ovule; "
            "(c) same flower vs different plant; (d) seed, fruit",
            [step("(a)", "Transfer of pollen from anther to stigma."),
             step("(b)", "Anther (pollen); ovary / ovule (ovule contains the egg)."),
             step("(c)", "Self: same flower or same plant. Cross: pollen to a different plant of the same species."),
             step("(d)", "Ovule → seed; ovary → fruit.")],
            kind="structured")
    if v == "human":
        return qdict(n, 10, "Human reproduction",
            "(a) State where sperm are produced and where fertilisation occurs in humans.  [2]<br/>"
            "(b) Name two male secondary sexual characteristics.  [2]<br/>"
            "(c) Describe one barrier method of contraception and how it works.  [3]<br/>"
            "(d) Explain how the placenta is important to the fetus.  [3]",
            "(a) testes, oviduct; (b) deep voice / hair / muscle; (c) condom; "
            "(d) exchange of nutrients, gases, wastes",
            [step("(a)", "Testes; oviduct (Fallopian tube)."),
             step("(b)", "Deepening voice, facial hair, broader shoulders, sperm production (any two)."),
             step("(c)", "Condom: physical barrier so sperm cannot reach the egg; also reduces STI transmission."),
             step("(d)", "Exchange of oxygen, nutrients and waste (urea, CO₂) between mother and fetus; attached by umbilical cord.")],
            kind="structured")
    if v == "malaria":
        return qdict(n, 10, "Health — malaria",
            "(a) Name the type of pathogen that causes malaria.  [1]<br/>"
            "(b) Name the vector of malaria.  [1]<br/>"
            "(c) Describe how malaria is transmitted from an infected person to a healthy person.  [4]<br/>"
            "(d) Suggest two methods of controlling the spread of malaria.  [4]",
            "(a) protozoan / Plasmodium; (b) female Anopheles mosquito; "
            "(c) bite, saliva, blood; (d) nets, drain water, spray, drugs",
            [step("(a)", "Protozoan (Plasmodium)."),
             step("(b)", "Female Anopheles mosquito."),
             step("(c)", "Mosquito takes a blood meal; Plasmodium in saliva injected when another person is bitten."),
             step("(d)", "Insecticide-treated nets; drain stagnant water; indoor spraying; antimalarial drugs (any two, explained).")],
            kind="structured")
    return qdict(n, 10, "Health — cholera and HIV",
        "(a) Name the type of pathogen that causes cholera.  [1]<br/>"
        "(b) Describe how cholera is transmitted.  [2]<br/>"
        "(c) Explain why oral rehydration is used to treat cholera.  [3]<br/>"
        "(d) HIV is a virus. Explain how it leads to AIDS, and state one way transmission can be reduced.  [4]",
        "(a) bacterium; (b) contaminated water/food; (c) replace water and salts; "
        "(d) destroys lymphocytes; condom / screened blood / no sharing needles",
        [step("(a)", "Bacterium (Vibrio cholerae)."),
         step("(b)", "Faecal contamination of water or food."),
         step("(c)", "Severe diarrhoea causes loss of water and salts; ORS replaces them."),
         step("(d)", "HIV infects lymphocytes, immunity fails (AIDS). Reduce: condom, screened blood, no shared needles.")],
        kind="structured")


def p2_particles(rng, n):
    v = rng.choice(["states", "atom", "bond", "periodic"])
    if v == "states":
        return qdict(n, 10, "Particle theory",
            "(a) Describe the arrangement and motion of particles in a solid and in a gas.  [4]<br/>"
            "(b) Name the change of state from solid to liquid and from gas to liquid.  [2]<br/>"
            "(c) Explain, in terms of particles, why a gas can be compressed but a liquid cannot.  [4]",
            "(a) solid: close, vibrate; gas: far, move freely; (b) melting, condensation; "
            "(c) large spaces in a gas",
            [step("(a)", "Solid: close, regular, vibrate. Gas: far apart, random rapid motion."),
             step("(b)", "Melting; condensation."),
             step("(c)", "Gas particles have large spaces so can be pushed closer. Liquid particles are already close.")],
            kind="structured")
    if v == "atom":
        z = rng.choice([(11, "sodium", "2,8,1"), (12, "magnesium", "2,8,2"), (17, "chlorine", "2,8,7")])
        return qdict(n, 10, "Atomic structure",
            "(a) Define proton number and nucleon number.  [2]<br/>"
            f"(b) {z[1].capitalize()} has proton number {z[0]}. Write its electronic configuration.  [2]<br/>"
            "(c) What are isotopes?  [2]<br/>"
            "(d) State the relative charge and location of the proton, neutron and electron.  [4]",
            f"(a) Z = protons, A = protons+neutrons; (b) {z[2]}; (c) same Z different A; "
            "(d) p +1 nucleus; n 0 nucleus; e −1 shells",
            [step("(a)", "Proton number Z = protons. Nucleon number A = protons + neutrons."),
             step("(b)", f"{z[0]} electrons: {z[2]}."),
             step("(c)", "Atoms of the same element with different numbers of neutrons."),
             step("(d)", "Proton +1 in nucleus; neutron 0 in nucleus; electron −1 in shells.")],
            kind="structured")
    if v == "bond":
        return qdict(n, 10, "Bonding",
            "(a) Describe how an ionic bond forms between sodium and chlorine.  [3]<br/>"
            "(b) Describe a covalent bond.  [2]<br/>"
            "(c) Explain why sodium chloride has a high melting point.  [3]<br/>"
            "(d) Explain why chlorine gas, Cl₂, has a low melting point.  [2]",
            "(a) Na loses 1e, Cl gains 1e, attraction; (b) shared pair; "
            "(c) strong ionic lattice; (d) weak forces between molecules",
            [step("(a)", "Na (2,8,1) loses one electron; Cl (2,8,7) gains it; Na⁺ and Cl⁻ attract."),
             step("(b)", "A shared pair of electrons between atoms."),
             step("(c)", "Giant ionic lattice; strong electrostatic forces need much energy to break."),
             step("(d)", "Simple molecules; weak intermolecular forces.")],
            kind="structured")
    return qdict(n, 10, "Periodic Table",
        "(a) What does the group number of a main-group element tell you?  [2]<br/>"
        "(b) What does the period number tell you?  [2]<br/>"
        "(c) Explain why noble gases are unreactive.  [3]<br/>"
        "(d) State how the reactivity of Group 1 metals changes down the group, and why.  [3]",
        "(a) outer electrons; (b) occupied shells; (c) full outer shell; "
        "(d) increases down — outer electron more easily lost",
        [step("(a)", "Number of electrons in the outer shell."),
         step("(b)", "Number of occupied electron shells."),
         step("(c)", "Full outer shell; no tendency to lose, gain or share electrons."),
         step("(d)", "Reactivity increases down the group; outer electron is further from the nucleus / more easily lost.")],
        kind="structured")


def p2_acids(rng, n):
    v = rng.choice(["salt", "carbonate", "electro", "rates"])
    if v == "salt":
        return qdict(n, 10, "Acids, bases and salts",
            "(a) State the pH of a strong acid and of a neutral solution.  [2]<br/>"
            "(b) Write a word equation for an acid reacting with a metal.  [2]<br/>"
            "(c) Write a word equation for an acid reacting with an alkali.  [2]<br/>"
            "(d) Describe a laboratory test for hydrogen gas.  [2]<br/>"
            "(e) Name the salt formed from hydrochloric acid and sodium hydroxide.  [2]",
            "(a) acid pH 1–3, neutral 7; (b) acid + metal → salt + hydrogen; "
            "(c) acid + alkali → salt + water; (d) lighted splint, pop; (e) sodium chloride",
            [step("(a)", "Strong acid: pH 1–3. Neutral: pH 7."),
             step("(b)", "Acid + metal → salt + hydrogen."),
             step("(c)", "Acid + alkali → salt + water (neutralisation)."),
             step("(d)", "Lighted splint; hydrogen burns with a pop."),
             step("(e)", "NaOH + HCl → NaCl + H₂O; salt is sodium chloride.")],
            kind="structured")
    if v == "carbonate":
        return qdict(n, 10, "Acids and carbonates",
            "(a) Write a word equation for hydrochloric acid reacting with calcium carbonate.  [3]<br/>"
            "(b) Describe the test for carbon dioxide.  [2]<br/>"
            "(c) Universal indicator is added to the acid before the carbonate. Describe the colour change as the acid is used up.  [2]<br/>"
            "(d) Explain why farmers add lime (calcium carbonate) to some soils.  [3]",
            "(a) CaCO₃ + HCl → CaCl₂ + H₂O + CO₂; (b) limewater milky; "
            "(c) red → orange/green; (d) reduces acidity",
            [step("(a)", "Calcium carbonate + hydrochloric acid → calcium chloride + water + carbon dioxide."),
             step("(b)", "Bubble through limewater; it turns milky."),
             step("(c)", "Red (acid) towards orange/yellow/green as pH rises."),
             step("(d)", "Lime neutralises acidic soil so plants grow better.")],
            kind="structured")
    if v == "electro":
        return qdict(n, 10, "Electrolysis",
            "(a) What is an electrolyte?  [2]<br/>"
            "(b) Name the products at the cathode and anode when molten lead(II) bromide is electrolysed.  [2]<br/>"
            "(c) Explain why solid lead(II) bromide does not conduct electricity but molten lead(II) bromide does.  [3]<br/>"
            "(d) State one industrial use of electrolysis.  [3]",
            "(a) molten or aqueous ionic compound; (b) Pb at cathode, Br₂ at anode; "
            "(c) ions free to move when molten; (d) extract Al / purify Cu / electroplate",
            [step("(a)", "A molten or aqueous ionic compound that conducts by movement of ions."),
             step("(b)", "Cathode: lead. Anode: bromine."),
             step("(c)", "In the solid the ions are fixed; when molten they are free to move."),
             step("(d)", "Extraction of aluminium, purification of copper, or electroplating.")],
            kind="structured")
    return qdict(n, 10, "Rates of reaction",
        "(a) State two ways of increasing the rate of reaction between a metal and a dilute acid, other than using a catalyst.  [2]<br/>"
        "(b) Explain, using collision theory, why increasing temperature increases rate.  [4]<br/>"
        "(c) Marble chips react with hydrochloric acid. Sketch (in words) how the volume of CO₂ against time would look, and explain why the rate falls.  [4]",
        "(a) higher concentration / temperature / surface area; "
        "(b) more frequent and more successful collisions; "
        "(c) steep then levels — acid used up",
        [step("(a)", "Increase concentration, temperature or surface area (powder)."),
         step("(b)", "Particles move faster; more collisions per second and a greater fraction have energy ≥ activation energy."),
         step("(c)", "Curve steep at first then flattens. Reactant concentration falls so collisions become less frequent.")],
        kind="structured")


def p2_metals(rng, n):
    v = rng.choice(["series", "extract", "rust", "water"])
    if v == "series":
        return qdict(n, 10, "Metals and reactivity",
            "(a) Place potassium, copper and zinc in order of decreasing reactivity.  [2]<br/>"
            "(b) Explain why potassium is stored under oil.  [2]<br/>"
            "(c) Describe what is observed when magnesium is added to copper(II) sulfate solution.  [3]<br/>"
            "(d) State one use of aluminium and a property that makes it suitable.  [3]",
            "(a) K > Zn > Cu; (b) reacts violently with air/water; "
            "(c) Mg dissolves, brown Cu, blue fades; (d) e.g. cables — low density, conducts",
            [step("(a)", "Potassium more reactive than zinc, zinc more than copper."),
             step("(b)", "Very reactive with oxygen and water; oil excludes air and moisture."),
             step("(c)", "Displacement: Mg + CuSO₄ → MgSO₄ + Cu; blue fades, brown solid."),
             step("(d)", "Aluminium: aircraft/cables — low density and good conductor; oxide layer protects.")],
            kind="structured")
    if v == "extract":
        return qdict(n, 10, "Extraction of metals",
            "(a) Name the method used to extract potassium from its ore, and the method used to extract iron.  [2]<br/>"
            "(b) Explain why potassium cannot be extracted by heating its oxide with carbon.  [3]<br/>"
            "(c) Haematite contains iron oxide. Write a word equation for the reduction of iron oxide by carbon monoxide in the blast furnace.  [3]<br/>"
            "(d) State one use of steel.  [2]",
            "(a) electrolysis, blast furnace / reduction with carbon; "
            "(b) K more reactive than carbon; (c) iron oxide + CO → iron + CO₂; (d) construction / cars",
            [step("(a)", "Potassium: electrolysis of the molten compound. Iron: reduction in the blast furnace."),
             step("(b)", "Potassium is more reactive than carbon, so carbon cannot reduce potassium compounds."),
             step("(c)", "Iron oxide + carbon monoxide → iron + carbon dioxide."),
             step("(d)", "Buildings, vehicles, tools, rails (any one).")],
            kind="structured")
    if v == "rust":
        return qdict(n, 10, "Rusting",
            "(a) Name the two substances that must be present for iron to rust.  [2]<br/>"
            "(b) Give the chemical name of rust.  [2]<br/>"
            "(c) Describe two methods of preventing rusting and explain how each works.  [4]<br/>"
            "(d) Why is aluminium slower to corrode in air than iron?  [2]",
            "(a) oxygen and water; (b) hydrated iron(III) oxide; "
            "(c) paint/oil/galvanising/sacrificial; (d) oxide layer",
            [step("(a)", "Oxygen (air) and water."),
             step("(b)", "Hydrated iron(III) oxide."),
             step("(c)", "Paint/oil: barrier to air and water. Galvanising / zinc: barrier and sacrificial protection."),
             step("(d)", "Aluminium forms a thin, unreactive oxide layer that protects the metal.")],
            kind="structured")
    return qdict(n, 10, "Air and water",
        "(a) State the approximate percentages of nitrogen and oxygen in clean dry air.  [2]<br/>"
        "(b) Describe the limewater test for carbon dioxide.  [2]<br/>"
        "(c) Outline two stages in the treatment of river water to make it safe to drink.  [4]<br/>"
        "(d) Name one pollutant from burning fossil fuels and one problem it causes.  [2]",
        "(a) N₂ ~78%, O₂ ~21%; (b) milky; (c) filter, chlorinate; (d) SO₂ acid rain / CO toxic / CO₂ climate",
        [step("(a)", "Nitrogen about 78%; oxygen about 21%."),
         step("(b)", "Limewater turns milky / cloudy."),
         step("(c)", "Screening/settling; filtration to remove solids; chlorination to kill microbes."),
         step("(d)", "Sulfur dioxide — acid rain; or carbon monoxide — toxic; or carbon dioxide — climate change.")],
        kind="structured")


def p2_physics_force(rng, n):
    v = rng.choice(["force", "energy", "pressure", "motion"])
    g = 10
    if v == "force":
        m = rng.choice([2, 4, 5])
        a = rng.choice([2, 3])
        return qdict(n, 10, "Forces",
            f"(a) State the SI units of mass, force and energy.  [3]<br/>"
            f"(b) A mass of {m} kg accelerates at {a} m/s². Calculate the unbalanced force.  [2]<br/>"
            f"(c) Calculate the weight of this mass on Earth. Take g = {g} N/kg.  [2]<br/>"
            f"(d) Describe the energy change as a ball falls from rest (ignore air resistance).  [3]",
            f"(a) kg, N, J; (b) {m * a} N; (c) {m * g} N; (d) GPE → KE",
            [step("(a)", "Mass: kilogram. Force: newton. Energy: joule."),
             step("(b) F = ma", f"{m} × {a} = {m * a} N."),
             step("(c) W = mg", f"{m} × {g} = {m * g} N."),
             step("(d)", "Gravitational potential energy is transferred to kinetic energy.")],
            kind="structured")
    if v == "energy":
        m = rng.choice([2, 4])
        h = rng.choice([5, 10])
        return qdict(n, 10, "Energy",
            "(a) State the principle of conservation of energy.  [2]<br/>"
            f"(b) A {m} kg mass is lifted through {h} m. Take g = {g} N/kg. Calculate the gain in gravitational potential energy.  [3]<br/>"
            "(c) Name the energy transfer that occurs in a battery-powered torch when it is switched on.  [2]<br/>"
            "(d) Explain how heat is transferred through the metal wall of a kettle by conduction.  [3]",
            f"(a) energy not created or destroyed; (b) {m * g * h} J; "
            "(c) chemical → electrical → light/heat; (d) free electrons / vibrating particles",
            [step("(a)", "Energy cannot be created or destroyed; it is transferred from one store to another."),
             step("(b) GPE = mgh", f"{m} × {g} × {h} = {m * g * h} J."),
             step("(c)", "Chemical (battery) → electrical → light and thermal."),
             step("(d)", "Free electrons and vibrating particles pass energy through the metal.")],
            kind="structured")
    if v == "pressure":
        F = rng.choice([40, 80, 100])
        A = rng.choice([2, 4, 5])
        return qdict(n, 10, "Pressure",
            "(a) Define pressure and state its SI unit.  [2]<br/>"
            f"(b) A force of {F} N acts on an area of {A} m². Calculate the pressure.  [3]<br/>"
            "(c) Explain why a sharp knife cuts more easily than a blunt knife for the same force.  [3]<br/>"
            "(d) State how liquid pressure changes with depth.  [2]",
            f"(a) F/A, pascal; (b) {F // A} Pa; (c) smaller area → larger pressure; (d) increases with depth",
            [step("(a)", "Pressure = force / area. SI unit pascal (N/m²)."),
             step("(b) P = F/A", f"{F} / {A} = {F // A} Pa."),
             step("(c)", "Sharp edge has smaller area so greater pressure."),
             step("(d)", "Liquid pressure increases with depth (P = ρgh).")],
            kind="structured")
    dist = rng.choice([40, 60, 100])
    t = rng.choice([5, 10, 20])
    return qdict(n, 10, "Motion",
        "(a) Define average speed.  [2]<br/>"
        f"(b) A learner runs {dist} m in {t} s. Calculate the average speed.  [3]<br/>"
        "(c) A car travels at constant velocity. What is the resultant force on the car? Explain.  [3]<br/>"
        "(d) Name the instrument used to measure time in this experiment.  [2]",
        f"(a) distance/time; (b) {dist / t:g} m/s; (c) zero — Newton 1; (d) stopwatch",
        [step("(a)", "Average speed = total distance / total time."),
         step("(b)", f"{dist} / {t} = {dist / t:g} m/s."),
         step("(c)", "Resultant force is zero (Newton’s first law); driving force balances resistive forces."),
         step("(d)", "Stopwatch / stopclock.")],
        kind="structured")


def p2_physics_elec(rng, n):
    v = rng.choice(["ohm", "safety", "magnet", "light"])
    if v == "ohm":
        V = rng.choice([6, 12])
        R = rng.choice([3, 4, 6])
        I = V / R
        return qdict(n, 10, "Electricity",
            f"(a) Draw the circuit symbols for a cell, a resistor and an ammeter.  [3]<br/>"
            f"(b) State Ohm’s law.  [2]<br/>"
            f"(c) A resistor of {R} Ω is connected to a {V} V supply. Calculate the current.  [3]<br/>"
            f"(d) State one difference between a series and a parallel circuit.  [2]",
            f"(b) V = IR; (c) {I:g} A; (d) series: same current; parallel: same voltage across branches",
            [step("(a)", "Cell: long and short line. Resistor: rectangle. Ammeter: circle with A, in series."),
             step("(b)", "V = IR (current proportional to p.d. at constant temperature)."),
             step("(c) I = V/R", f"I = {V}/{R} = {I:g} A."),
             step("(d)", "Series: one path, same current. Parallel: branches, same p.d. across each branch.")],
            kind="structured")
    if v == "safety":
        return qdict(n, 10, "Electrical safety",
            "(a) Name the three wires in a three-pin plug and state the colour of the earth wire (modern).  [3]<br/>"
            "(b) Explain the function of the fuse.  [3]<br/>"
            "(c) Explain why a metal toaster should be earthed.  [2]<br/>"
            "(d) Why must a fuse be placed in the live wire?  [2]",
            "(a) live, neutral, earth — green/yellow; (b) melts if current too high; "
            "(c) earths case if live; (d) disconnects appliance from live",
            [step("(a)", "Live, neutral, earth. Earth: green and yellow."),
             step("(b)", "If current is too large the fuse wire melts and breaks the circuit."),
             step("(c)", "If the live wire touches the case, current flows to earth and the fuse blows, so the case is not live."),
             step("(d)", "So the appliance is disconnected from the high potential of the live supply.")],
            kind="structured")
    if v == "magnet":
        return qdict(n, 10, "Magnetism",
            "(a) State the rule for attraction and repulsion of magnetic poles.  [2]<br/>"
            "(b) Name two magnetic materials.  [2]<br/>"
            "(c) Describe how to plot the magnetic field of a bar magnet using a plotting compass.  [3]<br/>"
            "(d) Explain how an electromagnet can be made stronger.  [3]",
            "(a) unlike attract, like repel; (b) iron, steel, cobalt, nickel; "
            "(c) compass, mark, join; (d) more turns / greater current / iron core",
            [step("(a)", "Unlike poles attract; like poles repel."),
             step("(b)", "Iron, steel, cobalt, nickel (any two)."),
             step("(c)", "Place compass near a pole; mark the needle direction; move along and join the points — field lines N to S."),
             step("(d)", "Increase current, increase number of turns, use a soft-iron core.")],
            kind="structured")
    return qdict(n, 10, "Light and sound",
        "(a) State the law of reflection.  [2]<br/>"
        "(b) A ray in air hits a glass block. Describe what happens to its speed and direction.  [3]<br/>"
        "(c) Explain why sound cannot travel through a vacuum, but light can.  [3]<br/>"
        "(d) State how pitch and loudness of a sound relate to the wave.  [2]",
        "(a) i = r; (b) slows, towards the normal; (c) sound needs a medium; light is EM; "
        "(d) pitch–frequency, loudness–amplitude",
        [step("(a)", "Angle of incidence equals angle of reflection (from the normal)."),
         step("(b)", "Light slows in glass and bends towards the normal (refraction)."),
         step("(c)", "Sound is a mechanical wave and needs particles. Light is electromagnetic and can travel in vacuum."),
         step("(d)", "Pitch depends on frequency; loudness depends on amplitude.")],
        kind="structured")


P2_SLOTS = [
    p2_cells,
    p2_photo_resp,
    p2_transport,
    p2_repro_health,
    p2_particles,
    p2_acids,
    p2_metals,
    p2_physics_force,
    p2_physics_elec,
]


def combined_p2(rng: random.Random, year: int, session: str = "November") -> list:
    """Eight compulsory structured questions, 10 marks each = 80.

    Fixed exam map: Q1–4 Biology, Q5–6 Chemistry, Q7–8 Physics.
    Which chemistry family appears, and which stem inside each family, depends on the seed.
    """
    bio = P2_SLOTS[:4]
    chem = rng.sample(P2_SLOTS[4:7], 2)
    # Keep a stable chemistry order: particles/bonding before acids/metals when both present
    chem.sort(key=lambda fn: P2_SLOTS.index(fn))
    phys = list(P2_SLOTS[7:9])
    ordered = bio + chem + phys
    qs = []
    for i, fn in enumerate(ordered, 1):
        q = fn(rng, i)
        q["n"] = i
        q["section"] = "A"
        q["kind"] = "structured"
        q["marks"] = 10
        qs.append(q)
    assert len(qs) == 8
    assert sum(q["marks"] for q in qs) == 80
    return qs
