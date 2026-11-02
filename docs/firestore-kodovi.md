# Firestore pravila za kodove

> Ceo skup pravila je sada u `firestore.rules` i objavljuje se sam — vidi `docs/firestore-pravila.md`.

Kodovi se čuvaju u kolekciji `codes`. Da bi radili, u Firebase konzoli
(**Firestore Database → Rules**) dodaj ovaj blok **unutar**
`match /databases/{database}/documents { ... }`, pored postojećih pravila
(profiles, reviews, reactions…), pa klikni **Publish**.

```
    // Kodovi za nagrade: pravi ih samo Kosta, svi prijavljeni ih koriste
    match /codes/{code} {
      allow read: if request.auth != null;
      allow create, delete: if request.auth != null
        && request.auth.token.email == 'kostabogdanic@gmail.com';
      allow update: if request.auth != null && (
        request.auth.token.email == 'kostabogdanic@gmail.com' || (
          request.resource.data.diff(resource.data).affectedKeys().hasOnly(['used', 'usedBy'])
          && !(request.auth.uid in resource.data.usedBy)
          && request.auth.uid in request.resource.data.usedBy
          && request.resource.data.used == resource.data.used + 1
          && (resource.data.max == 0 || resource.data.used < resource.data.max)
        )
      );
    }
```

Šta ovo znači:
- **čitanje**: svako ko je prijavljen može da proveri kod (mora da zna tačan kod);
- **pravljenje i brisanje**: samo nalog `kostabogdanic@gmail.com`;
- **iskorišćavanje**: korisnik sme samo da upiše sebe u `usedBy` i poveća `used` za 1,
  i to samo ako kod nije potrošen i ako ga već nije iskoristio.
