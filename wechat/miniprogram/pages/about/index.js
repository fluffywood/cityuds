const { metadata, courses } = require("../../data/catalog");

const documentCount = courses.filter((course) => course.documentAvailable).length;
const scheduleAsOf = String(metadata.schedule_as_of || "").replace(
  " Asia/Beijing",
  "（Asia/Beijing）"
);

Page({
  data: {
    programme: metadata.programme,
    semester: metadata.semester,
    scheduleAsOf,
    courseCount: courses.length,
    documentCount
  }
});
