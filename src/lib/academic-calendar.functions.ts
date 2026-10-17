// @ts-nocheck
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// ---------------------------------------------------------------------------
// TYPES & DATA MODELS (Requirements 21, 22, 23, 29, 30, 36)
// ---------------------------------------------------------------------------

export type ActivityType =
  | "academic"
  | "syllabus"
  | "notification"
  | "qp_setting"
  | "qp_submission"
  | "scrutiny"
  | "printing"
  | "duty_allotment"
  | "seating"
  | "exam"
  | "valuation"
  | "marks"
  | "result_analysis"
  | "holiday"
  | "milestone";

export type ActivityStatus =
  | "Not Started"
  | "Upcoming"
  | "In Progress"
  | "Completed"
  | "Delayed"
  | "Overdue"
  | "Cancelled";

export type ActivityPriority = "Low" | "Medium" | "High" | "Urgent";

export type ResponsibleTeam =
  | "University"
  | "Course Faculty"
  | "Test Committee"
  | "Scrutiny Team"
  | "Department"
  | "—"
  | "Other";

export interface AcademicActivity {
  id: string;
  sl_no: number;
  name: string;
  activity_type: ActivityType;
  description?: string;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  due_date?: string;  // YYYY-MM-DD
  timeline_display: string; // e.g. "By 25 September 2026"
  academic_year: string;
  semester: string;
  test_association: "Test-1" | "Test-2" | "None";
  test_id?: string;
  department: string;
  course?: string;
  responsible_team: ResponsibleTeam;
  responsible_users?: string[];
  status: ActivityStatus;
  priority: ActivityPriority;
  actual_completion_date?: string;
  notes?: string;
  remarks?: string;
  dependencies?: string[]; // IDs of predecessor activities that must finish first
  override_reason?: string;
  notification_settings: {
    notify_on_assignment: boolean;
    reminder_days: number[];
    notify_on_overdue: boolean;
  };
}

export interface AcademicSemesterConfig {
  academic_year: string;
  semester_name: string;
  start_date: string;
  end_date: string;
  current_simulated_date: string;
  test1_start_date: string;
  test1_end_date: string;
  test2_start_date: string;
  test2_end_date: string;
}

export interface ScheduleRisk {
  id: string;
  activity_id: string;
  activity_name: string;
  severity: "high" | "medium" | "low";
  risk_type: "approaching_deadline" | "predecessor_incomplete" | "delayed" | "overdue" | "capacity_deficit";
  message: string;
  recommendation: string;
  due_date: string;
  responsible_team: string;
}

// ---------------------------------------------------------------------------
// DEFAULT SEMESTER DATASET (EXACT 32 ACTIVITIES FROM PROVIDED SCHEDULE)
// ---------------------------------------------------------------------------

export const DEFAULT_SEMESTER_CONFIG: AcademicSemesterConfig = {
  academic_year: "2026–2027",
  semester_name: "Odd Semester (VII / V / III)",
  start_date: "2026-09-07",
  end_date: "2027-01-05",
  current_simulated_date: "2026-09-07",
  test1_start_date: "2026-10-22",
  test1_end_date: "2026-10-29",
  test2_start_date: "2026-12-07",
  test2_end_date: "2026-12-14",
};

export const INITIAL_ACADEMIC_ACTIVITIES: AcademicActivity[] = [
  {
    id: "act-01",
    sl_no: 1,
    name: "Semester Commencement",
    activity_type: "milestone",
    description: "Official reopening of college and orientation for the odd semester 2026-2027.",
    start_date: "2026-09-07",
    end_date: "2026-09-07",
    due_date: "2026-09-07",
    timeline_display: "7 September 2026",
    academic_year: "2026–2027",
    semester: "Odd Semester",
    test_association: "None",
    department: "All",
    responsible_team: "University",
    responsible_users: ["Dean Academic", "Principal"],
    status: "Completed",
    actual_completion_date: "2026-09-07",
    priority: "High",
    notes: "Commencement address and timetable distribution completed.",
    dependencies: [],
    notification_settings: { notify_on_assignment: true, reminder_days: [3, 1, 0], notify_on_overdue: true },
  },
  {
    id: "act-02",
    sl_no: 2,
    name: "Completion of Module 1",
    activity_type: "syllabus",
    description: "Coverage of Module 1 across all accredited undergraduate and postgraduate courses.",
    start_date: "2026-09-07",
    end_date: "2026-09-25",
    due_date: "2026-09-25",
    timeline_display: "By 25 September 2026",
    academic_year: "2026–2027",
    semester: "Odd Semester",
    test_association: "Test-1",
    department: "All",
    responsible_team: "Course Faculty",
    responsible_users: ["All Course Instructors"],
    status: "In Progress",
    priority: "Medium",
    notes: "Track syllabus coverage on Course Diary / ERP.",
    dependencies: ["act-01"],
    notification_settings: { notify_on_assignment: true, reminder_days: [7, 3, 1], notify_on_overdue: true },
  },
  {
    id: "act-03",
    sl_no: 3,
    name: "Completion of Module 2",
    activity_type: "syllabus",
    description: "Course instructors to complete teaching Module 2 content.",
    start_date: "2026-09-26",
    end_date: "2026-10-09",
    due_date: "2026-10-09",
    timeline_display: "By 9 October 2026",
    academic_year: "2026–2027",
    semester: "Odd Semester",
    test_association: "Test-1",
    department: "All",
    responsible_team: "Course Faculty",
    responsible_users: ["All Course Instructors"],
    status: "Upcoming",
    priority: "Medium",
    notes: "Ensure tutorial sheets and problem sets are discussed.",
    dependencies: ["act-02"],
    notification_settings: { notify_on_assignment: true, reminder_days: [7, 3, 1], notify_on_overdue: true },
  },
  {
    id: "act-04",
    sl_no: 4,
    name: "Completion of 0.5 Module",
    activity_type: "syllabus",
    description: "Instructors to complete 50% of Module 3 required for Test-1 syllabus benchmark.",
    start_date: "2026-10-10",
    end_date: "2026-10-15",
    due_date: "2026-10-15",
    timeline_display: "By 15 October 2026",
    academic_year: "2026–2027",
    semester: "Odd Semester",
    test_association: "Test-1",
    department: "All",
    responsible_team: "Course Faculty",
    responsible_users: ["All Course Instructors"],
    status: "Upcoming",
    priority: "Medium",
    notes: "Total coverage benchmark reaches 2.5 modules.",
    dependencies: ["act-03"],
    notification_settings: { notify_on_assignment: true, reminder_days: [3, 1], notify_on_overdue: true },
  },
  {
    id: "act-05",
    sl_no: 5,
    name: "Completion of 2.5 Modules – Test 1",
    activity_type: "syllabus",
    description: "Formal certification of Test-1 syllabus coverage (minimum 2.5 modules completed).",
    start_date: "2026-09-07",
    end_date: "2026-10-16",
    due_date: "2026-10-16",
    timeline_display: "By 16 October 2026",
    academic_year: "2026–2027",
    semester: "Odd Semester",
    test_association: "Test-1",
    department: "All",
    responsible_team: "Course Faculty",
    responsible_users: ["Department HODs", "Course Instructors"],
    status: "Upcoming",
    priority: "High",
    notes: "Departmental HOD meeting to verify syllabus compliance.",
    dependencies: ["act-04"],
    notification_settings: { notify_on_assignment: true, reminder_days: [3, 1], notify_on_overdue: true },
  },
  {
    id: "act-06",
    sl_no: 6,
    name: "Test-1 Notification & Time Table",
    activity_type: "notification",
    description: "Publication of Test-1 official timetable, room slots, and student guidelines.",
    start_date: "2026-10-12",
    end_date: "2026-10-12",
    due_date: "2026-10-12",
    timeline_display: "12 October 2026",
    academic_year: "2026–2027",
    semester: "Odd Semester",
    test_association: "Test-1",
    department: "All",
    responsible_team: "Test Committee",
    responsible_users: ["Controller of Examinations", "Test Committee Convener"],
    status: "Upcoming",
    priority: "High",
    notes: "Circulate notice across student portal, department notice boards and faculty email.",
    dependencies: [],
    notification_settings: { notify_on_assignment: true, reminder_days: [7, 3, 1], notify_on_overdue: true },
  },
  {
    id: "act-07",
    sl_no: 7,
    name: "Question Paper Setting",
    activity_type: "qp_setting",
    description: "Course instructors draft two sets of question papers along with bloom taxonomy mapping and scheme.",
    start_date: "2026-10-12",
    end_date: "2026-10-14",
    due_date: "2026-10-14",
    timeline_display: "12–14 October 2026",
    academic_year: "2026–2027",
    semester: "Odd Semester",
    test_association: "Test-1",
    department: "All",
    responsible_team: "Course Faculty",
    responsible_users: ["Course Faculty"],
    status: "Upcoming",
    priority: "Urgent",
    notes: "Adhere to OBE rubrics and standard format.",
    dependencies: ["act-06"],
    notification_settings: { notify_on_assignment: true, reminder_days: [3, 1], notify_on_overdue: true },
  },
  {
    id: "act-08",
    sl_no: 8,
    name: "Submission of Question Papers",
    activity_type: "qp_submission",
    description: "Confidential submission of drafted question papers to the Department Scrutiny Committee.",
    start_date: "2026-10-15",
    end_date: "2026-10-15",
    due_date: "2026-10-15",
    timeline_display: "15 October 2026",
    academic_year: "2026–2027",
    semester: "Odd Semester",
    test_association: "Test-1",
    department: "All",
    responsible_team: "Course Faculty",
    responsible_users: ["Course Faculty"],
    status: "Upcoming",
    priority: "Urgent",
    notes: "Submission via sealed envelope or encrypted institutional QP repository.",
    dependencies: ["act-07"],
    notification_settings: { notify_on_assignment: true, reminder_days: [3, 1], notify_on_overdue: true },
  },
  {
    id: "act-09",
    sl_no: 9,
    name: "Scrutiny & Finalization",
    activity_type: "scrutiny",
    description: "Department scrutiny board evaluates syllabus compliance, clarity, difficulty level and approves final QP.",
    start_date: "2026-10-16",
    end_date: "2026-10-16",
    due_date: "2026-10-16",
    timeline_display: "16 October 2026",
    academic_year: "2026–2027",
    semester: "Odd Semester",
    test_association: "Test-1",
    department: "All",
    responsible_team: "Scrutiny Team",
    responsible_users: ["Scrutiny Board Chairman", "Subject Experts"],
    status: "Upcoming",
    priority: "Urgent",
    notes: "Sign scrutiny reports and hand over selected paper to Test Committee.",
    dependencies: ["act-08"],
    notification_settings: { notify_on_assignment: true, reminder_days: [1], notify_on_overdue: true },
  },
  {
    id: "act-10",
    sl_no: 10,
    name: "Holiday",
    activity_type: "holiday",
    description: "Institutional Holiday.",
    start_date: "2026-10-17",
    end_date: "2026-10-17",
    due_date: "2026-10-17",
    timeline_display: "17 October 2026",
    academic_year: "2026–2027",
    semester: "Odd Semester",
    test_association: "None",
    department: "All",
    responsible_team: "—",
    status: "Upcoming",
    priority: "Low",
    notes: "Non-working day.",
    dependencies: [],
    notification_settings: { notify_on_assignment: false, reminder_days: [], notify_on_overdue: false },
  },
  {
    id: "act-11",
    sl_no: 11,
    name: "Sunday",
    activity_type: "holiday",
    description: "Weekly Holiday.",
    start_date: "2026-10-18",
    end_date: "2026-10-18",
    due_date: "2026-10-18",
    timeline_display: "18 October 2026",
    academic_year: "2026–2027",
    semester: "Odd Semester",
    test_association: "None",
    department: "All",
    responsible_team: "—",
    status: "Upcoming",
    priority: "Low",
    notes: "Non-working day.",
    dependencies: [],
    notification_settings: { notify_on_assignment: false, reminder_days: [], notify_on_overdue: false },
  },
  {
    id: "act-12",
    sl_no: 12,
    name: "Printing & Packaging of QPs",
    activity_type: "printing",
    description: "Confidential mass printing, sealing in hall-wise envelopes, and secure storage in strong room.",
    start_date: "2026-10-19",
    end_date: "2026-10-20",
    due_date: "2026-10-20",
    timeline_display: "19–20 October 2026",
    academic_year: "2026–2027",
    semester: "Odd Semester",
    test_association: "Test-1",
    department: "All",
    responsible_team: "Test Committee",
    responsible_users: ["Confidential Printing Superintendent"],
    status: "Upcoming",
    priority: "Urgent",
    notes: "Maintain exact count of printed booklets and packaging log.",
    dependencies: ["act-09"],
    notification_settings: { notify_on_assignment: true, reminder_days: [3, 1], notify_on_overdue: true },
  },
  {
    id: "act-13",
    sl_no: 13,
    name: "B-Form & Duty Allotment",
    activity_type: "duty_allotment",
    description: "Generation of B-Forms, assigning invigilator faculty to examination halls and relief squads.",
    start_date: "2026-10-19",
    end_date: "2026-10-20",
    due_date: "2026-10-20",
    timeline_display: "19–20 October 2026",
    academic_year: "2026–2027",
    semester: "Odd Semester",
    test_association: "Test-1",
    department: "All",
    responsible_team: "Test Committee",
    responsible_users: ["Invigilation Coordinator", "Chief Superintendent"],
    status: "Upcoming",
    priority: "High",
    notes: "Duty roster published to faculty portal and SMS notifications sent.",
    dependencies: ["act-06"],
    notification_settings: { notify_on_assignment: true, reminder_days: [3, 1], notify_on_overdue: true },
  },
  {
    id: "act-14",
    sl_no: 14,
    name: "Seating Arrangement & Classroom Preparation",
    activity_type: "seating",
    description: "Pasting seat labels, sanitization of desks, hall capacity verification, and whiteboard signage.",
    start_date: "2026-10-21",
    end_date: "2026-10-21",
    due_date: "2026-10-21",
    timeline_display: "21 October 2026",
    academic_year: "2026–2027",
    semester: "Odd Semester",
    test_association: "Test-1",
    department: "All",
    responsible_team: "Department",
    responsible_users: ["Department Exam Coordinators", "Hall Attendants"],
    status: "Upcoming",
    priority: "Urgent",
    notes: "Publish seating charts at ground floor foyer.",
    dependencies: ["act-13"],
    notification_settings: { notify_on_assignment: true, reminder_days: [1], notify_on_overdue: true },
  },
  {
    id: "act-15",
    sl_no: 15,
    name: "TEST–1",
    activity_type: "exam",
    description: "Execution of Test-1 across all departments, halls, and computer laboratories.",
    start_date: "2026-10-22",
    end_date: "2026-10-29",
    due_date: "2026-10-29",
    timeline_display: "22–29 October 2026",
    academic_year: "2026–2027",
    semester: "Odd Semester",
    test_association: "Test-1",
    department: "All",
    responsible_team: "Department",
    responsible_users: ["Chief Superintendent", "Invigilators", "Squad Members"],
    status: "Upcoming",
    priority: "Urgent",
    notes: "Daily absentee tally and answer book collection strictly maintained.",
    dependencies: ["act-12", "act-14"],
    notification_settings: { notify_on_assignment: true, reminder_days: [3, 1], notify_on_overdue: true },
  },
  {
    id: "act-16",
    sl_no: 16,
    name: "Test-1 Valuation",
    activity_type: "valuation",
    description: "Centralized evaluation of Test-1 answer scripts according to approved marking scheme.",
    start_date: "2026-10-30",
    end_date: "2026-11-06",
    due_date: "2026-11-06",
    timeline_display: "30 October–6 November 2026",
    academic_year: "2026–2027",
    semester: "Odd Semester",
    test_association: "Test-1",
    department: "All",
    responsible_team: "Course Faculty",
    responsible_users: ["Course Faculty"],
    status: "Upcoming",
    priority: "High",
    notes: "Show evaluated scripts to students for transparency and resolve grievances.",
    dependencies: ["act-15"],
    notification_settings: { notify_on_assignment: true, reminder_days: [5, 2, 0], notify_on_overdue: true },
  },
  {
    id: "act-17",
    sl_no: 17,
    name: "Submission of Test-1 Marks",
    activity_type: "marks",
    description: "Upload finalized Test-1 marks and attendance onto the academic portal.",
    start_date: "2026-11-06",
    end_date: "2026-11-07",
    due_date: "2026-11-07",
    timeline_display: "By 7 November 2026",
    academic_year: "2026–2027",
    semester: "Odd Semester",
    test_association: "Test-1",
    department: "All",
    responsible_team: "Course Faculty",
    responsible_users: ["Course Faculty", "Academic Deans"],
    status: "Upcoming",
    priority: "Urgent",
    notes: "Lock marks entries and print signed consolidated sheets.",
    dependencies: ["act-16"],
    notification_settings: { notify_on_assignment: true, reminder_days: [3, 1, 0], notify_on_overdue: true },
  },
  {
    id: "act-18",
    sl_no: 18,
    name: "Continuation of Syllabus for Test-2",
    activity_type: "syllabus",
    description: "Resumption of lectures for Module 4 and Module 5.",
    start_date: "2026-10-30",
    end_date: "2026-11-25",
    due_date: "2026-11-25",
    timeline_display: "30 October–25 November 2026",
    academic_year: "2026–2027",
    semester: "Odd Semester",
    test_association: "Test-2",
    department: "All",
    responsible_team: "Course Faculty",
    responsible_users: ["All Course Instructors"],
    status: "Upcoming",
    priority: "Medium",
    notes: "Complete remaining syllabus topics and practical lab sessions.",
    dependencies: ["act-15"],
    notification_settings: { notify_on_assignment: true, reminder_days: [7, 3], notify_on_overdue: false },
  },
  {
    id: "act-19",
    sl_no: 19,
    name: "Completion of Test-2 Syllabus",
    activity_type: "syllabus",
    description: "Full completion of syllabus across all courses (remaining 2.5 modules).",
    start_date: "2026-11-20",
    end_date: "2026-11-25",
    due_date: "2026-11-25",
    timeline_display: "By 25 November 2026",
    academic_year: "2026–2027",
    semester: "Odd Semester",
    test_association: "Test-2",
    department: "All",
    responsible_team: "Course Faculty",
    responsible_users: ["Course Faculty", "Department HODs"],
    status: "Upcoming",
    priority: "High",
    notes: "Syllabus completion certificate submitted to Principal.",
    dependencies: ["act-18"],
    notification_settings: { notify_on_assignment: true, reminder_days: [3, 1], notify_on_overdue: true },
  },
  {
    id: "act-20",
    sl_no: 20,
    name: "Test-2 Notification & Time Table",
    activity_type: "notification",
    description: "Official publication of Test-2 timetable, seating guidelines and syllabus portions.",
    start_date: "2026-11-16",
    end_date: "2026-11-16",
    due_date: "2026-11-16",
    timeline_display: "16 November 2026",
    academic_year: "2026–2027",
    semester: "Odd Semester",
    test_association: "Test-2",
    department: "All",
    responsible_team: "Test Committee",
    responsible_users: ["Test Committee"],
    status: "Upcoming",
    priority: "High",
    notes: "Notify faculty and students on portal.",
    dependencies: [],
    notification_settings: { notify_on_assignment: true, reminder_days: [5, 2], notify_on_overdue: true },
  },
  {
    id: "act-21",
    sl_no: 21,
    name: "Question Paper Setting",
    activity_type: "qp_setting",
    description: "Preparation of two sets of Test-2 question papers with scheme of evaluation.",
    start_date: "2026-11-16",
    end_date: "2026-11-20",
    due_date: "2026-11-20",
    timeline_display: "16–20 November 2026",
    academic_year: "2026–2027",
    semester: "Odd Semester",
    test_association: "Test-2",
    department: "All",
    responsible_team: "Course Faculty",
    responsible_users: ["Course Faculty"],
    status: "Upcoming",
    priority: "Urgent",
    notes: "Include higher-order cognitive questions per NBA guidelines.",
    dependencies: ["act-20"],
    notification_settings: { notify_on_assignment: true, reminder_days: [3, 1], notify_on_overdue: true },
  },
  {
    id: "act-22",
    sl_no: 22,
    name: "Submission & Scrutiny of QPs",
    activity_type: "scrutiny",
    description: "Submission to Department Scrutiny Committee and rigorous question paper scrutiny.",
    start_date: "2026-11-21",
    end_date: "2026-11-25",
    due_date: "2026-11-25",
    timeline_display: "21–25 November 2026",
    academic_year: "2026–2027",
    semester: "Odd Semester",
    test_association: "Test-2",
    department: "All",
    responsible_team: "Scrutiny Team",
    responsible_users: ["Department Scrutiny Team"],
    status: "Upcoming",
    priority: "Urgent",
    notes: "Scrutiny reports compiled and confidential approval recorded.",
    dependencies: ["act-21"],
    notification_settings: { notify_on_assignment: true, reminder_days: [3, 1], notify_on_overdue: true },
  },
  {
    id: "act-23",
    sl_no: 23,
    name: "Finalization of QPs",
    activity_type: "qp_submission",
    description: "Test committee seals approved question papers and prepares master print copies.",
    start_date: "2026-11-26",
    end_date: "2026-11-26",
    due_date: "2026-11-26",
    timeline_display: "26 November 2026",
    academic_year: "2026–2027",
    semester: "Odd Semester",
    test_association: "Test-2",
    department: "All",
    responsible_team: "Test Committee",
    responsible_users: ["Test Committee Convener"],
    status: "Upcoming",
    priority: "Urgent",
    notes: "Confidential lock-in completed.",
    dependencies: ["act-22"],
    notification_settings: { notify_on_assignment: true, reminder_days: [1], notify_on_overdue: true },
  },
  {
    id: "act-24",
    sl_no: 24,
    name: "Printing & Packaging",
    activity_type: "printing",
    description: "Printing and packaging of Test-2 question papers into hall packets.",
    start_date: "2026-11-27",
    end_date: "2026-12-02",
    due_date: "2026-12-02",
    timeline_display: "27 November–2 December 2026",
    academic_year: "2026–2027",
    semester: "Odd Semester",
    test_association: "Test-2",
    department: "All",
    responsible_team: "Test Committee",
    responsible_users: ["Printing Incharge"],
    status: "Upcoming",
    priority: "High",
    notes: "Ensure sufficient buffer copies for labs and buffer halls.",
    dependencies: ["act-23"],
    notification_settings: { notify_on_assignment: true, reminder_days: [3, 1], notify_on_overdue: true },
  },
  {
    id: "act-25",
    sl_no: 25,
    name: "B-Form & Duty Allotment",
    activity_type: "duty_allotment",
    description: "Preparation of B-Forms, hall assignment, and invigilation squad allocation for Test-2.",
    start_date: "2026-12-03",
    end_date: "2026-12-04",
    due_date: "2026-12-04",
    timeline_display: "3–4 December 2026",
    academic_year: "2026–2027",
    semester: "Odd Semester",
    test_association: "Test-2",
    department: "All",
    responsible_team: "Test Committee",
    responsible_users: ["Invigilation Roster Committee"],
    status: "Upcoming",
    priority: "High",
    notes: "Publish duty allocations to all teachers.",
    dependencies: ["act-20"],
    notification_settings: { notify_on_assignment: true, reminder_days: [2, 1], notify_on_overdue: true },
  },
  {
    id: "act-26",
    sl_no: 26,
    name: "Seating Arrangement",
    activity_type: "seating",
    description: "Physical room allocation, desk roll-number stickers, and lab terminal configuration for Test-2.",
    start_date: "2026-12-05",
    end_date: "2026-12-06",
    due_date: "2026-12-06",
    timeline_display: "5–6 December 2026",
    academic_year: "2026–2027",
    semester: "Odd Semester",
    test_association: "Test-2",
    department: "All",
    responsible_team: "Department",
    responsible_users: ["Department Coordinators"],
    status: "Upcoming",
    priority: "Urgent",
    notes: "Double check lab computer availability and network isolation.",
    dependencies: ["act-25"],
    notification_settings: { notify_on_assignment: true, reminder_days: [1], notify_on_overdue: true },
  },
  {
    id: "act-27",
    sl_no: 27,
    name: "TEST–2",
    activity_type: "exam",
    description: "Conduct of Test-2 examinations across designated halls and computer labs.",
    start_date: "2026-12-07",
    end_date: "2026-12-14",
    due_date: "2026-12-14",
    timeline_display: "7–14 December 2026",
    academic_year: "2026–2027",
    semester: "Odd Semester",
    test_association: "Test-2",
    department: "All",
    responsible_team: "Department",
    responsible_users: ["Chief Superintendent", "All Invigilators"],
    status: "Upcoming",
    priority: "Urgent",
    notes: "Record student attendance and daily dispatch of papers.",
    dependencies: ["act-24", "act-26"],
    notification_settings: { notify_on_assignment: true, reminder_days: [3, 1], notify_on_overdue: true },
  },
  {
    id: "act-28",
    sl_no: 28,
    name: "Test-2 Valuation",
    activity_type: "valuation",
    description: "Centralized evaluation of Test-2 answer booklets.",
    start_date: "2026-12-15",
    end_date: "2026-12-21",
    due_date: "2026-12-21",
    timeline_display: "15–21 December 2026",
    academic_year: "2026–2027",
    semester: "Odd Semester",
    test_association: "Test-2",
    department: "All",
    responsible_team: "Course Faculty",
    responsible_users: ["Course Faculty"],
    status: "Upcoming",
    priority: "High",
    notes: "Review papers with students and clarify any evaluation queries.",
    dependencies: ["act-27"],
    notification_settings: { notify_on_assignment: true, reminder_days: [3, 1], notify_on_overdue: true },
  },
  {
    id: "act-29",
    sl_no: 29,
    name: "Submission of Test-2 Marks",
    activity_type: "marks",
    description: "Entry of Test-2 marks and laboratory internal assessments on the exam portal.",
    start_date: "2026-12-21",
    end_date: "2026-12-22",
    due_date: "2026-12-22",
    timeline_display: "By 22 December 2026",
    academic_year: "2026–2027",
    semester: "Odd Semester",
    test_association: "Test-2",
    department: "All",
    responsible_team: "Course Faculty",
    responsible_users: ["Course Faculty"],
    status: "Upcoming",
    priority: "Urgent",
    notes: "All marks entries locked for result analysis.",
    dependencies: ["act-28"],
    notification_settings: { notify_on_assignment: true, reminder_days: [2, 1], notify_on_overdue: true },
  },
  {
    id: "act-30",
    sl_no: 30,
    name: "Result Analysis & Documentation",
    activity_type: "result_analysis",
    description: "Departmental result analysis, pass percentage computation, identifying slow learners and remedial plan.",
    start_date: "2026-12-23",
    end_date: "2026-12-30",
    due_date: "2026-12-30",
    timeline_display: "23–30 December 2026",
    academic_year: "2026–2027",
    semester: "Odd Semester",
    test_association: "Test-2",
    department: "All",
    responsible_team: "Department",
    responsible_users: ["Department HODs", "Academic Auditors"],
    status: "Upcoming",
    priority: "Medium",
    notes: "Course files and course outcome attainment calculation.",
    dependencies: ["act-29"],
    notification_settings: { notify_on_assignment: true, reminder_days: [5, 2], notify_on_overdue: false },
  },
  {
    id: "act-31",
    sl_no: 31,
    name: "Completion of Academic Activities",
    activity_type: "academic",
    description: "Finalization of attendance, student feedback compilation, lab record certification, and remedial classes.",
    start_date: "2026-12-24",
    end_date: "2026-12-31",
    due_date: "2026-12-31",
    timeline_display: "By 31 December 2026",
    academic_year: "2026–2027",
    semester: "Odd Semester",
    test_association: "None",
    department: "All",
    responsible_team: "Course Faculty",
    responsible_users: ["All Course Faculty", "Mentors"],
    status: "Upcoming",
    priority: "High",
    notes: "Consolidated internal marks and attendance signed by students.",
    dependencies: ["act-30"],
    notification_settings: { notify_on_assignment: true, reminder_days: [3, 1], notify_on_overdue: true },
  },
  {
    id: "act-32",
    sl_no: 32,
    name: "Semester End",
    activity_type: "milestone",
    description: "Official conclusion of odd semester 2026–2027 and commencement of semester preparation break.",
    start_date: "2027-01-05",
    end_date: "2027-01-05",
    due_date: "2027-01-05",
    timeline_display: "5 January 2027",
    academic_year: "2026–2027",
    semester: "Odd Semester",
    test_association: "None",
    department: "All",
    responsible_team: "University",
    responsible_users: ["University Registrar", "Principal"],
    status: "Upcoming",
    priority: "High",
    notes: "Semester closing reports forwarded to university.",
    dependencies: ["act-31"],
    notification_settings: { notify_on_assignment: true, reminder_days: [7, 3, 1], notify_on_overdue: false },
  },
];

// In-Memory Persistent State
let globalSemesterConfig: AcademicSemesterConfig = { ...DEFAULT_SEMESTER_CONFIG };
let globalActivities: AcademicActivity[] = JSON.parse(JSON.stringify(INITIAL_ACADEMIC_ACTIVITIES));

// Helper: Calculate days between
function daysDiff(d1: string, d2: string): number {
  const t1 = new Date(d1).getTime();
  const t2 = new Date(d2).getTime();
  return Math.round((t2 - t1) / (1000 * 60 * 60 * 24));
}

// ---------------------------------------------------------------------------
// SERVER FUNCTIONS
// ---------------------------------------------------------------------------

/**
 * 1. Overview & Key Metrics
 */
export const getAcademicCalendarOverview = createServerFn({ method: "GET" }).handler(async () => {
  const total = globalActivities.length;
  const completed = globalActivities.filter((a) => a.status === "Completed").length;
  const inProgress = globalActivities.filter((a) => a.status === "In Progress").length;
  const overdue = globalActivities.filter((a) => a.status === "Overdue" || a.status === "Delayed").length;
  const upcoming = globalActivities.filter((a) => a.status === "Upcoming" || a.status === "Not Started").length;

  const simDate = globalSemesterConfig.current_simulated_date;
  const semStart = globalSemesterConfig.start_date;
  const semEnd = globalSemesterConfig.end_date;

  const totalSemDays = Math.max(1, daysDiff(semStart, semEnd));
  const elapsedDays = Math.max(0, Math.min(totalSemDays, daysDiff(semStart, simDate)));
  const semesterProgressPercent = Math.round((elapsedDays / totalSemDays) * 100);
  const daysRemaining = Math.max(0, daysDiff(simDate, semEnd));

  const test1Days = daysDiff(simDate, globalSemesterConfig.test1_start_date);
  const test2Days = daysDiff(simDate, globalSemesterConfig.test2_start_date);

  // Next immediate milestones (next 4)
  const nextMilestones = globalActivities
    .filter((a) => a.status !== "Completed" && a.status !== "Cancelled")
    .slice(0, 5);

  // Schedule risk detection
  const risks: ScheduleRisk[] = [];
  globalActivities.forEach((act) => {
    // Check overdue
    if (act.due_date && act.due_date < simDate && act.status !== "Completed") {
      risks.push({
        id: `risk-overdue-${act.id}`,
        activity_id: act.id,
        activity_name: act.name,
        severity: "high",
        risk_type: "overdue",
        message: `${act.name} was due on ${act.due_date} but is currently marked as ${act.status}.`,
        recommendation: `Follow up immediately with ${act.responsible_team}.`,
        due_date: act.due_date,
        responsible_team: act.responsible_team,
      });
    }

    // Check approaching deadline within 14 days
    if (act.due_date && act.due_date >= simDate) {
      const remaining = daysDiff(simDate, act.due_date);
      if (remaining <= 7 && act.status !== "Completed") {
        risks.push({
          id: `risk-due-soon-${act.id}`,
          activity_id: act.id,
          activity_name: act.name,
          severity: remaining <= 2 ? "high" : "medium",
          risk_type: "approaching_deadline",
          message: `${act.name} deadline is approaching in ${remaining} day${remaining === 1 ? "" : "s"} (${act.due_date}).`,
          recommendation: `Ensure ${act.responsible_team} has initiated work and verified prerequisites.`,
          due_date: act.due_date,
          responsible_team: act.responsible_team,
        });
      }
    }

    // Check predecessor incomplete
    if (act.status === "In Progress" && act.dependencies && act.dependencies.length > 0) {
      const incompletePredecessors = globalActivities.filter(
        (p) => act.dependencies?.includes(p.id) && p.status !== "Completed"
      );
      if (incompletePredecessors.length > 0) {
        risks.push({
          id: `risk-dep-${act.id}`,
          activity_id: act.id,
          activity_name: act.name,
          severity: "medium",
          risk_type: "predecessor_incomplete",
          message: `${act.name} is In Progress but predecessor "${incompletePredecessors.map((p) => p.name).join(", ")}" is incomplete.`,
          recommendation: "Review whether prerequisites can be expedited or override recorded.",
          due_date: act.due_date || act.end_date,
          responsible_team: act.responsible_team,
        });
      }
    }
  });

  return {
    config: globalSemesterConfig,
    metrics: {
      total,
      completed,
      inProgress,
      overdue,
      upcoming,
      completionRate: Math.round((completed / total) * 100),
      semesterProgressPercent,
      daysRemaining,
      test1CountdownDays: test1Days,
      test2CountdownDays: test2Days,
    },
    nextMilestones,
    risks,
  };
});

/**
 * 2. List & Query Activities
 */
export const listAcademicActivities = createServerFn({ method: "POST" })
  .validator(
    z.object({
      search: z.string().optional(),
      test_association: z.string().optional(),
      responsible_team: z.string().optional(),
      status: z.string().optional(),
      activity_type: z.string().optional(),
    }).optional()
  )
  .handler(async ({ data }) => {
    let result = [...globalActivities];

    if (data?.search) {
      const q = data.search.toLowerCase();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.timeline_display.toLowerCase().includes(q) ||
          a.responsible_team.toLowerCase().includes(q) ||
          (a.notes && a.notes.toLowerCase().includes(q))
      );
    }

    if (data?.test_association && data.test_association !== "all") {
      result = result.filter((a) => a.test_association === data.test_association);
    }

    if (data?.responsible_team && data.responsible_team !== "all") {
      result = result.filter((a) => a.responsible_team === data.responsible_team);
    }

    if (data?.status && data.status !== "all") {
      result = result.filter((a) => a.status === data.status);
    }

    if (data?.activity_type && data.activity_type !== "all") {
      result = result.filter((a) => a.activity_type === data.activity_type);
    }

    return result;
  });

/**
 * 3. Update Activity
 */
export const updateAcademicActivity = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string(),
      name: z.string().optional(),
      timeline_display: z.string().optional(),
      start_date: z.string().optional(),
      end_date: z.string().optional(),
      due_date: z.string().optional(),
      responsible_team: z.string().optional(),
      status: z.string().optional(),
      priority: z.string().optional(),
      notes: z.string().optional(),
      remarks: z.string().optional(),
      actual_completion_date: z.string().optional(),
      override_reason: z.string().optional(),
    })
  )
  .handler(async ({ data }) => {
    const idx = globalActivities.findIndex((a) => a.id === data.id);
    if (idx === -1) throw new Error("Activity not found");

    globalActivities[idx] = {
      ...globalActivities[idx],
      ...data,
      responsible_team: data.responsible_team as ResponsibleTeam || globalActivities[idx].responsible_team,
      status: (data.status as ActivityStatus) || globalActivities[idx].status,
      priority: (data.priority as ActivityPriority) || globalActivities[idx].priority,
    };

    return globalActivities[idx];
  });

/**
 * 4. Toggle Status with Predecessor Dependency Check
 */
export const toggleActivityStatusWithDependencyCheck = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string(),
      target_status: z.enum(["Not Started", "Upcoming", "In Progress", "Completed", "Delayed", "Overdue", "Cancelled"]),
      allow_override: z.boolean().default(false),
      override_reason: z.string().optional(),
    })
  )
  .handler(async ({ data }) => {
    const act = globalActivities.find((a) => a.id === data.id);
    if (!act) throw new Error("Activity not found");

    // Check predecessor completion
    if (data.target_status === "Completed" && act.dependencies && act.dependencies.length > 0 && !data.allow_override) {
      const incomplete = globalActivities.filter(
        (p) => act.dependencies?.includes(p.id) && p.status !== "Completed"
      );
      if (incomplete.length > 0) {
        return {
          success: false,
          blocked_by_dependency: true,
          incomplete_dependencies: incomplete.map((p) => ({ id: p.id, name: p.name, status: p.status })),
          message: `This activity depends on completion of: ${incomplete.map((p) => p.name).join(", ")}. Please complete predecessor tasks first or confirm administrative override.`,
        };
      }
    }

    act.status = data.target_status;
    if (data.target_status === "Completed") {
      act.actual_completion_date = new Date().toISOString().split("T")[0];
    }
    if (data.allow_override && data.override_reason) {
      act.override_reason = data.override_reason;
    }

    return {
      success: true,
      activity: act,
    };
  });

/**
 * 5. Create Custom Activity
 */
export const createAcademicActivity = createServerFn({ method: "POST" })
  .validator(
    z.object({
      name: z.string(),
      activity_type: z.string(),
      start_date: z.string(),
      end_date: z.string(),
      due_date: z.string().optional(),
      timeline_display: z.string(),
      responsible_team: z.string(),
      test_association: z.enum(["Test-1", "Test-2", "None"]),
      priority: z.enum(["Low", "Medium", "High", "Urgent"]),
      department: z.string().default("All"),
      notes: z.string().optional(),
      dependencies: z.array(z.string()).optional(),
    })
  )
  .handler(async ({ data }) => {
    const newAct: AcademicActivity = {
      id: `act-custom-${Date.now()}`,
      sl_no: globalActivities.length + 1,
      name: data.name,
      activity_type: data.activity_type as ActivityType,
      start_date: data.start_date,
      end_date: data.end_date,
      due_date: data.due_date || data.end_date,
      timeline_display: data.timeline_display,
      academic_year: globalSemesterConfig.academic_year,
      semester: globalSemesterConfig.semester_name,
      test_association: data.test_association,
      department: data.department,
      responsible_team: data.responsible_team as ResponsibleTeam,
      status: "Upcoming",
      priority: data.priority,
      notes: data.notes || "",
      dependencies: data.dependencies || [],
      notification_settings: { notify_on_assignment: true, reminder_days: [3, 1], notify_on_overdue: true },
    };

    globalActivities.push(newAct);
    return newAct;
  });

/**
 * 6. Delete Activity
 */
export const deleteAcademicActivity = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    globalActivities = globalActivities.filter((a) => a.id !== data.id);
    return { success: true };
  });

/**
 * 7. Reset to Official Default Schedule
 */
export const resetAcademicCalendarToDefault = createServerFn({ method: "POST" }).handler(async () => {
  globalSemesterConfig = { ...DEFAULT_SEMESTER_CONFIG };
  globalActivities = JSON.parse(JSON.stringify(INITIAL_ACADEMIC_ACTIVITIES));
  return { success: true, count: globalActivities.length };
});

/**
 * 8. Bulk Import Activities
 */
export const bulkImportAcademicActivities = createServerFn({ method: "POST" })
  .validator(z.object({ activities: z.array(z.any()) }))
  .handler(async ({ data }) => {
    if (!Array.isArray(data.activities) || data.activities.length === 0) {
      throw new Error("No activities provided for import");
    }
    globalActivities = data.activities;
    return { success: true, count: globalActivities.length };
  });

/**
 * 9. Get Test Workflows (Test-1 & Test-2)
 */
export const getTestWorkflows = createServerFn({ method: "GET" }).handler(async () => {
  const test1Stages = globalActivities.filter((a) => a.test_association === "Test-1");
  const test2Stages = globalActivities.filter((a) => a.test_association === "Test-2");

  return {
    test1: {
      name: "Test–1 Examination Workflow (Odd Semester)",
      scheduled_dates: "22–29 October 2026",
      stages: test1Stages,
      completed_count: test1Stages.filter((s) => s.status === "Completed").length,
      total_count: test1Stages.length,
    },
    test2: {
      name: "Test–2 Examination Workflow (Odd Semester)",
      scheduled_dates: "7–14 December 2026",
      stages: test2Stages,
      completed_count: test2Stages.filter((s) => s.status === "Completed").length,
      total_count: test2Stages.length,
    },
  };
});

/**
 * 10. My Academic Activities (Personalized View by Role)
 */
export const getMyAcademicActivities = createServerFn({ method: "POST" })
  .validator(
    z.object({
      role: z.string().default("Course Faculty"),
      user_id: z.string().optional(),
    })
  )
  .handler(async ({ data }) => {
    let assigned = globalActivities.filter((a) => {
      if (data.role === "admin" || data.role === "Principal" || data.role === "Dean") return true;
      if (data.role === "Course Faculty" && a.responsible_team === "Course Faculty") return true;
      if (data.role === "Test Committee" && a.responsible_team === "Test Committee") return true;
      if (data.role === "Scrutiny Team" && a.responsible_team === "Scrutiny Team") return true;
      if (data.role === "Department" && a.responsible_team === "Department") return true;
      return a.responsible_team === "Course Faculty"; // default fallback
    });

    const simDate = globalSemesterConfig.current_simulated_date;

    const dueToday = assigned.filter((a) => a.due_date === simDate && a.status !== "Completed");
    const dueThisWeek = assigned.filter((a) => {
      if (!a.due_date || a.status === "Completed") return false;
      const diff = daysDiff(simDate, a.due_date);
      return diff >= 0 && diff <= 7;
    });
    const overdue = assigned.filter((a) => a.due_date && a.due_date < simDate && a.status !== "Completed");
    const inProgress = assigned.filter((a) => a.status === "In Progress");
    const completed = assigned.filter((a) => a.status === "Completed");

    return {
      all: assigned,
      dueToday,
      dueThisWeek,
      overdue,
      inProgress,
      completed,
      stats: {
        totalAssigned: assigned.length,
        dueTodayCount: dueToday.length,
        dueThisWeekCount: dueThisWeek.length,
        overdueCount: overdue.length,
        completedCount: completed.length,
      },
    };
  });

/**
 * 11. Official Institutional Reports Data
 */
export const getAcademicReportsData = createServerFn({ method: "GET" }).handler(async () => {
  const simDate = globalSemesterConfig.current_simulated_date;

  // 1. Master Semester Activity Report
  const masterReport = globalActivities.map((act) => {
    const isOverdue = act.due_date && act.due_date < simDate && act.status !== "Completed";
    const delayDays = isOverdue ? daysDiff(act.due_date!, simDate) : 0;
    return {
      sl_no: act.sl_no,
      activity: act.name,
      timeline: act.timeline_display,
      planned_start: act.start_date,
      planned_end: act.end_date,
      due_date: act.due_date || act.end_date,
      actual_completion: act.actual_completion_date || "—",
      responsibility: act.responsible_team,
      test_association: act.test_association,
      status: act.status,
      priority: act.priority,
      delay_days: delayDays,
      remarks: act.remarks || act.notes || "—",
    };
  });

  // 2. Stakeholder Responsibility Summary
  const teams: ResponsibleTeam[] = ["University", "Course Faculty", "Test Committee", "Scrutiny Team", "Department"];
  const responsibilityReport = teams.map((team) => {
    const teamActs = globalActivities.filter((a) => a.responsible_team === team);
    const comp = teamActs.filter((a) => a.status === "Completed").length;
    const pend = teamActs.filter((a) => a.status !== "Completed").length;
    const over = teamActs.filter((a) => a.due_date && a.due_date < simDate && a.status !== "Completed").length;
    return {
      team,
      total_assigned: teamActs.length,
      completed: comp,
      pending: pend,
      overdue: over,
      completion_percentage: teamActs.length > 0 ? Math.round((comp / teamActs.length) * 100) : 0,
      activities_list: teamActs.map((a) => a.name).join("; "),
    };
  });

  // 3. Test-1 Progress Report
  const test1Report = globalActivities
    .filter((a) => a.test_association === "Test-1")
    .map((a, idx) => ({
      stage_number: idx + 1,
      activity: a.name,
      timeline: a.timeline_display,
      responsibility: a.responsible_team,
      status: a.status,
      planned_completion: a.due_date || a.end_date,
      actual_completion: a.actual_completion_date || "—",
      notes: a.notes || "—",
    }));

  // 4. Test-2 Progress Report
  const test2Report = globalActivities
    .filter((a) => a.test_association === "Test-2")
    .map((a, idx) => ({
      stage_number: idx + 1,
      activity: a.name,
      timeline: a.timeline_display,
      responsibility: a.responsible_team,
      status: a.status,
      planned_completion: a.due_date || a.end_date,
      actual_completion: a.actual_completion_date || "—",
      notes: a.notes || "—",
    }));

  // 5. Delayed & At-Risk Report
  const delayedReport = globalActivities
    .filter((a) => (a.due_date && a.due_date < simDate && a.status !== "Completed") || a.status === "Delayed")
    .map((a) => ({
      sl_no: a.sl_no,
      activity: a.name,
      timeline: a.timeline_display,
      responsibility: a.responsible_team,
      due_date: a.due_date || a.end_date,
      status: a.status,
      days_delayed: a.due_date ? daysDiff(a.due_date, simDate) : 0,
      priority: a.priority,
      mitigation: a.notes || "Escalate to HOD / Committee for immediate resolution",
    }));

  return {
    semester: globalSemesterConfig,
    masterReport,
    responsibilityReport,
    test1Report,
    test2Report,
    delayedReport,
  };
});
