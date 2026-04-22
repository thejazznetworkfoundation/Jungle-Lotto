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

const FRAME_TIME = 1 / 60;
const START_TIME = 20 * 60;
const START_SCORE = 2000;
const RAND_SEED = 0xc4;
const HIGH_SCORE_KEY = "lottominded-high-score";
const BRAND_NAME = "LottoMind";
const GROUND_CONTACT_OFFSET = WORLD.groundTop - WORLD.groundY;
const OBJECT_CONTACT_OFFSET = 10;
const TUNNEL_CONTACT_Y = WORLD.tunnelTop + 23;

// David Crane's original 32-frame jump curve from the Pitfall source.
const JUMP_TABLE = [
  1, 1, 1, 1, 1, 1, 1, 0,
  1, 0, 0, 1, 0, 0, 0, 1,
  -1, 0, 0, 0, -1, 0, 0, -1,
  0, -1, -1, -1, -1, -1, -1, -1,
];

const CROC_HEADS = [60, 76, 92];
const CROC_OPEN_BOUNDS = [[44, 59], [64, 75], [80, 91], [96, 107]];
const QUICKSAND_WIDTHS = [12, 16, 20, 28, 20, 16];

const TUNING = {
  runSpeed: 1,
  jumpSpeed: 1,
  jumpSteerFrames: 2,
  ladderGrabRange: 7,
  ladderStepInterval: 8,
  ladderStepAmount: 2,
  lianaCatchX: 13,
  lianaCatchY: 20,
  pitInset: 2,
  quicksandMovingRate: 0.16,
  quicksandStandingRate: 0.42,
  quicksandThreshold: 2.3,
  quicksandReleaseRate: 0.5,
  logJumpClearance: 12,
  fireJumpClearance: 15,
  cobraJumpClearance: 17,
  scorpionJumpClearance: 13,
  treasureMagnetX: 12,
  treasureMagnetY: 16,
  deathFrames: 70,
  holeDropSpeed: 1.2,
  deathFallSpeed: 2.2,
  crocCycleFrames: 128,
  ladderExitJumpIndex: 1,
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
  "The vine is the cleanest path over the tar pit.",
  "Blue water pit with a swinging line overhead.",
  "Three crocs make a stepping-stone bridge when their jaws cooperate.",
  "Treasure rests beside unstable sand.",
  "Black quicksand widens and punishes standing still.",
  "Blue quicksand looks calmer than it is.",
];

const lianaTable = [false, false, true, true, true, false, true, false];

// These intervals come directly from the original scene tables.
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
  hero: {
    path: "assets/lottomind-main-hero-clean.png",
    x: 209,
    y: 112,
    width: 688,
    height: 1233,
    drawWidth: 50,
    drawHeight: 88,
    anchorX: 6,
    anchorY: 22,
  },
  roster: {
    path: "assets/custom-roster-lottomind-v2-clean.png",
    croc: { x: 627, y: 207, width: 584, height: 321, drawWidth: 84, drawHeight: 48, anchorX: 12, anchorY: 8 },
    snake: { x: 63, y: 644, width: 452, height: 454, drawWidth: 54, drawHeight: 56, anchorX: 7, anchorY: 14 },
    scorpion: { x: 637, y: 674, width: 561, height: 424, drawWidth: 76, drawHeight: 54, anchorX: 10, anchorY: 13 },
  },
  reference: {
    path: "assets/reference-collage.webp",
    chest: { x: 596, y: 76, width: 178, height: 178 },
    potion: { x: 804, y: 76, width: 120, height: 152 },
    heart: { x: 766, y: 380, width: 180, height: 170 },
  },
};

const assets = {
  hero: new Image(),
  roster: new Image(),
  reference: new Image(),
};

assets.hero.src = spriteCrops.hero.path;
assets.roster.src = spriteCrops.roster.path;
assets.reference.src = spriteCrops.reference.path;

const state = {
  running: false,
  paused: false,
  gameOver: false,
  score: START_SCORE,
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
  frameAccumulator: 0,
  frameCount: 0,
  elapsed: 0,
  sinkMeter: 0,
  scorpionX: 80,
  scorpionFacing: 1,
  pendingMessage: "",
  lastLogContact: false,
  input: {
    left: false,
    right: false,
    up: false,
    down: false,
    jumpQueued: false,
    useQueued: false,
  },
  player: {
    x: 20,
    y: WORLD.groundY,
    facing: 1,
    underground: false,
    mode: "ground",
    jumpIndex: -1,
    jumpDirection: 0,
    jumpSteerFrames: 0,
    respawnUnderground: false,
    invulnerabilityFrames: 0,
    stumbleFrames: 0,
    deathFrames: 0,
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
      ? "Crocodiles"
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
    phase: index * 6,
  }));
}

function updateScenePanel() {
  const scene = state.scene;
  const card = document.getElementById("hero-target-pill");
  card.style.background = sceneGradient(scene.sceneType);
  heroTargetLabel.textContent = scene.name;
  heroTargetCopy.textContent = `${BRAND_NAME} decode: ${scene.hint} Object: ${scene.objectLabel}. Seed ${scene.seed.toString(16).padStart(2, "0").toUpperCase()}.`;
  sidebarTarget.textContent = scene.name;
  sidebarCopy.textContent = `${scene.hint} Active object: ${scene.objectLabel}. Movement now follows the original Pitfall rules more closely.`;
}

function enterScene(announce = false) {
  state.scene = buildScene(state.sceneSeed);
  state.sceneObjects = buildSceneObjects(state.scene);
  state.sinkMeter = 0;
  state.scorpionX = state.scene.xPosScorpion;
  updateScenePanel();
  syncHud();

  if (announce) {
    addFeed("Scene Shift", `${state.scene.name} loaded from seed ${state.scene.seed.toString(16).padStart(2, "0").toUpperCase()}.`);
  }
}

function resetPlayerForRun() {
  state.player.x = 20;
  state.player.y = WORLD.groundY;
  state.player.facing = 1;
  state.player.underground = false;
  state.player.mode = "ground";
  state.player.jumpIndex = -1;
  state.player.jumpDirection = 0;
  state.player.jumpSteerFrames = 0;
  state.player.respawnUnderground = false;
  state.player.invulnerabilityFrames = 0;
  state.player.stumbleFrames = 0;
  state.player.deathFrames = 0;
}

function resetRun() {
  state.running = false;
  state.paused = false;
  state.gameOver = false;
  state.score = START_SCORE;
  state.lives = 3;
  state.timer = START_TIME;
  state.sceneSeed = RAND_SEED;
  state.sceneIndex = 1;
  state.collectedTreasures.clear();
  state.sceneFeed = [];
  state.lastTime = 0;
  state.frameAccumulator = 0;
  state.frameCount = 0;
  state.elapsed = 0;
  state.sinkMeter = 0;
  state.pendingMessage = "";
  state.lastLogContact = false;
  resetPlayerForRun();
  enterScene(false);
  setStatus("Press Start to begin");
  addFeed("Run Ready", `${BRAND_NAME} loaded the original 20-minute jungle run. Score starts at 2000 like the Atari game.`);
}

function startGame() {
  resetRun();
  state.running = true;
  state.lastTime = performance.now();
  startOverlay.classList.add("hidden");
  pauseOverlay.classList.add("hidden");
  gameOverOverlay.classList.add("hidden");
  setStatus("Run live");
  addFeed("Run Live", "Harry keeps a tiny post-takeoff steer window, holes drop you underground, and crocodiles now time out more like the original run.");
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

function changeScore(amount) {
  state.score = Math.max(0, state.score + amount);
}

function currentHorizontalIntent() {
  return (state.input.right ? 1 : 0) - (state.input.left ? 1 : 0);
}

function consumeQueuedInput(key) {
  if (!state.input[key]) {
    return false;
  }
  state.input[key] = false;
  return true;
}

function currentHazardBounds() {
  if (state.scene.sceneType === 4) {
    const crocOpen = (state.frameCount & 0x80) === 0;
    return crocOpen ? CROC_OPEN_BOUNDS : holeBounds[4];
  }

  if (state.scene.sceneType === 5 || state.scene.sceneType === 6 || state.scene.sceneType === 7) {
    const quickWidth = QUICKSAND_WIDTHS[Math.floor(state.frameCount / 8) % QUICKSAND_WIDTHS.length];
    return [[80 - quickWidth, 80 + quickWidth]];
  }

  return holeBounds[state.scene.sceneType] ?? [];
}

function isWithinBound(x, bound) {
  return x >= bound[0] && x <= bound[1];
}

function isInHazardInterval(x) {
  return currentHazardBounds().some((bound) => isWithinBound(x, bound));
}

function isNearLadder() {
  return state.scene.ladder && Math.abs(state.player.x - WORLD.ladderX) <= TUNING.ladderGrabRange;
}

function getLianaPosition() {
  const angle = state.elapsed * 2.15;
  return {
    x: 80 + Math.sin(angle) * 28,
    y: 34 + Math.cos(angle) * 6,
    direction: Math.cos(angle) >= 0 ? 1 : -1,
  };
}

function isOnCrocHead(x) {
  if (state.scene.sceneType !== 4) {
    return false;
  }

  const inSwamp = x >= 44 && x <= 107;
  return inSwamp && !isInHazardInterval(x);
}

function currentFloorY() {
  if (state.player.underground) {
    return WORLD.tunnelY;
  }

  if (isOnCrocHead(state.player.x)) {
    return WORLD.groundY - 4;
  }

  return WORLD.groundY;
}

function startJump(direction, startIndex = 0) {
  if (state.player.mode !== "ground" || state.player.stumbleFrames > 0) {
    return;
  }

  state.player.mode = "jump";
  state.player.jumpIndex = startIndex;
  state.player.jumpDirection = direction === 0 ? state.player.facing : direction;
  state.player.jumpSteerFrames = TUNING.jumpSteerFrames;
  state.player.facing = state.player.jumpDirection;
}

function startSwingRelease() {
  const liana = getLianaPosition();
  state.player.mode = "jump";
  state.player.jumpIndex = 16;
  state.player.jumpDirection = liana.direction;
  setStatus("Dropped from the vine");
}

function startHoleDrop() {
  if (state.player.mode === "fall") {
    return;
  }

  state.player.mode = "fall";
  state.pendingMessage = "Dropped through a hole into the tunnel. -100.";
  changeScore(-100);
  state.player.jumpIndex = -1;
  state.player.jumpSteerFrames = 0;
  state.sinkMeter = 0;
  setStatus("Falling underground");
  addFeed("Hole Drop", "Harry missed the hole jump and dropped to the tunnel for a 100-point penalty.");
}

function killHarry(reason) {
  if (state.player.mode === "dead") {
    return;
  }

  state.player.mode = "dead";
  state.player.deathFrames = TUNING.deathFrames;
  state.player.respawnUnderground = state.player.underground;
  state.pendingMessage = reason;
  state.lives -= 1;
  syncHud();
  setStatus(reason);
  addFeed("Life Lost", reason);

  if (state.lives <= 0) {
    endGame("The jungle won the run. Harry is out of lives.");
  }
}

function respawnHarry() {
  if (state.lives <= 0) {
    return;
  }

  state.player.x = 20;
  state.player.underground = state.player.respawnUnderground;
  state.player.y = state.player.underground ? WORLD.tunnelY : WORLD.groundY;
  state.player.mode = "ground";
  state.player.jumpIndex = -1;
  state.player.jumpDirection = 0;
  state.player.jumpSteerFrames = 0;
  state.player.invulnerabilityFrames = 75;
  state.player.stumbleFrames = 0;
  state.player.deathFrames = 0;
  state.sinkMeter = 0;
  state.scorpionX = state.scene.xPosScorpion;
  setStatus(state.player.underground ? "Replacement Harry returned to the tunnel." : "Replacement Harry dropped in from the trees.");
}

function collectTreasure(object) {
  state.collectedTreasures.add(state.scene.treasureKey);
  changeScore(object.points);
  state.sceneObjects = [];
  setStatus(`${object.label} collected for ${object.points}`);
  addFeed("Treasure", `Collected ${object.label} for ${object.points} points.`);

  if (state.collectedTreasures.size >= 32) {
    endGame("All 32 treasure states were cleared. Harry completed the jungle.", true);
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
  state.player.y = state.player.underground ? WORLD.tunnelY : currentFloorY();
  state.player.mode = "ground";
  state.player.jumpIndex = -1;
  state.player.jumpDirection = 0;
  state.player.jumpSteerFrames = 0;
  state.sinkMeter = 0;
  enterScene(true);
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

function handleInputActions() {
  const horizontal = currentHorizontalIntent();

  if (consumeQueuedInput("jumpQueued")) {
    if (state.player.mode === "swing") {
      startSwingRelease();
    } else if (state.player.mode === "ground") {
      startJump(horizontal === 0 ? state.player.facing : horizontal);
    }
  }

  const wantsUse = consumeQueuedInput("useQueued");

  if (state.player.mode === "swing" && (state.input.down || wantsUse)) {
    startSwingRelease();
  }

  if (state.player.mode === "ground" && isNearLadder()) {
    if (!state.player.underground && (state.input.down || wantsUse)) {
      state.player.mode = "ladder";
      state.player.x = WORLD.ladderX;
      setStatus("Climbing down");
    } else if (state.player.underground && state.input.up) {
      state.player.mode = "ladder";
      state.player.x = WORLD.ladderX;
      setStatus("Climbing up");
    }
  }
}

function updateGroundMovement() {
  if (state.player.stumbleFrames > 0) {
    state.player.y = currentFloorY();
    return;
  }

  const horizontal = currentHorizontalIntent();

  if (horizontal !== 0) {
    state.player.facing = horizontal;
  }

  state.player.x += horizontal * TUNING.runSpeed;
  state.player.y = currentFloorY();
}

function updateJumpMovement() {
  const horizontal = currentHorizontalIntent();
  if (state.player.jumpSteerFrames > 0) {
    if (horizontal !== 0) {
      state.player.jumpDirection = horizontal;
      state.player.facing = horizontal;
    }
    state.player.jumpSteerFrames -= 1;
  }

  state.player.x += state.player.jumpDirection * TUNING.jumpSpeed;
  state.player.y -= JUMP_TABLE[state.player.jumpIndex];
  state.player.jumpIndex += 1;

  if (state.scene.hasLiana && !state.player.underground) {
    const liana = getLianaPosition();
    if (Math.abs(state.player.x - liana.x) <= TUNING.lianaCatchX && Math.abs((state.player.y - 24) - liana.y) <= TUNING.lianaCatchY) {
      state.player.mode = "swing";
      state.player.jumpIndex = -1;
      setStatus("Liana grabbed");
      return;
    }
  }

  if (state.player.jumpIndex >= JUMP_TABLE.length) {
    state.player.jumpIndex = -1;
    state.player.jumpSteerFrames = 0;
    state.player.mode = "ground";
    state.player.y = currentFloorY();
  }
}

function updateSwingMovement() {
  const liana = getLianaPosition();
  state.player.x = liana.x;
  state.player.y = liana.y + 26;
  state.player.facing = liana.direction;
}

function updateLadderMovement() {
  state.player.x = WORLD.ladderX;

  const horizontal = currentHorizontalIntent();
  if (!state.player.underground && state.player.y <= WORLD.groundY + 1 && horizontal !== 0) {
    state.player.mode = "jump";
    state.player.y = WORLD.groundY - 1;
    state.player.jumpIndex = TUNING.ladderExitJumpIndex;
    state.player.jumpDirection = horizontal;
    state.player.jumpSteerFrames = 0;
    state.player.facing = horizontal;
    setStatus("Jumped clear of the ladder");
    return;
  }

  if (state.frameCount % TUNING.ladderStepInterval !== 0) {
    return;
  }

  const wantsDown = state.input.down;
  const wantsUp = state.input.up;

  if (wantsUp) {
    state.player.y -= TUNING.ladderStepAmount;
  } else if (wantsDown) {
    state.player.y += TUNING.ladderStepAmount;
  }

  if (state.player.y <= WORLD.groundY) {
    state.player.y = WORLD.groundY;
    state.player.underground = false;
    state.player.mode = "ground";
    setStatus("Back on the jungle floor");
  } else if (state.player.y >= WORLD.tunnelY) {
    state.player.y = WORLD.tunnelY;
    state.player.underground = true;
    state.player.mode = "ground";
    setStatus("Tunnel route active");
  }
}

function updateFallMovement() {
  state.player.y += TUNING.holeDropSpeed;
  if (state.player.y >= WORLD.tunnelY) {
    state.player.y = WORLD.tunnelY;
    state.player.underground = true;
    state.player.mode = "ground";
    state.sinkMeter = 0;
    setStatus("Harry landed in the tunnel");
  }
}

function updateDeathMovement() {
  state.player.deathFrames -= 1;
  state.player.y += Math.sin(state.player.deathFrames / 10) > 0 ? -0.3 : 0.9;
  if (state.player.deathFrames <= 0 && state.lives > 0) {
    respawnHarry();
  }
}

function updatePlayerTick() {
  handleInputActions();

  if (state.player.invulnerabilityFrames > 0) {
    state.player.invulnerabilityFrames -= 1;
  }

  if (state.player.stumbleFrames > 0) {
    state.player.stumbleFrames -= 1;
  }

  if (state.player.mode === "dead") {
    updateDeathMovement();
    return;
  }

  if (state.player.mode === "fall") {
    updateFallMovement();
  } else if (state.player.mode === "ladder") {
    updateLadderMovement();
  } else if (state.player.mode === "swing") {
    updateSwingMovement();
  } else if (state.player.mode === "jump") {
    updateJumpMovement();
  } else {
    updateGroundMovement();
  }

  state.player.x = Math.max(0, Math.min(WORLD.width, state.player.x));

  if (state.player.underground && state.scene.ladder) {
    const wallX = state.scene.wallSide === "left" ? 18 : 142;
    if (state.scene.wallSide === "left" && state.player.x < wallX + 8) {
      state.player.x = wallX + 8;
    }
    if (state.scene.wallSide === "right" && state.player.x > wallX - 8) {
      state.player.x = wallX - 8;
    }
  }
}

function updateObjectsTick() {
  state.sceneObjects.forEach((object) => {
    if (object.kind === "log" && object.moving && state.frameCount % 2 === 0) {
      object.x -= 1;
      if (object.x < -18) {
        object.x = 178;
      }
    }
  });

  if (!state.scene.ladder && state.frameCount % 8 === 0) {
    if (state.player.x > state.scorpionX) {
      state.scorpionX += 1;
      state.scorpionFacing = 1;
    } else if (state.player.x < state.scorpionX) {
      state.scorpionX -= 1;
      state.scorpionFacing = -1;
    }
  }
}

function checkTerrainHazards() {
  if (state.player.underground || state.player.mode !== "ground") {
    return;
  }

  const feetX = state.player.x;

  if (state.scene.sceneType === 4) {
    if (feetX >= 44 && feetX <= 107 && !isOnCrocHead(feetX)) {
      killHarry("The crocs snapped the landing.");
    }
    return;
  }

  if (state.scene.sceneType === 5 || state.scene.sceneType === 6 || state.scene.sceneType === 7) {
    if (isInHazardInterval(feetX)) {
      const moving = currentHorizontalIntent() !== 0;
      state.sinkMeter += moving ? TUNING.quicksandMovingRate : TUNING.quicksandStandingRate;
      state.player.y = WORLD.groundY + Math.min(state.sinkMeter * 0.9, 12);
      if (state.sinkMeter >= TUNING.quicksandThreshold) {
        killHarry("Quicksand swallowed Harry.");
      }
      return;
    }

    state.sinkMeter = Math.max(0, state.sinkMeter - TUNING.quicksandReleaseRate);
    state.player.y = WORLD.groundY;
    return;
  }

  if (currentHazardBounds().some((bound) => feetX >= bound[0] + TUNING.pitInset && feetX <= bound[1] - TUNING.pitInset)) {
    if (state.scene.ladder) {
      startHoleDrop();
    } else {
      killHarry(state.scene.sceneType === 2 || state.scene.sceneType === 3 ? "Harry fell into the pit." : "Harry missed the hazard.");
    }
  }
}

function logContactPenalty() {
  changeScore(-1);
  state.player.stumbleFrames = 5;
  setStatus("Log contact. Score ticking down.");
}

function checkObjectCollisions() {
  if (state.player.mode === "dead" || state.player.mode === "fall" || state.player.mode === "ladder" || state.player.mode === "swing") {
    state.lastLogContact = false;
    return;
  }

  const rect = playerRect();
  let touchingLog = false;

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
      break;
    }

    if (object.kind === "log") {
      if (state.player.mode === "jump" && state.player.y < currentFloorY() - TUNING.logJumpClearance) {
        continue;
      }
      touchingLog = true;
      state.player.x += object.moving ? -1 : 0;
      continue;
    }

    if (object.kind === "fire") {
      if (state.player.mode === "jump" && state.player.y < currentFloorY() - TUNING.fireJumpClearance) {
        continue;
      }
      killHarry("The fire line burned the run.");
      return;
    }

    if (object.kind === "cobra") {
      if (state.player.mode === "jump" && state.player.y < currentFloorY() - TUNING.cobraJumpClearance) {
        continue;
      }
      killHarry("The cobra landed the hit.");
      return;
    }
  }

  if (touchingLog) {
    logContactPenalty();
  }

  state.lastLogContact = touchingLog;
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

  if (state.player.mode === "jump" && state.player.y < WORLD.tunnelY - TUNING.scorpionJumpClearance) {
    return;
  }

  killHarry("The tunnel scorpion cut the route.");
}

function updateSceneProgression() {
  if (state.player.mode === "ladder" || state.player.mode === "dead" || state.player.mode === "fall") {
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

function updateTick() {
  state.frameCount += 1;
  state.elapsed += FRAME_TIME;
  state.timer = Math.max(0, state.timer - FRAME_TIME);

  if (state.timer <= 0) {
    endGame("Time expired before the jungle was cleared.");
    return;
  }

  updatePlayerTick();
  updateObjectsTick();
  checkTerrainHazards();
  checkObjectCollisions();
  checkScorpionCollision();
  updateSceneProgression();
  syncHud();
}

function drawBackdrop() {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#040713");
  gradient.addColorStop(0.34, "#0b1630");
  gradient.addColorStop(0.72, "#0a2b2f");
  gradient.addColorStop(1, "#19071d");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const glow = ctx.createRadialGradient(canvas.width * 0.72, canvas.height * 0.2, 18, canvas.width * 0.72, canvas.height * 0.2, 260);
  glow.addColorStop(0, "rgba(255, 210, 125, 0.42)");
  glow.addColorStop(1, "rgba(116, 230, 191, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const sideGlow = ctx.createRadialGradient(canvas.width * 0.18, canvas.height * 0.34, 14, canvas.width * 0.18, canvas.height * 0.34, 220);
  sideGlow.addColorStop(0, "rgba(169, 95, 255, 0.3)");
  sideGlow.addColorStop(1, "rgba(169, 95, 255, 0)");
  ctx.fillStyle = sideGlow;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let layer = 0; layer < 3; layer += 1) {
    const yBase = WORLD.offsetY + 28 + layer * 28;
    const alpha = 0.18 + layer * 0.08;
    ctx.fillStyle = `rgba(${14 + layer * 10}, ${26 + layer * 8}, ${44 + layer * 10}, ${alpha})`;
    for (let i = 0; i < 6; i += 1) {
      const x = WORLD.offsetX - 34 + i * 124 + ((layer + i + state.scene.treePat) % 2) * 16;
      const width = 64 + ((i + layer) % 3) * 20;
      const height = 18 + layer * 10 + (i % 2) * 4;
      ctx.beginPath();
      ctx.ellipse(x, yBase, width, height, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  for (let i = 0; i < 7; i += 1) {
    const baseX = WORLD.offsetX - 18 + i * 92 + ((state.scene.treePat + i) % 2) * 12;
    const trunkWidth = 24 + (i % 2) * 8;
    const trunkHeight = 174 + ((i + state.scene.treePat) % 3) * 28;
    const top = WORLD.offsetY - 26;
    ctx.fillStyle = "rgba(8, 14, 30, 0.92)";
    ctx.fillRect(baseX, top, trunkWidth, trunkHeight);

    ctx.fillStyle = "rgba(86, 50, 153, 0.26)";
    ctx.fillRect(baseX + 4, top + 12, 4, trunkHeight - 24);
    ctx.fillStyle = "rgba(255, 201, 96, 0.18)";
    ctx.fillRect(baseX + trunkWidth - 7, top + 22, 3, trunkHeight - 42);

    ctx.strokeStyle = i % 2 === 0 ? "rgba(118, 235, 255, 0.24)" : "rgba(255, 201, 96, 0.22)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(baseX + trunkWidth * 0.34, top + 32);
    ctx.lineTo(baseX + trunkWidth * 0.34, top + 58);
    ctx.lineTo(baseX + trunkWidth * 0.78, top + 58);
    ctx.moveTo(baseX + trunkWidth * 0.58, top + 76);
    ctx.lineTo(baseX + trunkWidth * 0.58, top + 104);
    ctx.lineTo(baseX + trunkWidth * 0.18, top + 104);
    ctx.moveTo(baseX + trunkWidth * 0.4, top + 126);
    ctx.lineTo(baseX + trunkWidth * 0.4, top + 152);
    ctx.lineTo(baseX + trunkWidth * 0.84, top + 152);
    ctx.stroke();
  }

  const vineColors = ["#64e8ff", "#ad6fff", "#81d861", "#f3c86e"];
  for (let i = 0; i < 9; i += 1) {
    const x = WORLD.offsetX + 6 + i * 72;
    const top = WORLD.offsetY - 22;
    const length = 48 + ((state.scene.treePat + i) % 5) * 18;
    const sway = ((i % 2) * 2 - 1) * 6;
    ctx.strokeStyle = vineColors[i % vineColors.length];
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.bezierCurveTo(x + sway, top + 18, x - sway, top + length - 18, x + sway, top + length);
    ctx.stroke();

    ctx.strokeStyle = "rgba(6, 12, 28, 0.82)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 2, top);
    ctx.lineTo(x + sway + 2, top + length);
    ctx.stroke();

    for (let node = 18; node < length; node += 16) {
      ctx.fillStyle = vineColors[(i + node) % vineColors.length];
      ctx.fillRect(x + sway - 2, top + node, 5, 5);
    }
  }

  ctx.strokeStyle = "rgba(21, 12, 34, 0.82)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(16, 54);
  ctx.bezierCurveTo(120, 14, 264, 18, 360, 46);
  ctx.moveTo(408, 42);
  ctx.bezierCurveTo(516, 18, 624, 16, 704, 58);
  ctx.stroke();

  const mist = ctx.createLinearGradient(0, worldY(58), 0, worldY(108));
  mist.addColorStop(0, "rgba(110, 233, 255, 0)");
  mist.addColorStop(0.45, "rgba(110, 233, 255, 0.06)");
  mist.addColorStop(1, "rgba(232, 163, 255, 0.12)");
  ctx.fillStyle = mist;
  ctx.fillRect(0, worldY(58), canvas.width, worldY(108) - worldY(58));
}

function drawGround() {
  const topY = worldY(WORLD.groundTop);
  const faceHeight = 22 * WORLD.scale;
  const faceGradient = ctx.createLinearGradient(0, topY, 0, topY + faceHeight);
  faceGradient.addColorStop(0, "#5c362a");
  faceGradient.addColorStop(0.35, "#43271f");
  faceGradient.addColorStop(1, "#211112");
  ctx.fillStyle = faceGradient;
  ctx.fillRect(worldX(0), topY, WORLD.width * WORLD.scale, faceHeight);

  ctx.fillStyle = "rgba(19, 10, 12, 0.32)";
  ctx.fillRect(worldX(0), topY + 24, WORLD.width * WORLD.scale, faceHeight - 24);

  ctx.fillStyle = "#4b2f25";
  ctx.fillRect(worldX(0), worldY(WORLD.groundTop + 4), WORLD.width * WORLD.scale, 18 * WORLD.scale);
  ctx.fillStyle = "#7cd64a";
  ctx.fillRect(worldX(0), worldY(WORLD.groundTop), WORLD.width * WORLD.scale, 4 * WORLD.scale);
  ctx.fillStyle = "#b3f47d";
  ctx.fillRect(worldX(0), worldY(WORLD.groundTop), WORLD.width * WORLD.scale, WORLD.scale);
  ctx.fillStyle = "#d7bc62";
  for (let x = 0; x < WORLD.width; x += 18) {
    ctx.fillRect(worldX(x + 2), worldY(WORLD.groundTop + 1), 8, 2);
  }
  ctx.fillStyle = "rgba(255, 210, 98, 0.12)";
  for (let x = 0; x < WORLD.width; x += 14) {
    ctx.fillRect(worldX(x + 1), worldY(WORLD.groundTop + 6), 4, 18 + ((x / 14) % 3) * 6);
  }
  ctx.strokeStyle = "rgba(14, 8, 12, 0.42)";
  ctx.lineWidth = 2;
  for (let x = 8; x < WORLD.width; x += 24) {
    ctx.beginPath();
    ctx.moveTo(worldX(x), worldY(WORLD.groundTop + 8));
    ctx.lineTo(worldX(x + 6), worldY(WORLD.groundTop + 18));
    ctx.lineTo(worldX(x + 2), worldY(WORLD.groundTop + 24));
    ctx.stroke();
  }

  const tunnelY = worldY(WORLD.tunnelTop);
  const tunnelGradient = ctx.createLinearGradient(0, tunnelY, 0, tunnelY + 24 * WORLD.scale);
  tunnelGradient.addColorStop(0, "#23192d");
  tunnelGradient.addColorStop(0.5, "#10121f");
  tunnelGradient.addColorStop(1, "#06070e");
  ctx.fillStyle = tunnelGradient;
  ctx.fillRect(worldX(0), tunnelY, WORLD.width * WORLD.scale, 24 * WORLD.scale);
  ctx.fillStyle = "#4a295a";
  ctx.fillRect(worldX(0), tunnelY, WORLD.width * WORLD.scale, 4 * WORLD.scale);
  ctx.fillStyle = "#2cd8ff";
  for (let x = 0; x < WORLD.width; x += 22) {
    ctx.fillRect(worldX(x + 6), worldY(WORLD.tunnelTop + 1), 6, 2);
  }
  const tunnelGlow = ctx.createLinearGradient(0, tunnelY, 0, tunnelY + 16 * WORLD.scale);
  tunnelGlow.addColorStop(0, "rgba(106, 239, 255, 0.14)");
  tunnelGlow.addColorStop(1, "rgba(106, 239, 255, 0)");
  ctx.fillStyle = tunnelGlow;
  ctx.fillRect(worldX(0), tunnelY, WORLD.width * WORLD.scale, 16 * WORLD.scale);
}

function drawHazards() {
  const bounds = currentHazardBounds();
  if (!bounds.length) {
    return;
  }

  const jackpotPool = state.scene.sceneType === 3 || state.scene.sceneType === 7;
  bounds.forEach((bound, index) => {
    const x = worldX(bound[0]);
    const y = worldY(WORLD.groundTop - 2);
    const width = (bound[1] - bound[0]) * WORLD.scale;
    const height = 18 * WORLD.scale;
    const fill = ctx.createLinearGradient(x, y, x, y + height);
    if (jackpotPool) {
      fill.addColorStop(0, "rgba(255, 211, 120, 0.95)");
      fill.addColorStop(0.22, "rgba(249, 146, 48, 0.78)");
      fill.addColorStop(1, "rgba(8, 4, 15, 0.96)");
    } else {
      fill.addColorStop(0, "rgba(198, 122, 255, 0.95)");
      fill.addColorStop(0.22, "rgba(114, 55, 180, 0.78)");
      fill.addColorStop(1, "rgba(6, 3, 12, 0.96)");
    }
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, width, height);

    ctx.strokeStyle = jackpotPool ? "rgba(255, 234, 178, 0.86)" : "rgba(235, 186, 255, 0.82)";
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, width - 2, height - 2);

    ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
    ctx.fillRect(x + 6, y + 5, width - 12, 4);

    ctx.strokeStyle = jackpotPool ? "rgba(255, 204, 98, 0.32)" : "rgba(208, 123, 255, 0.3)";
    ctx.beginPath();
    ctx.ellipse(x + width / 2, y + 18, Math.max(14, width * 0.24), 7 + index, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = jackpotPool ? "rgba(255, 233, 173, 0.18)" : "rgba(225, 168, 255, 0.18)";
    ctx.beginPath();
    ctx.ellipse(x + width / 2, y + 32, Math.max(18, width * 0.32), 12 + index * 2, 0, 0, Math.PI * 2);
    ctx.stroke();
  });
}

function drawLiana() {
  if (!state.scene.hasLiana) {
    return;
  }

  const liana = getLianaPosition();
  ctx.strokeStyle = "#76e36a";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(worldX(80), worldY(8));
  ctx.lineTo(worldX(liana.x), worldY(liana.y));
  ctx.stroke();
  ctx.strokeStyle = "rgba(79, 240, 255, 0.34)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(worldX(81), worldY(8));
  ctx.lineTo(worldX(liana.x + 1), worldY(liana.y));
  ctx.stroke();
  ctx.fillStyle = "#d9b770";
  ctx.beginPath();
  ctx.arc(worldX(liana.x), worldY(liana.y), 6, 0, Math.PI * 2);
  ctx.fill();
}

function drawLadder() {
  if (!state.scene.ladder) {
    return;
  }

  ctx.strokeStyle = "#5e3f85";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(worldX(WORLD.ladderX - 4), worldY(WORLD.groundTop));
  ctx.lineTo(worldX(WORLD.ladderX - 4), worldY(WORLD.tunnelTop + 24));
  ctx.moveTo(worldX(WORLD.ladderX + 4), worldY(WORLD.groundTop));
  ctx.lineTo(worldX(WORLD.ladderX + 4), worldY(WORLD.tunnelTop + 24));
  ctx.stroke();

  ctx.strokeStyle = "#ffc85e";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(worldX(WORLD.ladderX - 4), worldY(WORLD.groundTop));
  ctx.lineTo(worldX(WORLD.ladderX - 4), worldY(WORLD.tunnelTop + 24));
  ctx.moveTo(worldX(WORLD.ladderX + 4), worldY(WORLD.groundTop));
  ctx.lineTo(worldX(WORLD.ladderX + 4), worldY(WORLD.tunnelTop + 24));
  ctx.stroke();

  for (let rung = 0; rung < 7; rung += 1) {
    const y = WORLD.groundTop + 6 + rung * 4;
    ctx.strokeStyle = rung % 2 === 0 ? "#ffce69" : "#74e8ff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(worldX(WORLD.ladderX - 4), worldY(y));
    ctx.lineTo(worldX(WORLD.ladderX + 4), worldY(y));
    ctx.stroke();
  }

  const wallX = state.scene.wallSide === "left" ? 10 : 142;
  ctx.fillStyle = "#36243f";
  ctx.fillRect(worldX(wallX), worldY(WORLD.tunnelTop), 8 * WORLD.scale, 24 * WORLD.scale);
  ctx.fillStyle = "#ffc85e";
  ctx.fillRect(worldX(wallX + 1), worldY(WORLD.tunnelTop + 4), 2 * WORLD.scale, 14 * WORLD.scale);
  ctx.fillStyle = "#73daff";
  ctx.fillRect(worldX(wallX + 4), worldY(WORLD.tunnelTop + 9), 2 * WORLD.scale, 2 * WORLD.scale);
  ctx.fillRect(worldX(wallX + 4), worldY(WORLD.tunnelTop + 15), 2 * WORLD.scale, 2 * WORLD.scale);
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

function cropWorldHeight(crop) {
  return crop.drawHeight / WORLD.scale;
}

function drawCropOnBaseline(sheet, crop, centerX, baselineY, flip = false, yOffset = 0) {
  return drawCrop(
    sheet,
    crop,
    worldX(centerX - crop.anchorX),
    worldY(baselineY - cropWorldHeight(crop) + yOffset),
    crop.drawWidth,
    crop.drawHeight,
    flip,
  );
}

function drawHero() {
  const heroSprite = spriteCrops.hero;
  const heroBaseline = state.player.y + GROUND_CONTACT_OFFSET + (state.player.stumbleFrames > 0 ? 1 : 0);
  const flicker = state.player.invulnerabilityFrames > 0 && state.frameCount % 4 < 2;
  if (flicker) {
    return;
  }

  ctx.fillStyle = "rgba(9, 18, 21, 0.38)";
  ctx.beginPath();
  ctx.ellipse(worldX(state.player.x), worldY(heroBaseline) - 4, 20, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  const heroGlow = ctx.createRadialGradient(worldX(state.player.x), worldY(heroBaseline - 14), 6, worldX(state.player.x), worldY(heroBaseline - 14), 28);
  heroGlow.addColorStop(0, "rgba(255, 208, 112, 0.18)");
  heroGlow.addColorStop(1, "rgba(255, 208, 112, 0)");
  ctx.fillStyle = heroGlow;
  ctx.beginPath();
  ctx.arc(worldX(state.player.x), worldY(heroBaseline - 14), 28, 0, Math.PI * 2);
  ctx.fill();

  const drawn = drawCropOnBaseline(
    assets.hero,
    heroSprite,
    state.player.x,
    heroBaseline,
    state.player.facing < 0,
  );

  if (!drawn) {
    const drawX = worldX(state.player.x - heroSprite.anchorX);
    const drawY = worldY(heroBaseline - cropWorldHeight(heroSprite));
    ctx.fillStyle = "#d7b07b";
    ctx.fillRect(drawX + 8, drawY + 4, 24, 34);
    ctx.fillStyle = "#533719";
    ctx.fillRect(drawX + 4, drawY, 32, 12);
  }
}

function drawLog(object) {
  const baseline = object.y + OBJECT_CONTACT_OFFSET;
  const x = worldX(object.x - 9);
  const y = worldY(baseline) - 24;
  ctx.fillStyle = "rgba(9, 18, 21, 0.26)";
  ctx.beginPath();
  ctx.ellipse(worldX(object.x), worldY(baseline) - 3, 16, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2b1738";
  ctx.fillRect(x, y + 6, 76, 20);
  ctx.fillStyle = "#60347d";
  ctx.fillRect(x + 4, y + 9, 68, 14);
  ctx.fillStyle = "#ffc45c";
  ctx.fillRect(x + 10, y + 12, 48, 2);
  ctx.fillRect(x + 18, y + 18, 36, 2);
  ctx.fillStyle = "#42d8ff";
  ctx.fillRect(x + 60, y + 11, 6, 8);
  ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
  ctx.fillRect(x + 14, y + 9, 22, 3);
  ctx.beginPath();
  ctx.fillStyle = "#8f6435";
  ctx.ellipse(x + 7, y + 16, 9, 10, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawFire(object) {
  const x = worldX(object.x);
  const y = worldY(object.y + 2);
  ctx.fillStyle = "rgba(9, 18, 21, 0.24)";
  ctx.beginPath();
  ctx.ellipse(worldX(object.x), worldY(object.y + OBJECT_CONTACT_OFFSET) - 3, 16, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(131, 64, 201, 0.48)";
  ctx.beginPath();
  ctx.ellipse(x, y + 34, 28, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffca5f";
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + 18, y + 24);
  ctx.lineTo(x, y + 42);
  ctx.lineTo(x - 18, y + 24);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#f591ff";
  ctx.beginPath();
  ctx.moveTo(x, y + 10);
  ctx.lineTo(x + 11, y + 25);
  ctx.lineTo(x, y + 35);
  ctx.lineTo(x - 11, y + 25);
  ctx.closePath();
  ctx.fill();
}

function drawTreasure(object) {
  const crop = spriteCrops.reference[object.crop];
  const baseline = object.y + OBJECT_CONTACT_OFFSET;
  ctx.fillStyle = "rgba(255, 210, 101, 0.14)";
  ctx.beginPath();
  ctx.arc(worldX(object.x), worldY(baseline) - 14, 16, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255, 201, 96, 0.22)";
  ctx.fillRect(worldX(object.x - 6), worldY(baseline) - 4, 12 * WORLD.scale, 2 * WORLD.scale);

  const drawn = drawCrop(assets.reference, crop, worldX(object.x - 11), worldY(baseline - 12), 44, 44, false);
  if (!drawn) {
    ctx.fillStyle = "#f4c55e";
    ctx.fillRect(worldX(object.x - 6), worldY(baseline - 8), 12 * WORLD.scale, 10 * WORLD.scale);
  }
}

function drawCobra(object) {
  const sprite = spriteCrops.roster.snake;
  const baseline = object.y + OBJECT_CONTACT_OFFSET;
  const drawn = drawCropOnBaseline(
    assets.roster,
    sprite,
    object.x,
    baseline,
    false,
  );
  if (!drawn) {
    ctx.fillStyle = "#5cbf4d";
    ctx.fillRect(worldX(object.x - 4), worldY(object.y), 8 * WORLD.scale, 14 * WORLD.scale);
  }
}

function drawCrocs() {
  if (state.scene.sceneType !== 4) {
    return;
  }

  const sprite = spriteCrops.roster.croc;
  CROC_HEADS.forEach((x) => {
    drawCropOnBaseline(
      assets.roster,
      sprite,
      x,
      WORLD.groundTop + 1,
      false,
    );
  });
}

function drawScorpion() {
  if (state.scene.ladder) {
    return;
  }

  const sprite = spriteCrops.roster.scorpion;
  drawCropOnBaseline(
    assets.roster,
    sprite,
    state.scorpionX,
    TUNNEL_CONTACT_Y,
    state.scorpionFacing < 0,
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
  ctx.fillStyle = "rgba(7, 8, 22, 0.72)";
  ctx.fillRect(28, 18, 494, 68);
  ctx.strokeStyle = "rgba(255, 203, 98, 0.42)";
  ctx.strokeRect(28.5, 18.5, 493, 67);
  ctx.fillStyle = "rgba(225, 171, 255, 0.95)";
  ctx.font = "700 14px Consolas";
  ctx.fillText("JACKPOT CHASE MODE", 46, 38);
  ctx.fillStyle = "rgba(255, 212, 114, 0.96)";
  ctx.font = "700 22px Georgia";
  ctx.fillText(state.scene.name, 46, 61);
  ctx.font = "14px Consolas";
  ctx.fillStyle = "rgba(150, 240, 255, 0.92)";
  ctx.fillText(`${BRAND_NAME.toUpperCase()} / Seed ${state.scene.seed.toString(16).padStart(2, "0").toUpperCase()} / ${state.scene.objectLabel}`, 46, 80);
}

function drawDepthOverlay() {
  const horizonMist = ctx.createLinearGradient(0, worldY(60), 0, worldY(120));
  horizonMist.addColorStop(0, "rgba(238, 161, 255, 0)");
  horizonMist.addColorStop(0.48, "rgba(238, 161, 255, 0.05)");
  horizonMist.addColorStop(1, "rgba(121, 228, 255, 0.09)");
  ctx.fillStyle = horizonMist;
  ctx.fillRect(0, worldY(60), canvas.width, worldY(120) - worldY(60));

  ctx.fillStyle = "rgba(4, 8, 18, 0.36)";
  for (let i = 0; i < 7; i += 1) {
    const baseX = 14 + i * 104 + ((state.frameCount >> 3) + i) % 6;
    const height = 42 + (i % 3) * 18;
    ctx.beginPath();
    ctx.moveTo(baseX, canvas.height);
    ctx.lineTo(baseX + 20, canvas.height - height);
    ctx.lineTo(baseX + 46, canvas.height - height - 10);
    ctx.lineTo(baseX + 28, canvas.height);
    ctx.closePath();
    ctx.fill();
  }

  const vignette = ctx.createRadialGradient(canvas.width / 2, canvas.height * 0.52, canvas.height * 0.18, canvas.width / 2, canvas.height * 0.52, canvas.height * 0.66);
  vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
  vignette.addColorStop(1, "rgba(1, 2, 7, 0.34)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawForegroundDepth() {
  ctx.fillStyle = "rgba(2, 6, 14, 0.72)";
  const leaves = [
    { x: 18, y: canvas.height - 16, spread: 32, height: 96 },
    { x: 84, y: canvas.height - 12, spread: 38, height: 84 },
    { x: canvas.width - 96, y: canvas.height - 8, spread: 42, height: 92 },
    { x: canvas.width - 34, y: canvas.height - 6, spread: 28, height: 98 },
  ];

  leaves.forEach((leaf) => {
    ctx.beginPath();
    ctx.moveTo(leaf.x, leaf.y);
    ctx.lineTo(leaf.x - leaf.spread, leaf.y - leaf.height);
    ctx.lineTo(leaf.x - leaf.spread * 0.14, leaf.y - leaf.height * 0.84);
    ctx.lineTo(leaf.x + leaf.spread * 0.16, leaf.y - leaf.height * 0.36);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(leaf.x, leaf.y);
    ctx.lineTo(leaf.x + leaf.spread, leaf.y - leaf.height * 0.92);
    ctx.lineTo(leaf.x + leaf.spread * 0.12, leaf.y - leaf.height * 0.76);
    ctx.lineTo(leaf.x - leaf.spread * 0.1, leaf.y - leaf.height * 0.22);
    ctx.closePath();
    ctx.fill();
  });
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
  drawDepthOverlay();
  drawSceneInfo();
  drawForegroundDepth();
}

function loop(timestamp) {
  if (!state.running || state.paused || state.gameOver) {
    drawScene();
    return;
  }

  const delta = Math.min((timestamp - state.lastTime) / 1000, 0.1);
  state.lastTime = timestamp;
  state.frameAccumulator += delta;

  while (state.frameAccumulator >= FRAME_TIME && state.running && !state.gameOver) {
    state.frameAccumulator -= FRAME_TIME;
    updateTick();
  }

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

  if (event.code === "ArrowUp" || event.code === "KeyW") {
    event.preventDefault();
    setMoveInput("up", true);
  }

  if (event.code === "ArrowDown" || event.code === "KeyS") {
    event.preventDefault();
    setMoveInput("down", true);
    state.input.useQueued = true;
  }

  if (event.code === "Space" && !event.repeat) {
    event.preventDefault();
    state.input.jumpQueued = true;
  }

  if (event.code === "KeyE" && !event.repeat) {
    event.preventDefault();
    state.input.useQueued = true;
  }
});

window.addEventListener("keyup", (event) => {
  if (event.code === "ArrowLeft" || event.code === "KeyA") {
    setMoveInput("left", false);
  }

  if (event.code === "ArrowRight" || event.code === "KeyD") {
    setMoveInput("right", false);
  }

  if (event.code === "ArrowUp" || event.code === "KeyW") {
    setMoveInput("up", false);
  }

  if (event.code === "ArrowDown" || event.code === "KeyS") {
    setMoveInput("down", false);
  }
});

startButton.addEventListener("click", startGame);
resumeButton.addEventListener("click", () => togglePause(false));
restartButton.addEventListener("click", startGame);
pauseButton.addEventListener("click", () => togglePause());
jumpButton.addEventListener("click", () => {
  state.input.jumpQueued = true;
});
useButton.addEventListener("click", () => {
  state.input.useQueued = true;
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
  state.input.up = false;
  state.input.down = false;
});

assets.hero.addEventListener("load", () => drawScene());
assets.roster.addEventListener("load", () => drawScene());
assets.reference.addEventListener("load", () => drawScene());

resetRun();
bestScoreNode.textContent = String(state.bestScore);
drawScene();
