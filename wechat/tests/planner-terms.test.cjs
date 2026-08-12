const test = require("node:test");
const assert = require("node:assert/strict");

const planner = require("../miniprogram/utils/planner");
const storage = require("../miniprogram/utils/storage");
const { courses, courseByCode } = require("../miniprogram/data/catalog");

function fakeStorage(initial = {}) {
  const values = { ...initial };
  return {
    getStorageSync(key) { return values[key]; },
    setStorageSync(key, value) { values[key] = value; },
    removeStorageSync(key) { delete values[key]; },
    values
  };
}

const dsc6002 = {
  code: "DSC6002",
  requirement_type: "core",
  credits: 3,
  offered_terms: ["B", "S"],
  allow_without_section_terms: ["S"],
  eligible_sections: [{
    term: "B", crn: "11818", section: "C61", credits: 3,
    day: "F", time: "19:00 - 21:50"
  }]
};

test("DSC6002 B uses its real CRN while S is unscheduled core", () => {
  assert.deepEqual(planner.makeDefaultSelection(dsc6002, "B"), {
    primaryCrn: "11818",
    tutorialCrn: null
  });
  assert.deepEqual(planner.makeDefaultSelection(dsc6002, "S"), { unscheduled: true });
  assert.equal(planner.isProjectCourse(dsc6002), false);
  assert.equal(planner.buildTimetableModel([dsc6002], { DSC6002: { unscheduled: true } }, "S").events.length, 0);
  const summary = planner.summarizeAllTerms([dsc6002], {
    A: {}, B: {}, S: { DSC6002: { unscheduled: true } }
  });
  assert.equal(summary.coreCount, 1);
  assert.equal(summary.coreCredits, 3);
  assert.equal(summary.projectCount, 0);
  assert.equal(summary.totalCredits, 3);
});

test("storage keeps A B S selections independent and migrates legacy A", () => {
  const api = fakeStorage({
    [storage.LEGACY_STORAGE_KEY]: { SDSC5001: { primaryCrn: "1" } }
  });
  assert.deepEqual(storage.getStoredSelections("A", api), {
    DSC5001: { primaryCrn: "1" }
  });
  storage.saveSelections("B", { DSC6001: { primaryCrn: "2" } }, api);
  assert.deepEqual(storage.getStoredSelections("B", api), {
    DSC6001: { primaryCrn: "2" }
  });
  assert.deepEqual(storage.getStoredSelections("S", api), {});
});

test("first visit initializes only Semester A with the three web defaults", () => {
  const api = fakeStorage();
  const defaults = planner.makeInitialSelections(courses, "A");
  assert.deepEqual(defaults, {
    DSC5003: { primaryCrn: "13472", tutorialCrn: null },
    DSC5001: { primaryCrn: "11599", tutorialCrn: null },
    DSC5002: { primaryCrn: "13471", tutorialCrn: null }
  });
  assert.deepEqual(planner.makeInitialSelections(courses, "B"), {});
  assert.deepEqual(planner.makeInitialSelections(courses, "S"), {});

  assert.deepEqual(storage.initializeStoredSelections("A", defaults, api), defaults);
  assert.equal(api.values[storage.initializedStorageKey("A")], "1");
  assert.deepEqual(
    storage.initializeStoredSelections("B", planner.makeInitialSelections(courses, "B"), api),
    {}
  );
  assert.equal(api.values[storage.initializedStorageKey("B")], "1");
});

test("cleared and pre-existing empty terms never restore A defaults", () => {
  const defaults = planner.makeInitialSelections(courses, "A");
  const api = fakeStorage();
  storage.initializeStoredSelections("A", defaults, api);
  storage.clearStoredSelections("A", api);
  assert.deepEqual(storage.initializeStoredSelections("A", defaults, api), {});

  const existingV2 = fakeStorage({ [storage.selectionStorageKey("A")]: {} });
  assert.deepEqual(storage.initializeStoredSelections("A", defaults, existingV2), {});

  const emptyLegacy = fakeStorage({ [storage.LEGACY_STORAGE_KEY]: {} });
  assert.deepEqual(storage.initializeStoredSelections("A", defaults, emptyLegacy), {});
  assert.deepEqual(emptyLegacy.values[storage.selectionStorageKey("A")], {});
});

test("eligibility counts a repeated course code only once", () => {
  const course = {
    code: "X0001",
    credits: 3,
    offered_terms: ["A", "B"],
    eligible_sections: [
      { term: "A", crn: "A1", section: "C01", credits: 3 },
      { term: "B", crn: "B1", section: "C01", credits: 3 }
    ]
  };
  const internship = {
    code: "DSC6032",
    selection_requirement: { terms: ["A", "B"], minimum_credits: 6, required_courses: [] }
  };
  const result = planner.getSelectionEligibility([course], internship, {
    A: { X0001: { primaryCrn: "A1" } },
    B: { X0001: { primaryCrn: "B1" } }
  });
  assert.equal(result.selectedCredits, 3);
  assert.equal(result.eligible, false);
});

test("CS6290 depends on A-term CS5285 and removal invalidates it", () => {
  const snapshot = {
    A: { CS5285: planner.makeDefaultSelection(courseByCode.CS5285, "A") },
    B: { CS6290: planner.makeDefaultSelection(courseByCode.CS6290, "B") },
    S: {}
  };
  assert.equal(
    planner.getSelectionEligibility(courses, courseByCode.CS6290, snapshot).eligible,
    true
  );
  const after = { ...snapshot, A: {} };
  assert.deepEqual(
    planner.findInvalidatedDependents(courses, after).map((item) => `${item.term}:${item.course.code}`),
    ["B:CS6290"]
  );
});

test("internship projects are mutually exclusive across terms", () => {
  const conflict = planner.findProjectConflict(
    courses,
    { A: {}, B: { DSC6017: { unscheduled: true } }, S: {} },
    courseByCode.DSC6032
  );
  assert.deepEqual(conflict, { code: "DSC6017", term: "B" });
});

test("DSC6017 uses manual credit confirmation while system-checking the three cores", () => {
  const internship = {
    code: "DSC6017",
    eligibility_note: "仅限全日制第二年学生修读",
    selection_requirement: {
      terms: ["A"],
      minimum_credits: 15,
      required_courses: ["DSC5001", "DSC5002", "DSC5003"],
      confirmation_key: "full_time_second_year",
      minimum_credits_confirmation_key: "internship_completed_15_credits",
      minimum_credits_confirmation_label: "我已修满15学分",
      requirement_note: "选课前修满15学分"
    }
  };
  const snapshot = {
    A: {
      DSC5001: planner.makeDefaultSelection(courseByCode.DSC5001, "A"),
      DSC5002: planner.makeDefaultSelection(courseByCode.DSC5002, "A"),
      DSC5003: planner.makeDefaultSelection(courseByCode.DSC5003, "A")
    },
    B: {},
    S: {}
  };
  const confirmations = {
    full_time_second_year: true,
    internship_completed_15_credits: true
  };
  const eligible = planner.getSelectionEligibility(courses, internship, snapshot, confirmations);
  assert.equal(eligible.eligible, true);
  assert.deepEqual(eligible.confirmationItems.map(({ key, label, met }) => ({ key, label, met })), [
    { key: "full_time_second_year", label: "我确认：仅限全日制第二年学生修读", met: true },
    { key: "internship_completed_15_credits", label: "我已修满15学分", met: true }
  ]);

  const insufficientInAppCredits = planner.getSelectionEligibility(courses, internship, {
    ...snapshot,
    A: {
      DSC5001: snapshot.A.DSC5001,
      DSC5002: snapshot.A.DSC5002,
      DSC5003: snapshot.A.DSC5003
    }
  }, confirmations);
  assert.equal(insufficientInAppCredits.selectedCredits, 9);
  assert.equal(insufficientInAppCredits.eligible, true);

  assert.equal(planner.getSelectionEligibility(courses, internship, snapshot, {
    full_time_second_year: true
  }).eligible, false);
  assert.equal(planner.getSelectionEligibility(courses, internship, {
    ...snapshot,
    A: { DSC5001: snapshot.A.DSC5001, DSC5002: snapshot.A.DSC5002 }
  }, confirmations).eligible, false);
});

test("DSC6032 automatically combines A and B credits and requires all three cores", () => {
  const summerInternship = {
    code: "DSC6032",
    selection_requirement: {
      terms: ["A", "B"],
      minimum_credits: 15,
      required_courses: ["DSC5001", "DSC5002", "DSC5003"]
    }
  };
  const snapshot = {
    A: {
      DSC5001: planner.makeDefaultSelection(courseByCode.DSC5001, "A"),
      DSC5002: planner.makeDefaultSelection(courseByCode.DSC5002, "A"),
      DSC5003: planner.makeDefaultSelection(courseByCode.DSC5003, "A")
    },
    B: {
      DSC6001: planner.makeDefaultSelection(courseByCode.DSC6001, "B"),
      DSC6002: planner.makeDefaultSelection(courseByCode.DSC6002, "B")
    },
    S: {}
  };
  const eligibility = planner.getSelectionEligibility(courses, summerInternship, snapshot);
  assert.equal(eligibility.selectedCredits, 15);
  assert.equal(eligibility.eligible, true);
});
