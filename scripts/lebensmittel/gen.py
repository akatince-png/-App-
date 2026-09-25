# Erzeugt src/data/lebensmittel.js aus USDA FoodData Central (gemeinfrei):
# SR Legacy (2018-04) und FNDDS/Survey (2024-10-31). Vorher laden + entpacken:
#   https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_csv_2018-04.zip
#   https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_survey_food_csv_2024-10-31.zip (nach fndds/)
# karte.py: exakte USDA-Beschreibung; neu.txt: Regex (^...) oder MANUELL_*.
# Kohlenhydrate wie auf deutschen Etiketten OHNE Ballaststoffe (USDA: mit).
import csv, glob, json, re
from collections import defaultdict
exec(open("karte.py", encoding="utf-8").read())
SR = "FoodData_Central_sr_legacy_food_csv_2018-04/"
FN = glob.glob("fndds/**/", recursive=True)
FN = [d for d in FN if d.endswith("2024-10-31/")][0]
foods = []
for base in (SR, FN):
    for r in csv.DictReader(open(base + "food.csv", encoding="utf-8")):
        foods.append((r["description"], r["fdc_id"], base))
exakt = {}
for d, i, b in foods:
    exakt.setdefault(d, (i, b))

MANUELL = {
    "MANUELL": dict(kcal=46, eiweiss=1.0, fett=1.5, kh=6.7, zucker=4.0, ballast=0.8, omega3=110, epaDha=0, omega6=280),
    "MANUELL_NUTELLA": dict(kcal=539, eiweiss=6.3, fett=30.9, kh=57.5, zucker=56.3, ballast=3.4, omega3=100, epaDha=0, omega6=2900),
    "MANUELL_ACAI": dict(kcal=534, eiweiss=8.1, fett=32.5, kh=8.0, zucker=0, ballast=44, omega3=300, epaDha=0, omega6=3900),
    "MANUELL_MATCHA": dict(kcal=324, eiweiss=30.6, fett=5.3, kh=4.0, zucker=0, ballast=35, omega3=1000, epaDha=0, omega6=500),
    "MANUELL_HEFE": dict(kcal=350, eiweiss=50, fett=5, kh=12, zucker=0, ballast=20, omega3=0, epaDha=0, omega6=0),
    "MANUELL_HANFOEL": dict(kcal=884, eiweiss=0, fett=100, kh=0, zucker=0, ballast=0, omega3=20000, epaDha=0, omega6=55000),
    "MANUELL_KUERBISKERNOEL": dict(kcal=884, eiweiss=0, fett=100, kh=0, zucker=0, ballast=0, omega3=500, epaDha=0, omega6=55000),
    "MANUELL_MCT": dict(kcal=830, eiweiss=0, fett=100, kh=0, zucker=0, ballast=0, omega3=0, epaDha=0, omega6=0),
    "MANUELL_MARK": dict(kcal=786, eiweiss=7, fett=84, kh=0, zucker=0, ballast=0, omega3=200, epaDha=0, omega6=1500),
    "MANUELL_ALGENOEL": dict(kcal=884, eiweiss=0, fett=100, kh=0, zucker=0, ballast=0, omega3=45000, epaDha=45000, omega6=1500),
    "MANUELL_HALLOUMI": dict(kcal=320, eiweiss=21, fett=25, kh=2, zucker=2, ballast=0, omega3=200, epaDha=0, omega6=500),
    "MANUELL_QUARK40": dict(kcal=160, eiweiss=11, fett=11, kh=3, zucker=3, ballast=0, omega3=100, epaDha=0, omega6=250),
    "MANUELL_AYRAN": dict(kcal=35, eiweiss=1.7, fett=1.8, kh=2.5, zucker=2.5, ballast=0, omega3=20, epaDha=0, omega6=50),
    "MANUELL_SMOOTHIE": dict(kcal=55, eiweiss=0.6, fett=0.2, kh=12, zucker=11, ballast=1, omega3=20, epaDha=0, omega6=30),
    "MANUELL_DOENER": dict(kcal=215, eiweiss=11, fett=10, kh=20, zucker=2, ballast=2, omega3=150, epaDha=0, omega6=1500),
    "MANUELL_SUSHI": dict(kcal=150, eiweiss=6, fett=3, kh=25, zucker=4, ballast=0.5, omega3=300, epaDha=250, omega6=400),
    "MANUELL_ENTENFETT": dict(kcal=882, eiweiss=0, fett=99.8, kh=0, zucker=0, ballast=0, omega3=1000, epaDha=0, omega6=12900),
    "MANUELL_PSYLLIUM": dict(kcal=200, eiweiss=1.5, fett=0.6, kh=4, zucker=0, ballast=80, omega3=0, epaDha=0, omega6=0),
}
QUELLE_MANUELL = "Herstellerangaben/Fachliteratur (Richtwert)"

zeilen = [z.split("|") for z in KARTE.strip().splitlines()]
zeilen += [z.split("|") for z in open("neu.txt", encoding="utf-8").read().strip().splitlines()]
aufgeloest = []
for name, syn, desc, por in zeilen:
    if desc.startswith("MANUELL"):
        aufgeloest.append((name, syn, desc, por, None, None)); continue
    if desc.startswith("^"):
        treffer = [(d, i, b) for d, i, b in foods if re.search(desc, d)]
        if not treffer: raise SystemExit(f"kein Treffer: {name} {desc}")
        d, i, b = treffer[0]
    else:
        d = desc; i, b = exakt[desc]
    aufgeloest.append((name, syn, d, por, i, b))

IDS = {1008, 1003, 1004, 1005, 2000, 1079, 1269, 1270, 1271, 1272, 1278, 1280, 1404, 1316, 1406, 2047, 2048}
brauche = defaultdict(set)
for *_, i, b in aufgeloest:
    if i: brauche[b].add(i)
n = defaultdict(dict)
for b, ids in brauche.items():
    # FNDDS führt in food_nutrient.nutrient_id die alte Nährstoff-NUMMER
    # (z. B. 203 = Eiweiß) statt der ID (1003) → über nutrient.csv umsetzen.
    nbr = {}
    for r in csv.DictReader(open(b + "nutrient.csv", encoding="utf-8")):
        z = r.get("nutrient_nbr") or ""
        if z and float(z) == int(float(z)):
            nbr.setdefault(str(int(float(z))), int(r["id"]))
    for r in csv.DictReader(open(b + "food_nutrient.csv", encoding="utf-8")):
        if r["fdc_id"] not in ids: continue
        nid = int(r["nutrient_id"])
        if b == FN: nid = nbr.get(str(nid), -1)
        if nid in IDS:
            n[r["fdc_id"]][nid] = float(r["amount"] or 0)

out = []
for name, syn, desc, por, i, b in aufgeloest:
    if i is None:
        w = dict(MANUELL[desc]); quelle = QUELLE_MANUELL
    else:
        v = n[i]
        kcal = v.get(1008) or v.get(2047) or v.get(2048) or 0
        ala = v.get(1404, v.get(1270, 0)); epa = v.get(1278, 0); dha = v.get(1272, 0); dpa = v.get(1280, 0)
        la = v.get(1316, v.get(1269, 0)); aa = v.get(1406, v.get(1271, 0))
        ballast = v.get(1079, 0)
        w = dict(kcal=round(kcal), eiweiss=round(v.get(1003, 0), 1), fett=round(v.get(1004, 0), 1), kh=round(max(0, v.get(1005, 0) - ballast), 1),
                 zucker=round(v.get(2000, 0), 1), ballast=round(ballast, 1),
                 omega3=round((ala + epa + dha + dpa) * 1000), epaDha=round((epa + dha + dpa) * 1000), omega6=round((la + aa) * 1000))
        quelle = ("USDA SR Legacy " if b == SR else "USDA FNDDS ") + i
    portionen = {}
    for p in por.split(";"):
        if p: k, g = p.split("="); portionen[k] = float(g)
    eintrag = dict(name=name, synonyme=[x.strip() for x in syn.split(";") if x.strip()], portionen=portionen, **w, quelle=quelle)
    # Liegt in der Quelle schon "in Öl" vor → Rechner rechnet Einlagen um.
    if name in ("Sardinen", "Sardellen", "Getrocknete Tomaten"): eintrag["standardEinlage"] = "öl"
    out.append(eintrag)

namen = [o["name"] for o in out]
assert len(namen) == len(set(namen)), [x for x in namen if namen.count(x) > 1]
js = ("// Nährwerte je 100 g (25.09.) — automatisch erzeugt aus USDA FoodData Central\n"
      "// (SR Legacy 2018 + FNDDS 2024, gemeinfrei), deutsche Namen/Portionen von Hand,\n"
      "// einige Trend-Lebensmittel als Richtwerte aus Herstellerangaben. Kohlenhydrate\n"
      "// wie auf deutschen Etiketten ohne Ballaststoffe. omega3/epaDha/omega6 in mg;\n"
      "// omega3 = ALA + EPA + DHA + DPA. Erzeugt mit scripts/lebensmittel/gen.py.\n"
      "export const LEBENSMITTEL = " + json.dumps(out, ensure_ascii=False, indent=0).replace("\n", "") + ";\n")
open("lebensmittel.js", "w", encoding="utf-8").write(js)
print(len(out))
for o in out:
    if o["fett"] > 2 and o["omega3"] == 0 and o["omega6"] == 0: print("keine Fettsäuren:", o["name"], o["quelle"])
    if o["kcal"] == 0 and o["name"] not in ("Kaffee", "Tee ungesüßt"): print("0 kcal:", o["name"], o["quelle"])
