# Marvel Runner — deonice staze

Staza se ne pravi nasumično. Slaže se od ručno napravljenih **deonica** (kao u Subway Surfersu), jedna za drugom.
Sve deonice su u `js/runsections.js`.

## Kako izgleda deonica

```js
{ id: 'tunel', ime: 'Tunel', nivo: 1, duz: 56, redovi: [
  [12, 'T36 . T36'],   // na 12 m: voz levo i desno, sredina slobodna
  [22, '. L .'],       // na 22 m: niska barijera u sredini (skoci)
  [36, '. H .']        // na 36 m: kapija u sredini (klizanje)
] }
```

- `nivo` — od kog dela trke se pojavljuje: 0 = od starta, 1 = posle 600 m, 2 = posle 1.800 m, 3 = posle 3.500 m.
- `duz` — dužina deonice u metrima.
- `redovi` — `[metar, 'LEVA SREDINA DESNA']`, tri oznake razdvojene razmakom. Isti metar sme da se ponovi (npr. prepreka + novčići).

| oznaka | šta je | kako se prolazi |
|---|---|---|
| `.` | ništa | — |
| `c` / `c4` | red novčića (6 ili zadat broj) | — |
| `C` | luk novčića iznad barijere | skok |
| `T24` | voz koji stoji, 24 m | druga traka |
| `R24` | rampa (7 m) pa voz od 24 m | penješ se na krov |
| `M20` | voz koji ide ka tebi | druga traka |
| `L` | niska barijera | skok |
| `H` | visoka kapija | klizanje |
| `X` | zid (STOP) | samo druga traka |
| `G` | Doombot na šinama | samo druga traka |
| `E` | nizak laser | skok |
| `U` | visok laser | klizanje |
| `p` | moć (magnet, let, ×2, skok, štit) | — |
| `k` | plavi board token | — |

## Pravila

1. **Uvek postoji prolaz iz svake trake.** Ma u kojoj traci ušao u deonicu, mora postojati put do kraja.
   To proverava `validate()` (u testovima, za svaku deonicu i za njeno ogledalo levo↔desno).
   Pretpostavke provere: prelazak u susednu traku traje 5 m; na krov voza se ide samo rampom;
   sa krova možeš na susedni krov ili dole na zemlju.
2. **Prva prepreka najranije na 10 m**, da imaš vremena posle prethodne deonice.
3. **Vozovi se završavaju pre kraja deonice** (`d + dužina ≤ duz`), da se deonice ne preklapaju.
4. **Između deonica je prazan razmak** (14 m × brzina): tu dolaze novčići, moć ili board token.
5. **Razmaci rastu sa brzinom.** Pri većoj brzini rastojanja u deonici se razvuku (do ×1,7), a dužine vozova ostaju iste — pa je vreme za reakciju slično i na 3.000 m.
6. **Pokretni voz (`M`)** kreće dalje i brže, tako da stigne do svog reda tačno kad i ti.
7. **Ista deonica se ne ponavlja** dok ne prođu još tri druge; svaka se nasumično okrene u ogledalu.

## Tutorijal

Prva trka je `TUT` deonica: zid (prevuci levo/desno), barijere (skok), kapije (klizanje), rampe na sve tri trake i 9 board tokena.
Igra **stane** ispred prepreke dok ne uradiš traženi potez, pa nastavi.

## Nova deonica

Dodaj je u `SECTIONS`, pa pokreni proveru:

```sh
node -e "const R=require('./js/runsections.js'); R.SECTIONS.forEach(s=>console.log(s.id, R.validate(s).ok, R.validate(R.mirror(s)).ok))"
```

Ako piše `false`, iz neke trake nema prolaza — pomeri prepreku ili otvori traku.
