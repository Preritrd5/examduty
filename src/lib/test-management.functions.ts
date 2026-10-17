// @ts-nocheck
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// ---------------------------------------------------------------------------
// TYPES & SCHEMAS
// ---------------------------------------------------------------------------

export interface ComputerLab {
  id: string;
  name: string;
  code: string;
  block: string;
  floor: number;
  total_capacity: number;
  active_systems: number;
  in_repair_systems: number;
  operating_system: string;
  has_internet: boolean;
  has_webcam: boolean;
  has_ups_backup: boolean;
  active: boolean;
  lab_incharge: string;
  contact_phone: string;
}

export interface Classroom {
  id: string;
  room_number: string;
  block: string;
  floor: number;
  capacity: number;
  active: boolean;
}

export interface ScheduledTest {
  id: string;
  name: string;
  subject_code: string;
  subject_name: string;
  exam_type: "internal" | "semester" | "lab_practical" | "midterm" | "quiz";
  department: string;
  course: string;
  batch: string;
  section: string;
  exam_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  mode: "online" | "offline" | "hybrid";
  total_eligible: number;
  registered_count: number;
  expected_writing: number;
  actual_writing: number;
  absent_count: number;
  completed_count: number;
  live_attempting_count: number;
  status: "draft" | "scheduled" | "upcoming" | "in_progress" | "completed" | "cancelled" | "rescheduled";
  assigned_lab_ids: string[];
  assigned_room_ids: string[];
  lab_capacity_used: number;
  classroom_capacity_used: number;
  special_instructions?: string;
  created_at: string;
  updated_at: string;
}

export interface StudentLabSeat {
  id: string;
  test_id: string;
  student_id: string;
  student_name: string;
  register_no: string;
  department: string;
  section: string;
  batch: string;
  lab_id: string;
  lab_name: string;
  seat_no: string; // e.g., "PC-01"
  status: "allocated" | "present" | "writing" | "completed" | "absent";
  allocated_at: string;
}

export interface TestNotification {
  id: string;
  test_id?: string;
  title: string;
  message: string;
  category: "schedule" | "date_change" | "time_change" | "lab_change" | "cancellation" | "reschedule" | "reminder";
  target_audience: "all" | "students" | "faculty" | "coordinators" | "admins";
  created_at: string;
  read: boolean;
}

// ---------------------------------------------------------------------------
// RICH MOCK DATASETS & PERSISTENT IN-MEMORY STATE
// ---------------------------------------------------------------------------

const depts = ["Computer Science", "Electrical", "Mechanical", "Civil", "Electronics", "Information Technology"];
const sections = ["A", "B", "C", "D", "E"];

export interface SectionStrength {
  section: string;
  total: number;
  eligible: number;
  registered: number;
  writing?: number;
  absent?: number;
}

export interface DepartmentStrength {
  department: string;
  total_students: number;
  eligible_students: number;
  registered_students: number;
  writing_students: number;
  absent_students: number;
  completed_students: number;
  not_attempted: number;
  sections: SectionStrength[];
}

export interface OfficialReportNote {
  id: string;
  report_type: string;
  note: string;
  author: string;
  created_at: string;
}

export let stateOfficialReportNotes: OfficialReportNote[] = [
  {
    id: "note-1",
    report_type: "student_strength",
    note: "Certified by Exam Cell: Matrix verified against institutional ERP records with 100% hall ticket validation.",
    author: "Controller of Examinations",
    created_at: new Date().toISOString(),
  },
];

export let stateDepartmentStrength: DepartmentStrength[] = [
  {
    department: "Computer Science",
    total_students: 120,
    eligible_students: 116,
    registered_students: 114,
    writing_students: 28,
    absent_students: 1,
    completed_students: 52,
    not_attempted: 33,
    sections: [
      { section: "A", total: 24, eligible: 24, registered: 24, writing: 6, absent: 0 },
      { section: "B", total: 24, eligible: 23, registered: 23, writing: 6, absent: 0 },
      { section: "C", total: 24, eligible: 23, registered: 22, writing: 5, absent: 1 },
      { section: "D", total: 24, eligible: 23, registered: 23, writing: 6, absent: 0 },
      { section: "E", total: 24, eligible: 23, registered: 22, writing: 5, absent: 0 },
    ],
  },
  {
    department: "Information Technology",
    total_students: 90,
    eligible_students: 86,
    registered_students: 84,
    writing_students: 22,
    absent_students: 1,
    completed_students: 36,
    not_attempted: 25,
    sections: [
      { section: "A", total: 30, eligible: 29, registered: 28, writing: 8, absent: 0 },
      { section: "B", total: 30, eligible: 29, registered: 28, writing: 7, absent: 1 },
      { section: "C", total: 30, eligible: 28, registered: 28, writing: 7, absent: 0 },
    ],
  },
  {
    department: "Electronics",
    total_students: 85,
    eligible_students: 82,
    registered_students: 80,
    writing_students: 20,
    absent_students: 0,
    completed_students: 34,
    not_attempted: 26,
    sections: [
      { section: "A", total: 28, eligible: 27, registered: 27, writing: 7, absent: 0 },
      { section: "B", total: 28, eligible: 27, registered: 26, writing: 6, absent: 0 },
      { section: "C", total: 29, eligible: 28, registered: 27, writing: 7, absent: 0 },
    ],
  },
  {
    department: "Electrical",
    total_students: 75,
    eligible_students: 71,
    registered_students: 69,
    writing_students: 16,
    absent_students: 1,
    completed_students: 28,
    not_attempted: 24,
    sections: [
      { section: "A", total: 37, eligible: 35, registered: 34, writing: 8, absent: 0 },
      { section: "B", total: 38, eligible: 36, registered: 35, writing: 8, absent: 1 },
    ],
  },
  {
    department: "Mechanical",
    total_students: 70,
    eligible_students: 66,
    registered_students: 64,
    writing_students: 16,
    absent_students: 1,
    completed_students: 24,
    not_attempted: 23,
    sections: [
      { section: "A", total: 35, eligible: 33, registered: 32, writing: 8, absent: 0 },
      { section: "B", total: 35, eligible: 33, registered: 32, writing: 8, absent: 1 },
    ],
  },
  {
    department: "Civil",
    total_students: 60,
    eligible_students: 59,
    registered_students: 57,
    writing_students: 14,
    absent_students: 0,
    completed_students: 18,
    not_attempted: 25,
    sections: [
      { section: "A", total: 30, eligible: 30, registered: 29, writing: 7, absent: 0 },
      { section: "B", total: 30, eligible: 29, registered: 28, writing: 7, absent: 0 },
    ],
  },
];

// 10 High-Tech Computer Labs (40 capacity each)
export let stateComputerLabs: ComputerLab[] = [
  {
    id: "lab-1",
    name: "Lab 1 — Alan Turing Computing Lab",
    code: "LAB-TURING-101",
    block: "Block A",
    floor: 1,
    total_capacity: 40,
    active_systems: 40,
    in_repair_systems: 0,
    operating_system: "Ubuntu Linux 24.04 / Windows 11",
    has_internet: true,
    has_webcam: true,
    has_ups_backup: true,
    active: true,
    lab_incharge: "Dr. Kavya RS",
    contact_phone: "+91 98450 11223",
  },
  {
    id: "lab-2",
    name: "Lab 2 — Ada Lovelace Systems Lab",
    code: "LAB-LOVELACE-102",
    block: "Block A",
    floor: 1,
    total_capacity: 40,
    active_systems: 40,
    in_repair_systems: 0,
    operating_system: "Windows 11 Enterprise",
    has_internet: true,
    has_webcam: true,
    has_ups_backup: true,
    active: true,
    lab_incharge: "Prof. Chetan Kumar",
    contact_phone: "+91 98450 22334",
  },
  {
    id: "lab-3",
    name: "Lab 3 — John von Neumann AI & Robotics Lab",
    code: "LAB-NEUMANN-201",
    block: "Block A",
    floor: 2,
    total_capacity: 40,
    active_systems: 40,
    in_repair_systems: 0,
    operating_system: "Ubuntu Linux / CUDA GPU",
    has_internet: true,
    has_webcam: true,
    has_ups_backup: true,
    active: true,
    lab_incharge: "Dr. Vinaya DS",
    contact_phone: "+91 98450 33445",
  },
  {
    id: "lab-4",
    name: "Lab 4 — Claude Shannon Network & Telecom Lab",
    code: "LAB-SHANNON-202",
    block: "Block A",
    floor: 2,
    total_capacity: 40,
    active_systems: 40,
    in_repair_systems: 0,
    operating_system: "Linux Debian Enterprise",
    has_internet: true,
    has_webcam: true,
    has_ups_backup: true,
    active: true,
    lab_incharge: "Mr. Kalaiah JB",
    contact_phone: "+91 98450 44556",
  },
  {
    id: "lab-5",
    name: "Lab 5 — Grace Hopper Software Engineering Lab",
    code: "LAB-HOPPER-301",
    block: "Block A",
    floor: 3,
    total_capacity: 40,
    active_systems: 40,
    in_repair_systems: 0,
    operating_system: "Windows 11 Pro",
    has_internet: true,
    has_webcam: true,
    has_ups_backup: true,
    active: true,
    lab_incharge: "Mrs. Shashi Rekha G",
    contact_phone: "+91 98450 55667",
  },
  {
    id: "lab-6",
    name: "Lab 6 — Dennis Ritchie Systems Programming Lab",
    code: "LAB-RITCHIE-302",
    block: "Block A",
    floor: 3,
    total_capacity: 40,
    active_systems: 40,
    in_repair_systems: 0,
    operating_system: "Fedora Linux / GCC Toolchain",
    has_internet: true,
    has_webcam: true,
    has_ups_backup: true,
    active: true,
    lab_incharge: "Dr. Amit Patel",
    contact_phone: "+91 98450 66778",
  },
  {
    id: "lab-7",
    name: "Lab 7 — Tim Berners-Lee Web & Cloud Lab",
    code: "LAB-BERNERS-101B",
    block: "Block B",
    floor: 1,
    total_capacity: 40,
    active_systems: 40,
    in_repair_systems: 0,
    operating_system: "Windows 11 / Node.js Environment",
    has_internet: true,
    has_webcam: true,
    has_ups_backup: true,
    active: true,
    lab_incharge: "Ms. Shailaja DS",
    contact_phone: "+91 98450 77889",
  },
  {
    id: "lab-8",
    name: "Lab 8 — Linus Torvalds Open Source Lab",
    code: "LAB-TORVALDS-201B",
    block: "Block B",
    floor: 2,
    total_capacity: 40,
    active_systems: 40,
    in_repair_systems: 0,
    operating_system: "Arch Linux / Docker Containerized",
    has_internet: true,
    has_webcam: true,
    has_ups_backup: true,
    active: true,
    lab_incharge: "Dr. Arjun Rao",
    contact_phone: "+91 98450 88990",
  },
  {
    id: "lab-9",
    name: "Lab 9 — Bjarne Stroustrup High Performance Computing Lab",
    code: "LAB-STROUSTRUP-301B",
    block: "Block B",
    floor: 3,
    total_capacity: 40,
    active_systems: 40,
    in_repair_systems: 0,
    operating_system: "RedHat Enterprise Linux",
    has_internet: true,
    has_webcam: true,
    has_ups_backup: true,
    active: true,
    lab_incharge: "Dr. Bhavya Singh",
    contact_phone: "+91 98450 99001",
  },
  {
    id: "lab-10",
    name: "Lab 10 — Barbara Liskov Data Science Lab",
    code: "LAB-LISKOV-401B",
    block: "Block B",
    floor: 4,
    total_capacity: 40,
    active_systems: 40,
    in_repair_systems: 0,
    operating_system: "Windows 11 / Anaconda Python",
    has_internet: true,
    has_webcam: true,
    has_ups_backup: true,
    active: true,
    lab_incharge: "Mr. Yogesh Gowda V",
    contact_phone: "+91 98450 10112",
  },
];

// 40 Classrooms (30 capacity each)
export let stateClassrooms: Classroom[] = Array.from({ length: 40 }, (_, i) => {
  const floor = Math.floor(i / 8) + 1;
  const num = (i % 8) + 1;
  return {
    id: `room-${i + 1}`,
    room_number: `A-${floor}0${num}`,
    block: "Block A",
    floor,
    capacity: 30,
    active: true,
  };
});

// Mock Students (500 enrolled)
const firstNamesList = [
  "Aarav", "Aditi", "Amit", "Ananya", "Arjun", "Bhavya", "Chetan", "Dev", "Divya", "Esha",
  "Gautam", "Isha", "Kavya", "Karan", "Manish", "Neha", "Nikhil", "Pooja", "Priya", "Rahul",
  "Rohan", "Riya", "Sameer", "Shreya", "Siddharth", "Sneha", "Tanvi", "Varun", "Vikas", "Yash",
  "Abhinav", "Akanksha", "Alok", "Ankita", "Deepak", "Harish", "Kiran", "Meera", "Pranav", "Ritu",
  "Sanjay", "Swati", "Tarun", "Vidya", "Aakash", "Bharti", "Chandan", "Geeta", "Hemant", "Jyoti"
];
const lastNamesList = [
  "Sharma", "Verma", "Patel", "Rao", "Singh", "Kumar", "Gupta", "Joshi", "Mehta", "Reddy",
  "Nair", "Deshmukh", "Choudhury", "Bhat", "Iyer", "Kulkarni", "Chawla", "Malhotra", "Saxena", "Kapoor",
  "Agarwal", "Bansal", "Chopra", "Dutta", "Gokhale", "Hegde", "Jain", "Khanna", "Mahajan", "Pandey"
];

export let stateStudentsPool = Array.from({ length: 500 }, (_, i) => {
  const fn = firstNamesList[i % firstNamesList.length];
  const ln = lastNamesList[(i * 7 + Math.floor(i / firstNamesList.length)) % lastNamesList.length];
  const dept = depts[i % depts.length];
  const section = sections[i % sections.length];
  const deptCode = dept === "Computer Science" ? "CS" : dept === "Electrical" ? "EE" : dept === "Mechanical" ? "ME" : dept === "Civil" ? "CV" : dept === "Electronics" ? "EC" : "IT";
  const regNo = `2026${deptCode}${String(i + 1).padStart(4, "0")}`;
  const semester = ((i % 8) + 1);

  return {
    id: `student-${i + 1}`,
    serial_no: i + 1,
    register_no: regNo,
    full_name: `${fn} ${ln}`,
    department: dept,
    course: `B.Tech in ${dept}`,
    batch: "2024-2028 Batch",
    section: section,
    semester: semester,
    class_name: `Year ${Math.ceil(semester / 2)} - Sec ${section}`,
    active: true,
    is_eligible: i % 25 !== 0, // 96% eligible
    is_registered: i % 25 !== 0 && i % 40 !== 0,
  };
});

const todayIso = new Date().toISOString().slice(0, 10);
const tomorrowIso = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
const dayAfterIso = new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10);
const nextWeekIso = new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 10);
const pastDateIso = new Date(Date.now() - 86400000 * 3).toISOString().slice(0, 10);

// Scheduled Tests / Examinations
export let stateScheduledTests: ScheduledTest[] = [
  {
    id: "test-1",
    name: "CS301 — Data Structures & Algorithms Lab Assessment",
    subject_code: "CS301",
    subject_name: "Data Structures & Algorithms",
    exam_type: "lab_practical",
    department: "Computer Science",
    course: "B.Tech Computer Science",
    batch: "2024-2028",
    section: "A, B, C",
    exam_date: todayIso,
    start_time: "10:00 AM",
    end_time: "11:30 AM",
    duration_minutes: 90,
    mode: "online",
    total_eligible: 120,
    registered_count: 120,
    expected_writing: 120,
    actual_writing: 116,
    absent_count: 4,
    completed_count: 0,
    live_attempting_count: 116,
    status: "in_progress",
    assigned_lab_ids: ["lab-1", "lab-2", "lab-3"],
    assigned_room_ids: [],
    lab_capacity_used: 120,
    classroom_capacity_used: 0,
    special_instructions: "Terminal environment locked. Browser sandbox enforced. Calculators permitted.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "test-2",
    name: "EE204 — Digital Systems & Verilog Simulation Test",
    subject_code: "EE204",
    subject_name: "Digital Systems & Logic Design",
    exam_type: "internal",
    department: "Electrical",
    course: "B.Tech Electrical Engineering",
    batch: "2024-2028",
    section: "A, B",
    exam_date: tomorrowIso,
    start_time: "02:00 PM",
    end_time: "03:30 PM",
    duration_minutes: 90,
    mode: "online",
    total_eligible: 80,
    registered_count: 78,
    expected_writing: 78,
    actual_writing: 0,
    absent_count: 0,
    completed_count: 0,
    live_attempting_count: 0,
    status: "upcoming",
    assigned_lab_ids: ["lab-4", "lab-5"],
    assigned_room_ids: [],
    lab_capacity_used: 80,
    classroom_capacity_used: 0,
    special_instructions: "Use ModelSim / Quartus prime simulator. Submit wave diagrams in portal.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "test-3",
    name: "ME401 — CAD & Finite Element Analysis Final Exam",
    subject_code: "ME401",
    subject_name: "CAD Modeling & FEA",
    exam_type: "semester",
    department: "Mechanical",
    course: "B.Tech Mechanical Engineering",
    batch: "2023-2027",
    section: "A, B, C, D",
    exam_date: nextWeekIso,
    start_time: "09:30 AM",
    end_time: "12:30 PM",
    duration_minutes: 180,
    mode: "online",
    total_eligible: 160,
    registered_count: 156,
    expected_writing: 156,
    actual_writing: 0,
    absent_count: 0,
    completed_count: 0,
    live_attempting_count: 0,
    status: "scheduled",
    assigned_lab_ids: ["lab-6", "lab-7", "lab-8", "lab-9"],
    assigned_room_ids: [],
    lab_capacity_used: 160,
    classroom_capacity_used: 0,
    special_instructions: "SolidWorks & ANSYS workbenches authorized. Pre-configured part models loaded.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "test-4",
    name: "CV302 — Structural Mechanics & Concrete Technology Final",
    subject_code: "CV302",
    subject_name: "Structural Mechanics",
    exam_type: "semester",
    department: "Civil",
    course: "B.Tech Civil Engineering",
    batch: "2024-2028",
    section: "A, B, C",
    exam_date: dayAfterIso,
    start_time: "10:00 AM",
    end_time: "01:00 PM",
    duration_minutes: 180,
    mode: "offline",
    total_eligible: 90,
    registered_count: 90,
    expected_writing: 90,
    actual_writing: 0,
    absent_count: 0,
    completed_count: 0,
    live_attempting_count: 0,
    status: "scheduled",
    assigned_lab_ids: [],
    assigned_room_ids: ["room-1", "room-2", "room-3"],
    lab_capacity_used: 0,
    classroom_capacity_used: 90,
    special_instructions: "Handwritten booklet answers. Physical drawing boards provided in halls.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "test-5",
    name: "CS101 — Python Programming & Object Oriented Paradigms",
    subject_code: "CS101",
    subject_name: "Python Foundations & OOP",
    exam_type: "quiz",
    department: "Computer Science",
    course: "B.Tech Computer Science",
    batch: "2025-2029",
    section: "All Sections",
    exam_date: pastDateIso,
    start_time: "11:00 AM",
    end_time: "12:00 PM",
    duration_minutes: 60,
    mode: "online",
    total_eligible: 200,
    registered_count: 198,
    expected_writing: 198,
    actual_writing: 192,
    absent_count: 6,
    completed_count: 192,
    live_attempting_count: 0,
    status: "completed",
    assigned_lab_ids: ["lab-1", "lab-2", "lab-3", "lab-4", "lab-5"],
    assigned_room_ids: [],
    lab_capacity_used: 200,
    classroom_capacity_used: 0,
    special_instructions: "Evaluation finalized. Marks synchronized to master ledger.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Student Lab Seat Allocations
export let stateLabSeatAllocations: StudentLabSeat[] = [];

// Seed initial allocations for test-1 (120 students across Lab 1, 2, 3)
(() => {
  const test1Students = stateStudentsPool.slice(0, 120);
  const labsForTest1 = [
    { id: "lab-1", name: "Lab 1 — Alan Turing Computing Lab" },
    { id: "lab-2", name: "Lab 2 — Ada Lovelace Systems Lab" },
    { id: "lab-3", name: "Lab 3 — John von Neumann AI & Robotics Lab" },
  ];

  test1Students.forEach((st, idx) => {
    const labIdx = Math.floor(idx / 40);
    const lab = labsForTest1[labIdx] || labsForTest1[0];
    const pcNum = (idx % 40) + 1;
    const isAbsent = idx === 12 || idx === 45 || idx === 78 || idx === 111;

    stateLabSeatAllocations.push({
      id: `seat-t1-${idx + 1}`,
      test_id: "test-1",
      student_id: st.id,
      student_name: st.full_name,
      register_no: st.register_no,
      department: st.department,
      section: st.section,
      batch: st.batch,
      lab_id: lab.id,
      lab_name: lab.name,
      seat_no: `PC-${String(pcNum).padStart(2, "0")}`,
      status: isAbsent ? "absent" : "writing",
      allocated_at: new Date().toISOString(),
    });
  });
})();

// Notifications
export let stateTestNotifications: TestNotification[] = [
  {
    id: "notif-1",
    test_id: "test-1",
    title: "Exam Alert: CS301 Lab Assessment Started",
    message: "CS301 Data Structures lab assessment is now IN PROGRESS across Labs 1, 2, and 3. In-charge invigilators verify candidate SRN cards.",
    category: "schedule",
    target_audience: "all",
    created_at: new Date(Date.now() - 3600000).toISOString(),
    read: false,
  },
  {
    id: "notif-2",
    test_id: "test-2",
    title: "Upcoming Test: EE204 Digital Systems Lab Scheduled",
    message: "EE204 online simulation exam is scheduled for tomorrow at 02:00 PM in Shannon & Hopper Labs. 78 students registered.",
    category: "schedule",
    target_audience: "students",
    created_at: new Date(Date.now() - 18000000).toISOString(),
    read: true,
  },
  {
    id: "notif-3",
    test_id: "test-3",
    title: "Capacity Planning Alert: ME401 Final Exam",
    message: "156 students writing ME401 online exam. 4 Computer Labs (Labs 6, 7, 8, 9) allocated with 160 total capacity. 0 shortage.",
    category: "reminder",
    target_audience: "admins",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    read: true,
  },
  {
    id: "notif-4",
    test_id: "test-4",
    title: "Classroom Allocation: CV302 Offline Final Exam",
    message: "CV302 Structural Mechanics will be conducted offline in Classrooms A-101, A-102, A-103. Booklet dispatch scheduled at 09:15 AM.",
    category: "schedule",
    target_audience: "faculty",
    created_at: new Date(Date.now() - 100000000).toISOString(),
    read: true,
  },
];

// ---------------------------------------------------------------------------
// BUSINESS LOGIC & CALCULATION ENGINE
// ---------------------------------------------------------------------------

/**
 * Formula:
 * Required Labs = Ceiling(Students Writing / Lab Capacity)
 * Required Classrooms = Ceiling(Students / Classroom Capacity)
 */
export function calculateInfrastructureRequirements({
  studentsWriting,
  labCapacity = 40,
  classroomCapacity = 30,
  availableLabsCount = 10,
  availableClassroomsCount = 40,
}: {
  studentsWriting: number;
  labCapacity?: number;
  classroomCapacity?: number;
  availableLabsCount?: number;
  availableClassroomsCount?: number;
}) {
  const safeWriting = Math.max(0, Number(studentsWriting) || 0);
  const safeLabCap = Math.max(1, Number(labCapacity) || 40);
  const safeRoomCap = Math.max(1, Number(classroomCapacity) || 30);

  const labsRequired = Math.ceil(safeWriting / safeLabCap);
  const additionalLabsRequired = Math.max(0, labsRequired - availableLabsCount);
  const labCapacityShortage = Math.max(0, safeWriting - availableLabsCount * safeLabCap);

  const classroomsRequired = Math.ceil(safeWriting / safeRoomCap);
  const additionalClassroomsRequired = Math.max(0, classroomsRequired - availableClassroomsCount);
  const classroomCapacityShortage = Math.max(0, safeWriting - availableClassroomsCount * safeRoomCap);

  return {
    studentsWriting: safeWriting,
    labCapacity: safeLabCap,
    classroomCapacity: safeRoomCap,
    availableLabsCount,
    labsRequired,
    additionalLabsRequired,
    labCapacityShortage,
    hasLabShortage: additionalLabsRequired > 0,
    availableClassroomsCount,
    classroomsRequired,
    additionalClassroomsRequired,
    classroomCapacityShortage,
    hasRoomShortage: additionalClassroomsRequired > 0,
  };
}

/**
 * Validates scheduling conflicts:
 * - Prevents double booking of the same lab at the same date & time slot
 * - Prevents double booking of the same classroom at the same date & time slot
 */
export function validateSchedulingConflicts({
  testId,
  examDate,
  startTime,
  endTime,
  assignedLabIds = [],
  assignedRoomIds = [],
}: {
  testId?: string;
  examDate: string;
  startTime: string;
  endTime: string;
  assignedLabIds?: string[];
  assignedRoomIds?: string[];
}) {
  const conflicts: string[] = [];

  const activeTests = stateScheduledTests.filter(
    (t) => t.id !== testId && t.status !== "cancelled" && t.exam_date === examDate
  );

  for (const existing of activeTests) {
    // Check time overlap
    const isOverlapping = checkTimeOverlap(startTime, endTime, existing.start_time, existing.end_time);
    if (!isOverlapping) continue;

    // Check lab conflicts
    for (const labId of assignedLabIds) {
      if (existing.assigned_lab_ids.includes(labId)) {
        const labObj = stateComputerLabs.find((l) => l.id === labId);
        conflicts.push(
          `Conflict: ${labObj?.name || labId} is already booked for "${existing.name}" on ${examDate} (${existing.start_time} - ${existing.end_time}).`
        );
      }
    }

    // Check classroom conflicts
    for (const roomId of assignedRoomIds) {
      if (existing.assigned_room_ids.includes(roomId)) {
        const roomObj = stateClassrooms.find((r) => r.id === roomId);
        conflicts.push(
          `Conflict: Classroom ${roomObj?.room_number || roomId} is already booked for "${existing.name}" on ${examDate} (${existing.start_time} - ${existing.end_time}).`
        );
      }
    }
  }

  return conflicts;
}

function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const clean = timeStr.trim().toUpperCase();
  const isPM = clean.includes("PM");
  const isAM = clean.includes("AM");
  const parts = clean.replace(/[APM\s]/g, "").split(":");
  let hours = parseInt(parts[0] || "0", 10);
  const minutes = parseInt(parts[1] || "0", 10);

  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

function checkTimeOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
  const s1 = parseTimeToMinutes(start1);
  const e1 = parseTimeToMinutes(end1);
  const s2 = parseTimeToMinutes(start2);
  const e2 = parseTimeToMinutes(end2);

  // Overlap condition: max(s1, s2) < min(e1, e2)
  return Math.max(s1, s2) < Math.min(e1, e2);
}

// ---------------------------------------------------------------------------
// SERVER FUNCTIONS (RPC ENDPOINTS)
// ---------------------------------------------------------------------------

/**
 * 1. LIST TESTS WITH COMPREHENSIVE FILTERING & CALCULATIONS
 */
export const listScheduledTests = createServerFn().handler(async () => {
  return stateScheduledTests.map((test) => {
    const allocatedStudentsCount = stateLabSeatAllocations.filter((a) => a.test_id === test.id).length;
    const reqs = calculateInfrastructureRequirements({
      studentsWriting: test.expected_writing,
      labCapacity: 40,
      classroomCapacity: 30,
      availableLabsCount: stateComputerLabs.filter((l) => l.active).length,
      availableClassroomsCount: stateClassrooms.filter((r) => r.active).length,
    });

    return {
      ...test,
      allocated_students_count: allocatedStudentsCount,
      infrastructure_calculations: reqs,
      assigned_labs: stateComputerLabs.filter((l) => test.assigned_lab_ids.includes(l.id)),
      assigned_rooms: stateClassrooms.filter((r) => test.assigned_room_ids.includes(r.id)),
    };
  });
});

/**
 * 2. GET SINGLE TEST WITH FULL ALLOCATIONS & STRENGTH BREAKDOWN
 */
export const getTestDetails = createServerFn()
  .validator((d: { testId: string }) => d)
  .handler(async ({ data }) => {
    const test = stateScheduledTests.find((t) => t.id === data.testId);
    if (!test) throw new Error("Test not found");

    const allocations = stateLabSeatAllocations.filter((a) => a.test_id === data.testId);
    const assignedLabs = stateComputerLabs.filter((l) => test.assigned_lab_ids.includes(l.id));
    const assignedRooms = stateClassrooms.filter((r) => test.assigned_room_ids.includes(r.id));

    // Lab-wise breakdown
    const labBreakdown = assignedLabs.map((lab) => {
      const labAllocs = allocations.filter((a) => a.lab_id === lab.id);
      const assignedCount = labAllocs.length;
      const availableSeats = Math.max(0, lab.total_capacity - assignedCount);
      const writingCount = labAllocs.filter((a) => a.status === "writing" || a.status === "present").length;
      const completedCount = labAllocs.filter((a) => a.status === "completed").length;
      const absentCount = labAllocs.filter((a) => a.status === "absent").length;

      let status = "Available";
      if (assignedCount >= lab.total_capacity) status = "Full";
      if (assignedCount > lab.total_capacity) status = "Over Capacity";

      return {
        lab_id: lab.id,
        lab_name: lab.name,
        code: lab.code,
        block: lab.block,
        floor: lab.floor,
        total_capacity: lab.total_capacity,
        assigned_students: assignedCount,
        available_seats: availableSeats,
        actual_writing: writingCount,
        completed: completedCount,
        absent: absentCount,
        status,
      };
    });

    const reqs = calculateInfrastructureRequirements({
      studentsWriting: test.expected_writing,
      labCapacity: 40,
      classroomCapacity: 30,
      availableLabsCount: stateComputerLabs.filter((l) => l.active).length,
      availableClassroomsCount: stateClassrooms.filter((r) => r.active).length,
    });

    return {
      test,
      assignedLabs,
      assignedRooms,
      labBreakdown,
      allocations,
      infrastructure_calculations: reqs,
    };
  });

/**
 * 3. CREATE NEW SCHEDULED TEST
 */
export const createScheduledTest = createServerFn()
  .validator((d: any) => d)
  .handler(async ({ data }) => {
    // Basic validation
    if (!data.name || !data.subject_code || !data.exam_date || !data.start_time || !data.end_time) {
      throw new Error("Missing required examination fields: Name, Subject Code, Date, Start Time, and End Time are mandatory.");
    }

    const startMin = parseTimeToMinutes(data.start_time);
    const endMin = parseTimeToMinutes(data.end_time);
    if (endMin <= startMin) {
      throw new Error("Invalid time: Test end time must be after start time.");
    }

    // Conflict detection
    const conflicts = validateSchedulingConflicts({
      examDate: data.exam_date,
      startTime: data.start_time,
      endTime: data.end_time,
      assignedLabIds: data.assigned_lab_ids || [],
      assignedRoomIds: data.assigned_room_ids || [],
    });

    if (conflicts.length > 0) {
      throw new Error(conflicts.join(" "));
    }

    const eligibleCount = Number(data.total_eligible) || 120;
    const registeredCount = Number(data.registered_count) || eligibleCount;
    const expectedWriting = Number(data.expected_writing) || registeredCount;
    const duration = endMin - startMin;

    const newTest: ScheduledTest = {
      id: `test-${Date.now()}`,
      name: data.name,
      subject_code: data.subject_code,
      subject_name: data.subject_name || data.name,
      exam_type: data.exam_type || "internal",
      department: data.department || "Computer Science",
      course: data.course || `B.Tech in ${data.department || "Computer Science"}`,
      batch: data.batch || "2024-2028",
      section: data.section || "A, B",
      exam_date: data.exam_date,
      start_time: data.start_time,
      end_time: data.end_time,
      duration_minutes: duration > 0 ? duration : (Number(data.duration_minutes) || 90),
      mode: data.mode || "online",
      total_eligible: eligibleCount,
      registered_count: registeredCount,
      expected_writing: expectedWriting,
      actual_writing: 0,
      absent_count: 0,
      completed_count: 0,
      live_attempting_count: 0,
      status: "scheduled",
      assigned_lab_ids: data.assigned_lab_ids || [],
      assigned_room_ids: data.assigned_room_ids || [],
      lab_capacity_used: (data.assigned_lab_ids || []).length * 40,
      classroom_capacity_used: (data.assigned_room_ids || []).length * 30,
      special_instructions: data.special_instructions || "Standard institutional exam cell regulations apply.",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    stateScheduledTests.unshift(newTest);

    // Auto-generate notification
    stateTestNotifications.unshift({
      id: `notif-${Date.now()}`,
      test_id: newTest.id,
      title: `New Test Scheduled: ${newTest.name}`,
      message: `Examination ${newTest.subject_code} (${newTest.name}) has been scheduled for ${newTest.exam_date} (${newTest.start_time} - ${newTest.end_time}). Mode: ${newTest.mode.toUpperCase()}.`,
      category: "schedule",
      target_audience: "all",
      created_at: new Date().toISOString(),
      read: false,
    });

    return { success: true, test: newTest };
  });

/**
 * 4. UPDATE OR RESCHEDULE TEST
 */
export const rescheduleScheduledTest = createServerFn()
  .validator((d: { testId: string; examDate: string; startTime: string; endTime: string; reason?: string }) => d)
  .handler(async ({ data }) => {
    const test = stateScheduledTests.find((t) => t.id === data.testId);
    if (!test) throw new Error("Test not found");

    const startMin = parseTimeToMinutes(data.startTime);
    const endMin = parseTimeToMinutes(data.endTime);
    if (endMin <= startMin) {
      throw new Error("Invalid time: Test end time must be after start time.");
    }

    // Conflict check with other tests
    const conflicts = validateSchedulingConflicts({
      testId: test.id,
      examDate: data.examDate,
      startTime: data.startTime,
      endTime: data.endTime,
      assignedLabIds: test.assigned_lab_ids,
      assignedRoomIds: test.assigned_room_ids,
    });

    if (conflicts.length > 0) {
      throw new Error(conflicts.join(" "));
    }

    const oldDate = test.exam_date;
    const oldTime = `${test.start_time} - ${test.end_time}`;

    test.exam_date = data.examDate;
    test.start_time = data.startTime;
    test.end_time = data.endTime;
    test.duration_minutes = endMin - startMin;
    test.status = "rescheduled";
    test.updated_at = new Date().toISOString();

    // Trigger rescheduling notifications
    stateTestNotifications.unshift({
      id: `notif-${Date.now()}`,
      test_id: test.id,
      title: `Test Rescheduled: ${test.name}`,
      message: `Attention: ${test.name} originally set for ${oldDate} (${oldTime}) is RESCHEDULED to ${data.examDate} (${data.startTime} - ${data.endTime}). Reason: ${data.reason || "Administrative scheduling optimization"}.`,
      category: "reschedule",
      target_audience: "all",
      created_at: new Date().toISOString(),
      read: false,
    });

    return { success: true, test };
  });

/**
 * 5. CANCEL TEST
 */
export const cancelScheduledTest = createServerFn()
  .validator((d: { testId: string; reason?: string }) => d)
  .handler(async ({ data }) => {
    const test = stateScheduledTests.find((t) => t.id === data.testId);
    if (!test) throw new Error("Test not found");

    test.status = "cancelled";
    test.updated_at = new Date().toISOString();

    // Free up lab seats
    stateLabSeatAllocations = stateLabSeatAllocations.filter((a) => a.test_id !== test.id);

    stateTestNotifications.unshift({
      id: `notif-${Date.now()}`,
      test_id: test.id,
      title: `Cancelled: ${test.name}`,
      message: `The examination "${test.name}" scheduled for ${test.exam_date} has been CANCELLED. All lab/classroom allocations have been released. Reason: ${data.reason || "Exam Cell Directive"}.`,
      category: "cancellation",
      target_audience: "all",
      created_at: new Date().toISOString(),
      read: false,
    });

    return { success: true };
  });

/**
 * 6. LIST COMPUTER LABS WITH REALTIME OCCUPANCY
 */
export const listComputerLabs = createServerFn().handler(async () => {
  return stateComputerLabs.map((lab) => {
    // Current live assignments
    const activeAllocs = stateLabSeatAllocations.filter((a) => a.lab_id === lab.id);
    const assignedCount = activeAllocs.length;
    const availableSeats = Math.max(0, lab.total_capacity - assignedCount);

    return {
      ...lab,
      currently_assigned_students: assignedCount,
      available_seats: availableSeats,
      status: assignedCount >= lab.total_capacity ? "Full" : "Available",
    };
  });
});

/**
 * 7. 1-CLICK AUTOMATIC LAB ALLOCATION
 * Prevents:
 * - Assigning more students than lab capacity
 * - Duplicate student assignments
 * - Multiple labs for same student
 */
export const autoAllocateStudentsToLabs = createServerFn()
  .validator((d: { testId: string; labIds: string[] }) => d)
  .handler(async ({ data }) => {
    const test = stateScheduledTests.find((t) => t.id === data.testId);
    if (!test) throw new Error("Test not found");

    const labs = stateComputerLabs.filter((l) => data.labIds.includes(l.id) && l.active);
    if (labs.length === 0) {
      throw new Error("No valid, active computer labs selected for allocation.");
    }

    const totalLabCapacity = labs.reduce((sum, l) => sum + l.total_capacity, 0);
    if (totalLabCapacity < test.expected_writing) {
      const shortage = test.expected_writing - totalLabCapacity;
      const additionalLabsNeeded = Math.ceil(shortage / 40);
      throw new Error(
        `Insufficient Lab Capacity! ${test.expected_writing} students are writing, but the ${labs.length} selected lab(s) only have ${totalLabCapacity} seats. Shortage: ${shortage} seats (${additionalLabsNeeded} more lab(s) required).`
      );
    }

    // Clear existing allocations for this test
    stateLabSeatAllocations = stateLabSeatAllocations.filter((a) => a.test_id !== test.id);

    // Pick candidate students (matching department or sequential pool)
    const eligibleStudents = stateStudentsPool
      .filter((s) => s.active)
      .slice(0, test.expected_writing);

    const newAllocations: StudentLabSeat[] = [];
    let studentCursor = 0;

    for (const lab of labs) {
      const countForThisLab = Math.min(lab.total_capacity, test.expected_writing - studentCursor);
      for (let i = 0; i < countForThisLab; i++) {
        const student = eligibleStudents[studentCursor];
        if (!student) break;

        const seatNo = `PC-${String(i + 1).padStart(2, "0")}`;
        newAllocations.push({
          id: `seat-${test.id}-${lab.id}-${i + 1}`,
          test_id: test.id,
          student_id: student.id,
          student_name: student.full_name,
          register_no: student.register_no,
          department: student.department,
          section: student.section,
          batch: student.batch,
          lab_id: lab.id,
          lab_name: lab.name,
          seat_no: seatNo,
          status: "allocated",
          allocated_at: new Date().toISOString(),
        });

        studentCursor++;
      }
    }

    stateLabSeatAllocations.push(...newAllocations);
    test.assigned_lab_ids = labs.map((l) => l.id);
    test.lab_capacity_used = newAllocations.length;
    test.updated_at = new Date().toISOString();

    // Trigger allocation notification
    stateTestNotifications.unshift({
      id: `notif-${Date.now()}`,
      test_id: test.id,
      title: `Lab Allotment Completed: ${test.name}`,
      message: `System has successfully allocated ${newAllocations.length} students across ${labs.length} computer labs (${labs.map((l) => l.name.split("—")[0].trim()).join(", ")}). Systems assigned PC-01 onward.`,
      category: "lab_change",
      target_audience: "all",
      created_at: new Date().toISOString(),
      read: false,
    });

    return {
      success: true,
      allocated_count: newAllocations.length,
      labs_used: labs.length,
      allocations: newAllocations,
    };
  });

/**
 * 8. MANUAL REALLOCATE STUDENT TO A DIFFERENT LAB / SEAT
 */
export const reallocateStudentSeat = createServerFn()
  .validator((d: { allocationId: string; targetLabId: string; targetSeatNo?: string }) => d)
  .handler(async ({ data }) => {
    const alloc = stateLabSeatAllocations.find((a) => a.id === data.allocationId);
    if (!alloc) throw new Error("Seat allocation record not found.");

    const targetLab = stateComputerLabs.find((l) => l.id === data.targetLabId);
    if (!targetLab) throw new Error("Target computer lab not found.");

    // Check target lab current capacity
    const targetLabAllocs = stateLabSeatAllocations.filter(
      (a) => a.test_id === alloc.test_id && a.lab_id === targetLab.id && a.id !== alloc.id
    );

    if (targetLabAllocs.length >= targetLab.total_capacity) {
      throw new Error(`Cannot reallocate: ${targetLab.name} is already at full capacity (${targetLab.total_capacity}/${targetLab.total_capacity}).`);
    }

    // Determine target seat number
    let assignedSeat = data.targetSeatNo;
    if (!assignedSeat) {
      const usedSeats = new Set(targetLabAllocs.map((a) => a.seat_no));
      for (let s = 1; s <= targetLab.total_capacity; s++) {
        const candidate = `PC-${String(s).padStart(2, "0")}`;
        if (!usedSeats.has(candidate)) {
          assignedSeat = candidate;
          break;
        }
      }
    }

    // Check if target seat is taken
    const seatConflict = targetLabAllocs.find((a) => a.seat_no === assignedSeat);
    if (seatConflict) {
      throw new Error(`Seat conflict: ${assignedSeat} in ${targetLab.name} is already assigned to ${seatConflict.student_name}.`);
    }

    alloc.lab_id = targetLab.id;
    alloc.lab_name = targetLab.name;
    alloc.seat_no = assignedSeat || `PC-01`;
    alloc.allocated_at = new Date().toISOString();

    return { success: true, allocation: alloc };
  });

/**
 * 9. GET STUDENT STRENGTH SUMMARY & MATRIX
 */
export const getStudentStrengthSummary = createServerFn().handler(async () => {
  const total = stateDepartmentStrength.reduce((sum, d) => sum + d.total_students, 0);
  const eligible = stateDepartmentStrength.reduce((sum, d) => sum + d.eligible_students, 0);
  const registered = stateDepartmentStrength.reduce((sum, d) => sum + d.registered_students, 0);
  const writingCount = stateDepartmentStrength.reduce((sum, d) => sum + d.writing_students, 0);
  const absentCount = stateDepartmentStrength.reduce((sum, d) => sum + d.absent_students, 0);
  const completedCount = stateDepartmentStrength.reduce((sum, d) => sum + d.completed_students, 0);
  const notAttempted = stateDepartmentStrength.reduce((sum, d) => sum + d.not_attempted, 0);

  return {
    overview: {
      total_students: total,
      active_enrolled: total,
      eligible_students: eligible,
      registered_students: registered,
      writing_students: writingCount,
      absent_students: absentCount,
      completed_students: completedCount,
      not_yet_attempted: notAttempted,
    },
    departments: stateDepartmentStrength,
  };
});

/**
 * 9B. MANUALLY UPDATE STUDENT STRENGTH MATRIX
 */
export const updateStudentStrengthMatrix = createServerFn({ method: "POST" })
  .validator((d: { department: string; updates: Partial<DepartmentStrength> }) => d)
  .handler(async ({ data }) => {
    const idx = stateDepartmentStrength.findIndex(
      (d) => d.department.toLowerCase() === data.department.toLowerCase()
    );
    if (idx !== -1) {
      stateDepartmentStrength[idx] = {
        ...stateDepartmentStrength[idx],
        ...data.updates,
        total_students:
          data.updates.total_students !== undefined
            ? Number(data.updates.total_students)
            : stateDepartmentStrength[idx].total_students,
        eligible_students:
          data.updates.eligible_students !== undefined
            ? Number(data.updates.eligible_students)
            : stateDepartmentStrength[idx].eligible_students,
        registered_students:
          data.updates.registered_students !== undefined
            ? Number(data.updates.registered_students)
            : stateDepartmentStrength[idx].registered_students,
        writing_students:
          data.updates.writing_students !== undefined
            ? Number(data.updates.writing_students)
            : stateDepartmentStrength[idx].writing_students,
        absent_students:
          data.updates.absent_students !== undefined
            ? Number(data.updates.absent_students)
            : stateDepartmentStrength[idx].absent_students,
        completed_students:
          data.updates.completed_students !== undefined
            ? Number(data.updates.completed_students)
            : stateDepartmentStrength[idx].completed_students,
        not_attempted:
          data.updates.not_attempted !== undefined
            ? Number(data.updates.not_attempted)
            : stateDepartmentStrength[idx].not_attempted,
        sections: data.updates.sections || stateDepartmentStrength[idx].sections,
      };
      return { success: true, department: stateDepartmentStrength[idx] };
    }
    throw new Error(`Department "${data.department}" not found in strength matrix.`);
  });

/**
 * 9C. CREATE NEW DEPARTMENT RECORD IN STRENGTH MATRIX
 */
export const createDepartmentStrengthRecord = createServerFn({ method: "POST" })
  .validator((d: {
    department: string;
    total_students: number;
    eligible_students?: number;
    registered_students?: number;
    writing_students?: number;
    absent_students?: number;
    completed_students?: number;
    not_attempted?: number;
    sections?: SectionStrength[];
  }) => d)
  .handler(async ({ data }) => {
    const existing = stateDepartmentStrength.find(
      (d) => d.department.toLowerCase() === data.department.toLowerCase()
    );
    if (existing) {
      throw new Error(`Department "${data.department}" already exists in matrix.`);
    }
    const total = Number(data.total_students) || 60;
    const eligible = data.eligible_students !== undefined ? Number(data.eligible_students) : total;
    const registered = data.registered_students !== undefined ? Number(data.registered_students) : eligible;
    const writing = data.writing_students !== undefined ? Number(data.writing_students) : 0;
    const absent = data.absent_students !== undefined ? Number(data.absent_students) : 0;
    const completed = data.completed_students !== undefined ? Number(data.completed_students) : 0;
    const pending =
      data.not_attempted !== undefined
        ? Number(data.not_attempted)
        : Math.max(0, registered - writing - completed - absent);

    const newRecord: DepartmentStrength = {
      department: data.department,
      total_students: total,
      eligible_students: eligible,
      registered_students: registered,
      writing_students: writing,
      absent_students: absent,
      completed_students: completed,
      not_attempted: pending,
      sections:
        data.sections && data.sections.length > 0
          ? data.sections
          : [
              { section: "A", total: Math.floor(total / 2), eligible: Math.floor(eligible / 2), registered: Math.floor(registered / 2) },
              { section: "B", total: Math.ceil(total / 2), eligible: Math.ceil(eligible / 2), registered: Math.ceil(registered / 2) },
            ],
    };
    stateDepartmentStrength.push(newRecord);
    return { success: true, department: newRecord };
  });

/**
 * 10. GET EXAMINATION DASHBOARD METRICS
 */
export const getExaminationDashboardMetrics = createServerFn().handler(async () => {
  const tests = stateScheduledTests;
  const labs = stateComputerLabs;
  const rooms = stateClassrooms;

  const totalStudents = stateStudentsPool.length;
  const upcomingTests = tests.filter((t) => t.status === "upcoming" || t.status === "scheduled").length;
  const testsToday = tests.filter((t) => t.exam_date === todayIso && t.status !== "cancelled").length;
  const writingToday = tests
    .filter((t) => t.exam_date === todayIso && t.status !== "cancelled")
    .reduce((sum, t) => sum + (t.status === "in_progress" ? t.actual_writing : t.expected_writing), 0);

  const completedTests = tests.filter((t) => t.status === "completed").length;

  // Infrastructure available
  const availableLabs = labs.filter((l) => l.active).length;
  const availableClassrooms = rooms.filter((r) => r.active).length;

  // Today's total requirements
  const todayOnlineWriting = tests
    .filter((t) => t.exam_date === todayIso && t.mode === "online" && t.status !== "cancelled")
    .reduce((sum, t) => sum + t.expected_writing, 0);

  const todayOfflineWriting = tests
    .filter((t) => t.exam_date === todayIso && t.mode === "offline" && t.status !== "cancelled")
    .reduce((sum, t) => sum + t.expected_writing, 0);

  const labsRequired = Math.ceil(todayOnlineWriting / 40);
  const classroomsRequired = Math.ceil(todayOfflineWriting / 30);

  const labCapacityShortage = Math.max(0, labsRequired - availableLabs);
  const classroomCapacityShortage = Math.max(0, classroomsRequired - availableClassrooms);

  return {
    totalStudents,
    upcomingTests,
    testsToday,
    studentsWritingToday: writingToday,
    labsRequired,
    labsAvailable: availableLabs,
    additionalLabsRequired: labCapacityShortage,
    classroomsRequired,
    classroomsAvailable: availableClassrooms,
    additionalClassroomsRequired: classroomCapacityShortage,
    capacityShortage: labCapacityShortage + classroomCapacityShortage,
    completedTests,
  };
});

/**
 * 11. GET EXAMINATION CALENDAR SCHEDULE
 */
export const getExaminationCalendarEvents = createServerFn().handler(async () => {
  return stateScheduledTests.map((t) => {
    const assignedLabs = stateComputerLabs.filter((l) => t.assigned_lab_ids.includes(l.id));
    const assignedRooms = stateClassrooms.filter((r) => t.assigned_room_ids.includes(r.id));
    const reqs = calculateInfrastructureRequirements({
      studentsWriting: t.expected_writing,
      labCapacity: 40,
      classroomCapacity: 30,
    });

    return {
      id: t.id,
      title: `${t.subject_code} — ${t.name}`,
      date: t.exam_date,
      start_time: t.start_time,
      end_time: t.end_time,
      mode: t.mode,
      exam_type: t.exam_type,
      status: t.status,
      department: t.department,
      expected_writing: t.expected_writing,
      assigned_labs: assignedLabs.map((l) => l.name),
      assigned_rooms: assignedRooms.map((r) => r.room_number),
      labs_required: reqs.labsRequired,
      classrooms_required: reqs.classroomsRequired,
    };
  });
});

/**
 * 12. GET DETAILED INSTITUTIONAL REPORTS DATA
 */
export const getExaminationReportsData = createServerFn()
  .validator((d: { reportType: string }) => d)
  .handler(async ({ data }) => {
    switch (data.reportType) {
      case "student_strength": {
        return stateDepartmentStrength.map((dept) => {
          return {
            department: dept.department,
            course: `B.Tech in ${dept.department}`,
            total_strength: dept.total_students,
            eligible_students: dept.eligible_students,
            registered_students: dept.registered_students,
            present_writing: dept.writing_students,
            absentees: dept.absent_students,
            completed_students: dept.completed_students,
            pending_not_attempted: dept.not_attempted,
            sections_breakdown: dept.sections.map((s) => `Sec ${s.section}: ${s.total} (Eligible ${s.eligible}, Reg ${s.registered})`).join(" | "),
          };
        });
      }

      case "lab_requirements": {
        const availableLabs = stateComputerLabs.filter((l) => l.active).length;
        return stateScheduledTests
          .filter((t) => t.mode === "online" && t.status !== "cancelled")
          .map((test) => {
            const reqs = calculateInfrastructureRequirements({
              studentsWriting: test.expected_writing,
              labCapacity: 40,
              availableLabsCount: availableLabs,
            });

            return {
              test_id: test.id,
              test_name: test.name,
              subject_code: test.subject_code,
              exam_date: test.exam_date,
              start_time: test.start_time,
              students_writing: test.expected_writing,
              lab_capacity: 40,
              labs_required: reqs.labsRequired,
              labs_available: availableLabs,
              shortage: reqs.additionalLabsRequired,
              status: reqs.hasLabShortage ? "DEFICIT" : "ADEQUATE",
            };
          });
      }

      case "classroom_requirements": {
        const availableRooms = stateClassrooms.filter((r) => r.active).length;
        return stateScheduledTests
          .filter((t) => t.mode === "offline" && t.status !== "cancelled")
          .map((test) => {
            const reqs = calculateInfrastructureRequirements({
              studentsWriting: test.expected_writing,
              classroomCapacity: 30,
              availableClassroomsCount: availableRooms,
            });

            return {
              test_id: test.id,
              test_name: test.name,
              subject_code: test.subject_code,
              exam_date: test.exam_date,
              start_time: test.start_time,
              student_count: test.expected_writing,
              classroom_capacity: 30,
              classrooms_required: reqs.classroomsRequired,
              classrooms_available: availableRooms,
              shortage: reqs.additionalClassroomsRequired,
              status: reqs.hasRoomShortage ? "DEFICIT" : "ADEQUATE",
            };
          });
      }

      case "lab_allocation": {
        return stateLabSeatAllocations.map((alloc) => {
          const test = stateScheduledTests.find((t) => t.id === alloc.test_id);
          return {
            student_name: alloc.student_name,
            register_no: alloc.register_no,
            department: alloc.department,
            section: alloc.section,
            batch: alloc.batch,
            test_name: test?.name || alloc.test_id,
            subject_code: test?.subject_code || "N/A",
            lab_name: alloc.lab_name,
            seat_pc: alloc.seat_no,
            attendance_status: alloc.status.toUpperCase(),
          };
        });
      }

      case "exam_schedule": {
        return stateScheduledTests.map((test) => {
          const labs = stateComputerLabs.filter((l) => test.assigned_lab_ids.includes(l.id));
          const rooms = stateClassrooms.filter((r) => test.assigned_room_ids.includes(r.id));
          return {
            test_name: test.name,
            subject_code: test.subject_code,
            department: test.department,
            exam_date: test.exam_date,
            time: `${test.start_time} - ${test.end_time}`,
            duration: `${test.duration_minutes} mins`,
            mode: test.mode.toUpperCase(),
            assigned_venues:
              test.mode === "online"
                ? labs.map((l) => l.name.split("—")[0].trim()).join(", ") || "Unassigned"
                : rooms.map((r) => r.room_number).join(", ") || "Unassigned",
            student_count: test.expected_writing,
            status: test.status.toUpperCase(),
          };
        });
      }

      default:
        return [];
    }
  });

/**
 * 13. LIST & BROADCAST TEST NOTIFICATIONS
 */
export const listTestNotifications = createServerFn().handler(async () => {
  return stateTestNotifications;
});

export const broadcastTestNotice = createServerFn()
  .validator((d: { title: string; message: string; category?: string; target_audience?: string }) => d)
  .handler(async ({ data }) => {
    if (!data.title || !data.message) {
      throw new Error("Title and message are required for notification.");
    }

    const newNotif: TestNotification = {
      id: `notif-${Date.now()}`,
      title: data.title,
      message: data.message,
      category: (data.category as any) || "reminder",
      target_audience: (data.target_audience as any) || "all",
      created_at: new Date().toISOString(),
      read: false,
    };

    stateTestNotifications.unshift(newNotif);
    return { success: true, notification: newNotif };
  });

/**
 * 14. CREATE COMPUTER LAB (MANUAL ADD)
 */
export const createComputerLab = createServerFn({ method: "POST" })
  .validator((d: {
    name: string;
    code: string;
    block: string;
    floor: number;
    total_capacity: number;
    active_systems?: number;
    operating_system?: string;
    has_internet?: boolean;
    has_webcam?: boolean;
    has_ups_backup?: boolean;
    lab_incharge?: string;
    contact_phone?: string;
  }) => d)
  .handler(async ({ data }) => {
    const labId = `lab-${Date.now()}`;
    const newLab: ComputerLab = {
      id: labId,
      name: data.name,
      code: data.code,
      block: data.block || "Block A",
      floor: Number(data.floor) || 1,
      total_capacity: Number(data.total_capacity) || 40,
      active_systems:
        data.active_systems !== undefined
          ? Number(data.active_systems)
          : Number(data.total_capacity) || 40,
      in_repair_systems: 0,
      operating_system: data.operating_system || "Ubuntu Linux 24.04 / Windows 11",
      has_internet: data.has_internet !== undefined ? Boolean(data.has_internet) : true,
      has_webcam: data.has_webcam !== undefined ? Boolean(data.has_webcam) : true,
      has_ups_backup: data.has_ups_backup !== undefined ? Boolean(data.has_ups_backup) : true,
      active: true,
      lab_incharge: data.lab_incharge || "Lab Technical Staff",
      contact_phone: data.contact_phone || "+91 98450 00000",
    };
    stateComputerLabs.push(newLab);
    return { success: true, lab: newLab };
  });

/**
 * 15. UPDATE COMPUTER LAB
 */
export const updateComputerLab = createServerFn({ method: "POST" })
  .validator((d: {
    id: string;
    name?: string;
    code?: string;
    block?: string;
    floor?: number;
    total_capacity?: number;
    active_systems?: number;
    operating_system?: string;
    has_internet?: boolean;
    has_webcam?: boolean;
    has_ups_backup?: boolean;
    active?: boolean;
    lab_incharge?: string;
    contact_phone?: string;
  }) => d)
  .handler(async ({ data }) => {
    const lab = stateComputerLabs.find((l) => l.id === data.id);
    if (!lab) throw new Error("Computer lab not found");
    if (data.name) lab.name = data.name;
    if (data.code) lab.code = data.code;
    if (data.block) lab.block = data.block;
    if (data.floor !== undefined) lab.floor = Number(data.floor);
    if (data.total_capacity !== undefined) lab.total_capacity = Number(data.total_capacity);
    if (data.active_systems !== undefined) lab.active_systems = Number(data.active_systems);
    if (data.operating_system) lab.operating_system = data.operating_system;
    if (data.has_internet !== undefined) lab.has_internet = Boolean(data.has_internet);
    if (data.has_webcam !== undefined) lab.has_webcam = Boolean(data.has_webcam);
    if (data.has_ups_backup !== undefined) lab.has_ups_backup = Boolean(data.has_ups_backup);
    if (data.active !== undefined) lab.active = Boolean(data.active);
    if (data.lab_incharge) lab.lab_incharge = data.lab_incharge;
    if (data.contact_phone) lab.contact_phone = data.contact_phone;
    return { success: true, lab };
  });

/**
 * 16. ADD MANUAL LAB ALLOCATION (MANUAL STUDENT ALLOCATION)
 */
export const addManualLabAllocation = createServerFn({ method: "POST" })
  .validator((d: {
    test_id: string;
    student_name: string;
    register_no: string;
    department?: string;
    section?: string;
    batch?: string;
    lab_id: string;
    seat_no?: string;
    status?: "allocated" | "present" | "writing" | "completed" | "absent";
  }) => d)
  .handler(async ({ data }) => {
    const test = stateScheduledTests.find((t) => t.id === data.test_id);
    if (!test) throw new Error("Examination not found");

    const lab = stateComputerLabs.find((l) => l.id === data.lab_id);
    if (!lab) throw new Error("Computer lab not found");

    let seatNo = data.seat_no?.trim();
    const existingLabAllocs = stateLabSeatAllocations.filter(
      (a) => a.test_id === test.id && a.lab_id === lab.id
    );

    if (!seatNo) {
      const usedSeats = new Set(existingLabAllocs.map((a) => a.seat_no));
      for (let i = 1; i <= lab.total_capacity; i++) {
        const candidate = `PC-${String(i).padStart(2, "0")}`;
        if (!usedSeats.has(candidate)) {
          seatNo = candidate;
          break;
        }
      }
      if (!seatNo) {
        seatNo = `PC-${String(existingLabAllocs.length + 1).padStart(2, "0")}`;
      }
    }

    const newAlloc: StudentLabSeat = {
      id: `seat-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      test_id: test.id,
      student_id: `stu-${Date.now()}`,
      student_name: data.student_name,
      register_no: data.register_no,
      department: data.department || test.department || "Computer Science",
      section: data.section || "A",
      batch: data.batch || "2024-2028",
      lab_id: lab.id,
      lab_name: lab.name,
      seat_no: seatNo,
      status: data.status || "allocated",
      allocated_at: new Date().toISOString(),
    };

    stateLabSeatAllocations.unshift(newAlloc);

    if (!test.assigned_lab_ids.includes(lab.id)) {
      test.assigned_lab_ids.push(lab.id);
    }
    test.lab_capacity_used = stateLabSeatAllocations.filter((a) => a.test_id === test.id).length;
    test.updated_at = new Date().toISOString();

    return { success: true, allocation: newAlloc };
  });

/**
 * 17. UPDATE LAB ALLOCATION (EDIT STUDENT SEAT OR ATTENDANCE)
 */
export const updateLabAllocation = createServerFn({ method: "POST" })
  .validator((d: {
    allocationId: string;
    student_name?: string;
    register_no?: string;
    department?: string;
    section?: string;
    lab_id?: string;
    seat_no?: string;
    status?: "allocated" | "present" | "writing" | "completed" | "absent";
  }) => d)
  .handler(async ({ data }) => {
    const alloc = stateLabSeatAllocations.find((a) => a.id === data.allocationId);
    if (!alloc) throw new Error("Seat allocation record not found");

    if (data.student_name) alloc.student_name = data.student_name;
    if (data.register_no) alloc.register_no = data.register_no;
    if (data.department) alloc.department = data.department;
    if (data.section) alloc.section = data.section;
    if (data.seat_no) alloc.seat_no = data.seat_no;
    if (data.status) alloc.status = data.status;

    if (data.lab_id && data.lab_id !== alloc.lab_id) {
      const targetLab = stateComputerLabs.find((l) => l.id === data.lab_id);
      if (targetLab) {
        alloc.lab_id = targetLab.id;
        alloc.lab_name = targetLab.name;
      }
    }

    return { success: true, allocation: alloc };
  });

/**
 * 18. DELETE LAB ALLOCATION (MANUAL REMOVE)
 */
export const deleteLabAllocation = createServerFn({ method: "POST" })
  .validator((d: { allocationId: string }) => d)
  .handler(async ({ data }) => {
    const allocIndex = stateLabSeatAllocations.findIndex((a) => a.id === data.allocationId);
    if (allocIndex === -1) throw new Error("Allocation not found");
    const [removed] = stateLabSeatAllocations.splice(allocIndex, 1);
    return { success: true, removedId: removed.id };
  });

/**
 * 19. UPDATE SCHEDULED TEST (EDIT SUBJECT TIMETABLE)
 */
export const updateScheduledTest = createServerFn({ method: "POST" })
  .validator((d: {
    testId: string;
    name?: string;
    subject_code?: string;
    subject_name?: string;
    exam_type?: any;
    department?: string;
    course?: string;
    batch?: string;
    section?: string;
    exam_date?: string;
    start_time?: string;
    end_time?: string;
    mode?: any;
    total_eligible?: number;
    expected_writing?: number;
    status?: any;
    assigned_lab_ids?: string[];
    assigned_room_ids?: string[];
    special_instructions?: string;
    broadcast_notice?: boolean;
  }) => d)
  .handler(async ({ data }) => {
    const test = stateScheduledTests.find((t) => t.id === data.testId);
    if (!test) throw new Error("Examination not found");

    if (data.name) test.name = data.name;
    if (data.subject_code) test.subject_code = data.subject_code;
    if (data.subject_name) test.subject_name = data.subject_name;
    if (data.exam_type) test.exam_type = data.exam_type;
    if (data.department) test.department = data.department;
    if (data.course) test.course = data.course;
    if (data.batch) test.batch = data.batch;
    if (data.section) test.section = data.section;
    if (data.exam_date) test.exam_date = data.exam_date;
    if (data.start_time) test.start_time = data.start_time;
    if (data.end_time) test.end_time = data.end_time;
    if (data.mode) test.mode = data.mode;
    if (data.total_eligible !== undefined) test.total_eligible = Number(data.total_eligible);
    if (data.expected_writing !== undefined) test.expected_writing = Number(data.expected_writing);
    if (data.status) test.status = data.status;
    if (data.assigned_lab_ids) test.assigned_lab_ids = data.assigned_lab_ids;
    if (data.assigned_room_ids) test.assigned_room_ids = data.assigned_room_ids;
    if (data.special_instructions) test.special_instructions = data.special_instructions;
    test.updated_at = new Date().toISOString();

    if (data.broadcast_notice) {
      const assignedLabNames = stateComputerLabs
        .filter((l) => test.assigned_lab_ids.includes(l.id))
        .map((l) => l.name.split("—")[0].trim())
        .join(", ");
      stateTestNotifications.unshift({
        id: `notif-${Date.now()}`,
        test_id: test.id,
        title: `Exam Timetable Update: ${test.subject_code} - ${test.name}`,
        message: `Official Timetable Notice: ${test.subject_code} (${test.subject_name || test.name}) is scheduled on ${test.exam_date} from ${test.start_time} to ${test.end_time}. Mode: ${test.mode.toUpperCase()}. Assigned Venues: ${assignedLabNames || "Designated Exam Centres"}.`,
        category: "schedule",
        target_audience: "all",
        created_at: new Date().toISOString(),
        read: false,
      });
    }

    return { success: true, test };
  });

/**
 * 20. BROADCAST TIMETABLE NOTIFICATION FOR SUBJECTS
 */
export const broadcastTimetableNotification = createServerFn({ method: "POST" })
  .validator((d: { testId?: string; customTitle?: string; customMessage?: string }) => d)
  .handler(async ({ data }) => {
    let title = data.customTitle;
    let message = data.customMessage;

    if (data.testId) {
      const test = stateScheduledTests.find((t) => t.id === data.testId);
      if (test) {
        const labs = stateComputerLabs
          .filter((l) => test.assigned_lab_ids.includes(l.id))
          .map((l) => l.name.split("—")[0].trim())
          .join(", ");
        title = title || `Official Timetable: ${test.subject_code} (${test.name})`;
        message =
          message ||
          `Notice for ${test.department}: Examination for ${test.subject_code} - ${test.name} is scheduled for ${test.exam_date} (${test.start_time} - ${test.end_time}) in ${labs || "Designated Centres"}. All registered candidates must report 15 mins prior.`;
      }
    }

    if (!title || !message) {
      title = "Official Examination Timetable Published";
      message =
        "The comprehensive subject-wise examination schedule and computer lab allotment calendar has been released. Check your respective department schedule.";
    }

    const newNotif: TestNotification = {
      id: `notif-${Date.now()}`,
      test_id: data.testId,
      title,
      message,
      category: "schedule",
      target_audience: "all",
      created_at: new Date().toISOString(),
      read: false,
    };

    stateTestNotifications.unshift(newNotif);
    return { success: true, notification: newNotif };
  });

/**
 * 21. OFFICIAL REPORT NOTES & AUDIT OBSERVATIONS
 */
export const listOfficialReportNotes = createServerFn().handler(async () => {
  return stateOfficialReportNotes;
});

export const addCustomReportNote = createServerFn({ method: "POST" })
  .validator((d: { report_type: string; note: string; author?: string }) => d)
  .handler(async ({ data }) => {
    const newNote: OfficialReportNote = {
      id: `note-${Date.now()}`,
      report_type: data.report_type,
      note: data.note,
      author: data.author || "Exam Cell Controller",
      created_at: new Date().toISOString(),
    };
    stateOfficialReportNotes.unshift(newNote);
    return { success: true, note: newNote };
  });
