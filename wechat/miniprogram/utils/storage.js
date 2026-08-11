const STORAGE_KEY = "MSDS-planner-selections-v1";
const LEGACY_COURSE_CODE_PATTERN = /^DSC(?=\d{4}$)/;

function storageApi(providedApi) {
  if (providedApi) return providedApi;
  if (typeof wx !== "undefined") return wx;
  throw new Error("当前环境没有可用的 wx storage API");
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

function normalizeCourseCode(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(LEGACY_COURSE_CODE_PATTERN, "SDSC");
}

function getStoredSelections(providedApi) {
  const stored = storageApi(providedApi).getStorageSync(STORAGE_KEY);
  return normalizeSelections(stored);
}

function saveSelections(selections, providedApi) {
  const normalized = normalizeSelections(selections);
  storageApi(providedApi).setStorageSync(STORAGE_KEY, normalized);
  return normalized;
}

function clearStoredSelections(providedApi) {
  const api = storageApi(providedApi);
  if (typeof api.removeStorageSync === "function") {
    api.removeStorageSync(STORAGE_KEY);
  } else {
    api.setStorageSync(STORAGE_KEY, {});
  }
}

module.exports = {
  STORAGE_KEY,
  clearStoredSelections,
  getStoredSelections,
  normalizeCourseCode,
  normalizeSelections,
  saveSelections
};
