# Erzeugt src/data/lebensmittel.js aus USDA FoodData Central, SR Legacy (gemeinfrei).
# Vorher laden und entpacken: https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_csv_2018-04.zip
# Deutsche Namen, Synonyme und Portionsgrößen stehen in karte.py. Aufruf im Ordner mit den CSVs: python3 gen.py
import csv,json
from collections import defaultdict
exec(open("karte.py",encoding="utf-8").read())
B="FoodData_Central_sr_legacy_food_csv_2018-04/"
fdc={r["description"]:r["fdc_id"] for r in csv.DictReader(open(B+"food.csv",encoding="utf-8"))}
brauche=set()
zeilen=[]
for z in KARTE.strip().splitlines():
    name,syn,desc,por=z.split("|")
    zeilen.append((name,syn,desc,por))
    if not desc.startswith("MANUELL"): brauche.add(fdc[desc])
IDS={1008,1003,1004,1005,2000,1079,1269,1270,1271,1272,1278,1280,1404,1316,1406}
n=defaultdict(dict)
for r in csv.DictReader(open(B+"food_nutrient.csv",encoding="utf-8")):
    if r["fdc_id"] in brauche and int(r["nutrient_id"]) in IDS:
        n[r["fdc_id"]][int(r["nutrient_id"])]=float(r["amount"] or 0)
out=[]
for name,syn,desc,por in zeilen:
    if desc=="MANUELL_NUTELLA":
        w=dict(kcal=539,eiweiss=6.3,fett=30.9,kh=57.5,zucker=56.3,ballast=3.4,omega3=100,epaDha=0,omega6=2900); quelle="Herstellerangaben (Fettsäuren geschätzt)"
    elif desc=="MANUELL":
        w=dict(kcal=46,eiweiss=1.0,fett=1.5,kh=6.7,zucker=4.0,ballast=0.8,omega3=110,epaDha=0,omega6=280); quelle="Herstellerangaben (Richtwert)"
    else:
        v=n[fdc[desc]]
        ala=v.get(1404, v.get(1270,0))
        epa=v.get(1278,0); dha=v.get(1272,0); dpa=v.get(1280,0)
        la=v.get(1316, v.get(1269,0)); aa=v.get(1406, v.get(1271,0))
        w=dict(kcal=round(v.get(1008,0)),eiweiss=round(v.get(1003,0),1),fett=round(v.get(1004,0),1),kh=round(v.get(1005,0),1),zucker=round(v.get(2000,0),1),ballast=round(v.get(1079,0),1),
               omega3=round((ala+epa+dha+dpa)*1000),epaDha=round((epa+dha+dpa)*1000),omega6=round((la+aa)*1000))
        quelle=f"USDA SR Legacy {fdc[desc]}"
    portionen={}
    for p in por.split(";"):
        if p: k,g=p.split("="); portionen[k]=float(g)
    out.append(dict(name=name,synonyme=[x.strip() for x in syn.split(";") if x.strip()],portionen=portionen,**w,quelle=quelle))
js="// Nährwerte je 100 g (25.09.) — automatisch erzeugt aus USDA FoodData Central,\n// SR Legacy (April 2018, gemeinfrei), deutsche Namen/Portionen von Hand.\n// omega3/epaDha/omega6 in mg; omega3 = ALA + EPA + DHA + DPA. Richtwerte,\n// echte Lebensmittel schwanken. Erzeugt mit scripts/lebensmittel/gen.py.\nexport const LEBENSMITTEL = "+json.dumps(out,ensure_ascii=False,indent=0).replace("\n","")+";\n"
open("lebensmittel.js","w",encoding="utf-8").write(js)
for o in out[:3]+[x for x in out if x["name"] in("Lachs","Leinöl","Walnüsse","Sonnenblumenöl")]: print(o)
print(len(out))
