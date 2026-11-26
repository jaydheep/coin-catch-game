# Coin Catch

A fast arcade game in the browser. Move the plate with the arrow keys, by dragging, or with the on-screen buttons.

- Coin: +1
- Bonus: +5
- Bomb: -2 points and one life

You have 3 lives. Lose all three and the game is over. Every 14 seconds the level goes up, the colours change and things fall faster.

Press **P**, **Space** or the pause button to pause. Resume gives you a 3 second countdown and the game continues where it stopped. Your score goes into the Top 10, which is stored in your browser (localStorage).

Plain HTML, CSS and JavaScript, so there is no build step. The layout adapts to phones, tablets, laptops and large screens.

## Run locally
Open `index.html`, or run `python -m http.server` and visit http://localhost:8000.

## Deploy
Import this repo in Vercel with the **Other** framework preset. Leave the build command empty.

Created by Jaydheep.
