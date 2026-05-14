const API_BASE = "http://localhost:8000/api";

// 상태 한글 레이블 및 색상
const statusConfig = {
  todo: { label: "할 일", color: "bg-gray-100 text-gray-600" },
  in_progress: { label: "진행 중", color: "bg-yellow-100 text-yellow-700" },
  done: { label: "완료", color: "bg-green-100 text-green-700" },
};

let currentFilter = "all";
let allTasks = [];

// 00:00 ~ 23:00 시간 옵션 생성
function buildTimeOptions(selectedTime = "") {
  let options = `<option value="">시간 없음</option>`;
  for (let h = 0; h < 24; h++) {
    const val = `${String(h).padStart(2, "0")}:00`;
    options += `<option value="${val}" ${selectedTime === val ? "selected" : ""}>${val}</option>`;
  }
  return options;
}

// 추가 폼의 시간 select 초기화
function initTimeSelect() {
  const sel = document.getElementById("timeSelect");
  sel.innerHTML = `<option value="">시간 선택</option>`;
  for (let h = 0; h < 24; h++) {
    const val = `${String(h).padStart(2, "0")}:00`;
    sel.innerHTML += `<option value="${val}">${val}</option>`;
  }
}

// 업무 목록 불러오기
async function fetchTasks() {
  const res = await fetch(`${API_BASE}/tasks`);
  allTasks = await res.json();
  renderTasks();
}

// 업무 추가
async function addTask() {
  const input = document.getElementById("taskInput");
  const title = input.value.trim();
  if (!title) return;

  const dueTime = document.getElementById("timeSelect").value || null;

  await fetch(`${API_BASE}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, due_time: dueTime }),
  });

  input.value = "";
  document.getElementById("timeSelect").value = "";
  fetchTasks();
}

// 업무 삭제
async function deleteTask(taskId) {
  await fetch(`${API_BASE}/tasks/${taskId}`, { method: "DELETE" });
  fetchTasks();
}

// 업무 상태 변경
async function updateStatus(taskId, newStatus) {
  await fetch(`${API_BASE}/tasks/${taskId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: newStatus }),
  });
  fetchTasks();
}

// 업무 시간 변경
async function updateTime(taskId, newTime) {
  await fetch(`${API_BASE}/tasks/${taskId}/time`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ due_time: newTime || null }),
  });
  fetchTasks();
}

// 업무 목록 렌더링
function renderTasks() {
  const taskList = document.getElementById("taskList");
  const emptyMsg = document.getElementById("emptyMsg");

  const filtered = currentFilter === "all"
    ? allTasks
    : allTasks.filter(t => t.status === currentFilter);

  if (filtered.length === 0) {
    taskList.innerHTML = "";
    emptyMsg.classList.remove("hidden");
    return;
  }

  emptyMsg.classList.add("hidden");
  taskList.innerHTML = filtered.map(task => `
    <div class="bg-white rounded-xl shadow p-4 flex items-center justify-between gap-3 flex-wrap">
      <div class="flex items-center gap-3 flex-1 min-w-0">
        <span class="px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${statusConfig[task.status].color}">
          ${statusConfig[task.status].label}
        </span>
        <span class="text-gray-800 truncate">${escapeHtml(task.title)}</span>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <select
          class="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          onchange="updateTime(${task.id}, this.value)"
        >
          ${buildTimeOptions(task.due_time || "")}
        </select>
        <select
          class="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          onchange="updateStatus(${task.id}, this.value)"
        >
          <option value="todo" ${task.status === "todo" ? "selected" : ""}>할 일</option>
          <option value="in_progress" ${task.status === "in_progress" ? "selected" : ""}>진행 중</option>
          <option value="done" ${task.status === "done" ? "selected" : ""}>완료</option>
        </select>
        <button
          onclick="deleteTask(${task.id})"
          class="text-red-400 hover:text-red-600 font-bold text-lg leading-none transition"
          title="삭제"
        >×</button>
      </div>
    </div>
  `).join("");
}

// XSS 방지용 이스케이프
function escapeHtml(text) {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(text));
  return div.innerHTML;
}

// 필터 탭 이벤트
document.querySelectorAll(".filter-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    currentFilter = btn.dataset.filter;
    document.querySelectorAll(".filter-btn").forEach(b => {
      b.className = "filter-btn px-4 py-1.5 rounded-full text-sm font-medium bg-gray-200 text-gray-600";
    });
    btn.className = "filter-btn px-4 py-1.5 rounded-full text-sm font-medium bg-indigo-600 text-white";
    renderTasks();
  });
});

// 추가 버튼 이벤트
document.getElementById("addBtn").addEventListener("click", addTask);

// 엔터키로 추가
document.getElementById("taskInput").addEventListener("keydown", e => {
  if (e.key === "Enter") addTask();
});

// 초기화
initTimeSelect();
fetchTasks();
document.querySelector('[data-filter="all"]').className =
  "filter-btn px-4 py-1.5 rounded-full text-sm font-medium bg-indigo-600 text-white";
