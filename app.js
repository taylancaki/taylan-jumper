const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const scoreEl = document.querySelector("#score");
const bestEl = document.querySelector("#best");
const overlay = document.querySelector("#overlay");
const statusEl = document.querySelector("#status");
const playButton = document.querySelector("#playButton");
const jumpButton = document.querySelector("#jumpButton");
const resetButton = document.querySelector("#resetButton");

const STORAGE_KEY = "taylan-jumper-best";
const groundY = 324;
const gravity = 0.72;
const jumpPower = -15.8;

let bestScore = Number(localStorage.getItem(STORAGE_KEY) || 0);
let state = createState();
let lastFrame = performance.now();
let rafId = 0;

function createState() {
  return {
    running: false,
    gameOver: false,
    score: 0,
    speed: 6.4,
    distance: 0,
    spawnTimer: 85,
    cloudTimer: 0,
    dustTimer: 0,
    player: {
      x: 108,
      y: groundY - 74,
      width: 58,
      height: 74,
      velocityY: 0,
      grounded: true,
      ducking: false,
      step: 0,
    },
    obstacles: [],
    clouds: [
      { x: 180, y: 70, speed: 0.35, scale: 1.1 },
      { x: 560, y: 112, speed: 0.28, scale: 0.85 },
      { x: 790, y: 54, speed: 0.42, scale: 0.72 },
    ],
    dust: [],
  };
}

function padScore(value) {
  return Math.floor(value).toString().padStart(5, "0");
}

function syncScores() {
  scoreEl.textContent = padScore(state.score);
  bestEl.textContent = padScore(bestScore);
}

function startGame() {
  state = createState();
  state.running = true;
  overlay.classList.add("hidden");
  playButton.textContent = "Restart";
  statusEl.textContent = "Jump!";
  lastFrame = performance.now();
}

function endGame() {
  state.running = false;
  state.gameOver = true;
  bestScore = Math.max(bestScore, Math.floor(state.score));
  localStorage.setItem(STORAGE_KEY, String(bestScore));
  statusEl.textContent = "Game Over";
  playButton.textContent = "Play Again";
  overlay.classList.remove("hidden");
  syncScores();
}

function jump() {
  if (!state.running) {
    startGame();
    return;
  }

  const player = state.player;
  if (player.grounded) {
    player.velocityY = jumpPower;
    player.grounded = false;
    player.ducking = false;
  }
}

function resetGame() {
  state = createState();
  overlay.classList.remove("hidden");
  statusEl.textContent = "Ready";
  playButton.textContent = "Start Game";
  syncScores();
}

function spawnObstacle() {
  const roll = Math.random();
  const width = roll > 0.62 ? 34 : roll > 0.28 ? 48 : 62;
  const height = roll > 0.62 ? 72 : roll > 0.28 ? 48 : 36;
  state.obstacles.push({
    x: canvas.width + 20,
    y: groundY - height,
    width,
    height,
    type: height > 60 ? "sign" : height > 44 ? "block" : "low",
  });
  state.spawnTimer = Math.max(42, 102 - state.speed * 5 + Math.random() * 44);
}

function spawnDust() {
  state.dust.push({
    x: state.player.x + 20,
    y: groundY + 4,
    radius: 3 + Math.random() * 4,
    life: 28,
  });
}

function update(delta) {
  if (!state.running) return;

  const step = Math.min(delta / 16.67, 2);
  const player = state.player;

  state.distance += state.speed * step;
  state.score += 0.16 * state.speed * step;
  state.speed = Math.min(15.5, state.speed + 0.0024 * step);
  state.spawnTimer -= step;
  state.cloudTimer -= step;
  state.dustTimer -= step;

  player.velocityY += gravity * step;
  player.y += player.velocityY * step;
  player.step += step * state.speed;

  if (player.y >= groundY - player.height) {
    player.y = groundY - player.height;
    player.velocityY = 0;
    player.grounded = true;
  }

  if (state.spawnTimer <= 0) spawnObstacle();
  if (state.dustTimer <= 0 && player.grounded) {
    spawnDust();
    state.dustTimer = 7;
  }

  state.obstacles.forEach((obstacle) => {
    obstacle.x -= state.speed * step;
  });
  state.obstacles = state.obstacles.filter((obstacle) => obstacle.x + obstacle.width > -30);

  state.clouds.forEach((cloud) => {
    cloud.x -= cloud.speed * step;
    if (cloud.x < -130) {
      cloud.x = canvas.width + Math.random() * 180;
      cloud.y = 44 + Math.random() * 84;
      cloud.scale = 0.7 + Math.random() * 0.55;
    }
  });

  state.dust.forEach((dust) => {
    dust.x -= state.speed * 0.65 * step;
    dust.life -= step;
    dust.radius += 0.08 * step;
  });
  state.dust = state.dust.filter((dust) => dust.life > 0);

  if (hasCollision()) endGame();
  syncScores();
}

function hasCollision() {
  const playerBox = {
    x: state.player.x + 9,
    y: state.player.y + 6,
    width: state.player.width - 18,
    height: state.player.height - 10,
  };

  return state.obstacles.some((obstacle) => {
    const obstacleBox = {
      x: obstacle.x + 5,
      y: obstacle.y + 5,
      width: obstacle.width - 10,
      height: obstacle.height - 6,
    };

    return (
      playerBox.x < obstacleBox.x + obstacleBox.width &&
      playerBox.x + playerBox.width > obstacleBox.x &&
      playerBox.y < obstacleBox.y + obstacleBox.height &&
      playerBox.y + playerBox.height > obstacleBox.y
    );
  });
}

function drawBackground() {
  ctx.fillStyle = "#f8f1df";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const sky = ctx.createLinearGradient(0, 0, 0, groundY);
  sky.addColorStop(0, "#a9d8e6");
  sky.addColorStop(0.7, "#f5dfa8");
  sky.addColorStop(1, "#f8f1df");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, groundY);

  ctx.fillStyle = "rgba(68, 91, 88, 0.18)";
  drawHill(0, groundY - 48, 230, 64);
  drawHill(320, groundY - 62, 320, 82);
  drawHill(680, groundY - 42, 260, 56);

  state.clouds.forEach(drawCloud);

  ctx.fillStyle = "#30261d";
  ctx.fillRect(0, groundY, canvas.width, 4);

  ctx.strokeStyle = "rgba(48, 38, 29, 0.24)";
  ctx.lineWidth = 2;
  for (let x = -(state.distance % 46); x < canvas.width; x += 46) {
    ctx.beginPath();
    ctx.moveTo(x, groundY + 28);
    ctx.lineTo(x + 24, groundY + 28);
    ctx.stroke();
  }
}

function drawHill(x, y, width, height) {
  ctx.beginPath();
  ctx.ellipse(x + width / 2, y + height, width / 2, height, 0, Math.PI, 0);
  ctx.fill();
}

function drawCloud(cloud) {
  ctx.save();
  ctx.translate(cloud.x, cloud.y);
  ctx.scale(cloud.scale, cloud.scale);
  ctx.fillStyle = "rgba(255, 255, 255, 0.78)";
  ctx.beginPath();
  ctx.arc(0, 14, 18, 0, Math.PI * 2);
  ctx.arc(24, 4, 25, 0, Math.PI * 2);
  ctx.arc(55, 16, 18, 0, Math.PI * 2);
  ctx.fillRect(0, 14, 58, 22);
  ctx.fill();
  ctx.restore();
}

function drawPlayer() {
  const player = state.player;
  const x = player.x;
  const y = player.y;
  const runBob = player.grounded ? Math.sin(player.step * 0.32) * 2 : 0;

  ctx.save();
  ctx.translate(x, y + runBob);

  ctx.fillStyle = "#1c1a17";
  roundRect(9, 18, 41, 48, 12);
  ctx.fill();

  ctx.fillStyle = "#f0b47b";
  roundRect(16, 0, 32, 28, 10);
  ctx.fill();

  ctx.fillStyle = "#202124";
  ctx.fillRect(23, 8, 5, 5);
  ctx.fillRect(39, 8, 5, 5);

  ctx.fillStyle = "#e85f42";
  ctx.fillRect(17, 30, 34, 20);
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 12px system-ui";
  ctx.fillText("TJ", 25, 45);

  ctx.strokeStyle = "#1c1a17";
  ctx.lineWidth = 7;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(16, 64);
  ctx.lineTo(10 + Math.sin(player.step * 0.22) * 8, 75);
  ctx.moveTo(42, 64);
  ctx.lineTo(50 + Math.cos(player.step * 0.22) * 8, 75);
  ctx.stroke();

  ctx.restore();
}

function drawObstacles() {
  state.obstacles.forEach((obstacle) => {
    ctx.save();
    ctx.translate(obstacle.x, obstacle.y);

    if (obstacle.type === "sign") {
      ctx.fillStyle = "#425c4d";
      roundRect(4, 0, obstacle.width - 8, obstacle.height - 16, 5);
      ctx.fill();
      ctx.fillStyle = "#24352c";
      ctx.fillRect(obstacle.width / 2 - 4, obstacle.height - 16, 8, 16);
      ctx.strokeStyle = "#f6c75b";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(14, 20);
      ctx.lineTo(obstacle.width - 14, 20);
      ctx.stroke();
    } else if (obstacle.type === "block") {
      ctx.fillStyle = "#94512d";
      roundRect(0, 4, obstacle.width, obstacle.height - 4, 7);
      ctx.fill();
      ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
      ctx.fillRect(8, 12, obstacle.width - 16, 5);
    } else {
      ctx.fillStyle = "#6f744f";
      roundRect(0, 8, obstacle.width, obstacle.height - 8, 14);
      ctx.fill();
      ctx.fillStyle = "#4d5236";
      ctx.fillRect(8, 0, 10, 16);
      ctx.fillRect(obstacle.width - 18, 0, 10, 16);
    }

    ctx.restore();
  });
}

function drawDust() {
  state.dust.forEach((dust) => {
    ctx.globalAlpha = Math.max(0, dust.life / 28) * 0.35;
    ctx.fillStyle = "#30261d";
    ctx.beginPath();
    ctx.arc(dust.x, dust.y, dust.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  });
}

function drawIdleText() {
  if (state.running) return;

  ctx.fillStyle = "rgba(21, 19, 15, 0.82)";
  ctx.font = "800 22px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("Press Space, tap, or click Jump", canvas.width / 2, 388);
  ctx.textAlign = "start";
}

function roundRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function render() {
  drawBackground();
  drawDust();
  drawObstacles();
  drawPlayer();
  drawIdleText();
}

function loop(now) {
  const delta = now - lastFrame;
  lastFrame = now;
  update(delta);
  render();
  rafId = requestAnimationFrame(loop);
}

function handleKeydown(event) {
  if (event.code === "Space" || event.code === "ArrowUp") {
    event.preventDefault();
    jump();
  }

  if (event.code === "Enter" && !state.running) startGame();
}

playButton.addEventListener("click", startGame);
jumpButton.addEventListener("click", jump);
resetButton.addEventListener("click", resetGame);
canvas.addEventListener("pointerdown", jump);
window.addEventListener("keydown", handleKeydown);
window.addEventListener("blur", () => {
  if (state.running) {
    state.running = false;
    statusEl.textContent = "Paused";
    playButton.textContent = "Resume";
    overlay.classList.remove("hidden");
  }
});

syncScores();
render();
cancelAnimationFrame(rafId);
rafId = requestAnimationFrame(loop);
