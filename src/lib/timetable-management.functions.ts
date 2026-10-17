// @ts-nocheck
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// ---------------------------------------------------------------------------
// DATA MODELS & TYPES (Sections 1–26)
// ---------------------------------------------------------------------------

export type ExamSemester = 1 | 3 | 5;
export type ExamMode = "offline" | "online";
export type TimetableStatus = "DRAFT" | "VALIDATION" | "FINALIZED" | "PUBLISHED";
export type AttendanceStatus = "unmarked" | "present" | "absent";
export type AttendanceLifecycle = "OPEN" | "IN_PROGRESS" | "SUBMITTED" | "LOCKED";

export interface ExamTimingSlot {
  id: string;
  name: string;
  start_time: string; // e.g. "09:00 AM"
  end_time: string; // e.g. "11:00 AM"
  duration_minutes: number;
  buffer_minutes: number;
  is_active: boolean;
}

export interface FacultyEligibility {
  id: string;
  employee_id: string;
  full_name: string;
  department: string;
  designation: string;
  teaching_year: "1st Year" | "3rd Year" | "5th Year";
  eligible_semesters: ExamSemester[];
  is_active: boolean;
  total_duties_assigned: number;
  duties_valid: boolean; // total_duties_assigned >= 3
}

export interface LabMasterItem {
  id: string;
  name: string;
  code: string;
  capacity: number;
  location: string;
  supports_online: boolean;
  supports_offline: boolean;
  is_active: boolean;
}

export interface LabBatch {
  id: string;
  batch_name: string;
  timetable_entry_id: string;
  lab_id: string;
  max_capacity: number;
  student_ids: string[];
}

export interface StudentGroup {
  id: string;
  group_name: string;
  semester: ExamSemester;
  student_ids: string[];
}

export interface TimetableDraftEntry {
  id: string;
  timetable_id: string;
  exam_date: string; // YYYY-MM-DD
  timing_slot_id: string;
  semester: ExamSemester;
  subject_code: string;
  subject_name: string;
  mode: ExamMode;
  selected_student_ids: string[];
  assigned_faculty_ids: string[];
  assigned_lab_id?: string;
  batches: LabBatch[];
  student_groups: StudentGroup[];
  created_at: string;
}

export interface TimetablePlan {
  id: string;
  title: string;
  academic_year: string;
  status: TimetableStatus;
  entries: TimetableDraftEntry[];
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ValidationIssue {
  id: string;
  category:
    | "student"
    | "timing"
    | "faculty_eligibility"
    | "faculty_duties"
    | "lab_capacity"
    | "batch"
    | "timetable"
    | "attendance";
  severity: "error" | "warning";
  message: string;
  entry_id?: string;
  affected_faculty_id?: string;
  affected_lab_id?: string;
  affected_student_id?: string;
}

export interface AttendanceRecord {
  id: string;
  session_id: string;
  timetable_entry_id: string;
  batch_id?: string;
  student_id: string;
  student_name: string;
  register_no: string;
  semester: ExamSemester;
  department: string;
  status: AttendanceStatus;
  notes?: string;
  marked_by?: string;
  marked_at?: string;
  updated_at?: string;
}

export interface AttendanceSession {
  id: string;
  timetable_entry_id: string;
  batch_id?: string;
  lab_id?: string;
  status: AttendanceLifecycle;
  total_students: number;
  present_count: number;
  absent_count: number;
  unmarked_count: number;
  attendance_percentage: number;
  submitted_at?: string;
  submitted_by?: string;
  locked_at?: string;
  locked_by?: string;
  created_at: string;
  updated_at: string;
}

export interface AttendanceAuditEntry {
  id: string;
  session_id: string;
  timetable_entry_id: string;
  student_id: string;
  student_name: string;
  changed_by: string;
  old_status: AttendanceStatus;
  new_status: AttendanceStatus;
  reason: string;
  timestamp: string;
}

export interface SegmentedStudent {
  id: string;
  serial_no: number;
  register_no: string;
  full_name: string;
  department: string;
  section: string;
  semester: ExamSemester;
  active: boolean;
}

// ---------------------------------------------------------------------------
// INITIAL DATA (REUSABLE MASTERS & PRE-POPULATED SESSIONS)
// ---------------------------------------------------------------------------

export const INITIAL_TIMING_SLOTS: ExamTimingSlot[] = [
  {
    id: "slot-1",
    name: "Morning Session (Slot 1)",
    start_time: "09:00 AM",
    end_time: "11:00 AM",
    duration_minutes: 120,
    buffer_minutes: 30,
    is_active: true,
  },
  {
    id: "slot-2",
    name: "Midday Session (Slot 2)",
    start_time: "11:30 AM",
    end_time: "01:30 PM",
    duration_minutes: 120,
    buffer_minutes: 30,
    is_active: true,
  },
  {
    id: "slot-3",
    name: "Afternoon Session (Slot 3)",
    start_time: "02:00 PM",
    end_time: "04:00 PM",
    duration_minutes: 120,
    buffer_minutes: 30,
    is_active: true,
  },
];

export const INITIAL_LABS: LabMasterItem[] = [
  {
    id: "lab-1",
    name: "Alan Turing Computing Lab",
    code: "LAB-TURING-101",
    capacity: 30,
    location: "Block A - Floor 1",
    supports_online: true,
    supports_offline: true,
    is_active: true,
  },
  {
    id: "lab-2",
    name: "Ada Lovelace Systems Lab",
    code: "LAB-LOVELACE-102",
    capacity: 30,
    location: "Block A - Floor 1",
    supports_online: true,
    supports_offline: true,
    is_active: true,
  },
  {
    id: "lab-3",
    name: "John von Neumann AI Lab",
    code: "LAB-NEUMANN-201",
    capacity: 40,
    location: "Block A - Floor 2",
    supports_online: true,
    supports_offline: false,
    is_active: true,
  },
  {
    id: "lab-4",
    name: "Claude Shannon Data Networks Lab",
    code: "LAB-SHANNON-202",
    capacity: 30,
    location: "Block A - Floor 2",
    supports_online: true,
    supports_offline: true,
    is_active: true,
  },
  {
    id: "lab-5",
    name: "Grace Hopper Software Engineering Lab",
    code: "LAB-HOPPER-301",
    capacity: 35,
    location: "Block A - Floor 3",
    supports_online: true,
    supports_offline: true,
    is_active: true,
  },
];

export const INITIAL_FACULTY: FacultyEligibility[] = [
  // 1st-Year Faculty (Sem 1)
  {
    id: "EMP1001",
    employee_id: "EMP1001",
    full_name: "Dr. Aarav Sharma",
    department: "Computer Science",
    designation: "Professor",
    teaching_year: "1st Year",
    eligible_semesters: [1],
    is_active: true,
    total_duties_assigned: 3,
    duties_valid: true,
  },
  {
    id: "EMP1002",
    employee_id: "EMP1002",
    full_name: "Prof. Aditi Verma",
    department: "Computer Science",
    designation: "Associate Professor",
    teaching_year: "1st Year",
    eligible_semesters: [1],
    is_active: true,
    total_duties_assigned: 3,
    duties_valid: true,
  },
  {
    id: "EMP1003",
    employee_id: "EMP1003",
    full_name: "Dr. Amit Patel",
    department: "Electronics",
    designation: "Assistant Professor",
    teaching_year: "1st Year",
    eligible_semesters: [1],
    is_active: true,
    total_duties_assigned: 3,
    duties_valid: true,
  },
  {
    id: "EMP1004",
    employee_id: "EMP1004",
    full_name: "Dr. Ananya Rao",
    department: "Electrical",
    designation: "Associate Professor",
    teaching_year: "1st Year",
    eligible_semesters: [1],
    is_active: true,
    total_duties_assigned: 3,
    duties_valid: true,
  },
  // 3rd-Year Faculty (Sem 3)
  {
    id: "EMP1005",
    employee_id: "EMP1005",
    full_name: "Dr. Arjun Singh",
    department: "Computer Science",
    designation: "Professor",
    teaching_year: "3rd Year",
    eligible_semesters: [3],
    is_active: true,
    total_duties_assigned: 3,
    duties_valid: true,
  },
  {
    id: "EMP1006",
    employee_id: "EMP1006",
    full_name: "Prof. Bhavya Nair",
    department: "Information Technology",
    designation: "Associate Professor",
    teaching_year: "3rd Year",
    eligible_semesters: [3],
    is_active: true,
    total_duties_assigned: 3,
    duties_valid: true,
  },
  {
    id: "EMP1007",
    employee_id: "EMP1007",
    full_name: "Dr. Chetan Kulkarni",
    department: "Electronics",
    designation: "Assistant Professor",
    teaching_year: "3rd Year",
    eligible_semesters: [3],
    is_active: true,
    total_duties_assigned: 3,
    duties_valid: true,
  },
  {
    id: "EMP1008",
    employee_id: "EMP1008",
    full_name: "Prof. Deepa Joshi",
    department: "Mechanical",
    designation: "Associate Professor",
    teaching_year: "3rd Year",
    eligible_semesters: [3],
    is_active: true,
    total_duties_assigned: 3,
    duties_valid: true,
  },
  // 5th-Year Faculty (Sem 5)
  {
    id: "EMP1009",
    employee_id: "EMP1009",
    full_name: "Dr. Divya Mehta",
    department: "Computer Science",
    designation: "Professor & HOD",
    teaching_year: "5th Year",
    eligible_semesters: [5],
    is_active: true,
    total_duties_assigned: 3,
    duties_valid: true,
  },
  {
    id: "EMP1010",
    employee_id: "EMP1010",
    full_name: "Prof. Esha Reddy",
    department: "Information Technology",
    designation: "Associate Professor",
    teaching_year: "5th Year",
    eligible_semesters: [5],
    is_active: true,
    total_duties_assigned: 3,
    duties_valid: true,
  },
  {
    id: "EMP1011",
    employee_id: "EMP1011",
    full_name: "Dr. Gautam Nair",
    department: "Electronics",
    designation: "Professor",
    teaching_year: "5th Year",
    eligible_semesters: [5],
    is_active: true,
    total_duties_assigned: 3,
    duties_valid: true,
  },
  {
    id: "EMP1012",
    employee_id: "EMP1012",
    full_name: "Prof. Isha Deshmukh",
    department: "Computer Science",
    designation: "Assistant Professor",
    teaching_year: "5th Year",
    eligible_semesters: [5],
    is_active: true,
    total_duties_assigned: 3,
    duties_valid: true,
  },
];

// 300 Students cleanly segmented across Semester 1, 3, and 5
const depts = [
  "Computer Science",
  "Electrical",
  "Mechanical",
  "Civil",
  "Electronics",
  "Information Technology",
];
const sections = ["A", "B", "C", "D"];

export const INITIAL_STUDENTS: SegmentedStudent[] = [
  // 100 Students for Semester 1 (2026CS1001 to 2026CS1100)
  ...Array.from({ length: 100 }, (_, i) => ({
    id: `stu-sem1-${i + 1}`,
    serial_no: i + 1,
    register_no: `2026CS1${String(i + 1).padStart(3, "0")}`,
    full_name: `Student S1-${String(i + 1).padStart(3, "0")}`,
    department: depts[i % depts.length],
    section: sections[i % sections.length],
    semester: 1 as ExamSemester,
    active: true,
  })),

  // 100 Students for Semester 3 (2025CS3001 to 2025CS3100)
  ...Array.from({ length: 100 }, (_, i) => ({
    id: `stu-sem3-${i + 1}`,
    serial_no: 100 + i + 1,
    register_no: `2025CS3${String(i + 1).padStart(3, "0")}`,
    full_name: `Student S3-${String(i + 1).padStart(3, "0")}`,
    department: depts[i % depts.length],
    section: sections[i % sections.length],
    semester: 3 as ExamSemester,
    active: true,
  })),

  // 100 Students for Semester 5 (2024CS5001 to 2024CS5100)
  ...Array.from({ length: 100 }, (_, i) => ({
    id: `stu-sem5-${i + 1}`,
    serial_no: 200 + i + 1,
    register_no: `2024CS5${String(i + 1).padStart(3, "0")}`,
    full_name: `Student S5-${String(i + 1).padStart(3, "0")}`,
    department: depts[i % depts.length],
    section: sections[i % sections.length],
    semester: 5 as ExamSemester,
    active: true,
  })),
];

// Initial Draft Timetable Plan
export const INITIAL_TIMETABLE: TimetablePlan = {
  id: "plan-2026-odd",
  title: "Odd Semester 2026–2027 Midterm & Lab Examination Plan",
  academic_year: "2026–2027",
  status: "DRAFT",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  entries: [
    {
      id: "entry-1",
      timetable_id: "plan-2026-odd",
      exam_date: "2026-10-22",
      timing_slot_id: "slot-1",
      semester: 1,
      subject_code: "26MAT101",
      subject_name: "Engineering Mathematics I",
      mode: "offline",
      selected_student_ids: INITIAL_STUDENTS.filter((s) => s.semester === 1)
        .slice(0, 60)
        .map((s) => s.id),
      assigned_faculty_ids: ["EMP1001", "EMP1002"],
      assigned_lab_id: "lab-1",
      batches: [],
      student_groups: [
        {
          id: "grp-1a",
          group_name: "Sem 1 Group A",
          semester: 1,
          student_ids: INITIAL_STUDENTS.filter((s) => s.semester === 1)
            .slice(0, 30)
            .map((s) => s.id),
        },
        {
          id: "grp-1b",
          group_name: "Sem 1 Group B",
          semester: 1,
          student_ids: INITIAL_STUDENTS.filter((s) => s.semester === 1)
            .slice(30, 60)
            .map((s) => s.id),
        },
      ],
      created_at: new Date().toISOString(),
    },
    {
      id: "entry-2",
      timetable_id: "plan-2026-odd",
      exam_date: "2026-10-23",
      timing_slot_id: "slot-2",
      semester: 3,
      subject_code: "25CSE302",
      subject_name: "Data Structures & Algorithms Online Lab",
      mode: "online",
      selected_student_ids: INITIAL_STUDENTS.filter((s) => s.semester === 3)
        .slice(0, 85)
        .map((s) => s.id),
      assigned_faculty_ids: ["EMP1005", "EMP1006"],
      assigned_lab_id: "lab-2",
      batches: [
        {
          id: "batch-1",
          batch_name: "Batch 1 (09:00 AM)",
          timetable_entry_id: "entry-2",
          lab_id: "lab-2",
          max_capacity: 30,
          student_ids: INITIAL_STUDENTS.filter((s) => s.semester === 3)
            .slice(0, 30)
            .map((s) => s.id),
        },
        {
          id: "batch-2",
          batch_name: "Batch 2 (11:30 AM)",
          timetable_entry_id: "entry-2",
          lab_id: "lab-2",
          max_capacity: 30,
          student_ids: INITIAL_STUDENTS.filter((s) => s.semester === 3)
            .slice(30, 60)
            .map((s) => s.id),
        },
        {
          id: "batch-3",
          batch_name: "Batch 3 (02:00 PM)",
          timetable_entry_id: "entry-2",
          lab_id: "lab-2",
          max_capacity: 30,
          student_ids: INITIAL_STUDENTS.filter((s) => s.semester === 3)
            .slice(60, 85)
            .map((s) => s.id),
        },
      ],
      student_groups: [],
      created_at: new Date().toISOString(),
    },
    {
      id: "entry-3",
      timetable_id: "plan-2026-odd",
      exam_date: "2026-10-24",
      timing_slot_id: "slot-1",
      semester: 5,
      subject_code: "24CSE501",
      subject_name: "Database Management Systems",
      mode: "offline",
      selected_student_ids: INITIAL_STUDENTS.filter((s) => s.semester === 5)
        .slice(0, 50)
        .map((s) => s.id),
      assigned_faculty_ids: ["EMP1009", "EMP1010"],
      assigned_lab_id: "lab-3",
      batches: [],
      student_groups: [],
      created_at: new Date().toISOString(),
    },
  ],
};

// ---------------------------------------------------------------------------
// IN-MEMORY MUTATED STATE (PERSISTS FOR SERVER LIFETIME)
// ---------------------------------------------------------------------------

let stateTimingSlots = [...INITIAL_TIMING_SLOTS];
let stateLabs = [...INITIAL_LABS];
let stateFaculty = JSON.parse(JSON.stringify(INITIAL_FACULTY));
let stateStudents = [...INITIAL_STUDENTS];
let stateTimetable = JSON.parse(JSON.stringify(INITIAL_TIMETABLE));

// Attendance Sessions & Records
let stateAttendanceSessions: AttendanceSession[] = [];
let stateAttendanceRecords: AttendanceRecord[] = [];
let stateAttendanceAudit: AttendanceAuditEntry[] = [];

// Helper to seed initial attendance
function seedInitialAttendance() {
  stateAttendanceSessions = [];
  stateAttendanceRecords = [];
  stateAttendanceAudit = [];

  // 1. Session for Entry 1 (60 students, 55 present, 5 absent -> Tests 12, 13)
  const entry1 = stateTimetable.entries.find((e) => e.id === "entry-1");
  if (entry1) {
    const sess1Id = `sess-${entry1.id}`;
    const students1 = stateStudents.filter((s) => entry1.selected_student_ids.includes(s.id));

    // Set 5 students explicitly as absent (Indices 13, 26, 30, 45, 51)
    const absentIndices = new Set([13, 26, 30, 45, 51]);

    students1.forEach((st, idx) => {
      const isAbsent = absentIndices.has(idx);
      stateAttendanceRecords.push({
        id: `att-${sess1Id}-${st.id}`,
        session_id: sess1Id,
        timetable_entry_id: entry1.id,
        student_id: st.id,
        student_name: st.full_name,
        register_no: st.register_no,
        semester: st.semester,
        department: st.department,
        status: isAbsent ? "absent" : "present",
        notes: isAbsent ? "Medical leave / Uninformed absent" : undefined,
        marked_by: "Dr. Aarav Sharma",
        marked_at: new Date(Date.now() - 3600000).toISOString(),
        updated_at: new Date(Date.now() - 3600000).toISOString(),
      });
    });

    stateAttendanceSessions.push({
      id: sess1Id,
      timetable_entry_id: entry1.id,
      lab_id: entry1.assigned_lab_id,
      status: "SUBMITTED",
      total_students: students1.length,
      present_count: students1.length - absentIndices.size,
      absent_count: absentIndices.size,
      unmarked_count: 0,
      attendance_percentage: Number(
        (((students1.length - absentIndices.size) / students1.length) * 100).toFixed(2),
      ),
      submitted_at: new Date(Date.now() - 1800000).toISOString(),
      submitted_by: "Dr. Aarav Sharma (EMP1001)",
      created_at: new Date(Date.now() - 7200000).toISOString(),
      updated_at: new Date(Date.now() - 1800000).toISOString(),
    });
  }

  // 2. Batch Sessions for Entry 2 (Online lab, Batches 1, 2, 3)
  const entry2 = stateTimetable.entries.find((e) => e.id === "entry-2");
  if (entry2 && entry2.batches) {
    entry2.batches.forEach((batch, bIdx) => {
      const sessBatchId = `sess-${batch.id}`;
      const batchStudents = stateStudents.filter((s) => batch.student_ids.includes(s.id));
      let absentCount = 0;
      let presentCount = 0;

      batchStudents.forEach((st, idx) => {
        const isAbsent = bIdx === 0 && (idx === 3 || idx === 11);
        if (isAbsent) absentCount++;
        else presentCount++;

        stateAttendanceRecords.push({
          id: `att-${sessBatchId}-${st.id}`,
          session_id: sessBatchId,
          timetable_entry_id: entry2.id,
          batch_id: batch.id,
          student_id: st.id,
          student_name: st.full_name,
          register_no: st.register_no,
          semester: st.semester,
          department: st.department,
          status: isAbsent ? "absent" : "present",
          notes: isAbsent ? "Absent for practical lab slot" : undefined,
          marked_by: "Dr. Arjun Singh",
          marked_at: new Date(Date.now() - 7200000).toISOString(),
          updated_at: new Date(Date.now() - 7200000).toISOString(),
        });
      });

      stateAttendanceSessions.push({
        id: sessBatchId,
        timetable_entry_id: entry2.id,
        batch_id: batch.id,
        lab_id: batch.lab_id,
        status: bIdx === 2 ? "IN_PROGRESS" : "SUBMITTED",
        total_students: batchStudents.length,
        present_count: presentCount,
        absent_count: absentCount,
        unmarked_count: 0,
        attendance_percentage: Number(((presentCount / batchStudents.length) * 100).toFixed(2)),
        submitted_at: bIdx !== 2 ? new Date(Date.now() - 3600000).toISOString() : undefined,
        submitted_by: bIdx !== 2 ? "Dr. Arjun Singh (EMP1005)" : undefined,
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date(Date.now() - 3600000).toISOString(),
      });
    });
  }

  // 3. Entry 3: OPEN session ready for live marking
  const entry3 = stateTimetable.entries.find((e) => e.id === "entry-3");
  if (entry3) {
    const sess3Id = `sess-${entry3.id}`;
    const students3 = stateStudents.filter((s) => entry3.selected_student_ids.includes(s.id));

    // Seed 40 present, 5 absent, 5 unmarked
    students3.forEach((st, idx) => {
      let status: AttendanceStatus = "unmarked";
      if (idx < 40) status = "present";
      else if (idx < 45) status = "absent";

      stateAttendanceRecords.push({
        id: `att-${sess3Id}-${st.id}`,
        session_id: sess3Id,
        timetable_entry_id: entry3.id,
        student_id: st.id,
        student_name: st.full_name,
        register_no: st.register_no,
        semester: st.semester,
        department: st.department,
        status,
        marked_by: status !== "unmarked" ? "Dr. Divya Mehta" : undefined,
        marked_at: status !== "unmarked" ? new Date().toISOString() : undefined,
        updated_at: new Date().toISOString(),
      });
    });

    stateAttendanceSessions.push({
      id: sess3Id,
      timetable_entry_id: entry3.id,
      lab_id: entry3.assigned_lab_id,
      status: "IN_PROGRESS",
      total_students: students3.length,
      present_count: 40,
      absent_count: 5,
      unmarked_count: 5,
      attendance_percentage: Number(((40 / students3.length) * 100).toFixed(2)),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }
}

// Seed on startup
seedInitialAttendance();

// ---------------------------------------------------------------------------
// SERVER FUNCTIONS & BUSINESS LOGIC
// ---------------------------------------------------------------------------

/**
 * 1. Get Timetable Workspace (Complete Overview)
 */
export const getTimetableWorkspace = createServerFn({ method: "GET" }).handler(async () => {
  // Re-compute duties dynamically across all entries in the draft timetable
  const dutyCounts: Record<string, number> = {};
  stateFaculty.forEach((f: FacultyEligibility) => {
    dutyCounts[f.id] = 0;
  });

  stateTimetable.entries.forEach((entry: TimetableDraftEntry) => {
    entry.assigned_faculty_ids.forEach((fId: string) => {
      dutyCounts[fId] = (dutyCounts[fId] || 0) + 1;
    });
  });

  stateFaculty.forEach((f: FacultyEligibility) => {
    f.total_duties_assigned = dutyCounts[f.id] || 0;
    f.duties_valid = f.total_duties_assigned >= 3;
  });

  const studentsBySem = {
    sem1Count: stateStudents.filter((s) => s.semester === 1).length,
    sem3Count: stateStudents.filter((s) => s.semester === 3).length,
    sem5Count: stateStudents.filter((s) => s.semester === 5).length,
  };

  const facultyStats = {
    total: stateFaculty.length,
    meetingMinimum: stateFaculty.filter((f) => f.duties_valid).length,
    belowMinimum: stateFaculty.filter((f) => !f.duties_valid).length,
  };

  return {
    timetable: stateTimetable,
    timingSlots: stateTimingSlots,
    labs: stateLabs,
    faculty: stateFaculty,
    studentsBySem,
    facultyStats,
    attendanceSessions: stateAttendanceSessions,
  };
});

/**
 * 2. Get Students by Semester
 */
export const getStudentsBySemester = createServerFn({ method: "POST" })
  .validator(
    z
      .object({
        semester: z.number().optional(),
        search: z.string().optional(),
        department: z.string().optional(),
      })
      .optional(),
  )
  .handler(async ({ data }) => {
    let result = [...stateStudents];

    if (data?.semester && [1, 3, 5].includes(data.semester)) {
      result = result.filter((s) => s.semester === data.semester);
    }

    if (data?.search) {
      const q = data.search.toLowerCase();
      result = result.filter(
        (s) =>
          s.register_no.toLowerCase().includes(q) ||
          s.full_name.toLowerCase().includes(q) ||
          s.department.toLowerCase().includes(q),
      );
    }

    if (data?.department && data.department !== "ALL") {
      result = result.filter((s) => s.department === data.department);
    }

    return result;
  });

/**
 * 3. Timing Slots Management
 */
export const createOrUpdateTimingSlot = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string().optional(),
      name: z.string(),
      start_time: z.string(),
      end_time: z.string(),
      duration_minutes: z.number(),
      buffer_minutes: z.number().default(30),
      is_active: z.boolean().default(true),
    }),
  )
  .handler(async ({ data }) => {
    if (!data.name || !data.start_time || !data.end_time) {
      throw new Error("Start time, end time, and slot name are required");
    }

    if (data.id) {
      const idx = stateTimingSlots.findIndex((s) => s.id === data.id);
      if (idx !== -1) {
        stateTimingSlots[idx] = { ...stateTimingSlots[idx], ...data };
        return stateTimingSlots[idx];
      }
    }

    const newSlot: ExamTimingSlot = {
      id: `slot-${Date.now()}`,
      name: data.name,
      start_time: data.start_time,
      end_time: data.end_time,
      duration_minutes: data.duration_minutes,
      buffer_minutes: data.buffer_minutes,
      is_active: data.is_active,
    };
    stateTimingSlots.push(newSlot);
    return newSlot;
  });

export const deleteTimingSlot = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    stateTimingSlots = stateTimingSlots.filter((s) => s.id !== data.id);
    return { success: true };
  });

/**
 * 4. Timetable Draft Entry Management
 */
export const createTimetableEntry = createServerFn({ method: "POST" })
  .validator(
    z.object({
      exam_date: z.string(),
      timing_slot_id: z.string(),
      semester: z.union([z.literal(1), z.literal(3), z.literal(5)]),
      subject_code: z.string(),
      subject_name: z.string(),
      mode: z.enum(["offline", "online"]),
      selected_student_ids: z.array(z.string()).default([]),
      assigned_faculty_ids: z.array(z.string()).default([]),
      assigned_lab_id: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    if (stateTimetable.status === "PUBLISHED") {
      throw new Error("Cannot add entries to a published timetable. Please create a new draft.");
    }

    // Verify Faculty Eligibility (Test 2)
    const yearMapping: Record<ExamSemester, string> = {
      1: "1st Year",
      3: "3rd Year",
      5: "5th Year",
    };
    const requiredYear = yearMapping[data.semester];

    data.assigned_faculty_ids.forEach((fId) => {
      const faculty = stateFaculty.find((f) => f.id === fId);
      if (faculty && faculty.teaching_year !== requiredYear) {
        throw new Error(
          `Faculty eligibility violation: ${faculty.full_name} is ${faculty.teaching_year} faculty and cannot be assigned to Semester ${data.semester} (requires ${requiredYear} faculty).`,
        );
      }
    });

    // Check Student Conflict (Test 11)
    for (const studentId of data.selected_student_ids) {
      const conflictEntry = stateTimetable.entries.find(
        (e) =>
          e.exam_date === data.exam_date &&
          e.timing_slot_id === data.timing_slot_id &&
          e.selected_student_ids.includes(studentId),
      );
      if (conflictEntry) {
        const conflictStudent = stateStudents.find((s) => s.id === studentId);
        throw new Error(
          `Student schedule conflict: Student ${conflictStudent?.full_name || studentId} (${conflictStudent?.register_no}) is already scheduled for "${conflictEntry.subject_name}" on ${data.exam_date} in this same time slot.`,
        );
      }
    }

    const newEntry: TimetableDraftEntry = {
      id: `entry-${Date.now()}`,
      timetable_id: stateTimetable.id,
      exam_date: data.exam_date,
      timing_slot_id: data.timing_slot_id,
      semester: data.semester,
      subject_code: data.subject_code,
      subject_name: data.subject_name,
      mode: data.mode,
      selected_student_ids: data.selected_student_ids,
      assigned_faculty_ids: data.assigned_faculty_ids,
      assigned_lab_id: data.assigned_lab_id,
      batches: [],
      student_groups: [],
      created_at: new Date().toISOString(),
    };

    stateTimetable.entries.push(newEntry);
    stateTimetable.updated_at = new Date().toISOString();
    return newEntry;
  });

export const updateTimetableEntry = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string(),
      exam_date: z.string().optional(),
      timing_slot_id: z.string().optional(),
      semester: z.union([z.literal(1), z.literal(3), z.literal(5)]).optional(),
      subject_code: z.string().optional(),
      subject_name: z.string().optional(),
      mode: z.enum(["offline", "online"]).optional(),
      selected_student_ids: z.array(z.string()).optional(),
      assigned_faculty_ids: z.array(z.string()).optional(),
      assigned_lab_id: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    if (stateTimetable.status === "PUBLISHED") {
      throw new Error("Published timetables cannot be modified directly.");
    }

    const entry = stateTimetable.entries.find((e) => e.id === data.id);
    if (!entry) throw new Error("Timetable entry not found");

    const effectiveSemester = data.semester || entry.semester;
    const yearMapping: Record<ExamSemester, string> = {
      1: "1st Year",
      3: "3rd Year",
      5: "5th Year",
    };
    const requiredYear = yearMapping[effectiveSemester];

    if (data.assigned_faculty_ids) {
      data.assigned_faculty_ids.forEach((fId) => {
        const faculty = stateFaculty.find((f) => f.id === fId);
        if (faculty && faculty.teaching_year !== requiredYear) {
          throw new Error(
            `Ineligible faculty: ${faculty.full_name} (${faculty.teaching_year}) cannot be assigned to Semester ${effectiveSemester}. Must be ${requiredYear} faculty.`,
          );
        }
      });
    }

    Object.assign(entry, data);
    stateTimetable.updated_at = new Date().toISOString();
    return entry;
  });

export const deleteTimetableEntry = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    if (stateTimetable.status === "PUBLISHED") {
      throw new Error("Cannot delete entries from a published timetable.");
    }
    stateTimetable.entries = stateTimetable.entries.filter((e) => e.id !== data.id);
    stateTimetable.updated_at = new Date().toISOString();
    return { success: true };
  });

/**
 * 5. Faculty Placement by Year (Test 1, Test 2, Test 9)
 */
export const assignFacultyToEntry = createServerFn({ method: "POST" })
  .validator(
    z.object({
      entry_id: z.string(),
      faculty_ids: z.array(z.string()),
    }),
  )
  .handler(async ({ data }) => {
    const entry = stateTimetable.entries.find((e) => e.id === data.entry_id);
    if (!entry) throw new Error("Entry not found");

    const yearMapping: Record<ExamSemester, string> = {
      1: "1st Year",
      3: "3rd Year",
      5: "5th Year",
    };
    const requiredYear = yearMapping[entry.semester];

    for (const fId of data.faculty_ids) {
      const f = stateFaculty.find((fac) => fac.id === fId);
      if (!f) throw new Error(`Faculty ${fId} not found`);
      if (f.teaching_year !== requiredYear) {
        throw new Error(
          `Faculty eligibility error: ${f.full_name} is ${f.teaching_year} faculty and cannot be assigned to Semester ${entry.semester} (requires ${requiredYear}).`,
        );
      }

      // Test 9: Check simultaneous duty conflict
      const conflictingEntry = stateTimetable.entries.find(
        (other) =>
          other.id !== entry.id &&
          other.exam_date === entry.exam_date &&
          other.timing_slot_id === entry.timing_slot_id &&
          other.assigned_faculty_ids.includes(fId),
      );
      if (conflictingEntry) {
        throw new Error(
          `Simultaneous duty conflict: ${f.full_name} is already assigned to "${conflictingEntry.subject_name}" on ${entry.exam_date} in this same time slot.`,
        );
      }
    }

    entry.assigned_faculty_ids = data.faculty_ids;
    stateTimetable.updated_at = new Date().toISOString();
    return entry;
  });

/**
 * 6. Lab Allocation & Dynamic Online Batches (Test 6, Test 7, Test 10)
 */
export const allocateLabAndCreateBatches = createServerFn({ method: "POST" })
  .validator(
    z.object({
      entry_id: z.string(),
      lab_id: z.string(),
      auto_distribute_batches: z.boolean().default(false),
      custom_batch_size: z.number().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const entry = stateTimetable.entries.find((e) => e.id === data.entry_id);
    if (!entry) throw new Error("Timetable entry not found");

    const lab = stateLabs.find((l) => l.id === data.lab_id);
    if (!lab) throw new Error("Lab not found");

    // Check mode support
    if (entry.mode === "online" && !lab.supports_online) {
      throw new Error(`Lab "${lab.name}" does not support online examinations.`);
    }
    if (entry.mode === "offline" && !lab.supports_offline) {
      throw new Error(`Lab "${lab.name}" does not support offline examinations.`);
    }

    // Test 10: Check lab conflict
    const labConflict = stateTimetable.entries.find(
      (other) =>
        other.id !== entry.id &&
        other.exam_date === entry.exam_date &&
        other.timing_slot_id === entry.timing_slot_id &&
        other.assigned_lab_id === data.lab_id,
    );
    if (labConflict) {
      throw new Error(
        `Lab double-booking conflict: "${lab.name}" is already allocated to "${labConflict.subject_name}" at this time.`,
      );
    }

    // Test 6: Lab capacity check for offline mode without batching
    if (entry.mode === "offline" && entry.selected_student_ids.length > lab.capacity) {
      throw new Error(
        `Lab capacity exceeded: ${entry.selected_student_ids.length} students selected, but lab "${lab.name}" has a maximum capacity of ${lab.capacity}. Please split the students into groups or dynamic batches.`,
      );
    }

    entry.assigned_lab_id = data.lab_id;

    // Test 7: Online dynamic batches creation (e.g. 95 students / 30 capacity -> B1=30, B2=30, B3=30, B4=5)
    if (entry.mode === "online" || data.auto_distribute_batches) {
      const studentIds = entry.selected_student_ids;
      const batchCapacity = data.custom_batch_size || lab.capacity;
      const numBatches = Math.ceil(studentIds.length / batchCapacity);

      const generatedBatches: LabBatch[] = [];
      for (let i = 0; i < numBatches; i++) {
        const chunk = studentIds.slice(i * batchCapacity, (i + 1) * batchCapacity);
        generatedBatches.push({
          id: `batch-${entry.id}-${i + 1}`,
          batch_name: `Batch ${i + 1} (${chunk.length} Students)`,
          timetable_entry_id: entry.id,
          lab_id: lab.id,
          max_capacity: batchCapacity,
          student_ids: chunk,
        });
      }
      entry.batches = generatedBatches;
    }

    stateTimetable.updated_at = new Date().toISOString();
    return entry;
  });

/**
 * 7. Move Student Between Batches (Test 15)
 */
export const moveStudentBetweenBatches = createServerFn({ method: "POST" })
  .validator(
    z.object({
      entry_id: z.string(),
      source_batch_id: z.string(),
      target_batch_id: z.string(),
      student_id: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    const entry = stateTimetable.entries.find((e) => e.id === data.entry_id);
    if (!entry) throw new Error("Timetable entry not found");

    const sourceBatch = entry.batches.find((b) => b.id === data.source_batch_id);
    const targetBatch = entry.batches.find((b) => b.id === data.target_batch_id);

    if (!sourceBatch || !targetBatch) {
      throw new Error("Source or target batch not found");
    }

    if (!sourceBatch.student_ids.includes(data.student_id)) {
      throw new Error("Student is not enrolled in source batch");
    }

    if (targetBatch.student_ids.length >= targetBatch.max_capacity) {
      throw new Error(
        `Target batch "${targetBatch.batch_name}" is full (Capacity: ${targetBatch.max_capacity}). Cannot move student.`,
      );
    }

    // Move student
    sourceBatch.student_ids = sourceBatch.student_ids.filter((id) => id !== data.student_id);
    targetBatch.student_ids.push(data.student_id);

    // Update batch name counts
    sourceBatch.batch_name = `Batch ${sourceBatch.id.split("-").pop()} (${sourceBatch.student_ids.length} Students)`;
    targetBatch.batch_name = `Batch ${targetBatch.id.split("-").pop()} (${targetBatch.student_ids.length} Students)`;

    // Update corresponding attendance record if exists
    const record = stateAttendanceRecords.find(
      (r) => r.timetable_entry_id === entry.id && r.student_id === data.student_id,
    );
    if (record) {
      record.batch_id = targetBatch.id;
      record.session_id = `sess-${targetBatch.id}`;
    }

    stateTimetable.updated_at = new Date().toISOString();
    return { success: true, sourceBatch, targetBatch };
  });

/**
 * 8. Divide Student Group (Section 8)
 */
export const splitStudentGroup = createServerFn({ method: "POST" })
  .validator(
    z.object({
      entry_id: z.string(),
      split_into: z.number().min(2).max(10).default(2),
    }),
  )
  .handler(async ({ data }) => {
    const entry = stateTimetable.entries.find((e) => e.id === data.entry_id);
    if (!entry) throw new Error("Entry not found");

    const totalStudents = entry.selected_student_ids;
    if (totalStudents.length < data.split_into) {
      throw new Error("Not enough students in group to divide");
    }

    const perGroup = Math.ceil(totalStudents.length / data.split_into);
    const newGroups: StudentGroup[] = [];
    const groupLetters = ["A", "B", "C", "D", "E", "F", "G"];

    for (let i = 0; i < data.split_into; i++) {
      const chunk = totalStudents.slice(i * perGroup, (i + 1) * perGroup);
      newGroups.push({
        id: `grp-${entry.id}-${i + 1}`,
        group_name: `Semester ${entry.semester} Group ${groupLetters[i % groupLetters.length]}`,
        semester: entry.semester,
        student_ids: chunk,
      });
    }

    entry.student_groups = newGroups;
    stateTimetable.updated_at = new Date().toISOString();
    return entry;
  });

/**
 * 9. Merge Student Groups with Capacity Validation (Test 8)
 */
export const mergeStudentGroups = createServerFn({ method: "POST" })
  .validator(
    z.object({
      entry_id: z.string(),
      group_ids: z.array(z.string()),
      target_group_name: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    const entry = stateTimetable.entries.find((e) => e.id === data.entry_id);
    if (!entry) throw new Error("Entry not found");

    const selectedGroups = entry.student_groups.filter((g) => data.group_ids.includes(g.id));
    if (selectedGroups.length < 2) {
      throw new Error("Must select at least two groups to merge");
    }

    const combinedStudentIds = Array.from(new Set(selectedGroups.flatMap((g) => g.student_ids)));

    // Test 8: Merge capacity check
    if (entry.assigned_lab_id) {
      const lab = stateLabs.find((l) => l.id === entry.assigned_lab_id);
      if (lab && combinedStudentIds.length > lab.capacity) {
        throw new Error(
          `Merge blocked: Merged group has ${combinedStudentIds.length} students, which exceeds lab "${lab.name}" capacity of ${lab.capacity}. Please allocate a larger lab or divide across multiple batches.`,
        );
      }
    }

    entry.student_groups = entry.student_groups.filter((g) => !data.group_ids.includes(g.id));
    entry.student_groups.push({
      id: `grp-merged-${Date.now()}`,
      group_name: data.target_group_name || "Combined Lab Group",
      semester: entry.semester,
      student_ids: combinedStudentIds,
    });

    stateTimetable.updated_at = new Date().toISOString();
    return entry;
  });

/**
 * 10. Comprehensive 15-Rule Allocation Validation Engine
 */
export const validateTimetable = createServerFn({ method: "GET" }).handler(async () => {
  const issues: ValidationIssue[] = [];

  // Update duty counts
  const dutyCounts: Record<string, number> = {};
  stateFaculty.forEach((f) => {
    dutyCounts[f.id] = 0;
  });

  stateTimetable.entries.forEach((e) => {
    e.assigned_faculty_ids.forEach((fId) => {
      dutyCounts[fId] = (dutyCounts[fId] || 0) + 1;
    });
  });

  // Test 3, 4, 5: Minimum 3 duties per faculty
  stateFaculty.forEach((f) => {
    const duties = dutyCounts[f.id] || 0;
    f.total_duties_assigned = duties;
    f.duties_valid = duties >= 3;

    if (f.is_active && duties < 3) {
      issues.push({
        id: `issue-duty-${f.id}`,
        category: "faculty_duties",
        severity: "error",
        message: `Faculty ${f.full_name} (${f.employee_id}) has only ${duties}/3 duties allocated. Minimum 3 duties required before timetable publication.`,
        affected_faculty_id: f.id,
      });
    }
  });

  const yearMapping: Record<ExamSemester, string> = {
    1: "1st Year",
    3: "3rd Year",
    5: "5th Year",
  };

  const bookedLabsInSlot = new Set<string>();
  const busyFacultyInSlot = new Set<string>();
  const studentSlotMap = new Map<string, string>(); // studentId_slotKey -> entryId

  stateTimetable.entries.forEach((entry) => {
    const requiredYear = yearMapping[entry.semester];
    entry.assigned_faculty_ids.forEach((fId) => {
      const f = stateFaculty.find((fac) => fac.id === fId);
      if (f && f.teaching_year !== requiredYear) {
        issues.push({
          id: `issue-year-${entry.id}-${f.id}`,
          category: "faculty_eligibility",
          severity: "error",
          message: `Ineligible faculty assignment: ${f.full_name} (${f.teaching_year}) assigned to ${entry.subject_name} (Semester ${entry.semester} requires ${requiredYear} faculty).`,
          entry_id: entry.id,
          affected_faculty_id: f.id,
        });
      }

      const slotKey = `${entry.exam_date}_${entry.timing_slot_id}_${fId}`;
      if (busyFacultyInSlot.has(slotKey)) {
        issues.push({
          id: `issue-fac-conflict-${entry.id}-${fId}`,
          category: "faculty_eligibility",
          severity: "error",
          message: `Simultaneous duty conflict: Faculty ${f?.full_name || fId} is double-booked on ${entry.exam_date} in the same time slot.`,
          entry_id: entry.id,
          affected_faculty_id: fId,
        });
      } else {
        busyFacultyInSlot.add(slotKey);
      }
    });

    // Test 11: Check student schedule conflicts
    entry.selected_student_ids.forEach((stId) => {
      const stSlotKey = `${entry.exam_date}_${entry.timing_slot_id}_${stId}`;
      const existingEntryId = studentSlotMap.get(stSlotKey);
      if (existingEntryId && existingEntryId !== entry.id) {
        const student = stateStudents.find((s) => s.id === stId);
        issues.push({
          id: `issue-student-conflict-${entry.id}-${stId}`,
          category: "student",
          severity: "error",
          message: `Simultaneous student exam conflict: ${student?.full_name || stId} (${student?.register_no}) is assigned to two exams at the same time.`,
          entry_id: entry.id,
          affected_student_id: stId,
        });
      } else {
        studentSlotMap.set(stSlotKey, entry.id);
      }
    });

    if (entry.assigned_lab_id) {
      const lab = stateLabs.find((l) => l.id === entry.assigned_lab_id);
      if (lab) {
        const labSlotKey = `${entry.exam_date}_${entry.timing_slot_id}_${entry.assigned_lab_id}`;
        if (bookedLabsInSlot.has(labSlotKey)) {
          issues.push({
            id: `issue-lab-conflict-${entry.id}`,
            category: "lab_capacity",
            severity: "error",
            message: `Lab conflict: "${lab.name}" is double-booked on ${entry.exam_date} during slot.`,
            entry_id: entry.id,
            affected_lab_id: lab.id,
          });
        } else {
          bookedLabsInSlot.add(labSlotKey);
        }

        if (entry.mode === "offline" && entry.selected_student_ids.length > lab.capacity) {
          issues.push({
            id: `issue-cap-${entry.id}`,
            category: "lab_capacity",
            severity: "error",
            message: `Capacity exceeded: ${entry.selected_student_ids.length} students allocated to "${lab.name}" (Capacity: ${lab.capacity}).`,
            entry_id: entry.id,
            affected_lab_id: lab.id,
          });
        }

        if (entry.mode === "online") {
          const totalInBatches = entry.batches.reduce((sum, b) => sum + b.student_ids.length, 0);
          if (totalInBatches < entry.selected_student_ids.length) {
            issues.push({
              id: `issue-batch-${entry.id}`,
              category: "batch",
              severity: "error",
              message: `Online batch incomplete: Only ${totalInBatches} of ${entry.selected_student_ids.length} students assigned to batches.`,
              entry_id: entry.id,
            });
          }
        }
      }
    } else {
      issues.push({
        id: `issue-no-lab-${entry.id}`,
        category: "lab_capacity",
        severity: "warning",
        message: `No lab or classroom assigned to ${entry.subject_name}.`,
        entry_id: entry.id,
      });
    }

    if (entry.assigned_faculty_ids.length === 0) {
      issues.push({
        id: `issue-no-fac-${entry.id}`,
        category: "faculty_eligibility",
        severity: "error",
        message: `No invigilator faculty placed for ${entry.subject_name}.`,
        entry_id: entry.id,
      });
    }
  });

  const canFinalize = issues.filter((i) => i.severity === "error").length === 0;

  return {
    status: stateTimetable.status,
    totalIssues: issues.length,
    errorCount: issues.filter((i) => i.severity === "error").length,
    warningCount: issues.filter((i) => i.severity === "warning").length,
    canFinalize,
    issues,
  };
});

/**
 * 11. Finalize Timetable
 */
export const finalizeTimetable = createServerFn({ method: "POST" }).handler(async () => {
  const valRes = await validateTimetable();
  if (!valRes.canFinalize) {
    throw new Error(
      `Cannot finalize timetable: Found ${valRes.errorCount} blocking validation error(s). Please resolve all faculty duty deficits and capacity issues.`,
    );
  }

  stateTimetable.status = "FINALIZED";
  stateTimetable.updated_at = new Date().toISOString();
  return { success: true, status: stateTimetable.status };
});

/**
 * 12. Publish Timetable
 */
export const publishTimetable = createServerFn({ method: "POST" }).handler(async () => {
  if (stateTimetable.status !== "FINALIZED") {
    const valRes = await validateTimetable();
    if (!valRes.canFinalize) {
      throw new Error(`Cannot publish: Timetable has active validation errors.`);
    }
  }

  stateTimetable.status = "PUBLISHED";
  stateTimetable.published_at = new Date().toISOString();
  stateTimetable.updated_at = new Date().toISOString();
  return {
    success: true,
    status: stateTimetable.status,
    published_at: stateTimetable.published_at,
  };
});

/**
 * 13. Assign Additional Duty to Faculty
 */
export const assignAdditionalDutyToFaculty = createServerFn({ method: "POST" })
  .validator(
    z.object({
      faculty_id: z.string(),
      entry_id: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    const entry = stateTimetable.entries.find((e) => e.id === data.entry_id);
    if (!entry) throw new Error("Entry not found");

    const faculty = stateFaculty.find((f) => f.id === data.faculty_id);
    if (!faculty) throw new Error("Faculty not found");

    if (!entry.assigned_faculty_ids.includes(data.faculty_id)) {
      entry.assigned_faculty_ids.push(data.faculty_id);
    }

    stateTimetable.updated_at = new Date().toISOString();
    return { success: true, entry };
  });

// ---------------------------------------------------------------------------
// ATTENDANCE SERVER FUNCTIONS (Sections 10–26, Tests 12–18)
// ---------------------------------------------------------------------------

/**
 * 14. Get Attendance Session & Student Roster
 * (Test 16: Faculty authorization check)
 */
export const getAttendanceSession = createServerFn({ method: "POST" })
  .validator(
    z.object({
      timetable_entry_id: z.string(),
      batch_id: z.string().optional(),
      faculty_id: z.string().optional(),
      simulate_unauthorized: z.boolean().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const entry = stateTimetable.entries.find((e) => e.id === data.timetable_entry_id);
    if (!entry) throw new Error("Timetable entry not found");

    // Test 16: Check faculty authorization
    if (data.simulate_unauthorized) {
      throw new Error(
        "Unauthorized Access (Test 16): You are not assigned to invigilate this examination session. Only assigned invigilators or examination administrators can access attendance.",
      );
    }

    if (data.faculty_id && !entry.assigned_faculty_ids.includes(data.faculty_id)) {
      throw new Error(
        `Unauthorized Access: Faculty ${data.faculty_id} is not assigned to invigilate "${entry.subject_name}". Access to attendance form is denied.`,
      );
    }

    const sessionId = data.batch_id ? `sess-${data.batch_id}` : `sess-${entry.id}`;
    let session = stateAttendanceSessions.find((s) => s.id === sessionId);

    // Identify target student IDs
    let targetStudentIds: string[] = [];
    if (data.batch_id) {
      const batch = entry.batches.find((b) => b.id === data.batch_id);
      targetStudentIds = batch ? batch.student_ids : [];
    } else {
      targetStudentIds = entry.selected_student_ids;
    }

    // Initialize session if not present
    if (!session) {
      session = {
        id: sessionId,
        timetable_entry_id: entry.id,
        batch_id: data.batch_id,
        lab_id: entry.assigned_lab_id,
        status: "OPEN",
        total_students: targetStudentIds.length,
        present_count: 0,
        absent_count: 0,
        unmarked_count: targetStudentIds.length,
        attendance_percentage: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      stateAttendanceSessions.push(session);

      // Create attendance records
      targetStudentIds.forEach((stId) => {
        const student = stateStudents.find((s) => s.id === stId);
        if (student) {
          stateAttendanceRecords.push({
            id: `att-${sessionId}-${student.id}`,
            session_id: sessionId,
            timetable_entry_id: entry.id,
            batch_id: data.batch_id,
            student_id: student.id,
            student_name: student.full_name,
            register_no: student.register_no,
            semester: student.semester,
            department: student.department,
            status: "unmarked",
            updated_at: new Date().toISOString(),
          });
        }
      });
    }

    // Dynamic sync: Ensure roster reflects currently assigned students (Test 15)
    const records = stateAttendanceRecords.filter((r) => r.session_id === sessionId);
    const existingStudentIds = new Set(records.map((r) => r.student_id));

    // Add any newly added students
    targetStudentIds.forEach((stId) => {
      if (!existingStudentIds.has(stId)) {
        const student = stateStudents.find((s) => s.id === stId);
        if (student) {
          const newRec: AttendanceRecord = {
            id: `att-${sessionId}-${student.id}`,
            session_id: sessionId,
            timetable_entry_id: entry.id,
            batch_id: data.batch_id,
            student_id: student.id,
            student_name: student.full_name,
            register_no: student.register_no,
            semester: student.semester,
            department: student.department,
            status: "unmarked",
            updated_at: new Date().toISOString(),
          };
          stateAttendanceRecords.push(newRec);
          records.push(newRec);
        }
      }
    });

    // Filter out students no longer in target list
    const filteredRecords = records.filter((r) => targetStudentIds.includes(r.student_id));

    // Recalculate summary metrics
    const presentCount = filteredRecords.filter((r) => r.status === "present").length;
    const absentCount = filteredRecords.filter((r) => r.status === "absent").length;
    const unmarkedCount = filteredRecords.filter((r) => r.status === "unmarked").length;
    const totalCount = filteredRecords.length;

    session.total_students = totalCount;
    session.present_count = presentCount;
    session.absent_count = absentCount;
    session.unmarked_count = unmarkedCount;
    session.attendance_percentage =
      totalCount > 0 ? Number(((presentCount / totalCount) * 100).toFixed(2)) : 0;
    session.updated_at = new Date().toISOString();

    const auditLogs = stateAttendanceAudit.filter((a) => a.session_id === sessionId);
    const assignedFaculty = stateFaculty.filter((f) => entry.assigned_faculty_ids.includes(f.id));
    const lab = stateLabs.find((l) => l.id === (session.lab_id || entry.assigned_lab_id));
    const batch = entry.batches.find((b) => b.id === data.batch_id);

    return {
      session,
      records: filteredRecords,
      entry,
      batch,
      lab,
      assignedFaculty,
      auditLogs,
    };
  });

/**
 * 15. Update Individual Student Attendance Record
 * (Test 14: Dynamic absentee update, Test 18: Locked session block)
 */
export const updateStudentAttendance = createServerFn({ method: "POST" })
  .validator(
    z.object({
      session_id: z.string(),
      student_id: z.string(),
      status: z.enum(["unmarked", "present", "absent"]),
      notes: z.string().optional(),
      changed_by: z.string().default("Faculty Invigilator"),
      reason: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const session = stateAttendanceSessions.find((s) => s.id === data.session_id);
    if (!session) throw new Error("Attendance session not found");

    // Test 18: Locked attendance cannot be edited normally
    if (session.status === "LOCKED") {
      throw new Error(
        "Locked Session Violation (Test 18): This attendance register is officially LOCKED. Normal editing is disabled. An authorized administrator must unlock this session with an audit reason before making changes.",
      );
    }

    const record = stateAttendanceRecords.find(
      (r) => r.session_id === data.session_id && r.student_id === data.student_id,
    );
    if (!record) throw new Error("Student attendance record not found");

    const oldStatus = record.status;
    record.status = data.status;
    if (data.notes !== undefined) record.notes = data.notes;
    record.marked_by = data.changed_by;
    record.marked_at = new Date().toISOString();
    record.updated_at = new Date().toISOString();

    // Log audit entry if status changed
    if (oldStatus !== data.status) {
      stateAttendanceAudit.push({
        id: `audit-${Date.now()}`,
        session_id: data.session_id,
        timetable_entry_id: record.timetable_entry_id,
        student_id: record.student_id,
        student_name: record.student_name,
        changed_by: data.changed_by,
        old_status: oldStatus,
        new_status: data.status,
        reason: data.reason || `Status updated from ${oldStatus} to ${data.status}`,
        timestamp: new Date().toISOString(),
      });
    }

    // If session was OPEN, advance to IN_PROGRESS
    if (session.status === "OPEN") {
      session.status = "IN_PROGRESS";
    }

    // Recalculate session metrics
    const sessionRecords = stateAttendanceRecords.filter((r) => r.session_id === data.session_id);
    session.present_count = sessionRecords.filter((r) => r.status === "present").length;
    session.absent_count = sessionRecords.filter((r) => r.status === "absent").length;
    session.unmarked_count = sessionRecords.filter((r) => r.status === "unmarked").length;
    session.attendance_percentage =
      session.total_students > 0
        ? Number(((session.present_count / session.total_students) * 100).toFixed(2))
        : 0;
    session.updated_at = new Date().toISOString();

    return {
      success: true,
      record,
      session,
    };
  });

/**
 * 16. Bulk Mark Attendance (Mark All Present / Absent)
 */
export const bulkMarkAttendance = createServerFn({ method: "POST" })
  .validator(
    z.object({
      session_id: z.string(),
      status: z.enum(["present", "absent"]),
      student_ids: z.array(z.string()).optional(),
      marked_by: z.string().default("Faculty Invigilator"),
    }),
  )
  .handler(async ({ data }) => {
    const session = stateAttendanceSessions.find((s) => s.id === data.session_id);
    if (!session) throw new Error("Session not found");

    if (session.status === "LOCKED") {
      throw new Error("Cannot modify attendance: Session is LOCKED.");
    }

    let records = stateAttendanceRecords.filter((r) => r.session_id === data.session_id);
    if (data.student_ids && data.student_ids.length > 0) {
      records = records.filter((r) => data.student_ids!.includes(r.student_id));
    }

    records.forEach((r) => {
      r.status = data.status;
      r.marked_by = data.marked_by;
      r.marked_at = new Date().toISOString();
      r.updated_at = new Date().toISOString();
    });

    if (session.status === "OPEN") {
      session.status = "IN_PROGRESS";
    }

    const allSessionRecords = stateAttendanceRecords.filter(
      (r) => r.session_id === data.session_id,
    );
    session.present_count = allSessionRecords.filter((r) => r.status === "present").length;
    session.absent_count = allSessionRecords.filter((r) => r.status === "absent").length;
    session.unmarked_count = allSessionRecords.filter((r) => r.status === "unmarked").length;
    session.attendance_percentage =
      session.total_students > 0
        ? Number(((session.present_count / session.total_students) * 100).toFixed(2))
        : 0;
    session.updated_at = new Date().toISOString();

    return {
      success: true,
      session,
    };
  });

/**
 * 17. Submit Attendance Session
 * (Test 12, Test 13, Test 17: Unmarked student block)
 */
export const submitAttendanceSession = createServerFn({ method: "POST" })
  .validator(
    z.object({
      session_id: z.string(),
      submitted_by: z.string().default("Faculty Invigilator"),
      force_override_unmarked: z.boolean().default(false),
    }),
  )
  .handler(async ({ data }) => {
    const session = stateAttendanceSessions.find((s) => s.id === data.session_id);
    if (!session) throw new Error("Attendance session not found");

    if (session.status === "LOCKED") {
      throw new Error("Session is already locked.");
    }

    const sessionRecords = stateAttendanceRecords.filter((r) => r.session_id === data.session_id);
    const unmarkedRecords = sessionRecords.filter((r) => r.status === "unmarked");

    // Test 17: Warn / block if attendance contains unmarked students
    if (unmarkedRecords.length > 0 && !data.force_override_unmarked) {
      throw new Error(
        `Submission Blocked (Test 17): ${unmarkedRecords.length} student(s) remain unmarked. Every student must be explicitly marked Present or Absent before final submission.`,
      );
    }

    // If force_override_unmarked is true, convert unmarked to absent
    if (unmarkedRecords.length > 0 && data.force_override_unmarked) {
      unmarkedRecords.forEach((r) => {
        r.status = "absent";
        r.notes = "Marked absent automatically on submission override";
        r.marked_by = data.submitted_by;
        r.updated_at = new Date().toISOString();
      });
    }

    session.present_count = sessionRecords.filter((r) => r.status === "present").length;
    session.absent_count = sessionRecords.filter((r) => r.status === "absent").length;
    session.unmarked_count = 0;
    session.attendance_percentage =
      session.total_students > 0
        ? Number(((session.present_count / session.total_students) * 100).toFixed(2))
        : 0;
    session.status = "SUBMITTED";
    session.submitted_at = new Date().toISOString();
    session.submitted_by = data.submitted_by;
    session.updated_at = new Date().toISOString();

    const absentees = sessionRecords.filter((r) => r.status === "absent");

    return {
      success: true,
      session,
      absentees,
      present_count: session.present_count,
      absent_count: session.absent_count,
    };
  });

/**
 * 18. Lock / Unlock Attendance Session (Test 18)
 */
export const lockAttendanceSession = createServerFn({ method: "POST" })
  .validator(
    z.object({
      session_id: z.string(),
      locked_by: z.string().default("Exam Chief Superintendent"),
    }),
  )
  .handler(async ({ data }) => {
    const session = stateAttendanceSessions.find((s) => s.id === data.session_id);
    if (!session) throw new Error("Session not found");

    session.status = "LOCKED";
    session.locked_at = new Date().toISOString();
    session.locked_by = data.locked_by;
    session.updated_at = new Date().toISOString();

    return { success: true, session };
  });

export const unlockAttendanceSession = createServerFn({ method: "POST" })
  .validator(
    z.object({
      session_id: z.string(),
      unlocked_by: z.string().default("Exam Cell Administrator"),
      reason: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    if (!data.reason || data.reason.trim().length < 5) {
      throw new Error(
        "An audit reason of at least 5 characters is required to unlock an attendance session.",
      );
    }

    const session = stateAttendanceSessions.find((s) => s.id === data.session_id);
    if (!session) throw new Error("Session not found");

    session.status = "IN_PROGRESS";
    session.locked_at = undefined;
    session.locked_by = undefined;
    session.updated_at = new Date().toISOString();

    stateAttendanceAudit.push({
      id: `audit-unlock-${Date.now()}`,
      session_id: session.id,
      timetable_entry_id: session.timetable_entry_id,
      student_id: "ALL",
      student_name: "Session Unlock Action",
      changed_by: data.unlocked_by,
      old_status: "absent",
      new_status: "present",
      reason: `SESSION UNLOCKED: ${data.reason}`,
      timestamp: new Date().toISOString(),
    });

    return { success: true, session };
  });

/**
 * 19. Get Automatically Separated Absentees (Sections 14, 22)
 */
export const getSeparatedAbsentees = createServerFn({ method: "POST" })
  .validator(
    z
      .object({
        semester: z.number().optional(),
        timetable_entry_id: z.string().optional(),
        batch_id: z.string().optional(),
        department: z.string().optional(),
        search: z.string().optional(),
      })
      .optional(),
  )
  .handler(async ({ data }) => {
    let absentees = stateAttendanceRecords.filter((r) => r.status === "absent");

    if (data?.semester && [1, 3, 5].includes(data.semester)) {
      absentees = absentees.filter((r) => r.semester === data.semester);
    }

    if (data?.timetable_entry_id && data.timetable_entry_id !== "ALL") {
      absentees = absentees.filter((r) => r.timetable_entry_id === data.timetable_entry_id);
    }

    if (data?.batch_id && data.batch_id !== "ALL") {
      absentees = absentees.filter((r) => r.batch_id === data.batch_id);
    }

    if (data?.department && data.department !== "ALL") {
      absentees = absentees.filter((r) => r.department === data.department);
    }

    if (data?.search) {
      const q = data.search.toLowerCase();
      absentees = absentees.filter(
        (r) => r.register_no.toLowerCase().includes(q) || r.student_name.toLowerCase().includes(q),
      );
    }

    // Enrich absentees with entry, batch, and timing slot information
    const enriched = absentees.map((r) => {
      const entry = stateTimetable.entries.find((e) => e.id === r.timetable_entry_id);
      const slot = entry ? stateTimingSlots.find((s) => s.id === entry.timing_slot_id) : undefined;
      const lab = entry?.assigned_lab_id
        ? stateLabs.find((l) => l.id === entry.assigned_lab_id)
        : undefined;
      const batch = entry?.batches.find((b) => b.id === r.batch_id);

      return {
        ...r,
        subject_name: entry?.subject_name || "Unknown Exam",
        subject_code: entry?.subject_code || "",
        exam_date: entry?.exam_date || "",
        timing_name: slot?.name || "",
        timing_range: slot ? `${slot.start_time} - ${slot.end_time}` : "",
        lab_name: lab?.name || "Standard Examination Hall",
        batch_name: batch?.batch_name || "Whole Group / Offline",
      };
    });

    return enriched;
  });

/**
 * 20. Get Student Attendance History (Section 23)
 */
export const getStudentAttendanceHistory = createServerFn({ method: "POST" })
  .validator(z.object({ query: z.string() }))
  .handler(async ({ data }) => {
    const q = data.query.trim().toLowerCase();
    if (!q) return null;

    const student = stateStudents.find(
      (s) =>
        s.register_no.toLowerCase() === q ||
        s.id.toLowerCase() === q ||
        s.full_name.toLowerCase().includes(q),
    );

    if (!student) return null;

    const records = stateAttendanceRecords.filter((r) => r.student_id === student.id);

    const history = records.map((r) => {
      const entry = stateTimetable.entries.find((e) => e.id === r.timetable_entry_id);
      const slot = entry ? stateTimingSlots.find((s) => s.id === entry.timing_slot_id) : undefined;
      const lab = entry?.assigned_lab_id
        ? stateLabs.find((l) => l.id === entry.assigned_lab_id)
        : undefined;
      const batch = entry?.batches.find((b) => b.id === r.batch_id);

      return {
        id: r.id,
        exam_name: entry?.subject_name || "Scheduled Exam",
        subject_code: entry?.subject_code || "",
        exam_date: entry?.exam_date || "—",
        timing: slot ? `${slot.start_time} - ${slot.end_time}` : "—",
        venue: lab ? lab.name : "Offline Examination Hall",
        batch: batch ? batch.batch_name : "General Session",
        status: r.status,
        marked_at: r.marked_at,
        notes: r.notes,
      };
    });

    const totalExams = history.length;
    const presentCount = history.filter((h) => h.status === "present").length;
    const absentCount = history.filter((h) => h.status === "absent").length;
    const percentage = totalExams > 0 ? Number(((presentCount / totalExams) * 100).toFixed(2)) : 0;

    return {
      student,
      stats: {
        totalExams,
        presentCount,
        absentCount,
        percentage,
      },
      history,
    };
  });

/**
 * 21. Get Comprehensive Attendance Analytics (Sections 15, 16, 17, 18)
 */
export const getComprehensiveAttendanceAnalytics = createServerFn({ method: "GET" }).handler(
  async () => {
    const totalRecords = stateAttendanceRecords.length;
    const totalPresent = stateAttendanceRecords.filter((r) => r.status === "present").length;
    const totalAbsent = stateAttendanceRecords.filter((r) => r.status === "absent").length;
    const totalUnmarked = stateAttendanceRecords.filter((r) => r.status === "unmarked").length;
    const overallPercentage =
      totalRecords > 0 ? Number(((totalPresent / totalRecords) * 100).toFixed(2)) : 0;

    // By Semester
    const sem1Records = stateAttendanceRecords.filter((r) => r.semester === 1);
    const sem3Records = stateAttendanceRecords.filter((r) => r.semester === 3);
    const sem5Records = stateAttendanceRecords.filter((r) => r.semester === 5);

    const bySemester = [
      {
        semester: 1,
        name: "Semester 1 (1st Year)",
        total: sem1Records.length,
        present: sem1Records.filter((r) => r.status === "present").length,
        absent: sem1Records.filter((r) => r.status === "absent").length,
        percentage:
          sem1Records.length > 0
            ? Number(
                (
                  (sem1Records.filter((r) => r.status === "present").length / sem1Records.length) *
                  100
                ).toFixed(2),
              )
            : 0,
      },
      {
        semester: 3,
        name: "Semester 3 (3rd Year)",
        total: sem3Records.length,
        present: sem3Records.filter((r) => r.status === "present").length,
        absent: sem3Records.filter((r) => r.status === "absent").length,
        percentage:
          sem3Records.length > 0
            ? Number(
                (
                  (sem3Records.filter((r) => r.status === "present").length / sem3Records.length) *
                  100
                ).toFixed(2),
              )
            : 0,
      },
      {
        semester: 5,
        name: "Semester 5 (5th Year)",
        total: sem5Records.length,
        present: sem5Records.filter((r) => r.status === "present").length,
        absent: sem5Records.filter((r) => r.status === "absent").length,
        percentage:
          sem5Records.length > 0
            ? Number(
                (
                  (sem5Records.filter((r) => r.status === "present").length / sem5Records.length) *
                  100
                ).toFixed(2),
              )
            : 0,
      },
    ];

    // By Lab
    const byLab = stateLabs.map((lab) => {
      const labSessions = stateAttendanceSessions.filter((s) => s.lab_id === lab.id);
      const labRecords = stateAttendanceRecords.filter((r) =>
        labSessions.some((s) => s.id === r.session_id),
      );
      const present = labRecords.filter((r) => r.status === "present").length;
      const absent = labRecords.filter((r) => r.status === "absent").length;
      return {
        lab_id: lab.id,
        lab_name: lab.name,
        lab_code: lab.code,
        total_students: labRecords.length,
        present,
        absent,
        percentage:
          labRecords.length > 0 ? Number(((present / labRecords.length) * 100).toFixed(2)) : 0,
      };
    });

    return {
      overall: {
        totalRecords,
        totalPresent,
        totalAbsent,
        totalUnmarked,
        overallPercentage,
      },
      bySemester,
      byLab,
      sessionsCount: stateAttendanceSessions.length,
    };
  },
);

/**
 * 22. Reset Timetable & Attendance to Default State
 */
export const resetTimetableToDefault = createServerFn({ method: "POST" }).handler(async () => {
  stateTimingSlots = [...INITIAL_TIMING_SLOTS];
  stateLabs = [...INITIAL_LABS];
  stateFaculty = JSON.parse(JSON.stringify(INITIAL_FACULTY));
  stateStudents = [...INITIAL_STUDENTS];
  stateTimetable = JSON.parse(JSON.stringify(INITIAL_TIMETABLE));
  seedInitialAttendance();
  return { success: true };
});
