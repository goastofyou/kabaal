# Kabaal!

Partygame in de browser: één scherm (tv/laptop) is de host, iedereen speelt mee met zijn telefoon via een kamercode of QR-code.

11 rondes (kies ze in de lobby):

| Ronde | Geïnspireerd op | Kort |
|---|---|---|
| Quiz | Kahoot / You Don't Know Jack | Meerkeuze, sneller = meer punten |
| Wie van ons…? | — | Stem anoniem, meerderheid scoort |
| Lolbroek | Quiplash | Grappigste antwoord wint het duel |
| Golflengte | Wavelength | Hint op een schaal, schuif naar het doel |
| De Faker | Fakin' It / Spyfall | Eén speler kent het geheime woord niet |
| Hoeveel van ons? | Survey Scramble | Ja/nee + raad hoeveel ja zeiden |
| Bluf | Fibbage | Verzin nep-antwoorden, zoek het echte |
| Verdeel de groep | Split the Room | Maak een dilemma af voor een 50/50-split |
| Kunstbluf | Drawful | Teken, verzin nep-titels, zoek de echte |
| Doorgeefluik | Gartic Phone | Schrijven → tekenen → beschrijven… |
| Tekenen & raden | Pictionary / skribbl | Live tekenen op de tv, rest raadt |

- Spelen: open de GitHub Pages-link, klik *Start een spel op dit scherm*, en laat spelers de QR-code scannen.
- Realtime verbinding via Supabase Realtime (broadcast) — geen database nodig.
- Vragen en woorden aanpassen: `data.js`.
- Lokaal testen zonder internet: voeg `?local=1` toe en open host en spelers als tabbladen in dezelfde browser.
