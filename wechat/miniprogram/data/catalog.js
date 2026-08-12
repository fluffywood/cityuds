// 此文件由 wechat/tools/build-data.mjs 自动生成，请勿手动修改。

const metadata = {
  "programme": "MSDS",
  "semester": "Academic Year 2026/27 · A / B / S",
  "schedule_as_of": "2026-08-04 16:48 Asia/Beijing",
  "graduation_credit_units": 30,
  "requirement_credit_units": {
    "core": 15,
    "electives": 15
  },
  "source_url": "https://banweb.cityu.edu.hk/pls/PROD/hwscrssh_cityu.P_GetCrse",
  "notes": [
    "课程与班次数据按 CityU AIMS 2026/27 学年 A、B、S 学期课表手动整理，仅供参考。",
    "Availability and capacity are a snapshot from the schedule timestamp and may change.",
    "WEB=N means the section is listed but is not available for normal web registration; contact the programme or academic unit for registration arrangements.",
    "Zero-credit section components are retained because some courses require registration in both lecture and tutorial components."
  ],
  "academic_year": "2026/27",
  "default_term": "A",
  "terms": [
    {
      "code": "A",
      "label": "Semester A",
      "schedule_as_of": "2026-08-04 16:48 Asia/Beijing"
    },
    {
      "code": "B",
      "label": "Semester B",
      "schedule_as_of": "2026-08-04 16:48 Asia/Beijing"
    },
    {
      "code": "S",
      "label": "Summer Term",
      "schedule_as_of": "2026-08-04 16:48 Asia/Beijing"
    }
  ]
};

const courses = [
  {
    "code": "DSC5001",
    "requirement_type": "core",
    "programme_title": "Statistical Machine Learning I",
    "schedule_title": "Statistical Machine Learning I",
    "title_changed": false,
    "credits": 3,
    "remarks": "SD",
    "prerequisites": "Nil",
    "exclusive_course": "Nil",
    "summary": {
      "web": "Y",
      "available": "23",
      "capacity": "500",
      "medium": "English"
    },
    "section_count": 2,
    "offered_terms": [
      "A"
    ],
    "eligible_sections": [
      {
        "term": "A",
        "crn": "11599",
        "section": "C61",
        "credits": 3,
        "campus": "Main Campus",
        "web": "Y",
        "level": "P",
        "available": "12",
        "capacity": "250",
        "waitlist_available": "N",
        "date": "31/08/2026 - 05/12/2026",
        "day": "S",
        "time": "13:00 - 15:50",
        "building": "BOC",
        "room": "R4057",
        "instructor": "YIN Max",
        "medium": "English",
        "notes": []
      },
      {
        "term": "A",
        "crn": "13470",
        "section": "C62",
        "credits": 3,
        "campus": "Main Campus",
        "web": "Y",
        "level": "P",
        "available": "11",
        "capacity": "250",
        "waitlist_available": "N",
        "date": "31/08/2026 - 28/11/2026",
        "day": "S",
        "time": "09:00 - 11:50",
        "building": "LAU",
        "room": "LT-501",
        "instructor": "MO Zhenling",
        "medium": "English",
        "notes": []
      }
    ],
    "recommendation": {
      "course_code": "DSC5001",
      "level": "neutral",
      "verdict": "适中可选",
      "summary": "没有 ML 基础也能跟上，但画图题易掉坑，树和 SVM 部分需认真学。项目很水给分挺高，但会 curve，部分同学不满意。考试有最低通过要求，闭卷考试。",
      "tags": [
        "难度适中",
        "给分一般",
        "闭卷考试",
        "有项目",
        "会curve"
      ],
      "source_ids": [
        "xhs_ds_sema_gawin"
      ],
      "last_updated": "2026-08-03"
    },
    "sourceReviews": [
      {
        "sourceId": "xhs_ds_sema_gawin",
        "text": "没有ML基础也能跟上，但画图题易掉坑，树和SVM部分需认真学。项目很水给分挺高，但会curve，部分同学不满意。考试有最低通过要求，闭卷考试。",
        "title": "CityU DS SemA 学渣版分享 (一只Gawin)",
        "url": "https://www.xiaohongshu.com/explore/677e0f320000000020022685",
        "platform": "小红书",
        "note": "DS SemA 课程体验汇总，涉及 DSC5001/DSC5002/DSC5003/DSC6012 等课程难度、给分与考核方式。"
      }
    ],
    "documentAvailable": true
  },
  {
    "code": "DSC5002",
    "requirement_type": "core",
    "programme_title": "Exploratory Data Analysis and Visualization",
    "schedule_title": "Exploratory Data Analysis and Visualization",
    "title_changed": false,
    "credits": 3,
    "remarks": "SD",
    "prerequisites": "Nil",
    "exclusive_course": "Nil",
    "summary": {
      "web": "Y",
      "available": "Full",
      "capacity": "516",
      "medium": "English"
    },
    "section_count": 2,
    "offered_terms": [
      "A"
    ],
    "eligible_sections": [
      {
        "term": "A",
        "crn": "11603",
        "section": "C61",
        "credits": 3,
        "campus": "Main Campus",
        "web": "Y",
        "level": "P",
        "available": "58",
        "capacity": "300",
        "waitlist_available": "N",
        "date": "31/08/2026 - 28/11/2026",
        "day": "F",
        "time": "19:00 - 21:50",
        "building": "BOC",
        "room": "LT401",
        "instructor": "WANG Lijia",
        "medium": "English",
        "notes": []
      },
      {
        "term": "A",
        "crn": "13471",
        "section": "C62",
        "credits": 3,
        "campus": "Main Campus",
        "web": "Y",
        "level": "P",
        "available": "Full",
        "capacity": "216",
        "waitlist_available": "N",
        "date": "31/08/2026 - 28/11/2026",
        "day": "F",
        "time": "19:00 - 21:50",
        "building": "LI",
        "room": "3508",
        "instructor": "LI Xinke",
        "medium": "English",
        "notes": []
      }
    ],
    "recommendation": {
      "course_code": "DSC5002",
      "level": "recommended",
      "verdict": "强烈推荐",
      "summary": "水课，强烈推荐！老师在变着法子送分。有项目要 pre，可视化内容不多，跟其他课有交叉。考核为考试+项目。",
      "tags": [
        "难度简单",
        "给分大方",
        "作业少",
        "有项目",
        "需pre"
      ],
      "source_ids": [
        "xhs_ds_sema_gawin"
      ],
      "last_updated": "2026-08-03"
    },
    "sourceReviews": [
      {
        "sourceId": "xhs_ds_sema_gawin",
        "text": "水课，强烈推荐！老师在变着法子送分。有项目要pre，可视化内容不多，跟其他课有交叉。考核为考试+项目。",
        "title": "CityU DS SemA 学渣版分享 (一只Gawin)",
        "url": "https://www.xiaohongshu.com/explore/677e0f320000000020022685",
        "platform": "小红书",
        "note": "DS SemA 课程体验汇总，涉及 DSC5001/DSC5002/DSC5003/DSC6012 等课程难度、给分与考核方式。"
      }
    ],
    "documentAvailable": true
  },
  {
    "code": "DSC5003",
    "requirement_type": "core",
    "programme_title": "Storing and Retrieving Data",
    "schedule_title": "Storing and Retrieving Data",
    "title_changed": false,
    "credits": 3,
    "remarks": "SD",
    "prerequisites": "Nil",
    "exclusive_course": "Nil",
    "summary": {
      "web": "Y",
      "available": "42",
      "capacity": "500",
      "medium": "English"
    },
    "section_count": 2,
    "offered_terms": [
      "A"
    ],
    "eligible_sections": [
      {
        "term": "A",
        "crn": "11604",
        "section": "C61",
        "credits": 3,
        "campus": "Main Campus",
        "web": "Y",
        "level": "P",
        "available": "30",
        "capacity": "250",
        "waitlist_available": "N",
        "date": "31/08/2026 - 05/12/2026",
        "day": "S",
        "time": "13:00 - 15:50",
        "building": "MMW",
        "room": "2450",
        "instructor": "YANG Yu, CHAN Yu Wing",
        "medium": "English",
        "notes": []
      },
      {
        "term": "A",
        "crn": "13472",
        "section": "C62",
        "credits": 3,
        "campus": "Main Campus",
        "web": "Y",
        "level": "P",
        "available": "12",
        "capacity": "250",
        "waitlist_available": "N",
        "date": "31/08/2026 - 05/12/2026",
        "day": "S",
        "time": "09:00 - 11:50",
        "building": "BOC",
        "room": "LT401",
        "instructor": "CHAN Yu Wing, YANG Yu",
        "medium": "English",
        "notes": []
      }
    ],
    "recommendation": {
      "course_code": "DSC5003",
      "level": "recommended",
      "verdict": "基础友好",
      "summary": "跟本科数据库内容一致，多了 MapReduce 概念，不需搭环境。本科学过数据库则无压力。老师严格按原始分给分，不 curve。开卷考试。",
      "tags": [
        "难度简单",
        "给分一般",
        "开卷考试",
        "数据库基础",
        "不curve"
      ],
      "source_ids": [
        "xhs_ds_sema_gawin"
      ],
      "last_updated": "2026-08-03"
    },
    "sourceReviews": [
      {
        "sourceId": "xhs_ds_sema_gawin",
        "text": "跟本科数据库内容一致，多了MapReduce概念，不需搭环境。本科学过数据库则无压力。老师严格按原始分给分，不curve。开卷考试。",
        "title": "CityU DS SemA 学渣版分享 (一只Gawin)",
        "url": "https://www.xiaohongshu.com/explore/677e0f320000000020022685",
        "platform": "小红书",
        "note": "DS SemA 课程体验汇总，涉及 DSC5001/DSC5002/DSC5003/DSC6012 等课程难度、给分与考核方式。"
      }
    ],
    "documentAvailable": true
  },
  {
    "code": "DSC6001",
    "requirement_type": "core",
    "credits": 3,
    "remarks": "SD",
    "prerequisites": "Nil",
    "exclusive_course": "Nil",
    "programme_title": "Statistical Machine Learning II",
    "schedule_title": "Statistical Machine Learning II",
    "title_changed": false,
    "offered_terms": [
      "B"
    ],
    "summary": {
      "web": "Y",
      "available": "500",
      "capacity": "500",
      "medium": "English"
    },
    "section_count": 2,
    "eligible_sections": [
      {
        "term": "B",
        "crn": "11460",
        "section": "C61",
        "credits": 3,
        "campus": "Main Campus",
        "web": "Y",
        "level": "P",
        "available": "250",
        "capacity": "250",
        "waitlist_available": "50",
        "date": "11/01/2027 - 17/04/2027",
        "day": "S",
        "time": "13:00 - 15:50",
        "building": "MMW",
        "room": "2450",
        "instructor": "ZHAO Xiangyu",
        "medium": "English",
        "notes": []
      },
      {
        "term": "B",
        "crn": "13388",
        "section": "C62",
        "credits": 3,
        "campus": "Main Campus",
        "web": "Y",
        "level": "P",
        "available": "250",
        "capacity": "250",
        "waitlist_available": "50",
        "date": "11/01/2027 - 17/04/2027",
        "day": "M",
        "time": "19:00 - 21:50",
        "building": "LAU",
        "room": "LT-501",
        "instructor": "ZHAO Xiangyu",
        "medium": "English",
        "notes": []
      }
    ],
    "recommendation": {
      "course_code": "DSC6001",
      "level": "unknown",
      "verdict": "暂无评价",
      "summary": "本地资料暂未收集到可核对的学生评价，暂不作判断。",
      "tags": [],
      "source_ids": [],
      "last_updated": "2026-08-11"
    },
    "sourceReviews": [],
    "documentAvailable": true
  },
  {
    "code": "DSC6002",
    "requirement_type": "core",
    "credits": 3,
    "remarks": "SD",
    "prerequisites": "Nil",
    "exclusive_course": "Nil",
    "programme_title": "Research Projects for Data Science",
    "schedule_title": "Research Projects for Data Science",
    "title_changed": false,
    "offered_terms": [
      "B",
      "S"
    ],
    "allow_without_section_terms": [
      "S"
    ],
    "summary": {
      "web": "N",
      "available": "450",
      "capacity": "450",
      "medium": "English"
    },
    "section_count": 1,
    "eligible_sections": [
      {
        "term": "B",
        "crn": "11818",
        "section": "D61",
        "credits": 3,
        "campus": "Main Campus",
        "web": "N",
        "level": "P",
        "available": "450",
        "capacity": "450",
        "waitlist_available": "N",
        "date": "11/01/2027 - 17/04/2027",
        "day": null,
        "time": null,
        "building": null,
        "room": null,
        "instructor": "CHAN Yu Wing",
        "medium": "English",
        "notes": []
      }
    ],
    "recommendation": {
      "course_code": "DSC6002",
      "level": "unknown",
      "verdict": "暂无评价",
      "summary": "本地资料暂未收集到可核对的学生评价，暂不作判断。",
      "tags": [],
      "source_ids": [],
      "last_updated": "2026-08-11"
    },
    "sourceReviews": [],
    "documentAvailable": true
  },
  {
    "code": "CS5285",
    "requirement_type": "elective",
    "programme_title": "Introduction to Cybersecurity",
    "schedule_title": "Introduction to Cybersecurity",
    "title_changed": false,
    "credits": 3,
    "remarks": "CC",
    "prerequisites": "Nil",
    "exclusive_course": "Nil",
    "summary": {
      "web": "Y",
      "available": "60",
      "capacity": "60",
      "medium": "English"
    },
    "section_count": 2,
    "offered_terms": [
      "A"
    ],
    "eligible_sections": [
      {
        "term": "A",
        "crn": "13297",
        "section": "CA1",
        "credits": 3,
        "campus": "Main Campus",
        "web": "Y",
        "level": "P R",
        "available": "30",
        "capacity": "30",
        "waitlist_available": "N",
        "date": "31/08/2026 - 28/11/2026",
        "day": "F",
        "time": "15:00 - 17:50",
        "building": "YEUNG",
        "room": "LT-2",
        "instructor": "HANCKE Gerhard Petrus, LU Zhenliang",
        "medium": "English",
        "notes": []
      },
      {
        "term": "A",
        "crn": "15358",
        "section": "CA2",
        "credits": 3,
        "campus": "Main Campus",
        "web": "Y",
        "level": "P R",
        "available": "30",
        "capacity": "30",
        "waitlist_available": "N",
        "date": "31/08/2026 - 28/11/2026",
        "day": "F",
        "time": "19:00 - 21:50",
        "building": "BOC",
        "room": "R4057",
        "instructor": "HANCKE Gerhard Petrus, LU Zhenliang",
        "medium": "English",
        "notes": []
      }
    ],
    "recommendation": {
      "course_code": "CS5285",
      "level": "caution",
      "verdict": "谨慎选择",
      "summary": "密码学与安全协议内容较硬，无密码学基础慎选；但汉克老师（Gerhard Hancke）教了这门课多年，课程体系成熟、带批注的课件与笔记详尽、期末复习课会给重点、通过压力友好（“只要你写了，我会想象它是对的”）。常见考核为两次 problem set 约 20%、开卷期中约 20%，以及可带双面 cheat sheet 的期末约 60%。",
      "tags": [
        "难度较高",
        "期中开卷",
        "期末 cheat sheet",
        "无小组项目",
        "考勤宽松",
        "有回放"
      ],
      "source_ids": [
        "ec_summary",
        "ec_review",
        "ec_sharp",
        "ec_update",
        "ec_sema_course_review",
        "cs_ec_sema_review_2",
        "cs5285_info_sec",
        "cs5285_ds_settle",
        "cs5285_4A",
        "cs5285_blood_3"
      ],
      "last_updated": "2026-08-02"
    },
    "sourceReviews": [
      {
        "sourceId": "ec_summary",
        "text": "本科+研究生学得最认真的一门课[捂脸R]，每节课课后都看老师的note记笔记，不过汉克老师的笔记确实顶呱呱，什么是必学什么是感兴趣可以看都会标得很明白。期中有一题踩陷阱全扣了不然感觉有机会A[满月R]",
        "title": "CityU EC Semester A 安全下车",
        "url": "http://xhslink.cn/o/4QCGDGCwma0",
        "platform": "小红书",
        "note": "涉及 CS5285 的课堂投入与期中体验。"
      },
      {
        "sourceId": "ec_review",
        "text": "应该是SemA上过的最难的一门课。涉及的知识点又多又难，有两个problem set，一次开卷的期中考试，和能带一页cheatsheet的期末考试，🈚考勤🈚project。还好Hancke老师人很不错，给分也好：\"If there's something on your paper, I can imagine it's the right answer.\" Hancke老师课后还会给出每节课的note，明确标注哪些是重点，哪些不需要掌握。总之学的痛并快乐着。(提醒：2次problem set题量特别大，千万不要拖到ddl前一天才开始做！)",
        "title": "CityU EC Semester A 课程简评",
        "url": "http://xhslink.cn/o/4Uxnptv3TGX",
        "platform": "小红书",
        "note": "记录 CS5285 的难度、考核构成与教师反馈。"
      },
      {
        "sourceId": "ec_sharp",
        "text": "最难的一门，不考勤，会捞人，无小组作业，tbl可以不去\n20%：两份作业，给的时间很久，因为开卷所以不难\n20%：期中，开卷，虽然开卷但是题量多，可能没什么时间翻/搜，不过改卷很松，期中考后的一节课课上会发试卷\n60%：期末，可携带计算器，1张双面a4（可打印），题量比较大，考前建议自己再做一遍所有的练习题，考试时遇到复杂的设计协议的题目可以先跳过\n总结：ec的必修课，认真学吧，虽然主播平时不学考前突击也能拿A，但希望不要模仿",
        "title": "CityU EC Semester A 选课锐评（上）",
        "url": "http://xhslink.cn/o/4kPz9LzXM7b",
        "platform": "小红书",
        "note": "详细记录 CS5285 的作业、期中、期末占比与复习建议。"
      },
      {
        "sourceId": "ec_update",
        "text": "密码学与网络安全。很难，可惜是EC必修课不得不选，无考勤、有回放（虽然没看过）。2次个人作业，1次开卷期中考，期末1页cheatsheet。通过应该还是相对容易（老师很善良：只要你写了，我会想象它是对的）。",
        "title": "CityU EC 选课分享（更新中）",
        "url": "http://xhslink.cn/o/AW3uT4JVBvr",
        "platform": "小红书",
        "note": "涉及 CS5285 的考核构成与通过压力。"
      },
      {
        "sourceId": "ec_sema_course_review",
        "text": "好课，两次assignment占20%+一次开卷midterm占20%+一次可带双面cheatsheet的期末考试占60%，老师期末会捞人。",
        "title": "港城 EC SemA 课程简评",
        "url": "http://xhslink.cn/o/2QfQMpxDKX",
        "platform": "小红书",
        "note": "记录 CS5285 的作业、期中与期末考核形式。"
      },
      {
        "sourceId": "cs_ec_sema_review_2",
        "text": "虽说没有 group project，但是也是很难，看选了的同学也是各种后悔，叫苦不迭，还速成不了，没基础的期末简直是看天书，而且课还是在周五晚上就很阴间，建议是别选。",
        "title": "CityU CS / EC Semester A 课程体验",
        "url": "https://www.xiaohongshu.com/explore/676793ee000000000b00d2b1?xsec_token=AB31yjXUEPGDkbmBuP1UCx10tD8c4A2YKtb5PWTQiH2J0=",
        "platform": "小红书",
        "note": "对 CS5285 的难度与班次时段提出保留意见。"
      },
      {
        "sourceId": "cs5285_info_sec",
        "text": "这门课总体来说是在城大上过最棒的课之一。它没有折磨人的组队环节，没有头疼的presentation，只有安心的作业和考试，对我这个i人简直不要太友好。\n这门课是由汉克教授负责的，口音清晰略快，适应之后感觉听着很舒服。成绩构成方面：期末占60%(然后期末卷子至少答对30%)，然后有一次期中考试20%，考完后会进行讲解，两次problem set(有计算有问答有一点点代码，不算很难)，每次占10%，同样老师也会进行讲解。\n课程内容难度的话，前半学期的对称加密，非对称加密，这些稍微认真看看就能学个差不多，期中考试也同样是针对前几周的东西不算难，但期中之后的密钥管理，协议认证，证书这些就比较麻烦了，抽象的概念比较多，不太好理解，不过老师给的材料足够，而且可以随时问老师和ta弥补了这一点，期末的时候，老师还会有一节复习课带你过重点，而且还会发一些复习的材料，所以体验很良好，期末感觉正常做作业都能过，还能带cheat sheet。",
        "title": "聊聊香港城市大学CS5285 信息安全",
        "url": "https://www.xiaohongshu.com/explore/67d048c600000000070342ec?xsec_token=AB4StWrMX1RJuIDU6IrnibLrqmdssJJz3UE8kSI_1iDAQ=",
        "platform": "小红书",
        "note": "来自 CityU-CS-Guide 汇总；详细记录 CS5285 的成绩构成、课程难度与复习课体验。"
      },
      {
        "sourceId": "cs5285_ds_settle",
        "text": "CS5285：硬 但是汉克赛高！！！！ 老师讲了十一年这门课了，课程安排和课程体系非常成熟，内容很丰富。主要内容：基础密码-密钥交换/管理/身份认证基础计算机安全/网络安全\n无代码，但是知识点较多。感兴趣并且想学东西是真的能学得到\n((((*｡_｡)也是我最喜欢也是付出时间最多的课！！",
        "title": "CityU港城ds semA结算画面",
        "url": "https://www.xiaohongshu.com/explore/677d6c92000000000800e8a7?xsec_token=AB2o9CfZn__ofkuLhTbnXlK6D70gawyf3zl6T-5Jk7dwU=",
        "platform": "小红书",
        "note": "来自 CityU-CS-Guide 汇总；评价 CS5285 的课程体系与投入回报。"
      },
      {
        "sourceId": "cs5285_4A",
        "text": "这门课如果学过信息安全数学基础和密码学的话学起来会轻松很多。\n作业体验：作业不多，只有两个Problem set。有midterm，但midterm开卷，比较友好\n上课体验：和5222差不多，老师讲课也是很清晰很有意思的，但没有zoom直播\n期末速成建议：①半开卷（可带双面A4 cheat paper），所以我建议midterm的时候就整理好前面的内容，期末就会轻松一些 ②看老师给的notes边做cheat paper边复习，对ppt的批注有写哪些是interest only，哪些内容是需要掌握的，所以复习起来会快很多！③也是一定要把作业题全部过一遍！计算其实就那几种（gcd 逆元 模重复平方等）自己给自己出几道算考场上就会快很多。\n考试难度：对我来说不算难，但是还是有很多细节拿不准的地方（PPT也没有，应该是老师上课讲的）所以如果想拿A+还是建议听听课",
        "title": "CS终于出成绩啦！双A拿下附期末速成建议",
        "url": "https://www.xiaohongshu.com/explore/677bb65b000000001b0013a4?xsec_token=ABrBs_Tyf5yyUss1RtIfuoAMpO9mDjxMO10iPyNokZy7M=",
        "platform": "小红书",
        "note": "来自 CityU-CS-Guide 汇总；CS5285 的作业、期中与期末速成经验。"
      },
      {
        "sourceId": "cs5285_blood_3",
        "text": "Prof. Gerhard Hancke 的语速会比其他老师更快，如果英语听力不是很好的话，只有自己课下慢慢啃课件和回放了，不过每节课后老师会上传带有注释的课件，非常详细\n这门课主要是探讨对称加密和非对称加密，以及其背后所涉及算法的设计与实现，由于我完全没有密码学基础，学起来是有点吃力的，但总归是啃得动，也学到了东西\n没有 project，但每次作业的量相较于其他课就会比较大了，不过好在也只有两次\n考试占比很高，要好好复习，期中比期末简单，但时间比较紧，只有一个小时，期中考完以后老师好像把作业和期中的总分数占比提高到了 50%，不知道是不是因为大家考得比较好，期末想出难一点",
        "title": "CityU CS 选课血泪史3",
        "url": "https://www.xiaohongshu.com/explore/6896d8f6000000002501cfe6?xsec_token=ABnJrmcUjbNGsgI0MPfRdyWPgHz_fluN0VnY_9fJUX1zI=",
        "platform": "小红书",
        "note": "来自 CityU-CS-Guide 汇总；记录 CS5285 的教师语速、带批注课件与考试压力。"
      }
    ],
    "documentAvailable": true
  },
  {
    "code": "CS5487",
    "requirement_type": "elective",
    "programme_title": "Machine Learning: Principles and Practice",
    "schedule_title": "Machine Learning: Principles and Practice",
    "title_changed": false,
    "credits": 3,
    "remarks": "CC",
    "prerequisites": "Nil",
    "exclusive_course": "Nil",
    "summary": {
      "web": "Y",
      "available": "340",
      "capacity": "340",
      "medium": "English"
    },
    "section_count": 2,
    "offered_terms": [
      "B"
    ],
    "eligible_sections": [
      {
        "term": "B",
        "crn": "13998",
        "section": "C01",
        "credits": 3,
        "campus": "Main Campus",
        "web": "Y",
        "level": "P R",
        "available": "170",
        "capacity": "170",
        "waitlist_available": "34",
        "date": "11/01/2027 - 17/04/2027",
        "day": "R",
        "time": "15:00 - 17:50",
        "building": "LI",
        "room": "6606",
        "instructor": "CHAN Antoni Bert",
        "medium": "English",
        "notes": []
      },
      {
        "term": "B",
        "crn": "14003",
        "section": "C61",
        "credits": 3,
        "campus": "Main Campus",
        "web": "Y",
        "level": "P",
        "available": "170",
        "capacity": "170",
        "waitlist_available": "34",
        "date": "11/01/2027 - 17/04/2027",
        "day": "R",
        "time": "19:00 - 21:50",
        "building": "YEUNG",
        "room": "LT-6",
        "instructor": "CHAN Antoni Bert",
        "medium": "English",
        "notes": []
      }
    ],
    "recommendation": {
      "course_code": "CS5487",
      "level": "research",
      "verdict": "学术向 · 难度较高",
      "summary": "多份经验认为这是数学推导最多的课程之一：从底层推导机器学习算法，需要较好的概率论与线代基础，workload 极大（约 10 个 problem sets + 2 个编程作业 + 项目 + 期中/期末），常与博士及多院系学生同堂。但考试开卷（期中单面、期末双面 cheat sheet），给分友好，认真做 problem set 拿分不难；多数评价称“最值学费的课”，适合目标偏学术或想打牢 ML 理论的同学。",
      "tags": [
        "难度较高",
        "数学推导",
        "作业繁重",
        "期末开卷",
        "有回放",
        "给分友好"
      ],
      "source_ids": [
        "cs5487_phd_eval",
        "cs5487_sema_eval",
        "cs5487_blood_1",
        "cs5487_ee_eval",
        "sema_st_selection"
      ],
      "last_updated": "2026-08-02"
    },
    "sourceReviews": [
      {
        "sourceId": "cs5487_phd_eval",
        "text": "10个problem sets，2个programming assignments，1个course project（2人组队，也可以自己一个人，如果想拿好分数需要做pre），1个mid（单面cheatsheet），1个final（双面cheatsheet）\n需要有比较好的概率论&线代的基础，不然学起来会相当痛苦\n这节课的workload真的超级无敌大，还好都是soft due，在4月下旬结算之前全部写完就行\n但确实好好啃下来也会很有收获，某种意义上也属于收获和痛苦成正比的课\n能做完problem set的全部题就肯定能拿很好的分数啦，不过真的特别多题，敬佩能写完的人（）\n个人体感是学这节课之前可以先接触一下优化那节课，有一些和优化相关的内容，学过优化理解起来应该会轻松点",
        "title": "CityU CS PhD第一年课程评估（3节必修）",
        "url": "https://www.xiaohongshu.com/explore/6a0be10c00000000350215c2?xsec_token=ABdp_KDrgAPqmbwDq_kTmXJW9QYHIUl_l9pbCSeCxYBmk=",
        "platform": "小红书",
        "note": "来自 CityU-CS-Guide 汇总；详细记录 CS5487 的考核构成与前置数学要求。"
      },
      {
        "sourceId": "cs5487_sema_eval",
        "text": "9*theory assignment10%+2*programming assignment20%+midterm10%（一张单面手写）+project30%+final30%（一张手写双面a4cheatpaper）\n作业都可以迟交，而且答案github上都有，project题目自拟，也可以自己一个人不用合作。midterm考的是MLE,MAP,Bayesian estimation三道大题，final考的是EM,BDR,Adaptive SVM,Kernel perceptron四道大题，看了往年题好像翻来覆去都是这几个考点，我就考前花了一天把这几个考点的problem set的解法流程全写在cheat paper上了，考试都用上了，这门课虽然没有完全学懂，但是拿分还是挺简单的。\n总结：cs5187必选，cs5487没想象的难，三门必修考前突击拿B还是没问题的。多多利用github，coursehero，gpt。",
        "title": "Cityu cs semA 课程测评",
        "url": "https://www.xiaohongshu.com/explore/677ca41c000000001703a42a?xsec_token=AB4XEJFVrKtPGxZKcCRHwnXPuU33TUuP41QbYOEZOnKnQ=",
        "platform": "小红书",
        "note": "来自 CityU-CS-Guide 汇总；CS5487 的成绩占比、考点与突击策略。"
      },
      {
        "sourceId": "cs5487_blood_1",
        "text": "这一年上过的最难的课，不过也是我觉得最值学费的课，除了难以外没有任何缺点，略有遗憾的是后半学期的老师不是 Antoni，上了一节课之后就再也没上过\nAntoni 的英语应该是我上过课的所有老师中最标准的，语速会稍快，但是录课能完全听懂，所以完全不用担心\n每节课会以一个引例开始，循序渐进地深入其背后的数学原理，手把手带着大家推导每一个公式，每一个细节都不会放过\n听不懂会觉得他在讲天书，听懂了就会觉得 Antoni yyds，因为他真的想把你教会\n作业要花很多时间，具体难度可以参考 @Quinn 大大的帖子\nproject 的 topic 可以自己定，范围很广，也可以选默认项目（难度尚可）\n考试会出几道大题，每道大题下面有几道小题，纯数学，没有一点水分，好在考试占比不是很高，考差了也不会太影响最后得分，期末只考了后半学期的内容",
        "title": "CityU CS 选课血泪史1",
        "url": "https://www.xiaohongshu.com/explore/689598a60000000025015346?xsec_token=ABkcLi8vFXQUNoL1pMRAmhyFcVNVbsAU6f2APCbglVopg=",
        "platform": "小红书",
        "note": "来自 CityU-CS-Guide 汇总；评价 CS5487 的难度、授课方式与考试特点。"
      },
      {
        "sourceId": "cs5487_ee_eval",
        "text": "CS5487 机器学习，这门课真的很难，和博士一起上课，ds，cs，数学，ee多个院一起。是从底层数学推导不同机器学习算法。没有ppt，老师会在课上板书。每周都有作业，有时候感觉是一题都不会，这门课花的时间最多，需要有较好的数学基础，机器学习理论基础。可以B站上参考下机器学习白板推导。当然我也看有人评价，专注底层逻辑收获很大。\nEE院也有一门机器学习，看大家反馈偏应用，好上手。更推荐这个。",
        "title": "cityu ee 课程测评续",
        "url": "https://www.xiaohongshu.com/explore/677a9b800000000013009ebc?xsec_token=ABfKeqv7r6AQ_N5jSKPpIJR8ImqvS-RKAIY4G4aTdfjac=",
        "platform": "小红书",
        "note": "来自 CityU-CS-Guide 汇总；从 EE 视角评价 CS5487 的数学门槛与收获。"
      },
      {
        "sourceId": "sema_st_selection",
        "text": "CS5487 ML理论：25级学期 A 变成了ML实践，但形式应该还是Atoni大佬+新老师，听着费劲的可以去开小灶 -> B站白板推导。",
        "title": "港城计算机 CityU CS 学期A & ST 选课",
        "url": "https://www.xiaohongshu.com/explore/68c2dbe2000000001d00a87b?xsec_token=AB1h-Jdb7HHcuMT00NiW-vktr9QUqovfmeHPyP16PKHyQ=",
        "platform": "小红书",
        "note": "来自 CityU-CS-Guide 汇总；涉及 CS5487 与 CS6290 的简要评价。"
      }
    ],
    "documentAvailable": true
  },
  {
    "code": "CS6290",
    "requirement_type": "elective",
    "programme_title": "Privacy-enhancing Technologies",
    "schedule_title": "Privacy-enhancing Technologies",
    "title_changed": false,
    "credits": 3,
    "remarks": "CC",
    "prerequisites": "CS5285（须在 Semester A 修读）",
    "exclusive_course": "Nil",
    "summary": {
      "web": "Y",
      "available": "40",
      "capacity": "40",
      "medium": "English"
    },
    "section_count": 2,
    "offered_terms": [
      "B"
    ],
    "selection_requirement": {
      "terms": [
        "A"
      ],
      "minimum_credits": 0,
      "required_courses": [
        "CS5285"
      ]
    },
    "eligible_sections": [
      {
        "term": "B",
        "crn": "12937",
        "section": "CP1",
        "credits": 3,
        "campus": "Main Campus",
        "web": "Y",
        "level": "P R",
        "available": "40",
        "capacity": "40",
        "waitlist_available": "2",
        "date": "11/01/2027 - 17/04/2027",
        "day": "R",
        "time": "19:00 - 20:50",
        "building": "CMC",
        "room": "M3017",
        "instructor": "CHEN Yufei",
        "medium": "English",
        "notes": []
      },
      {
        "term": "B",
        "crn": "12938",
        "section": "TP1",
        "credits": 0,
        "campus": "Main Campus",
        "web": "Y",
        "level": "P R",
        "available": "40",
        "capacity": "40",
        "waitlist_available": "2",
        "date": "11/01/2027 - 17/04/2027",
        "day": "R",
        "time": "21:00 - 21:50",
        "building": "CMC",
        "room": "M3017",
        "instructor": "CHEN Yufei",
        "medium": "English",
        "notes": []
      }
    ],
    "recommendation": {
      "course_code": "CS6290",
      "level": "good",
      "verdict": "整体推荐 · 平时需露面",
      "summary": "多份经验认为课程以区块链与 DeFi 技术为主，内容较多但考试开卷（可带两页 A4）、给分友好（“必选，日常任务完全拥抱 AI”）。平时有每三周一次的阅读作业与课堂 quiz（缺席有补考风险，考勤偏严）、4 人小组调研项目，整体压力可控；期末题量大但占比不高。适合对 Web3 / 隐私增强方向感兴趣的同学。",
      "tags": [
        "区块链/DeFi",
        "开卷期末",
        "阅读作业与 quiz",
        "小组项目",
        "无回放",
        "考勤较严"
      ],
      "source_ids": [
        "cs6290_st_eval",
        "cs6290_blood_6",
        "cs6290_semb_4A",
        "cs6290_summary",
        "sutong_guide",
        "sema_st_selection"
      ],
      "last_updated": "2026-08-02"
    },
    "sourceReviews": [
      {
        "sourceId": "cs6290_st_eval",
        "text": "Lecturer: Yuefeng DU\n上课体验：主要聚焦于区块链以及电子货币内容，与之前的安全课关联非常少。老师的英语不难听懂，但课程本身内容很多很多，再加上summer term的时长缩水，上课节奏比较快。Lecture结束之后有Tutorial，形式为老师带着一起做题，题目整体难度比最后的exam大很多。\n作业体验：每三节课一次Reading Assignment，DDL那一天的课上前10分钟会有一个quiz，考察内容并非上课内容，而是阅读的论文内容，整体难度不大但如果没读过就没法做。另外，老师鼓励用AI工具辅助阅读，但要在作业中体现和AI的交互过程。严格禁止在quiz中用AI作弊，老师会认为没有线下参加quiz的人有作弊嫌疑，会要求没有线下参加的人参与补考，因此至少每三周要在课堂上露面一次。无线上课\n项目体验：4人小组项目，可选开发或是survey，不过所有人都选了survey。具体是调研区块链领域相关内容，比如电子货币法律监管或者稳定币之类。整体项目压力很小，甚至在展示前一周紧急开始都完全来得及。\n考试体验：闭卷期末考试，几乎覆盖了所有课程内容，必须要记忆和理解兼备才能游刃有余。",
        "title": "Cityu Msc CS St 课程评价",
        "url": "https://www.xiaohongshu.com/explore/68a545a7000000001c030804?xsec_token=ABBgAVu6GLiQ6g_H0bRvFnVsiz19cSS9_VvCoYT41yYoY=",
        "platform": "小红书",
        "note": "来自 CityU-CS-Guide 汇总；详细记录 CS6290 的阅读作业、quiz、项目与考试。"
      },
      {
        "sourceId": "cs6290_blood_6",
        "text": "主要讲区块链（比特币、以太坊）和 DeFi 相关的技术\n老师想讲的东西肯定是好东西，但斯密马赛，您的课我是真有点上不明白，PPT 也有点看不懂（虽然每个 lecture 平均下来100多页），可能是我太菜了\nTutorial 上老师会带着大家一起读 paper，每个同学读一句，以此往复，课下提问也会被要求用英语，可能比较想练口语\n作业允许使用 AI，quiz（Summer Term 新增）基于作业的阅读材料出题，quiz 当天不去上课有一定风险（第二次 quiz 那天人比较少，老师搞了一次签到，没去的人只能补考了）\nproject 可以选 survey，没有代码，但选题比较重要\n期末题量很大，也有很多不会做的题，但好在考试占比不算很高，不会太影响最后得分",
        "title": "CityU CS 选课血泪史6",
        "url": "https://www.xiaohongshu.com/explore/68a5b6d5000000001d00171a?xsec_token=ABLbCQKSaUlLosgQZx1LBINEjZs2hLSND3wwOmdeOnIG8=",
        "platform": "小红书",
        "note": "来自 CityU-CS-Guide 汇总；评价 CS6290 的区块链内容、quiz 签到风险与项目。"
      },
      {
        "sourceId": "cs6290_semb_4A",
        "text": "好课。主要探讨区块链技术和原理，平时分是四份阅读报告，四个小测，和一个小组作业。老师对AI非常包容，不要直接把AI输出交上去贴脸开大就行了。小组作业有大神队友带着拿了全班最高分，爽死了。开卷考试只能带两张A4纸，难度低但题量大。遇到有题目一分钟也想不出怎么做就要跳题，千万别犹豫，两小时不断写就完了。",
        "title": "CityU MSc CS Sem B课程评价（全A上岸啦）",
        "url": "https://www.xiaohongshu.com/explore/6a0be1210000000035024644?xsec_token=ABhbQcz06VLSSPUzCUuOMVTBh5a1Z9Ph6bRU_dcPZPbpo=",
        "platform": "小红书",
        "note": "来自 CityU-CS-Guide 汇总；评价 CS6290 的平时构成与开卷期末。"
      },
      {
        "sourceId": "cs6290_summary",
        "text": "老师：老师非常随和，聊过几次天，像和学长沟通一样，完全没架子。\n考试：Quiz 可以搜题，甚至不需要本人到场，缺席了后续还能补，期末考试为开卷，没有任何难题。\n项目：Project 难度低，利用ai完全可以胜任，答辩很轻松",
        "title": "CityU MSc Computer Science 课程经验总结",
        "url": "https://www.xiaohongshu.com/explore/6a016b410000000035021175?xsec_token=AB-8OTA5utOCJ53TXk2zNgh5jrsSNnqRo5qA6I4xiayFo=",
        "platform": "小红书",
        "note": "来自 CityU-CS-Guide 汇总；简评 CS6290 的老师、quiz 与期末开卷。"
      },
      {
        "sourceId": "sutong_guide",
        "text": "CS6290 Privacy-enhancing Technology 必选！日常任务完全拥抱ai，且平时分占比高。期末考开卷且基本抄了就能会，项目自由度很高",
        "title": "为什么不推荐你速通港城cs硕（附选课攻略）",
        "url": "https://www.xiaohongshu.com/explore/69fdd97b000000003601efb7?xsec_token=ABnJ6_vOnxu4oCjNgD0hbfoStZOAnwPOrahZRTJiY-qQs=",
        "platform": "小红书",
        "note": "来自 CityU-CS-Guide 汇总；强烈推荐 CS6493 与 CS6290。"
      },
      {
        "sourceId": "sema_st_selection",
        "text": "CS6290 Privacy：读了区块链很多论文，Proj也可以论文调研，总体给分不错。",
        "title": "港城计算机 CityU CS 学期A & ST 选课",
        "url": "https://www.xiaohongshu.com/explore/68c2dbe2000000001d00a87b?xsec_token=AB1h-Jdb7HHcuMT00NiW-vktr9QUqovfmeHPyP16PKHyQ=",
        "platform": "小红书",
        "note": "来自 CityU-CS-Guide 汇总；涉及 CS5487 与 CS6290 的简要评价。"
      }
    ],
    "documentAvailable": true
  },
  {
    "code": "CS6493",
    "requirement_type": "elective",
    "programme_title": "Natural Language Processing",
    "schedule_title": "Natural Language Processing",
    "title_changed": false,
    "credits": 3,
    "remarks": "CC",
    "prerequisites": "Nil",
    "exclusive_course": "Nil",
    "summary": {
      "web": "Y",
      "available": "40",
      "capacity": "40",
      "medium": "English"
    },
    "section_count": 2,
    "offered_terms": [
      "B"
    ],
    "eligible_sections": [
      {
        "term": "B",
        "crn": "15357",
        "section": "CA1",
        "credits": 3,
        "campus": "Main Campus",
        "web": "Y",
        "level": "P R",
        "available": "20",
        "capacity": "20",
        "waitlist_available": "N",
        "date": "11/01/2027 - 17/04/2027",
        "day": "W",
        "time": "11:00 - 12:50",
        "building": "YEUNG",
        "room": "LT-2",
        "instructor": "SONG Linqi, MA Chen",
        "medium": "English",
        "notes": []
      },
      {
        "term": "B",
        "crn": "12006",
        "section": "CP1",
        "credits": 3,
        "campus": "Main Campus",
        "web": "Y",
        "level": "P R",
        "available": "20",
        "capacity": "20",
        "waitlist_available": "6",
        "date": "11/01/2027 - 17/04/2027",
        "day": "W",
        "time": "19:00 - 20:50",
        "building": "LI",
        "room": "3505",
        "instructor": "SONG Linqi, MA Chen",
        "medium": "English",
        "notes": []
      }
    ],
    "recommendation": {
      "course_code": "CS6493",
      "level": "strong",
      "verdict": "优先考虑",
      "summary": "多份 SemB 经验一致推荐（“NLP 必选”）：课程覆盖 Transformer、BERT、GPT、RAG 等大模型内容，宋老师（与 Data Engineering 同一位教师）授课有条理、给分慷慨。常见安排为两次作业 + 小组项目 + 闭卷期末（概念、计算与代码题，出自 tutorial 与作业），复习后基本不会挂；期末有一定难度，但普遍反馈整体给分友好。",
      "tags": [
        "大模型入门",
        "闭卷考试",
        "两次作业",
        "小组项目",
        "给分友好",
        "考勤宽松"
      ],
      "source_ids": [
        "cs6493_semb_lower",
        "cs6493_semb_eval",
        "cs6493_cs_semb",
        "cs6493_selection_3",
        "cs6493_hunzi",
        "sutong_guide"
      ],
      "last_updated": "2026-08-02"
    },
    "sourceReviews": [
      {
        "sourceId": "cs6493_semb_lower",
        "text": "Lecturer: Linqi SONG\n和SemA的DE是同个老师，除去课程内容外，可以看作DE Pro版。课程内容组织很有条理，定义-架构-应用循序渐进。Tutorial是TA负责，也和DE类似，会给出课程内容相关代码给大家自主运行并讲解，高情商：代码量大管饱；低情商：代码量太大我没记下来考试没写出代码题\n项目：1-6人项目。比较看重创新，建议多放精力到实验设计以及数据分析中。大家项目分数都不怎么高，平均分数69.6。有线下pre\n作业：两次作业，难度较大但可问AI，整体体验不错\n考试：和DE考试风格类似，大概60%记忆，20%理解，20%代码与计算。难度较大，但给分慷慨，不会的题也尽量多写些。（我刚考完出来就知道自己被扣了12分，因为代码题一点都写不出来）",
        "title": "Cityu Msc CS SemB课程评价（下）",
        "url": "https://www.xiaohongshu.com/explore/683476a700000000220270f9?xsec_token=ABD3MHiD_BCmA_DFiXj_aOjUtSareKfkE1024ASnax9kA=",
        "platform": "小红书",
        "note": "来自 CityU-CS-Guide 汇总；详细记录 CS6493 的课程、项目、作业与考试体验。"
      },
      {
        "sourceId": "cs6493_semb_eval",
        "text": "2*assignment30%+group project30%+final40%\n考试闭卷，只看review PPT就差不多了，五道大题，第一道概念题30分，比如prompt类型，skip-gram和CBOW，RAG中的optimizing indexing和when to retrieve等，一道补全代码题12分，想冲a以上的同学需要复习tutorial中的代码，tensor parallelism的row和column实现，PEFT的adapter和lora，llm agents，ppo,dpo和drpo异同，BELU和cross-entropy计算等，竟然没考transformer。",
        "title": "Cityu cs semB 课程测评",
        "url": "https://www.xiaohongshu.com/explore/682d5b26000000000c039eaf?xsec_token=ABj8Mw-n4dJH8eywK3h7ZzXDBCztHqPWY9V-tjjcHk2BY=",
        "platform": "小红书",
        "note": "来自 CityU-CS-Guide 汇总；CS6493 的成绩构成与期末考点。"
      },
      {
        "sourceId": "cs6493_cs_semb",
        "text": "非常好的老师，非常好的课，唯一的问题就是我，我学不懂。项目挑的最水的，上课是听不懂的，课件是真的很多的，教的内容挺新的，包括Transformer、GPT、RAG等。会有作业和小组作业，小组作业的话，有一定基础的同学会做起来轻松很多。期末感觉挺难，考的挺广，闭卷，会有代码题（出自tutorial，但我看了也不会）、概念解释，场景题，计算题（出自作业）。可以结合网上资料复习等等，我是倾向了解大概即可，不必死磕。",
        "title": "CityU CS SEMB",
        "url": "https://www.xiaohongshu.com/explore/682dfcfd00000000120000d9?xsec_token=ABj8Mw-n4dJH8eywK3h7ZzXJmN-5eCm9wsW5rxrkWekUY=",
        "platform": "小红书",
        "note": "来自 CityU-CS-Guide 汇总；评价 CS6493 的内容新颖度、作业与期末难度。"
      },
      {
        "sourceId": "cs6493_selection_3",
        "text": "分数构成：assignment，project，final\n跟Data Engineering都是非常nice的宋教授。强度不大，个人觉得内容不太好理解，涉及到大模型。project可以基于tutorial完成，tutorial难度正常。final是有点难，但好在你难我难大家难，加上教授人好，最后分不低。这门课学我是没学明白细节，涉及到复杂的神经网络，只大致明白了框架。不过还是很好的课，可以打开思路，对大模型初学者有很好的引领作用。",
        "title": "CityU Msc Computer Science选课3",
        "url": "https://www.xiaohongshu.com/explore/66c2b41e0000000025031b7f?xsec_token=ABzxwxMEJl_R9LqOxLpocTn-XDs8FrURJJ_HEYXiFlYRY=",
        "platform": "小红书",
        "note": "来自 CityU-CS-Guide 汇总；评价 CS6493 的强度、tutorial 与给分。"
      },
      {
        "sourceId": "cs6493_hunzi",
        "text": "cs6493 nlp：和上学期的de一个老师，整体流程也差不多，两次作业，一次给分不高但也不难的project，闭卷考试。虽然老师说要理解概念不能死记硬背，但背就完事了，代码题可以碰碰运气，今年考的就比较简单。",
        "title": "cityu cs semb选课总结（混子版",
        "url": "https://www.xiaohongshu.com/explore/6a0f2914000000003501f1b4?xsec_token=ABp3M15AaHTe7EJKyjHo9zD4bhAoAymljISCJ_zahf50Q=",
        "platform": "小红书",
        "note": "来自 CityU-CS-Guide 汇总；简评 CS6493 的作业、project 与闭卷考试。"
      },
      {
        "sourceId": "sutong_guide",
        "text": "CS6493 NLP 必选！基本有ai背景的就是学一学理论。",
        "title": "为什么不推荐你速通港城cs硕（附选课攻略）",
        "url": "https://www.xiaohongshu.com/explore/69fdd97b000000003601efb7?xsec_token=ABnJ6_vOnxu4oCjNgD0hbfoStZOAnwPOrahZRTJiY-qQs=",
        "platform": "小红书",
        "note": "来自 CityU-CS-Guide 汇总；强烈推荐 CS6493 与 CS6290。"
      }
    ],
    "documentAvailable": true
  },
  {
    "code": "DSC6003",
    "requirement_type": "elective",
    "credits": 3,
    "remarks": "SD",
    "prerequisites": "Nil",
    "exclusive_course": "Nil",
    "programme_title": "Bayesian Data Analysis",
    "schedule_title": "Bayesian Data Analysis",
    "title_changed": false,
    "offered_terms": [
      "B"
    ],
    "summary": {
      "web": "Y",
      "available": "200",
      "capacity": "200",
      "medium": "English"
    },
    "section_count": 1,
    "eligible_sections": [
      {
        "term": "B",
        "crn": "15249",
        "section": "C61",
        "credits": 3,
        "campus": "Main Campus",
        "web": "Y",
        "level": "P",
        "available": "200",
        "capacity": "200",
        "waitlist_available": "N",
        "date": "11/01/2027 - 17/04/2027",
        "day": "F",
        "time": "19:00 - 21:50",
        "building": "YEUNG",
        "room": "LT-18",
        "instructor": "TAN Matthias Hwai-yong",
        "medium": "English",
        "notes": []
      }
    ],
    "recommendation": {
      "course_code": "DSC6003",
      "level": "unknown",
      "verdict": "暂无评价",
      "summary": "本地资料暂未收集到可核对的学生评价，暂不作判断。",
      "tags": [],
      "source_ids": [],
      "last_updated": "2026-08-11"
    },
    "sourceReviews": [],
    "documentAvailable": true
  },
  {
    "code": "DSC6004",
    "requirement_type": "elective",
    "programme_title": "Topics of Artificial Intelligence for Smart Cities",
    "schedule_title": "Topics of Artificial Intelligence for Smart Cities",
    "title_changed": false,
    "credits": 3,
    "remarks": "SD",
    "prerequisites": "Nil",
    "exclusive_course": "Nil",
    "summary": {
      "web": "Y",
      "available": "265",
      "capacity": "265",
      "medium": "English"
    },
    "section_count": 2,
    "offered_terms": [
      "A"
    ],
    "eligible_sections": [
      {
        "term": "A",
        "crn": "15821",
        "section": "C01",
        "credits": 3,
        "campus": "Main Campus",
        "web": "Y",
        "level": "P",
        "available": "165",
        "capacity": "165",
        "waitlist_available": "N",
        "date": "31/08/2026 - 28/11/2026",
        "day": "T",
        "time": "13:00 - 15:50",
        "building": "BOC",
        "room": "R4057",
        "instructor": "WU Jiaman",
        "medium": "English",
        "notes": []
      },
      {
        "term": "A",
        "crn": "15834",
        "section": "C05",
        "credits": 3,
        "campus": "Main Campus",
        "web": "Y",
        "level": "P",
        "available": "100",
        "capacity": "100",
        "waitlist_available": "N",
        "date": "31/08/2026 - 28/11/2026",
        "day": "T",
        "time": "13:00 - 15:50",
        "building": "BOC",
        "room": "R4057",
        "instructor": "WU Jiaman",
        "medium": "English",
        "notes": []
      }
    ],
    "recommendation": {
      "course_code": "DSC6004",
      "level": "recommended",
      "verdict": "推荐选择",
      "summary": "院主任授课，上课佛系口音舒服。讲基础 ML/DL 加智慧城市各方面知识。期末开卷，推荐选。可能有出勤分。",
      "tags": [
        "难度简单",
        "作业适中",
        "开卷考试",
        "佛系风格",
        "可能有出勤分"
      ],
      "source_ids": [
        "xhs_ds_semb_gawin"
      ],
      "last_updated": "2026-08-03"
    },
    "sourceReviews": [
      {
        "sourceId": "xhs_ds_semb_gawin",
        "text": "院主任授课，上课佛系口音舒服。讲基础ML/DL加智慧城市各方面知识。期末开卷，推荐选。可能有出勤分。",
        "title": "CityU DS SemB 分享 (一只Gawin)",
        "url": "https://www.xiaohongshu.com/explore/68303e95000000002102e3bc",
        "platform": "小红书",
        "note": "DS SemB 课程体验汇总，涉及 DSC6004/DSC6013/DSC6016 等课程评价。"
      }
    ],
    "documentAvailable": true
  },
  {
    "code": "DSC6006",
    "requirement_type": "project",
    "programme_title": "Dissertation",
    "schedule_title": "Dissertation",
    "title_changed": false,
    "credits": 6,
    "remarks": "SD",
    "prerequisites": "Nil",
    "exclusive_course": "Nil",
    "summary": {
      "web": "N",
      "available": "0",
      "capacity": "0",
      "medium": "English"
    },
    "section_count": 0,
    "offered_terms": [
      "A",
      "B"
    ],
    "allow_without_section": true,
    "eligible_sections": [],
    "recommendation": {
      "course_code": "DSC6006",
      "level": "neutral",
      "verdict": "论文课程",
      "summary": "可以远程完成，时间看想做成什么水平。可以和 mentor 讨论投稿方向。考核为论文。",
      "tags": [
        "学位论文",
        "可远程",
        "灵活安排",
        "无考试"
      ],
      "source_ids": [
        "xhs_ds_hunzi_qing"
      ],
      "last_updated": "2026-08-03"
    },
    "sourceReviews": [
      {
        "sourceId": "xhs_ds_hunzi_qing",
        "text": "可以远程完成，时间看想做成什么水平。可以和mentor讨论投稿方向。考核为论文。",
        "title": "CityU 24Fall DS混子完结撒花 评论区 (晴可可)",
        "url": "https://www.xiaohongshu.com/explore/68b0296a000000001d010a16",
        "platform": "小红书",
        "note": "DS 混子完结总结评论区，涉及 DSC6006 论文课与 DSC6007/DSC8013 等课程评价。"
      }
    ],
    "documentAvailable": true
  },
  {
    "code": "DSC6007",
    "requirement_type": "elective",
    "programme_title": "Dynamic Programming and Reinforcement Learning",
    "schedule_title": "Dynamic Programming and Reinforcement Learning",
    "title_changed": false,
    "credits": 3,
    "remarks": "SD",
    "prerequisites": "Nil",
    "exclusive_course": "Nil",
    "summary": {
      "web": "Y",
      "available": "190",
      "capacity": "190",
      "medium": "English"
    },
    "section_count": 1,
    "offered_terms": [
      "B"
    ],
    "eligible_sections": [
      {
        "term": "B",
        "crn": "15250",
        "section": "C01",
        "credits": 3,
        "campus": "Main Campus",
        "web": "Y",
        "level": "P",
        "available": "190",
        "capacity": "190",
        "waitlist_available": "N",
        "date": "11/01/2027 - 17/04/2027",
        "day": "R",
        "time": "09:00 - 11:50",
        "building": "LAU",
        "room": "LT-501",
        "instructor": "HO Chin Pang",
        "medium": "English",
        "notes": []
      }
    ],
    "recommendation": {
      "course_code": "DSC6007",
      "level": "unknown",
      "verdict": "暂无评价",
      "summary": "本地资料暂未收集到可核对的学生评价，暂不作判断。",
      "tags": [],
      "source_ids": [],
      "last_updated": "2026-08-06"
    },
    "sourceReviews": [],
    "documentAvailable": true
  },
  {
    "code": "DSC6008",
    "requirement_type": "elective",
    "programme_title": "Design of Experiments",
    "schedule_title": "Design of Experiments",
    "title_changed": false,
    "credits": 3,
    "remarks": "SD",
    "prerequisites": "Nil",
    "exclusive_course": "Nil",
    "summary": {
      "web": "Y",
      "available": "50",
      "capacity": "50",
      "medium": "English"
    },
    "section_count": 1,
    "offered_terms": [
      "A"
    ],
    "eligible_sections": [
      {
        "term": "A",
        "crn": "15799",
        "section": "C62",
        "credits": 3,
        "campus": "Main Campus",
        "web": "Y",
        "level": "P",
        "available": "50",
        "capacity": "50",
        "waitlist_available": "N",
        "date": "31/08/2026 - 05/12/2026",
        "day": "S",
        "time": "16:00 - 18:50",
        "building": "YEUNG",
        "room": "LT-2",
        "instructor": "TBA DS002",
        "medium": "English",
        "notes": []
      }
    ],
    "recommendation": {
      "course_code": "DSC6008",
      "level": "unknown",
      "verdict": "暂无评价",
      "summary": "含高斯过程建模，评估方式均衡分散。",
      "tags": [
        "实验设计",
        "高斯过程",
        "均衡评估"
      ],
      "source_ids": [],
      "last_updated": "2026-08-03"
    },
    "sourceReviews": [],
    "documentAvailable": true
  },
  {
    "code": "DSC6011",
    "requirement_type": "elective",
    "programme_title": "Optimization for Data Science",
    "schedule_title": "Optimization for Data Science",
    "title_changed": false,
    "credits": 3,
    "remarks": "SD",
    "prerequisites": "Nil",
    "exclusive_course": "Nil",
    "summary": {
      "web": "Y",
      "available": "190",
      "capacity": "190",
      "medium": "English"
    },
    "section_count": 1,
    "offered_terms": [
      "A"
    ],
    "eligible_sections": [
      {
        "term": "A",
        "crn": "11607",
        "section": "C61",
        "credits": 3,
        "campus": "Main Campus",
        "web": "Y",
        "level": "P",
        "available": "190",
        "capacity": "190",
        "waitlist_available": "N",
        "date": "31/08/2026 - 28/11/2026",
        "day": "F",
        "time": "13:00 - 15:50",
        "building": "LI",
        "room": "3505",
        "instructor": "WANG Jun",
        "medium": "English",
        "notes": []
      }
    ],
    "recommendation": {
      "course_code": "DSC6011",
      "level": "caution",
      "verdict": "建议避雷",
      "summary": "考试占比 80%，需扎实数学基础。有学生明确建议避开此课（避雷）。考核以考试为主。",
      "tags": [
        "考试占比高",
        "数学要求高",
        "避雷",
        "考试为主"
      ],
      "source_ids": [
        "xhs_ds_xuanke_buyao"
      ],
      "last_updated": "2026-08-03"
    },
    "sourceReviews": [
      {
        "sourceId": "xhs_ds_xuanke_buyao",
        "text": "考试占比80%，需扎实数学基础。有学生明确建议避开此课（避雷）。考核以考试为主。",
        "title": "球CityU DS专业选课推荐 评论区",
        "url": "https://www.xiaohongshu.com/explore/68988a1e0000000023033fed",
        "platform": "小红书",
        "note": "DS 选课推荐评论区，涉及 DSC6011 避雷、DSC6012/DSC6013 等课程讨论。"
      }
    ],
    "documentAvailable": true
  },
  {
    "code": "DSC6012",
    "requirement_type": "elective",
    "programme_title": "Time Series and Recurrent Neural Networks",
    "schedule_title": "Time Series and Recurrent Neural Networks",
    "title_changed": false,
    "credits": 3,
    "remarks": "SD",
    "prerequisites": "Nil",
    "exclusive_course": "Nil",
    "summary": {
      "web": "Y",
      "available": "250",
      "capacity": "250",
      "medium": "English"
    },
    "section_count": 1,
    "offered_terms": [
      "A"
    ],
    "eligible_sections": [
      {
        "term": "A",
        "crn": "13508",
        "section": "C01",
        "credits": 3,
        "campus": "Main Campus",
        "web": "Y",
        "level": "P",
        "available": "250",
        "capacity": "250",
        "waitlist_available": "N",
        "date": "31/08/2026 - 28/11/2026",
        "day": "R",
        "time": "12:00 - 14:50",
        "building": "ICP",
        "room": "B-101",
        "instructor": "WANG Linlin",
        "medium": "English",
        "notes": []
      }
    ],
    "recommendation": {
      "course_code": "DSC6012",
      "level": "recommended",
      "verdict": "给分友好",
      "summary": "比王燕老师讲的时间序列简单，统计专业无压力。神经网络部分讲 RNN/LSTM/GRU，难度不大。作者数学一般也拿了 B+，给分友好。闭卷考试。",
      "tags": [
        "难度适中",
        "给分大方",
        "闭卷考试",
        "时间序列",
        "RNN/LSTM"
      ],
      "source_ids": [
        "xhs_ds_sema_gawin",
        "xhs_ds_qiu_zhu"
      ],
      "last_updated": "2026-08-03"
    },
    "sourceReviews": [
      {
        "sourceId": "xhs_ds_sema_gawin",
        "text": "比王燕老师讲的时间序列简单，统计专业无压力。神经网络部分讲RNN/LSTM/GRU，难度不大。作者数学一般也拿了B+，给分友好。闭卷考试。",
        "title": "CityU DS SemA 学渣版分享 (一只Gawin)",
        "url": "https://www.xiaohongshu.com/explore/677e0f320000000020022685",
        "platform": "小红书",
        "note": "DS SemA 课程体验汇总，涉及 DSC5001/DSC5002/DSC5003/DSC6012 等课程难度、给分与考核方式。"
      },
      {
        "sourceId": "xhs_ds_qiu_zhu",
        "text": "比王燕老师讲的时间序列简单，统计专业无压力。给分友好。",
        "title": "港硕26届ds选课求助 评论区 (RUI)",
        "url": "https://www.xiaohongshu.com/explore/6a6832680000000001002c0e",
        "platform": "小红书",
        "note": "DS 选课求助评论区，涉及 DSC6012 时间序列课程评价。"
      }
    ],
    "documentAvailable": true
  },
  {
    "code": "DSC6013",
    "requirement_type": "elective",
    "programme_title": "Topics in Financial Engineering and Technology",
    "schedule_title": "Topics in Financial Engineering and Technology",
    "title_changed": false,
    "credits": 3,
    "remarks": "SD",
    "prerequisites": "Nil",
    "exclusive_course": "Nil",
    "summary": {
      "web": "Y",
      "available": "250",
      "capacity": "250",
      "medium": "English"
    },
    "section_count": 1,
    "offered_terms": [
      "A"
    ],
    "eligible_sections": [
      {
        "term": "A",
        "crn": "14419",
        "section": "C61",
        "credits": 3,
        "campus": "Main Campus",
        "web": "Y",
        "level": "P",
        "available": "250",
        "capacity": "250",
        "waitlist_available": "N",
        "date": "31/08/2026 - 28/11/2026",
        "day": "T",
        "time": "19:00 - 21:50",
        "building": "ICP",
        "room": "B-101",
        "instructor": "WU Qi",
        "medium": "English",
        "notes": []
      }
    ],
    "recommendation": {
      "course_code": "DSC6013",
      "level": "neutral",
      "verdict": "项目制但难度上升",
      "summary": "适合非商科背景，老师讲得比较慢。老师之前在雷曼兄弟工作，风格随意，喜欢交流市场。固收基础加风险基础，no exam 纯项目制。注意：2025 年底有学生反馈难度大增，不再是纯水课。",
      "tags": [
        "难度适中",
        "项目制",
        "金融工程",
        "无考试",
        "难度上升"
      ],
      "source_ids": [
        "xhs_ds_semb_gawin",
        "xhs_ds_xuanke_buyao"
      ],
      "last_updated": "2026-08-03"
    },
    "sourceReviews": [
      {
        "sourceId": "xhs_ds_semb_gawin",
        "text": "适合非商科背景，老师讲得比较慢。老师之前在雷曼兄弟工作，风格随意，喜欢交流市场。固收基础加风险基础，no exam纯项目制。注意2025年底有学生反馈难度大增，不再是纯水课。",
        "title": "CityU DS SemB 分享 (一只Gawin)",
        "url": "https://www.xiaohongshu.com/explore/68303e95000000002102e3bc",
        "platform": "小红书",
        "note": "DS SemB 课程体验汇总，涉及 DSC6004/DSC6013/DSC6016 等课程评价。"
      },
      {
        "sourceId": "xhs_ds_xuanke_buyao",
        "text": "2025年底有学生反馈难度大增，不再是纯水课。",
        "title": "球CityU DS专业选课推荐 评论区",
        "url": "https://www.xiaohongshu.com/explore/68988a1e0000000023033fed",
        "platform": "小红书",
        "note": "DS 选课推荐评论区，涉及 DSC6011 避雷、DSC6012/DSC6013 等课程讨论。"
      }
    ],
    "documentAvailable": true
  },
  {
    "code": "DSC6015",
    "requirement_type": "elective",
    "credits": 3,
    "remarks": "SD",
    "prerequisites": "Nil",
    "exclusive_course": "Nil",
    "programme_title": "Stochastic Optimization for Machine Learning",
    "schedule_title": "Stochastic Optimization for Machine Learning",
    "title_changed": false,
    "offered_terms": [
      "B"
    ],
    "summary": {
      "web": "Y",
      "available": "200",
      "capacity": "200",
      "medium": "English"
    },
    "section_count": 1,
    "eligible_sections": [
      {
        "term": "B",
        "crn": "15363",
        "section": "C01",
        "credits": 3,
        "campus": "Main Campus",
        "web": "Y",
        "level": "P",
        "available": "200",
        "capacity": "200",
        "waitlist_available": "N",
        "date": "11/01/2027 - 17/04/2027",
        "day": "R",
        "time": "13:00 - 15:50",
        "building": "LI",
        "room": "2505",
        "instructor": "TBA DS002",
        "medium": "English",
        "notes": []
      }
    ],
    "recommendation": {
      "course_code": "DSC6015",
      "level": "unknown",
      "verdict": "暂无评价",
      "summary": "本地资料暂未收集到可核对的学生评价，暂不作判断。",
      "tags": [],
      "source_ids": [],
      "last_updated": "2026-08-11"
    },
    "sourceReviews": [],
    "documentAvailable": true
  },
  {
    "code": "DSC6016",
    "requirement_type": "elective",
    "programme_title": "Predictive Analytics and Financial Applications",
    "schedule_title": "Predictive Analytics and Financial Applications",
    "title_changed": false,
    "credits": 3,
    "remarks": "SD",
    "prerequisites": "Nil",
    "exclusive_course": "Nil",
    "summary": {
      "web": "Y",
      "available": "380",
      "capacity": "380",
      "medium": "English"
    },
    "section_count": 2,
    "offered_terms": [
      "A",
      "B"
    ],
    "eligible_sections": [
      {
        "term": "A",
        "crn": "15647",
        "section": "C61",
        "credits": 3,
        "campus": "Main Campus",
        "web": "Y",
        "level": "P",
        "available": "190",
        "capacity": "190",
        "waitlist_available": "N",
        "date": "31/08/2026 - 28/11/2026",
        "day": "M",
        "time": "19:00 - 21:50",
        "building": "LI",
        "room": "6606",
        "instructor": "CHEUNG Alan",
        "medium": "English",
        "notes": []
      },
      {
        "term": "B",
        "crn": "12158",
        "section": "C61",
        "credits": 3,
        "campus": "Main Campus",
        "web": "Y",
        "level": "P",
        "available": "190",
        "capacity": "190",
        "waitlist_available": "40",
        "date": "11/01/2027 - 17/04/2027",
        "day": "W",
        "time": "19:00 - 21:50",
        "building": "YEUNG",
        "room": "LT-6",
        "instructor": "QIAO Xiao",
        "medium": "English",
        "notes": []
      }
    ],
    "recommendation": {
      "course_code": "DSC6016",
      "level": "neutral",
      "verdict": "无回放需注意",
      "summary": "老师宾大本硕加芝加哥博，口音很舒服。Mid 很简单，学过 DSC6012 或本科时间序列可裸考。注意：没有 Zoom 没有 Recording，不适合远程上课。闭卷考试。",
      "tags": [
        "难度适中",
        "闭卷考试",
        "无回放",
        "不适合远程",
        "金融预测"
      ],
      "source_ids": [
        "xhs_ds_semb_gawin"
      ],
      "last_updated": "2026-08-03"
    },
    "sourceReviews": [
      {
        "sourceId": "xhs_ds_semb_gawin",
        "text": "老师宾大本硕加芝加哥博，口音很舒服。Mid很简单，学过DSC6012或本科时间序列可裸考。注意没有Zoom没有Recording，不适合远程上课。闭卷考试。",
        "title": "CityU DS SemB 分享 (一只Gawin)",
        "url": "https://www.xiaohongshu.com/explore/68303e95000000002102e3bc",
        "platform": "小红书",
        "note": "DS SemB 课程体验汇总，涉及 DSC6004/DSC6013/DSC6016 等课程评价。"
      }
    ],
    "documentAvailable": true
  },
  {
    "code": "DSC6017",
    "requirement_type": "project",
    "programme_title": "Internship Project",
    "schedule_title": "Internship Project",
    "title_changed": false,
    "credits": 6,
    "remarks": "SD",
    "prerequisites": "Nil",
    "exclusive_course": "DSC6032",
    "summary": {
      "web": "N",
      "available": "0",
      "capacity": "0",
      "medium": "English"
    },
    "section_count": 0,
    "offered_terms": [
      "B"
    ],
    "allow_without_section": true,
    "eligibility_note": "仅限全日制第二年学生修读",
    "selection_requirement": {
      "terms": [
        "A"
      ],
      "minimum_credits": 15,
      "required_courses": [
        "DSC5001",
        "DSC5002",
        "DSC5003"
      ],
      "confirmation_key": "full_time_second_year",
      "minimum_credits_confirmation_key": "internship_completed_15_credits",
      "minimum_credits_confirmation_label": "我已修满15学分"
    },
    "eligible_sections": [],
    "recommendation": {
      "course_code": "DSC6017",
      "level": null,
      "verdict": "暂无评价",
      "summary": "实习项目课程：学生在数据科学相关行业机构完成一段实习，将课堂所学应用于真实业务场景，积累实际数据分析项目经验，并按课程要求提交实习项目报告与成果。本地暂未收集到往届学生评价。",
      "tags": [
        "实习",
        "项目实践",
        "行业应用"
      ],
      "source_ids": []
    },
    "sourceReviews": [],
    "documentAvailable": true
  },
  {
    "code": "DSC6018",
    "requirement_type": "elective",
    "programme_title": "Health Data Analytics",
    "schedule_title": "Health Data Analytics",
    "title_changed": false,
    "credits": 3,
    "remarks": "SD",
    "prerequisites": "Nil",
    "exclusive_course": "Nil",
    "summary": {
      "web": "Y",
      "available": "200",
      "capacity": "200",
      "medium": "English"
    },
    "section_count": 1,
    "offered_terms": [
      "A"
    ],
    "eligible_sections": [
      {
        "term": "A",
        "crn": "15444",
        "section": "C61",
        "credits": 3,
        "campus": "Main Campus",
        "web": "Y",
        "level": "P",
        "available": "200",
        "capacity": "200",
        "waitlist_available": "N",
        "date": "31/08/2026 - 28/11/2026",
        "day": "R",
        "time": "19:00 - 21:50",
        "building": "MMW",
        "room": "3420",
        "instructor": "TBA DS002",
        "medium": "English",
        "notes": []
      }
    ],
    "recommendation": {
      "course_code": "DSC6018",
      "level": null,
      "verdict": "暂无评价",
      "summary": "健康数据分析课程：聚焦医疗与健康领域的数据科学应用，涉及电子健康记录、临床与公共卫生数据的统计分析和机器学习建模，支持疾病预测、临床决策与健康管理。课程为近期开设，具体内容与考核以开课学期为准。本地暂未收集到往届学生评价。",
      "tags": [
        "医疗健康",
        "健康数据",
        "统计建模",
        "机器学习"
      ],
      "source_ids": []
    },
    "sourceReviews": [],
    "documentAvailable": true
  },
  {
    "code": "DSC6019",
    "requirement_type": "elective",
    "credits": 3,
    "remarks": "SD",
    "prerequisites": "Nil",
    "exclusive_course": "Nil",
    "programme_title": "Embodied AI and Applications",
    "schedule_title": "Embodied AI and Applications",
    "title_changed": false,
    "offered_terms": [
      "B"
    ],
    "summary": {
      "web": "Y",
      "available": "100",
      "capacity": "100",
      "medium": "English"
    },
    "section_count": 1,
    "eligible_sections": [
      {
        "term": "B",
        "crn": "15584",
        "section": "C02",
        "credits": 3,
        "campus": "Main Campus",
        "web": "Y",
        "level": "P",
        "available": "100",
        "capacity": "100",
        "waitlist_available": "N",
        "date": "11/01/2027 - 17/04/2027",
        "day": "M",
        "time": "14:00 - 16:50",
        "building": "LAU",
        "room": "LT-501",
        "instructor": "YIN Max",
        "medium": "English",
        "notes": []
      }
    ],
    "recommendation": {
      "course_code": "DSC6019",
      "level": "unknown",
      "verdict": "暂无评价",
      "summary": "本地资料暂未收集到可核对的学生评价，暂不作判断。",
      "tags": [],
      "source_ids": [],
      "last_updated": "2026-08-11"
    },
    "sourceReviews": [],
    "documentAvailable": true
  },
  {
    "code": "DSC6032",
    "requirement_type": "project",
    "credits": 3,
    "remarks": "SD",
    "prerequisites": "Nil",
    "exclusive_course": "DSC6017",
    "programme_title": "Internship Project (S)",
    "schedule_title": "Internship Project (S)",
    "title_changed": false,
    "offered_terms": [
      "S"
    ],
    "summary": {
      "web": "N",
      "available": "0",
      "capacity": "0",
      "medium": "English"
    },
    "section_count": 0,
    "allow_without_section": true,
    "selection_requirement": {
      "terms": [
        "A",
        "B"
      ],
      "minimum_credits": 15,
      "required_courses": [
        "DSC5001",
        "DSC5002",
        "DSC5003"
      ]
    },
    "eligible_sections": [],
    "recommendation": {
      "course_code": "DSC6032",
      "level": "unknown",
      "verdict": "暂无评价",
      "summary": "本地资料暂未收集到可核对的学生评价，暂不作判断。",
      "tags": [],
      "source_ids": [],
      "last_updated": "2026-08-11"
    },
    "sourceReviews": [],
    "documentAvailable": true
  },
  {
    "code": "DSC8007",
    "requirement_type": "elective",
    "credits": 3,
    "remarks": "SD",
    "prerequisites": "Nil",
    "exclusive_course": "Nil",
    "programme_title": "Deep Learning",
    "schedule_title": "Deep Learning",
    "title_changed": false,
    "offered_terms": [
      "B"
    ],
    "summary": {
      "web": "Y",
      "available": "230",
      "capacity": "230",
      "medium": "English"
    },
    "section_count": 1,
    "eligible_sections": [
      {
        "term": "B",
        "crn": "15290",
        "section": "C02",
        "credits": 3,
        "campus": "Main Campus",
        "web": "Y",
        "level": "P",
        "available": "230",
        "capacity": "230",
        "waitlist_available": "N",
        "date": "11/01/2027 - 17/04/2027",
        "day": "M",
        "time": "09:00 - 11:50",
        "building": "LI",
        "room": "3505",
        "instructor": "WANG Linlin",
        "medium": "English",
        "notes": []
      }
    ],
    "recommendation": {
      "course_code": "DSC8007",
      "level": "unknown",
      "verdict": "暂无评价",
      "summary": "本地资料暂未收集到可核对的学生评价，暂不作判断。",
      "tags": [],
      "source_ids": [],
      "last_updated": "2026-08-11"
    },
    "sourceReviews": [],
    "documentAvailable": true
  },
  {
    "code": "DSC8009",
    "requirement_type": "elective",
    "credits": 3,
    "remarks": "SD",
    "prerequisites": "Nil",
    "exclusive_course": "Nil",
    "programme_title": "Data Mining and Knowledge Discovery",
    "schedule_title": "Data Mining and Knowledge Discovery",
    "title_changed": false,
    "offered_terms": [
      "B"
    ],
    "summary": {
      "web": "Y",
      "available": "160",
      "capacity": "160",
      "medium": "English"
    },
    "section_count": 1,
    "eligible_sections": [
      {
        "term": "B",
        "crn": "13941",
        "section": "C04",
        "credits": 3,
        "campus": "Main Campus",
        "web": "Y",
        "level": "P",
        "available": "160",
        "capacity": "160",
        "waitlist_available": "N",
        "date": "11/01/2027 - 17/04/2027",
        "day": "F",
        "time": "16:00 - 18:50",
        "building": "LAU",
        "room": "LT-501",
        "instructor": "TBA DS005",
        "medium": "English",
        "notes": []
      }
    ],
    "recommendation": {
      "course_code": "DSC8009",
      "level": "unknown",
      "verdict": "暂无评价",
      "summary": "本地资料暂未收集到可核对的学生评价，暂不作判断。",
      "tags": [],
      "source_ids": [],
      "last_updated": "2026-08-11"
    },
    "sourceReviews": [],
    "documentAvailable": true
  },
  {
    "code": "DSC8013",
    "requirement_type": "elective",
    "credits": 3,
    "remarks": "SD",
    "prerequisites": "Nil",
    "exclusive_course": "Nil",
    "programme_title": "Statistical Methods for Categorical Data Analysis",
    "schedule_title": "Statistical Methods for Categorical Data Analysis",
    "title_changed": false,
    "offered_terms": [
      "B"
    ],
    "summary": {
      "web": "Y",
      "available": "165",
      "capacity": "165",
      "medium": "English"
    },
    "section_count": 1,
    "eligible_sections": [
      {
        "term": "B",
        "crn": "12390",
        "section": "C02",
        "credits": 3,
        "campus": "Main Campus",
        "web": "Y",
        "level": "P",
        "available": "165",
        "capacity": "165",
        "waitlist_available": "N",
        "date": "11/01/2027 - 17/04/2027",
        "day": "R",
        "time": "15:00 - 17:50",
        "building": "LI",
        "room": "3505",
        "instructor": "SO Ernest",
        "medium": "English",
        "notes": []
      }
    ],
    "recommendation": {
      "course_code": "DSC8013",
      "level": "unknown",
      "verdict": "暂无评价",
      "summary": "本地资料暂未收集到可核对的学生评价，暂不作判断。",
      "tags": [],
      "source_ids": [],
      "last_updated": "2026-08-11"
    },
    "sourceReviews": [],
    "documentAvailable": true
  },
  {
    "code": "DSC8014",
    "requirement_type": "elective",
    "credits": 3,
    "remarks": "SD",
    "prerequisites": "Nil",
    "exclusive_course": "Nil",
    "programme_title": "Online Learning and Optimization",
    "schedule_title": "Online Learning and Optimization",
    "title_changed": false,
    "offered_terms": [
      "B"
    ],
    "summary": {
      "web": "Y",
      "available": "140",
      "capacity": "140",
      "medium": "English"
    },
    "section_count": 1,
    "eligible_sections": [
      {
        "term": "B",
        "crn": "15568",
        "section": "C02",
        "credits": 3,
        "campus": "Main Campus",
        "web": "Y",
        "level": "P",
        "available": "140",
        "capacity": "140",
        "waitlist_available": "N",
        "date": "11/01/2027 - 17/04/2027",
        "day": "T",
        "time": "09:00 - 11:50",
        "building": "LI",
        "room": "3508",
        "instructor": "YUNG Siu Pang",
        "medium": "English",
        "notes": []
      }
    ],
    "recommendation": {
      "course_code": "DSC8014",
      "level": "unknown",
      "verdict": "暂无评价",
      "summary": "本地资料暂未收集到可核对的学生评价，暂不作判断。",
      "tags": [],
      "source_ids": [],
      "last_updated": "2026-08-11"
    },
    "sourceReviews": [],
    "documentAvailable": true
  }
];

const courseByCode = {};
courses.forEach((course) => {
  courseByCode[course.code] = course;
});

module.exports = { metadata, courses, courseByCode };
