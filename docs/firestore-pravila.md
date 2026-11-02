# Firestore pravila — automatski

Sva pravila baze su u **`firestore.rules`** (u korenu repozitorijuma).
Kad se taj fajl promeni na `main`, GitHub Action
(`.github/workflows/firestore-rules.yml`) ih sam objavi u Firebase.
Ništa više ne lepiš ručno.

## Jednom podešavanje (5 minuta)

1. **Firebase konzola** → ⚙️ *Project settings* → kartica **Service accounts**
   → **Generate new private key** → potvrdi. Skine se `.json` fajl.
2. **GitHub** → repozitorijum `marvel-maraton` → **Settings** → **Secrets and variables**
   → **Actions** → **New repository secret**
   - Name: `FIREBASE_SERVICE_ACCOUNT`
   - Secret: otvori skinuti `.json` u beležnici, kopiraj **ceo** sadržaj i nalepi.
3. Obriši skinuti `.json` sa telefona/računara (ključ sad čuva GitHub).
4. Provera: GitHub → **Actions** → *Firestore pravila* → **Run workflow**.
   Zeleno = pravila su objavljena.

> Ključ daje pristup bazi — nikome ga ne šalji i ne stavljaj u kod.
> Ako ga ikad otkriješ, u istom meniju (Service accounts) ga obriši i napravi novi.

## Promena pravila ubuduće

Izmeni `firestore.rules` (ili reci Claude-u šta treba), push na `main` — gotovo.
Bez tajne Action se samo preskoči, pa onda pravila i dalje možeš ručno da nalepiš
iz `firestore.rules` u Firebase konzolu (Firestore Database → Rules → Publish).
