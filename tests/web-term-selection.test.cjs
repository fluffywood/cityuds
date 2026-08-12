const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const repositoryRoot = path.resolve(__dirname, "..");
const sharedSource = fs.readFileSync(path.join(repositoryRoot, "assets/shared.js"), "utf8");
const context = {
  URLSearchParams,
  document: {},
  fetch: async () => { throw new Error("Unexpected fetch in shared helper test"); },
  localStorage: {
    getItem() { return null; },
    setItem() {}
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
