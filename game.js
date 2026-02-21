const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const massOutput = document.getElementById('mass');
const statusOutput = document.getElementById('status');

const world = { width: 3200, height: 3200 };
const pelletCount = 240;
const mouse = { x: canvas.width / 2, y: canvas.height / 2 };

const player = {
  color: '#34d399',
  alive: true,
  cells: [],
};

const pellets = Array.from({ length: pelletCount }, createPellet);
const bots = Array.from({ length: 20 }, (_, index) => createBot(index));

function createPlayerCell(x = world.width / 2, y = world.height / 2, mass = 18) {
  return { x, y, mass, vx: 0, vy: 0, mergeCooldown: 0 };
}

function createPellet() {
  return {
    x: Math.random() * world.width,
    y: Math.random() * world.height,
    mass: 1 + Math.random() * 1.8,
    color: '#fbbf24',
  };
}

function createBot(index) {
  return {
    x: Math.random() * world.width,
    y: Math.random() * world.height,
    mass: 10 + Math.random() * 36,
    color: `hsl(${(index * 37) % 360}, 80%, 56%)`,
    vx: (Math.random() - 0.5) * 3,
    vy: (Math.random() - 0.5) * 3,
  };
}

function radiusFromMass(mass) {
  return Math.sqrt(mass) * 4;
}

function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function totalPlayerMass() {
  return player.cells.reduce((sum, cell) => sum + cell.mass, 0);
}

function camera() {
  if (!player.cells.length) {
    return { x: 0, y: 0 };
  }
  const avgX = player.cells.reduce((sum, c) => sum + c.x, 0) / player.cells.length;
  const avgY = player.cells.reduce((sum, c) => sum + c.y, 0) / player.cells.length;
  return {
    x: clamp(avgX - canvas.width / 2, 0, world.width - canvas.width),
    y: clamp(avgY - canvas.height / 2, 0, world.height - canvas.height),
  };
}

function resetBot(bot) {
  bot.mass = 10 + Math.random() * 28;
  bot.x = Math.random() * world.width;
  bot.y = Math.random() * world.height;
  bot.vx = (Math.random() - 0.5) * 3;
  bot.vy = (Math.random() - 0.5) * 3;
}

function resetGame() {
  player.alive = true;
  player.cells = [createPlayerCell()];
  statusOutput.textContent = 'Alive';

  for (const pellet of pellets) {
    Object.assign(pellet, createPellet());
  }

  for (const bot of bots) {
    resetBot(bot);
  }
}

function worldTargetPoint() {
  const cam = camera();
  return {
    x: clamp(cam.x + mouse.x, 0, world.width),
    y: clamp(cam.y + mouse.y, 0, world.height),
  };
}

function splitCells() {
  if (!player.alive) return;

  const target = worldTargetPoint();
  const spawned = [];

  for (const cell of player.cells) {
    if (cell.mass < 24) continue;

    const newMass = cell.mass / 2;
    cell.mass = newMass;

    const dx = target.x - cell.x;
    const dy = target.y - cell.y;
    const length = Math.hypot(dx, dy) || 1;
    const burst = 420 / Math.sqrt(newMass);

    spawned.push({
      x: cell.x + (dx / length) * (radiusFromMass(newMass) * 1.5),
      y: cell.y + (dy / length) * (radiusFromMass(newMass) * 1.5),
      mass: newMass,
      vx: (dx / length) * burst,
      vy: (dy / length) * burst,
      mergeCooldown: 4,
    });

    cell.mergeCooldown = 4;
  }

  player.cells.push(...spawned);
  if (player.cells.length > 16) {
    player.cells = player.cells.slice(0, 16);
  }
}

function feedMass() {
  if (!player.alive) return;

  const target = worldTargetPoint();
  const donor = player.cells.find((cell) => cell.mass > 20);
  if (!donor) return;

  donor.mass -= 2.4;

  const dx = target.x - donor.x;
  const dy = target.y - donor.y;
  const length = Math.hypot(dx, dy) || 1;

  const pellet = pellets[Math.floor(Math.random() * pellets.length)];
  pellet.mass = 2.2;
  pellet.x = donor.x + (dx / length) * (radiusFromMass(donor.mass) + 14);
  pellet.y = donor.y + (dy / length) * (radiusFromMass(donor.mass) + 14);
}

canvas.addEventListener('mousemove', (event) => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = event.clientX - rect.left;
  mouse.y = event.clientY - rect.top;
});

window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (key === 'r') resetGame();
  if (key === ' ') {
    event.preventDefault();
    splitCells();
  }
  if (key === 'w') feedMass();
});

function updatePlayer(dt) {
  if (!player.alive) return;

  const target = worldTargetPoint();

  for (const cell of player.cells) {
    const dx = target.x - cell.x;
    const dy = target.y - cell.y;
    const length = Math.hypot(dx, dy) || 1;
    const speed = 420 / (12 + Math.sqrt(cell.mass));

    cell.vx += (dx / length) * speed * 2.2 * dt;
    cell.vy += (dy / length) * speed * 2.2 * dt;

    cell.vx *= 0.88;
    cell.vy *= 0.88;

    cell.x += cell.vx * dt * 60;
    cell.y += cell.vy * dt * 60;

    const radius = radiusFromMass(cell.mass);
    cell.x = clamp(cell.x, radius, world.width - radius);
    cell.y = clamp(cell.y, radius, world.height - radius);
    cell.mergeCooldown = Math.max(0, cell.mergeCooldown - dt);
  }

  mergePlayerCells();
}

function mergePlayerCells() {
  for (let i = 0; i < player.cells.length; i += 1) {
    for (let j = i + 1; j < player.cells.length; j += 1) {
      const a = player.cells[i];
      const b = player.cells[j];
      if (a.mergeCooldown > 0 || b.mergeCooldown > 0) continue;

      const overlap = distance(a, b) < (radiusFromMass(a.mass) + radiusFromMass(b.mass)) * 0.6;
      if (!overlap) continue;

      a.mass += b.mass;
      player.cells.splice(j, 1);
      j -= 1;
    }
  }
}

function eatPellets() {
  for (const cell of player.cells) {
    const radius = radiusFromMass(cell.mass);
    for (const pellet of pellets) {
      if (distance(cell, pellet) < radius) {
        cell.mass += pellet.mass * 0.55;
        Object.assign(pellet, createPellet());
      }
    }
  }
}

function updateBots(dt) {
  for (const bot of bots) {
    if (Math.random() < 0.03) {
      bot.vx += (Math.random() - 0.5) * 1.2;
      bot.vy += (Math.random() - 0.5) * 1.2;
    }

    const maxSpeed = 190 / (10 + Math.sqrt(bot.mass));
    const velocityLength = Math.hypot(bot.vx, bot.vy) || 1;
    bot.vx = (bot.vx / velocityLength) * maxSpeed;
    bot.vy = (bot.vy / velocityLength) * maxSpeed;

    bot.x += bot.vx * dt * 60;
    bot.y += bot.vy * dt * 60;

    const radius = radiusFromMass(bot.mass);
    if (bot.x < radius || bot.x > world.width - radius) bot.vx *= -1;
    if (bot.y < radius || bot.y > world.height - radius) bot.vy *= -1;
    bot.x = clamp(bot.x, radius, world.width - radius);
    bot.y = clamp(bot.y, radius, world.height - radius);

    for (const pellet of pellets) {
      if (distance(bot, pellet) < radius) {
        bot.mass += pellet.mass * 0.35;
        Object.assign(pellet, createPellet());
      }
    }
  }
}

function resolveCellCollisions() {
  if (!player.alive) return;

  for (const cell of player.cells) {
    for (const bot of bots) {
      const d = distance(cell, bot);
      if (d >= Math.max(radiusFromMass(cell.mass), radiusFromMass(bot.mass)) * 0.88) continue;

      if (cell.mass > bot.mass * 1.12) {
        cell.mass += bot.mass * 0.5;
        resetBot(bot);
      } else if (bot.mass > cell.mass * 1.12) {
        const idx = player.cells.indexOf(cell);
        if (idx >= 0) player.cells.splice(idx, 1);
        if (!player.cells.length) {
          player.alive = false;
          statusOutput.textContent = 'Eaten — press R to restart';
          return;
        }
      }
    }
  }
}

function drawGrid(cameraX, cameraY) {
  const step = 80;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.lineWidth = 1;

  const startX = -((cameraX % step) + step);
  const startY = -((cameraY % step) + step);

  for (let x = startX; x < canvas.width + step; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  for (let y = startY; y < canvas.height + step; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
}

function drawCell(cell, cameraX, cameraY, color) {
  const screenX = cell.x - cameraX;
  const screenY = cell.y - cameraY;
  const radius = radiusFromMass(cell.mass);

  ctx.beginPath();
  ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.stroke();
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const cam = camera();

  drawGrid(cam.x, cam.y);

  for (const pellet of pellets) {
    drawCell(pellet, cam.x, cam.y, pellet.color);
  }

  for (const bot of bots) {
    drawCell(bot, cam.x, cam.y, bot.color);
  }

  for (const cell of player.cells) {
    drawCell(cell, cam.x, cam.y, player.color);
  }

  massOutput.textContent = totalPlayerMass().toFixed(1);
}

let previous = performance.now();

function tick(now) {
  const dt = Math.min((now - previous) / 1000, 0.033);
  previous = now;

  updatePlayer(dt);
  eatPellets();
  updateBots(dt);
  resolveCellCollisions();
  render();

  requestAnimationFrame(tick);
}

resetGame();
requestAnimationFrame(tick);
