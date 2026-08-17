# MARVEL MARATON

PWA za praćenje gledanja celog MCU-a do **Avengers: Doomsday (18.12.2026)**.
Čist HTML/CSS/JS, bez frameworka i bez build koraka. Radi kao statični sajt
(GitHub Pages) i instalira se kao app na Androidu.

Maraton traje **18 nedelja: 17.08.2026 → 20.12.2026**.

---

## 1. Pokretanje lokalno

Ne otvaraj `index.html` duplim klikom — `fetch('data.json')` ne radi preko
`file://`. Pokreni server iz foldera projekta:

```bash
python -m http.server 8000
```

Pa otvori `http://localhost:8000`.

Alternativa ako imaš Node:

```bash
npx serve .
```

---

## 2. Firebase (sinhronizacija laptop ↔ telefon)

App radi **100% i bez Firebase-a** — sve se čuva u `localStorage`, a prenos
između uređaja ide preko Export/Import JSON. Firebase je tu samo da to bude
automatsko.

### 2.1 Napravi projekat

1. https://console.firebase.google.com → **Add project** (Google Analytics ti ne treba).
2. U projektu: **Build → Firestore Database → Create database**.
   Izaberi **Start in production mode**, region npr. `europe-west3`.
3. **Project settings** (zupčanik gore levo) → **General** → sekcija *Your apps*
   → ikonica `</>` (Web) → **Register app** (Hosting ti ne treba).
4. Firebase ti ispiše `const firebaseConfig = { ... }`.

### 2.2 Nalepi config

Otvori `firebase-config.js` i zameni `REPLACE_ME` vrednostima iz koraka 4:

```js
window.FIREBASE_CONFIG = {
  apiKey: "AIza...",
  authDomain: "moj-projekat.firebaseapp.com",
  projectId: "moj-projekat",
  storageBucket: "moj-projekat.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abc123"
};
```

Ako ostaviš `REPLACE_ME`, app to prepozna i tiho preskoči Firebase.

### 2.3 Firestore rules

Firestore → **Rules** → nalepi ovo → **Publish**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Jedan dokument po korisniku: users/{syncCode}
    // syncCode je string koji sam unosiš u app-u (isti na svim uređajima).
    match /users/{syncCode} {
      allow read, write: if syncCode.matches('^[a-z0-9][a-z0-9-]{7,63}$');
    }

    // Sve ostalo je zatvoreno.
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

**Iskreno o zaštiti:** ovo je slaba zaštita. Nema naloga ni lozinke — ko sazna
tvoj kod, može da vidi i menja tvoju listu. Zaštita je praktično samo to što je
kod teško pogoditi. Za listu odgledanih filmova to nije problem: nema lozinki,
nema ličnih podataka, nema ničega što bi nekome vredelo. Zato izaberi kod koji
se ne pogađa (npr. `kosta-marvel-7f3a`), a ne `test` ili `marvel`.

Pravilo iznad traži 8–64 karaktera, mala slova/cifre/crtice, i ne dozvoljava da
neko lista sve dokumente — mora tačno da pogodi ceo kod.

### 2.4 Korišćenje

Prvo pokretanje traži kod. Unesi isti kod na telefonu i na laptopu — to je sve.
U **Ja → Sinhronizacija** vidiš status, možeš da ga promeniš i da ručno gurneš
promene (`Sinhronizuj sada`).

Kad nema neta, app radi normalno i piše `offline — sinhronizovaće se`; čim se
mreža vrati, promene odlaze same. Ako ista lista postoji na dva mesta, pobeđuje
ona sa novijim `updatedAt` (last-write-wins).

---

## 3. Deploy na GitHub Pages

```bash
git init
git add .
git commit -m "Marvel Maraton"
git branch -M main
git remote add origin https://github.com/<korisnik>/marvel-maraton.git
git push -u origin main
```

Zatim na GitHub-u: **Settings → Pages → Source: Deploy from a branch →
Branch: `main`, folder: `/ (root)` → Save.**

Za minut-dva sajt je na `https://<korisnik>.github.io/marvel-maraton/`.

> **Bitno pri svakom sledećem deployu:** podigni verziju keša u `sw.js`
> (`const CACHE = 'marvel-maraton-v1'` → `-v2`, `-v3`…). Bez toga service
> worker servira staru verziju i izmene se „ne vide".

---

## 4. Instalacija na telefon

1. Otvori GitHub Pages adresu u **Chrome-u na Androidu**.
2. Meni (⋮) → **Add to Home screen** / *Dodaj na početni ekran*.
3. Otvara se bez adresne trake, kao prava aplikacija, i radi offline.

Na iPhone-u: Safari → Share → *Add to Home Screen* (radi, ali su notifikacije
na iOS-u ograničenije).

---

## 5. Notifikacije preko Google Kalendara (.ics)

Prave notifikacije kad je app zatvoren zahtevaju push server. Nemamo ga i ne
pravimo se da ga imamo — umesto toga koristimo kalendar:

1. **Kalendar → „Izvezi u kalendar (.ics)"** — skine se `marvel-maraton.ics`.
2. Otvori **Google Kalendar na računaru** (calendar.google.com).
3. Zupčanik → **Podešavanja** → levo **Uvoz i izvoz** → **Uvoz**.
4. Izaberi `marvel-maraton.ics`, izaberi u koji kalendar, klikni **Uvezi**.
5. Na telefonu se pojavi automatski (isti Google nalog).

Šta dobijaš: svaka nedelja je jedan celodnevni događaj od 7 dana, sa naslovom
tipa `MCU N7: Moon Knight ep 1-6, Multiverse of Madness`, punom listom i tvojim
linkovima u opisu, i dva podsetnika — **nedeljom uveče u 19:00** (pred početak
nedelje) i **sredom u 18:00**. Plus poseban događaj za Doomsday sa podsetnikom
7 dana ranije.

Ako promeniš tempo ili izbaciš neki tier, izvezi ponovo — događaji imaju
stabilne UID-eve, pa Google ažurira postojeće umesto da pravi duplikate.

U samoj aplikaciji postoji i mala lokalna notifikacija „Danas: …", ali se
prikazuje samo kad app otvoriš, i najviše jednom dnevno.

---

## 6. Posteri

`poster` polje u `data.json` je prazno za sve naslove. Da dodaš sliku:

```json
{
  "id": "iron-man",
  "poster": "https://image.tmdb.org/t/p/w500/xxxxxxxx.jpg"
}
```

Bilo koji direktan URL do slike radi (TMDb, Wikipedia, tvoj hosting). Dok je
polje prazno, kartica prikazuje gradijent sa naslovom — izgleda uredno, tako da
ovo nije obavezno.

---

## Kako radi planer (ukratko)

Raspored se **ne čita iz `data.json`** — polja `week` i `weeks` su samo autorov
predlog i app ih ignoriše. Plan se preračunava od nule na svaku promenu
(čekiranje, kapacitet, izbačen tier):

1. Uzmu se naslovi čiji je tier uključen u **Ja → Šta gledam**, po redosledu
   izlaska. Fox filmovi (X-Men, Logan, Deadpool) se ubacuju **neposredno pre**
   *Deadpool & Wolverine*, ne na kraj.
2. Serije se razlažu na epizode (`runtime / episodes` po epizodi).
3. Odgledano ispada iz plana.
4. Nedelje se pune redom do kapaciteta (`Ja → Tempo`, ili olovka na konkretnoj
   nedelji u Kalendaru), sa tolerancijom od 20 minuta da se epizoda ne cepa.
   Serija sme da se prelije u sledeću nedelju.
5. Ako sve ne stane do 18. nedelje, app ne puca — prikaže koliko ne stiže i
   ponudi dva izlaza (izbaci `skip` tier ili digni tempo).

Zato „zaostatak" ne postoji kao lista koja raste: ono što ne odgledaš ove
nedelje samo ponovo uđe u pakovanje i pojavi se u sledećoj.

---

## Platforme

Vrednosti `platform` u `data.json` su **pretpostavka**, ne činjenica
(`disney` = verovatno Disney+, `check` = Sony film, proveri). Katalozi se menjaju
i razlikuju po zemljama. Merodavno je ono što ti izabereš u modalu naslova
(*Platforma*) — filter „Imam pretplatu" u Biblioteci gleda isključivo tvoj izbor.
Dugme „Gde gledati u Srbiji?" otvara JustWatch pretragu za taj naslov.

---

## Fajlovi

| fajl | šta radi |
|---|---|
| `index.html` | kostur, tab bar, kontejneri |
| `style.css` | dark tema, mobile-first |
| `app.js` | UI, četiri ekrana, interakcija |
| `planner.js` | dinamički raspored (najkomplikovaniji deo, detaljno komentarisan) |
| `sync.js` | stanje korisnika, localStorage + Firestore |
| `ics.js` | izvoz u `.ics` |
| `firebase-config.js` | tvoj Firebase config (placeholder) |
| `data.json` | 69 naslova (63 MCU + 6 Fox bonus) |
| `manifest.json`, `sw.js`, `icons/` | PWA |
| `.claude/launch.json` | pomoćni fajl za lokalni server, može da se obriše |

Bez reklama, bez trackera, bez analitike. Jedini spoljni poziv je Firebase
(ako ga uključiš) i JustWatch/tvoji linkovi kad ih sam otvoriš.
