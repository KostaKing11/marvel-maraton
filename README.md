# MARVEL MARATON

PWA za maraton do **Avengers: Doomsday (18.12.2026)** — od „samo obavezno"
do celog Marvela (150 naslova). Čist HTML/CSS/JS, bez frameworka i bez build
koraka. Radi kao statični sajt (GitHub Pages) i instalira se kao app na Androidu.

**Verzija 2.0** je napravljena od nule. Stanje korisnika (`mm-state-v1` u
localStorage i `users/{uid}` u Firestore-u) je isto kao u 1.x — odgledano se
ne gubi, a stari `plans` se sam pretvara u novi izbor („Šta gledam").

### Šta gledaš

| izbor | šta ulazi |
|---|---|
| **Samo obavezno** | zvanična Disney+ lista „Countdown to Avengers: Doomsday" (15 naslova) + Brand New Day |
| **Doomsday+** | obavezno + „dobro za Doomsday" (likovi koji se vraćaju) |
| **Ceo MCU** | svaki MCU film i serija + X-Men i X2 (obavezni su) |
| **Full Marvel** | sve: Fox X-Men, Netflix, Spider-Man/Sony, Marvel TV, animacija, klasici |
| **Prilagođeno** | biraš kolekcije i nivoe ručno |

Nivoi u `data.json` (`doom`): `must` (zeleno, baš obavezno), `good` (žuto),
`skip` (sivo). `d15: true` = naslov je na zvaničnoj Disney+ listi.

### Put do Doomsdaya (mapa)

Tap na mini mapu na početnom ekranu otvara dugu vodoravnu mapu (kao trophy
road) koja se skroluje prstom: Latverija → Šuma senki → Pali grad → Inkurzija →
Doomsday, sa stanicom za svaku nedelju i bioskopskim znakom na dan premijere.
Doom stoji tamo gde je **danas** (vreme), a ti i ekipa tamo dokle ste stigli u
**svom planu** (odgledano). Dugmići dole idu redom kao na putu i skaču do
Dooma, do svakog iz ekipe i do cilja. Tap na broj dana otvara tačno
odbrojavanje (dani, sati, minuti, sekunde).

Slike su u `img/map/` (oslikane u Figmi): pozadine zona `z1`–`z5`, Doom
(`doom.webp`, glava `doomhead.jpg`), tekstura puta `road.jpg`, znak
`sign.webp`, ikone `start.webp` / `goal.webp` i `mini.jpg` za mini mapu.

### Predmeti, Gauntlet i dostignuća

Svaki naslov kad ga završiš daje svoj predmet (`ITEMS` u `js/badges.js`):
Mjolnir, štit, Awesome Mix kaseta… Retkost prati nivo: obavezno = epsko,
dobro = retko, ostalo obično; Avengers filmovi, No Way Home, Deadpool &
Wolverine i Doomsday su legendarni. Predmeti se ne čuvaju posebno — izvode
se iz odgledanog, pa uvek prate stanje.

Gauntlet: prazna rukavica iz Age of Ultron, kamenje iz filma u kome se
pojavljuje (prostor — Captain America, um — Avengers, stvarnost — Thor 2,
moć — Guardians, vreme — Doctor Strange, duša — Infinity War). Endgame
dopuni sve što fali. Dostignuća (`ACH`) se pamte u `s.ach` kad se otključaju.

Scene posle špice su u `data.json` kao `pc: [usred špice, na samom kraju]`.

„Šta je novo" (`NEWS` u `js/views.js`) iskače samo za velike promene
(`big: true`); ostalo čeka u profilu, a slika gore desno ima tačkicu dok ne
pročitaš.

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

Otvori `js/firebase-config.js` i zameni `REPLACE_ME` vrednostima iz koraka 4:

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

### 2.3 Uključi Google prijavu

Firebase konzola → **Build → Authentication → Get started** → tab
**Sign-in method** → **Google** → uključi → **Save**.

Zatim **Authentication → Settings → Authorized domains** → **Add domain** →
`kostaking11.github.io` (i `localhost` ako testiraš lokalno). Bez ovoga prijava
puca sa `auth/unauthorized-domain`.

### 2.4 Firestore rules

Firestore → **Rules** → nalepi ovo → **Publish**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Tvoja lista — samo ti, i to tek kad si prijavljen.
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }

    // Profil koji ekipa vidi: ime, slika, dokle si stigao.
    match /profiles/{uid} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == uid;
    }

    // Ocene: svi prijavljeni čitaju, svako piše samo svoje.
    match /reviews/{rid} {
      allow read: if request.auth != null;
      allow create, update: if request.auth != null
        && request.auth.uid == request.resource.data.uid
        && rid == request.resource.data.itemId + '__' + request.auth.uid
        && request.resource.data.stars is int
        && request.resource.data.stars >= 1 && request.resource.data.stars <= 5
        && request.resource.data.text.size() <= 500;
      allow delete: if request.auth != null && request.auth.uid == resource.data.uid;
    }

    // Poruke ekipi: svi prijavljeni citaju, svako pise samo u svoje ime.
    match /notices/{nid} {
      allow read: if request.auth != null;
      allow create: if request.auth != null
        && request.auth.uid == request.resource.data.uid
        && request.resource.data.text.size() <= 300;
      allow update: if false;
      allow delete: if request.auth != null && request.auth.uid == resource.data.uid;
    }

    // Reakcije na ocene (🔥 😂 💀 👎): svako jednu po oceni, samo u svoje ime.
    match /reactions/{xid} {
      allow read: if request.auth != null;
      allow create, update: if request.auth != null
        && request.auth.uid == request.resource.data.uid
        && xid == request.resource.data.rid + '__' + request.auth.uid
        && request.resource.data.e in ['🔥', '😂', '💀', '👎'];
      allow delete: if request.auth != null && request.auth.uid == resource.data.uid;
    }

    match /{document=**} { allow read, write: if false; }
  }
}
```

Ovo je **prava zaštita**, za razliku od ranije verzije sa kodom: tvoju listu
ne može da otvori niko osim tebe, i niko ne može da objavi ocenu u tuđe ime.

> **Prelaz sa starog koda:** nova pravila zatvaraju stare dokumente pisane pod
> sync kodom. Ništa se ne gubi — prijavi se prvi put **na uređaju na kome već
> imaš svoju listu** (telefon ili laptop), i app će je upisati pod tvoj nalog.

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

> **Bitno pri svakom sledećem deployu:** podigni `CACHE` i `V` u `sw.js` i isti
> `?v=` broj u `index.html`. Bez toga service worker servira staru verziju i
> izmene se „ne vide".

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

1. **Plan → „Izvezi u kalendar"** (ili **Ja → Podsetnici**) — skine se `marvel-maraton.ics`.
2. Otvori **Google Kalendar na računaru** (calendar.google.com).
3. Zupčanik → **Podešavanja** → levo **Uvoz i izvoz** → **Uvoz**.
4. Izaberi `marvel-maraton.ics`, izaberi u koji kalendar, klikni **Uvezi**.
5. Na telefonu se pojavi automatski (isti Google nalog).

Šta dobijaš: svaki dan plana je jedan celodnevni događaj sa naslovom tipa
`🎬 Loki · S2 ep 3–4 + Thunderbolts* (2h 40m)`, listom i tvojim linkovima u
opisu, i podsetnikom **u 19:00**. Plus poseban događaj za Doomsday sa
podsetnikom 7 dana ranije.

Ako promeniš tempo ili plan, izvezi ponovo — događaji imaju
stabilne UID-eve, pa Google ažurira postojeće umesto da pravi duplikate.

U samoj aplikaciji postoji i mala lokalna notifikacija „Danas: …", ali se
prikazuje samo kad app otvoriš, i najviše jednom dnevno.

---

## 6. Posteri

**Ne moraš ništa da radiš — povlače se sami.** Pri prvom pokretanju app u
pozadini traži poster za svaki naslov:

- **serije** → [TVMaze](https://www.tvmaze.com) (`api.tvmaze.com`), slike ~1000×1500
- **filmovi i specijali** → Wikipedia `pageimages` sa `pilicense=any`

Oba servisa su besplatna, bez API ključa i bez naloga, i šalju CORS zaglavlja
pa rade direktno sa GitHub Pages. Za sezone se uzima poster baš te sezone.

> Bitno: bez parametra `pilicense=any` Wikipedia vraća **samo slobodne slike**,
> a filmski posteri su non-free — API tada tiho vrati `null`. To je jedina
> kvaka u celoj priči.

Nađeni URL se pamti u tvom stanju (localStorage + Firestore), pa se traži
jednom — telefon ga posle samo pročita. Filmski posteri sa Wikipedije su
niske rezolucije (~260×384) jer su non-free; serije su znatno oštrije.

Ako hoćeš drugu sliku za neki naslov: otvori naslov → polje **Poster (URL)** →
nalepi svoj link (ima prednost nad automatskim). Dugme **Nađi** ponovo traži.
Redosled prioriteta: tvoj URL → `poster` polje u `data.json` → automatski nađen.

U **Ja → Posteri** vidiš koliko ih ima i možeš ručno da pokreneš povlačenje.

---

## Kako radi planer (ukratko)

Raspored se **ne čuva** — računa se od nule iz stanja na svaku promenu
(`js/planner.js`):

1. Jedinice = filmovi + pojedinačne epizode iz tvog plana, u izabranom
   redosledu (**Maraton**: po izlasku, ali Fox X-Meni idu pre *Deadpool &
   Wolverine*, Netflix pre *Hawkeye*, Spider-Man filmovi pre *No Way Home*;
   **Po izlasku**; **Hronološki**). Opcija „Obavezno prvo" stavlja zelene napred.
2. Odgledano ispada.
3. Dnevna norma:
   - **Stigni do Doomsdaya** — `(preostalo + danas odgledano) / slobodnih dana do 17.12.`
   - **Moj tempo** — koliko sam zadaš; plan tada sme da ide i posle Doomsdaya.
4. Dani se pune redom, **kumulativno** (manjak jednog dana prelazi u sledeći),
   bez dana dužih od ~1,6× norme. Poslednji slobodan dan pred Doomsday uzima
   sve što je ostalo. Danas, ako još ništa nisi gledao, uvek dobiješ bar nešto.
5. Epizode koje još nisu izašle (`epDates`, npr. VisionQuest) čekaju svoj datum.
6. Slobodni dani: dani u nedelji (`offDays`) + „nemam vremena" za bilo koji
   dan (`skipDays`).

Označavanje iz **Danas/Plan** upisuje se u dnevnik (`log`) za taj dan — to
broji današnju normu i niz. Označavanje iz **Kataloga** (npr. 20 filmova koje si
davno gledao) samo skida naslov iz plana, bez upisa u dnevnik.

### Sinhronizacija bez gubitaka

Dok prvo čitanje sa servera ne stigne, svaka lokalna izmena se pamti. Ako je na
serveru novije stanje (gledao si na laptopu), uzima se ono i lokalne izmene se
ponovo primene — telefon više ne može da pregazi tuđe novije stanje.

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
| `index.html` | ljuska: zaglavlje, 5 ekrana, tab bar |
| `css/app.css` | ceo izgled (tamna tema, mobilno prvo, bez selektovanja i povlačenja za osvežavanje) |
| `js/store.js` | stanje korisnika, localStorage + Firestore, Google prijava |
| `js/catalog.js` | naslovi, kolekcije, izbori („Šta gledam"), redosledi |
| `js/planner.js` | dnevni raspored, napredak, niz |
| `js/views.js` | svi ekrani i listovi (HTML) |
| `js/ui.js` | morph (osvežavanje bez treptanja), listovi, toast, vibracija |
| `js/doom.js` | Put do Doomsdaya — mapa (slike + SVG put, stanice, Doom) |
| `js/main.js` | pokretanje, akcije, gestovi, notifikacije |
| `js/posters.js` | posteri (TVMaze za serije — poster sezone, Wikipedia za filmove) |
| `js/reviews.js` | ocene, ekipa, poruke |
| `js/ics.js` | izvoz u kalendar (jedan događaj po danu) |
| `js/firebase-config.js` | Firebase config |
| `data.json` | 150 naslova (MCU 66, X-Men 13, Netflix 13, Sony 14, Marvel TV 21, animacija 6, klasici 17) |
| `manifest.json`, `sw.js`, `icons/` | PWA |

Bez reklama, bez trackera, bez analitike. Jedini spoljni poziv je Firebase
(ako ga uključiš) i JustWatch/tvoji linkovi kad ih sam otvoriš.
