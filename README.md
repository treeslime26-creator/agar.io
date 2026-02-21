# Agar.io Mini Clone

A lightweight browser-based Agar.io-style prototype built with HTML5 Canvas and vanilla JavaScript.

## Features
- Mouse tracking fixed to world-space target movement.
- Faster player motion with smoother steering.
- Split mechanic with `Space` (cell divides and lunges forward).
- Feed mechanic with `W` (ejects mass in front of a cell).
- AI bot cells that roam, collect pellets, and can consume/be consumed based on mass.
- Camera-follow system with a scrolling world grid.

## Run locally
Use any static file server from this directory, for example:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000> in your browser.

## Windows quick start
If you're on Windows, double-click `run-game.bat` (or run it from Command Prompt).
It starts the local server on port 8000 and opens the game automatically.

## How to play
1. Start the game server (or use `run-game.bat` on Windows).
2. Open `http://localhost:8000` in your browser.
3. Move your **mouse** to steer your cells.
4. Press **Space** to split (requires enough mass).
5. Press **W** to feed/eject mass.
6. Eat pellets and smaller bots, avoid bigger bots.
7. If you die, press **R** to restart instantly.
