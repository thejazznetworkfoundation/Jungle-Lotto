const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const scoreNode = document.getElementById("score");
const livesNode = document.getElementById("lives");
const timerNode = document.getElementById("combo");
const sceneNode = document.getElementById("level");
const statusNode = document.getElementById("status");
const heroTargetLabel = document.getElementById("hero-target-label");
const heroTargetCopy = document.getElementById("hero-target-copy");
const sidebarTarget = document.getElementById("sidebar-target");
const sidebarCopy = document.getElementById("sidebar-copy");
const feedNode = document.getElementById("feed");

const startOverlay = document.getElementById("start-overlay");
const pauseOverlay = document.getElementById("pause-overlay");
const gameOverOverlay = document.getElementById("game-over-overlay");
const finalScoreNode = document.getElementById("final-score");
const bestScoreNode = document.getElementById("best-score");
const gameOverTitle = document.getElementById("game-over-title");
const gameOverCopy = document.getElementById("game-over-copy");

const startButton = document.getElementById("start-button");
const resumeButton = document.getElementById("resume-button");
const restartButton = document.getElementById("restart-button");
const pauseButton = document.getElementById("pause-button");
const jumpButton = document.getElementById("jump-button");
const useButton = document.getElementById("use-button");

const WORLD = {
  width: 160,
  height: 192,
  scale: 4,
  offsetX: 40,
  offsetY: 72,
  groundTop: 106,
  groundY: 92,
  tunnelTop: 132,
  tunnelY: 158,
  ladderX: 80,
  xMin: 8,
  xMax: 148,
};

const START_TIME = 20 * 60;
const RAND_SEED = 0xc4;
const HIGH_SCORE_KEY = "pillfall-harry-high-score";
const BRAND_NAME = "LottoMind";
const TUNING = {
  jumpVelocity: -126,
  gravity: 220,
  ladderRange: 12,
  lianaCatchX: 13,
  lianaCatchY: 18,
  pitInset: 2,
  quicksandMovingRate: 0.32,
  quicksandStandingRate: 0.62,
  quicksandThreshold: 1.55,
  logClearance: 13,
  fireClearance: 16,
  cobraClearance: 18,
  scorpionClearance: 14,
  treasureMagnetX: 12,
  treasureMagnetY: 16,
};

const sceneNames = [
  "Single Hole",
  "Triple Hole",
  "Tar Pit",
  "Blue Pit",
  "Crocodile Pool",
  "Treasure Sand",
  "Black Quicksand",
  "Blue Quicksand",
];

const sceneHints = [
  "A ladder scene with one hole and an underground route.",
  "Three holes and a ladder. The tunnel can skip scenes fast.",
  "The liana is your best line across the pit.",
  "Blue water pit with a swinging line overhead.",
  "Four crocs animate their bite windows across the pool.",
  "Treasure rests beside unstable sand.",
  "Black quicksand widens and punishes slow movement.",
  "Blue quicksand looks calmer than it is.",
];

const lianaTable = [false, false, true, true, true, false, true, false];
const holeBounds = {
  0: [[72, 79]],
  1: [[44, 55], [72, 79], [96, 107]],
  2: [[44, 107]],
  3: [[44, 107]],
  4: [[44, 55], [64, 71], [80, 87], [96, 107]],
};

const objectBlueprints = [
  { label: "Rolling Log", kind: "log", moving: true, offsets: [0] },
  { label: "Twin Logs", kind: "log", moving: true, offsets: [0, -26] },
  { label: "Wide Logs", kind: "log", moving: true, offsets: [0, -36] },
  { label: "Triple Logs", kind: "log", moving: true, offsets: [0, -28, -56] },
  { label: "Stationary Log", kind: "log", moving: false, offsets: [0] },
  { label: "Triple Stationary Logs", kind: "log", moving: false, offsets: [0, -28, -56] },
  { label: "Fire Pit", kind: "fire", moving: false, offsets: [0] },
  { label: "Cobra", kind: "cobra", moving: false, offsets: [0] },
];

const treasureBlueprints = [
  { label: "Money Bag", points: 2000, crop: "chest" },
  { label: "Silver Bar", points: 3000, crop: "chest" },
  { label: "Gold Bar", points: 4000, crop: "chest" },
  { label: "Ring", points: 5000, crop: "heart" },
];

const spriteCrops = {
  roster: {
    path: "assets/custom-roster.png",
    hero: { x: 92, y: 102, width: 238, height: 318, drawWidth: 46, drawHeight: 62, anchorX: 11, anchorY: 30 },
    croc: { x: 448, y: 146, width: 500, height: 254, drawWidth: 66, drawHeight: 36, anchorX: 14, anchorY: 15 },
    snake: { x: 78, y: 570, width: 350, height: 338, drawWidth: 56, drawHeight: 64, anchorX: 12, anchorY: 25 },
    scorpion: { x: 556, y: 632, width: 354, height: 214, drawWidth: 60, drawHeight: 36, anchorX: 12, anchorY: 11 },
  },
  reference: {
    path: "assets/reference-collage.webp",
    chest: { x: 596, y: 76, width: 178, height: 178 },
    potion: { x: 804, y: 76, width: 120, height: 152 },
    heart: { x: 766, y: 380, width: 180, height: 170 },
  },
};

const assets = {
  roster: new Image(),
  reference: new Image(),
};

assets.roster.src = spriteCrops.roster.path;
assets.reference.src = spriteCrops.reference.path;

const state = {
  running: false,
  paused: false,
  gameOver: false,
  score: 0,
  lives: 3,
  timer: START_TIME,
  bestScore: readBestScore(),
  sceneSeed: RAND_SEED,
  sceneIndex: 1,
  scene: null,
  sceneObjects: [],
  sceneFeed: [],
  collectedTreasures: new Set(),
  lastTime: 0,
  elapsed: 0,
  animationTick: 0,
  sinkMeter: 0,
  pendingMessage: "",
  scorpionX: 88,
  scorpionDir: 1,
  input: {
    left: false,
    right: false,
    jump: false,
    use: false,
  },
  player: {
    x: 20,
    y: WORLD.groundY,
    vx: 0,
    vy: 0,
    facing: 1,
    underground: false,
    mode: "ground",
    invulnerability: 0,
    stumbleTimer: 0,
    transitionProgress: 0,
    transitionFromY: WORLD.groundY,
    transitionToY: WORLD.groundY,
  },
};

function readBestScore() {
  const stored = window.localStorage.getItem(HIGH_SCORE_KEY);
  const value = Number.parseInt(stored ?? "0", 10);
  return Number.isFinite(value) ? value : 0;
}

function saveBestScore(score) {
  window.localStorage.setItem(HIGH_SCORE_KEY, String(score));
}

function worldX(value) {
  return WORLD.offsetX + value * WORLD.scale;
}

function worldY(value) {
  return WORLD.offsetY + value * WORLD.scale;
}

function bit(value, index) {
  return (value >> index) & 1;
}

function leftRandom(seed) {
  const newBit = bit(seed, 4) ^ bit(seed, 5) ^ bit(seed, 6) ^ bit(seed, 0);
  return ((seed >> 1) | (newBit << 7)) & 0xff;
}

function rightRandom(seed) {
  const newBit = bit(seed, 3) ^ bit(seed, 4) ^ bit(seed, 5) ^ bit(seed, 7);
  return ((seed << 1) & 0xff) | newBit;
}

function formatTime(totalSeconds) {
  const whole = Math.max(0, Math.ceil(totalSeconds));
  const minutes = Math.floor(whole / 60);
  const seconds = whole % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function addFeed(title, copy) {
  state.sceneFeed.unshift({ title, copy });
  state.sceneFeed = state.sceneFeed.slice(0, 5);
  feedNode.innerHTML = "";

  state.sceneFeed.forEach((item) => {
    const row = document.createElement("div");
    row.className = "feed__item";
    row.innerHTML = `<strong>${item.title}</strong><span>${item.copy}</span>`;
    feedNode.appendChild(row);
  });
}

function setStatus(text) {
  statusNode.textContent = text;
}

function syncHud() {
  scoreNode.textContent = String(state.score);
  livesNode.textContent = String(state.lives);
  timerNode.textContent = formatTime(state.timer);
  sceneNode.textContent = `${String(((state.sceneIndex - 1) % 255) + 1).padStart(3, "0")}`;
}

function currentTreasureKey(seed, objectType) {
  return `${(seed >> 6) & 0x03}-${objectType & 0x03}`;
}

function sceneGradient(sceneType) {
  const gradients = [
    "linear-gradient(135deg, #1cb2b0, #22595f)",
    "linear-gradient(135deg, #f6c65b, #d07926)",
    "linear-gradient(135deg, #5f42b9, #123a67)",
    "linear-gradient(135deg, #37a5eb, #0a466f)",
    "linear-gradient(135deg, #51b66c, #0f3f46)",
    "linear-gradient(135deg, #f58b4b, #6a184c)",
    "linear-gradient(135deg, #111111, #39443f)",
    "linear-gradient(135deg, #3e85d5, #0b344f)",
  ];
  return gradients[sceneType];
}

function buildScene(seed) {
  const sceneType = (seed >> 3) & 0x07;
  const objectType = seed & 0x07;
  const treePat = (seed >> 6) & 0x03;
  const ladder = sceneType < 2;
  const wallSide = (seed & 0x80) !== 0 ? "right" : "left";
  const xPosObject = sceneType === 4 ? 60 : 124;
  const xPosScorpion = ladder ? (wallSide === "right" ? 136 : 17) : 80;
  const treasureKey = currentTreasureKey(seed, objectType);
  const treasure = sceneType === 5 && !state.collectedTreasures.has(treasureKey)
    ? treasureBlueprints[objectType & 0x03]
    : null;

  const objectLabel = treasure
    ? treasure.label
    : sceneType === 4
      ? "Cyber Crocodiles"
      : objectBlueprints[objectType].label;

  return {
    seed,
    sceneType,
    objectType,
    treePat,
    ladder,
    wallSide,
    hasLiana: lianaTable[sceneType],
    xPosObject,
    xPosScorpion,
    treasure,
    treasureKey,
    name: sceneNames[sceneType],
    hint: sceneHints[sceneType],
    objectLabel,
  };
}

function buildSceneObjects(scene) {
  if (scene.sceneType === 4 || scene.treasure || scene.sceneType >= 5) {
    return scene.treasure
      ? [{
          kind: "treasure",
          label: scene.treasure.label,
          points: scene.treasure.points,
          crop: scene.treasure.crop,
          x: 120,
          y: WORLD.groundTop - 16,
          width: 16,
          height: 16,
        }]
      : [];
  }

  const blueprint = objectBlueprints[scene.objectType];
  return blueprint.offsets.map((offset, index) => ({
    kind: blueprint.kind,
    label: blueprint.label,
    moving: blueprint.moving,
    x: scene.xPosObject + offset,
    y: WORLD.groundTop - 10,
    width: blueprint.kind === "cobra" ? 18 : 16,
    height: blueprint.kind === "fire" ? 20 : 12,
    phase: index * 0.9,
  }));
}

function updateScenePanel() {
  const scene = state.scene;
  const card = document.getElementById("hero-target-pill");
  card.style.background = sceneGradient(scene.sceneType);
  heroTargetLabel.textContent = scene.name;
  heroTargetCopy.textContent = `${BRAND_NAME} decode: ${scene.hint} Object: ${scene.objectLabel}. Seed ${scene.seed.toString(16).padStart(2, "0").toUpperCase()}.`;
  sidebarTarget.textContent = scene.name;
  sidebarCopy.textContent = `${scene.hint} Active object: ${scene.objectLabel}. ${BRAND_NAME} tuning is live.`;
}

function enterScene(announce = false) {
  state.scene = buildScene(state.sceneSeed);
  state.sceneObjects = buildSceneObjects(state.scene);
  state.sinkMeter = 0;
  updateScenePanel();
  syncHud();

  if (announce) {
    addFeed("Scene Shift", `${state.scene.name} loaded from seed ${state.scene.seed.toString(16).padStart(2, "0").toUpperCase()}.`);
  }
}

function resetRun() {
  state.running = false;
  state.paused = false;
  state.gameOver = false;
  state.score = 0;
  state.lives = 3;
  state.timer = START_TIME;
  state.sceneSeed = RAND_SEED;
  state.sceneIndex = 1;
  state.collectedTreasures.clear();
  state.sceneFeed = [];
  state.lastTime = 0;
  state.elapsed = 0;
  state.animationTick = 0;
  state.scorpionX = 88;
  state.scorpionDir = 1;
  state.player.x = 20;
  state.player.y = WORLD.groundY;
  state.player.vx = 0;
  state.player.vy = 0;
  state.player.facing = 1;
  state.player.underground = false;
  state.player.mode = "ground";
  state.player.invulnerability = 0;
  state.player.stumbleTimer = 0;
  state.player.transitionProgress = 0;
  state.input.jump = false;
  state.input.use = false;
  enterScene(false);
  setStatus("Press Start to begin");
  addFeed("Run Ready", `${BRAND_NAME} tables loaded. Harry is waiting at the jungle edge.`);
}

function startGame() {
  resetRun();
  state.running = true;
  state.lastTime = performance.now();
  startOverlay.classList.add("hidden");
  pauseOverlay.classList.add("hidden");
  gameOverOverlay.classList.add("hidden");
  setStatus("Run live");
  addFeed("Run Live", `Use jump for hazards and use for ladders or liana release. ${BRAND_NAME} tuning is active.`);
  requestAnimationFrame(loop);
}

function togglePause(forcePause = !state.paused) {
  if (!state.running || state.gameOver) {
    return;
  }

  state.paused = forcePause;
  pauseOverlay.classList.toggle("hidden", !state.paused);

  if (state.paused) {
    setStatus("Paused");
  } else {
    state.lastTime = performance.now();
    setStatus("Run live");
    requestAnimationFrame(loop);
  }
}

function endGame(reason, win = false) {
  state.running = false;
  state.gameOver = true;
  state.bestScore = Math.max(state.bestScore, state.score);
  saveBestScore(state.bestScore);

  finalScoreNode.textContent = String(state.score);
  bestScoreNode.textContent = String(state.bestScore);
  gameOverTitle.textContent = win ? `${BRAND_NAME} run cleared` : "Harry got stopped";
  gameOverCopy.textContent = reason;
  setStatus("Run over");
  addFeed(win ? "Run Complete" : "Run Over", reason);
  gameOverOverlay.classList.remove("hidden");
}

function startJump(speedBoost = 0) {
  if (state.player.mode !== "ground" || state.player.underground) {
    return;
  }

  state.player.mode = "jump";
  state.player.vy = TUNING.jumpVelocity;
  state.player.vx = speedBoost;
}

function beginLadderTransition(targetUnderground) {
  state.player.mode = "ladder";
  state.player.transitionProgress = 0;
  state.player.transitionFromY = state.player.y;
  state.player.transitionToY = targetUnderground ? WORLD.tunnelY : WORLD.groundY;
  state.player.underground = targetUnderground;
  state.player.x = WORLD.ladderX;
  setStatus(targetUnderground ? "Dropping underground" : "Climbing back up");
}

function beginFall(reason) {
  if (state.player.mode === "fall" || state.player.mode === "dead") {
    return;
  }

  state.player.mode = "fall";
  state.player.vx = 0;
  state.player.vy = 42;
  state.pendingMessage = reason;
  setStatus(reason);
}

function loseLife(reason) {
  if (state.player.mode === "dead") {
    return;
  }

  state.player.mode = "dead";
  state.player.vx = 0;
  state.player.vy = -32;
  state.player.stumbleTimer = 1.15;
  state.lives -= 1;
  syncHud();
  setStatus(reason);
  addFeed("Life Lost", reason);

  if (state.lives <= 0) {
    endGame(`The jungle won this ${BRAND_NAME} run. The scene tables are ready for another try.`);
  }
}

function applyLogHit() {
  if (state.player.invulnerability > 0 || state.player.mode === "dead") {
    return;
  }

  state.player.invulnerability = 0.8;
  state.player.stumbleTimer = 0.35;
  state.player.x = Math.max(0, Math.min(WORLD.width, state.player.x + (state.player.facing >= 0 ? -5 : 5)));
  state.score = Math.max(0, state.score - 100);
  syncHud();
  setStatus("Log collision. -100.");
  addFeed("Stumble", "Rolling logs clipped Harry and shaved 100 points.");
}

function collectTreasure(object) {
  state.collectedTreasures.add(state.scene.treasureKey);
  state.score += object.points;
  syncHud();
  state.sceneObjects = [];
  setStatus(`${object.label} collected for ${object.points}`);
  addFeed("Treasure", `Collected ${object.label} for ${object.points} points.`);

  if (state.collectedTreasures.size >= 32) {
    endGame("All 32 treasure states have been cleared. Pillfall Harry wins the jungle.", true);
  }
}

function advanceScene(direction) {
  const stepCount = state.player.underground ? 3 : 1;
  for (let step = 0; step < stepCount; step += 1) {
    state.sceneSeed = direction < 0 ? leftRandom(state.sceneSeed) : rightRandom(state.sceneSeed);
    state.sceneIndex = direction < 0
      ? ((state.sceneIndex - 2 + 255) % 255) + 1
      : (state.sceneIndex % 255) + 1;
  }

  state.player.x = direction < 0 ? WORLD.xMax : WORLD.xMin;
  state.player.y = state.player.underground ? WORLD.tunnelY : WORLD.groundY;
  state.player.vx = 0;
  state.player.vy = 0;
  state.player.mode = "ground";
  enterScene(true);
}

function consumeAction(key) {
  if (!state.input[key]) {
    return false;
  }

  state.input[key] = false;
  return true;
}

function currentHazardBounds() {
  if (state.scene.sceneType === 4) {
    const open = Math.sin(state.elapsed * 3.2) > 0;
    return open ? [[44, 61], [64, 77], [80, 93], [96, 107]] : holeBounds[4];
  }

  if (state.scene.sceneType === 5 || state.scene.sceneType === 6 || state.scene.sceneType === 7) {
    const quickWidth = 12 + Math.floor((Math.sin(state.elapsed * 2.2) + 1) * 12);
    return [[80 - quickWidth, 80 + quickWidth]];
  }

  return holeBounds[state.scene.sceneType] ?? [];
}

function playerRect() {
  return {
    left: state.player.x - 6,
    right: state.player.x + 6,
    top: state.player.y - 24,
    bottom: state.player.y + 3,
  };
}

function intersects(a, b) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

function sceneSupportsLadderUse() {
  return state.scene.ladder && Math.abs(state.player.x - WORLD.ladderX) < TUNING.ladderRange && state.player.mode === "ground";
}

function handleActions() {
  if (consumeAction("jump")) {
    if (state.player.mode === "swing") {
      state.player.mode = "jump";
      state.player.vx = Math.cos(state.elapsed * 2.2 + Math.PI / 2) * 54;
      state.player.vy = -34;
      setStatus("Released from liana");
    } else {
      startJump((state.input.right ? 16 : 0) - (state.input.left ? 16 : 0));
    }
  }

  if (consumeAction("use")) {
    if (state.player.mode === "swing") {
      state.player.mode = "jump";
      state.player.vx = Math.cos(state.elapsed * 2.2 + Math.PI / 2) * 54;
      state.player.vy = -28;
      setStatus("Dropped from liana");
      return;
    }

    if (sceneSupportsLadderUse()) {
      beginLadderTransition(!state.player.underground);
    }
  }
}

function updatePlayer(delta) {
  handleActions();

  if (state.player.invulnerability > 0) {
    state.player.invulnerability = Math.max(0, state.player.invulnerability - delta);
  }

  if (state.player.mode === "dead") {
    state.player.stumbleTimer -= delta;
    state.player.y += state.player.vy * delta;
    state.player.vy += 180 * delta;

    if (state.player.stumbleTimer <= 0 && state.lives > 0) {
      state.player.x = 20;
      state.player.y = WORLD.groundY;
      state.player.vx = 0;
      state.player.vy = 0;
      state.player.underground = false;
      state.player.mode = "ground";
      state.player.invulnerability = 1.2;
      state.sceneSeed = RAND_SEED;
      state.sceneIndex = 1;
      enterScene(true);
    }

    return;
  }

  if (state.player.mode === "ladder") {
    state.player.transitionProgress += delta / 0.65;
    const progress = Math.min(state.player.transitionProgress, 1);
    state.player.x = WORLD.ladderX;
    state.player.y = state.player.transitionFromY + ((state.player.transitionToY - state.player.transitionFromY) * progress);
    if (progress >= 1) {
      state.player.mode = "ground";
      setStatus(state.player.underground ? `${BRAND_NAME} tunnel route active` : "Back on the jungle floor");
    }
    return;
  }

  if (state.player.mode === "swing") {
    const bobX = 80 + Math.sin(state.elapsed * 2.2) * 28;
    const bobY = 34 + Math.cos(state.elapsed * 2.2) * 6;
    state.player.x = bobX;
    state.player.y = bobY + 28;
    state.player.vx = 0;
    return;
  }

  const move = (state.input.right ? 1 : 0) - (state.input.left ? 1 : 0);
  const speed = state.player.underground ? 46 : 54;
  state.player.vx = move * speed;

  if (move !== 0) {
    state.player.facing = move;
  }

  if (state.player.mode === "ground") {
    state.player.x += move * speed * delta;
  }

  if (state.player.mode === "jump") {
    state.player.x += state.player.vx * delta;
    state.player.y += state.player.vy * delta;
    state.player.vy += TUNING.gravity * delta;

    if (state.scene.hasLiana && !state.player.underground) {
      const bobX = 80 + Math.sin(state.elapsed * 2.2) * 28;
      const bobY = 34 + Math.cos(state.elapsed * 2.2) * 6;
      if (Math.abs(state.player.x - bobX) < TUNING.lianaCatchX && Math.abs((state.player.y - 24) - bobY) < TUNING.lianaCatchY) {
        state.player.mode = "swing";
        setStatus(`${BRAND_NAME} liana locked`);
      }
    }

    const floorY = state.player.underground ? WORLD.tunnelY : WORLD.groundY;
    if (state.player.y >= floorY) {
      state.player.y = floorY;
      state.player.vy = 0;
      state.player.mode = "ground";
    }
  }

  if (state.player.mode === "fall") {
    state.player.y += state.player.vy * delta;
    state.player.vy += 210 * delta;
    if (state.player.y > WORLD.height + 28) {
      loseLife(state.pendingMessage || "Harry fell out of the scene.");
    }
  }

  if (state.player.stumbleTimer > 0) {
    state.player.stumbleTimer = Math.max(0, state.player.stumbleTimer - delta);
  }

  if (state.player.underground && state.scene.ladder) {
    const wallX = state.scene.wallSide === "left" ? 18 : 142;
    if (state.scene.wallSide === "left" && state.player.x < wallX + 8) {
      state.player.x = wallX + 8;
    }
    if (state.scene.wallSide === "right" && state.player.x > wallX - 8) {
      state.player.x = wallX - 8;
    }
  }

  state.player.x = Math.max(0, Math.min(WORLD.width, state.player.x));
}

function updateObjects(delta) {
  state.sceneObjects.forEach((object) => {
    if (object.kind === "log" && object.moving) {
      object.x -= 26 * delta;
      if (object.x < -18) {
        object.x = 178;
      }
    }
  });

  if (!state.scene.ladder) {
    state.scorpionX += state.scorpionDir * 18 * delta;
    if (state.scorpionX < 34 || state.scorpionX > 126) {
      state.scorpionDir *= -1;
    }
  }
}

function checkTerrainHazards(delta) {
  if (state.player.underground || state.player.mode !== "ground") {
    return;
  }

  const feetX = state.player.x;

  for (const bound of currentHazardBounds()) {
    if (feetX >= bound[0] + TUNING.pitInset && feetX <= bound[1] - TUNING.pitInset) {
      if (state.scene.sceneType >= 5) {
        state.sinkMeter += delta * (Math.abs(state.player.vx) > 0 ? TUNING.quicksandMovingRate : TUNING.quicksandStandingRate);
        state.player.y = WORLD.groundY + Math.min(state.sinkMeter * 10, 16);
        if (state.sinkMeter > TUNING.quicksandThreshold) {
          loseLife("Quicksand swallowed Harry.");
        }
      } else {
        beginFall(state.scene.sceneType === 4 ? "The crocs snapped the landing." : "Harry dropped through the terrain.");
      }
      return;
    }
  }

  state.sinkMeter = Math.max(0, state.sinkMeter - delta * 2.4);
  state.player.y = WORLD.groundY;
}

function checkObjectCollisions() {
  if (state.player.mode === "dead" || state.player.mode === "fall" || state.player.mode === "ladder" || state.player.mode === "swing") {
    return;
  }

  const rect = playerRect();

  for (const object of state.sceneObjects) {
    let bounds = {
      left: object.x - object.width / 2,
      right: object.x + object.width / 2,
      top: object.y - object.height,
      bottom: object.y + 2,
    };

    if (object.kind === "treasure") {
      bounds = {
        left: bounds.left - TUNING.treasureMagnetX,
        right: bounds.right + TUNING.treasureMagnetX,
        top: bounds.top - TUNING.treasureMagnetY,
        bottom: bounds.bottom + 6,
      };
    }

    if (object.kind === "log") {
      bounds = {
        left: bounds.left + 2,
        right: bounds.right - 2,
        top: bounds.top + 4,
        bottom: bounds.bottom - 1,
      };
    }

    if (object.kind === "fire") {
      bounds = {
        left: bounds.left + 2,
        right: bounds.right - 2,
        top: bounds.top + 6,
        bottom: bounds.bottom - 2,
      };
    }

    if (object.kind === "cobra") {
      bounds = {
        left: bounds.left + 4,
        right: bounds.right - 4,
        top: bounds.top + 8,
        bottom: bounds.bottom - 2,
      };
    }

    if (!intersects(rect, bounds)) {
      continue;
    }

    if (object.kind === "treasure") {
      collectTreasure(object);
      return;
    }

    if (object.kind === "log") {
      if (state.player.mode === "jump" && state.player.y < WORLD.groundY - TUNING.logClearance) {
        continue;
      }
      applyLogHit();
      return;
    }

    if (object.kind === "fire") {
      if (state.player.mode === "jump" && state.player.y < WORLD.groundY - TUNING.fireClearance) {
        continue;
      }
      loseLife("The fire line burned the run.");
      return;
    }

    if (object.kind === "cobra") {
      if (state.player.mode === "jump" && state.player.y < WORLD.groundY - TUNING.cobraClearance) {
        continue;
      }
      loseLife("The cobra landed the hit.");
      return;
    }
  }
}

function checkScorpionCollision() {
  if (state.scene.ladder || !state.player.underground || state.player.mode === "dead" || state.player.mode === "fall") {
    return;
  }

  const rect = playerRect();
  const bounds = {
    left: state.scorpionX - 8,
    right: state.scorpionX + 8,
    top: WORLD.tunnelTop + 8,
    bottom: WORLD.tunnelTop + 18,
  };

  if (!intersects(rect, bounds)) {
    return;
  }

  if (state.player.mode === "jump" && state.player.y < WORLD.tunnelY - TUNING.scorpionClearance) {
    return;
  }

  loseLife("The tunnel scorpion cut the route.");
}

function updateSceneProgression() {
  if (state.player.mode === "ladder" || state.player.mode === "dead") {
    return;
  }

  if (state.player.x <= WORLD.xMin) {
    if (state.player.underground && state.scene.ladder && state.scene.wallSide === "left") {
      state.player.x = WORLD.xMin;
      return;
    }
    advanceScene(-1);
  } else if (state.player.x >= WORLD.xMax) {
    if (state.player.underground && state.scene.ladder && state.scene.wallSide === "right") {
      state.player.x = WORLD.xMax;
      return;
    }
    advanceScene(1);
  }
}

function update(delta) {
  state.elapsed += delta;
  state.animationTick += delta;

  state.timer = Math.max(0, state.timer - delta);
  if (state.timer <= 0) {
    endGame("Time expired before the jungle was cleared.");
    return;
  }

  updatePlayer(delta);
  updateObjects(delta);
  checkTerrainHazards(delta);
  checkObjectCollisions();
  checkScorpionCollision();
  updateSceneProgression();
  syncHud();
}

function drawBackdrop() {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#061214");
  gradient.addColorStop(0.45, "#0b2d28");
  gradient.addColorStop(1, "#1f140b");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const glow = ctx.createRadialGradient(canvas.width * 0.7, canvas.height * 0.28, 20, canvas.width * 0.7, canvas.height * 0.28, 280);
  glow.addColorStop(0, "rgba(116, 230, 191, 0.42)");
  glow.addColorStop(1, "rgba(116, 230, 191, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 8; i += 1) {
    const baseX = WORLD.offsetX + 20 + i * 78;
    const height = 90 + ((i + state.scene.treePat) % 3) * 34;
    ctx.fillStyle = "rgba(18, 44, 36, 0.86)";
    ctx.fillRect(baseX, WORLD.offsetY + 8, 18, height);
    ctx.beginPath();
    ctx.arc(baseX + 9, WORLD.offsetY + 18, 28 + ((i + state.scene.treePat) % 2) * 10, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGround() {
  ctx.fillStyle = "#4d3a1e";
  ctx.fillRect(worldX(0), worldY(WORLD.groundTop), WORLD.width * WORLD.scale, 22 * WORLD.scale);
  ctx.fillStyle = "#9a7539";
  ctx.fillRect(worldX(0), worldY(WORLD.groundTop), WORLD.width * WORLD.scale, 6 * WORLD.scale);

  ctx.fillStyle = "#1b1c22";
  ctx.fillRect(worldX(0), worldY(WORLD.tunnelTop), WORLD.width * WORLD.scale, 24 * WORLD.scale);
  ctx.fillStyle = "#52422d";
  ctx.fillRect(worldX(0), worldY(WORLD.tunnelTop), WORLD.width * WORLD.scale, 4 * WORLD.scale);
}

function drawHazards() {
  const bounds = currentHazardBounds();
  if (!bounds.length) {
    return;
  }

  const fill = state.scene.sceneType === 3 || state.scene.sceneType === 7 ? "#1a5ea5" : "#09090c";
  bounds.forEach((bound) => {
    ctx.fillStyle = fill;
    ctx.fillRect(worldX(bound[0]), worldY(WORLD.groundTop - 2), (bound[1] - bound[0]) * WORLD.scale, 18 * WORLD.scale);
    ctx.fillStyle = "rgba(84, 255, 204, 0.18)";
    ctx.fillRect(worldX(bound[0]), worldY(WORLD.groundTop - 2), (bound[1] - bound[0]) * WORLD.scale, 2 * WORLD.scale);
  });
}

function drawLiana() {
  if (!state.scene.hasLiana) {
    return;
  }

  const bobX = 80 + Math.sin(state.elapsed * 2.2) * 28;
  const bobY = 34 + Math.cos(state.elapsed * 2.2) * 6;
  ctx.strokeStyle = "#b9985b";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(worldX(80), worldY(8));
  ctx.lineTo(worldX(bobX), worldY(bobY));
  ctx.stroke();
  ctx.fillStyle = "#d9b770";
  ctx.beginPath();
  ctx.arc(worldX(bobX), worldY(bobY), 6, 0, Math.PI * 2);
  ctx.fill();
}

function drawLadder() {
  if (!state.scene.ladder) {
    return;
  }

  ctx.strokeStyle = "#b98b4c";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(worldX(WORLD.ladderX - 4), worldY(WORLD.groundTop));
  ctx.lineTo(worldX(WORLD.ladderX - 4), worldY(WORLD.tunnelTop + 24));
  ctx.moveTo(worldX(WORLD.ladderX + 4), worldY(WORLD.groundTop));
  ctx.lineTo(worldX(WORLD.ladderX + 4), worldY(WORLD.tunnelTop + 24));
  ctx.stroke();

  for (let rung = 0; rung < 7; rung += 1) {
    const y = WORLD.groundTop + 6 + rung * 4;
    ctx.beginPath();
    ctx.moveTo(worldX(WORLD.ladderX - 4), worldY(y));
    ctx.lineTo(worldX(WORLD.ladderX + 4), worldY(y));
    ctx.stroke();
  }

  const wallX = state.scene.wallSide === "left" ? 10 : 142;
  ctx.fillStyle = "#6d4d38";
  ctx.fillRect(worldX(wallX), worldY(WORLD.tunnelTop), 8 * WORLD.scale, 24 * WORLD.scale);
}

function drawCrop(sheet, crop, dx, dy, dw, dh, flip = false) {
  if (!sheet.complete || sheet.naturalWidth === 0) {
    return false;
  }

  ctx.save();
  ctx.translate(dx + (flip ? dw : 0), dy);
  ctx.scale(flip ? -1 : 1, 1);
  ctx.drawImage(sheet, crop.x, crop.y, crop.width, crop.height, 0, 0, dw, dh);
  ctx.restore();
  return true;
}

function drawHero() {
  const heroSprite = spriteCrops.roster.hero;
  const drawX = worldX(state.player.x - heroSprite.anchorX);
  const drawY = worldY(state.player.y - heroSprite.anchorY + (state.player.stumbleTimer > 0 ? 2 : 0));
  const flicker = state.player.invulnerability > 0 && Math.floor(state.elapsed * 16) % 2 === 0;
  if (flicker) {
    return;
  }

  ctx.fillStyle = "rgba(9, 18, 21, 0.34)";
  ctx.beginPath();
  ctx.ellipse(worldX(state.player.x), worldY(state.player.y + 2), 18, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  const drawn = drawCrop(
    assets.roster,
    heroSprite,
    drawX,
    drawY,
    heroSprite.drawWidth,
    heroSprite.drawHeight,
    state.player.facing < 0,
  );
  if (!drawn) {
    ctx.fillStyle = "#d7b07b";
    ctx.fillRect(drawX + 8, drawY + 4, 24, 34);
    ctx.fillStyle = "#533719";
    ctx.fillRect(drawX + 4, drawY, 32, 12);
  }
}

function drawLog(object) {
  ctx.fillStyle = "#5e4521";
  ctx.fillRect(worldX(object.x - 8), worldY(object.y - 5), 16 * WORLD.scale, 6 * WORLD.scale);
  ctx.fillStyle = "#79f0d5";
  ctx.fillRect(worldX(object.x - 8), worldY(object.y - 3), 16 * WORLD.scale, WORLD.scale);
}

function drawFire(object) {
  const x = worldX(object.x - 6);
  const y = worldY(object.y - 12);
  ctx.fillStyle = "#ff9b38";
  ctx.beginPath();
  ctx.moveTo(x + 24, y);
  ctx.lineTo(x + 40, y + 22);
  ctx.lineTo(x + 18, y + 40);
  ctx.lineTo(x, y + 22);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#ffe07d";
  ctx.beginPath();
  ctx.moveTo(x + 24, y + 10);
  ctx.lineTo(x + 33, y + 23);
  ctx.lineTo(x + 18, y + 31);
  ctx.lineTo(x + 10, y + 22);
  ctx.closePath();
  ctx.fill();
}

function drawTreasure(object) {
  const crop = spriteCrops.reference[object.crop];
  ctx.fillStyle = "rgba(255, 210, 101, 0.14)";
  ctx.beginPath();
  ctx.arc(worldX(object.x), worldY(object.y - 6), 16, 0, Math.PI * 2);
  ctx.fill();

  const drawn = drawCrop(assets.reference, crop, worldX(object.x - 10), worldY(object.y - 12), 42, 42, false);
  if (!drawn) {
    ctx.fillStyle = "#f4c55e";
    ctx.fillRect(worldX(object.x - 6), worldY(object.y - 6), 12 * WORLD.scale, 10 * WORLD.scale);
  }
}

function drawCobra(object) {
  const sprite = spriteCrops.roster.snake;
  const drawn = drawCrop(
    assets.roster,
    sprite,
    worldX(object.x - sprite.anchorX),
    worldY(object.y - sprite.anchorY),
    sprite.drawWidth,
    sprite.drawHeight,
    false,
  );
  if (!drawn) {
    ctx.fillStyle = "#5cbf4d";
    ctx.fillRect(worldX(object.x - 4), worldY(object.y - 12), 8 * WORLD.scale, 14 * WORLD.scale);
  }
}

function drawCrocs() {
  if (state.scene.sceneType !== 4) {
    return;
  }

  const sprite = spriteCrops.roster.croc;
  [48, 68, 84, 100].forEach((x) => {
    drawCrop(
      assets.roster,
      sprite,
      worldX(x - sprite.anchorX),
      worldY(WORLD.groundTop - sprite.anchorY),
      sprite.drawWidth,
      sprite.drawHeight,
      false,
    );
  });
}

function drawScorpion() {
  if (state.scene.ladder) {
    return;
  }

  const sprite = spriteCrops.roster.scorpion;
  drawCrop(
    assets.roster,
    sprite,
    worldX(state.scorpionX - sprite.anchorX),
    worldY(WORLD.tunnelTop + 6 - sprite.anchorY + 10),
    sprite.drawWidth,
    sprite.drawHeight,
    state.scorpionDir < 0,
  );
}

function drawObjects() {
  state.sceneObjects.forEach((object) => {
    if (object.kind === "log") {
      drawLog(object);
    } else if (object.kind === "fire") {
      drawFire(object);
    } else if (object.kind === "cobra") {
      drawCobra(object);
    } else if (object.kind === "treasure") {
      drawTreasure(object);
    }
  });
}

function drawSceneInfo() {
  ctx.fillStyle = "rgba(17, 208, 188, 0.18)";
  ctx.fillRect(38, 18, 366, 64);
  ctx.strokeStyle = "rgba(17, 208, 188, 0.26)";
  ctx.strokeRect(38.5, 18.5, 365, 63);
  ctx.fillStyle = "rgba(140, 248, 240, 0.92)";
  ctx.font = "700 14px 'Trebuchet MS'";
  ctx.fillText(`${BRAND_NAME.toUpperCase()} ARCADE`, 58, 36);
  ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
  ctx.font = "700 22px 'Trebuchet MS'";
  ctx.fillText(state.scene.name, 58, 58);
  ctx.font = "14px 'Trebuchet MS'";
  ctx.fillStyle = "rgba(194, 236, 226, 0.92)";
  ctx.fillText(`Seed ${state.scene.seed.toString(16).padStart(2, "0").toUpperCase()}  |  ${state.scene.objectLabel}`, 58, 76);
}

function drawScene() {
  drawBackdrop();
  drawGround();
  drawHazards();
  drawLiana();
  drawLadder();
  drawCrocs();
  drawScorpion();
  drawObjects();
  drawHero();
  drawSceneInfo();
}

function loop(timestamp) {
  if (!state.running || state.paused || state.gameOver) {
    drawScene();
    return;
  }

  const delta = Math.min((timestamp - state.lastTime) / 1000, 0.033);
  state.lastTime = timestamp;

  update(delta);
  drawScene();

  if (state.running && !state.paused && !state.gameOver) {
    requestAnimationFrame(loop);
  }
}

function setMoveInput(direction, pressed) {
  state.input[direction] = pressed;
}

window.addEventListener("keydown", (event) => {
  if (event.code === "Enter" && !state.running && !state.gameOver) {
    startGame();
    return;
  }

  if (event.code === "KeyP") {
    togglePause();
    return;
  }

  if (event.code === "KeyR" && state.gameOver) {
    startGame();
    return;
  }

  if (event.code === "ArrowLeft" || event.code === "KeyA") {
    event.preventDefault();
    setMoveInput("left", true);
  }

  if (event.code === "ArrowRight" || event.code === "KeyD") {
    event.preventDefault();
    setMoveInput("right", true);
  }

  if (event.code === "Space" && !event.repeat) {
    event.preventDefault();
    state.input.jump = true;
  }

  if ((event.code === "KeyE" || event.code === "ArrowUp" || event.code === "ArrowDown") && !event.repeat) {
    event.preventDefault();
    state.input.use = true;
  }
});

window.addEventListener("keyup", (event) => {
  if (event.code === "ArrowLeft" || event.code === "KeyA") {
    setMoveInput("left", false);
  }

  if (event.code === "ArrowRight" || event.code === "KeyD") {
    setMoveInput("right", false);
  }
});

startButton.addEventListener("click", startGame);
resumeButton.addEventListener("click", () => togglePause(false));
restartButton.addEventListener("click", startGame);
pauseButton.addEventListener("click", () => togglePause());
jumpButton.addEventListener("click", () => {
  state.input.jump = true;
});
useButton.addEventListener("click", () => {
  state.input.use = true;
});

document.querySelectorAll("[data-move]").forEach((button) => {
  const direction = button.getAttribute("data-move");
  button.addEventListener("pointerdown", () => setMoveInput(direction, true));
  button.addEventListener("pointerup", () => setMoveInput(direction, false));
  button.addEventListener("pointerleave", () => setMoveInput(direction, false));
  button.addEventListener("pointercancel", () => setMoveInput(direction, false));
});

window.addEventListener("blur", () => {
  state.input.left = false;
  state.input.right = false;
});

assets.roster.addEventListener("load", () => drawScene());
assets.reference.addEventListener("load", () => drawScene());

resetRun();
bestScoreNode.textContent = String(state.bestScore);
drawScene();
