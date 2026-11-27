# Coin Catch

Created by **jaydheep R (JK)**.

An arcade game with **1000 stages** that mixes reflexes with brain puzzles.

## Speed waves and twists
A stage never moves at one speed. It flows through four phases:
- **CALM**: slow fall, fewer bombs. A breather.
- **BUILD UP**: the speed climbs.
- **RUSH**: much faster, and catches are worth **double points** (on puzzle stages it is a FAST LANE).
- **COOL DOWN**: the speed eases off again.

The music tempo follows the speed. Some RUSH phases bring a **twist**, announced a moment before it starts:
- **Wind gusts**: items drift sideways.
- **Fog at the top**: you only see items late.
- **Mirrored controls**: left is right (Hard only).

**Clutch time:** on your last life, if a bomb is about to hit you, time slows for a moment so you can dodge it.

You can turn speed waves and twist events off in Settings.

## Worlds
Every 10 stages you enter a new world. There are 100 worlds, and each world name is made of two words that decide how it looks:
- The **first word** sets the colours, the weather and the sky: Neon (synthwave sun, light streaks), Crystal (sparkles), Ember (rising embers), Frozen (snow and aurora), Velvet (drifting petals), Solar (a big sun), Lunar (moon and twinkling stars), Jade (fireflies), Cobalt (rain and lightning), Amber (warm pollen).
- The **second word** sets the landscape at the bottom of the screen: Harbor (boats, cranes, lighthouse), Canyon (rock mesas), Garden (hedges, trees, flowers), Temple (pagodas and lanterns), Skyline (lit city towers), Lagoon (palm islands), Summit (snowy peaks), Bazaar (tents and bunting), Reef (coral, kelp, fish), Citadel (castle towers and torches).

Stage 10 of each world is a boss stage.

## Stage types (repeat every 10 stages)
- Action: score points, collect gems, survive, let bombs fall past.
- Brain: **sum** (catch numbers that add up to an exact total), **rule** (catch only numbers that match a rule such as even, prime or multiples of 3), **colour order** (catch coins in a shown order), **maths** (catch the answer), **gauntlet** (puzzle type changes every round) and the **boss** (mixed puzzles while bombs fall).
- From stage 100 the rule changes during the stage, and from stage 200 the colour order is hidden after a few seconds.
- When the mission is complete, the stage stops and nothing more falls.

## Settings
Open **Settings** from the home screen or the pause menu.
- **Difficulty:** Chill (5 lives, slower, gentle twists), Normal (3 lives), Hard (2 lives, faster, mirror twist, wrong puzzle catches cost a life from stage 1).
- **Puzzle assist:** a dashed ring around the correct item in brain stages.
- **Stage hints**, **Speed waves**, **Twist events**, **Sound**, **Music**, **Volume**, **Vibration**.
- **Plate movement:** direct or smooth. **Plate colour**, **Effects** quality, **Screen shake**, **Colour-blind symbols**.
- **Reset all progress.**

## Rules
- Clear a stage without losing a life for 3 stars.
- Power-ups: S shield, M magnet, T slow motion, x2 double points, W wide plate.

## Controls
Drag on the screen, or use the arrow keys / A and D. P, Esc or Space pauses. The pause button only shows while playing.

## Code layout
- `script.js`: game logic, stages, puzzles, UI, settings.
- `scenes.js`: the 100 world backgrounds (landscapes, sky and weather).
- `pace.js`: speed waves, twist events and clutch time.

## Leaderboard
The list shows the players written in `leaderboard.txt` together with the scores saved in the browser. A static site cannot write to a file, so to add a player to the shared list, add a line to `leaderboard.txt` in the repo (`name,stages cleared,stars`) and push. A live shared board needs a database.

Progress and settings are saved in the browser (localStorage). Plain HTML, CSS and JavaScript, so there is no build step.

## Run locally
Run `python -m http.server` and visit http://localhost:8000.

## Deploy
Import this repo in Vercel with the **Other** framework preset. Leave the build command empty.
