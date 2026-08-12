const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const transfer = require("../assets/schedule-transfer.js");
const repositoryRoot = path.resolve(__dirname, "..");

function readJson(relativePath) {
  return JSON.parse(
    fs.readFileSync(path.join(repositoryRoot, relativePath), "utf8").replace(/^\uFEFF/, "")
  );
}

const courseIndex = readJson("data/courses/index.json");
const courseData = {
  ...courseIndex,
  courses: courseIndex.courses.map((course) => ({
    ...course,
    eligible_sections: readJson(`data/sections/${course.code}.json`)
  }))
};

function regular(primaryCrn, tutorialCrn = null) {
  return { primaryCrn, tutorialCrn };
}

function completeSnapshot() {
  return {
    A: {
      DSC5001: regular("11599"),
      DSC5002: regular("11603"),
      DSC5003: regular("11604"),
      CS5285: regular("13297"),
      DSC6016: regular("15647")
    },
    B: {
      CS6290: regular("12937", "12938"),
      DSC6016: regular("12158")
    },
    S: {
      DSC6032: { unscheduled: true }
    }
  };
}

test("三学期课程、主课、Tutorial 和项目课可完整往返", () => {
  const source = completeSnapshot();
  const exported = transfer.serializeSchedule(courseData, source);
  const imported = transfer.parseSchedule(`\uFEFF${exported.text}`, courseData);

  assert.deepEqual(imported.selectionsByTerm, source);
  assert.equal(exported.courseCount, 8);
  assert.equal(exported.sectionCount, 8);
  assert.match(exported.text, /===== A 学期 =====[\s\S]*===== B 学期 =====[\s\S]*===== S 学期 =====/);
  assert.match(exported.text, /12937  CP1[\s\S]*12938  TP1/);
  assert.match(exported.text, /DSC6032 S Internship Project \(S\)\r\nNO_SECTION/);
});

test("无时间与地点的班次使用占位符并可恢复", () => {
  const source = { A: {}, B: { DSC6002: regular("11818") }, S: {} };
  const exported = transfer.serializeSchedule(courseData, source);
  const imported = transfer.parseSchedule(exported.text, courseData);

  assert.match(exported.text, /11818  D61[\s\S]*11\/01\/2027 - 17\/04\/2027  -  -  -  -  CHAN Yu Wing/);
  assert.deepEqual(imported.selectionsByTerm, source);
});

test("空的三学期课表也是有效的完整备份", () => {
  const source = { A: {}, B: {}, S: {} };
  const exported = transfer.serializeSchedule(courseData, source);
  const imported = transfer.parseSchedule(exported.text, courseData);

  assert.deepEqual(imported.selectionsByTerm, source);
  assert.equal(imported.courseCount, 0);
});

test("旧 SDSC 课程编号可导入并规范为 DSC", () => {
  const exported = transfer.serializeSchedule(courseData, {
    A: { DSC5001: regular("11599") },
    B: {},
    S: {}
  });
  const imported = transfer.parseSchedule(
    exported.text.replace("DSC5001 A", "SDSC5001 A"),
    courseData
  );

  assert.deepEqual(imported.selectionsByTerm.A, { DSC5001: regular("11599") });
});

test("未知 CRN 会带行号报错", () => {
  const exported = transfer.serializeSchedule(courseData, {
    A: { DSC5001: regular("11599") },
    B: {},
    S: {}
  });

  assert.throws(
    () => transfer.parseSchedule(exported.text.replace("11599  C61", "99999  C61"), courseData),
    /第 \d+ 行：DSC5001 在 A 学期没有 CRN 99999/
  );
});

test("缺少任一学期区块时拒绝整体恢复", () => {
  const exported = transfer.serializeSchedule(courseData, { A: {}, B: {}, S: {} });
  const withoutSummer = exported.text.replace(/===== S 学期 =====\r\n?/, "");

  assert.throws(
    () => transfer.parseSchedule(withoutSummer, courseData),
    /文件缺少 S 学期区块/
  );
});

test("B 学期 CS6290 缺少 A 学期 CS5285 时拒绝", () => {
  const snapshot = { A: {}, B: { CS6290: regular("12937", "12938") }, S: {} };

  assert.throws(
    () => transfer.validateSnapshot(courseData, snapshot),
    /CS6290 不满足选课条件.*缺少 CS5285/
  );
});

test("S 学期无班次课程不能伪造为已选", () => {
  const snapshot = { A: {}, B: {}, S: { DSC6002: regular("11818") } };

  assert.throws(
    () => transfer.validateSnapshot(courseData, snapshot),
    /DSC6002 的主课班次不存在或已失效/
  );
});

test("DSC6002 在 S 学期可无班次导出并完整恢复", () => {
  const source = { A: {}, B: {}, S: { DSC6002: { unscheduled: true } } };
  const exported = transfer.serializeSchedule(courseData, source);
  const imported = transfer.parseSchedule(exported.text, courseData);

  assert.deepEqual(imported.selectionsByTerm, source);
  assert.equal(exported.courseCount, 1);
  assert.equal(exported.sectionCount, 0);
  assert.match(exported.text, /DSC6002 S Research Projects for Data Science\r\nNO_SECTION/);
});

test("DSC6002 在 B 学期仍必须选择现有班次", () => {
  const valid = { A: {}, B: { DSC6002: regular("11818") }, S: {} };
  const invalid = { A: {}, B: { DSC6002: { unscheduled: true } }, S: {} };

  assert.doesNotThrow(() => transfer.validateSnapshot(courseData, valid));
  assert.throws(
    () => transfer.validateSnapshot(courseData, invalid),
    /DSC6002 必须提供有效的主课班次/
  );
});

test("互斥 Internship Project 不能同时导入", () => {
  const snapshot = completeSnapshot();
  snapshot.B.DSC6017 = { unscheduled: true };

  assert.throws(
    () => transfer.validateSnapshot(courseData, snapshot, {
      eligibilityConfirmations: { full_time_second_year: true }
    }),
    /DSC6032 与 DSC6017 不能同时或跨学期重复加入/
  );
});

test("Internship Project 必须保留全日制第二年身份确认", () => {
  const snapshot = completeSnapshot();
  snapshot.S = {};
  snapshot.B.DSC6017 = { unscheduled: true };

  assert.throws(
    () => transfer.validateSnapshot(courseData, snapshot),
    /DSC6017 需要先在课程栏确认/
  );
  assert.doesNotThrow(() => transfer.validateSnapshot(courseData, snapshot, {
    eligibilityConfirmations: { full_time_second_year: true }
  }));
});

test("三学期存储失败时恢复导入前的全部值", () => {
  const values = new Map([
    ["selection-A", "old-a"],
    ["selection-B", "old-b"],
    ["selection-S", "old-s"],
    ["initialized-A", "old-init-a"],
    ["initialized-B", null],
    ["initialized-S", "old-init-s"]
  ]);
  let shouldFail = true;
  const storage = {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    removeItem(key) {
      values.delete(key);
    },
    setItem(key, value) {
      if (key === "selection-B" && shouldFail) {
        shouldFail = false;
        throw new Error("quota exceeded");
      }
      values.set(key, value);
    }
  };

  assert.throws(() => transfer.replaceStoredSelections(storage, completeSnapshot(), {
    selectionKeyForTerm: (term) => `selection-${term}`,
    initializedKeyForTerm: (term) => `initialized-${term}`
  }), /quota exceeded/);
  assert.equal(values.get("selection-A"), "old-a");
  assert.equal(values.get("selection-B"), "old-b");
  assert.equal(values.get("selection-S"), "old-s");
  assert.equal(values.get("initialized-A"), "old-init-a");
  assert.equal(values.has("initialized-B"), false);
  assert.equal(values.get("initialized-S"), "old-init-s");
});
