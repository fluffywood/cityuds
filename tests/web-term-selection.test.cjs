const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const repositoryRoot = path.resolve(__dirname, "..");
const sharedSource = fs.readFileSync(path.join(repositoryRoot, "assets/shared.js"), "utf8");
const storedValues = new Map();
const context = {
  URLSearchParams,
  document: {},
  fetch: async () => { throw new Error("Unexpected fetch in shared helper test"); },
  localStorage: {
    getItem(key) { return storedValues.has(key) ? storedValues.get(key) : null; },
    setItem(key, value) { storedValues.set(key, String(value)); }
  }
};
context.window = context;
vm.runInNewContext(sharedSource, context, { filename: "assets/shared.js" });

const courseIndex = JSON.parse(
  fs.readFileSync(path.join(repositoryRoot, "data/courses/index.json"), "utf8").replace(/^\uFEFF/, "")
);
const dsc6002 = {
  ...courseIndex.courses.find((course) => course.code === "DSC6002"),
  eligible_sections: JSON.parse(
    fs.readFileSync(path.join(repositoryRoot, "data/sections/DSC6002.json"), "utf8")
  )
};
const courseData = {
  ...courseIndex,
  courses: courseIndex.courses.map((course) => ({
    ...course,
    eligible_sections: JSON.parse(
      fs.readFileSync(path.join(repositoryRoot, `data/sections/${course.code}.json`), "utf8")
        .replace(/^\uFEFF/, "")
    )
  }))
};

function regular(primaryCrn, tutorialCrn = null) {
  return { primaryCrn, tutorialCrn };
}

test("DSC6002 只在 Summer Term 允许无班次选择", () => {
  assert.equal(context.MSDS.isProjectCourse(dsc6002), false);
  assert.equal(context.MSDS.allowsUnscheduledSelection(dsc6002, "S"), true);
  assert.equal(context.MSDS.allowsUnscheduledSelection(dsc6002, "B"), false);
});

test("DSC6002 Summer Term 无班次选择按必修 3 学分计算", () => {
  assert.equal(
    context.MSDS.selectedCreditsInTerm(dsc6002, { unscheduled: true }, "S"),
    3
  );
  assert.equal(
    context.MSDS.selectedCreditsInTerm(dsc6002, { unscheduled: true }, "B"),
    0
  );
  assert.equal(
    context.MSDS.selectedCreditsInTerm(dsc6002, { primaryCrn: "11818", tutorialCrn: null }, "B"),
    3
  );
});

test("DSC6017 手动确认 15 学分，同时由系统检查三门必修", () => {
  storedValues.clear();
  const course = courseData.courses.find((item) => item.code === "DSC6017");
  const overrides = {
    A: {
      DSC5001: regular("11599"),
      DSC5002: regular("11603"),
      DSC5003: regular("11604")
    }
  };

  context.MSDS.setEligibilityConfirmation("full_time_second_year", true);
  let eligibility = context.MSDS.getSelectionEligibility(courseData, course, overrides);
  assert.equal(eligibility.eligible, false);
  assert.equal(eligibility.minimumCreditsMet, false);
  assert.equal(eligibility.selectedCredits, 9);
  assert.match(eligibility.requirementText, /选课前修满15学分，且包含三门必修/);

  context.MSDS.setEligibilityConfirmation("internship_completed_15_credits", true);
  eligibility = context.MSDS.getSelectionEligibility(courseData, course, overrides);
  assert.equal(eligibility.eligible, true);
  assert.equal(eligibility.minimumCreditsMet, true);
  assert.equal(eligibility.missingCourses.length, 0);

  delete overrides.A.DSC5003;
  eligibility = context.MSDS.getSelectionEligibility(courseData, course, overrides);
  assert.equal(eligibility.eligible, false);
  assert.deepEqual(Array.from(eligibility.missingCourses), ["DSC5003"]);
});

test("DSC6032 自动合计 A+B 学分并检查三门必修", () => {
  storedValues.clear();
  const course = courseData.courses.find((item) => item.code === "DSC6032");
  const overrides = {
    A: {
      DSC5001: regular("11599"),
      DSC5002: regular("11603"),
      DSC5003: regular("11604")
    },
    B: {
      DSC6001: regular("11460"),
      DSC6002: regular("11818")
    }
  };

  let eligibility = context.MSDS.getSelectionEligibility(courseData, course, overrides);
  assert.equal(eligibility.eligible, true);
  assert.equal(eligibility.selectedCredits, 15);
  assert.match(eligibility.requirementText, /A\+B 两学期合计至少 15 学分/);

  delete overrides.B.DSC6002;
  eligibility = context.MSDS.getSelectionEligibility(courseData, course, overrides);
  assert.equal(eligibility.eligible, false);
  assert.equal(eligibility.selectedCredits, 12);
});
