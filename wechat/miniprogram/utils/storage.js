const LEGACY_STORAGE_KEY = "MSDS-planner-selections-v1";
const STORAGE_KEY_PREFIX = "MSDS-planner-selections-v2";
const LEGACY_INITIALIZED_KEY = "MSDS-planner-initialized-v1";
const INITIALIZED_KEY_PREFIX = "MSDS-planner-initialized-v2";
const ACTIVE_TERM_KEY = "MSDS-planner-active-term-v1";
const ELIGIBILITY_CONFIRMATIONS_KEY = "MSDS-student-eligibility-confirmations-v1";
const TERM_CODES = Object.freeze(["A", "B", "S"]);
const DEFAULT_TERM = "A";
const LEGACY_COURSE_CODE_PATTERN = /^SDSC(?=\d{4}$)/;

function storageApi(providedApi) {
  if (providedApi) return providedApi;
  if (typeof wx !== "undefined") return wx;
  throw new Error("当前环境没有可用的 wx storage API");
}

function normalizeTerm(value) {
  const term = String(value || "").trim().toUpperCase();
  return TERM_CODES.includes(term) ? term : "";
}

function normalizeCourseCode(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(LEGACY_COURSE_CODE_PATTERN, "DSC");
}

function normalizeSelections(value) {
  let parsed = value;
  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch (error) {
      return {};
    }
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};

  const normalized = {};
  Object.keys(parsed).forEach((courseCode) => {
    const normalizedCode = normalizeCourseCode(courseCode);
    if (!normalizedCode) return;
    const isCanonicalKey = normalizedCode === String(courseCode).trim().toUpperCase();
    if (!(normalizedCode in normalized) || isCanonicalKey) {
      normalized[normalizedCode] = parsed[courseCode];
    }
  });
  return normalized;
}

function selectionStorageKey(term) {
  return `${STORAGE_KEY_PREFIX}-${normalizeTerm(term) || DEFAULT_TERM}`;
}

function initializedStorageKey(term) {
  return `${INITIALIZED_KEY_PREFIX}-${normalizeTerm(term) || DEFAULT_TERM}`;
}

function hasStoredValue(value) {
  return value !== "" && value !== undefined && value !== null;
}

function isTermInitialized(term = DEFAULT_TERM, providedApi) {
  let normalizedTerm = normalizeTerm(term);
  let apiOverride = providedApi;
  if (!normalizedTerm && term && typeof term === "object") {
    apiOverride = term;
    normalizedTerm = DEFAULT_TERM;
  }
  normalizedTerm = normalizedTerm || DEFAULT_TERM;
  const api = storageApi(apiOverride);
  const marker = api.getStorageSync(initializedStorageKey(normalizedTerm));
  if (marker === "1" || marker === 1 || marker === true) return true;
  if (hasStoredValue(api.getStorageSync(selectionStorageKey(normalizedTerm)))) return true;
  if (normalizedTerm !== DEFAULT_TERM) return false;
  return hasStoredValue(api.getStorageSync(LEGACY_STORAGE_KEY))
    || api.getStorageSync(LEGACY_INITIALIZED_KEY) === "1";
}

function markTermInitialized(term = DEFAULT_TERM, providedApi) {
  let normalizedTerm = normalizeTerm(term);
  let apiOverride = providedApi;
  if (!normalizedTerm && term && typeof term === "object") {
    apiOverride = term;
    normalizedTerm = DEFAULT_TERM;
  }
  normalizedTerm = normalizedTerm || DEFAULT_TERM;
  storageApi(apiOverride).setStorageSync(initializedStorageKey(normalizedTerm), "1");
}

function getActiveTerm(providedApi) {
  const api = storageApi(providedApi);
  return normalizeTerm(api.getStorageSync(ACTIVE_TERM_KEY)) || DEFAULT_TERM;
}

function setActiveTerm(term, providedApi) {
  const normalized = normalizeTerm(term) || DEFAULT_TERM;
  storageApi(providedApi).setStorageSync(ACTIVE_TERM_KEY, normalized);
  return normalized;
}

function getStoredSelections(term = DEFAULT_TERM, providedApi) {
  let normalizedTerm = normalizeTerm(term);
  let apiOverride = providedApi;
  if (!normalizedTerm && term && typeof term === "object") {
    apiOverride = term;
    normalizedTerm = DEFAULT_TERM;
  }
  normalizedTerm = normalizedTerm || DEFAULT_TERM;
  const api = storageApi(apiOverride);
  const storageKey = selectionStorageKey(normalizedTerm);
  let stored = api.getStorageSync(storageKey);

  if ((stored === "" || stored === undefined || stored === null) && normalizedTerm === DEFAULT_TERM) {
    const legacy = api.getStorageSync(LEGACY_STORAGE_KEY);
    if (legacy !== "" && legacy !== undefined && legacy !== null) {
      stored = legacy;
      api.setStorageSync(storageKey, normalizeSelections(legacy));
    }
  }
  return normalizeSelections(stored);
}

function saveSelections(term, selections, providedApi) {
  let normalizedTerm = normalizeTerm(term);
  let value = selections;
  let apiOverride = providedApi;
  if (!normalizedTerm && term && typeof term === "object") {
    value = term;
    apiOverride = selections;
    normalizedTerm = DEFAULT_TERM;
  }
  normalizedTerm = normalizedTerm || DEFAULT_TERM;
  const normalized = normalizeSelections(value);
  storageApi(apiOverride).setStorageSync(selectionStorageKey(normalizedTerm), normalized);
  return normalized;
}

function initializeStoredSelections(term, initialSelections = {}, providedApi) {
  const normalizedTerm = normalizeTerm(term) || DEFAULT_TERM;
  const api = storageApi(providedApi);
  const initialized = isTermInitialized(normalizedTerm, api);
  const selections = initialized
    ? getStoredSelections(normalizedTerm, api)
    : saveSelections(normalizedTerm, initialSelections, api);
  const marker = api.getStorageSync(initializedStorageKey(normalizedTerm));
  if (marker !== "1" && marker !== 1 && marker !== true) {
    markTermInitialized(normalizedTerm, api);
  }
  return selections;
}

function clearStoredSelections(term = DEFAULT_TERM, providedApi) {
  let normalizedTerm = normalizeTerm(term);
  let apiOverride = providedApi;
  if (!normalizedTerm && term && typeof term === "object") {
    apiOverride = term;
    normalizedTerm = DEFAULT_TERM;
  }
  const api = storageApi(apiOverride);
  const key = selectionStorageKey(normalizedTerm || DEFAULT_TERM);
  api.setStorageSync(key, {});
  markTermInitialized(normalizedTerm || DEFAULT_TERM, api);
}

function getAllStoredSelections(providedApi) {
  return Object.fromEntries(TERM_CODES.map((term) => [term, getStoredSelections(term, providedApi)]));
}

function getEligibilityConfirmations(providedApi) {
  const value = storageApi(providedApi).getStorageSync(ELIGIBILITY_CONFIRMATIONS_KEY);
  let parsed = value;
  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch (error) {
      return {};
    }
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
  return Object.fromEntries(Object.entries(parsed).filter(([, confirmed]) => confirmed === true));
}

function setEligibilityConfirmation(key, confirmed, providedApi) {
  const normalizedKey = String(key || "").trim();
  const confirmations = getEligibilityConfirmations(providedApi);
  if (!normalizedKey) return confirmations;
  if (confirmed) confirmations[normalizedKey] = true;
  else delete confirmations[normalizedKey];
  storageApi(providedApi).setStorageSync(ELIGIBILITY_CONFIRMATIONS_KEY, confirmations);
  return confirmations;
}

module.exports = {
  ACTIVE_TERM_KEY,
  DEFAULT_TERM,
  ELIGIBILITY_CONFIRMATIONS_KEY,
  INITIALIZED_KEY_PREFIX,
  LEGACY_INITIALIZED_KEY,
  LEGACY_STORAGE_KEY,
  STORAGE_KEY_PREFIX,
  TERM_CODES,
  clearStoredSelections,
  getActiveTerm,
  getAllStoredSelections,
  getEligibilityConfirmations,
  getStoredSelections,
  initializeStoredSelections,
  initializedStorageKey,
  isTermInitialized,
  markTermInitialized,
  normalizeCourseCode,
  normalizeSelections,
  normalizeTerm,
  saveSelections,
  selectionStorageKey,
  setActiveTerm,
  setEligibilityConfirmation
};
