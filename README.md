# The Lotto Jungle

`Pillfall Harry` is a LottoMind-branded browser jungle runner inspired by the Atari `Pitfall!` source you shared, rebuilt with a custom cyber-jungle cast and tuned platforming feel.

## How to run

Open `index.html` in a browser.

## Controls

- `Left Arrow` or `A`: move left
- `Right Arrow` or `D`: move right
- `Space`: jump
- `E`: use ladder or release from liana
- `P`: pause
- `Enter`: start
- `R`: restart after game over

## Features

- Reversible scene generation based on the original `Pitfall!` LFSR approach.
- Ladder, liana, pit, crocodile, quicksand, treasure, and underground route scenes.
- Jumping keeps a tiny early steer window to better match the original `Pitfall!` croc-jump feel.
- Hole scenes drop Harry into the tunnel route, which still skips three scenes underground.
- A dedicated LottoMind hero sprite plus custom croc, cobra, and scorpion enemy art.
- LottoMind-specific HUD, scene callouts, and branded presentation.

## Project Files

- `index.html`: page shell and HUD
- `styles.css`: LottoMind-themed presentation layer
- `pitfall-port.js`: browser gameplay port and scene logic
- `assets/lottomind-main-hero-clean.png`: dedicated main-character sprite
- `assets/custom-roster-lottomind-v2-clean.png`: enemy sprite sheet for crocs, cobra, and scorpion
- `assets/custom-roster.png`: earlier generated character sheet
- `assets/reference-collage.webp`: original style/reference collage

## Reference Material

- `Pitfall!` disassembly/source shared in the project thread and based on Thomas Jentzsch's work.
- Archive.org reference page for the original game:
  `https://archive.org/details/Pitfall_Activision_1982`
- AtariAge manual reference used for behavior checks:
  `https://www.atariage.com/manual_html_page.php?SoftwareLabelID=360`
- AtariAge poster/source thread used as source provenance and visual reference:
  `https://forums.atariage.com/topic/204513-pitfall-source-code-poster/`
- Meatfighter's browser port/reference repo, useful for implementation ideas but not a strict original-behavior source:
  `https://github.com/meatfighter/pitfall-js`
- Meatfighter's project page, which explicitly documents where that browser port differs from the 1982 game:
  `https://meatfighter.com/pitfall-web/`

## Note

This repo version is a standalone prototype assembled in the local Codex workspace and then prepared for upload here.
