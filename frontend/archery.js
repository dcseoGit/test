// 화살 과녁 맞추기 게임

const ARCH = {
  W: 800, H: 460,
  BOW_X: 90,  BOW_Y: 310,
  TARGET_X: 670, TARGET_Y: 250,
  POWER: 750,
  GRAVITY: 620,
  MAX_ARROWS: 5,
  RINGS: [
    { r: 14, score: 10, color: "#fbbf24" },
    { r: 28, score: 8,  color: "#ef4444" },
    { r: 46, score: 6,  color: "#3b82f6" },
    { r: 64, score: 4,  color: "#1e293b" },
    { r: 84, score: 2,  color: "#f1f5f9" },
  ],
};

let archMouse      = { x: 400, y: ARCH.BOW_Y - 60 };
let archArrows     = [];      // 박힌 화살 목록
let archFlying     = null;    // 현재 날아가는 화살
let archArrowsLeft = ARCH.MAX_ARROWS;
let archScore      = 0;
let archLastResult = null;    // { score, x, y }
let archState      = "aiming"; // aiming | flying | gameover
let archReady      = false;
let archAnimId     = null;

function getArchCanvas() { return document.getElementById("archeryCanvas"); }

function getAimAngle() {
  return Math.atan2(archMouse.y - ARCH.BOW_Y, archMouse.x - ARCH.BOW_X);
}

// 궤도 미리보기 포인트 계산
function getTrajectoryPoints(angle) {
  const vx = ARCH.POWER * Math.cos(angle);
  const vy = ARCH.POWER * Math.sin(angle);
  const pts = [];
  for (let i = 0; i <= 40; i++) {
    const t = i * 0.05;
    const x = ARCH.BOW_X + vx * t;
    const y = ARCH.BOW_Y + vy * t + 0.5 * ARCH.GRAVITY * t * t;
    pts.push({ x, y });
    if (x > ARCH.W + 20 || y > ARCH.H + 30 || y < -80) break;
  }
  return pts;
}

// Y 위치로 점수 계산 (화살이 TARGET_X에 도달했을 때)
function calcScore(hitY) {
  const dist = Math.abs(hitY - ARCH.TARGET_Y);
  for (const ring of ARCH.RINGS) {
    if (dist <= ring.r) return ring.score;
  }
  return 0;
}

// 화살 발사
function shootArrow() {
  if (archState !== "aiming" || archArrowsLeft <= 0) return;
  const angle = getAimAngle();
  archFlying = {
    x: ARCH.BOW_X, y: ARCH.BOW_Y,
    vx: ARCH.POWER * Math.cos(angle),
    vy: ARCH.POWER * Math.sin(angle),
    t: 0, angle,
  };
  archState = "flying";
  archLastResult = null;
}

// 게임 메인 루프
function archLoop() {
  if (archFlying) {
    const prevX = archFlying.x;
    archFlying.t += 0.016;
    archFlying.x  = ARCH.BOW_X + archFlying.vx * archFlying.t;
    archFlying.y  = ARCH.BOW_Y + archFlying.vy * archFlying.t + 0.5 * ARCH.GRAVITY * archFlying.t * archFlying.t;
    archFlying.angle = Math.atan2(
      archFlying.vy + ARCH.GRAVITY * archFlying.t,
      archFlying.vx
    );

    // 과녁 X 통과 → 적중 판정
    if (prevX < ARCH.TARGET_X && archFlying.x >= ARCH.TARGET_X) {
      const score = calcScore(archFlying.y);
      archArrows.push({ x: ARCH.TARGET_X, y: archFlying.y, angle: archFlying.angle, score });
      archLastResult = { score, x: ARCH.TARGET_X, y: Math.max(10, Math.min(ARCH.H - 10, archFlying.y)) };
      archScore += score;
      archArrowsLeft--;
      archFlying = null;
      archState = archArrowsLeft > 0 ? "aiming" : "gameover";
      updateArchUI();
      if (archState === "gameover") setTimeout(showArchGameover, 600);
    }

    // 화면 이탈 → 빗나감
    if (archFlying && (
      archFlying.x > ARCH.W + 40 ||
      archFlying.y > ARCH.H + 40 ||
      archFlying.y < -100
    )) {
      archLastResult = { score: 0, x: ARCH.TARGET_X, y: ARCH.TARGET_Y };
      archArrowsLeft--;
      archFlying = null;
      archState = archArrowsLeft > 0 ? "aiming" : "gameover";
      updateArchUI();
      if (archState === "gameover") setTimeout(showArchGameover, 600);
    }
  }

  drawArchery();
  archAnimId = requestAnimationFrame(archLoop);
}

// ── 그리기 함수들 ────────────────────────────────────────

function drawArchery() {
  const canvas = getArchCanvas();
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, ARCH.W, ARCH.H);

  drawBackground(ctx);
  drawTarget(ctx);
  archArrows.forEach(a => drawArrowShape(ctx, a.x, a.y, a.angle));
  if (archFlying) drawArrowShape(ctx, archFlying.x, archFlying.y, archFlying.angle);
  if (archState === "aiming") drawTrajectory(ctx);
  drawBow(ctx);
  if (archLastResult) drawResultLabel(ctx, archLastResult);
}

function drawBackground(ctx) {
  // 하늘
  const sky = ctx.createLinearGradient(0, 0, 0, ARCH.H * 0.72);
  sky.addColorStop(0, "#93c5fd");
  sky.addColorStop(1, "#dbeafe");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, ARCH.W, ARCH.H * 0.72);

  // 언덕
  ctx.fillStyle = "#86efac";
  ctx.beginPath();
  ctx.moveTo(0, ARCH.H * 0.72);
  ctx.lineTo(0, ARCH.H * 0.58);
  ctx.quadraticCurveTo(200, ARCH.H * 0.35, 400, ARCH.H * 0.55);
  ctx.quadraticCurveTo(550, ARCH.H * 0.38, ARCH.W, ARCH.H * 0.50);
  ctx.lineTo(ARCH.W, ARCH.H * 0.72);
  ctx.closePath();
  ctx.fill();

  // 땅
  ctx.fillStyle = "#4ade80";
  ctx.fillRect(0, ARCH.H * 0.72, ARCH.W, ARCH.H * 0.28);
  ctx.fillStyle = "#86efac";
  ctx.fillRect(0, ARCH.H * 0.72, ARCH.W, 6);
}

function drawTarget(ctx) {
  const outerR = ARCH.RINGS[ARCH.RINGS.length - 1].r;

  // 기둥
  ctx.fillStyle = "#92400e";
  ctx.fillRect(ARCH.TARGET_X - 5, ARCH.TARGET_Y + outerR, 10, ARCH.H * 0.72 - ARCH.TARGET_Y - outerR);

  // 링 (바깥 → 안쪽 순)
  [...ARCH.RINGS].reverse().forEach(ring => {
    ctx.beginPath();
    ctx.arc(ARCH.TARGET_X, ARCH.TARGET_Y, ring.r, 0, Math.PI * 2);
    ctx.fillStyle = ring.color;
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.2)";
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  // 십자선
  ctx.strokeStyle = "rgba(0,0,0,0.15)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(ARCH.TARGET_X - outerR, ARCH.TARGET_Y);
  ctx.lineTo(ARCH.TARGET_X + outerR, ARCH.TARGET_Y);
  ctx.moveTo(ARCH.TARGET_X, ARCH.TARGET_Y - outerR);
  ctx.lineTo(ARCH.TARGET_X, ARCH.TARGET_Y + outerR);
  ctx.stroke();
}

function drawBow(ctx) {
  const angle = archState !== "flying"
    ? getAimAngle()
    : (archArrows.length > 0 ? archArrows[archArrows.length - 1].angle : 0);

  ctx.save();
  ctx.translate(ARCH.BOW_X, ARCH.BOW_Y);
  ctx.rotate(angle);

  // 활 호
  ctx.strokeStyle = "#92400e";
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(0, 0, 38, -0.38 * Math.PI, 0.38 * Math.PI);
  ctx.stroke();

  // 시위
  const ex = 38 * Math.cos(0.38 * Math.PI);
  const ey = 38 * Math.sin(0.38 * Math.PI);
  ctx.strokeStyle = "#d97706";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(ex, -ey);
  ctx.lineTo(ex + 7, 0);
  ctx.lineTo(ex, ey);
  ctx.stroke();

  // 화살 (조준 중에만 표시)
  if (archState === "aiming") {
    // 화살대
    ctx.strokeStyle = "#78350f";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-26, 0);
    ctx.lineTo(48, 0);
    ctx.stroke();

    // 화살촉
    ctx.fillStyle = "#374151";
    ctx.beginPath();
    ctx.moveTo(48, 0);
    ctx.lineTo(37, -5);
    ctx.lineTo(37, 5);
    ctx.closePath();
    ctx.fill();

    // 깃털 (위아래)
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.moveTo(-26, 0); ctx.lineTo(-19, -7); ctx.lineTo(-15, 0);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-26, 0); ctx.lineTo(-19, 7); ctx.lineTo(-15, 0);
    ctx.closePath(); ctx.fill();
  }

  ctx.restore();
}

function drawArrowShape(ctx, x, y, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  // 화살대
  ctx.strokeStyle = "#92400e";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-22, 0);
  ctx.lineTo(18, 0);
  ctx.stroke();

  // 화살촉
  ctx.fillStyle = "#374151";
  ctx.beginPath();
  ctx.moveTo(18, 0); ctx.lineTo(9, -4); ctx.lineTo(9, 4);
  ctx.closePath(); ctx.fill();

  // 깃털
  ctx.fillStyle = "#ef4444";
  ctx.beginPath();
  ctx.moveTo(-22, 0); ctx.lineTo(-16, -6); ctx.lineTo(-12, 0);
  ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-22, 0); ctx.lineTo(-16, 6); ctx.lineTo(-12, 0);
  ctx.closePath(); ctx.fill();

  ctx.restore();
}

function drawTrajectory(ctx) {
  const pts = getTrajectoryPoints(getAimAngle());
  ctx.setLineDash([6, 6]);
  ctx.strokeStyle = "rgba(99,102,241,0.45)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawResultLabel(ctx, { score, x, y }) {
  const text  = score === 0 ? "MISS!" : `+${score}점`;
  const color = score === 10 ? "#f59e0b"
              : score >= 6  ? "#3b82f6"
              : score >= 2  ? "#475569"
              : "#ef4444";
  ctx.save();
  ctx.font = "bold 22px sans-serif";
  ctx.textAlign = "center";
  ctx.lineWidth = 5;
  ctx.strokeStyle = "white";
  ctx.strokeText(text, x, y - 20);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y - 20);
  ctx.restore();
}

// ── UI 업데이트 ──────────────────────────────────────────

function updateArchUI() {
  document.getElementById("archArrowsLeft").textContent = archArrowsLeft;
  document.getElementById("archScore").textContent = archScore;
}

function showArchGameover() {
  const grade =
    archScore >= 45 ? "🏆 퍼펙트!" :
    archScore >= 35 ? "🥇 훌륭해요!" :
    archScore >= 25 ? "🥈 잘했어요!" :
    archScore >= 15 ? "🥉 괜찮아요!" : "😅 더 연습해봐요!";

  document.getElementById("archFinalScore").textContent = archScore;
  document.getElementById("archGrade").textContent = grade;
  document.getElementById("archGameover").classList.remove("hidden");
}

function restartArchery() {
  document.getElementById("archGameover").classList.add("hidden");
  archArrows = [];
  archFlying = null;
  archArrowsLeft = ARCH.MAX_ARROWS;
  archScore = 0;
  archLastResult = null;
  archState = "aiming";
  updateArchUI();
}

// ── 초기화 ───────────────────────────────────────────────

function initArcheryGame() {
  if (archReady) return;
  archReady = true;

  const canvas = getArchCanvas();

  canvas.addEventListener("mousemove", e => {
    const rect   = canvas.getBoundingClientRect();
    const scaleX = ARCH.W / rect.width;
    const scaleY = ARCH.H / rect.height;
    archMouse.x  = (e.clientX - rect.left) * scaleX;
    archMouse.y  = (e.clientY - rect.top)  * scaleY;
  });

  canvas.addEventListener("click", () => {
    if (archState === "aiming") shootArrow();
  });

  updateArchUI();
  archAnimId = requestAnimationFrame(archLoop);
}
