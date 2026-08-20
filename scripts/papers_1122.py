"""ZIMSEC English Language 1122 — original practice papers.

Paper 1: Composition, 1 hour 30 minutes, 50 marks.
  Section A (30): one essay, 350–450 words, from seven titles.
  Section B (20): one compulsory guided piece (letter / speech / report / article).

Paper 2: Reading, 2 hours, 50 marks.
  Section A (40): original passage, comprehension (20) + summary (20).
  Section B (10): five register items, 2 marks each.

Passages and titles are original ACADEX writing — not ZIMSEC scripts.
"""
from __future__ import annotations

import random


def qdict(n, marks, topic, text, answer, steps, section="A", markscheme=None, kind="structured", options=None):
    return {
        "n": n, "section": section, "marks": marks, "topic": topic, "text": text,
        "answer": answer, "steps": steps, "parts": [],
        "markscheme": markscheme or f"{marks} mark(s). Answer: {answer}",
        "kind": kind, "options": options or [],
    }


def step(t, d=""):
    return {"t": t, "d": d}


def letters(rng, opts, correct_i):
    order = [0, 1, 2, 3]
    rng.shuffle(order)
    items = [opts[i] for i in order]
    ci = order.index(correct_i)
    labs = ["A", "B", "C", "D"]
    return [f"{labs[i]}) {items[i]}" for i in range(4)], labs[ci]


# ---------------------------------------------------------------------------
# Paper 1 — composition titles (large banks so years do not clone)
# ---------------------------------------------------------------------------
DESC = [
    "Describe a busy bus terminus at dawn.",
    "Describe the view from a kopje after rain.",
    "Describe your school on prize-giving day.",
    "Describe a night market in a growth point.",
    "Describe an old relative’s kitchen on a Sunday morning.",
    "Describe a football match that the whole township came to watch.",
    "Describe a clinic waiting room on a Monday morning.",
    "Describe a river in the dry season and after the first rains.",
    "Describe the atmosphere in an examination hall in the last ten minutes.",
    "Describe a family meal after a long journey home.",
]

NARR_OPEN = [
    "Write a story that begins: “I knew I should not have opened that door.”",
    "Write a story that begins: “The message on the screen made my hands shake.”",
    "Write a story that begins: “We were already late when the kombi stopped in the dark.”",
    "Write a story that begins: “Nobody believed me until the headmaster called my name.”",
    "Write a story that begins: “The parcel looked ordinary until I read the note.”",
    "Write a story that begins: “Rain started just as we reached the flooded drift.”",
    "Write a story that begins: “I had promised not to tell, but silence was worse.”",
    "Write a story that begins: “The last candle went out and the house seemed to listen.”",
]

NARR_END = [
    "Write a story that ends: “…and that was how a small mistake became a blessing.”",
    "Write a story that ends: “…I walked away wiser, and a little braver.”",
    "Write a story that ends: “…we never spoke of it again, but we never forgot.”",
    "Write a story that ends: “…the lost key was the least important thing we found.”",
    "Write a story that ends: “…I finally understood what my grandmother had meant.”",
    "Write a story that ends: “…and the crowd fell silent.”",
]

NARR_THEME = [
    "Write a story in which a lost phone plays an important part.",
    "Write a story in which a promise is broken and then repaired.",
    "Write a story in which a journey does not go as planned.",
    "Write a story about a misunderstanding that almost ruined a friendship.",
    "Write a story in which an animal helps a person in trouble.",
    "Write a story in which someone is wrongly accused.",
    "Write a story in which a school competition changes a learner’s life.",
    "Write a story entitled “The visitor who stayed.”",
]

ARGUE = [
    "“Teamwork is more important than talent.” Discuss.",
    "“Social media has done more harm than good to young people.” How far do you agree?",
    "Should corporal punishment be used in schools? Give your views.",
    "“A girl’s education is as important as a boy’s.” Discuss.",
    "“City life is better than rural life.” To what extent do you agree?",
    "Should learners be allowed to use mobile phones at school? Discuss.",
    "“Homework is a waste of time.” How far do you agree?",
    "Pregnant learners should be allowed to continue with school. Discuss.",
    "“Money cannot buy happiness.” Discuss.",
]

EXPOSE = [
    "Explain how you would improve water supply in your community if you were given the chance.",
    "Write about the importance of looking after school property.",
    "Explain the pressures faced by Form 4 learners in the examination year.",
    "Write about a traditional ceremony you know and why it still matters.",
    "Explain how young people can protect themselves from drug abuse.",
    "Write about the value of reading for pleasure.",
    "Explain how a school can support learners who walk long distances.",
]

ONEWORD = [
    "Courage", "Drought", "Forgiveness", "Music", "Waiting", "Harvest",
    "Silence", "Neighbour", "Pride", "The shortcut", "A second chance", "Homecoming",
]

DISCUR = [
    "The advantages and disadvantages of boarding school.",
    "The advantages and disadvantages of a free education system.",
    "Write about the benefits and problems of living with extended family.",
    "Discuss the advantages and disadvantages of part-time jobs for school learners.",
    "The advantages and disadvantages of using public transport.",
    "Write about the joys and difficulties of being the eldest child.",
]


def _plan(kind, title):
    if kind == "narrative":
        return [
            step("Form", "Narrative: beginning, complication, climax, resolution. 350–450 words."),
            step("Plan", "Who, where, when; a problem; a turning point; what changed."),
            step("Language", "Past tense (usually); varied sentences; speech punctuation; specific detail, not a list of events."),
            step("Trap", "Do not retell a film. Keep one main character and one main conflict."),
        ]
    if kind == "descriptive":
        return [
            step("Form", "Descriptive: create a picture using senses — sight, sound, smell, touch, mood."),
            step("Plan", "Wide view → closer details → people → a small moment that captures the place."),
            step("Language", "Precise nouns and verbs; original comparisons; avoid ‘very very nice’."),
            step("Trap", "Do not turn it into a full story with a long plot. Paint the scene."),
        ]
    if kind == "argument":
        return [
            step("Form", "Argumentative/discursive: introduction with a clear view, 3 developed points, a fair counter-argument, conclusion."),
            step("Plan", f"Decide your stand on: {title}"),
            step("Language", "Connectives (however, therefore, on the other hand); examples from school, home, Zimbabwe."),
            step("Trap", "Do not only rant. Show the other side briefly, then weigh it."),
        ]
    if kind == "expository":
        return [
            step("Form", "Expository: explain clearly. Introduction, logical steps or reasons, conclusion."),
            step("Plan", "What it is; why it matters; how it works / what should be done; expected result."),
            step("Language", "Formal but not stiff. Topic sentences. Concrete examples."),
            step("Trap", "Do not drift into a story. Stay on the task."),
        ]
    return [
        step("Form", "One-word topic: you may narrate, describe or discuss — but the word must be the centre of the piece."),
        step("Plan", "Choose one approach and stick to it. Link every paragraph back to the word."),
        step("Language", "Show, do not only name the word. Let the reader feel it."),
        step("Trap", "Do not write a dictionary definition and stop."),
    ]


def _comp_item(n, kind, title):
    sample = {
        "narrative": "Open in the middle of action, not ‘I woke up’. Build to one turning point, then a quiet, earned ending.",
        "descriptive": "Start with light, sound or weather. Zoom in on three striking details rather than listing everything.",
        "argument": "State your view in sentence one. Each paragraph = one reason + example. Close by answering the question.",
        "expository": "Teach the reader. Use order (first, then, finally) and practical Zimbabwean examples.",
        "oneword": "Treat the word as a lens. A short incident or a tightly organised discussion both work if the word dominates.",
        "discursive": "Balance: two advantages, two disadvantages, then a reasoned conclusion. Avoid sitting on the fence without a view.",
    }[kind]
    return qdict(
        n, 30, f"Composition — {kind}",
        "Write a composition on one of the following topics. Your answer should be between 350 and 450 words.<br/><br/>"
        f"<b>{title}</b>",
        sample,
        _plan(kind, title),
        section="A", kind="composition",
        markscheme="30 marks (content, organisation, style, accuracy). 350–450 words. Choose ONE Section A title only.",
    )


SECTION_B = [
    ("formal letter",
     "You are concerned about overflowing bins and blocked drains near your school gate. Write a letter to the Town Clerk / District Administrator.<br/>"
     "Include:<br/>• where the problem is<br/>• how it affects learners and residents<br/>• what has been tried already<br/>• what you want the office to do<br/>• how the community can help.",
     "Sender’s address and date (no ‘Dear Town Clerk’ without an address). Formal greeting. One idea per paragraph. Polite but firm close: Yours faithfully + full name."),
    ("informal letter",
     "Your cousin in another town wants to come and live with your family in order to attend a better school. Write a letter advising him or her.<br/>"
     "Include:<br/>• your honest opinion<br/>• advantages and difficulties<br/>• what life in your home is like<br/>• what he or she must be prepared to do<br/>• a clear recommendation.",
     "Your address and date. Dear + first name. Friendly tone, but organised. Yours / With love + first name. Do not use slang that an examiner cannot follow."),
    ("speech",
     "You are head boy or head girl. Give a speech at assembly on the importance of caring for school property.<br/>"
     "Include:<br/>• a greeting and purpose<br/>• two recent examples of damage or care<br/>• why property matters for learning<br/>• practical things learners can do<br/>• a short, memorable close.",
     "Address the Chair / Head / guests / fellow learners. Do not write ‘I am going to talk about’. Use ‘we’. End with a call to action and ‘I thank you’."),
    ("report",
     "The Head has asked you to write a report on the state of the school library.<br/>"
     "Include:<br/>• purpose of the report<br/>• what you observed (stock, seating, opening times)<br/>• problems<br/>• recommendations<br/>• a formal close.",
     "Title: Report on… To / From / Date. Headings. Facts before opinions. Number recommendations. Sign off with name and post (e.g. Library prefect)."),
    ("article",
     "Write an article for your school magazine on how learners can stay healthy during the examination term.<br/>"
     "Include:<br/>• a headline<br/>• sleep and food<br/>• study habits that reduce stress<br/>• the danger of energy drinks or pills<br/>• where to get help at school.",
     "Catchy but decent headline. Direct address (you). Short paragraphs. End with one practical challenge for the reader."),
    ("letter to editor",
     "Write a letter to the editor of a national newspaper about the condition of a road that learners use to get to school.<br/>"
     "Include:<br/>• the road and the problem<br/>• accidents or delays you have seen<br/>• how it affects attendance<br/>• what the responsible authority should do.",
     "Editor’s address or ‘The Editor, …’. Sir/Madam. Keep to one issue. Yours faithfully. You may use a pen name plus real name as required in class."),
    ("thank-you letter",
     "A local clinic ran a free health-education day at your school. Write a letter to the sister-in-charge, thanking the team and suggesting a follow-up.<br/>"
     "Include:<br/>• what was most useful<br/>• how learners responded<br/>• one improvement for next time<br/>• a request for a return visit.",
     "Formal layout. Grateful but specific — name a talk or demonstration. One suggestion only, politely put."),
    ("complaint letter",
     "You bought a school bag that tore within a week. Write a letter of complaint to the shop manager.<br/>"
     "Include:<br/>• when and where you bought it (invent reasonable details)<br/>• the fault<br/>• what you have already done<br/>• whether you want a replacement or a refund.",
     "Keep calm. Give facts (date, receipt, description). State the remedy. Do not insult the manager."),
    ("minutes / notice hybrid",
     "As club secretary, write a notice to members about a change of meeting date, and include the agenda for the new meeting.<br/>"
     "Include:<br/>• club name<br/>• old date and new date, time and venue<br/>• reason for the change<br/>• three agenda items<br/>• what members should bring.",
     "Clear heading NOTICE. Bold date/time. Short sentences. Secretary’s name at the end."),
]


def english_p1(rng: random.Random, year: int, session: str = "November") -> list:
    picks = [
        ("descriptive", rng.choice(DESC)),
        ("narrative", rng.choice(NARR_OPEN)),
        ("argument", rng.choice(ARGUE)),
        ("narrative", rng.choice(NARR_THEME)),
        ("expository", rng.choice(EXPOSE)),
        ("oneword", rng.choice(ONEWORD)),
        ("discursive", rng.choice(DISCUR)),
    ]
    # swap one narrative for an ending-title some years
    if rng.random() < 0.45:
        picks[3] = ("narrative", rng.choice(NARR_END))
    rng.shuffle(picks)
    qs = [_comp_item(i, k, t) for i, (k, t) in enumerate(picks, 1)]
    kind, task, tip = rng.choice(SECTION_B)
    model = (
        f"Model shape for a {kind}: layout first (address/date or speech greeting), "
        "then one short paragraph per bullet in the question, then a courteous close. "
        "Aim for 200–300 words. Cover every bullet or you leak content marks."
    )
    qs.append(qdict(
        8, 20, f"Guided writing — {kind}",
        "Answer the following question. Begin your answer on a fresh page.<br/><br/>" + task,
        model,
        [
            step("Task", f"This is a {kind}. Match layout and tone to the audience."),
            step("Cover the bullets", "Tick each bullet as you write. Missing a bullet costs content marks."),
            step("Tone", tip),
            step("Accuracy", "Paragraphs, capitals, comma after greeting, correct yours faithfully / sincerely."),
        ],
        section="B", kind="guided",
        markscheme="20 marks. Compulsory. Layout, tone, coverage of given points, language accuracy.",
    ))
    return qs


# ---------------------------------------------------------------------------
# Paper 2 — nine original passages (one per session)
# ---------------------------------------------------------------------------
def _pack_mbare():
    passage = (
        "The sun had not yet cleared the roof of the market hall when Rudo set down her crate. "
        "Mbare Musika was already a river of voices. Women slapped dust from rapoko bags; a boy "
        "pushed a wheelbarrow of cabbages as if it were a stubborn animal. Rudo’s mother had "
        "fever, and the Form Four fees were due on Friday. That was why a girl who should have "
        "been reciting Business Studies notes was tying an apron over her school gym dress.<br/><br/>"
        "She arranged tomatoes in a pyramid, the way her aunt had shown her, putting the bruised "
        "ones underneath. A man in a faded Caps jersey asked the price, shook his head, and walked "
        "on. Rudo swallowed. In class she could argue; here her voice felt thin. An older vendor "
        "called Mai Chenai leaned over. “Smile, mwanangu. People buy from a face that does not "
        "look frightened.” Rudo tried. The next customer bought six tomatoes without bargaining.<br/><br/>"
        "By mid-morning the heat sat on the tin roof like a heavy cat. Rudo’s feet ached. She "
        "kept a small notebook under the crate and, between customers, wrote a sentence of her "
        "history essay so that the day would not be wholly lost. A policeman passed, not unkindly, "
        "and she hid the book, afraid he would think she was idle. She was not idle. She was "
        "splitting herself in two.<br/><br/>"
        "Then a woman in a nurse’s uniform stopped, counted out money, and said, “These are firm. "
        "I’ll take two kilograms.” As Rudo packed, the woman added, “My daughter is writing this "
        "year too. Tell your mother the clinic at Copacabana opens at seven. She should not wait "
        "until she cannot stand.” Rudo’s eyes stung. She had not said a word about her mother.<br/><br/>"
        "When the shadows lengthened, she counted her coins twice. It was not the whole fee, but "
        "it was a beginning. She stacked the empty crate, untied the apron, and folded it as "
        "carefully as a flag. On the kombi home she opened the notebook again. The sentence she "
        "had written in the noise of the market was still there, waiting, like a promise she "
        "intended to keep."
    )
    comp = (
        "(a) Why was Rudo at the market instead of relying only on school notes?  [2]<br/>"
        "(b) What advice did Mai Chenai give her, and what was the immediate result?  [3]<br/>"
        "(c) Explain in your own words what the writer means by “splitting herself in two”.  [3]<br/>"
        "(d) How did the nurse show both kindness and perception?  [4]<br/>"
        "(e) What does Rudo’s treatment of the apron and the notebook at the end suggest about her character?  [4]<br/>"
        "(f) Give the meaning of the following as used in the passage:<br/>"
        "(i) “a river of voices”  [2]<br/>"
        "(ii) “the day would not be wholly lost”  [2]"
    )
    ans = (
        "(a) Mother had fever; Form 4 fees due Friday. "
        "(b) Smile — people buy from an unfrightened face; next customer bought six tomatoes. "
        "(c) Doing two demanding roles at once — selling and remaining a serious learner. "
        "(d) Bought tomatoes; noticed Rudo’s situation; advised clinic without being told. "
        "(e) Respect for work (folds apron); determination to study (returns to notebook). "
        "(f)(i) many voices at once / noisy crowd; (ii) she would still make some academic progress."
    )
    steps = [
        step("(a) Literal", "First paragraph: mother’s fever and Friday fees."),
        step("(b)", "Mai Chenai’s advice about smiling; six tomatoes sold."),
        step("(c) Own words", "Do not copy “splitting”. She is vendor and student at the same time."),
        step("(d) Inference", "Purchase + unsolicited clinic advice = kindness and sharp observation."),
        step("(e) Character", "Care and ambition together — not self-pity."),
        step("(f) Vocabulary in context", "Metaphor of crowd; she uses spare minutes to write the essay."),
    ]
    summary_q = (
        "In not more than 160 words, summarise Rudo’s difficulties and the help she receives, "
        "using material from the whole passage. Write in continuous prose, not notes.  [20]"
    )
    summary_a = (
        "Rudo sells tomatoes because her mother is ill and school fees are due. She is inexperienced "
        "and shy; a customer walks away. Mai Chenai tells her to smile, after which a sale is made. "
        "Heat and tiredness follow, yet she studies in a notebook between customers and hides it from "
        "a policeman. A nurse buys two kilograms, guesses the family trouble, and directs them to a "
        "clinic. By evening Rudo has part of the fee and returns to her notes on the way home."
    )
    return "A crate of tomatoes", passage, comp, ans, steps, summary_q, summary_a


def _pack_drift():
    passage = (
        "Tawanda stood at the edge of the drift and measured the brown water with his eyes. "
        "Yesterday it had been a shallow place where cattle crossed, stones showing like the "
        "backs of sleeping hippos. Overnight the river had risen, carrying sticks and a yellow "
        "jerrycan that spun as if it were late for an appointment. His English Language paper "
        "began at half past eight in the school beyond the ridge. He had no watch, but the light "
        "said he had very little time.<br/><br/>"
        "An old man sat under a msasa tree, a bicycle wheel across his knees. “If you wait, "
        "the water will think about going down,” he said. “If you do not wait, the water will "
        "not think about you.” Tawanda laughed because it was expected, then stopped laughing "
        "because the words were not a joke. He thought of his uncle, who had paid for the "
        "examination fee by selling two goats, and of the teacher who had said, “You have a "
        "quiet talent. Do not waste it on lateness.”<br/><br/>"
        "Two girls from the next village arrived, school shoes in plastic bags, skirts held "
        "above the wet grass. They looked at the drift, then at Tawanda, as if he were part "
        "of the weather. He felt suddenly older than sixteen. “We can try the fallen tree "
        "upstream,” he said, though he had never tried it with a river like this. They walked "
        "in single file. The trunk was slimy. Midway, Tawanda’s satchel swung and a textbook "
        "slipped, opened, and sailed away like a cheap boat. He almost went after it, then "
        "gripped the bark until his palms burned.<br/><br/>"
        "On the far bank they put on their shoes without speaking. Mud painted their calves. "
        "The first girl whispered, “Thank you,” as if a louder word might wake the river. "
        "They ran. At the gate the prefect was already closing the bolt. Tawanda’s name was "
        "the last on the register. He sat down, hands still shaking, and wrote his name as "
        "if it were the most important sentence he would produce that morning. Outside, far "
        "away, the yellow jerrycan was still travelling."
    )
    comp = (
        "(a) How had the drift changed overnight?  [2]<br/>"
        "(b) What two thoughts make Tawanda unwilling to turn back?  [3]<br/>"
        "(c) Why does the old man’s remark stop being funny?  [3]<br/>"
        "(d) What does the loss of the textbook show about Tawanda’s priorities?  [4]<br/>"
        "(e) How does the writer create tension in the last paragraph?  [4]<br/>"
        "(f) Explain the meaning of:<br/>(i) “he had no watch, but the light said he had very little time”  [2]<br/>"
        "(ii) “as if he were part of the weather”  [2]"
    )
    ans = (
        "(a) From shallow/stones showing to risen brown water carrying debris. "
        "(b) Uncle sold goats for the fee; teacher warned him not to waste talent on lateness. "
        "(c) The warning is serious — the river will not spare him. "
        "(d) He lets the book go rather than risk drowning; exam/life over possessions. "
        "(e) Race against the closing gate; last on the register; shaking hands; jerrycan still travelling (danger continues). "
        "(f)(i) He judges time by daylight; (ii) the girls see him as a natural obstacle/force, or as belonging to the scene, not a separate helper."
    )
    steps = [
        step("(a)", "Contrast yesterday’s shallows with this morning’s flood."),
        step("(b)", "Goats / fee; teacher’s remark — duty and hope."),
        step("(c)", "Humour dies when he realises the proverb is a real warning."),
        step("(d)", "Satchel swings; he chooses grip over the book."),
        step("(e)", "Bolt, last name, shaking, lingering jerrycan."),
        step("(f)", "Time inferred from sky; he is treated as part of the landscape of risk."),
    ]
    summary_q = (
        "In not more than 160 words, summarise Tawanda’s journey to the examination room "
        "and the decisions he makes. Use continuous prose.  [20]"
    )
    summary_a = (
        "Tawanda finds the drift flooded after rain and fears missing his English paper. An old "
        "man warns him not to cross rashly. Remembering the goats sold for his fee and his "
        "teacher’s advice, he still goes on. With two girls he uses a fallen tree upstream. The "
        "trunk is slippery; a textbook falls into the water and he does not follow it. They reach "
        "the far bank, thank him quietly, and run. He is last through the gate, sits shaking, and "
        "writes his name as the river continues to carry debris."
    )
    return "The drift", passage, comp, ans, steps, summary_q, summary_a


def _pack_clinic():
    passage = (
        "Sister Nyasha had learned to hear the difference between wind and a motorbike on the "
        "dirt road. The clinic at Nyamhuka was a low building with a veranda that peeled like "
        "sunburnt skin. On this afternoon the sky bruised quickly, and the first drops raised "
        "the smell of hot dust. A woman arrived carrying a child whose breathing sounded like "
        "paper being crumpled. “How long?” Sister Nyasha asked, already reaching for the "
        "stethoscope that had been mended with tape. “Since morning. We waited for a lift.”<br/><br/>"
        "The generator had failed at noon. A nurse-aide held a phone torch while Sister Nyasha "
        "worked. She spoke to the child as if he were a colleague, because fear made small "
        "lungs tighter. Outside, thunder walked across the hills. A file of patients under the "
        "veranda did not leave; they had walked too far to surrender their place in the queue.<br/><br/>"
        "When the child’s chest eased, the mother wept without noise, the way people weep when "
        "they have practised not being a burden. Sister Nyasha wrote a referral she was not "
        "sure they could afford, then crossed it out and wrote another that used the mission "
        "hospital’s charity desk. She hated the arithmetic of kindness, but she had become "
        "fluent in it.<br/><br/>"
        "Lightning whitened the yard. The motorbike she had been expecting belonged to Mr "
        "Gumbo, who delivered drugs when the district truck was “coming next week,” a phrase "
        "that had lost its meaning. He arrived soaked, laughing, a crate of saline on his lap "
        "as if it were a baby. “The road is a river,” he said, “but rivers can be argued with.” "
        "Sister Nyasha took the crate, and for the first time that day her hands were not "
        "entirely steady. She was not a hero in her own mind. She was a woman who had missed "
        "her son’s football match again, and who would miss the next one, and who would still "
        "unlock the clinic before the birds."
    )
    comp = (
        "(a) What two problems face the clinic in this extract?  [2]<br/>"
        "(b) Why have the patients on the veranda not gone home when the storm starts?  [2]<br/>"
        "(c) In your own words, explain “the arithmetic of kindness”.  [4]<br/>"
        "(d) What do we learn about Mr Gumbo’s character from his arrival?  [4]<br/>"
        "(e) How does the last paragraph prevent Sister Nyasha from seeming unrealistically heroic?  [4]<br/>"
        "(f) What does “waited for a lift” tell us about the family’s situation?  [4]"
    )
    ans = (
        "(a) Generator failed; storm / difficult road / late patients (any two). "
        "(b) They walked far and will not give up their place. "
        "(c) She must calculate what care people can actually pay for / use charity routes. "
        "(d) Reliable, humorous, brave — delivers drugs through a flooded road. "
        "(e) She missed her son’s match; tired ordinary mother, not a statue. "
        "(f) They have no private transport; delay made the child worse."
    )
    steps = [
        step("(a)", "Power cut; weather; supply delays — pick two with evidence."),
        step("(b)", "Distance already walked; queue as something earned."),
        step("(c)", "Paraphrase: matching treatment to poverty without refusing care."),
        step("(d)", "Soaked, laughing, crate like a baby, argues with rivers."),
        step("(e)", "Domestic cost of the job — missed football."),
        step("(f)", "Poverty and transport; time lost."),
    ]
    summary_q = (
        "Summarise, in not more than 160 words, Sister Nyasha’s actions and feelings during "
        "the afternoon. Continuous prose.  [20]"
    )
    summary_a = (
        "Sister Nyasha treats a child with difficult breathing after the family waited for a lift. "
        "The generator has failed, so she works by phone torch and talks calmly to the child. "
        "Other patients stay through the storm. When the child improves, the mother weeps quietly. "
        "Nyasha alters a referral so that charity can be used, disliking but accepting that calculation. "
        "Mr Gumbo arrives with saline on a motorbike. Her hands shake; she thinks of the son’s match "
        "she has missed, yet she will open the clinic again at dawn."
    )
    return "Nyamhuka clinic", passage, comp, ans, steps, summary_q, summary_a


def _pack_debate():
    passage = (
        "The hall smelled of floor polish and nerves. Chipo adjusted the card that said "
        "PROPOSITION and tried not to look at the teachers in the back row. The motion was "
        "“This house believes homework should be abolished.” She had been chosen because she "
        "was fluent, not because she believed the motion. That, her debate coach said, was "
        "the point of the game: to wear a view as if it were a blazer.<br/><br/>"
        "The first speaker for the opposition was Farai, who farmed facts the way his father "
        "farmed maize — in straight lines. He quoted a study, then another, until the audience "
        "grew restless. Chipo’s partner whispered, “We are dead.” Chipo shook her head. She "
        "had noticed that Farai never looked at the Form Ones in the front, who actually did "
        "the homework being discussed.<br/><br/>"
        "When her turn came, she did not begin with a definition copied from a website. She "
        "told the story of her neighbour Tinashe, who walked fourteen kilometres, fetched "
        "water, and then sat under a solar lamp that died at eight. “Homework,” she said, "
        "“is not the same burden in every house.” A teacher frowned, perhaps at the politics "
        "of it. The Form Ones leaned forward. Farai smiled a small, unwilling smile, the smile "
        "of a person who has been fairly hit.<br/><br/>"
        "They lost, narrowly. In the corridor Farai caught up with her. “Your neighbour — is "
        "he real?” “Yes.” “Then the motion is the wrong one,” he said. “We should have debated "
        "how to make homework possible.” Chipo looked at him. The blazer of the game had "
        "slipped. For a moment they were not proposition and opposition, only two learners "
        "who had seen the same country through different windows. She went home and, instead "
        "of celebrating or sulking, wrote a letter to the school development committee about "
        "study space after dark. It was not a winning speech. It was, she thought, a more "
        "useful paragraph."
    )
    comp = (
        "(a) Why was Chipo chosen to speak for the proposition?  [2]<br/>"
        "(b) How does the writer suggest Farai’s speaking style has a weakness?  [3]<br/>"
        "(c) What is the effect of Chipo’s story about Tinashe?  [4]<br/>"
        "(d) Explain “the blazer of the game had slipped” in your own words.  [3]<br/>"
        "(e) What does Chipo do after the debate, and why is it important?  [4]<br/>"
        "(f) Give one word or short phrase for “farmed facts”.  [4]"
    )
    ans = (
        "(a) Fluent, not because she believed the motion. "
        "(b) Too many studies / straight lines; ignores Form Ones; audience restless. "
        "(c) Makes homework a real, unequal burden; engages younger learners; even Farai respects it. "
        "(d) They stopped play-acting sides and spoke honestly. "
        "(e) Writes to the SDC about night study space — turns argument into action. "
        "(f) Produced / lined up / listed facts mechanically."
    )
    steps = [
        step("(a)", "Coach chose fluency; belief not required."),
        step("(b)", "Straight-line facts; no eye for those who do the homework."),
        step("(c)", "Concrete example beats stacked quotations."),
        step("(d)", "Metaphor: official role dropped."),
        step("(e)", "Letter > trophy; useful paragraph."),
        step("(f)", "Metaphor of farming in rows = mechanical listing."),
    ]
    summary_q = (
        "In not more than 160 words, summarise what happens in the debate and what Chipo "
        "learns from it.  [20]"
    )
    summary_a = (
        "Chipo must argue that homework should be abolished although she does not believe it. "
        "Farai opposes with many studies and loses the audience. Chipo instead describes a "
        "neighbour who walks far and loses light at eight, showing homework is unequal. They "
        "lose narrowly. Farai asks if the neighbour is real and suggests a better motion about "
        "making homework possible. Chipo writes to the development committee about study space "
        "after dark, choosing practical action over winning."
    )
    return "The motion", passage, comp, ans, steps, summary_q, summary_a


def _pack_bicycle():
    passage = (
        "Sekuru’s hands were a map of old cuts. He turned the bicycle upside down in the "
        "yard, the cracked saddle pointing at a sky the colour of diluted milk. Nokutenda "
        "held the wheel as he had been told, proud and slightly afraid of doing it wrong. "
        "“A bicycle is honest,” Sekuru said. “If a spoke is lazy, the whole wheel tells you.” "
        "He did not look up. He spoke to the metal the way some people speak to cattle, with "
        "respect that is not sentiment.<br/><br/>"
        "They lived at the edge of a growth point where the tar ended and the dust began. "
        "Kombi horns argued all afternoon. Nokutenda’s school was three kilometres away. "
        "When the bicycle had failed last week, he had arrived with red soil to the knees "
        "and a late mark in the register. He had not cried, but he had felt the late mark "
        "as a kind of stain.<br/><br/>"
        "Sekuru loosened a nut, then put the spanner down and made Nokutenda loosen the next. "
        "“If I do it all, you will only own a ride. If you do it, you will own a skill.” "
        "The boy’s fingers slipped. He expected anger. Sekuru only spat to the side, not at "
        "him, and said, “Again. The iron does not hate you.” A radio in the next yard played "
        "a gospel chorus too fast. Somewhere a baby protested the heat.<br/><br/>"
        "When the chain sat true, Sekuru spun the pedal with one finger. The sound was clean. "
        "He stood the bicycle up and held the handlebars towards Nokutenda as if presenting "
        "a diploma. “You will still be late if you start late,” he added, because wisdom in "
        "that house always came with a sting. Nokutenda wheeled the bicycle to the path, "
        "then came back and picked up the greasy rag. He wiped the frame until the old red "
        "paint showed. It was not beauty. It was thanks, translated into work."
    )
    comp = (
        "(a) Where does the scene take place, and why does the bicycle matter to Nokutenda?  [3]<br/>"
        "(b) What does Sekuru mean by “A bicycle is honest”?  [3]<br/>"
        "(c) Why does Sekuru insist that the boy loosen the nut himself?  [3]<br/>"
        "(d) How does the writer show that Sekuru is strict but not cruel?  [4]<br/>"
        "(e) Explain the last sentence in your own words.  [3]<br/>"
        "(f) What is the effect of mentioning the radio and the baby?  [4]"
    )
    ans = (
        "(a) Yard at a growth point; bicycle is how he reaches school on time. "
        "(b) Faults show themselves; you cannot pretend a lazy spoke is fine. "
        "(c) So the boy owns a skill, not only a ride. "
        "(d) No anger when fingers slip; ‘the iron does not hate you’; still warns about lateness. "
        "(e) Cleaning the frame is his way of saying thank you. "
        "(f) Places the lesson in ordinary noisy life; not a fairy-tale workshop."
    )
    steps = [
        step("(a)", "Setting + late mark last week."),
        step("(b)", "Honesty = mechanical truth."),
        step("(c)", "Quoted contrast ride vs skill."),
        step("(d)", "Spits aside, not at the boy; sting in the proverb about starting late."),
        step("(e)", "Paraphrase ‘thanks, translated into work’."),
        step("(f)", "Background soundscape = realism."),
    ]
    summary_q = (
        "Summarise in not more than 160 words what Sekuru teaches Nokutenda and how the boy "
        "responds.  [20]"
    )
    summary_a = (
        "Sekuru repairs an upside-down bicycle with Nokutenda in a growth-point yard. The boy "
        "needs the bicycle for the three-kilometre walk to school after being marked late. "
        "Sekuru says machines reveal their faults honestly and makes the boy use the spanner "
        "so that he gains a skill. When the boy slips, Sekuru is calm. After the chain runs "
        "true he warns that a bicycle will not help a late start. Nokutenda takes the bicycle, "
        "returns, and cleans the frame as a form of thanks."
    )
    return "A bicycle is honest", passage, comp, ans, steps, summary_q, summary_a


def _pack_library():
    passage = (
        "The library was a rectangle of quiet in a school that lived by the bell. Miss Dube "
        "ruled it without shouting. She had a stamp, a register, and a look that could stop "
        "a joke in the doorway. Tendai hovered at the counter with money that was not enough "
        "for a library card. He had counted the coins in the boys’ toilets so that no one "
        "would see how few they were.<br/><br/>"
        "“I can read here and not take books home,” he offered, as if bargaining with a "
        "kombi conductor. Miss Dube considered him. She knew his record: late sometimes, "
        "never rude, marks that jumped when a teacher lent him a set book. “The rule is the "
        "rule,” she said, and Tendai’s face closed like a book with no blurb. Then she added, "
        "“But rules can have annexes.” She wrote his name in a small notebook of her own, "
        "not the official one. “You may sit at table four for two weeks. If you return every "
        "spine as you found it, we will talk about the card.”<br/><br/>"
        "Table four faced a poster of a child reading under a msasa tree, the kind of poster "
        "printed in another country and faded by Zimbabwean light. Tendai did not care. He "
        "had Animal Farm in his hands — the school copy, covers soft as cloth. He read as if "
        "eating. At the end of the period he waited for the others to leave so that he could "
        "align the chair exactly.<br/><br/>"
        "On the tenth day Miss Dube placed a card on the table. It had his name in black ink "
        "and a stamp that was slightly crooked. “I paid the difference,” she said, before he "
        "could invent a speech. “Do not thank me with words. Thank me by not disappearing "
        "when the examinations end. Libraries are for after the report book as well.” Tendai "
        "nodded, which was all the English he could trust. Outside, someone rang the bell for "
        "the next lesson. He put the card in his shirt pocket, over his heart, because there "
        "was no other pocket he was willing to trust."
    )
    comp = (
        "(a) Why does Tendai not simply buy a library card?  [2]<br/>"
        "(b) What do we learn about Tendai as a learner before Miss Dube helps him?  [3]<br/>"
        "(c) Explain “rules can have annexes”.  [3]<br/>"
        "(d) How does Tendai show he deserves the chance she gives him?  [4]<br/>"
        "(e) What does Miss Dube want in return besides thanks?  [4]<br/>"
        "(f) Why does he put the card over his heart?  [4]"
    )
    ans = (
        "(a) He has too little money. "
        "(b) Sometimes late, never rude; marks improve when lent set books. "
        "(c) She will keep the official rule but add a temporary extra arrangement. "
        "(d) Sits at table four; treats books carefully; aligns the chair; returns for ten days. "
        "(e) That he keeps reading after exams, does not disappear. "
        "(f) Values it / has no safer pocket; emotional importance."
    )
    steps = [
        step("(a)", "Coins counted in secret; not enough."),
        step("(b)", "Character sketch in paragraph 2."),
        step("(c)", "Annex = extra clause; unofficial notebook."),
        step("(d)", "Behaviour at table four."),
        step("(e)", "Direct speech about after the report book."),
        step("(f)", "Literal pocket + figurative heart."),
    ]
    summary_q = (
        "In not more than 160 words, summarise how Tendai gets access to the library and "
        "what Miss Dube expects.  [20]"
    )
    summary_a = (
        "Tendai cannot afford a library card and offers to read on site. Miss Dube knows he "
        "is polite and improves when given books. She will not break the rule openly but lets "
        "him use table four for two weeks if he treats books well. He reads carefully and "
        "tidies his chair. On the tenth day she gives him a card, having paid the difference, "
        "and tells him not to thank her in words but to keep using the library after examinations."
    )
    return "Table four", passage, comp, ans, steps, summary_q, summary_a


def _pack_peanuts():
    passage = (
        "The idea began as a joke in the agriculture club. “If we roast peanuts, we can sell "
        "them at the gate and buy netballs,” said Blessing, who spoke as if every sentence "
        "were already a success. Nyasha, who preferred weighing things, asked about capital, "
        "hygiene, and the teacher on duty. The club laughed, then, because jokes that sit "
        "too long become plans, they stopped laughing.<br/><br/>"
        "They borrowed a pot from the Home Economics room and a tarpaulin from the groundsman, "
        "who said he would deny everything if the Head asked. On Friday they roasted until "
        "the air behind the laboratory smelled like a bus station kiosk. Nyasha kept a cash "
        "book. Blessing kept talking. A prefect threatened to report them for “informal "
        "trading,” a phrase he had heard his father use. Nyasha showed him the club minutes "
        "and the teacher’s signature. The prefect left, robbed of a speech.<br/><br/>"
        "By week three they had enough for one netball and a problem: boys from another "
        "stream wanted a “tax” for “security.” Blessing’s mouth opened. Nyasha closed it "
        "with a look and went to the sports teacher, not the bullies. The teacher walked "
        "with them to the gate the next Friday and bought a packet himself. The tax vanished "
        "like steam.<br/><br/>"
        "When the netball arrived, still smelling faintly of rubber and possibility, the "
        "girls’ team did not cheer as films had taught them to cheer. They tested the ball "
        "on the rough pitch, argued about who would play centre, and got on with it. Nyasha "
        "wrote in the cash book: Stock finished. Ball bought. Lesson: keep records, and do "
        "not pay tax to people who do not exist. Blessing, for once, had nothing to add, "
        "which Nyasha took as a kind of applause."
    )
    comp = (
        "(a) What was the original purpose of roasting peanuts?  [2]<br/>"
        "(b) Contrast Blessing and Nyasha as club members.  [4]<br/>"
        "(c) How does Nyasha deal with the prefect and later with the “tax”?  [4]<br/>"
        "(d) Why is the groundsman’s remark humorous?  [2]<br/>"
        "(e) What does the team’s reaction to the new ball suggest?  [4]<br/>"
        "(f) Explain “people who do not exist”.  [4]"
    )
    ans = (
        "(a) To raise money to buy netballs. "
        "(b) Blessing: talk, optimism; Nyasha: records, hygiene, procedure, quiet authority. "
        "(c) Prefect: shows signed minutes. Tax: reports to sports teacher, who buys a packet publicly. "
        "(d) He helps but will deny it — comic cowardice / self-protection. "
        "(e) Practical, not theatrical; they get on with the game. "
        "(f) The bullies have no real authority; their ‘security’ is imaginary."
    )
    steps = [
        step("(a)", "First paragraph — netballs."),
        step("(b)", "Joke vs weighing; cash book vs talking."),
        step("(c)", "Paper authority, then adult witness."),
        step("(d)", "Irony of help plus denial."),
        step("(e)", "No film cheer; argument about centre."),
        step("(f)", "Last cash-book lesson."),
    ]
    summary_q = (
        "Summarise in not more than 160 words how the peanut project succeeds and the "
        "obstacles it meets.  [20]"
    )
    summary_a = (
        "The agriculture club decides to roast peanuts to buy netballs. They borrow a pot and "
        "tarpaulin. A prefect accuses them of informal trading but leaves when Nyasha shows "
        "signed minutes. Sales go well until other boys demand a tax. Nyasha tells the sports "
        "teacher, who comes to the gate and buys peanuts, ending the demand. They buy a netball. "
        "Nyasha records the lesson: keep records and refuse fake authority. Blessing is briefly "
        "silent."
    )
    return "Peanuts and netballs", passage, comp, ans, steps, summary_q, summary_a


def _pack_mill():
    passage = (
        "The grinding mill at Chikwarakwara ran after dark because electricity, when it came, "
        "came like a guest who had lost the address. People sat on maize sacks under a naked "
        "bulb that flickered as if it were thinking. Pairos, who was twelve, had been sent "
        "with a bucket of grain and instructions not to talk to strangers, which was difficult "
        "when the whole ward was in the queue.<br/><br/>"
        "A woman sang hymns under her breath. A man complained that the miller overcharged "
        "when it rained, as if weather were a spice he added to the price. Pairos watched "
        "the miller’s hands. They were white with mealie-meal, gentle with the machine and "
        "short with people. When Pairos’s turn came, the belt slipped. The miller swore, "
        "not at the boy, at the belt, and for ten minutes the bulb and the night were equally "
        "useless.<br/><br/>"
        "In that uselessness, a girl from Pairos’s school, two classes above, shared roasted "
        "maputi from a pocket. She did not ask why he was out so late. She talked about a "
        "teacher who made history sound like gossip, which was, she said, the only way some "
        "of it could be swallowed. Pairos laughed and then remembered the instruction about "
        "strangers, and then decided that a girl with maputi was not what his mother had meant.<br/><br/>"
        "The belt was fixed. Grain became meal with a roar that ended conversation. Walking "
        "home, the bucket heavier, Pairos felt the path with his feet because the moon was "
        "stingy. He thought of the miller, married to a machine, and of the girl who had "
        "made the wait smaller. He would not tell the whole story at home. He would say the "
        "mill was crowded and the price was the same. Some truths, he was beginning to "
        "understand, were for keeping in the mouth like a sweet, not for putting on the table."
    )
    comp = (
        "(a) Why does the mill operate after dark?  [2]<br/>"
        "(b) What impression do you get of the miller?  [4]<br/>"
        "(c) How does the girl change Pairos’s wait?  [3]<br/>"
        "(d) Why does Pairos decide she is not the ‘stranger’ his mother meant?  [3]<br/>"
        "(e) Explain the last sentence in your own words.  [4]<br/>"
        "(f) What does “the moon was stingy” mean?  [4]"
    )
    ans = (
        "(a) Electricity arrives irregularly / at odd hours. "
        "(b) Skilled with the machine, impatient with people, swears at the belt not the boy. "
        "(c) Shares maputi and talk; makes the delay bearable. "
        "(d) She is from his school; kindness, not danger. "
        "(e) Some experiences are private; he will not report every detail at home. "
        "(f) Little moonlight / a dark path."
    )
    steps = [
        step("(a)", "Electricity like a lost guest."),
        step("(b)", "White hands; gentle/short contrast."),
        step("(c)", "Maputi + history-as-gossip."),
        step("(d)", "He reinterprets ‘stranger’."),
        step("(e)", "Sweet in the mouth vs table — private vs public truth."),
        step("(f)", "Personification of a dim moon."),
    ]
    summary_q = (
        "In not more than 160 words, summarise Pairos’s evening at the mill and what he "
        "chooses to tell at home.  [20]"
    )
    summary_a = (
        "Pairos is sent at night to a mill that works when electricity finally comes. The queue "
        "is full of complaints and hymns. When his turn comes the belt slips and the miller "
        "repairs it, swearing at the machine. A slightly older schoolgirl shares maputi and "
        "talks about a history teacher. Pairos decides she is not a dangerous stranger. He walks "
        "home in poor moonlight with a heavier bucket and plans to tell his mother only that the "
        "mill was busy and the price unchanged, keeping the rest private."
    )
    return "The mill after dark", passage, comp, ans, steps, summary_q, summary_a


def _pack_kombi():
    passage = (
        "Baba VaShingi had driven the same kombi for eleven years, the one with a door that "
        "needed a shoulder and a radio that knew only two stations. He did not like children "
        "who ate simba chips and wiped their hands on his seats, but he liked children who "
        "said good morning, which, he claimed, was becoming rare as winter rain. On a Tuesday "
        "that smelled of dust and overripe mangoes, a small boy remained on the back seat "
        "after the last rank at Town House.<br/><br/>"
        "“Where is your mother?” Baba VaShingi asked. The boy looked at him as if the question "
        "were in another language. He held a plastic bag with a maths book and an orange. "
        "The conductor had already gone to buy sadza. For a moment the driver felt the old "
        "temptation to be only a driver, not an uncle to the whole city. Then he locked the "
        "doors from the inside, because the rank had its own weather, and phoned the number "
        "written in biro on the book’s first page.<br/><br/>"
        "No one answered. He tried again. A woman picked up on the fourth attempt, voice "
        "sharp with the fear of people who work far from their children. “He was supposed to "
        "get off at Copacabana.” Baba VaShingi looked at the boy, who had begun to peel the "
        "orange as if that were a kind of prayer. “I will bring him,” he said. “Do not pay "
        "another kombi to panic.”<br/><br/>"
        "They drove against the flow of knocking-off traffic. The boy offered him a piece of "
        "orange. He refused, then accepted, because refusal can sound like anger. At the gate "
        "of a block of flats in Eastlea, the woman was already waiting, shoes in her hand, "
        "as if she had run the last stretch. She tried to press extra money on him. He shook "
        "his head. “Teach him to speak,” he said, not unkindly. “The city is loud. A quiet "
        "child is easily leftover.” He climbed back into the kombi. The door needed a "
        "shoulder. The radio found, miraculously, a third station."
    )
    comp = (
        "(a) What first tells Baba VaShingi that something is wrong?  [2]<br/>"
        "(b) What inner conflict does he experience before he helps the boy?  [3]<br/>"
        "(c) How does the writer show the mother’s fear?  [3]<br/>"
        "(d) Why does he accept the orange after first refusing?  [3]<br/>"
        "(e) Explain “a quiet child is easily leftover” in your own words.  [4]<br/>"
        "(f) What is suggested by the radio finding a third station at the end?  [5]"
    )
    ans = (
        "(a) The boy is still on the back seat after the last rank. "
        "(b) Temptation to remain ‘only a driver’ versus acting as guardian. "
        "(c) Sharp voice; working far away; waiting with shoes in hand, having run. "
        "(d) So that refusal is not mistaken for anger. "
        "(e) A child who does not speak up can be forgotten / left behind in a busy city. "
        "(f) A small lift in mood / things slightly improved after a decent act; not magic, a modest grace."
    )
    steps = [
        step("(a)", "Last rank, child still seated."),
        step("(b)", "‘Uncle to the whole city’ versus professional distance."),
        step("(c)", "Phone voice; shoes in hand."),
        step("(d)", "Tone management."),
        step("(e)", "Paraphrase leftover = left behind."),
        step("(f)", "Symbolic little miracle, understated."),
    ]
    summary_q = (
        "Summarise in not more than 160 words what Baba VaShingi does when he finds the boy "
        "and what he tells the mother.  [20]"
    )
    summary_a = (
        "After the last drop at Town House, a small boy remains in the kombi with a maths book "
        "and an orange. The driver almost ignores the problem, then locks the doors and phones "
        "the number in the book. The mother, frightened, says the boy should have alighted at "
        "Copacabana. Baba VaShingi takes him to Eastlea, accepts a piece of orange so as not to "
        "seem angry, refuses extra money, and tells her to teach the child to speak up because "
        "a quiet child is easily left behind in a loud city."
    )
    return "The leftover passenger", passage, comp, ans, steps, summary_q, summary_a


PACKS = [
    _pack_mbare, _pack_drift, _pack_clinic, _pack_debate, _pack_bicycle,
    _pack_library, _pack_peanuts, _pack_mill, _pack_kombi,
]


REGISTER_BANK = [
    ("You bump into a teacher who is carrying a pile of books. The most appropriate thing to say is",
     ["Watch where you’re going!", "Sorry, Sir/Madam. Let me help you with those.",
      "Those books are too many anyway.", "Move, I was here first."], 1,
     "Apologise and offer help — polite, formal, responsible."),
    ("You are late for a lesson. When you enter, you should say",
     ["It’s not my fault, the bell is wrong.", "May I come in, Sir/Madam? I am sorry I am late.",
      "What did I miss?", "The other class is also late."], 1,
     "Ask permission; apologise; no excuses first."),
    ("A visitor asks you for directions to the Head’s office. The best reply is",
     ["Can’t you read the signs?", "This way, please. I’ll show you.",
      "Why do you want the Head?", "Ask someone else, I’m busy."], 1,
     "Helpful and courteous to a visitor."),
    ("Your friend has just failed a test and looks upset. The most appropriate comment is",
     ["I told you you were lazy.", "That paper was easy, actually.",
      "I’m sorry. We can go through it together if you want.", "Failure is your brand now."], 2,
     "Empathy plus a practical offer; no mockery."),
    ("You answer a landline in an office. The proper opening is",
     ["Yes?", "Who is this?", "Good morning, Mutasa High School, may I help you?",
      "Talk, I’m listening."], 2,
     "Identify the institution; greet; offer help."),
    ("At a funeral, a neighbour is grieving. You should say",
     ["You’ll get over it.", "At least they were old.",
      "I’m sorry for your loss. I am here with you.", "Let’s discuss the will."], 2,
     "Simple condolence; presence, not advice."),
    ("You need to interrupt two teachers who are talking. You say",
     ["Hey, I need the key now.", "Excuse me, Sir and Madam, may I interrupt for a moment?",
      "You two never stop talking.", "Keys!"], 1,
     "Excuse me + may I — formal interruption."),
    ("A shop assistant short-changes you. The appropriate register is",
     ["You thieves!", "Excuse me, I think the change is not correct. Could we check, please?",
      "Give me my money before I call the police, now!", "Whatever, keep it, poor people."], 1,
     "Firm, polite, assume a mistake first."),
    ("You are introducing a guest speaker at assembly. You should not say",
     ["We are honoured to welcome…", "Our guest tonight is…",
      "This one here is some guy from town.", "I thank you for coming to address us."], 2,
     "‘This one here is some guy’ is rude and informal."),
    ("A classmate borrows your pen and does not return it. You say",
     ["You always steal.", "May I have my pen back, please? I need it for the next lesson.",
      "I’m telling the whole school.", "Buy your own, beggar."], 1,
     "Direct, polite request."),
    ("Writing to a Head about a leaking classroom, the complementary close should be",
     ["Yours", "See you", "Yours faithfully", "Love"], 2,
     "Unknown recipient in office = Yours faithfully."),
    ("A tourist in your town asks if it is ‘safe’. The most appropriate reply is",
     ["Why, are you scared?", "Generally yes, but keep your bag closed and use registered taxis.",
      "This place is a jungle, run.", "I don’t talk to foreigners."], 1,
     "Honest, practical, civil."),
    ("Your little brother spills tea on a visitor. You say to the visitor",
     ["He’s always clumsy.", "I’m so sorry. Let me fetch a cloth.",
      "It’s only tea.", "You should have moved."], 1,
     "Apologise and act."),
    ("On WhatsApp, your aunt asks you to greet your mother. You reply",
     ["Tell her yourself lol.", "I will pass on your greetings, Aunt. Thank you.",
      "K", "Mom is annoying today."], 1,
     "Even on WhatsApp, elders get full courtesy."),
    ("A librarian asks you to lower your voice. You say",
     ["This is a free country.", "Sorry, I’ll be quieter.",
      "Other people are louder.", "Make me."], 1,
     "Immediate compliance plus apology."),
]


def english_p2(rng: random.Random, year: int, session: str = "November") -> list:
    key = {
        (2018, "November"): 0, (2019, "November"): 1, (2020, "November"): 2,
        (2021, "November"): 3, (2022, "November"): 4, (2023, "November"): 5,
        (2024, "November"): 6, (2023, "June"): 7, (2024, "June"): 8,
    }.get((year, session), year % 9)
    title, passage, comp, ans, steps, summary_q, summary_a = PACKS[key]()
    qs = []
    qs.append(qdict(
        1, 0, "Reading passage",
        f"<b>{title}</b><br/><br/>{passage}",
        "Read the passage carefully before answering Section A.",
        [step("Read twice", "First for the story, second with a pencil for question words.")],
        section="A", kind="passage",
        markscheme="Insert. Do not copy from a published book — original ACADEX passage.",
    ))
    qs.append(qdict(
        2, 20, "Comprehension",
        comp, ans, steps, section="A", kind="structured",
        markscheme="20 marks. Use own words where asked. Quote only when the question allows.",
    ))
    qs.append(qdict(
        3, 20, "Summary",
        summary_q, summary_a,
        [
            step("Boundary", "Use only the material the question names. Extra story = no extra marks."),
            step("Points", "List 8–12 short points, then join them with commas and linking words."),
            step("Length", "About 145–165 words. Under 140 usually means omitted points."),
            step("Style", "One paragraph of continuous prose; no notes, no ‘the passage says’."),
        ],
        section="A", kind="summary",
        markscheme="20 marks (content points + language). Own words where possible; keep order of the passage.",
    ))
    # five register items, unique mix
    bank = list(REGISTER_BANK)
    rng.shuffle(bank)
    for i, item in enumerate(bank[:5], 4):
        stem, opts, ci, why = item
        labeled, key_ans = letters(rng, opts, ci)
        qs.append(qdict(
            i, 2, "Register",
            stem + ":",
            key_ans,
            [step("Audience and purpose", why),
             step("Eliminate", "Cross out slang, insult, and anything that shifts blame.")],
            section="B", kind="mcq", options=labeled,
            markscheme=f"2 marks. Correct register: {key_ans}.",
        ))
    return qs
