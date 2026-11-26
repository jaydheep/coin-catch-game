# Coin Catch

An arcade game with **1000 stages** that mixes reflexes with brain puzzles. Every 10 stages you enter a new world with its own colours and weather. Stage 10 of each world is a boss stage.

## Stage types (repeat every 10 stages)
- Action: score points, collect gems, survive, let bombs fall past.
- Brain: **sum** (catch numbers that add up to an exact total), **rule** (catch only numbers that match a rule such as even, prime or multiples of 3), **colour order** (catch coins in a shown order), **maths** (catch the answer), **gauntlet** (puzzle type changes every round) and the **boss** (mixed puzzles while bombs fall).
- Wrong catches cost a life from stage 20. From stage 100 the rule changes during the stage, and from stage 200 the colour order is hidden after a few seconds.

## Rules
- 3 lives per stage. Clear a stage with 3 lives for 3 stars.
- Power-ups: S shield, M magnet, T slow motion, x2 double points, W wide plate.
- When the mission is complete, the stage stops and nothing more falls.

## Controls
Drag on the screen, or use the arrow keys / A and D. P, Esc or Space pauses. The pause button only shows while playing.

## Leaderboard
The list shows the players written in `leaderboard.txt` together with the scores saved in the browser. A static site cannot write to a file, so to add a player to the shared list, add a line to `leaderboard.txt` in the repo (`name,stages cleared,stars`) and push. A live shared board needs a database.

Progress is saved in the browser (localStorage). Plain HTML, CSS and JavaScript, so there is no build step.

## Run locally
Run `python -m http.server` and visit http://localhost:8000.

## Deploy
Import this repo in Vercel with the **Other** framework preset. Leave the build command empty.

Created by Jaydheep.
