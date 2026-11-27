# Kabaal!

Partygame in de browser: één scherm (tv/laptop) is de host, iedereen speelt mee met zijn telefoon via een kamercode of QR-code.

11 rondes (kies ze in de lobby):

| Ronde | Geïnspireerd op | Kort |
|---|---|---|
| Quiz | Kahoot / You Don't Know Jack | Meerkeuze, sneller = meer punten |
| Most Likely To | — | Stem anoniem, meerderheid scoort |
| Punchline | Quiplash | Grappigste antwoord wint het duel |
| Spectrum | Wavelength | Hint op een schaal, schuif naar het doel |
| The Faker | Fakin' It / Spyfall | Eén speler kent het geheime woord niet |
| How Many of Us? | Survey Scramble | Ja/nee + raad hoeveel ja zeiden |
| Bluff | Fibbage | Verzin nep-antwoorden, zoek het echte |
| Fifty-Fifty | Split the Room | Maak een dilemma af voor een 50/50-split |
| Art Bluff | Drawful | Teken, verzin nep-titels, zoek de echte |
| Broken Telephone | Gartic Phone | Schrijven → tekenen → beschrijven… |
| Draw & Guess | Pictionary / skribbl | Live tekenen op de tv, rest raadt |

## Modussen
In de lobby kies je een modus of vink je zelf rondes aan (Custom):
- **Party Mix**: Quiz, Punchline, Spectrum, The Faker, How Many of Us?, Draw & Guess
- **Draw Mode**: Draw & Guess, Art Bluff, Broken Telephone
- **Brain Mode**: Quiz, Bluff, Spectrum
- **Comedy Mode**: Punchline, Fifty-Fifty, Broken Telephone, Most Likely To
- **Friends Mode**: Most Likely To, How Many of Us?, The Faker, Fifty-Fifty
- **Everything**: alle 11 rondes

## Instellingen
Via *Instellingen* in de lobby: tijd per vraag (Kort/Normaal/Lang) en per ronde het aantal vragen, beurten of stappen. Het grote scherm onthoudt je keuzes.

- Spelen: open de GitHub Pages-link, klik *Start een spel op dit scherm*, en laat spelers de QR-code scannen.
- Realtime verbinding via Supabase Realtime (broadcast) — geen database nodig.
- Vragen en woorden aanpassen: `data.js`.
- Lokaal testen zonder internet: voeg `?local=1` toe en open host en spelers als tabbladen in dezelfde browser.
