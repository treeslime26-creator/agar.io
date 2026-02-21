const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const massOutput = document.getElementById('mass');
const statusOutput = document.getElementById('status');

const world = {
  width: 3000,
  height: 3000,
};

const mouse = { x: canvas.width / 2, y: canvas.height / 2 };

const player = {
  x: world.width / 2,
  y: world.height / 2,
  mass: 10,
  color: '#34d399',
  alive: true,
};

const pelletCount = 220;
const pellets = Array.from({ length: pelletCount }, () => ({
  x: Math.random() * world.width,
  y: Math.random() * world.height,
  mass: 1 + Math.random() * 2,
  color: '#fbbf24',
}));

const bots = Array.from({ length: 18 }, (_, index) => ({
  x: Math.random() * world.width,
  y: Math.random() * world.height,
  mass: 8 + Math.random() * 35,
  color: `hsl(${(index * 40) % 360}, 80%, 55%)`,
  vx: (Math.random() - 0.5) * 3,
  vy: (Math.random() - 0.5) * 3,
}));

function resetBot(bot) {
  bot.mass = 8 + Math.random() * 35;
  bot.x = Math.random() * world.width;
  bot.y = Math.random() * world.height;
  bot.vx = (Math.random() - 0.5) * 3;
  bot.vy = (Math.random() - 0.5) * 3;
}

function resetGame() {
  player.x = world.width / 2;
  player.y = world.height / 2;
  player.mass = 10;
  player.alive = true;
  statusOutput.textContent = 'Alive';

  for (const pellet of pellets) {
    pellet.x = Math.random() * world.width;
    pellet.y = Math.random() * world.height;
    pellet.mass = 1 + Math.random() * 2;
  }

  for (const bot of bots) {
    resetBot(bot);
  }
}

canvas.addEventListener('mousemove', (event) => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = event.clientX - rect.left;
  mouse.y = event.clientY - rect.top;
});

window.addEventListener('keydown', (event) => {
  if (event.key.toLowerCase() === 'r') {
    resetGame();
  }
});

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

function updatePlayer(dt) {
  if (!player.alive) {
    return;
  }

  const targetX = player.x + (mouse.x - canvas.width / 2);
  const targetY = player.y + (mouse.y - canvas.height / 2);

  const dx = targetX - player.x;
  const dy = targetY - player.y;
  const length = Math.hypot(dx, dy) || 1;
  const speed = 220 / Math.sqrt(player.mass);

  player.x += (dx / length) * speed * dt;
  player.y += (dy / length) * speed * dt;

  const radius = radiusFromMass(player.mass);
  player.x = clamp(player.x, radius, world.width - radius);
  player.y = clamp(player.y, radius, world.height - radius);
}

function eatPellets() {
  const playerRadius = radiusFromMass(player.mass);

  for (const pellet of pellets) {
    if (distance(player, pellet) < playerRadius) {
      player.mass += pellet.mass * 0.45;
      pellet.x = Math.random() * world.width;
      pellet.y = Math.random() * world.height;
      pellet.mass = 1 + Math.random() * 2;
    }
  }
}

function updateBots(dt) {
  for (const bot of bots) {
    if (Math.random() < 0.02) {
      bot.vx += (Math.random() - 0.5) * 0.8;
      bot.vy += (Math.random() - 0.5) * 0.8;
    }

    const maxSpeed = 170 / Math.sqrt(bot.mass);
    const velocityLength = Math.hypot(bot.vx, bot.vy) || 1;
    bot.vx = (bot.vx / velocityLength) * maxSpeed;
    bot.vy = (bot.vy / velocityLength) * maxSpeed;

    bot.x += bot.vx * dt;
    bot.y += bot.vy * dt;

    const radius = radiusFromMass(bot.mass);
    if (bot.x < radius || bot.x > world.width - radius) {
      bot.vx *= -1;
    }
    if (bot.y < radius || bot.y > world.height - radius) {
      bot.vy *= -1;
    }
    bot.x = clamp(bot.x, radius, world.width - radius);
    bot.y = clamp(bot.y, radius, world.height - radius);

    for (const pellet of pellets) {
      if (distance(bot, pellet) < radius) {
        bot.mass += pellet.mass * 0.35;
        pellet.x = Math.random() * world.width;
        pellet.y = Math.random() * world.height;
      }
    }
  }
}

function resolveCellCollisions() {
  if (!player.alive) {
    return;
  }

  const playerRadius = radiusFromMass(player.mass);

  for (const bot of bots) {
    const botRadius = radiusFromMass(bot.mass);
    const d = distance(player, bot);

    if (d < Math.max(playerRadius, botRadius) * 0.85) {
      if (player.mass > bot.mass * 1.1) {
        player.mass += bot.mass * 0.5;
        resetBot(bot);
      } else if (bot.mass > player.mass * 1.1) {
        player.alive = false;
        statusOutput.textContent = 'Eaten — press R to restart';
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

function drawCell(cell, cameraX, cameraY) {
  const screenX = cell.x - cameraX;
  const screenY = cell.y - cameraY;
  const radius = radiusFromMass(cell.mass);

  ctx.beginPath();
  ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
  ctx.fillStyle = cell.color;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.stroke();
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const cameraX = clamp(player.x - canvas.width / 2, 0, world.width - canvas.width);
  const cameraY = clamp(player.y - canvas.height / 2, 0, world.height - canvas.height);

  drawGrid(cameraX, cameraY);

  for (const pellet of pellets) {
    drawCell(pellet, cameraX, cameraY);
  }

  for (const bot of bots) {
    drawCell(bot, cameraX, cameraY);
  }

  drawCell(player, cameraX, cameraY);

  massOutput.textContent = player.mass.toFixed(1);
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

requestAnimationFrame(tick);
