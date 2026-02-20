// Shared state management for handover and holidays prototype
// Uses localStorage so names and answers persist across pages

const STATE_KEY = 'cap-hh-prototype';

function getState() {
  try {
    return JSON.parse(localStorage.getItem(STATE_KEY) || '{}');
  } catch (e) {
    return {};
  }
}

function setState(updates) {
  const current = getState();
  localStorage.setItem(STATE_KEY, JSON.stringify(deepMerge(current, updates)));
}

function clearState() {
  localStorage.removeItem(STATE_KEY);
}

function getNames() {
  const s = getState();
  return {
    parent1: s.parent1Name || 'Parent 1',
    parent2: s.parent2Name || 'Parent 2',
    children: s.children || []
  };
}

// Deep merge — arrays are replaced, not merged
function deepMerge(target, source) {
  if (typeof source !== 'object' || source === null) return source;
  if (Array.isArray(source)) return source;
  const result = Object.assign({}, target);
  for (const key of Object.keys(source)) {
    const sv = source[key];
    const tv = target[key];
    if (sv && typeof sv === 'object' && !Array.isArray(sv) && tv && typeof tv === 'object' && !Array.isArray(tv)) {
      result[key] = deepMerge(tv, sv);
    } else {
      result[key] = sv;
    }
  }
  return result;
}

// ─── Design 2 helpers ────────────────────────────────────────────────────────

function initChildPlans() {
  const s = getState();
  const children = s.children || [];
  const existing = (s.design2 && s.design2.childPlans) || [];
  const plans = children.map((_, i) => existing[i] || { answers: {} });
  setState({ design2: { childPlans: plans } });
}

function getChildPlan(childIndex) {
  const s = getState();
  const plans = (s.design2 && s.design2.childPlans) || [];
  return plans[childIndex] || { answers: {} };
}

function setChildPlan(childIndex, updates) {
  const s = getState();
  const d2 = s.design2 || {};
  const plans = [...(d2.childPlans || [])];
  while (plans.length <= childIndex) plans.push({ answers: {} });
  plans[childIndex] = deepMerge(plans[childIndex] || { answers: {} }, updates);
  setState({ design2: { childPlans: plans } });
}

function getCurrentChildIndex() {
  const s = getState();
  return (s.design2 && typeof s.design2.currentChildIndex === 'number')
    ? s.design2.currentChildIndex : 0;
}

function setCurrentChildIndex(idx) {
  setState({ design2: { currentChildIndex: idx } });
}

function copyChildPlan(fromIndex, toIndex) {
  const s = getState();
  const plans = (s.design2 && s.design2.childPlans) || [];
  const source = plans[fromIndex];
  if (!source) return;
  setChildPlan(toIndex, { answers: Object.assign({}, source.answers) });
}

function applyAnswerToAllChildren(answerUpdates) {
  const s = getState();
  const children = s.children || [];
  const plans = [...((s.design2 && s.design2.childPlans) || [])];
  children.forEach((_, i) => {
    const plan = plans[i] || { answers: {} };
    plan.answers = Object.assign({}, plan.answers, answerUpdates);
    plans[i] = plan;
  });
  setState({ design2: { childPlans: plans } });
}

function isChildPlanStarted(childIndex) {
  const a = getChildPlan(childIndex).answers || {};
  return a.getBetweenHouseholds != null;
}

function isChildPlanComplete(childIndex) {
  const a = getChildPlan(childIndex).answers || {};
  return a.itemsForChangeover != null;
}

// ─── Design 3 helpers ────────────────────────────────────────────────────────

function getDesign3() {
  const s = getState();
  return (s.design3) || {};
}

function setDesign3(updates) {
  const d3 = getDesign3();
  setState({ design3: deepMerge(d3, updates) });
}
