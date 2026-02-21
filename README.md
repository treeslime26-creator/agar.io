# Agar.io Mini Clone

A lightweight browser-based Agar.io-style prototype built with HTML5 Canvas and vanilla JavaScript.

## Features
- Mouse-steered player cell with mass-based movement speed.
- Consumable pellets spread across a larger world.
- AI bot cells that roam, collect pellets, and can consume/be consumed based on mass.
- Camera-follow system with a scrolling world grid.

## Run locally
Use any static file server from this directory, for example:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000> in your browser.


## How to play
1. Start the game server: `python3 -m http.server 8000`.
2. Open `http://localhost:8000` in your browser.
3. Move your **mouse** to steer your cell.
4. Eat yellow pellets and smaller bots to gain mass.
5. Avoid larger bots, or you'll be eaten.
6. If you die, press **R** to restart instantly.
