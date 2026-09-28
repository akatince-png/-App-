import json, os
exec(open("gen.py").read().split("ITEMS = [")[0])  # FONTS, ic, ICON
G = json.load(open("gehirn.json"))
WR = [G["WINDUNGEN"][i] for i in (0,1,4,5,6,7,12,14,16)]
PUNKT = dict(fokus=(88,96,"🎯","#FF7A59",0.9), bewegung=(156,62,"💪","#FFA24D",0.3), energie=(212,78,"⚡","#F5C542",0.7), rhythmus=(260,128,"☀️","#FFD166",0.5), ruhe=(150,154,"🌬️","#4FD1C5",0.8), erholung=(242,178,"🌙","#9B8CFF",0.2))

def gehirn(dunkel):
    grund = "rgba(255,255,255,0.06)" if dunkel else "#EDF2FB"
    v1, v2 = ("#5CE0C6","#6C8CFF") if dunkel else ("#2FB39A","#3E63D6")
    blobs = "".join(f'<circle cx="{x}" cy="{y}" r="{26+22*a}" fill="{c}" fill-opacity="{0.25+0.6*a}"/>' for x,y,e,c,a in PUNKT.values())
    badges = "".join(f'<g><circle cx="{x}" cy="{y}" r="12" fill="{c if a>0.4 else ("#20264a" if dunkel else "#fff")}" fill-opacity="{1 if a>0.4 else 0.9}" stroke="{"rgba(255,255,255,.7)" if dunkel else "#fff"}" stroke-width="1.5"/><text x="{x}" y="{y+4}" text-anchor="middle" font-size="12">{e}</text></g>' for x,y,e,c,a in PUNKT.values())
    return f'''<svg viewBox="40 24 250 200" style="width:100%;display:block"><defs>
<clipPath id="cg"><path d="{G['GROSSHIRN']}"/><path d="{G['KLEINHIRN']}"/></clipPath>
<linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{v1}"/><stop offset="1" stop-color="{v2}"/></linearGradient>
<filter id="bl"><feGaussianBlur stdDeviation="10"/></filter><filter id="gl"><feGaussianBlur stdDeviation="{2.2 if dunkel else 0.8}" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
<path d="{G['HIRNSTAMM']}" fill="{grund}"/><path d="{G['KLEINHIRN']}" fill="{grund}"/><path d="{G['GROSSHIRN']}" fill="{grund}"/>
<g clip-path="url(#cg)"><g filter="url(#bl)">{blobs}</g></g>
<g fill="none" stroke="url(#lg)" stroke-linecap="round" stroke-linejoin="round"><g filter="url(#gl)"><path d="{G['HIRNSTAMM']}" stroke-width="3"/><path d="{G['KLEINHIRN']}" stroke-width="3"/><path d="{G['GROSSHIRN']}" stroke-width="3.4"/></g>
<path d="{G['SEITENFURCHE']}" stroke-width="2.6"/><path d="{G['ZENTRALFURCHE']}" stroke-width="2.2" opacity=".8"/><g stroke-width="1.9" opacity=".55">{"".join(f'<path d="{d}"/>' for d in WR)}</g></g>{badges}</svg>'''

def koerper(dunkel):
    grund = "rgba(255,255,255,0.12)" if dunkel else "#E6ECF6"
    Z = dict(kopf=("#A393FF",0.8), brust=("#4FD1C5",0.9), bauch=("#5AAEFF",0.6), bew=("#FFA24D",0.35))
    def g(d,w,a): return f'<path d="{d}" stroke="{grund}" stroke-width="{w}" stroke-linecap="round" fill="none"/><path d="{d}" stroke="{Z["bew"][0]}" stroke-opacity="{0.16+a*0.8}" stroke-width="{w-2}" stroke-linecap="round" fill="none"/>'
    R="M40 52 C40 45 46 41 53 41 L67 41 C74 41 80 45 80 52 L79 104 C79 112 73 117 65 117 L55 117 C47 117 41 112 41 104 Z"
    a=Z["bew"][1]
    return f'''<svg viewBox="0 0 120 200" style="width:100%;max-width:120px;display:block;margin:0 auto"><defs><clipPath id="kb"><rect width="120" height="80"/></clipPath><clipPath id="kc"><rect y="80" width="120" height="60"/></clipPath>
<radialGradient id="kl" cx="50%" cy="42%" r="58%"><stop offset="0" stop-color="#FFD166" stop-opacity=".45"/><stop offset="1" stop-color="#FFD166" stop-opacity="0"/></radialGradient></defs>
<ellipse cx="60" cy="96" rx="58" ry="100" fill="url(#kl)"/>
{g("M52 114 C51 138 50 158 49 182",15,a)}{g("M68 114 C69 138 70 158 71 182",15,a)}{g("M42 50 C34 60 29 74 26 92",12,a)}{g("M78 50 C86 60 91 74 94 92",12,a)}
<path d="{R}" fill="{grund}"/><path d="{R}" clip-path="url(#kb)" fill="{Z['brust'][0]}" fill-opacity="{0.16+Z['brust'][1]*0.75}"/><path d="{R}" clip-path="url(#kc)" fill="{Z['bauch'][0]}" fill-opacity="{0.16+Z['bauch'][1]*0.75}"/>
<rect x="55" y="34" width="10" height="9" rx="4" fill="{grund}"/><circle cx="60" cy="22" r="14" fill="{Z['kopf'][0]}" fill-opacity="{0.16+Z['kopf'][1]*0.75}"/></svg>'''

PH = dict(
 tag=dict(dunkel=False, font="'Jakarta',sans-serif", bg="#F3F6FB", tint="linear-gradient(180deg,#DCE8FB 0%,#F3F6FB 300px)", text="#101828", muted="#667085", acc="#2F5FD0", soft="#E6EEFC", karte="#fff", rand="1px solid rgba(16,24,40,.05)", schatten="0 1px 2px rgba(16,24,40,.05),0 8px 24px rgba(16,24,40,.06)", gruss="Guten Tag", jetzt=("🧺","Wäsche machen","Haushalt · 30 Min · 19:00"), hinweis="Tagsüber: hell und klar"),
 morgen=dict(dunkel=False, font="'Jakarta',sans-serif", bg="#FBF6F0", tint="linear-gradient(180deg,#FFE3C8 0%,#FBF6F0 300px)", text="#1D1410", muted="#7A6A60", acc="#E0701B", soft="#FFEEDD", karte="#fff", rand="1px solid rgba(60,30,10,.05)", schatten="0 1px 2px rgba(60,30,10,.05),0 8px 24px rgba(60,30,10,.06)", gruss="Guten Morgen", jetzt=("🌅","Morgenroutine","5 Schritte · 15 Min · bis 07:45"), hinweis=""),
 abend=dict(dunkel=True, font="'Outfit',sans-serif", bg="#0D1022", tint="radial-gradient(420px 320px at 90% -5%,#5B4BFF55,transparent 70%),radial-gradient(360px 300px at -10% 30%,#2AC3C933,transparent 70%),#0D1022", text="#F2F3FF", muted="#9AA0C8", acc="#8C7CFF", soft="rgba(140,124,255,.16)", karte="rgba(255,255,255,.06)", rand="1px solid rgba(255,255,255,.1)", schatten="none", gruss="Guten Abend", jetzt=("🌙","Abendroutine","4 Schritte · 20 Min · ab 21:30"), hinweis=""),
)

def seite(ph, leiste):
    P = PH[ph]; d=P["dunkel"]
    btn_grad = "linear-gradient(135deg,#5B4BFF,#2AC3C9)" if d else P["acc"]
    quests = [("👆","Der erste Haken",1,1,"#6C8CFF"),("🌓","Halbzeit",2,3,"#8C7CFF"),("🧩","Tagesrätsel",3,5,"#FF8A5B")]
    qhtml = "".join(f'<div class="q"><div class="qe">{e}</div><div style="flex:1"><div class="qt">{t}</div><div class="bar"><i style="width:{int(a/b*100)}%;background:{c}"></i></div></div><div class="qz">{a}/{b}</div></div>' for e,t,a,b,c in quests)
    kacheln = [("Gewohnheiten","0/3","#2FB39A"),("Morgenroutine","✓","#E0701B"),("Abendroutine","offen","#6C5CE7"),("Medikamente","1/1","#9B6BE3"),("Supplemente","0/1","#C98A1B"),("Wasser","1,2 l","#3E8BFF")]
    khtml = "".join(f'<div class="k"><div class="kr" style="border-color:{c}"></div><div class="kt">{t}</div><div class="kv">{v}</div></div>' for t,v,c in kacheln)
    bar = ""
    if leiste:
        items=[("home","Heute",True),("plan","Plan",False),("chat","Aka",False),("chart","Fortschritt",False),("more","Mehr",False)]
        bar='<div class="nav">'+"".join(f'<div class="navmitte">{ic("chat",24,2.2)}</div>' if n=="chat" else f'<div class="navi {"an" if a else ""}">{ic(n,22,2)}<span>{l}</span></div>' for n,l,a in items)+'</div>'
    unten = "" if leiste else f'''<div class="sek"><h2>Deine Bereiche</h2><span class="muted small">alle ›</span></div><div class="kg">{khtml}</div>
<div class="sek"><h2>Mehr</h2></div><div class="kg2"><div class="k2">📅 Kalender</div><div class="k2">🏆 Erfolge</div><div class="k2">📓 Tagebuch</div><div class="k2">⚙️ Einstellungen</div></div>'''
    kopf = f'<div class="topr"><div class="ico">{ic("chat",20,2)}</div><div class="ava">A</div></div>' if not leiste else '<div class="ava">A</div>'
    return f'''<!doctype html><html><head><meta charset="utf-8"><style>{FONTS}
*{{box-sizing:border-box;margin:0;padding:0}} body{{width:390px;font-family:{P['font']};color:{P['text']};background:{P['tint']};-webkit-font-smoothing:antialiased;position:relative;padding-bottom:{110 if leiste else 40}px}}
.wrap{{padding:54px 18px 0}} .muted{{color:{P['muted']}}} .small{{font-size:13px}}
.top{{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}} .datum{{font-size:13.5px;color:{P['muted']};font-weight:500}} h1{{font-size:28px;font-weight:{600 if d else 800};letter-spacing:-.5px;margin-top:2px}}
.topr{{display:flex;gap:8px}} .ico{{width:42px;height:42px;border-radius:50%;background:{P['karte']};border:{P['rand']};display:grid;place-items:center;color:{P['acc']}}}
.ava{{width:42px;height:42px;border-radius:50%;background:{btn_grad};color:#fff;display:grid;place-items:center;font-weight:700}}
.karte{{background:{P['karte']};border:{P['rand']};box-shadow:{P['schatten']};border-radius:24px;{'backdrop-filter:blur(18px);' if d else ''}}}
.gk{{padding:16px}} .gkt{{display:flex;justify-content:space-between;align-items:center}} .gkt b{{font-size:16px;font-weight:{600 if d else 800}}}
.seg{{display:flex;background:{'rgba(255,255,255,.08)' if d else '#EEF1F6'};border-radius:99px;padding:3px;font-size:12px;font-weight:600}} .seg span{{padding:5px 10px;border-radius:99px;color:{P['muted']}}} .seg .an{{background:{'rgba(255,255,255,.16)' if d else '#fff'};color:{P['text']};{'box-shadow:0 1px 3px rgba(16,24,40,.1)' if not d else ''}}}
.gb{{display:grid;grid-template-columns:1.8fr 1fr;align-items:center;gap:4px;margin-top:6px}}
.lad{{font-size:13px;color:{P['muted']};margin-top:6px}} .bar{{height:6px;background:{'rgba(255,255,255,.1)' if d else '#EAECF0'};border-radius:9px;overflow:hidden;margin-top:6px}} .bar i{{display:block;height:100%;border-radius:9px}}
.chips{{display:flex;flex-wrap:wrap;gap:5px;justify-content:center;margin-top:8px}} .chips span{{font-size:11px;font-weight:600;padding:3px 8px;border-radius:99px;background:{'rgba(255,255,255,.08)' if d else '#F1F4F9'};border:{P['rand']}}}
.stats{{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:12px 0}} .st{{padding:11px 12px;border-radius:18px}} .sv{{font-size:18px;font-weight:{600 if d else 800}}} .sl{{font-size:11.5px;color:{P['muted']}}}
.jetzt{{padding:16px;display:flex;align-items:center;gap:12px}} .je{{width:52px;height:52px;border-radius:16px;background:{P['soft']};display:grid;place-items:center;font-size:26px}} .jk{{font-size:11px;letter-spacing:1px;color:{P['acc']};font-weight:700}} .jt{{font-size:18px;font-weight:{600 if d else 800}}} .js{{font-size:12.5px;color:{P['muted']}}}
.go{{margin-left:auto;width:48px;height:48px;border-radius:50%;background:{btn_grad};color:#fff;display:grid;place-items:center;box-shadow:{'0 8px 20px #5B4BFF55' if d else '0 6px 14px rgba(47,95,208,.25)'}}}
.sek{{display:flex;justify-content:space-between;align-items:baseline;margin:18px 2px 10px}} h2{{font-size:18px;font-weight:{600 if d else 800};letter-spacing:-.3px}}
.qs{{padding:6px 14px}} .q{{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid {'rgba(255,255,255,.07)' if d else '#EEF1F6'}}} .q:last-child{{border:none}} .qe{{width:34px;height:34px;border-radius:12px;background:{P['soft']};display:grid;place-items:center}} .qt{{font-size:14.5px;font-weight:600}} .qz{{font-size:13px;font-weight:700;color:{P['muted']}}}
.kg{{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}} .k{{background:{P['karte']};border:{P['rand']};box-shadow:{P['schatten']};border-radius:18px;padding:12px 10px;text-align:center}} .kr{{width:36px;height:36px;border-radius:50%;border:4px solid;margin:0 auto 6px;opacity:.9}} .kt{{font-size:12px;font-weight:700}} .kv{{font-size:11.5px;color:{P['muted']}}}
.kg2{{display:grid;grid-template-columns:1fr 1fr;gap:8px}} .k2{{background:{P['karte']};border:{P['rand']};box-shadow:{P['schatten']};border-radius:16px;padding:14px;font-weight:600;font-size:14px}}
.nav{{position:fixed;left:14px;right:14px;bottom:16px;height:66px;border-radius:24px;background:{'rgba(30,33,60,.9)' if d else 'rgba(255,255,255,.95)'};border:{P['rand']};box-shadow:{'none' if d else '0 10px 30px rgba(16,24,40,.12)'};display:flex;align-items:center;justify-content:space-around;backdrop-filter:blur(16px)}}
.navi{{display:flex;flex-direction:column;align-items:center;gap:2px;color:{'#6F75A3' if d else '#98A2B3'};font-size:11px;font-weight:600}} .navi.an{{color:{'#fff' if d else P['acc']}}}
.navmitte{{width:52px;height:52px;border-radius:50%;background:{btn_grad};color:#fff;display:grid;place-items:center;margin-top:-18px;box-shadow:0 8px 20px {'#5B4BFF66' if d else 'rgba(47,95,208,.3)'}}}
</style></head><body><div class="wrap">
<div class="top"><div><div class="datum">Montag, 28. September</div><h1>{P['gruss']}, Aka</h1></div>{kopf}</div>
<div class="karte gk"><div class="gkt"><b>🧠 Dein Gehirn</b><div class="seg"><span class="an">Tag</span><span>Woche</span><span>Monat</span></div></div>
<div class="gb"><div>{gehirn(d)}</div><div>{koerper(d)}</div></div>
<div class="lad">Heute zu 62 % aufgeladen</div><div class="bar"><i style="width:62%;background:linear-gradient(90deg,#2FB39A,#3E63D6)"></i></div>
<div class="chips"><span>😴 7,5 h</span><span>💧 1,2/2 l</span><span>☀️ 20/30 min</span><span>🏋️ offen</span></div></div>
<div class="stats"><div class="karte st"><div class="sv">5 / 8</div><div class="sl">heute erledigt</div></div><div class="karte st"><div class="sv">🔥 5</div><div class="sl">Tage in Folge</div></div><div class="karte st"><div class="sv">Level 3</div><div class="sl">120 Punkte</div></div></div>
<div class="karte jetzt"><div class="je">{P['jetzt'][0]}</div><div><div class="jk">JETZT DRAN</div><div class="jt">{P['jetzt'][1]}</div><div class="js">{P['jetzt'][2]}</div></div><div class="go">{ic("play",20,2,"currentColor")}</div></div>
<div class="sek"><h2>Tages-Quests</h2><span class="muted small">1 von 3</span></div><div class="karte qs">{qhtml}</div>
{unten}
</div>{bar}</body></html>'''

for ph in ("tag","morgen","abend"):
    for l in (True, False):
        open(f"M-{ph}-{'leiste' if l else 'ohne'}.html","w").write(seite(ph,l))
print("ok")
