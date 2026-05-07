const $ = id => document.getElementById(id);
const $$ = sel => Array.from(document.querySelectorAll(sel));
const KEY = "life-country-v9-1-preview";
let state = JSON.parse(localStorage.getItem(KEY) || "{}");

function todayKey(date = new Date()){
  const y = date.getFullYear();
  const m = String(date.getMonth()+1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
function dateAdd(key, delta){
  const [y,m,d] = key.split("-").map(Number);
  const dt = new Date(y, m-1, d);
  dt.setDate(dt.getDate()+delta);
  return todayKey(dt);
}
function diffDays(fromKey, toKey=todayKey()){
  const [fy,fm,fd] = fromKey.split("-").map(Number);
  const [ty,tm,td] = toKey.split("-").map(Number);
  const a = new Date(fy, fm-1, fd);
  const b = new Date(ty, tm-1, td);
  return Math.max(0, Math.floor((b-a)/86400000)+1);
}
function ensureDates(){ if(!Array.isArray(state.governanceDates)) state.governanceDates = []; }
function recordToday(){
  ensureDates();
  const t = todayKey();
  if(!state.governanceDates.includes(t)) state.governanceDates.push(t);
  state.lastGovernanceDate = t;
}
function calcStreak(){
  ensureDates();
  const set = new Set(state.governanceDates);
  let cursor = todayKey();
  let count = 0;
  while(set.has(cursor)){
    count++;
    cursor = dateAdd(cursor, -1);
  }
  return count;
}
function toast(msg="已保存"){
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(()=>t.classList.remove("show"), 1200);
}
function persist(){ localStorage.setItem(KEY, JSON.stringify(state)); updateDashboard(); }
function showPage(name){
  $$(".page").forEach(p => p.classList.toggle("active", p.id === "page-" + name));
  $$(".bottom-nav button").forEach(b => b.classList.toggle("active", b.dataset.page === name));
  window.scrollTo({top:0, behavior:"smooth"});
}
$$("[data-page]").forEach(btn => btn.onclick = ()=>showPage(btn.dataset.page));
function checked(ids){return ids.map(id => $(id) && $(id).checked ? 1 : 0).reduce((a,b)=>a+b,0);}
function getNum(v, fallback=0){v = Number(v); return Number.isFinite(v) ? v : fallback;}
function calculateStats(){
  const orderDone = checked(["order1Done","order2Done","order3Done"]);
  const buildDone = checked(["buildSleep","buildWater","buildSport","buildFood"]);
  const mood = state.mood || "平静";
  const power = getNum(state.moodPower || $("moodPower")?.value, 5);
  const moodBase = {开心:92, 平静:84, 焦虑:62, 疲惫:58}[mood] || 80;
  const internal = Math.max(35, Math.min(98, moodBase - Math.max(0, power-5)*4));
  const time = Math.min(95, 50 + orderDone*14);
  const energy = Math.min(98, 48 + buildDone*13);
  const income = getNum($("incomeValue")?.value || state.incomeValue, 200);
  const expense = getNum($("expenseValue")?.value || state.expenseValue, 80);
  const balance = income - expense;
  let treasury = 68;
  if(balance >= 120) treasury = 84;
  else if(balance >= 50) treasury = 75;
  else if(balance >= 0) treasury = 65;
  else treasury = 45;
  const g30 = getNum($("goal30Range")?.value || state.goal30Range, 45);
  const g90 = getNum($("goal90Range")?.value || state.goal90Range, 35);
  const gy = getNum($("goalYearRange")?.value || state.goalYearRange, 25);
  const strategy = Math.round((g30 + g90 + gy) / 3);
  const social = internal >= 80 ? 78 : internal >= 60 ? 70 : 58;
  return {orderDone, buildDone, internal, time, energy, treasury, strategy, social, income, expense, balance, g30, g90, gy};
}
function rankByLevel(level){ if(level >= 10) return "黄金时代缔造者"; if(level >= 5) return "稳定治理者"; return "新手总督"; }
function eventText(stats){
  if(stats.energy < 65) return "今日国家事件：能源储备不足，建议优先修复睡眠与饮水工程。";
  if(stats.internal < 65) return "今日国家事件：内政略有波动，请先启动安抚政策，不要攻击自己。";
  if(stats.time < 70) return "今日国家事件：调度秩序偏低，先完成一条最小政令，国家就会重新运转起来。";
  if(stats.treasury < 60) return "今日国家事件：国库出现紧张，请记录支出并进入轻预算模式。";
  return "今日国家事件：国家整体运行平稳，继续推进一条政令与一个小目标即可。";
}
function updateTreasuryLive(){
  const income = getNum($("incomeValue").value, 200);
  const expense = getNum($("expenseValue").value, 80);
  const balance = income - expense;
  $("savingValue").value = balance;
  $("todayBalanceText").textContent = balance;
  $("treasuryHint").textContent = balance >= 0 ? "国库平稳，安全感良好" : "国库紧张，建议进入轻预算模式";
}
function updateMoodCharacter(){
  const mood = state.mood || $("moodLabel").textContent || "平静";
  const power = getNum($("moodPower").value, 5);
  $("moodPowerLabel").textContent = power;
  const moodMap = {
    "开心": "mood_happy",
    "平静": "mood_calm",
    "焦虑": "mood_anxious",
    "疲惫": "mood_tired"
  };
  const img = moodMap[mood] || "mood_calm";
  $("moodCharacter").src = `./assets/characters/${img}.png`;
}
function updateStrategyMeta(){
  const start = state.strategyStartDate || todayKey();
  const d30 = Math.min(diffDays(start), 30);
  const d90 = Math.min(diffDays(start), 90);
  const dy = Math.min(diffDays(start), 365);
  $("strategyStartText").textContent = `开始日期：${start}`;
  $("goal30Days").textContent = `已执行 ${d30}/30 天`;
  $("goal90Days").textContent = `已执行 ${d90}/90 天`;
  $("goalYearDays").textContent = `已执行 ${dy}/365 天`;
  $("goal30Percent").textContent = $("goal30Range").value + "%";
  $("goal90Percent").textContent = $("goal90Range").value + "%";
  $("goalYearPercent").textContent = $("goalYearRange").value + "%";
}
function getBadges(stats){
  const fullToday = stats.orderDone === 3 && stats.buildDone === 4 && !!state.internalSaved && stats.balance >= 0;
  return [
    {id:"excellent", name:"优秀治理勋章", icon:"medal_gold.png", unlocked: fullToday, condition:"当天完成三条政令、四项基建、保存内政，且国库结余为正。"},
    {id:"internal", name:"内政稳定勋章", icon:"badge_internal.png", unlocked: stats.internal >= 80 && !!state.internalSaved, condition:"保存内政且内政稳定度达到 80%。"},
    {id:"build", name:"基建优秀勋章", icon:"badge_build.png", unlocked: stats.buildDone === 4, condition:"完成全部四项基建任务。"},
    {id:"treasury", name:"国库守护勋章", icon:"badge_treasury.png", unlocked: stats.balance >= 0 && !!state.treasurySaved, condition:"保存国库且今日结余不为负。"},
    {id:"strategy", name:"战略推进勋章", icon:"badge_strategy.png", unlocked: stats.strategy >= 50 && !!state.strategySaved, condition:"保存战略且平均战略进度达到 50%。"},
    {id:"streak", name:"连续治理勋章", icon:"badge_streak.png", unlocked: calcStreak() >= 3, condition:"真实日期连续治理 3 天。"}
  ];
}
function renderBadges(){
  const stats = calculateStats();
  const badges = getBadges(stats);
  $("archiveBadges").textContent = badges.filter(b=>b.unlocked).length;
  $("badgeList").innerHTML = badges.map(b => `
    <button class="badge-card ${b.unlocked ? "" : "locked"}" data-badge="${b.id}">
      <img src="./assets/ui/${b.icon}" alt="">
      <div><b>${b.name}</b><span>${b.condition}</span></div>
      <em>${b.unlocked ? "已获得" : "未获得"}</em>
    </button>
  `).join("");
  $$(".badge-card").forEach(card => {
    card.onclick = () => {
      const badge = badges.find(b => b.id === card.dataset.badge);
      $("reportBox").textContent = `【${badge.name}】\n\n状态：${badge.unlocked ? "已获得" : "未获得"}\n条件：${badge.condition}`;
      showPage("archive");
    };
  });
}
function updateDashboard(){
  updateTreasuryLive();
  updateMoodCharacter();
  updateStrategyMeta();
  const s = calculateStats();
  $("statusInternal").textContent = Math.round(s.internal) + "%";
  $("statusTime").textContent = Math.round(s.time) + "%";
  $("statusEnergy").textContent = Math.round(s.energy) + "%";
  $("statusTreasury").textContent = Math.round(s.treasury) + "%";
  $("statusStrategy").textContent = Math.round(s.strategy) + "%";
  $("statusSocial").textContent = Math.round(s.social) + "%";
  $("barInternal").value = s.internal; $("barTime").value = s.time; $("barEnergy").value = s.energy; $("barTreasury").value = s.treasury; $("barStrategy").value = s.strategy; $("barSocial").value = s.social;
  const txt = eventText(s);
  $("eventSummary").textContent = txt;
  $("homeEventTitle").textContent = txt.includes("平稳") ? "国家运行平稳" : "国家需要修复";
  $("homeEventDesc").textContent = txt.replace("今日国家事件：", "");
  $("orderCount").textContent = `${s.orderDone}/3 已完成`;
  $("homeOrderTitle").textContent = `${s.orderDone}/3 已完成`;
  $("buildCount").textContent = `${s.buildDone}/4 完成`;
  $("energyScore").textContent = Math.round(s.energy);
  const streak = calcStreak();
  $("streakDays").textContent = streak;
  $("archiveDays").textContent = streak;
  const orderTotal = state.totalOrders || s.orderDone;
  const level = Math.max(1, Math.floor((orderTotal + streak)/8) + 1);
  $("archiveOrders").textContent = orderTotal;
  $("levelNum").textContent = level;
  $("levelBar").value = ((orderTotal + streak) % 8) * 12.5;
  $("titleRank").textContent = rankByLevel(level);
  $("treasuryMode").textContent = s.treasury >= 75 ? "稳定" : s.treasury >= 60 ? "紧张" : "赤字";
  renderBadges();
}
function saveOrders(){
  state.order1Done = $("order1Done").checked;
  state.order2Done = $("order2Done").checked;
  state.order3Done = $("order3Done").checked;
  state.order1Text = $("order1Text").value;
  state.order2Text = $("order2Text").value;
  state.order3Text = $("order3Text").value;
  state.totalOrders = Math.max(state.totalOrders || 0, calculateStats().orderDone);
  recordToday();
  persist(); makeReport(); toast("今日政令已保存");
}
function saveInternal(){
  const label = $("moodLabel").textContent;
  state.mood = label === "未选择" ? "平静" : label;
  state.moodPower = $("moodPower").value;
  state.internalNote = $("internalNote").value;
  state.internalSaved = true;
  recordToday();
  persist(); makeReport(); toast("内政已保存");
}
function saveBuild(){
  state.buildSleep = $("buildSleep").checked;
  state.buildWater = $("buildWater").checked;
  state.buildSport = $("buildSport").checked;
  state.buildFood = $("buildFood").checked;
  state.sleepValue = $("sleepValue").value;
  state.waterValue = $("waterValue").value;
  state.sportValue = $("sportValue").value;
  state.foodValue = $("foodValue").value;
  recordToday();
  persist(); makeReport(); toast("基建已保存");
}
function saveTreasury(){
  state.incomeValue = $("incomeValue").value || "200";
  state.expenseValue = $("expenseValue").value || "80";
  state.savingValue = $("savingValue").value;
  state.treasurySaved = true;
  recordToday();
  persist(); makeReport(); toast("国库已保存");
}
function saveStrategy(){
  state.goal30 = $("goal30").value;
  state.goal90 = $("goal90").value;
  state.goalYear = $("goalYear").value;
  state.goal30Range = $("goal30Range").value;
  state.goal90Range = $("goal90Range").value;
  state.goalYearRange = $("goalYearRange").value;
  if(!state.strategyStartDate) state.strategyStartDate = todayKey();
  state.strategySaved = true;
  recordToday();
  persist(); makeReport(); toast("战略已保存");
}
function makeReport(){
  const s = calculateStats();
  $("reportBox").textContent =
`【南山lily × 元五七｜今日国家报告】

今日日期：${todayKey()}
连续治理：${calcStreak()} 天
完成政令：${s.orderDone}/3
完成基建：${s.buildDone}/4
内政稳定：${Math.round(s.internal)}%
调度秩序：${Math.round(s.time)}%
国家能源：${Math.round(s.energy)}%
国库安全：${Math.round(s.treasury)}%
战略推进：${Math.round(s.strategy)}%

今日结论：
${eventText(s)}

提醒自己：
我不是一个糟糕的人，
我只是一个需要被认真治理的小国家。`;
}
$$(".mood-grid button").forEach(btn => {
  btn.onclick = () => {
    $$(".mood-grid button").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const mood = btn.dataset.mood;
    $("moodLabel").textContent = mood;
    state.mood = mood;
    if (btn.dataset.img) {
      $("moodCharacter").src = `./assets/characters/${btn.dataset.img}.png`;
    }
    persist();
  };
});
$("moodPower").addEventListener("input", e => {
  $("moodPowerLabel").textContent = e.target.value;
  state.moodPower = e.target.value;
  updateMoodCharacter();
  updateDashboard();
});
["incomeValue", "expenseValue"].forEach(id => $(id).addEventListener("input", updateDashboard));
["goal30Range", "goal90Range", "goalYearRange"].forEach(id => $(id).addEventListener("input", updateDashboard));
function hydrate(){
  ["order1Done","order2Done","order3Done","buildSleep","buildWater","buildSport","buildFood"].forEach(id => { if ($(id) && state[id] !== undefined) $(id).checked = !!state[id]; });
  ["order1Text","order2Text","order3Text","sleepValue","waterValue","sportValue","foodValue","incomeValue","expenseValue","savingValue","goal30","goal90","goalYear","internalNote","goal30Range","goal90Range","goalYearRange"].forEach(id => { if ($(id) && state[id] !== undefined && state[id] !== "") $(id).value = state[id]; });
  if (!$("incomeValue").value) $("incomeValue").value = 200;
  if (!$("expenseValue").value) $("expenseValue").value = 80;
  if (state.mood){
    $("moodLabel").textContent = state.mood;
    const btn = $$(".mood-grid button").find(x => x.dataset.mood === state.mood);
    if (btn) btn.classList.add("active");
  }
  if (state.moodPower){
    $("moodPower").value = state.moodPower;
    $("moodPowerLabel").textContent = state.moodPower;
  }
  makeReport();
  updateDashboard();
}
hydrate();
let deferredPrompt;
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); deferredPrompt = e; $("installBtn").hidden = false; });
$("installBtn").onclick = async () => { if (deferredPrompt){ deferredPrompt.prompt(); deferredPrompt = null; $("installBtn").hidden = true; } };
if ("serviceWorker" in navigator){ window.addEventListener("load", ()=>navigator.serviceWorker.register("./sw.js").catch(()=>{})); }
