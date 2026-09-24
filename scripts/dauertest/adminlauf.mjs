// Admin-Livetest (24.09., Nutzerinnen-Wunsch: "die essentiellste Position
// live testen"): meldet sich mit dem Admin-Testkonto claude.admintest@
// example.com an (Passwort wird je Lauf per SQL gesetzt, nie gespeichert),
// öffnet alle Admin- und normalen Ansichten, legt ein Probe-Team mit
// Gruppenprotokoll an, sieht den Stand an, beendet es, verwaltet Jonas
// (nur ansehen) und löscht das Probe-Team wieder.
//   AKA_TEST_PW=… node scripts/dauertest/adminlauf.mjs
import { chromium } from '@playwright/test';
import fs from 'fs'; import crypto from 'crypto';
const OUT = process.env.AKA_OUT || 'dauertest-out/admin-' + new Date().toISOString().slice(0,10); fs.mkdirSync(OUT,{recursive:true});
const URL=(process.env.AKA_URL||'https://akaapp.vercel.app').replace(/\/$/,'');
const bundle = process.env.AKA_CA_BUNDLE || '/root/.ccr/ca-bundle.crt';
const pems = fs.existsSync(bundle) ? fs.readFileSync(bundle,'utf8').match(/-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/g) || [] : [];
const pins = pems.map(p=>new crypto.X509Certificate(p)).filter(c=>/Proxy CA/i.test(c.subject)).map(c=>crypto.createHash('sha256').update(c.publicKey.export({type:'spki',format:'der'})).digest('base64'));
const b = await chromium.launch({ executablePath: process.env.AKA_CHROMIUM || '/opt/pw-browsers/chromium', args: pins.length ? [`--ignore-certificate-errors-spki-list=${pins.join(',')}`] : [] });
const ctx = await b.newContext({ viewport:{width:390,height:844}, deviceScaleFactor:2, isMobile:true, hasTouch:true, locale:'de-DE', timezoneId:'Europe/Berlin' });
const p = await ctx.newPage(); const log=[]; let aktuell='start';
const befund=(s)=>{log.push(`[${aktuell}] ${s}`); console.log('⚠',aktuell,s);};
p.on('pageerror', e=>befund('PAGE '+e.message.slice(0,200)));
p.on('console', m=>m.type()==='error'&&!/favicon/.test(m.text())&&befund('CON '+m.text().slice(0,200)));
p.on('response', r=>r.status()>=400&&!/favicon/.test(r.url())&&befund(r.status()+' '+r.request().method()+' '+r.url().slice(0,150)));
p.on('dialog', d=>{ console.log('DIALOG', d.message()); d.accept(); });
const w=(ms)=>p.waitForTimeout(ms);
const txt=async()=>(await p.locator('body').innerText()).trim();
const foto=(n)=>p.screenshot({path:`${OUT}/${n}.png`, fullPage:true});
const juhu = async()=>{ for(let i=0;i<3;i++){ const j=p.getByRole('button',{name:/Juhu, weiter/}).first(); if(!(await j.isVisible().catch(()=>false))) return; await j.click(); await w(600);} };
async function geh(v){ aktuell=v; await p.goto(`${URL}/#/${v}`); await w(2500); for(let i=0;i<12&&/Lädt(…|\.\.\.)/.test(await txt().catch(()=>''));i++) await w(1000); await juhu();
  const t=await txt(); if(t.length<60||/Etwas ist schiefgelaufen|Something went wrong/i.test(t)) befund('leer/abgestürzt: '+t.slice(0,100)); }
for (let v=0; v<3; v++){ await p.goto(URL).catch(()=>{}); if(await p.locator('input[type=email]').waitFor({timeout:20000}).then(()=>true).catch(()=>false)) break; }
await p.locator('input[type=email]').fill('claude.admintest@example.com'); await p.locator('input[type=password]').fill(process.env.AKA_TEST_PW);
await p.getByRole('button',{name:'Anmelden'}).click(); await w(8000); await juhu();
await foto('00-start'); console.log('START:', (await txt()).slice(0,300).replace(/\s+/g,' '));
const ansichten = process.env.NUR ? process.env.NUR.split(',') : ['home','admin','admin-uebersicht','admin-teams','admin-quests','admin-formulare','admin-wissen','admin-invite-proband','admin-create-proband',
 'tagesplan','routinen','atemuebungen','tageslicht','hydration','schlaf','bildschirmzeit','ernaehrung','training','supplemente','medikamente','wochenuebersicht','morgenroutine','abendroutine','verlauf','archiv','statistik','erfolge','tagebuch','profil','mehr','lexikon','team','denksport'];
for (const v of ansichten){ await geh(v); await foto('10-'+v); }
const T='Probe-Team Admin-Test';
await geh('admin-teams');
await p.getByPlaceholder('z. B. Team Sonnenschein').fill(T);
await p.getByRole('button',{name:'Anlegen'}).click(); await w(3000);
const karte = p.locator('div').filter({ has: p.getByText(T,{exact:true}) }).filter({ has: p.getByRole('button',{name:'+ Gruppenprotokoll'}) }).last();
await karte.getByRole('button',{name:'+ Gruppenprotokoll'}).click(); await w(800);
await p.getByPlaceholder('z. B. 21 Tage Morgenroutine').fill('Probe-Woche');
await p.getByPlaceholder('z. B. Jeden Morgen gut in den Tag starten').fill('Nur ein Test');
await p.getByText('1 Woche',{exact:true}).click().catch(e=>befund('Dauer: '+e.message.split('\n')[0]));
// Morgenroutine ist vorausgewählt
await p.getByPlaceholder(/Eigene Gruppen-Gewohnheit/).fill('Kurz spazieren');
await p.getByRole('button',{name:'+',exact:true}).click();
await p.getByPlaceholder(/Gemeinsam 40/).fill('Gemeinsam 5× spazieren');
await p.getByPlaceholder(/Ziel, z. B. 40/).fill('5');
await foto('20-formular');
await p.getByRole('button',{name:'Gruppenprotokoll starten'}).click(); await w(3500);
await foto('21-angelegt');
const t1=await txt(); if(!/Probe-Woche/.test(t1)) befund('Gruppenprotokoll nach Anlegen nicht sichtbar');
const beendenBtn = p.locator("xpath=//div[normalize-space(text())='Probe-Woche']/ancestor::div[.//button[normalize-space()='Beenden']][1]//button[normalize-space()='Beenden']");
await p.locator("xpath=//div[normalize-space(text())='Probe-Woche']/ancestor::div[.//button[normalize-space()='Stand']][1]//button[normalize-space()='Stand']").first().click(); await w(1500); await foto('22-stand');
await beendenBtn.first().click(); await w(3000); await foto('23-beendet');
if(!/Beendet: .*Probe-Woche/.test(await txt())) befund('Beendet-Hinweis fehlt');
// Verwalten als Jonas (nur ansehen)
await geh('admin');
const btn = p.getByRole('button',{name:'Verwalten',exact:true});
const n = await btn.count(); let geklickt=false;
for (let i=0;i<n;i++){ const t = await btn.nth(i).evaluate(el=>{ let e=el; for(let k=0;k<8&&e;k++){ e=e.parentElement; if(e && e.querySelectorAll('button').length>=3 && /Dauertest|@/.test(e.innerText)) return e.innerText; } return ''; }); if(/Jonas Dauertest/.test(t)){ await btn.nth(i).click(); geklickt=true; break; } }
if(!geklickt) befund('Verwalten-Knopf für Jonas nicht gefunden');
await w(5000); await juhu(); aktuell='verwalten-home'; await foto('30-verwalten-home');
if(!/Du verwaltest gerade: Jonas/.test(await txt())) befund('Verwalten-Banner fehlt');
for (const v of ['team','tagesplan','training','erfolge','mehr']){ aktuell='verwalten-'+v; await p.evaluate((v)=>{location.hash='#/'+v},v); await w(3500); await juhu(); const t=await txt(); if(!/Du verwaltest gerade/.test(t)) befund('Banner weg in '+v); if(/Etwas ist schiefgelaufen/.test(t)) befund('Absturz'); await foto('31-'+v); }
await p.getByRole('button',{name:/Zurück zum Dashboard/}).first().click(); await w(3000); aktuell='zurueck';
if(/Du verwaltest gerade/.test(await txt())) befund('Zurück zum Dashboard hat nicht funktioniert');
await foto('32-zurueck');
// Aufräumen: Probe-Team wieder löschen (über die Oberfläche = gleich mitgetestet)
await geh('admin-teams');
const loeschen = p.locator(`xpath=//div[normalize-space(text())='${T}']/ancestor::div[.//button[normalize-space()='Team löschen']][1]//button[normalize-space()='Team löschen']`);
if (await loeschen.first().waitFor({ timeout: 15000 }).then(() => true).catch(() => false)) { await loeschen.first().click(); await w(3000); if ((await txt()).includes(T)) befund('Probe-Team ließ sich nicht löschen'); } else befund('Team-löschen-Knopf nicht gefunden');
fs.writeFileSync(`${OUT}/befunde.json`, JSON.stringify(log,null,1));
console.log('FERTIG', log.length); await b.close();
