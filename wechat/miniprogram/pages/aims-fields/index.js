const FIELD_GROUPS = [
  {
    title: "课程与注册",
    fields: [
      { term: "CRN", fullName: "Course Reference Number", meaning: "课程注册号 / 教学班注册编号", description: "指定学期内唯一对应一个教学班，选课或退课时用于识别班次；它不是 DSC5001 这类课程代码。" },
      { term: "Section", meaning: "教学班 / 班次编号", description: "通常为 3 位代码，例如 C61。首字母表示教学活动类型，例如 C 为主课、T 为 Tutorial、L 为 Laboratory；它不是 Semester A 或 Semester B。" },
      { term: "Credit", meaning: "学分", description: "课程对应的 Credit Units。学分通常显示在可计分的主课班次；关联的 Tutorial 或 Laboratory 可能显示为 0。" },
      { term: "Campus", meaning: "课程开设 / 授课校区", description: "表示课程开设或授课所在的校区，不能仅根据教学楼字段推断。" },
      { term: "WEB", meaning: "网页注册权限", description: "Y 表示通常可通过 Web Add/Drop 加退选；N 表示不能按一般网页流程注册，通常需要联系课程或学术单位处理。它不表示线上课程。" },
      { term: "Level", meaning: "适用学生层级", description: "表示哪些学生层级可以选修，例如 UG 或 PG。它不是本站学生评价中的推荐等级。" }
    ]
  },
  {
    title: "名额与候补",
    fields: [
      { term: "Avail", meaning: "剩余可注册名额", description: "快照时点单个 Section 尚余的名额。数值会变化，也不代表学生一定满足课程或项目注册限制。课程索引中的 summary 为各班次合计。" },
      { term: "Cap", meaning: "教学班容量", description: "单个 Section 允许注册的最大人数。课程索引中的 summary 为各班次合计。" },
      { term: "Waitlist Avail", meaning: "候补是否可用 / 剩余候补容量", description: "课程级可能显示 Y、N 或 FULL；班次级可能显示数字、N 或 FULL。数字表示剩余候补名额，Y 只表示可以加入候补，不是人数。" }
    ]
  },
  {
    title: "上课安排",
    fields: [
      { term: "Date", meaning: "上课日期范围", description: "表示该教学班实际授课的起止日期，不是选课开放日期或加退选截止日期。" },
      { term: "Day", meaning: "上课星期", description: "例如 M / T / W / R / F / S，分别表示周一至周六；其中 R 表示星期四。" },
      { term: "Time", meaning: "上课时间", description: "例如 09:00 - 11:50。小程序课表以香港时间 GMT+8 展示。" },
      { term: "Bldg", fullName: "Building", meaning: "教学楼", description: "显示教学楼名称或代码，例如 BOC、LI、LAU。" },
      { term: "Room", meaning: "教室", description: "具体教室或房间编号，例如 R4057、3505。" },
      { term: "Instructor", meaning: "授课教师", description: "任课教师姓名；可能同时列出多位教师，TBA 表示尚未公布。" },
      { term: "Medium of Instruction", meaning: "授课语言 / 教学媒介", description: "例如 English 或 Chinese。具体要求以课程 syllabus 为准。" }
    ]
  }
];

Page({
  data: {
    fieldGroups: FIELD_GROUPS
  }
});
