// 사다리게임 설정값
const LADDER_ROWS = 8;
const ROW_HEIGHT = 48;
const TOP_PAD = 15;
const PATH_COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];
const FLOW_SPEED = 80; // px/초 - 물 흐르는 속도

const ANIMAL_NAMES = [
  "🐶 강아지", "🐱 고양이", "🐭 햄스터", "🐰 토끼", "🦊 여우",
  "🐻 곰", "🐼 판다", "🐨 코알라", "🐯 호랑이", "🦁 사자",
  "🐸 개구리", "🐧 펭귄", "🐦 참새", "🦆 오리", "🦋 나비",
  "🐢 거북이", "🦎 도마뱀", "🐳 고래", "🦈 상어", "🦓 얼룩말",
  "🦒 기린", "🐘 코끼리", "🦏 코뿔소", "🦛 하마", "🐊 악어",
  "🦜 앵무새", "🦩 홍학", "🦚 공작", "🐺 늑대", "🦝 너구리",
];

// 중복 없는 랜덤 동물 이름 뽑기
function pickAnimalNames(count) {
  const shuffled = [...ANIMAL_NAMES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

let ladderPlayers = pickAnimalNames(2);
let ladderResults = ["결과 1", "결과 2"];
let ladderBars = [];
let ladderPaths = {}; // col -> { points, finalCol, colorIdx, segments }
let nextColorIdx = 0;
let ladderGenerated = false;
let ladderReady = false;
let animationId = null;

function colSpacing() {
  return Math.max(100, Math.floor(400 / ladderPlayers.length));
}
function colX(col) { return colSpacing() / 2 + col * colSpacing(); }
function rowY(row)  { return TOP_PAD + row * ROW_HEIGHT; }
function canvasW()  { return ladderPlayers.length * colSpacing(); }
function canvasH()  { return TOP_PAD + LADDER_ROWS * ROW_HEIGHT + TOP_PAD; }
function getCanvas() { return document.getElementById("ladderCanvas"); }

// 사다리 무작위 생성
function generateLadder() {
  if (animationId) { cancelAnimationFrame(animationId); animationId = null; }
  ladderBars = [];
  ladderPaths = {};
  nextColorIdx = 0;

  for (let row = 0; row < LADDER_ROWS; row++) {
    const used = new Set();
    for (let col = 0; col < ladderPlayers.length - 1; col++) {
      if (!used.has(col) && !used.has(col + 1) && Math.random() < 0.45) {
        ladderBars.push({ row, col });
        used.add(col);
        used.add(col + 1);
      }
    }
  }

  ladderGenerated = true;
  drawAll();
  document.getElementById("ladderResultDisplay").innerHTML = "";
}

// 경로 포인트 계산
function buildPath(startCol) {
  let col = startCol;
  const points = [{ x: colX(col), y: rowY(0) }];

  for (let row = 0; row < LADDER_ROWS; row++) {
    const midY = rowY(row) + ROW_HEIGHT / 2;
    points.push({ x: colX(col), y: midY });

    const goRight = ladderBars.find(b => b.row === row && b.col === col);
    const goLeft  = ladderBars.find(b => b.row === row && b.col === col - 1);

    if (goRight)     { col++; points.push({ x: colX(col), y: midY }); }
    else if (goLeft) { col--; points.push({ x: colX(col), y: midY }); }

    points.push({ x: colX(col), y: rowY(row + 1) });
  }
  return { points, finalCol: col };
}

// 포인트 → 세그먼트 변환
function toSegments(points) {
  return points.slice(1).map((p, i) => {
    const dx = p.x - points[i].x;
    const dy = p.y - points[i].y;
    return { from: points[i], to: p, len: Math.sqrt(dx * dx + dy * dy) };
  });
}

// 경로 공개 (물 흐르는 애니메이션)
function revealLadderPath(playerCol) {
  if (!ladderGenerated) {
    alert("먼저 '사다리 생성' 버튼을 눌러주세요!");
    return;
  }

  // 이미 공개된 경우 토글 취소
  if (ladderPaths[playerCol]) {
    delete ladderPaths[playerCol];
    drawAll();
    updateLadderResultDisplay();
    return;
  }

  const { points, finalCol } = buildPath(playerCol);
  const segments = toSegments(points);
  const totalLen = segments.reduce((s, seg) => s + seg.len, 0);
  const colorIdx = nextColorIdx++;
  const color = PATH_COLORS[colorIdx % PATH_COLORS.length];

  if (animationId) { cancelAnimationFrame(animationId); animationId = null; }

  let startTime = null;

  function animate(now) {
    if (!startTime) startTime = now;
    const drawnLen = Math.min(((now - startTime) / 1000) * FLOW_SPEED, totalLen);

    drawAll({ segments, drawnLen, color });

    if (drawnLen < totalLen) {
      animationId = requestAnimationFrame(animate);
    } else {
      animationId = null;
      // 완료 → 경로 저장 후 결과 표시
      ladderPaths[playerCol] = { points, finalCol, colorIdx, segments };
      drawAll();
      updateLadderResultDisplay();
    }
  }

  requestAnimationFrame(animate);
}

// 전체 캔버스 그리기
function drawAll(partialPath = null) {
  const canvas = getCanvas();
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 세로줄
  ctx.strokeStyle = "#94a3b8";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  for (let col = 0; col < ladderPlayers.length; col++) {
    ctx.beginPath();
    ctx.moveTo(colX(col), rowY(0));
    ctx.lineTo(colX(col), rowY(LADDER_ROWS));
    ctx.stroke();
  }

  // 가로줄
  ctx.strokeStyle = "#64748b";
  ctx.lineWidth = 3;
  for (const bar of ladderBars) {
    const y = rowY(bar.row) + ROW_HEIGHT / 2;
    ctx.beginPath();
    ctx.moveTo(colX(bar.col), y);
    ctx.lineTo(colX(bar.col + 1), y);
    ctx.stroke();
  }

  // 완료된 경로들
  for (const { points, colorIdx } of Object.values(ladderPaths)) {
    drawCompletedPath(ctx, points, PATH_COLORS[colorIdx % PATH_COLORS.length]);
  }

  // 애니메이션 중인 경로
  if (partialPath) {
    drawFlowingPath(ctx, partialPath.segments, partialPath.drawnLen, partialPath.color);
  }
}

function drawCompletedPath(ctx, points, color) {
  ctx.strokeStyle = color + "cc"; // 약간 투명
  ctx.lineWidth = 5;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.stroke();

  // 시작·끝 원
  ctx.fillStyle = color;
  [points[0], points[points.length - 1]].forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
    ctx.fill();
  });
}

// 물 흐르는 애니메이션 경로
function drawFlowingPath(ctx, segments, drawnLen, color) {
  let remaining = drawnLen;
  let headX = segments[0].from.x;
  let headY = segments[0].from.y;

  ctx.strokeStyle = color + "cc";
  ctx.lineWidth = 5;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(segments[0].from.x, segments[0].from.y);

  for (const seg of segments) {
    if (remaining <= 0) break;
    const t = Math.min(remaining / seg.len, 1);
    const ex = seg.from.x + (seg.to.x - seg.from.x) * t;
    const ey = seg.from.y + (seg.to.y - seg.from.y) * t;
    ctx.lineTo(ex, ey);
    headX = ex;
    headY = ey;
    remaining -= seg.len;
  }
  ctx.stroke();

  // 물방울 글로우 (외부)
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = 20;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(headX, headY, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 물방울 내부 흰 점
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.beginPath();
  ctx.arc(headX, headY, 3.5, 0, Math.PI * 2);
  ctx.fill();
}

// 결과 배지 업데이트
function updateLadderResultDisplay() {
  const display = document.getElementById("ladderResultDisplay");
  const entries = Object.entries(ladderPaths)
    .sort((a, b) => a[1].colorIdx - b[1].colorIdx);

  if (entries.length === 0) { display.innerHTML = ""; return; }

  display.innerHTML =
    `<div class="flex flex-wrap gap-2 justify-center">` +
    entries.map(([col, { finalCol, colorIdx }]) => {
      const color = PATH_COLORS[colorIdx % PATH_COLORS.length];
      const pName = ladderPlayers[parseInt(col)]  || `참가자 ${parseInt(col) + 1}`;
      const rName = ladderResults[finalCol] || `결과 ${finalCol + 1}`;
      return `<span class="inline-flex items-center gap-1 px-4 py-1.5 rounded-full text-sm font-semibold text-white"
        style="background:${color}">
        ${escapeHtml(pName)} → ${escapeHtml(rName)}
      </span>`;
    }).join("") +
    `</div>`;
}

// 참가자 추가 (1명씩)
function addLadderPlayer() {
  const n = ladderPlayers.length + 1;
  const used = new Set(ladderPlayers);
  const available = ANIMAL_NAMES.filter(a => !used.has(a));
  const newName = available.length > 0
    ? available[Math.floor(Math.random() * available.length)]
    : `참가자 ${n}`;
  ladderPlayers.push(newName);
  ladderResults.push(`결과 ${n}`);

  // 캔버스를 참가자 수에 맞게 먼저 리사이즈
  const canvas = getCanvas();
  canvas.width = canvasW();
  canvas.height = canvasH();

  renderLadderInputs();
  _resetLadderState();
  drawAll();
  document.getElementById("ladderResultDisplay").innerHTML = "";
}

// 참가자 초기화 (2명으로 리셋)
function resetLadderPlayers() {
  ladderPlayers = pickAnimalNames(2);
  ladderResults = ["결과 1", "결과 2"];
  ladderReady = false;
  _resetLadderState();
  const canvas = getCanvas();
  canvas.width = canvasW();
  canvas.height = canvasH();
  renderLadderInputs();
  drawAll();
  document.getElementById("ladderResultDisplay").innerHTML = "";
}

// 전체 경로 순차 공개 (물 흐르는 애니메이션)
function revealAllPaths() {
  if (!ladderGenerated) {
    alert("먼저 '사다리 생성' 버튼을 눌러주세요!");
    return;
  }

  // 이미 모두 공개된 경우 초기화
  if (Object.keys(ladderPaths).length === ladderPlayers.length) {
    ladderPaths = {};
    nextColorIdx = 0;
    drawAll();
    updateLadderResultDisplay();
    return;
  }

  // 아직 공개 안 된 참가자 목록
  const pending = ladderPlayers
    .map((_, idx) => idx)
    .filter(idx => !ladderPaths[idx]);

  let i = 0;

  function revealNext() {
    if (i >= pending.length) return;
    const playerCol = pending[i++];

    const { points, finalCol } = buildPath(playerCol);
    const segments = toSegments(points);
    const totalLen = segments.reduce((s, seg) => s + seg.len, 0);
    const colorIdx = nextColorIdx++;
    const color = PATH_COLORS[colorIdx % PATH_COLORS.length];

    if (animationId) { cancelAnimationFrame(animationId); animationId = null; }

    let startTime = null;

    function animate(now) {
      if (!startTime) startTime = now;
      const drawnLen = Math.min(((now - startTime) / 1000) * FLOW_SPEED, totalLen);

      drawAll({ segments, drawnLen, color });

      if (drawnLen < totalLen) {
        animationId = requestAnimationFrame(animate);
      } else {
        animationId = null;
        ladderPaths[playerCol] = { points, finalCol, colorIdx, segments };
        drawAll();
        updateLadderResultDisplay();
        revealNext(); // 다음 참가자 순차 공개
      }
    }

    requestAnimationFrame(animate);
  }

  revealNext();
}

// 경로/사다리 초기화
function resetLadder() {
  _resetLadderState();
  drawAll();
  document.getElementById("ladderResultDisplay").innerHTML = "";
}

function _resetLadderState() {
  if (animationId) { cancelAnimationFrame(animationId); animationId = null; }
  ladderBars = [];
  ladderPaths = {};
  nextColorIdx = 0;
  ladderGenerated = false;
}

// 입력 행 렌더링
function renderLadderInputs() {
  const spacing = colSpacing();
  const totalW = canvasW();

  const playerRow = document.getElementById("ladderPlayerRow");
  playerRow.style.width = totalW + "px";
  playerRow.innerHTML = ladderPlayers.map((name, idx) => `
    <div style="width:${spacing}px" class="flex flex-col items-center gap-1">
      <input type="text" value="${attrEscape(name)}"
        oninput="ladderPlayers[${idx}] = this.value"
        class="w-20 text-center text-xs border border-gray-300 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-400" />
      <button onclick="revealLadderPath(${idx})"
        class="text-xs px-2 py-0.5 rounded text-white font-medium transition"
        style="background:${PATH_COLORS[idx % PATH_COLORS.length]}">확인</button>
    </div>`).join("");

  const resultRow = document.getElementById("ladderResultRow");
  resultRow.style.width = totalW + "px";
  resultRow.innerHTML = ladderResults.map((name, idx) => `
    <div style="width:${spacing}px" class="flex justify-center">
      <input type="text" value="${attrEscape(name)}"
        oninput="ladderResults[${idx}] = this.value"
        class="w-20 text-center text-xs border border-gray-300 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-400" />
    </div>`).join("");
}

function attrEscape(str) {
  return String(str)
    .replace(/&/g,"&amp;").replace(/"/g,"&quot;")
    .replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

function initLadderGame() {
  if (ladderReady) return;
  ladderReady = true;
  const canvas = getCanvas();
  canvas.width = canvasW();
  canvas.height = canvasH();
  renderLadderInputs();
  drawAll();
}
