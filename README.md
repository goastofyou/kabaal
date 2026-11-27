# Kabaal!

Partygame in de browser: één scherm (tv/laptop) is de host, iedereen speelt mee met zijn telefoon via een kamercode of QR-code.

17 rondes (kies ze in de lobby):

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
| Reflex | Mario Party | Tik zodra je scherm groen wordt |
| Tap Race | Mario Party | Tik zo snel je kan naar de finish |
| Stopwatch | — | Stop de klok op precies X seconden (blind) |
| Hot Potato | — | Geef de bom door met een woord uit de categorie |
| Shake It | — | Schud je telefoon tot je ballon knapt |
| Last Stand | Trivia Murder Party / Party Animals | Quiz met levens; geesten laten levenden schrikken |

## Extra's
- Dieren-avatars met accessoires (kies je in de lobby op je telefoon)
- Emoji-reacties vanaf je telefoon die over het tv-scherm vliegen
- Reeksbonus voor meerdere goede antwoorden op rij
- Finale: laatste ronde telt ×3 (uit te zetten)
- Teams: 2 of 3 teams, met teamscores
- Awards aan het eind (Snelste vinger, Grootste bluffer, …)
- Geluidseffecten en achtergrondmuziek (gesynthetiseerd, aan/uit bovenin)

## Modussen
In de lobby kies je een modus of vink je zelf rondes aan (Custom):
- **Party Mix**: Quiz, Reflex, Punchline, Spectrum, The Faker, How Many of Us?, Draw & Guess
- **Arcade Mode**: Reflex, Tap Race, Stopwatch, Hot Potato, Shake It
- **Draw Mode**: Draw & Guess, Art Bluff, Broken Telephone
- **Brain Mode**: Quiz, Bluff, Spectrum, Last Stand
- **Comedy Mode**: Punchline, Fifty-Fifty, Broken Telephone, Most Likely To
- **Friends Mode**: Most Likely To, How Many of Us?, The Faker, Fifty-Fifty
- **Everything**: alle 17 rondes

## Instellingen
Via *Instellingen* in de lobby: tijd per vraag (Kort/Normaal/Lang) en per ronde het aantal vragen, beurten of stappen. Het grote scherm onthoudt je keuzes.

- Spelen: open de GitHub Pages-link, klik *Start een spel op dit scherm*, en laat spelers de QR-code scannen.
- Realtime verbinding via Supabase Realtime (broadcast) — geen database nodig.
- Vragen en woorden aanpassen: `data.js`.
- Lokaal testen zonder internet: voeg `?local=1` toe en open host en spelers als tabbladen in dezelfde browser.
