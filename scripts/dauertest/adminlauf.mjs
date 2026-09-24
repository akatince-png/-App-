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
// Coach-Alltag (seit 24.09., Nutzerinnen-Vorgabe): Ergebnisse durchsehen,
// eine Korrektur machen und rückgängig machen, einer Person schreiben. Die
// Tipp-Zahlen je Aufgabe landen im Bericht (ADHS-Blick: so wenige wie möglich).
const coach = { taps: {}, beobachtungen: [] };
const TEST_COACHEES = ['Claude Dauertest', 'Mia Dauertest', 'Jonas Dauertest', 'Lea Dauertest'];
// 1) Ergebnisse durchsehen: Coach-Übersicht
await geh('admin');
await p.getByRole('button', { name: /Coach-Übersicht/ }).first().click().catch(() => befund('Knopf Coach-Übersicht fehlt'));
await w(3500); aktuell = 'coach-uebersicht';
await foto('40-coach-uebersicht');
coach.taps.ergebnisseSehen = 1;
const ueText = await txt();
for (const n of TEST_COACHEES) {
  const i = ueText.indexOf(n);
  coach.beobachtungen.push(`${n}: ${i < 0 ? 'NICHT in der Übersicht' : ueText.slice(i, i + 160).replace(/\s+/g, ' ')}`);
}
if (!/heute|zuletzt|ruhig|Punkte/i.test(ueText)) coach.beobachtungen.push('Übersicht zeigt keinen Tagesstand/keine letzte Aktivität je Person – wer Hilfe braucht, ist nicht auf einen Blick erkennbar.');
// 2) Nachricht an Jonas (ruhigste Testperson) über "💬 Nachricht"
const karteVon = (name) => p.locator(`xpath=//div[normalize-space(text())='${name}']/ancestor::div[.//button[normalize-space()='Verwalten']][1]`);
const jonasKarte = karteVon('Jonas Dauertest');
if (await jonasKarte.count()) {
  await jonasKarte.first().getByRole('button', { name: /Nachricht/ }).click(); await w(1200);
  const feld = p.getByPlaceholder(/Nachricht an Jonas/);
  await feld.fill(`Hi Jonas, wie läuft deine Woche? Melde dich gern kurz. (Dauertest ${new Date().toISOString().slice(0, 10)})`);
  await p.getByRole('button', { name: 'Senden', exact: true }).first().click(); await w(2500);
  await foto('41-nachricht-gesendet');
  coach.taps.nachrichtSchreiben = 3; // Coach-Übersicht, 💬 Nachricht, Senden (+ Tippen)
  if (!(await txt()).includes('wie läuft deine Woche')) befund('Coach-Nachricht nach dem Senden nicht sichtbar');
} else befund('Jonas-Karte in der Coach-Übersicht nicht gefunden');
// 3) Korrektur: bei Mia einen Wasser-Eintrag ändern und wieder zurücksetzen
await geh('admin');
const btnV = p.getByRole('button', { name: 'Verwalten', exact: true });
let miaOk = false;
for (let i = 0; i < await btnV.count(); i++) {
  const t = await btnV.nth(i).evaluate((el) => { let e = el; for (let k = 0; k < 8 && e; k++) { e = e.parentElement; if (e && e.querySelectorAll('button').length >= 3 && /@/.test(e.innerText)) return e.innerText; } return ''; });
  if (/Mia Dauertest/.test(t)) { await btnV.nth(i).click(); miaOk = true; break; }
}
if (miaOk) {
  await w(4500); await juhu(); aktuell = 'korrektur-mia';
  await p.evaluate(() => { location.hash = '#/hydration'; }); await w(3500);
  const stift = p.getByTitle('Bearbeiten').first();
  if (await stift.count()) {
    const wertVorher = (await stift.locator('xpath=preceding-sibling::span[1]').innerText().catch(() => '')).replace(/\D/g, '');
    const aendern = async (ziel) => {
      await p.getByTitle('Bearbeiten').first().click(); await w(600);
      await p.getByRole('button', { name: /▼/ }).filter({ hasText: /^\d+/ }).last().click(); await w(600);
      await p.getByText(ziel, { exact: true }).last().click(); await w(500);
      await p.getByRole('button', { name: 'Speichern', exact: true }).last().click(); await w(2000);
    };
    if (wertVorher) {
      const neu = String(Number(wertVorher) + 200);
      await aendern(neu); await foto('42-korrektur');
      const nachher = await txt();
      if (!nachher.includes(`${neu} ml`)) befund(`Korrektur bei Mia nicht übernommen (erwartet ${neu} ml)`);
      await aendern(wertVorher);
      if (!(await txt()).includes(`${wertVorher} ml`)) befund(`Korrektur bei Mia nicht zurückgesetzt – bitte ${wertVorher} ml prüfen!`);
      coach.taps.korrektur = 6; // Dashboard: Verwalten, Wasser, ✏️, Wert öffnen, Wert wählen, Speichern
    } else coach.beobachtungen.push('Mia: kein Wasser-Eintrag mit Wert gefunden, Korrektur übersprungen');
  } else coach.beobachtungen.push('Mia: keine Wasser-Einträge zum Korrigieren');
  await p.getByRole('button', { name: /Zurück zum Dashboard/ }).first().click().catch(() => {}); await w(2500);
} else befund('Verwalten-Knopf für Mia nicht gefunden');
fs.writeFileSync(`${OUT}/coach-alltag.json`, JSON.stringify(coach, null, 1));
console.log('COACH', JSON.stringify(coach, null, 1));
// Aufräumen: Probe-Team wieder löschen (über die Oberfläche = gleich mitgetestet).
// Sicherheitshalber erst aus einem evtl. noch aktiven "Verwalten als" raus.
if (/Du verwaltest gerade/.test(await txt())) { await p.getByRole('button', { name: /Zurück zum Dashboard/ }).first().click().catch(() => {}); await w(2500); }
await geh('admin-teams');
await foto('50-teams-vor-loeschen');
const loeschen = p.locator(`xpath=//div[normalize-space(text())='${T}']/ancestor::div[.//button[normalize-space()='Team löschen']][1]//button[normalize-space()='Team löschen']`);
if (await loeschen.first().waitFor({ timeout: 15000 }).then(() => true).catch(() => false)) { await loeschen.first().click(); await w(3000); if ((await txt()).includes(T)) befund('Probe-Team ließ sich nicht löschen'); } else befund('Team-löschen-Knopf nicht gefunden');
fs.writeFileSync(`${OUT}/befunde.json`, JSON.stringify(log,null,1));
console.log('FERTIG', log.length); await b.close();
