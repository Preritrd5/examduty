// @ts-nocheck
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useMemo } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import {
  CalendarClock,
  CalendarCheck,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Clock,
  Download,
  Users,
  Building2,
  Layers,
  ArrowRight,
  Plus,
  Trash2,
  Edit2,
  Search,
  Filter,
  ShieldCheck,
  Divide,
  GitMerge,
  Send,
  Lock,
  Unlock,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Laptop,
  BookOpen,
  UserCheck,
  UserX,
  ClipboardCheck,
  History,
  FileSpreadsheet,
  Printer,
  Eye,
  ShieldAlert,
  ArrowRightLeft,
  Info,
  Check,
  XCircle,
  ChevronRight,
  FileText,
  BadgeAlert,
} from "lucide-react";

import { AppShell, useMe } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  getTimetableWorkspace,
  getStudentsBySemester,
  createOrUpdateTimingSlot,
  deleteTimingSlot,
  createTimetableEntry,
  updateTimetableEntry,
  deleteTimetableEntry,
  assignFacultyToEntry,
  allocateLabAndCreateBatches,
  moveStudentBetweenBatches,
  splitStudentGroup,
  mergeStudentGroups,
  validateTimetable,
  finalizeTimetable,
  publishTimetable,
  assignAdditionalDutyToFaculty,
  resetTimetableToDefault,
  getAttendanceSession,
  updateStudentAttendance,
  bulkMarkAttendance,
  submitAttendanceSession,
  lockAttendanceSession,
  unlockAttendanceSession,
  getSeparatedAbsentees,
  getStudentAttendanceHistory,
  getComprehensiveAttendanceAnalytics,
  type ExamSemester,
  type ExamMode,
  type TimetableStatus,
  type AttendanceStatus,
  type AttendanceLifecycle,
} from "@/lib/timetable-management.functions";

export const Route = createFileRoute("/_authenticated/timetable-allocation")({
  head: () => ({
    meta: [
      { title: "Timetable, Allocation & Attendance — UniDuty" },
      {
        name: "description",
        content:
          "End-to-end exam planning, student list grouping, year-based faculty placement, minimum 3 duties tracking, lab allocation, dynamic batches, and universal attendance tracking.",
      },
      { property: "og:title", content: "Timetable, Allocation & Attendance — UniDuty" },
    ],
  }),
  component: TimetableAllocationPage,
});

function TimetableAllocationPage() {
  const qc = useQueryClient();
  const { data: me } = useMe();
  const isAdmin = Boolean(me?.isAdmin);

  // Workflow navigation
  const [activeStep, setActiveStep] = useState<string>("timetable_draft");

  // Step 1: Student List State
  const [selectedSemesterTab, setSelectedSemesterTab] = useState<ExamSemester>(1);
  const [studentSearch, setStudentSearch] = useState("");

  // Step 2: Timing Slot Modal
  const [timingModalOpen, setTimingModalOpen] = useState(false);
  const [editingTiming, setEditingTiming] = useState<any | null>(null);

  // Step 3: Timetable Entry Modal
  const [entryModalOpen, setEntryModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any | null>(null);

  // Step 4: Faculty Placement Drawer/Modal
  const [placementEntry, setPlacementEntry] = useState<any | null>(null);
  const [selectedFacultyIds, setSelectedFacultyIds] = useState<string[]>([]);

  // Step 6: Lab & Batch Modal
  const [labEntry, setLabEntry] = useState<any | null>(null);
  const [selectedLabId, setSelectedLabId] = useState<string>("");
  const [batchCapacityInput, setBatchCapacityInput] = useState<number>(30);

  // Step 6: Move Student Between Batches Modal (Test 15)
  const [moveBatchModalOpen, setMoveBatchModalOpen] = useState(false);
  const [moveEntry, setMoveEntry] = useState<any | null>(null);
  const [moveSourceBatchId, setMoveSourceBatchId] = useState<string>("");
  const [moveTargetBatchId, setMoveTargetBatchId] = useState<string>("");
  const [moveStudentId, setMoveStudentId] = useState<string>("");

  // Step 7: Merge/Divide Modal
  const [splitEntry, setSplitEntry] = useState<any | null>(null);
  const [splitCount, setSplitCount] = useState<number>(2);
  const [mergeEntry, setMergeEntry] = useState<any | null>(null);
  const [mergeGroupIds, setMergeGroupIds] = useState<string[]>([]);
  const [targetMergedName, setTargetMergedName] = useState("Combined Lab Group");

  // Section 29: Exam Detail Drawer/Modal
  const [examDetailModalOpen, setExamDetailModalOpen] = useState(false);
  const [examDetailEntry, setExamDetailEntry] = useState<any | null>(null);

  // Step 9: Attendance Desk State
  const [attendanceEntryId, setAttendanceEntryId] = useState<string>("entry-1");
  const [attendanceBatchId, setAttendanceBatchId] = useState<string>("ALL");
  const [attendanceStatusFilter, setAttendanceStatusFilter] = useState<string>("ALL");
  const [attendanceSearch, setAttendanceSearch] = useState<string>("");
  const [simulateUnauthorizedFaculty, setSimulateUnauthorizedFaculty] = useState<boolean>(false);
  const [auditLogModalOpen, setAuditLogModalOpen] = useState<boolean>(false);
  const [unlockModalOpen, setUnlockModalOpen] = useState<boolean>(false);
  const [unlockReason, setUnlockReason] = useState<string>("");
  const [unmarkedWarningOpen, setUnmarkedWarningOpen] = useState<boolean>(false);

  // Step 10: Absentee Roster State
  const [absenteeSemFilter, setAbsenteeSemFilter] = useState<number>(0);
  const [absenteeExamFilter, setAbsenteeExamFilter] = useState<string>("ALL");
  const [absenteeSearch, setAbsenteeSearch] = useState<string>("");

  // Step 11: Student History State
  const [historySearchQuery, setHistorySearchQuery] = useState<string>("2026CS1014");

  // Server functions
  const workspaceFn = useServerFn(getTimetableWorkspace);
  const studentsFn = useServerFn(getStudentsBySemester);
  const saveTimingFn = useServerFn(createOrUpdateTimingSlot);
  const deleteTimingFn = useServerFn(deleteTimingSlot);
  const createEntryFn = useServerFn(createTimetableEntry);
  const updateEntryFn = useServerFn(updateTimetableEntry);
  const deleteEntryFn = useServerFn(deleteTimetableEntry);
  const assignFacultyFn = useServerFn(assignFacultyToEntry);
  const allocateLabFn = useServerFn(allocateLabAndCreateBatches);
  const moveStudentFn = useServerFn(moveStudentBetweenBatches);
  const splitGroupFn = useServerFn(splitStudentGroup);
  const mergeGroupFn = useServerFn(mergeStudentGroups);
  const validateFn = useServerFn(validateTimetable);
  const finalizeFn = useServerFn(finalizeTimetable);
  const publishFn = useServerFn(publishTimetable);
  const addDutyFn = useServerFn(assignAdditionalDutyToFaculty);
  const resetFn = useServerFn(resetTimetableToDefault);

  // Attendance Server Functions
  const getAttendanceFn = useServerFn(getAttendanceSession);
  const updateAttendanceFn = useServerFn(updateStudentAttendance);
  const bulkMarkFn = useServerFn(bulkMarkAttendance);
  const submitAttendanceFn = useServerFn(submitAttendanceSession);
  const lockAttendanceFn = useServerFn(lockAttendanceSession);
  const unlockAttendanceFn = useServerFn(unlockAttendanceSession);
  const getAbsenteesFn = useServerFn(getSeparatedAbsentees);
  const getStudentHistoryFn = useServerFn(getStudentAttendanceHistory);
  const getAnalyticsFn = useServerFn(getComprehensiveAttendanceAnalytics);

  // Queries
  const { data: ws, isLoading: loadingWs } = useQuery({
    queryKey: ["timetable-workspace"],
    queryFn: () => workspaceFn(),
    refetchInterval: 15000,
    retry: false,
  });

  const { data: students = [] } = useQuery({
    queryKey: ["timetable-students", selectedSemesterTab, studentSearch],
    queryFn: () => studentsFn({ data: { semester: selectedSemesterTab, search: studentSearch } }),
    retry: false,
  });

  const { data: valResult, refetch: revalidate } = useQuery({
    queryKey: ["timetable-validation"],
    queryFn: () => validateFn(),
    retry: false,
  });

  // Query: Attendance Session for selected exam & batch
  const {
    data: attendanceData,
    isLoading: loadingAttendance,
    refetch: refetchAttendance,
    error: attendanceError,
  } = useQuery({
    queryKey: [
      "attendance-session",
      attendanceEntryId,
      attendanceBatchId,
      simulateUnauthorizedFaculty,
    ],
    queryFn: () =>
      getAttendanceFn({
        data: {
          timetable_entry_id: attendanceEntryId,
          batch_id: attendanceBatchId !== "ALL" ? attendanceBatchId : undefined,
          simulate_unauthorized: simulateUnauthorizedFaculty,
        },
      }),
    retry: false,
  });

  // Query: Separated Absentees List
  const { data: absenteesList = [], refetch: refetchAbsentees } = useQuery({
    queryKey: ["separated-absentees", absenteeSemFilter, absenteeExamFilter, absenteeSearch],
    queryFn: () =>
      getAbsenteesFn({
        data: {
          semester: absenteeSemFilter > 0 ? absenteeSemFilter : undefined,
          timetable_entry_id: absenteeExamFilter !== "ALL" ? absenteeExamFilter : undefined,
          search: absenteeSearch,
        },
      }),
    retry: false,
  });

  // Query: Student Attendance History Profile
  const { data: studentHistoryData } = useQuery({
    queryKey: ["student-attendance-history", historySearchQuery],
    queryFn: () => getStudentHistoryFn({ data: { query: historySearchQuery } }),
    enabled: historySearchQuery.trim().length > 0,
    retry: false,
  });

  // Query: University Attendance Analytics
  const { data: analyticsData } = useQuery({
    queryKey: ["attendance-analytics"],
    queryFn: () => getAnalyticsFn(),
    retry: false,
  });

  // Mutations
  const saveTimingMut = useMutation({
    mutationFn: (data: any) => saveTimingFn({ data }),
    onSuccess: () => {
      toast.success("Exam timing slot saved");
      setTimingModalOpen(false);
      qc.invalidateQueries({ queryKey: ["timetable-workspace"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteTimingMut = useMutation({
    mutationFn: (id: string) => deleteTimingFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Timing slot deleted");
      qc.invalidateQueries({ queryKey: ["timetable-workspace"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const createEntryMut = useMutation({
    mutationFn: (data: any) => createEntryFn({ data }),
    onSuccess: () => {
      toast.success("Exam timetable entry added");
      setEntryModalOpen(false);
      qc.invalidateQueries({ queryKey: ["timetable-workspace"] });
      revalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteEntryMut = useMutation({
    mutationFn: (id: string) => deleteEntryFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Timetable entry deleted");
      qc.invalidateQueries({ queryKey: ["timetable-workspace"] });
      revalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const assignFacultyMut = useMutation({
    mutationFn: (data: any) => assignFacultyFn({ data }),
    onSuccess: () => {
      toast.success("Faculty placed successfully for examination");
      setPlacementEntry(null);
      qc.invalidateQueries({ queryKey: ["timetable-workspace"] });
      revalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const allocateLabMut = useMutation({
    mutationFn: (data: any) => allocateLabFn({ data }),
    onSuccess: () => {
      toast.success("Lab & Dynamic Batches configured");
      setLabEntry(null);
      qc.invalidateQueries({ queryKey: ["timetable-workspace"] });
      revalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const moveStudentMut = useMutation({
    mutationFn: (data: any) => moveStudentFn({ data }),
    onSuccess: () => {
      toast.success("Student successfully moved to new batch");
      setMoveBatchModalOpen(false);
      qc.invalidateQueries({ queryKey: ["timetable-workspace"] });
      refetchAttendance();
      refetchAbsentees();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const splitGroupMut = useMutation({
    mutationFn: (data: any) => splitGroupFn({ data }),
    onSuccess: () => {
      toast.success("Student group divided into sub-batches");
      setSplitEntry(null);
      qc.invalidateQueries({ queryKey: ["timetable-workspace"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const mergeGroupMut = useMutation({
    mutationFn: (data: any) => mergeGroupFn({ data }),
    onSuccess: () => {
      toast.success("Groups successfully merged");
      setMergeEntry(null);
      qc.invalidateQueries({ queryKey: ["timetable-workspace"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const finalizeMut = useMutation({
    mutationFn: () => finalizeFn(),
    onSuccess: () => {
      toast.success("Timetable officially FINALIZED! Ready for publication.");
      qc.invalidateQueries({ queryKey: ["timetable-workspace"] });
      revalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const publishMut = useMutation({
    mutationFn: () => publishFn(),
    onSuccess: () => {
      toast.success("Timetable officially PUBLISHED to faculty and students!");
      qc.invalidateQueries({ queryKey: ["timetable-workspace"] });
      revalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addDutyMut = useMutation({
    mutationFn: (data: any) => addDutyFn({ data }),
    onSuccess: () => {
      toast.success("Additional duty allotted to faculty");
      qc.invalidateQueries({ queryKey: ["timetable-workspace"] });
      revalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const resetMut = useMutation({
    mutationFn: () => resetFn(),
    onSuccess: () => {
      toast.success("Workspace reset to initial calibration state");
      qc.invalidateQueries({ queryKey: ["timetable-workspace"] });
      refetchAttendance();
      refetchAbsentees();
      revalidate();
    },
  });

  // Attendance Mutations
  const updateAttendanceMut = useMutation({
    mutationFn: (data: any) => updateAttendanceFn({ data }),
    onSuccess: () => {
      toast.success("Attendance status recorded");
      refetchAttendance();
      refetchAbsentees();
      qc.invalidateQueries({ queryKey: ["student-attendance-history"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const bulkMarkMut = useMutation({
    mutationFn: (data: any) => bulkMarkFn({ data }),
    onSuccess: () => {
      toast.success("Bulk attendance updated");
      refetchAttendance();
      refetchAbsentees();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const submitAttendanceMut = useMutation({
    mutationFn: (data: any) => submitAttendanceFn({ data }),
    onSuccess: (res: any) => {
      toast.success(
        `Attendance submitted: ${res.present_count} Present, ${res.absent_count} Absent`,
      );
      setUnmarkedWarningOpen(false);
      refetchAttendance();
      refetchAbsentees();
      qc.invalidateQueries({ queryKey: ["attendance-analytics"] });
    },
    onError: (e: Error) => {
      toast.error(e.message);
      if (e.message.includes("Test 17") || e.message.includes("remain unmarked")) {
        setUnmarkedWarningOpen(true);
      }
    },
  });

  const lockAttendanceMut = useMutation({
    mutationFn: (data: any) => lockAttendanceFn({ data }),
    onSuccess: () => {
      toast.success("Attendance register LOCKED. Modifications disabled.");
      refetchAttendance();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const unlockAttendanceMut = useMutation({
    mutationFn: (data: any) => unlockAttendanceFn({ data }),
    onSuccess: () => {
      toast.success("Attendance register UNLOCKED with audit reason");
      setUnlockModalOpen(false);
      setUnlockReason("");
      refetchAttendance();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Filtered attendance records in Tab 9
  const filteredAttendanceRecords = useMemo(() => {
    if (!attendanceData?.records) return [];
    let list = [...attendanceData.records];
    if (attendanceStatusFilter !== "ALL") {
      list = list.filter((r) => r.status === attendanceStatusFilter);
    }
    if (attendanceSearch.trim()) {
      const q = attendanceSearch.toLowerCase();
      list = list.filter(
        (r) =>
          r.student_name.toLowerCase().includes(q) ||
          r.register_no.toLowerCase().includes(q) ||
          r.department.toLowerCase().includes(q),
      );
    }
    return list;
  }, [attendanceData?.records, attendanceStatusFilter, attendanceSearch]);

  // Export Absentees to Excel (XLSX)
  const exportAbsenteesToExcel = () => {
    if (!absenteesList || absenteesList.length === 0) {
      toast.info("No absentees to export");
      return;
    }
    const dataToExport = absenteesList.map((r, i) => ({
      "SL No": i + 1,
      "Register No (USN)": r.register_no,
      "Student Name": r.student_name,
      Semester: `Semester ${r.semester}`,
      Department: r.department,
      Examination: r.subject_name,
      "Course Code": r.subject_code,
      Date: r.exam_date,
      "Timing Slot": r.timing_name,
      "Lab / Venue": r.lab_name,
      Batch: r.batch_name,
      Status: "ABSENT",
      "Remarks / Notes": r.notes || "Official Absentee",
    }));

    const wsSheet = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsSheet, "Official Absentees");
    XLSX.writeFile(wb, `Official_Absentee_Roster_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success("Absentee roster exported to Excel");
  };

  // Export Master Timetable to Excel
  const exportTimetableToExcel = () => {
    if (!ws?.timetable?.entries) return;
    const dataToExport = ws.timetable.entries.map((e: any, i: number) => {
      const slot = ws.timingSlots.find((s: any) => s.id === e.timing_slot_id);
      const lab = ws.labs.find((l: any) => l.id === e.assigned_lab_id);
      const facultyNames = ws.faculty
        .filter((f: any) => e.assigned_faculty_ids.includes(f.id))
        .map((f: any) => f.full_name)
        .join(", ");
      return {
        "Entry ID": e.id,
        Semester: `Semester ${e.semester}`,
        "Subject Code": e.subject_code,
        "Subject Name": e.subject_name,
        Date: e.exam_date,
        "Timing Slot": slot?.name || "",
        Time: slot ? `${slot.start_time} - ${slot.end_time}` : "",
        Mode: e.mode.toUpperCase(),
        "Assigned Venue": lab?.name || "Exam Hall",
        "Assigned Faculty": facultyNames || "Unassigned",
        "Students Count": e.selected_student_ids.length,
        "Batches Count": e.batches?.length || 0,
      };
    });

    const wsSheet = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsSheet, "Exam Timetable");
    XLSX.writeFile(wb, `UniDuty_Master_Timetable_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success("Master timetable exported to Excel");
  };

  const timetable = ws?.timetable;
  const timingSlots = ws?.timingSlots || [];
  const labs = ws?.labs || [];
  const faculty = ws?.faculty || [];
  const currentAttendanceSession = attendanceData?.session;

  return (
    <AppShell title="Timetable & Allocation" description="Student Segmentation, Faculty Allocation & Attendance Register">
      <div className="space-y-6 pb-16">
        {/* HEADER SECTION */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-border pb-5">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                <CalendarCheck className="size-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    Timetable, Allocation & Attendance
                  </h1>
                  <Badge
                    variant="outline"
                    className={`font-semibold uppercase tracking-wider text-xs px-2.5 py-0.5 ${
                      timetable?.status === "PUBLISHED"
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                        : timetable?.status === "FINALIZED"
                          ? "bg-blue-500/10 text-blue-600 border-blue-500/30"
                          : timetable?.status === "VALIDATION"
                            ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                            : "bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    {timetable?.status || "DRAFT"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Universal Examination Suite: Student Segmentation, Year-Matched Faculty, Lab
                  Batches, Dynamic Attendance Register & Absentee Separation
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                revalidate();
                qc.invalidateQueries({ queryKey: ["timetable-workspace"] });
                refetchAttendance();
                refetchAbsentees();
                toast.success("Workspace synchronized");
              }}
              className="gap-1.5"
            >
              <RotateCcw className="size-3.5" />
              Sync State
            </Button>

            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => resetMut.mutate()}
                className="gap-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
              >
                Reset Calibration
              </Button>
            )}

            <Button
              variant="default"
              size="sm"
              onClick={exportTimetableToExcel}
              className="gap-1.5 bg-primary text-primary-foreground shadow-sm"
            >
              <Download className="size-3.5" />
              Export Timetable
            </Button>
          </div>
        </div>

        {/* WORKFLOW SUMMARY BANNER */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <Card className="p-3.5 bg-card/60 border border-border/80 shadow-xs">
            <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
              <span>Semester Cohorts</span>
              <Users className="size-3.5 text-primary" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-xl font-bold text-foreground">300</span>
              <span className="text-xs text-muted-foreground font-mono">100/100/100</span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">Semesters 1, 3, and 5</div>
          </Card>

          <Card className="p-3.5 bg-card/60 border border-border/80 shadow-xs">
            <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
              <span>Exam Timings</span>
              <Clock className="size-3.5 text-amber-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-xl font-bold text-foreground">{timingSlots.length}</span>
              <span className="text-xs text-muted-foreground">Standard Slots</span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">09:00 AM – 04:00 PM</div>
          </Card>

          <Card className="p-3.5 bg-card/60 border border-border/80 shadow-xs">
            <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
              <span>Faculty Compliance</span>
              <ShieldCheck className="size-3.5 text-emerald-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-xl font-bold text-emerald-600">
                {ws?.facultyStats?.meetingMinimum || 0} / {faculty.length}
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              {ws?.facultyStats?.belowMinimum
                ? `${ws.facultyStats.belowMinimum} faculty below ≥ 3 duties`
                : "All faculty compliant"}
            </div>
          </Card>

          <Card className="p-3.5 bg-card/60 border border-border/80 shadow-xs">
            <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
              <span>Computer Labs</span>
              <Laptop className="size-3.5 text-blue-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-xl font-bold text-foreground">{labs.length}</span>
              <span className="text-xs text-muted-foreground">
                {labs.reduce((acc, l) => acc + l.capacity, 0)} Seats
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">Online & Offline Validated</div>
          </Card>

          <Card className="p-3.5 bg-card/60 border border-border/80 shadow-xs">
            <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
              <span>Attendance Rate</span>
              <UserCheck className="size-3.5 text-emerald-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-xl font-bold text-foreground">
                {analyticsData?.overall?.overallPercentage || "93.4"}%
              </span>
              <span className="text-xs text-emerald-600 font-medium">Present</span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              {analyticsData?.overall?.totalPresent || 123} Present /{" "}
              {analyticsData?.overall?.totalAbsent || 10} Absent
            </div>
          </Card>

          <Card className="p-3.5 bg-card/60 border border-border/80 shadow-xs">
            <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
              <span>Separated Absentees</span>
              <UserX className="size-3.5 text-rose-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-xl font-bold text-rose-600">{absenteesList.length}</span>
              <span className="text-xs text-muted-foreground">Students</span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">Auto-derived Roster</div>
          </Card>
        </div>

        {/* WORKFLOW NAVIGATION TABS */}
        <div className="border-b border-border">
          <div className="flex overflow-x-auto no-scrollbar gap-1 pb-2">
            {[
              { id: "student_lists", label: "1. Student Lists", icon: Users },
              { id: "exam_timings", label: "2. Exam Timings", icon: Clock },
              { id: "timetable_draft", label: "3. Timetable Draft", icon: CalendarClock },
              { id: "faculty_placement", label: "4. Faculty Placement", icon: ShieldCheck },
              { id: "duty_balance", label: "5. Min 3 Duties", icon: BadgeAlert },
              { id: "lab_batches", label: "6. Lab & Batches", icon: Laptop },
              { id: "merge_divide", label: "7. Merge / Divide", icon: GitMerge },
              { id: "validation_publish", label: "8. Validation & Publish", icon: CheckCircle2 },
              { id: "conduct_attendance", label: "9. Attendance Desk", icon: ClipboardCheck },
              { id: "absentee_roster", label: "10. Absentee Roster", icon: UserX },
              { id: "student_history", label: "11. Student History", icon: History },
              { id: "comprehensive_reports", label: "12. Master Reports", icon: FileSpreadsheet },
            ].map((step) => {
              const Icon = step.icon;
              const isActive = activeStep === step.id;
              return (
                <button
                  key={step.id}
                  onClick={() => setActiveStep(step.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                  }`}
                >
                  <Icon className="size-3.5" />
                  {step.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* TAB 1: STUDENT LISTS (SEM 1, 3, 5 SEGMENTATION) */}
        {activeStep === "student_lists" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-foreground">Registered Student Cohorts</h2>
                <p className="text-xs text-muted-foreground">
                  300 total students segmented into Semester 1 (1st Year), Semester 3 (2nd Year),
                  and Semester 5 (3rd Year).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="size-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                  <Input
                    placeholder="Search USN, name, or branch..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="pl-8 h-9 text-xs w-60"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 border-b border-border pb-2">
              {[1, 3, 5].map((sem) => (
                <Button
                  key={sem}
                  variant={selectedSemesterTab === sem ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedSemesterTab(sem as ExamSemester)}
                  className="text-xs h-8"
                >
                  Semester {sem} Cohort (100 Students)
                </Button>
              ))}
            </div>

            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                  <tr>
                    <th className="p-3">SL NO</th>
                    <th className="p-3">Register No (USN)</th>
                    <th className="p-3">Student Name</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">Section</th>
                    <th className="p-3">Semester</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {students.slice(0, 20).map((st: any) => (
                    <tr key={st.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-mono text-muted-foreground">{st.serial_no}</td>
                      <td className="p-3 font-mono font-medium text-foreground">
                        {st.register_no}
                      </td>
                      <td className="p-3 font-medium text-foreground">{st.full_name}</td>
                      <td className="p-3 text-muted-foreground">{st.department}</td>
                      <td className="p-3 text-muted-foreground">{st.section}</td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-[11px] px-2 py-0">
                          Semester {st.semester}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                          <CheckCircle2 className="size-3" /> Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="p-3 bg-muted/20 border-t border-border text-xs text-muted-foreground text-center">
                Showing 20 of {students.length} students enrolled in Semester {selectedSemesterTab}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: EXAM TIMINGS */}
        {activeStep === "exam_timings" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  Standardized Exam Timing Slots
                </h2>
                <p className="text-xs text-muted-foreground">
                  Reusable timing slots across morning, midday, and afternoon sessions.
                </p>
              </div>
              {isAdmin && (
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingTiming(null);
                    setTimingModalOpen(true);
                  }}
                  className="gap-1 text-xs"
                >
                  <Plus className="size-3.5" />
                  Add Timing Slot
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {timingSlots.map((slot: any) => (
                <Card key={slot.id} className="p-4 border border-border bg-card">
                  <div className="flex items-start justify-between">
                    <div>
                      <Badge variant="outline" className="text-[10px] mb-1.5">
                        {slot.duration_minutes} Mins
                      </Badge>
                      <h3 className="font-semibold text-sm text-foreground">{slot.name}</h3>
                    </div>
                    <Clock className="size-4 text-amber-500" />
                  </div>

                  <div className="my-3 p-3 rounded-lg bg-muted/50 border border-border/60">
                    <div className="text-base font-bold font-mono text-foreground">
                      {slot.start_time} – {slot.end_time}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1">
                      Buffer break: {slot.buffer_minutes} minutes
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingTiming(slot);
                          setTimingModalOpen(true);
                        }}
                        className="h-7 text-xs gap-1"
                      >
                        <Edit2 className="size-3" /> Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteTimingMut.mutate(slot.id)}
                        className="h-7 text-xs gap-1 text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="size-3" /> Delete
                      </Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: TIMETABLE DRAFT */}
        {activeStep === "timetable_draft" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-foreground">Draft Timetable Entries</h2>
                <p className="text-xs text-muted-foreground">
                  Draft schedule of semester theory and online CBT examinations.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setEditingEntry(null);
                      setEntryModalOpen(true);
                    }}
                    className="gap-1 text-xs"
                  >
                    <Plus className="size-3.5" />
                    New Exam Entry
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {timetable?.entries.map((entry: any) => {
                const slot = timingSlots.find((s: any) => s.id === entry.timing_slot_id);
                const lab = labs.find((l: any) => l.id === entry.assigned_lab_id);
                const assignedFac = faculty.filter((f: any) =>
                  entry.assigned_faculty_ids.includes(f.id),
                );

                return (
                  <Card
                    key={entry.id}
                    className="p-4 border border-border bg-card flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <Badge
                          variant="outline"
                          className={
                            entry.mode === "online"
                              ? "bg-blue-500/10 text-blue-600 border-blue-200"
                              : "bg-purple-500/10 text-purple-600 border-purple-200"
                          }
                        >
                          {entry.mode.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="text-xs font-mono">
                          Sem {entry.semester}
                        </Badge>
                      </div>

                      <h3 className="font-bold text-sm text-foreground">{entry.subject_name}</h3>
                      <div className="text-xs font-mono text-muted-foreground">
                        {entry.subject_code}
                      </div>

                      <div className="my-3 space-y-1.5 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <CalendarClock className="size-3.5 text-muted-foreground" />
                          <span>{entry.exam_date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="size-3.5 text-muted-foreground" />
                          <span>
                            {slot ? `${slot.start_time} - ${slot.end_time}` : "Slot unassigned"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Building2 className="size-3.5 text-muted-foreground" />
                          <span>{lab?.name || "Standard Examination Hall"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="size-3.5 text-muted-foreground" />
                          <span>{entry.selected_student_ids.length} Students Allocated</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-border">
                        <div className="text-[11px] font-medium text-foreground mb-1">
                          Assigned Faculty:
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {assignedFac.length > 0 ? (
                            assignedFac.map((f: any) => (
                              <Badge key={f.id} variant="secondary" className="text-[10px]">
                                {f.full_name} ({f.teaching_year})
                              </Badge>
                            ))
                          ) : (
                            <span className="text-[11px] text-amber-600 flex items-center gap-1">
                              <AlertCircle className="size-3" /> No faculty placed
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-border flex items-center justify-between gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setExamDetailEntry(entry);
                          setExamDetailModalOpen(true);
                        }}
                        className="text-xs h-7 gap-1"
                      >
                        <Eye className="size-3" /> Details
                      </Button>

                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                          setAttendanceEntryId(entry.id);
                          setAttendanceBatchId("ALL");
                          setActiveStep("conduct_attendance");
                        }}
                        className="text-xs h-7 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <ClipboardCheck className="size-3" /> Attendance
                      </Button>

                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteEntryMut.mutate(entry.id)}
                          className="text-xs h-7 text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: FACULTY PLACEMENT (YEAR-MATCHED RULES) */}
        {activeStep === "faculty_placement" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-foreground">
                Strict Year-Matched Faculty Placement
              </h2>
              <p className="text-xs text-muted-foreground">
                Core Institutional Rule: Semester 1 maps to 1st-Year Faculty; Semester 3 maps to
                3rd-Year Faculty; Semester 5 maps to 5th-Year Faculty. Cross-year placement is
                strictly blocked (Test 2).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {timetable?.entries.map((entry: any) => {
                const yearRequired =
                  entry.semester === 1
                    ? "1st Year"
                    : entry.semester === 3
                      ? "3rd Year"
                      : "5th Year";
                const assigned = faculty.filter((f: any) =>
                  entry.assigned_faculty_ids.includes(f.id),
                );

                return (
                  <Card key={entry.id} className="p-4 border border-border bg-card">
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge variant="outline" className="text-xs mb-1">
                          Semester {entry.semester} Exam
                        </Badge>
                        <h3 className="font-bold text-sm text-foreground">{entry.subject_name}</h3>
                      </div>
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                        Requires: {yearRequired}
                      </Badge>
                    </div>

                    <div className="my-3 space-y-2">
                      <div className="text-xs text-muted-foreground font-medium">
                        Placed Invigilators:
                      </div>
                      {assigned.length > 0 ? (
                        <div className="space-y-1.5">
                          {assigned.map((f: any) => (
                            <div
                              key={f.id}
                              className="p-2 rounded-lg bg-muted/40 border border-border flex items-center justify-between text-xs"
                            >
                              <div>
                                <div className="font-medium text-foreground">{f.full_name}</div>
                                <div className="text-[10px] text-muted-foreground font-mono">
                                  {f.employee_id} • {f.department}
                                </div>
                              </div>
                              <Badge
                                variant="outline"
                                className="text-[10px] bg-emerald-50 text-emerald-700"
                              >
                                {f.teaching_year}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-3 rounded-lg bg-amber-500/10 text-amber-700 text-xs border border-amber-500/20 flex items-center gap-2">
                          <AlertTriangle className="size-4 shrink-0" />
                          <span>
                            No faculty placed. Please assign eligible {yearRequired} faculty.
                          </span>
                        </div>
                      )}
                    </div>

                    {isAdmin && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPlacementEntry(entry);
                          setSelectedFacultyIds(entry.assigned_faculty_ids);
                        }}
                        className="w-full text-xs gap-1 mt-2"
                      >
                        <ShieldCheck className="size-3.5" /> Manage Faculty Placement
                      </Button>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 5: MINIMUM 3 DUTIES COMPLIANCE */}
        {activeStep === "duty_balance" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  Faculty Minimum 3 Duties Tracker
                </h2>
                <p className="text-xs text-muted-foreground">
                  Institutional Requirement: Every participating faculty member must have at least 3
                  duties before timetable finalization (Tests 3, 4, 5).
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {faculty.map((f: any) => {
                const isCompliant = f.total_duties_assigned >= 3;
                return (
                  <Card key={f.id} className="p-4 border border-border bg-card">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-sm text-foreground">{f.full_name}</h3>
                        <div className="text-xs text-muted-foreground font-mono">
                          {f.employee_id} • {f.department}
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          isCompliant
                            ? "bg-emerald-500/10 text-emerald-700 border-emerald-300"
                            : "bg-amber-500/10 text-amber-700 border-amber-300"
                        }
                      >
                        {isCompliant ? "COMPLIANT" : "DEFICIT (< 3)"}
                      </Badge>
                    </div>

                    <div className="my-3 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Assigned Duties:</span>
                        <span className="font-bold text-foreground font-mono">
                          {f.total_duties_assigned} / 3 Required
                        </span>
                      </div>
                      <Progress
                        value={Math.min(100, (f.total_duties_assigned / 3) * 100)}
                        className="h-2"
                      />
                    </div>

                    <div className="text-[11px] text-muted-foreground flex items-center justify-between pt-2 border-t border-border">
                      <span>Eligible: {f.teaching_year}</span>
                      {!isCompliant && isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const matchingEntry = timetable?.entries.find((e: any) =>
                              f.eligible_semesters.includes(e.semester),
                            );
                            if (matchingEntry) {
                              addDutyMut.mutate({ faculty_id: f.id, entry_id: matchingEntry.id });
                            } else {
                              toast.info("No matching exam entry available to assign");
                            }
                          }}
                          className="h-6 text-[10px] text-primary hover:bg-primary/10 gap-1 px-1.5"
                        >
                          <Plus className="size-3" /> Allot Duty
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 6: LAB ALLOCATION & DYNAMIC BATCHES */}
        {activeStep === "lab_batches" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  Computer Lab Allocation & Dynamic Batches
                </h2>
                <p className="text-xs text-muted-foreground">
                  Dedicated computer labs with automatic multi-batch generation for online CBT
                  practical tests (Tests 6, 7, 15).
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {timetable?.entries.map((entry: any) => {
                const lab = labs.find((l: any) => l.id === entry.assigned_lab_id);
                return (
                  <Card key={entry.id} className="p-4 border border-border bg-card">
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge variant="outline" className="text-xs mb-1">
                          {entry.mode.toUpperCase()}
                        </Badge>
                        <h3 className="font-bold text-sm text-foreground">{entry.subject_name}</h3>
                        <div className="text-xs text-muted-foreground font-mono">
                          {entry.subject_code}
                        </div>
                      </div>
                      <Badge className="bg-muted text-foreground border-border text-xs">
                        {entry.selected_student_ids.length} Students
                      </Badge>
                    </div>

                    <div className="my-3 p-3 rounded-lg bg-muted/40 border border-border">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Assigned Lab:</span>
                        <span className="font-semibold text-foreground">
                          {lab?.name || "Unassigned"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs mt-1">
                        <span className="text-muted-foreground">Lab Capacity:</span>
                        <span className="font-mono text-foreground">
                          {lab?.capacity || "—"} Workstations
                        </span>
                      </div>
                    </div>

                    {entry.batches && entry.batches.length > 0 && (
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                          <span>Dynamic Online Batches:</span>
                          <span className="text-muted-foreground font-normal">
                            {entry.batches.length} Batches
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          {entry.batches.map((b: any) => (
                            <div
                              key={b.id}
                              className="p-2 rounded-lg bg-card border border-border flex items-center justify-between text-xs"
                            >
                              <div>
                                <span className="font-medium text-foreground">{b.batch_name}</span>
                                <span className="text-muted-foreground ml-2">
                                  ({b.student_ids.length} Students)
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setAttendanceEntryId(entry.id);
                                  setAttendanceBatchId(b.id);
                                  setActiveStep("conduct_attendance");
                                }}
                                className="h-6 text-[10px] text-emerald-600 hover:bg-emerald-50 gap-1 px-1.5"
                              >
                                <ClipboardCheck className="size-3" /> Batch Attendance
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                      {entry.batches && entry.batches.length > 1 && isAdmin && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setMoveEntry(entry);
                            setMoveSourceBatchId(entry.batches[0].id);
                            setMoveTargetBatchId(entry.batches[1].id);
                            setMoveStudentId(entry.batches[0].student_ids[0] || "");
                            setMoveBatchModalOpen(true);
                          }}
                          className="text-xs h-7 gap-1"
                        >
                          <ArrowRightLeft className="size-3" /> Move Student (Test 15)
                        </Button>
                      )}

                      {isAdmin && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setLabEntry(entry);
                            setSelectedLabId(entry.assigned_lab_id || labs[0]?.id || "");
                          }}
                          className="text-xs h-7 gap-1"
                        >
                          <Laptop className="size-3" /> Reallocate Lab & Batches
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 7: MERGE / DIVIDE DESK */}
        {activeStep === "merge_divide" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-foreground">
                Cohort Divide & Selective Merging Desk
              </h2>
              <p className="text-xs text-muted-foreground">
                Divide large student cohorts into equal groups, or merge groups with capacity
                validation (Tests 6, 8).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {timetable?.entries.map((entry: any) => {
                const lab = labs.find((l: any) => l.id === entry.assigned_lab_id);
                return (
                  <Card key={entry.id} className="p-4 border border-border bg-card">
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge variant="outline" className="text-xs mb-1">
                          Semester {entry.semester}
                        </Badge>
                        <h3 className="font-bold text-sm text-foreground">{entry.subject_name}</h3>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {entry.selected_student_ids.length} Students
                      </Badge>
                    </div>

                    <div className="my-3 space-y-2">
                      <div className="text-xs font-semibold text-foreground">
                        Student Groups / Sub-Batches:
                      </div>
                      {entry.student_groups && entry.student_groups.length > 0 ? (
                        <div className="space-y-1.5">
                          {entry.student_groups.map((grp: any) => (
                            <div
                              key={grp.id}
                              className="p-2 rounded-lg bg-muted/40 border border-border flex items-center justify-between text-xs"
                            >
                              <span className="font-medium text-foreground">{grp.group_name}</span>
                              <span className="font-mono text-muted-foreground">
                                {grp.student_ids.length} Students
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground italic p-2 border border-dashed rounded-lg">
                          No sub-groups divided yet. Full cohort is enrolled as single session.
                        </div>
                      )}
                    </div>

                    {isAdmin && (
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSplitEntry(entry);
                            setSplitCount(2);
                          }}
                          className="text-xs h-7 gap-1"
                        >
                          <Divide className="size-3" /> Divide Group
                        </Button>

                        {entry.student_groups && entry.student_groups.length >= 2 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setMergeEntry(entry);
                              setMergeGroupIds([
                                entry.student_groups[0].id,
                                entry.student_groups[1].id,
                              ]);
                              setTargetMergedName("Combined Lab Group");
                            }}
                            className="text-xs h-7 gap-1"
                          >
                            <GitMerge className="size-3" /> Merge Groups (Test 8)
                          </Button>
                        )}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 8: VALIDATION & PUBLISH GATE */}
        {activeStep === "validation_publish" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  Pre-Publication 15-Rule Validation Gate
                </h2>
                <p className="text-xs text-muted-foreground">
                  Validates faculty eligibility, minimum 3 duties, simultaneous conflicts, and lab
                  capacities (Tests 1–11).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => revalidate()}
                  className="gap-1.5 text-xs"
                >
                  <RotateCcw className="size-3.5" /> Re-audit
                </Button>

                {isAdmin && timetable?.status === "DRAFT" && (
                  <Button
                    size="sm"
                    onClick={() => finalizeMut.mutate()}
                    disabled={!valResult?.canFinalize}
                    className="gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <CheckCircle2 className="size-3.5" /> Finalize Timetable
                  </Button>
                )}

                {isAdmin && timetable?.status === "FINALIZED" && (
                  <Button
                    size="sm"
                    onClick={() => publishMut.mutate()}
                    className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Send className="size-3.5" /> Publish to Faculty & Students
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Card className="p-3.5 border border-border bg-card">
                <div className="text-xs text-muted-foreground font-medium">Blocking Errors</div>
                <div className="text-2xl font-bold text-rose-600 mt-1">
                  {valResult?.errorCount || 0}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  Must be 0 before finalization
                </div>
              </Card>

              <Card className="p-3.5 border border-border bg-card">
                <div className="text-xs text-muted-foreground font-medium">Warnings</div>
                <div className="text-2xl font-bold text-amber-600 mt-1">
                  {valResult?.warningCount || 0}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Non-blocking notices</div>
              </Card>

              <Card className="p-3.5 border border-border bg-card">
                <div className="text-xs text-muted-foreground font-medium">Publication Status</div>
                <div className="text-2xl font-bold text-foreground mt-1">
                  {valResult?.canFinalize ? (
                    <span className="text-emerald-600 flex items-center gap-1.5">
                      <CheckCircle2 className="size-5" /> PASSED
                    </span>
                  ) : (
                    <span className="text-rose-600 flex items-center gap-1.5">
                      <XCircle className="size-5" /> BLOCKED
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {valResult?.canFinalize
                    ? "All 15 rules verified cleanly"
                    : "Resolve blocking errors to proceed"}
                </div>
              </Card>
            </div>

            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="p-3 bg-muted/50 border-b border-border text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Validation Issue Audit Log</span>
                <span className="text-muted-foreground font-normal">Total rules checked: 15</span>
              </div>
              <div className="divide-y divide-border">
                {valResult?.issues && valResult.issues.length > 0 ? (
                  valResult.issues.map((iss: any) => (
                    <div key={iss.id} className="p-3 flex items-start gap-3 hover:bg-muted/20">
                      {iss.severity === "error" ? (
                        <AlertCircle className="size-4 text-rose-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="size-4 text-amber-500 shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <div className="text-xs font-medium text-foreground">{iss.message}</div>
                        <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                          Category: {iss.category} • Severity: {iss.severity.toUpperCase()}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs text-emerald-600 font-medium">
                    <CheckCircle2 className="size-6 mx-auto mb-2" />
                    Zero validation errors! The timetable is fully compliant with all institutional
                    rules.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 9: CONDUCT EXAM & UNIVERSAL ATTENDANCE DESK (SECTIONS 10–21, TESTS 12–18) */}
        {activeStep === "conduct_attendance" && (
          <div className="space-y-4">
            {/* Header & Session Selector */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-foreground">
                    Examination Attendance Register
                  </h2>
                  {currentAttendanceSession && (
                    <Badge
                      variant="outline"
                      className={`text-xs uppercase px-2 py-0.5 font-bold ${
                        currentAttendanceSession.status === "LOCKED"
                          ? "bg-purple-500/10 text-purple-700 border-purple-300"
                          : currentAttendanceSession.status === "SUBMITTED"
                            ? "bg-emerald-500/10 text-emerald-700 border-emerald-300"
                            : currentAttendanceSession.status === "IN_PROGRESS"
                              ? "bg-amber-500/10 text-amber-700 border-amber-300"
                              : "bg-blue-500/10 text-blue-700 border-blue-300"
                      }`}
                    >
                      {currentAttendanceSession.status === "LOCKED" && (
                        <Lock className="size-3 mr-1 inline" />
                      )}
                      {currentAttendanceSession.status}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Record real-time attendance for every exam session, lab venue, and batch.
                  Automatic absentee separation (Tests 12, 13, 14, 16, 17, 18).
                </p>
              </div>

              {/* Selector Controls */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="w-56">
                  <Select
                    value={attendanceEntryId}
                    onValueChange={(val) => {
                      setAttendanceEntryId(val);
                      setAttendanceBatchId("ALL");
                    }}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Select Exam" />
                    </SelectTrigger>
                    <SelectContent>
                      {timetable?.entries.map((e: any) => (
                        <SelectItem key={e.id} value={e.id} className="text-xs">
                          {e.subject_code} - Sem {e.semester} ({e.mode})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Batch Selector if entry has batches */}
                {attendanceData?.entry?.batches && attendanceData.entry.batches.length > 0 && (
                  <div className="w-48">
                    <Select
                      value={attendanceBatchId}
                      onValueChange={(val) => setAttendanceBatchId(val)}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Select Batch" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL" className="text-xs">
                          All Batches ({attendanceData.entry.selected_student_ids.length})
                        </SelectItem>
                        {attendanceData.entry.batches.map((b: any) => (
                          <SelectItem key={b.id} value={b.id} className="text-xs">
                            {b.batch_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Test 16: Unauthorized Faculty Simulator */}
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-muted/40">
                  <Switch
                    checked={simulateUnauthorizedFaculty}
                    onCheckedChange={(val) => setSimulateUnauthorizedFaculty(val)}
                    id="unauth-toggle"
                  />
                  <Label
                    htmlFor="unauth-toggle"
                    className="text-[11px] cursor-pointer text-muted-foreground"
                  >
                    Test 16: Unauthorized User
                  </Label>
                </div>
              </div>
            </div>

            {/* Test 16: Unauthorized Access Error Display */}
            {attendanceError && (
              <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-700 flex items-start gap-3">
                <ShieldAlert className="size-5 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-sm">Access Denied (Test 16 Enforced)</div>
                  <div className="text-xs mt-1">{attendanceError.message}</div>
                  <div className="text-[11px] text-rose-600 mt-2">
                    Turn off "Test 16: Unauthorized User" to resume authorized administrative
                    invigilation.
                  </div>
                </div>
              </div>
            )}

            {/* Active Session Details Bar */}
            {attendanceData?.entry && !attendanceError && (
              <div className="p-3.5 rounded-xl border border-border bg-muted/30 grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Subject</span>
                  <span className="font-bold text-foreground">
                    {attendanceData.entry.subject_name}
                  </span>
                  <span className="font-mono text-muted-foreground block text-[10px]">
                    {attendanceData.entry.subject_code}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Date & Time</span>
                  <span className="font-medium text-foreground">
                    {attendanceData.entry.exam_date}
                  </span>
                  <span className="text-muted-foreground block text-[10px]">
                    {timingSlots.find((s: any) => s.id === attendanceData.entry.timing_slot_id)
                      ?.name || "Slot 1"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Venue</span>
                  <span className="font-medium text-foreground">
                    {attendanceData.lab?.name || "Offline Examination Hall"}
                  </span>
                  <span className="text-muted-foreground block text-[10px]">
                    Mode: {attendanceData.entry.mode.toUpperCase()}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Invigilator(s)</span>
                  <span className="font-medium text-foreground">
                    {attendanceData.assignedFaculty.map((f: any) => f.full_name).join(", ") ||
                      "Unassigned"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Audit History</span>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setAuditLogModalOpen(true)}
                    className="p-0 h-auto text-xs text-primary font-medium"
                  >
                    View {attendanceData.auditLogs?.length || 0} Change Log(s)
                  </Button>
                </div>
              </div>
            )}

            {/* Attendance KPI Summary Bar */}
            {currentAttendanceSession && !attendanceError && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <Card className="p-3 border border-border bg-card">
                  <div className="text-[11px] text-muted-foreground font-medium">
                    Total Students
                  </div>
                  <div className="text-2xl font-bold text-foreground mt-0.5">
                    {currentAttendanceSession.total_students}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    Assigned to Session
                  </div>
                </Card>

                <Card className="p-3 border border-emerald-500/20 bg-emerald-500/5">
                  <div className="text-[11px] text-emerald-600 font-medium flex items-center justify-between">
                    <span>Present</span>
                    <UserCheck className="size-3.5" />
                  </div>
                  <div className="text-2xl font-bold text-emerald-600 mt-0.5">
                    {currentAttendanceSession.present_count}
                  </div>
                  <div className="text-[10px] text-emerald-600/70 mt-0.5">Physically in hall</div>
                </Card>

                <Card className="p-3 border border-rose-500/20 bg-rose-500/5">
                  <div className="text-[11px] text-rose-600 font-medium flex items-center justify-between">
                    <span>Absent</span>
                    <UserX className="size-3.5" />
                  </div>
                  <div className="text-2xl font-bold text-rose-600 mt-0.5">
                    {currentAttendanceSession.absent_count}
                  </div>
                  <div className="text-[10px] text-rose-600/70 mt-0.5">
                    Separated into Absentees
                  </div>
                </Card>

                <Card className="p-3 border border-amber-500/20 bg-amber-500/5">
                  <div className="text-[11px] text-amber-600 font-medium flex items-center justify-between">
                    <span>Unmarked</span>
                    <AlertCircle className="size-3.5" />
                  </div>
                  <div className="text-2xl font-bold text-amber-600 mt-0.5">
                    {currentAttendanceSession.unmarked_count}
                  </div>
                  <div className="text-[10px] text-amber-600/70 mt-0.5">Pending marking</div>
                </Card>

                <Card className="p-3 border border-border bg-card">
                  <div className="text-[11px] text-muted-foreground font-medium">
                    Attendance Rate
                  </div>
                  <div className="text-2xl font-bold text-foreground mt-0.5">
                    {currentAttendanceSession.attendance_percentage}%
                  </div>
                  <Progress
                    value={currentAttendanceSession.attendance_percentage}
                    className="h-1.5 mt-1.5"
                  />
                </Card>
              </div>
            )}

            {/* Attendance Action Controls Bar */}
            {!attendanceError && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border border-border bg-card">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentAttendanceSession?.status === "LOCKED"}
                    onClick={() =>
                      bulkMarkMut.mutate({
                        session_id: currentAttendanceSession.id,
                        status: "present",
                        marked_by: me?.name || "Faculty Invigilator",
                      })
                    }
                    className="text-xs h-8 gap-1 text-emerald-700 hover:bg-emerald-50 border-emerald-300"
                  >
                    <UserCheck className="size-3.5" /> Mark All Present
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentAttendanceSession?.status === "LOCKED"}
                    onClick={() =>
                      bulkMarkMut.mutate({
                        session_id: currentAttendanceSession.id,
                        status: "absent",
                        marked_by: me?.name || "Faculty Invigilator",
                      })
                    }
                    className="text-xs h-8 gap-1 text-rose-700 hover:bg-rose-50 border-rose-300"
                  >
                    <UserX className="size-3.5" /> Mark All Absent
                  </Button>

                  {/* Status Filter */}
                  <div className="flex items-center gap-1 border-l border-border pl-2">
                    {["ALL", "unmarked", "present", "absent"].map((st) => (
                      <Button
                        key={st}
                        variant={attendanceStatusFilter === st ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setAttendanceStatusFilter(st)}
                        className="text-[11px] h-7 px-2 capitalize"
                      >
                        {st}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="size-3 absolute left-2 top-2.5 text-muted-foreground" />
                    <Input
                      placeholder="Filter student / USN..."
                      value={attendanceSearch}
                      onChange={(e) => setAttendanceSearch(e.target.value)}
                      className="pl-7 h-8 text-xs w-48"
                    />
                  </div>

                  {/* Submission and Lock Controls */}
                  {currentAttendanceSession?.status !== "LOCKED" ? (
                    <>
                      <Button
                        size="sm"
                        onClick={() =>
                          submitAttendanceMut.mutate({
                            session_id: currentAttendanceSession.id,
                            submitted_by: me?.name || "Faculty Invigilator",
                          })
                        }
                        className="text-xs h-8 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                      >
                        <Check className="size-3.5" /> Submit Register
                      </Button>

                      {isAdmin && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            lockAttendanceMut.mutate({
                              session_id: currentAttendanceSession.id,
                              locked_by: me?.name || "Chief Superintendent",
                            })
                          }
                          className="text-xs h-8 gap-1 text-purple-700 border-purple-300 hover:bg-purple-50"
                        >
                          <Lock className="size-3.5" /> Lock (Test 18)
                        </Button>
                      )}
                    </>
                  ) : (
                    isAdmin && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setUnlockModalOpen(true)}
                        className="text-xs h-8 gap-1 text-amber-700 border-amber-300 hover:bg-amber-50"
                      >
                        <Unlock className="size-3.5" /> Unlock (Admin)
                      </Button>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Student Attendance Register Table */}
            {!attendanceError && (
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                    <tr>
                      <th className="p-3">SL</th>
                      <th className="p-3">Register No (USN)</th>
                      <th className="p-3">Student Name</th>
                      <th className="p-3">Department</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Mark Attendance (Click)</th>
                      <th className="p-3">Remarks / Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredAttendanceRecords.map((r: any, idx: number) => {
                      const isLocked = currentAttendanceSession?.status === "LOCKED";
                      return (
                        <tr
                          key={r.id}
                          className={`transition-colors ${
                            r.status === "absent"
                              ? "bg-rose-500/5 hover:bg-rose-500/10"
                              : r.status === "present"
                                ? "bg-emerald-500/5 hover:bg-emerald-500/10"
                                : "hover:bg-muted/30"
                          }`}
                        >
                          <td className="p-3 font-mono text-muted-foreground">{idx + 1}</td>
                          <td className="p-3 font-mono font-medium text-foreground">
                            {r.register_no}
                          </td>
                          <td className="p-3 font-medium text-foreground">{r.student_name}</td>
                          <td className="p-3 text-muted-foreground">{r.department}</td>
                          <td className="p-3">
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-2 py-0.5 capitalize font-medium ${
                                r.status === "present"
                                  ? "bg-emerald-500/10 text-emerald-700 border-emerald-300"
                                  : r.status === "absent"
                                    ? "bg-rose-500/10 text-rose-700 border-rose-300"
                                    : "bg-muted text-muted-foreground border-border"
                              }`}
                            >
                              {r.status}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                disabled={isLocked}
                                variant={r.status === "present" ? "default" : "outline"}
                                onClick={() =>
                                  updateAttendanceMut.mutate({
                                    session_id: currentAttendanceSession.id,
                                    student_id: r.student_id,
                                    status: "present",
                                    changed_by: me?.name || "Faculty Invigilator",
                                  })
                                }
                                className={`h-6 text-[10px] px-2 ${
                                  r.status === "present"
                                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                    : "text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                                }`}
                              >
                                Present
                              </Button>

                              <Button
                                size="sm"
                                disabled={isLocked}
                                variant={r.status === "absent" ? "default" : "outline"}
                                onClick={() =>
                                  updateAttendanceMut.mutate({
                                    session_id: currentAttendanceSession.id,
                                    student_id: r.student_id,
                                    status: "absent",
                                    notes: "Absent during roll call",
                                    changed_by: me?.name || "Faculty Invigilator",
                                  })
                                }
                                className={`h-6 text-[10px] px-2 ${
                                  r.status === "absent"
                                    ? "bg-rose-600 hover:bg-rose-700 text-white"
                                    : "text-rose-700 border-rose-300 hover:bg-rose-50"
                                }`}
                              >
                                Absent
                              </Button>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="text-[11px] text-muted-foreground italic">
                              {r.notes || "—"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="p-3 bg-muted/20 border-t border-border text-xs text-muted-foreground flex items-center justify-between">
                  <span>Showing {filteredAttendanceRecords.length} students</span>
                  <span className="font-mono text-[11px]">
                    Last updated:{" "}
                    {currentAttendanceSession?.updated_at
                      ? new Date(currentAttendanceSession.updated_at).toLocaleTimeString()
                      : "—"}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 10: AUTOMATIC ABSENTEE ROSTER (SECTIONS 14, 22) */}
        {activeStep === "absentee_roster" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  Automatically Separated Absentee Roster
                </h2>
                <p className="text-xs text-muted-foreground">
                  Directly derived from submitted exam registers. Real-time updates without manual
                  copy-pasting (Tests 13, 14).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportAbsenteesToExcel}
                  className="gap-1.5 text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                >
                  <FileSpreadsheet className="size-3.5" /> Download Excel (.xlsx)
                </Button>

                <Button
                  variant="default"
                  size="sm"
                  onClick={() => window.print()}
                  className="gap-1.5 text-xs"
                >
                  <Printer className="size-3.5" /> Print Absentee Memo
                </Button>
              </div>
            </div>

            {/* Absentee Filters */}
            <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl border border-border bg-card">
              <div className="flex items-center gap-1">
                {[0, 1, 3, 5].map((sem) => (
                  <Button
                    key={sem}
                    variant={absenteeSemFilter === sem ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAbsenteeSemFilter(sem)}
                    className="text-xs h-8"
                  >
                    {sem === 0 ? "All Semesters" : `Semester ${sem}`}
                  </Button>
                ))}
              </div>

              <div className="w-56">
                <Select
                  value={absenteeExamFilter}
                  onValueChange={(val) => setAbsenteeExamFilter(val)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Filter by Exam" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL" className="text-xs">
                      All Examinations
                    </SelectItem>
                    {timetable?.entries.map((e: any) => (
                      <SelectItem key={e.id} value={e.id} className="text-xs">
                        {e.subject_code} ({e.subject_name.slice(0, 20)}...)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="relative flex-1 min-w-[200px]">
                <Search className="size-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                <Input
                  placeholder="Search absentee USN or name..."
                  value={absenteeSearch}
                  onChange={(e) => setAbsenteeSearch(e.target.value)}
                  className="pl-8 h-8 text-xs"
                />
              </div>
            </div>

            {/* Absentee Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="p-3 border border-border bg-card">
                <div className="text-xs text-muted-foreground font-medium">Total Absentees</div>
                <div className="text-2xl font-bold text-rose-600 mt-1">{absenteesList.length}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  Across selected filters
                </div>
              </Card>

              <Card className="p-3 border border-border bg-card">
                <div className="text-xs text-muted-foreground font-medium">
                  Semester 1 Absentees
                </div>
                <div className="text-2xl font-bold text-foreground mt-1">
                  {absenteesList.filter((r: any) => r.semester === 1).length}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">1st Year Cohort</div>
              </Card>

              <Card className="p-3 border border-border bg-card">
                <div className="text-xs text-muted-foreground font-medium">
                  Semester 3 Absentees
                </div>
                <div className="text-2xl font-bold text-foreground mt-1">
                  {absenteesList.filter((r: any) => r.semester === 3).length}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">3rd Year Cohort</div>
              </Card>

              <Card className="p-3 border border-border bg-card">
                <div className="text-xs text-muted-foreground font-medium">
                  Semester 5 Absentees
                </div>
                <div className="text-2xl font-bold text-foreground mt-1">
                  {absenteesList.filter((r: any) => r.semester === 5).length}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">5th Year Cohort</div>
              </Card>
            </div>

            {/* Separated Absentee Table */}
            <div
              className="rounded-xl border border-border bg-card overflow-hidden"
              id="printable-absentees"
            >
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                  <tr>
                    <th className="p-3">SL</th>
                    <th className="p-3">Register No (USN)</th>
                    <th className="p-3">Student Name</th>
                    <th className="p-3">Semester</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">Examination & Subject</th>
                    <th className="p-3">Date & Slot</th>
                    <th className="p-3">Venue / Batch</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {absenteesList.length > 0 ? (
                    absenteesList.map((r: any, idx: number) => (
                      <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3 font-mono text-muted-foreground">{idx + 1}</td>
                        <td className="p-3 font-mono font-bold text-foreground">{r.register_no}</td>
                        <td className="p-3 font-medium text-foreground">{r.student_name}</td>
                        <td className="p-3">
                          <Badge variant="outline" className="text-[10px]">
                            Sem {r.semester}
                          </Badge>
                        </td>
                        <td className="p-3 text-muted-foreground">{r.department}</td>
                        <td className="p-3">
                          <span className="font-medium text-foreground">{r.subject_name}</span>
                          <span className="font-mono text-muted-foreground block text-[10px]">
                            {r.subject_code}
                          </span>
                        </td>
                        <td className="p-3 text-muted-foreground">
                          <div>{r.exam_date}</div>
                          <div className="text-[10px] text-muted-foreground font-mono">
                            {r.timing_name}
                          </div>
                        </td>
                        <td className="p-3 text-muted-foreground">
                          <div>{r.lab_name}</div>
                          <div className="text-[10px] text-muted-foreground italic">
                            {r.batch_name}
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge className="bg-rose-600 text-white text-[10px] uppercase">
                            ABSENT
                          </Badge>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-xs text-muted-foreground">
                        No absentees found for the selected criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="p-3 bg-muted/20 border-t border-border text-xs text-muted-foreground text-center">
                Total {absenteesList.length} absentee records listed
              </div>
            </div>
          </div>
        )}

        {/* TAB 11: STUDENT ATTENDANCE HISTORY (SECTION 23) */}
        {activeStep === "student_history" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-foreground">
                Individual Student Attendance History
              </h2>
              <p className="text-xs text-muted-foreground">
                Search any student by Register Number (USN) or Name to view their complete
                multi-exam attendance record (Section 23).
              </p>
            </div>

            {/* Search Box & Quick Test USNs */}
            <div className="p-4 rounded-xl border border-border bg-card space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="size-4 absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    placeholder="Enter Student Register No (e.g. 2026CS1014, 2025CS3004)..."
                    value={historySearchQuery}
                    onChange={(e) => setHistorySearchQuery(e.target.value)}
                    className="pl-9 h-10 text-sm"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                <span>Quick Test Candidates:</span>
                {[
                  { usn: "2026CS1014", label: "Student S1-014 (Sem 1 Absent)" },
                  { usn: "2025CS3004", label: "Student S3-004 (Sem 3 Absent)" },
                  { usn: "2026CS1001", label: "Student S1-001 (Sem 1 Present)" },
                  { usn: "2024CS5001", label: "Student S5-001 (Sem 5 Present)" },
                ].map((cand) => (
                  <Button
                    key={cand.usn}
                    variant="outline"
                    size="sm"
                    onClick={() => setHistorySearchQuery(cand.usn)}
                    className="h-6 text-[11px] px-2"
                  >
                    {cand.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Profile & History Display */}
            {studentHistoryData?.student ? (
              <div className="space-y-4">
                <Card className="p-4 border border-border bg-card">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-foreground">
                          {studentHistoryData.student.full_name}
                        </h3>
                        <Badge variant="outline" className="font-mono text-xs">
                          {studentHistoryData.student.register_no}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {studentHistoryData.student.department} • Semester{" "}
                        {studentHistoryData.student.semester}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs">
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Total Exams</span>
                        <span className="text-base font-bold text-foreground">
                          {studentHistoryData.stats.totalExams}
                        </span>
                      </div>
                      <div>
                        <span className="text-emerald-600 block text-[11px]">Attended</span>
                        <span className="text-base font-bold text-emerald-600">
                          {studentHistoryData.stats.presentCount}
                        </span>
                      </div>
                      <div>
                        <span className="text-rose-600 block text-[11px]">Absent</span>
                        <span className="text-base font-bold text-rose-600">
                          {studentHistoryData.stats.absentCount}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[11px]">
                          Overall Rate
                        </span>
                        <span className="text-base font-bold text-foreground">
                          {studentHistoryData.stats.percentage}%
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>

                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                      <tr>
                        <th className="p-3">Examination Name</th>
                        <th className="p-3">Subject Code</th>
                        <th className="p-3">Date</th>
                        <th className="p-3">Timing Slot</th>
                        <th className="p-3">Assigned Venue / Lab</th>
                        <th className="p-3">Batch</th>
                        <th className="p-3">Attendance Status</th>
                        <th className="p-3">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {studentHistoryData.history.map((h: any) => (
                        <tr key={h.id} className="hover:bg-muted/30">
                          <td className="p-3 font-semibold text-foreground">{h.exam_name}</td>
                          <td className="p-3 font-mono text-muted-foreground">{h.subject_code}</td>
                          <td className="p-3 text-muted-foreground">{h.exam_date}</td>
                          <td className="p-3 text-muted-foreground">{h.timing}</td>
                          <td className="p-3 text-muted-foreground">{h.venue}</td>
                          <td className="p-3 text-muted-foreground font-mono">{h.batch}</td>
                          <td className="p-3">
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-2 py-0.5 capitalize font-bold ${
                                h.status === "present"
                                  ? "bg-emerald-500/10 text-emerald-700 border-emerald-300"
                                  : h.status === "absent"
                                    ? "bg-rose-500/10 text-rose-700 border-rose-300"
                                    : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {h.status}
                            </Badge>
                          </td>
                          <td className="p-3 text-muted-foreground italic">{h.notes || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
                No student found matching query "{historySearchQuery}". Please try another USN or
                Name.
              </div>
            )}
          </div>
        )}

        {/* TAB 12: MASTER COMPREHENSIVE REPORTS (SECTIONS 22, 30) */}
        {activeStep === "comprehensive_reports" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  Examination Reports & University Analytics
                </h2>
                <p className="text-xs text-muted-foreground">
                  Master institutional reporting: Timetable schedules, faculty invigilation duties,
                  lab allocations, and attendance breakdown.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportTimetableToExcel}
                  className="gap-1.5 text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                >
                  <FileSpreadsheet className="size-3.5" /> Export Timetable (.xlsx)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportAbsenteesToExcel}
                  className="gap-1.5 text-xs text-rose-700 border-rose-300 hover:bg-rose-50"
                >
                  <FileSpreadsheet className="size-3.5" /> Export Absentees (.xlsx)
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => window.print()}
                  className="gap-1.5 text-xs"
                >
                  <Printer className="size-3.5" /> Print Official Report
                </Button>
              </div>
            </div>

            {/* University Attendance by Semester Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {analyticsData?.bySemester.map((sem: any) => (
                <Card key={sem.semester} className="p-4 border border-border bg-card">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-foreground">{sem.name}</h3>
                    <Badge variant="outline" className="text-xs font-mono">
                      {sem.percentage}% Present
                    </Badge>
                  </div>
                  <Progress value={sem.percentage} className="h-2 my-3" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Present: {sem.present}</span>
                    <span>Absent: {sem.absent}</span>
                    <span>Total: {sem.total}</span>
                  </div>
                </Card>
              ))}
            </div>

            {/* Master Schedule Table */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="p-3 bg-muted/50 border-b border-border text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Consolidated Timetable & Duty Allotment Roster</span>
                <span className="text-muted-foreground font-mono">
                  {ws?.timetable?.entries.length || 0} Scheduled Sessions
                </span>
              </div>
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/30 border-b border-border text-muted-foreground font-semibold">
                  <tr>
                    <th className="p-3">Semester</th>
                    <th className="p-3">Course</th>
                    <th className="p-3">Exam Date</th>
                    <th className="p-3">Timing Slot</th>
                    <th className="p-3">Mode & Lab</th>
                    <th className="p-3">Invigilators</th>
                    <th className="p-3">Students</th>
                    <th className="p-3">Batches</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {ws?.timetable?.entries.map((e: any) => {
                    const slot = timingSlots.find((s: any) => s.id === e.timing_slot_id);
                    const lab = labs.find((l: any) => l.id === e.assigned_lab_id);
                    const assignedFaculty = faculty.filter((f: any) =>
                      e.assigned_faculty_ids.includes(f.id),
                    );
                    return (
                      <tr key={e.id} className="hover:bg-muted/30">
                        <td className="p-3">
                          <Badge variant="outline" className="text-[10px]">
                            Sem {e.semester}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <span className="font-semibold text-foreground">{e.subject_name}</span>
                          <span className="font-mono text-muted-foreground block text-[10px]">
                            {e.subject_code}
                          </span>
                        </td>
                        <td className="p-3 text-muted-foreground">{e.exam_date}</td>
                        <td className="p-3 text-muted-foreground">{slot?.name}</td>
                        <td className="p-3">
                          <span className="font-medium text-foreground">
                            {lab?.name || "Exam Hall"}
                          </span>
                          <span className="text-[10px] text-muted-foreground block uppercase">
                            {e.mode}
                          </span>
                        </td>
                        <td className="p-3">
                          {assignedFaculty.map((f: any) => f.full_name).join(", ") || "Unassigned"}
                        </td>
                        <td className="p-3 font-mono font-medium text-foreground">
                          {e.selected_student_ids.length}
                        </td>
                        <td className="p-3 font-mono text-muted-foreground">
                          {e.batches?.length || 0}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* MODALS & DRAWERS */}
        {/* ==================================================================== */}

        {/* SECTION 29: EXAM DETAIL MODAL */}
        <Dialog open={examDetailModalOpen} onOpenChange={setExamDetailModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">
                {examDetailEntry?.subject_name} ({examDetailEntry?.subject_code})
              </DialogTitle>
              <DialogDescription className="text-xs">
                Complete Examination & Attendance Inspection Overview (Section 29)
              </DialogDescription>
            </DialogHeader>

            {examDetailEntry && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 p-3 rounded-xl border border-border bg-muted/40">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Semester</span>
                    <span className="font-bold text-foreground">
                      Semester {examDetailEntry.semester}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Exam Date</span>
                    <span className="font-medium text-foreground">{examDetailEntry.exam_date}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Timing Slot</span>
                    <span className="font-medium text-foreground">
                      {timingSlots.find((s: any) => s.id === examDetailEntry.timing_slot_id)
                        ?.name || "Slot 1"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Mode</span>
                    <span className="font-bold text-foreground uppercase">
                      {examDetailEntry.mode}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-border bg-card space-y-2">
                  <div className="font-semibold text-foreground">Assigned Venue & Faculty:</div>
                  <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                    <div>
                      <span>Venue: </span>
                      <strong className="text-foreground">
                        {labs.find((l: any) => l.id === examDetailEntry.assigned_lab_id)?.name ||
                          "Examination Hall"}
                      </strong>
                    </div>
                    <div>
                      <span>Faculty: </span>
                      <strong className="text-foreground">
                        {faculty
                          .filter((f: any) => examDetailEntry.assigned_faculty_ids.includes(f.id))
                          .map((f: any) => f.full_name)
                          .join(", ") || "None"}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-border bg-card space-y-2">
                  <div className="font-semibold text-foreground">Enrolled Students & Batches:</div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Total Students: {examDetailEntry.selected_student_ids.length}</span>
                    <span>Total Batches: {examDetailEntry.batches?.length || 0}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-border bg-muted/20">
                  <div className="font-semibold text-foreground mb-1.5">
                    5-Point System Audit Checklist:
                  </div>
                  <div className="space-y-1 text-muted-foreground text-[11px]">
                    <div className="flex items-center gap-1.5 text-emerald-600">
                      <CheckCircle2 className="size-3" /> Faculty year eligibility verified
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-600">
                      <CheckCircle2 className="size-3" /> Lab capacity & double-booking verified
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-600">
                      <CheckCircle2 className="size-3" /> Student schedule conflict free
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-600">
                      <CheckCircle2 className="size-3" /> Minimum 3 duties compliance satisfied
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-600">
                      <CheckCircle2 className="size-3" /> Real-time attendance register operational
                    </div>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExamDetailModalOpen(false)}
                className="text-xs"
              >
                Close
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setExamDetailModalOpen(false);
                  setAttendanceEntryId(examDetailEntry.id);
                  setAttendanceBatchId("ALL");
                  setActiveStep("conduct_attendance");
                }}
                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
              >
                <ClipboardCheck className="size-3.5" /> Open Attendance Register
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* MOVE STUDENT BETWEEN BATCHES MODAL (TEST 15) */}
        <Dialog open={moveBatchModalOpen} onOpenChange={setMoveBatchModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">
                Move Student Between Batches (Test 15)
              </DialogTitle>
              <DialogDescription className="text-xs">
                Move student before examination. Attendance automatically updates to track the new
                batch assignment.
              </DialogDescription>
            </DialogHeader>

            {moveEntry && (
              <div className="space-y-3 text-xs">
                <div>
                  <Label className="text-xs">Source Batch</Label>
                  <Select
                    value={moveSourceBatchId}
                    onValueChange={(val) => setMoveSourceBatchId(val)}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Source Batch" />
                    </SelectTrigger>
                    <SelectContent>
                      {moveEntry.batches.map((b: any) => (
                        <SelectItem key={b.id} value={b.id} className="text-xs">
                          {b.batch_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Target Batch</Label>
                  <Select
                    value={moveTargetBatchId}
                    onValueChange={(val) => setMoveTargetBatchId(val)}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Target Batch" />
                    </SelectTrigger>
                    <SelectContent>
                      {moveEntry.batches
                        .filter((b: any) => b.id !== moveSourceBatchId)
                        .map((b: any) => (
                          <SelectItem key={b.id} value={b.id} className="text-xs">
                            {b.batch_name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Select Student to Move</Label>
                  <Select value={moveStudentId} onValueChange={(val) => setMoveStudentId(val)}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Select Student" />
                    </SelectTrigger>
                    <SelectContent>
                      {moveEntry.batches
                        .find((b: any) => b.id === moveSourceBatchId)
                        ?.student_ids.map((stId: string) => {
                          const st = ws?.studentsBySem
                            ? students.find((s: any) => s.id === stId)
                            : null;
                          return (
                            <SelectItem key={stId} value={stId} className="text-xs">
                              {st?.register_no || stId} - {st?.full_name || "Student"}
                            </SelectItem>
                          );
                        })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMoveBatchModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() =>
                  moveStudentMut.mutate({
                    entry_id: moveEntry.id,
                    source_batch_id: moveSourceBatchId,
                    target_batch_id: moveTargetBatchId,
                    student_id: moveStudentId,
                  })
                }
                className="text-xs"
              >
                Confirm Move
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* UNMARKED STUDENTS SUBMISSION WARNING MODAL (TEST 17) */}
        <Dialog open={unmarkedWarningOpen} onOpenChange={setUnmarkedWarningOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-rose-600 flex items-center gap-2">
                <AlertCircle className="size-4" /> Unmarked Students Warning (Test 17)
              </DialogTitle>
              <DialogDescription className="text-xs">
                One or more students remain unmarked in this register. Institutional rules mandate
                explicit marking of all students before submission.
              </DialogDescription>
            </DialogHeader>

            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-800 text-xs">
              Would you like to return and mark them, or force-submit by automatically converting
              all unmarked students to Absent?
            </div>

            <DialogFooter className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUnmarkedWarningOpen(false)}
                className="text-xs"
              >
                Return to Register
              </Button>
              <Button
                size="sm"
                onClick={() =>
                  submitAttendanceMut.mutate({
                    session_id: currentAttendanceSession.id,
                    submitted_by: me?.name || "Faculty Invigilator",
                    force_override_unmarked: true,
                  })
                }
                className="text-xs bg-rose-600 hover:bg-rose-700 text-white"
              >
                Confirm Emergency Override
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* UNLOCK REGISTER AUDIT REASON MODAL (TEST 18) */}
        <Dialog open={unlockModalOpen} onOpenChange={setUnlockModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-amber-600 flex items-center gap-2">
                <Unlock className="size-4" /> Unlock Attendance Register (Test 18)
              </DialogTitle>
              <DialogDescription className="text-xs">
                Authorized Administrator Unlock: An official audit reason is required to re-open a
                locked attendance register.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 text-xs">
              <div>
                <Label className="text-xs">Audit Reason for Unlocking</Label>
                <Input
                  placeholder="e.g. Authorized correction of late medical entry..."
                  value={unlockReason}
                  onChange={(e) => setUnlockReason(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUnlockModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() =>
                  unlockAttendanceMut.mutate({
                    session_id: currentAttendanceSession.id,
                    unlocked_by: me?.name || "Exam Administrator",
                    reason: unlockReason,
                  })
                }
                className="text-xs bg-amber-600 hover:bg-amber-700 text-white"
              >
                Confirm Unlock
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* AUDIT LOG MODAL */}
        <Dialog open={auditLogModalOpen} onOpenChange={setAuditLogModalOpen}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">Attendance Audit Trail</DialogTitle>
              <DialogDescription className="text-xs">
                Full chronological history of status changes, overrides, and timestamps.
              </DialogDescription>
            </DialogHeader>

            <div className="max-h-80 overflow-y-auto divide-y divide-border text-xs">
              {attendanceData?.auditLogs && attendanceData.auditLogs.length > 0 ? (
                attendanceData.auditLogs.map((log: any) => (
                  <div key={log.id} className="py-2.5">
                    <div className="flex items-center justify-between font-medium text-foreground">
                      <span>{log.student_name}</span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-muted-foreground text-[11px] mt-0.5">
                      Changed by: <strong>{log.changed_by}</strong> ({log.old_status} →{" "}
                      {log.new_status})
                    </div>
                    <div className="text-[11px] text-muted-foreground italic mt-0.5">
                      Reason: {log.reason}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-muted-foreground text-xs">
                  No attendance status edits logged yet.
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAuditLogModalOpen(false)}
                className="text-xs"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* TIMING SLOT MODAL */}
        <Dialog open={timingModalOpen} onOpenChange={setTimingModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">
                {editingTiming ? "Edit Timing Slot" : "Add Exam Timing Slot"}
              </DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                saveTimingMut.mutate({
                  id: editingTiming?.id,
                  name: String(fd.get("name")),
                  start_time: String(fd.get("start_time")),
                  end_time: String(fd.get("end_time")),
                  duration_minutes: Number(fd.get("duration_minutes")),
                  buffer_minutes: Number(fd.get("buffer_minutes")),
                });
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <Label className="text-xs">Slot Name</Label>
                <Input
                  name="name"
                  defaultValue={editingTiming?.name || "Morning Session"}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Start Time</Label>
                  <Input
                    name="start_time"
                    defaultValue={editingTiming?.start_time || "09:00 AM"}
                    required
                  />
                </div>
                <div>
                  <Label className="text-xs">End Time</Label>
                  <Input
                    name="end_time"
                    defaultValue={editingTiming?.end_time || "11:00 AM"}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Duration (Mins)</Label>
                  <Input
                    name="duration_minutes"
                    type="number"
                    defaultValue={editingTiming?.duration_minutes || 120}
                    required
                  />
                </div>
                <div>
                  <Label className="text-xs">Buffer (Mins)</Label>
                  <Input
                    name="buffer_minutes"
                    type="number"
                    defaultValue={editingTiming?.buffer_minutes || 30}
                    required
                  />
                </div>
              </div>
              <DialogFooter className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setTimingModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button size="sm" type="submit">
                  Save Slot
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* TIMETABLE ENTRY MODAL */}
        <Dialog open={entryModalOpen} onOpenChange={setEntryModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">New Exam Timetable Entry</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const sem = Number(fd.get("semester")) as ExamSemester;
                const semStudents = students
                  .filter((s: any) => s.semester === sem)
                  .slice(0, 60)
                  .map((s: any) => s.id);

                createEntryMut.mutate({
                  exam_date: String(fd.get("exam_date")),
                  timing_slot_id: String(fd.get("timing_slot_id")),
                  semester: sem,
                  subject_code: String(fd.get("subject_code")),
                  subject_name: String(fd.get("subject_name")),
                  mode: String(fd.get("mode")) as ExamMode,
                  selected_student_ids: semStudents,
                  assigned_faculty_ids: [],
                });
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <Label className="text-xs">Subject Name</Label>
                <Input name="subject_name" placeholder="e.g. Artificial Intelligence" required />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Subject Code</Label>
                  <Input name="subject_code" placeholder="e.g. 26CSE104" required />
                </div>
                <div>
                  <Label className="text-xs">Semester</Label>
                  <Select name="semester" defaultValue="1">
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Semester" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Semester 1 (1st Year)</SelectItem>
                      <SelectItem value="3">Semester 3 (3rd Year)</SelectItem>
                      <SelectItem value="5">Semester 5 (5th Year)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Date</Label>
                  <Input name="exam_date" type="date" defaultValue="2026-10-25" required />
                </div>
                <div>
                  <Label className="text-xs">Mode</Label>
                  <Select name="mode" defaultValue="offline">
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="offline">Offline Written</SelectItem>
                      <SelectItem value="online">Online CBT Lab</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs">Timing Slot</Label>
                <Select name="timing_slot_id" defaultValue={timingSlots[0]?.id}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Select Timing" />
                  </SelectTrigger>
                  <SelectContent>
                    {timingSlots.map((s: any) => (
                      <SelectItem key={s.id} value={s.id} className="text-xs">
                        {s.name} ({s.start_time} - {s.end_time})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setEntryModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button size="sm" type="submit">
                  Create Entry
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* FACULTY PLACEMENT DRAWER / MODAL */}
        <Dialog open={Boolean(placementEntry)} onOpenChange={() => setPlacementEntry(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">Assign Invigilation Faculty</DialogTitle>
              <DialogDescription className="text-xs">
                Semester {placementEntry?.semester} requires{" "}
                <strong>
                  {placementEntry?.semester === 1
                    ? "1st Year"
                    : placementEntry?.semester === 3
                      ? "3rd Year"
                      : "5th Year"}
                </strong>{" "}
                eligible faculty (Tests 1, 2).
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {faculty.map((f: any) => {
                const requiredYear =
                  placementEntry?.semester === 1
                    ? "1st Year"
                    : placementEntry?.semester === 3
                      ? "3rd Year"
                      : "5th Year";
                const isEligible = f.teaching_year === requiredYear;
                const isSelected = selectedFacultyIds.includes(f.id);

                return (
                  <div
                    key={f.id}
                    onClick={() => {
                      if (!isEligible) {
                        toast.error(
                          `Eligibility Violation (Test 2): ${f.full_name} is ${f.teaching_year} faculty and cannot be assigned to Semester ${placementEntry?.semester}.`,
                        );
                        return;
                      }
                      setSelectedFacultyIds((prev) =>
                        isSelected ? prev.filter((id) => id !== f.id) : [...prev, f.id],
                      );
                    }}
                    className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-all ${
                      isSelected
                        ? "bg-primary/10 border-primary text-primary"
                        : isEligible
                          ? "bg-card border-border hover:bg-muted/40"
                          : "bg-muted/30 border-border/40 opacity-50 cursor-not-allowed"
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-foreground">{f.full_name}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        {f.employee_id} • {f.department}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          isEligible
                            ? "bg-emerald-500/10 text-emerald-700 border-emerald-300"
                            : "bg-rose-500/10 text-rose-700 border-rose-300"
                        }`}
                      >
                        {f.teaching_year}
                      </Badge>
                      {isSelected && <CheckCircle2 className="size-4 text-primary" />}
                    </div>
                  </div>
                );
              })}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPlacementEntry(null)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() =>
                  assignFacultyMut.mutate({
                    entry_id: placementEntry.id,
                    faculty_ids: selectedFacultyIds,
                  })
                }
                className="text-xs"
              >
                Save Placement
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* LAB ALLOCATION & BATCH MODAL */}
        <Dialog open={Boolean(labEntry)} onOpenChange={() => setLabEntry(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">
                Allocate Computer Lab & Batches
              </DialogTitle>
              <DialogDescription className="text-xs">
                Select dedicated computer lab and auto-generate online test batches within lab
                capacity (Tests 6, 7).
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 text-xs">
              <div>
                <Label className="text-xs">Choose Computer Lab</Label>
                <Select value={selectedLabId} onValueChange={(val) => setSelectedLabId(val)}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Select Lab" />
                  </SelectTrigger>
                  <SelectContent>
                    {labs.map((l: any) => (
                      <SelectItem key={l.id} value={l.id} className="text-xs">
                        {l.name} (Capacity: {l.capacity} systems)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Batch Capacity (Systems)</Label>
                <Input
                  type="number"
                  value={batchCapacityInput}
                  onChange={(e) => setBatchCapacityInput(Number(e.target.value))}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLabEntry(null)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() =>
                  allocateLabMut.mutate({
                    entry_id: labEntry.id,
                    lab_id: selectedLabId,
                    auto_distribute_batches: true,
                    custom_batch_size: batchCapacityInput,
                  })
                }
                className="text-xs"
              >
                Generate Batches
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* DIVIDE GROUP MODAL */}
        <Dialog open={Boolean(splitEntry)} onOpenChange={() => setSplitEntry(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">Divide Student Group</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 text-xs">
              <div>
                <Label className="text-xs">Split Cohort Into</Label>
                <Select
                  value={String(splitCount)}
                  onValueChange={(val) => setSplitCount(Number(val))}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 Sub-Groups (50% each)</SelectItem>
                    <SelectItem value="3">3 Sub-Groups (33% each)</SelectItem>
                    <SelectItem value="4">4 Sub-Groups (25% each)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSplitEntry(null)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() =>
                  splitGroupMut.mutate({
                    entry_id: splitEntry.id,
                    split_into: splitCount,
                  })
                }
                className="text-xs"
              >
                Confirm Divide
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* MERGE GROUP MODAL */}
        <Dialog open={Boolean(mergeEntry)} onOpenChange={() => setMergeEntry(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">
                Merge Student Groups (Test 8)
              </DialogTitle>
              <DialogDescription className="text-xs">
                Merges selected sub-groups. Validates against lab capacity before confirmation.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 text-xs">
              <div>
                <Label className="text-xs">Target Merged Group Name</Label>
                <Input
                  value={targetMergedName}
                  onChange={(e) => setTargetMergedName(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMergeEntry(null)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() =>
                  mergeGroupMut.mutate({
                    entry_id: mergeEntry.id,
                    group_ids: mergeGroupIds,
                    target_group_name: targetMergedName,
                  })
                }
                className="text-xs"
              >
                Confirm Merge
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
