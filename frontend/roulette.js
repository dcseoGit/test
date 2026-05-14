const ROULETTE_ICONS = [
  "🎯","🎲","🎪","🎨","🎭","🎬","🏆","🥇","🎁","🎉",
  "🍀","⭐","🌟","🔥","💎","🍕","🍔","🍜","🍣","🍗",
  "🍦","🍺","☕","🎵","🎮","⚽","🏀","🎾","🚀","🌺",
  "🐶","🐱","🐰","🦊","🐻","🦁","🐸","🦋","🌈","💫",
];

let selectedRouletteIcon = "🎯";
let iconPickerOpen = false;

const ROULETTE_COLORS = [
  "#f87171","#fb923c","#fbbf24","#4ade80",
  "#34d399","#22d3ee","#60a5fa","#a78bfa",
  "#f472b6","#94a3b8","#f97316","#84cc16",
];

const R_SIZE   = 360;
const R_CENTER = R_SIZE / 2;
const R_RADIUS = 155;

let rouletteItems    = ["🍕 피자","🍔 햄버거","🍜 라면","🍱 도시락","🍣 초밥","🍗 치킨"];
let rouletteAngle    = -Math.PI / 2; // 첫 항목이 12시 방향 시작
let rouletteSpinning = false;
let rouletteAnimId   = null;
let rouletteReady    = false;

// 룰렛 휠 그리기
function drawWheel(angle) {
  const canvas = document.getElementById("rouletteCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const n = rouletteItems.length;
  if (n === 0) return;

  ctx.clearRect(0, 0, R_SIZE, R_SIZE);

  const sliceAngle = (2 * Math.PI) / n;

  for (let i = 0; i < n; i++) {
    const start = angle + i * sliceAngle;
    const end   = start + sliceAngle;
    const color = ROULETTE_COLORS[i % ROULETTE_COLORS.length];

    // 부채꼴
    ctx.beginPath();
    ctx.moveTo(R_CENTER, R_CENTER);
    ctx.arc(R_CENTER, R_CENTER, R_RADIUS, start, end);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.stroke();

    // 텍스트
    ctx.save();
    ctx.translate(R_CENTER, R_CENTER);
    ctx.rotate(start + sliceAngle / 2);
    ctx.textAlign = "right";
    ctx.fillStyle = "white";
    ctx.font = `bold ${n > 8 ? 11 : 13}px sans-serif`;
    ctx.shadowColor = "rgba(0,0,0,0.6)";
    ctx.shadowBlur = 3;
    const label = rouletteItems[i].length > 10
      ? rouletteItems[i].slice(0, 9) + "…"
      : rouletteItems[i];
    ctx.fillText(label, R_RADIUS - 12, 5);
    ctx.restore();
  }

  // 중앙 원
  ctx.save();
  ctx.beginPath();
  ctx.arc(R_CENTER, R_CENTER, 18, 0, Math.PI * 2);
  ctx.fillStyle = "white";
  ctx.shadowColor = "rgba(0,0,0,0.2)";
  ctx.shadowBlur = 8;
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(R_CENTER, R_CENTER, 18, 0, Math.PI * 2);
  ctx.stroke();

  // 포인터 (상단 고정 삼각형)
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(R_CENTER, 20);
  ctx.lineTo(R_CENTER - 13, 0);
  ctx.lineTo(R_CENTER + 13, 0);
  ctx.closePath();
  ctx.fillStyle = "#1e293b";
  ctx.shadowColor = "rgba(0,0,0,0.4)";
  ctx.shadowBlur = 6;
  ctx.fill();
  ctx.restore();
}

// 돌리기
function spinRoulette() {
  if (rouletteSpinning) return;
  if (rouletteItems.length < 2) {
    alert("항목을 2개 이상 추가해 주세요!");
    return;
  }

  const n = rouletteItems.length;
  const sliceAngle = (2 * Math.PI) / n;
  const winnerIdx  = Math.floor(Math.random() * n);

  // 당첨 항목 중심이 포인터(12시 = -π/2)에 오도록 최종 각도 계산
  const targetBase = -Math.PI / 2 - (winnerIdx + 0.5) * sliceAngle;
  const minAngle   = rouletteAngle + 6 * 2 * Math.PI;
  const k          = Math.ceil((minAngle - targetBase) / (2 * Math.PI));
  const finalAngle = targetBase + k * 2 * Math.PI;

  const startAngle    = rouletteAngle;
  const totalRotation = finalAngle - startAngle;
  const duration      = 4500 + Math.random() * 1500; // 4.5~6초
  const startTime     = performance.now();

  rouletteSpinning = true;
  document.getElementById("rouletteResult").innerHTML = "";

  function animate(now) {
    const elapsed = Math.min(now - startTime, duration);
    const t       = elapsed / duration;
    const eased   = 1 - Math.pow(1 - t, 4); // ease-out quart

    rouletteAngle = startAngle + totalRotation * eased;
    drawWheel(rouletteAngle);

    if (t < 1) {
      rouletteAnimId = requestAnimationFrame(animate);
    } else {
      rouletteAngle    = finalAngle;
      rouletteSpinning = false;
      rouletteAnimId   = null;
      drawWheel(rouletteAngle);
      showRouletteResult(winnerIdx);
    }
  }

  requestAnimationFrame(animate);
}

// 결과 표시 + 팝업
function showRouletteResult(winnerIdx) {
  const item  = rouletteItems[winnerIdx];
  const color = ROULETTE_COLORS[winnerIdx % ROULETTE_COLORS.length];

  document.getElementById("rouletteResult").innerHTML = `
    <div class="flex items-center justify-center gap-2 bg-white rounded-xl shadow-md px-5 py-3 border-l-4"
      style="border-color:${color}">
      <span class="text-xl">🎉</span>
      <span class="text-lg font-bold" style="color:${color}">${escapeHtml(item)}</span>
      <span class="text-xl">🎉</span>
    </div>`;

  const el = document.createElement("div");
  Object.assign(el.style, {
    position: "fixed", top: "50%", left: "50%",
    transform: "translate(-50%, -50%) scale(0.6)",
    zIndex: "200", opacity: "0", pointerEvents: "none",
    transition: "opacity 0.25s ease, transform 0.25s ease",
  });
  el.innerHTML = `
    <div class="bg-white rounded-2xl shadow-2xl px-10 py-7 text-center"
      style="border:4px solid ${color};min-width:200px">
      <div style="font-size:3rem;line-height:1">🎰</div>
      <div class="mt-3 text-xl font-bold" style="color:${color}">${escapeHtml(item)}</div>
      <div class="text-gray-500 text-sm mt-1">당첨!</div>
    </div>`;
  document.body.appendChild(el);

  requestAnimationFrame(() => requestAnimationFrame(() => {
    el.style.opacity = "1";
    el.style.transform = "translate(-50%, -50%) scale(1)";
  }));
  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transform = "translate(-50%, -50%) scale(0.6)";
    setTimeout(() => el.remove(), 300);
  }, 2500);
}

// 아이콘 픽커 토글
function toggleIconPicker() {
  iconPickerOpen = !iconPickerOpen;
  document.getElementById("rouletteIconPicker").classList.toggle("hidden", !iconPickerOpen);
}

// 아이콘 선택
function selectRouletteIcon(icon) {
  selectedRouletteIcon = icon;
  document.getElementById("rouletteIconBtn").textContent = icon;
  iconPickerOpen = false;
  document.getElementById("rouletteIconPicker").classList.add("hidden");
}

// 아이콘 픽커 렌더링
function renderIconPicker() {
  document.getElementById("rouletteIconPicker").innerHTML =
    ROULETTE_ICONS.map(icon =>
      `<button onclick="selectRouletteIcon('${icon}')"
        class="text-xl hover:scale-125 transition-transform p-0.5 leading-none">${icon}</button>`
    ).join("");
}

// 항목 추가 (선택된 아이콘 자동 합성)
function addRouletteItem() {
  const input = document.getElementById("rouletteInput");
  const val   = input.value.trim();
  if (!val) return;
  rouletteItems.push(`${selectedRouletteIcon} ${val}`);
  input.value = "";
  renderRouletteList();
  drawWheel(rouletteAngle);
}

// 항목 삭제
function removeRouletteItem(idx) {
  if (rouletteItems.length <= 2) return;
  rouletteItems.splice(idx, 1);
  renderRouletteList();
  drawWheel(rouletteAngle);
}

// 항목 목록 렌더링
function renderRouletteList() {
  const list = document.getElementById("rouletteList");
  list.innerHTML = rouletteItems.map((item, idx) => `
    <div class="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm">
      <span class="w-3 h-3 rounded-full shrink-0"
        style="background:${ROULETTE_COLORS[idx % ROULETTE_COLORS.length]}"></span>
      <span class="text-sm flex-1 truncate">${escapeHtml(item)}</span>
      <button onclick="removeRouletteItem(${idx})"
        class="text-gray-300 hover:text-red-500 font-bold text-lg leading-none transition shrink-0">×</button>
    </div>`).join("");
}

function initRouletteGame() {
  if (rouletteReady) return;
  rouletteReady = true;

  document.getElementById("rouletteInput").addEventListener("keydown", e => {
    if (e.key === "Enter") addRouletteItem();
  });

  // 픽커 외부 클릭 시 닫기
  document.addEventListener("click", e => {
    if (iconPickerOpen &&
        !e.target.closest("#rouletteIconPicker") &&
        !e.target.closest("#rouletteIconBtn")) {
      iconPickerOpen = false;
      document.getElementById("rouletteIconPicker").classList.add("hidden");
    }
  });

  renderIconPicker();
  renderRouletteList();
  drawWheel(rouletteAngle);
}
