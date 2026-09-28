import os
F = "file://" + os.path.abspath("node_modules/@fontsource")
def ff(fam, pkg, ws):
    return "".join(f"@font-face{{font-family:'{fam}';font-weight:{w};src:url('{F}/{pkg}/files/{pkg}-latin-{w}-normal.woff2') format('woff2');}}" for w in ws)
FONTS = ff("Nunito","nunito",[400,600,700,800,900]) + ff("Jakarta","plus-jakarta-sans",[400,600,700,800]) + ff("Outfit","outfit",[300,400,500,600,700])

ICON = {
 "home": '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20h5v-6h4v6h5V9.5"/>',
 "plan": '<rect x="3" y="4" width="18" height="17" rx="3"/><path d="M8 2v4M16 2v4M3 10h18"/>',
 "chart": '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
 "more": '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
 "drop": '<path d="M12 3s7 7.5 7 12a7 7 0 0 1-14 0c0-4.5 7-12 7-12z"/>',
 "spark": '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
 "chat": '<path d="M4 5h16v11H9l-5 4z"/>',
 "check": '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
 "play": '<path d="M8 5v14l11-7z"/>',
 "flame": '<path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2.5 1.5-4 2.5-5 .3 2 1.5 3 2.5 3 0-3-1-5.5 0-8z"/>',
}
def ic(n, s=22, w=2, fill="none"):
    return f'<svg width="{s}" height="{s}" viewBox="0 0 24 24" fill="{fill}" stroke="currentColor" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round">{ICON[n]}</svg>'

ITEMS = [  # (zeit, titel, sub, farbe-key, erledigt, emoji)
 ("08:00","Elvanse","30 mg","med",True,"💊"),
 ("12:30","10 Minuten Spaziergang","Tageslicht","licht",True,"☀️"),
 ("19:00","Wäsche machen","Haushalt · 30 Min","haus",False,"🧺"),
 ("21:30","Abendroutine","4 Schritte · 20 Min","routine",False,"🌙"),
 ("22:00","Magnesium","Supplement","supp",False,"✨"),
]

def page(theme, phase="abend"):
    t = THEMES[theme]
    P = t["phase"][phase]
    gruss = {"morgen":"Guten Morgen","abend":"Guten Abend"}[phase]
    jetzt = {"morgen":("Morgenroutine","5 Schritte · 15 Min · bis 07:45","🌅"),"abend":("Abendroutine","4 Schritte · 20 Min · ab 21:30","🌙")}[phase]
    rows = ""
    for z,titel,sub,k,done,emo in ITEMS:
        rows += t["row"](z,titel,sub,t["col"][k],done,emo,P)
    html = f"""<!doctype html><html><head><meta charset="utf-8"><style>{FONTS}
*{{box-sizing:border-box;margin:0;padding:0}} body{{width:390px;height:844px;overflow:hidden;font-family:{t['font']};color:{t['text']};background:{P['bg']};-webkit-font-smoothing:antialiased;position:relative}}
.wrap{{padding:54px 20px 0}} .muted{{color:{t['muted']}}}
{t['css'](P)}
</style></head><body>{t['deko'](P)}<div class="wrap">
<div class="top"><div><div class="datum">Montag, 28. September</div><h1>{gruss}, Aka</h1></div><div class="ava">A</div></div>
{t['hero'](jetzt,P)}
{t['stats'](P)}
<div class="sek"><h2>Heute</h2><span class="muted small">2 von 5 erledigt</span></div>
<div class="liste">{rows}</div>
</div>
{t['nav'](P)}
</body></html>"""
    return html

def nav_std(P, cls="nav"):
    items=[("home","Heute",True),("plan","Plan",False),("chat","Aka",False),("chart","Fortschritt",False),("more","Mehr",False)]
    s=f'<div class="{cls}">'
    for n,l,a in items:
        if n=="chat":
            s+=f'<div class="navmitte">{ic("chat",24,2.2)}</div>'
        else:
            s+=f'<div class="navi {"an" if a else ""}">{ic(n,22,2)}<span>{l}</span></div>'
    return s+'</div>'

# ---------- A: Sanft & Warm ----------
def A_row(z,titel,sub,c,done,emo,P):
    return f'''<div class="row" style="background:{c[0]}"><div class="em">{emo}</div><div class="rt"><div class="rz">{z}</div><div class="rtt" style="{'text-decoration:line-through;opacity:.55' if done else ''}">{titel}</div><div class="rs">{sub}</div></div><div class="chk {'ok' if done else ''}" style="border-color:{c[1]};{('background:'+c[1]) if done else ''}">{ic('check',16,3) if done else ''}</div></div>'''
A = dict(font="'Nunito',sans-serif", text="#2B2440", muted="#8A8199",
 col=dict(med=("#F3E8FF","#9B6BE3"),licht=("#FFF3C9","#E3A81B"),haus=("#FFE7DA","#E77B4B"),routine=("#E4E6FF","#5B5FD6"),supp=("#DDF5EC","#2FA37A")),
 phase=dict(abend=dict(bg="#FBF6F1",hero="linear-gradient(135deg,#6E6BDB,#9C7BE8)",acc="#5B5FD6"),
            morgen=dict(bg="#FFF7EC",hero="linear-gradient(135deg,#FF9E57,#FFC66B)",acc="#E97A2E")),
 css=lambda P: f""".top{{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px}} .datum{{font-size:14px;font-weight:700;color:#8A8199}} h1{{font-size:28px;font-weight:900;letter-spacing:-.3px;margin-top:2px}}
.ava{{width:44px;height:44px;border-radius:50%;background:#fff;display:grid;place-items:center;font-weight:900;color:{P['acc']};box-shadow:0 4px 14px rgba(80,60,120,.12)}}
.hero{{background:{P['hero']};border-radius:30px;padding:20px;color:#fff;display:flex;gap:14px;align-items:center;box-shadow:0 14px 30px rgba(90,80,200,.25)}}
.hero .big{{font-size:38px;width:62px;height:62px;border-radius:22px;background:rgba(255,255,255,.25);display:grid;place-items:center}}
.hk{{font-size:12px;font-weight:800;letter-spacing:.8px;opacity:.85}} .ht{{font-size:22px;font-weight:900}} .hs{{font-size:13px;opacity:.9;font-weight:600}}
.go{{margin-left:auto;width:52px;height:52px;border-radius:50%;background:#fff;color:{P['acc']};display:grid;place-items:center}}
.stats{{display:flex;gap:10px;margin:14px 0 6px}} .st{{flex:1;background:#fff;border-radius:22px;padding:12px 14px;box-shadow:0 4px 16px rgba(80,60,120,.07)}} .sv{{font-size:20px;font-weight:900}} .sl{{font-size:12px;font-weight:700;color:#8A8199}}
.sek{{display:flex;justify-content:space-between;align-items:baseline;margin:14px 2px 10px}} h2{{font-size:20px;font-weight:900}} .small{{font-size:13px;font-weight:700}}
.liste{{display:flex;flex-direction:column;gap:10px}} .row{{display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:24px}}
.em{{font-size:24px;width:46px;height:46px;border-radius:16px;background:rgba(255,255,255,.75);display:grid;place-items:center}} .rt{{flex:1}} .rz{{font-size:12px;font-weight:800;color:#8A8199}} .rtt{{font-size:16px;font-weight:800}} .rs{{font-size:12.5px;color:#8A8199;font-weight:600}}
.chk{{width:32px;height:32px;border-radius:50%;border:2.5px solid;display:grid;place-items:center;color:#fff;background:rgba(255,255,255,.6)}}
.nav{{position:absolute;left:14px;right:14px;bottom:18px;height:70px;background:#fff;border-radius:28px;display:flex;align-items:center;justify-content:space-around;box-shadow:0 10px 30px rgba(80,60,120,.15)}}
.navi{{display:flex;flex-direction:column;align-items:center;gap:2px;color:#B3ABC2;font-size:11px;font-weight:800}} .navi.an{{color:{P['acc']}}}
.navmitte{{width:58px;height:58px;border-radius:50%;background:{P['hero']};color:#fff;display:grid;place-items:center;margin-top:-26px;box-shadow:0 8px 20px rgba(90,80,200,.35)}}""",
 deko=lambda P: "",
 hero=lambda j,P: f'<div class="hero"><div class="big">{j[2]}</div><div><div class="hk">JETZT DRAN</div><div class="ht">{j[0]}</div><div class="hs">{j[1]}</div></div><div class="go">{ic("play",22,2,"currentColor")}</div></div>',
 stats=lambda P: '<div class="stats"><div class="st"><div class="sv">🔥 5</div><div class="sl">Tage in Folge</div></div><div class="st"><div class="sv">💧 1,2 l</div><div class="sl">von 2 l</div></div><div class="st"><div class="sv">⭐ 120</div><div class="sl">Punkte</div></div></div>',
 row=A_row, nav=lambda P: nav_std(P))

# ---------- B: Klar & Ruhig ----------
def B_row(z,titel,sub,c,done,emo,P):
    return f'''<div class="row"><div class="rz">{z}</div><div class="dot" style="background:{c[1] if done else '#fff'};border-color:{c[1]}">{ic('check',12,3.2) if done else ''}</div><div class="card {'done' if done else ''}" style="border-left-color:{c[1]}"><div class="rtt">{titel}</div><div class="rs">{sub}</div></div></div>'''
B = dict(font="'Jakarta',sans-serif", text="#101828", muted="#667085",
 col=dict(med=("#F4EBFF","#8B5CF6"),licht=("#FEF7C3","#EAAA08"),haus=("#FFEAD5","#F79009"),routine=("#E0EAFF","#444CE7"),supp=("#D1FADF","#12B76A")),
 phase=dict(abend=dict(bg="#F4F5F8",acc="#444CE7",soft="#EEF0FF",tint="linear-gradient(180deg,#E6E8FF 0%,#F4F5F8 260px)"),
            morgen=dict(bg="#F7F5F2",acc="#E0701B",soft="#FFF1E4",tint="linear-gradient(180deg,#FFE9D4 0%,#F7F5F2 260px)")),
 css=lambda P: f"""body{{background:{P['tint']}}} .top{{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px}} .datum{{font-size:13px;font-weight:600;color:#667085}} h1{{font-size:27px;font-weight:800;letter-spacing:-.6px;margin-top:2px}}
.ava{{width:42px;height:42px;border-radius:50%;background:{P['acc']};color:#fff;display:grid;place-items:center;font-weight:800}}
.hero{{background:#fff;border-radius:22px;padding:18px;box-shadow:0 1px 2px rgba(16,24,40,.05),0 8px 24px rgba(16,24,40,.06)}}
.hk{{font-size:11.5px;font-weight:700;letter-spacing:.6px;color:{P['acc']}}} .ht{{font-size:21px;font-weight:800;letter-spacing:-.3px;margin-top:3px}} .hs{{font-size:13.5px;color:#667085;margin-top:2px}}
.hb{{display:flex;gap:8px;margin-top:14px}} .btn{{flex:1;height:46px;border-radius:14px;display:flex;align-items:center;justify-content:center;gap:6px;font-weight:700;font-size:14.5px}} .p{{background:{P['acc']};color:#fff}} .s{{background:{P['soft']};color:{P['acc']}}}
.stats{{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:12px 0 4px}} .st{{background:#fff;border-radius:16px;padding:11px 12px;box-shadow:0 1px 2px rgba(16,24,40,.05)}} .sv{{font-size:18px;font-weight:800;letter-spacing:-.3px}} .sl{{font-size:11.5px;color:#667085;font-weight:600}}
.bar{{height:6px;background:#EAECF0;border-radius:9px;margin-top:6px;overflow:hidden}} .bar i{{display:block;height:100%;background:{P['acc']};border-radius:9px}}
.sek{{display:flex;justify-content:space-between;align-items:baseline;margin:16px 2px 8px}} h2{{font-size:18px;font-weight:800;letter-spacing:-.3px}} .small{{font-size:13px;font-weight:600}}
.liste{{position:relative}} .liste:before{{content:"";position:absolute;left:62px;top:10px;bottom:10px;width:2px;background:#E4E7EC}}
.row{{display:flex;align-items:center;gap:10px;margin-bottom:8px;position:relative}} .rz{{width:44px;font-size:12.5px;font-weight:700;color:#667085;text-align:right}}
.dot{{width:18px;height:18px;border-radius:50%;border:2.5px solid;display:grid;place-items:center;color:#fff;z-index:1;flex-shrink:0}}
.card{{flex:1;background:#fff;border-radius:14px;padding:10px 12px;border-left:4px solid;box-shadow:0 1px 2px rgba(16,24,40,.05)}} .card.done{{opacity:.55}} .rtt{{font-size:15px;font-weight:700}} .rs{{font-size:12.5px;color:#667085}}
.nav{{position:absolute;left:0;right:0;bottom:0;height:84px;padding-bottom:14px;background:rgba(255,255,255,.92);border-top:1px solid #EAECF0;display:flex;align-items:center;justify-content:space-around}}
.navi{{display:flex;flex-direction:column;align-items:center;gap:3px;color:#98A2B3;font-size:11px;font-weight:600}} .navi.an{{color:{P['acc']}}}
.navmitte{{width:50px;height:50px;border-radius:16px;background:{P['acc']};color:#fff;display:grid;place-items:center}}""",
 deko=lambda P: "",
 hero=lambda j,P: f'<div class="hero"><div class="hk">JETZT DRAN</div><div class="ht">{j[2]} {j[0]}</div><div class="hs">{j[1]}</div><div class="hb"><div class="btn p">{ic("play",16,2,"currentColor")} Starten</div><div class="btn s">Später</div></div></div>',
 stats=lambda P: '<div class="stats"><div class="st"><div class="sv">5 Tage</div><div class="sl">Serie</div></div><div class="st"><div class="sv">1,2 l</div><div class="sl">Wasser</div><div class="bar"><i style="width:60%"></i></div></div><div class="st"><div class="sv">40 %</div><div class="sl">Tag geschafft</div><div class="bar"><i style="width:40%"></i></div></div></div>',
 row=B_row, nav=lambda P: nav_std(P))

# ---------- C: Nacht & Glow ----------
def C_row(z,titel,sub,c,done,emo,P):
    return f'''<div class="row {'done' if done else ''}"><div class="em" style="background:{c[1]}22;color:{c[1]}">{emo}</div><div class="rt"><div class="rtt">{titel}</div><div class="rs">{z} · {sub}</div></div><div class="chk" style="{('background:'+c[1]+';border-color:'+c[1]) if done else ''}">{ic('check',15,3) if done else ''}</div></div>'''
C = dict(font="'Outfit',sans-serif", text="#F2F3FF", muted="#9AA0C8",
 col=dict(med=("","#B794FF"),licht=("","#FFD166"),haus=("","#FF9F6E"),routine=("","#7C8CFF"),supp=("","#5EE3B5")),
 phase=dict(abend=dict(bg="#0D1022",g1="#5B4BFF",g2="#2AC3C9",acc="#8C7CFF"),
            morgen=dict(bg="#1A1210",g1="#FF8A3D",g2="#FFC857",acc="#FFA24D")),
 css=lambda P: f""".top{{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px}} .datum{{font-size:14px;color:#9AA0C8;font-weight:400}} h1{{font-size:30px;font-weight:600;letter-spacing:-.4px;margin-top:2px}}
.ava{{width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,{P['g1']},{P['g2']});display:grid;place-items:center;font-weight:700}}
.glass{{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);backdrop-filter:blur(20px);border-radius:26px}}
.hero{{padding:20px;position:relative;overflow:hidden}} .hero:after{{content:"";position:absolute;right:-40px;top:-40px;width:160px;height:160px;border-radius:50%;background:radial-gradient({P['g1']}88,transparent 70%)}}
.hk{{font-size:12px;letter-spacing:1.2px;color:{P['acc']};font-weight:500}} .ht{{font-size:25px;font-weight:600;margin-top:4px}} .hs{{font-size:14px;color:#9AA0C8;margin-top:2px}}
.hb{{margin-top:16px;height:50px;border-radius:16px;background:linear-gradient(135deg,{P['g1']},{P['g2']});display:flex;align-items:center;justify-content:center;gap:8px;font-weight:600;font-size:16px;box-shadow:0 10px 30px {P['g1']}55}}
.stats{{display:flex;gap:10px;margin:12px 0 4px}} .st{{flex:1;padding:12px 14px;display:flex;align-items:center;gap:10px}}
.ring{{width:40px;height:40px;border-radius:50%;background:conic-gradient({P['g2']} 0 40%,rgba(255,255,255,.12) 0);display:grid;place-items:center}} .ring i{{width:30px;height:30px;border-radius:50%;background:#171A33;display:block}}
.sv{{font-size:18px;font-weight:600}} .sl{{font-size:12px;color:#9AA0C8}}
.sek{{display:flex;justify-content:space-between;align-items:baseline;margin:16px 2px 10px}} h2{{font-size:19px;font-weight:600}} .small{{font-size:13px}}
.liste{{display:flex;flex-direction:column;gap:8px}} .row{{display:flex;align-items:center;gap:12px;padding:10px 12px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:20px}} .row.done{{opacity:.5}}
.em{{width:42px;height:42px;border-radius:14px;display:grid;place-items:center;font-size:20px}} .rt{{flex:1}} .rtt{{font-size:16px;font-weight:500}} .rs{{font-size:12.5px;color:#9AA0C8}}
.chk{{width:28px;height:28px;border-radius:50%;border:2px solid rgba(255,255,255,.25);display:grid;place-items:center;color:#0D1022}}
.nav{{position:absolute;left:16px;right:16px;bottom:18px;height:66px;border-radius:24px;background:rgba(30,33,60,.85);border:1px solid rgba(255,255,255,.1);display:flex;align-items:center;justify-content:space-around}}
.navi{{display:flex;flex-direction:column;align-items:center;gap:2px;color:#6F75A3;font-size:11px}} .navi.an{{color:#fff}}
.navmitte{{width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,{P['g1']},{P['g2']});display:grid;place-items:center;box-shadow:0 8px 24px {P['g1']}66}}""",
 deko=lambda P: f'<div style="position:absolute;inset:0;background:radial-gradient(420px 320px at 90% -5%,{P["g1"]}55,transparent 70%),radial-gradient(360px 300px at -10% 35%,{P["g2"]}33,transparent 70%)"></div>',
 hero=lambda j,P: f'<div class="glass hero"><div style="position:relative;z-index:1"><div class="hk">JETZT DRAN</div><div class="ht">{j[0]}</div><div class="hs">{j[1]}</div><div class="hb">{ic("play",18,2,"currentColor")} Los geht’s</div></div></div>',
 stats=lambda P: '<div class="stats"><div class="glass st"><div class="ring"><i></i></div><div><div class="sv">2 / 5</div><div class="sl">heute</div></div></div><div class="glass st"><div style="font-size:24px">🔥</div><div><div class="sv">5 Tage</div><div class="sl">Serie</div></div></div></div>',
 row=C_row, nav=lambda P: nav_std(P))
THEMES = dict(A=A,B=B,C=C)
for k in THEMES:
    for ph in ("abend","morgen"):
        open(f"{k}-{ph}.html","w").write(page(k,ph))
print("ok")
