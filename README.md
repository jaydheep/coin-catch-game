# Coin Catch

An arcade game with **1000 stages**. Every stage has its own mission, and every 10 stages you enter a new world with a new colour theme and a new weather effect. Stage 10 of each world is a boss stage.

## Missions
Score points, catch coins, collect gems, survive, let bombs fall past, chain catches, grab power-ups, score with no hit, catch one coin colour, and boss stages. Missions repeat in a cycle of 10, and targets and speed grow as the stage number goes up.

## Rules
- Coin +1, gem +5, bomb -2 and one life. You have 3 lives per stage.
- Combo: every 5 catches in a row raises the score multiplier, up to x5. Missing a coin resets it.
- Power-ups: S shield, M magnet, T slow motion, x2 double points, W wide plate.
- Clear a stage with 3 lives for 3 stars. Replay to improve your stars.

## Controls
Drag on the screen, arrow keys or A / D, or the on-screen buttons on touch devices. P, Esc or Space pauses. Resume gives a 3 second countdown.

Progress, stars and the leaderboard are saved in the browser (localStorage). The page is locked to one screen, so it does not scroll on phones.

Plain HTML, CSS and JavaScript, so there is no build step.

## Run locally
Open `index.html`, or run `python -m http.server` and visit http://localhost:8000.

## Deploy
Import this repo in Vercel with the **Other** framework preset. Leave the build command empty.

Created by Jaydheep.
