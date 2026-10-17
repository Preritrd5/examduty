// @ts-nocheck
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  GraduationCap,
  Laptop,
  Layers,
  Monitor,
  AlertTriangle,
  PlusCircle,
  Printer,
  RefreshCw,
  Search,
  ShieldAlert,
  Users,
  XCircle,
  FileSpreadsheet,
  Megaphone,
  CalendarDays,
  Info,
  ChevronRight,
  ArrowUpDown,
  MoveRight,
  Cpu,
  Eye,
  CalendarRange,
  Edit,
  Trash2,
  Plus,
  Send,
  Check,
} from "lucide-react";

import { AppShell, useMe } from "@/components/AppShell";
import { Interactive3DCard } from "@/components/Interactive3DCard";
import { HolographicOperationsGlobe } from "@/components/HolographicOperationsGlobe";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  listScheduledTests,
  getTestDetails,
  createScheduledTest,
  rescheduleScheduledTest,
  cancelScheduledTest,
  listComputerLabs,
  autoAllocateStudentsToLabs,
  reallocateStudentSeat,
  getStudentStrengthSummary,
  getExaminationDashboardMetrics,
  getExaminationCalendarEvents,
  getExaminationReportsData,
  listTestNotifications,
  broadcastTestNotice,
  calculateInfrastructureRequirements,
  updateStudentStrengthMatrix,
  createDepartmentStrengthRecord,
  createComputerLab,
  updateComputerLab,
  addManualLabAllocation,
  updateLabAllocation,
  deleteLabAllocation,
  updateScheduledTest,
  broadcastTimetableNotification,
  listOfficialReportNotes,
  addCustomReportNote,
  type DepartmentStrength,
  type SectionStrength,
  type ComputerLab,
  type StudentLabSeat,
} from "@/lib/test-management.functions";

export const Route = createFileRoute("/_authenticated/test-management")({
  head: () => ({
    meta: [
      { title: "Test & Lab Examination Management — InvigilateOS" },
      {
        name: "description",
        content:
          "Complete examination and computer lab test operations: student strength, required labs calculation, lab allocation, live tracking, and official reports.",
      },
      { property: "og:title", content: "Test & Lab Examination Management — InvigilateOS" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: TestManagementPage,
});

const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#6366f1"];

function TestManagementPage() {
  const qc = useQueryClient();
  const { data: me } = useMe();
  const isAdmin = Boolean(me?.isAdmin);

  // Server functions
  const listTestsFn = useServerFn(listScheduledTests);
  const getTestDetailsFn = useServerFn(getTestDetails);
  const createTestFn = useServerFn(createScheduledTest);
  const rescheduleTestFn = useServerFn(rescheduleScheduledTest);
  const cancelTestFn = useServerFn(cancelScheduledTest);
  const listLabsFn = useServerFn(listComputerLabs);
  const autoAllocateFn = useServerFn(autoAllocateStudentsToLabs);
  const reallocateSeatFn = useServerFn(reallocateStudentSeat);
  const strengthFn = useServerFn(getStudentStrengthSummary);
  const metricsFn = useServerFn(getExaminationDashboardMetrics);
  const calendarFn = useServerFn(getExaminationCalendarEvents);
  const reportsFn = useServerFn(getExaminationReportsData);
  const notifsFn = useServerFn(listTestNotifications);
  const broadcastNoticeFn = useServerFn(broadcastTestNotice);
  const updateStrengthFn = useServerFn(updateStudentStrengthMatrix);
  const createDeptStrengthFn = useServerFn(createDepartmentStrengthRecord);
  const createLabFn = useServerFn(createComputerLab);
  const updateLabFn = useServerFn(updateComputerLab);
  const addManualAllocFn = useServerFn(addManualLabAllocation);
  const updateAllocFn = useServerFn(updateLabAllocation);
  const deleteAllocFn = useServerFn(deleteLabAllocation);
  const updateTestFn = useServerFn(updateScheduledTest);
  const broadcastTimetableFn = useServerFn(broadcastTimetableNotification);
  const listNotesFn = useServerFn(listOfficialReportNotes);
  const addReportNoteFn = useServerFn(addCustomReportNote);

  // Queries
  const { data: tests = [], isLoading: loadingTests } = useQuery({
    queryKey: ["scheduled-tests"],
    queryFn: () => listTestsFn(),
    refetchInterval: 12000,
  });

  const { data: labs = [], isLoading: loadingLabs } = useQuery({
    queryKey: ["computer-labs"],
    queryFn: () => listLabsFn(),
    refetchInterval: 15000,
  });

  const { data: strengthData } = useQuery({
    queryKey: ["student-strength"],
    queryFn: () => strengthFn(),
    refetchInterval: 15000,
  });

  const { data: metrics } = useQuery({
    queryKey: ["test-dashboard-metrics"],
    queryFn: () => metricsFn(),
    refetchInterval: 10000,
  });

  const { data: calendarEvents = [] } = useQuery({
    queryKey: ["exam-calendar-events"],
    queryFn: () => calendarFn(),
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ["test-notifications"],
    queryFn: () => notifsFn(),
    refetchInterval: 10000,
  });

  const { data: reportNotes = [] } = useQuery({
    queryKey: ["official-report-notes"],
    queryFn: () => listNotesFn(),
  });

  // Active Tab
  const [activeTab, setActiveTab] = useState<string>("overview");

  // Filters for Tests table
  const [testSearch, setTestSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modeFilter, setModeFilter] = useState("all");

  // Schedule Test Modal State
  const [openScheduleModal, setOpenScheduleModal] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    name: "",
    subject_code: "",
    subject_name: "",
    exam_type: "internal",
    department: "Computer Science",
    course: "B.Tech Computer Science",
    batch: "2024-2028",
    section: "A, B",
    exam_date: new Date().toISOString().slice(0, 10),
    start_time: "10:00 AM",
    end_time: "11:30 AM",
    duration_minutes: 90,
    mode: "online",
    total_eligible: 120,
    registered_count: 120,
    expected_writing: 120,
    assigned_lab_ids: [] as string[],
    special_instructions: "",
  });

  // Reschedule Modal State
  const [rescheduleTarget, setRescheduleTarget] = useState<any>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleStart, setRescheduleStart] = useState("");
  const [rescheduleEnd, setRescheduleEnd] = useState("");
  const [rescheduleReason, setRescheduleReason] = useState("");

  // Inspect Test Modal State
  const [inspectTestId, setInspectTestId] = useState<string | null>(null);
  const { data: inspectedTestDetails } = useQuery({
    queryKey: ["test-details", inspectTestId],
    queryFn: () => getTestDetailsFn({ data: { testId: inspectTestId! } }),
    enabled: Boolean(inspectTestId),
  });

  // Lab Allocation Desk State
  const [selectedAllocationTestId, setSelectedAllocationTestId] = useState<string>(tests[0]?.id || "test-1");
  const activeAllocationTest = useMemo(() => {
    return tests.find((t) => t.id === selectedAllocationTestId) || tests[0];
  }, [tests, selectedAllocationTestId]);

  const { data: allocationTestDetails, refetch: refetchAllocations } = useQuery({
    queryKey: ["allocation-details", activeAllocationTest?.id],
    queryFn: () => getTestDetailsFn({ data: { testId: activeAllocationTest?.id } }),
    enabled: Boolean(activeAllocationTest?.id),
  });

  const [selectedLabsForAutoAlloc, setSelectedLabsForAutoAlloc] = useState<string[]>([]);
  const [seatSearch, setSeatSearch] = useState("");
  const [reallocateModalItem, setReallocateModalItem] = useState<any>(null);
  const [targetReallocateLab, setTargetReallocateLab] = useState<string>("");

  // Live Calculator State
  const [calcWritingCount, setCalcWritingCount] = useState(240);
  const [calcLabCap, setCalcLabCap] = useState(40);
  const [calcRoomCap, setCalcRoomCap] = useState(30);
  const [calcAvailLabs, setCalcAvailLabs] = useState(5);
  const [calcAvailRooms, setCalcAvailRooms] = useState(10);

  const dynamicCalc = useMemo(() => {
    return calculateInfrastructureRequirements({
      studentsWriting: calcWritingCount,
      labCapacity: calcLabCap,
      classroomCapacity: calcRoomCap,
      availableLabsCount: calcAvailLabs,
      availableClassroomsCount: calcAvailRooms,
    });
  }, [calcWritingCount, calcLabCap, calcRoomCap, calcAvailLabs, calcAvailRooms]);

  // Reports State
  const [selectedReport, setSelectedReport] = useState<string>("student_strength");
  const { data: reportRows = [] } = useQuery({
    queryKey: ["reports-data", selectedReport],
    queryFn: () => reportsFn({ data: { reportType: selectedReport } }),
  });

  // Broadcast Notice State
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeMessage, setNoticeMessage] = useState("");
  const [noticeAudience, setNoticeAudience] = useState("all");

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => createTestFn({ data }),
    onSuccess: () => {
      toast.success("Examination successfully scheduled & notification dispatched!");
      setOpenScheduleModal(false);
      qc.invalidateQueries({ queryKey: ["scheduled-tests"] });
      qc.invalidateQueries({ queryKey: ["test-dashboard-metrics"] });
      qc.invalidateQueries({ queryKey: ["exam-calendar-events"] });
      qc.invalidateQueries({ queryKey: ["test-notifications"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rescheduleMutation = useMutation({
    mutationFn: (data: any) => rescheduleTestFn({ data }),
    onSuccess: () => {
      toast.success("Examination rescheduled & announcement sent to all candidates!");
      setRescheduleTarget(null);
      qc.invalidateQueries({ queryKey: ["scheduled-tests"] });
      qc.invalidateQueries({ queryKey: ["test-dashboard-metrics"] });
      qc.invalidateQueries({ queryKey: ["exam-calendar-events"] });
      qc.invalidateQueries({ queryKey: ["test-notifications"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const cancelMutation = useMutation({
    mutationFn: (testId: string) => cancelTestFn({ data: { testId, reason: "Cancelled by Exam Cell Admin" } }),
    onSuccess: () => {
      toast.success("Examination cancelled & seats released.");
      qc.invalidateQueries({ queryKey: ["scheduled-tests"] });
      qc.invalidateQueries({ queryKey: ["test-dashboard-metrics"] });
      qc.invalidateQueries({ queryKey: ["exam-calendar-events"] });
      qc.invalidateQueries({ queryKey: ["test-notifications"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const autoAllocateMutation = useMutation({
    mutationFn: ({ testId, labIds }: { testId: string; labIds: string[] }) =>
      autoAllocateFn({ data: { testId, labIds } }),
    onSuccess: (res) => {
      toast.success(`Success: Allocated ${res.allocated_count} students across ${res.labs_used} computer labs with PC numbers!`);
      refetchAllocations();
      qc.invalidateQueries({ queryKey: ["scheduled-tests"] });
      qc.invalidateQueries({ queryKey: ["computer-labs"] });
      qc.invalidateQueries({ queryKey: ["student-strength"] });
      qc.invalidateQueries({ queryKey: ["test-notifications"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reallocateSeatMutation = useMutation({
    mutationFn: (data: any) => reallocateSeatFn({ data }),
    onSuccess: () => {
      toast.success("Candidate seat reallocated successfully!");
      setReallocateModalItem(null);
      refetchAllocations();
      qc.invalidateQueries({ queryKey: ["computer-labs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const broadcastNoticeMutation = useMutation({
    mutationFn: (data: any) => broadcastNoticeFn({ data }),
    onSuccess: () => {
      toast.success("Notice broadcasted to all portal users!");
      setNoticeTitle("");
      setNoticeMessage("");
      qc.invalidateQueries({ queryKey: ["test-notifications"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Student Strength Matrix Modal States
  const [editStrengthModalOpen, setEditStrengthModalOpen] = useState(false);
  const [editingDeptStrength, setEditingDeptStrength] = useState<DepartmentStrength | null>(null);
  const [addDeptModalOpen, setAddDeptModalOpen] = useState(false);
  const [newDeptForm, setNewDeptForm] = useState({
    department: "",
    total_students: 60,
    eligible_students: 58,
    registered_students: 56,
    writing_students: 15,
    absent_students: 0,
    completed_students: 20,
    not_attempted: 21,
  });

  // Computer Labs Modal States
  const [addLabModalOpen, setAddLabModalOpen] = useState(false);
  const [newLabForm, setNewLabForm] = useState({
    name: "",
    code: "",
    block: "Block A",
    floor: 1,
    total_capacity: 40,
    operating_system: "Ubuntu Linux / Windows 11",
    lab_incharge: "",
    contact_phone: "",
    has_internet: true,
    has_webcam: true,
    has_ups_backup: true,
  });
  const [editLabModalOpen, setEditLabModalOpen] = useState(false);
  const [editingLab, setEditingLab] = useState<ComputerLab | null>(null);

  // Manual Lab Allocation Modal States
  const [addManualAllocModalOpen, setAddManualAllocModalOpen] = useState(false);
  const [newManualAllocForm, setNewManualAllocForm] = useState({
    test_id: "",
    student_name: "",
    register_no: "",
    department: "Computer Science",
    section: "A",
    lab_id: "",
    seat_no: "",
    status: "allocated" as "allocated" | "present" | "writing" | "completed" | "absent",
  });
  const [editAllocModalOpen, setEditAllocModalOpen] = useState(false);
  const [editingAlloc, setEditingAlloc] = useState<StudentLabSeat | null>(null);

  // Timetable Calendar Modal States
  const [addTimetableModalOpen, setAddTimetableModalOpen] = useState(false);
  const [newTimetableForm, setNewTimetableForm] = useState({
    name: "",
    subject_code: "",
    subject_name: "",
    exam_type: "internal",
    department: "Computer Science",
    course: "B.Tech Computer Science",
    batch: "2024-2028",
    section: "A, B",
    exam_date: new Date().toISOString().slice(0, 10),
    start_time: "10:00 AM",
    end_time: "11:30 AM",
    duration_minutes: 90,
    mode: "online",
    total_eligible: 120,
    registered_count: 120,
    expected_writing: 120,
    assigned_lab_ids: [] as string[],
    assigned_room_ids: [] as string[],
    special_instructions: "",
    broadcast_notice: true,
  });
  const [editTimetableModalOpen, setEditTimetableModalOpen] = useState(false);
  const [editingTimetableTest, setEditingTimetableTest] = useState<any>(null);

  // Official Report Note Modal State
  const [addReportNoteModalOpen, setAddReportNoteModalOpen] = useState(false);
  const [newReportNote, setNewReportNote] = useState("");

  // Strength Mutations
  const updateStrengthMutation = useMutation({
    mutationFn: (data: { department: string; updates: any }) => updateStrengthFn({ data }),
    onSuccess: () => {
      toast.success("Student strength matrix updated successfully!");
      setEditStrengthModalOpen(false);
      qc.invalidateQueries({ queryKey: ["student-strength"] });
      qc.invalidateQueries({ queryKey: ["reports-data"] });
      qc.invalidateQueries({ queryKey: ["test-dashboard-metrics"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const createDeptMutation = useMutation({
    mutationFn: (data: any) => createDeptStrengthFn({ data }),
    onSuccess: () => {
      toast.success("New department record added to strength matrix!");
      setAddDeptModalOpen(false);
      qc.invalidateQueries({ queryKey: ["student-strength"] });
      qc.invalidateQueries({ queryKey: ["reports-data"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Lab Mutations
  const createLabMutation = useMutation({
    mutationFn: (data: any) => createLabFn({ data }),
    onSuccess: () => {
      toast.success("New computer lab added successfully!");
      setAddLabModalOpen(false);
      qc.invalidateQueries({ queryKey: ["computer-labs"] });
      qc.invalidateQueries({ queryKey: ["test-dashboard-metrics"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateLabMutation = useMutation({
    mutationFn: (data: any) => updateLabFn({ data }),
    onSuccess: () => {
      toast.success("Computer lab details updated!");
      setEditLabModalOpen(false);
      qc.invalidateQueries({ queryKey: ["computer-labs"] });
      qc.invalidateQueries({ queryKey: ["test-dashboard-metrics"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Manual Lab Allocation Mutations
  const addManualAllocMutation = useMutation({
    mutationFn: (data: any) => addManualAllocFn({ data }),
    onSuccess: () => {
      toast.success("Student manually allocated to lab & seat!");
      setAddManualAllocModalOpen(false);
      refetchAllocations();
      qc.invalidateQueries({ queryKey: ["scheduled-tests"] });
      qc.invalidateQueries({ queryKey: ["computer-labs"] });
      qc.invalidateQueries({ queryKey: ["reports-data"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateAllocMutation = useMutation({
    mutationFn: (data: any) => updateAllocFn({ data }),
    onSuccess: () => {
      toast.success("Seat allocation updated successfully!");
      setEditAllocModalOpen(false);
      refetchAllocations();
      qc.invalidateQueries({ queryKey: ["computer-labs"] });
      qc.invalidateQueries({ queryKey: ["reports-data"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteAllocMutation = useMutation({
    mutationFn: (allocationId: string) => deleteAllocFn({ data: { allocationId } }),
    onSuccess: () => {
      toast.success("Seat allocation removed!");
      refetchAllocations();
      qc.invalidateQueries({ queryKey: ["scheduled-tests"] });
      qc.invalidateQueries({ queryKey: ["computer-labs"] });
      qc.invalidateQueries({ queryKey: ["reports-data"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Subject Timetable & Notifications Mutations
  const updateTestMutation = useMutation({
    mutationFn: (data: any) => updateTestFn({ data }),
    onSuccess: () => {
      toast.success("Subject examination timetable updated & notification synced!");
      setEditTimetableModalOpen(false);
      qc.invalidateQueries({ queryKey: ["scheduled-tests"] });
      qc.invalidateQueries({ queryKey: ["exam-calendar-events"] });
      qc.invalidateQueries({ queryKey: ["test-notifications"] });
      qc.invalidateQueries({ queryKey: ["reports-data"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const broadcastTimetableMutation = useMutation({
    mutationFn: (data: any) => broadcastTimetableFn({ data }),
    onSuccess: () => {
      toast.success("Examination timetable announcement broadcasted to all notifications!");
      qc.invalidateQueries({ queryKey: ["test-notifications"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addReportNoteMutation = useMutation({
    mutationFn: (data: any) => addReportNoteFn({ data }),
    onSuccess: () => {
      toast.success("Official certified audit note added to report!");
      setAddReportNoteModalOpen(false);
      setNewReportNote("");
      qc.invalidateQueries({ queryKey: ["official-report-notes"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Filtered Tests
  const filteredTests = useMemo(() => {
    return tests.filter((t) => {
      const q = testSearch.trim().toLowerCase();
      const matchQ =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.subject_code.toLowerCase().includes(q) ||
        t.department.toLowerCase().includes(q) ||
        (t.batch && t.batch.toLowerCase().includes(q));

      const matchDept = deptFilter === "all" || t.department === deptFilter;
      const matchStatus = statusFilter === "all" || t.status === statusFilter;
      const matchMode = modeFilter === "all" || t.mode === modeFilter;

      return matchQ && matchDept && matchStatus && matchMode;
    });
  }, [tests, testSearch, deptFilter, statusFilter, modeFilter]);

  // Export to Excel helper
  const handleExportExcel = (dataToExport: any[], fileName: string) => {
    if (!dataToExport || dataToExport.length === 0) {
      toast.error("No data to export.");
      return;
    }
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success("Excel report exported successfully!");
  };

  return (
    <AppShell
      title="Student Test & Lab Examination Operations"
      description="Centralized examination operations: live candidate tracking, lab capacity calculations, computer allocation desk, test scheduling, and institutional reports."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm" className="no-print gap-1.5">
            <Link to="/academic-calendar">
              <CalendarRange className="size-4 text-primary" />
              Academic Timeline & Milestones
            </Link>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="no-print gap-1.5"
          >
            <Printer className="size-4 text-muted-foreground" />
            Print Report
          </Button>

          {isAdmin && (
            <Button
              size="sm"
              onClick={() => setOpenScheduleModal(true)}
              className="btn-3d gap-1.5 bg-primary text-primary-foreground font-bold shadow-md"
            >
              <PlusCircle className="size-4" />
              Schedule Examination
            </Button>
          )}
        </div>
      }
    >
      {/* Official Print Header */}
      <div className="print-header mb-6">
        <h1 className="text-xl font-bold uppercase tracking-wide">
          Sapthagiri NPS University — Examination Cell Operations
        </h1>
        <p className="text-xs text-muted-foreground">
          Student Test Management & Computer Lab Allocation Matrix · Official Audit Record
        </p>
        <p className="text-[10px] text-muted-foreground">
          Report Generated: {new Date().toLocaleString()} · Portal Status: Active
        </p>
      </div>

      {/* Role Portal Isolation Indicator - 3D Holographic Card */}
      {!isAdmin ? (
        <Interactive3DCard maxRotation={6} depthOffset={10} className="no-print mb-4">
          <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-amber-600/10 p-4 text-xs text-amber-300 flex items-center justify-between shadow-lg backdrop-blur-xl card-3d">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-300 font-bold border border-amber-400/30 shadow-inner floating-3d">
                🎓
              </div>
              <div>
                <div className="flex items-center gap-2 font-bold text-amber-200">
                  <span className="text-sm">Faculty View · Read Only Access</span>
                  <Badge variant="outline" className="border-amber-500/50 text-amber-300 font-mono text-[9px] uppercase px-2 py-0.5 bg-amber-500/10">
                    Read Only Mode
                  </Badge>
                </div>
                <p className="text-[11px] text-amber-300/80 mt-0.5">
                  You have inspection rights for candidate matrices, lab allocations, schedules, and certified official reports. Only administrators have edit and creation access.
                </p>
              </div>
            </div>
            <Badge className="bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 text-xs font-semibold shadow">
              Institutional View
            </Badge>
          </div>
        </Interactive3DCard>
      ) : (
        <Interactive3DCard maxRotation={6} depthOffset={10} className="no-print mb-4">
          <div className="rounded-2xl border border-indigo-500/40 bg-gradient-to-r from-indigo-500/20 via-sky-500/10 to-indigo-600/15 p-4 text-xs text-indigo-300 flex items-center justify-between shadow-xl backdrop-blur-xl card-3d glow-pulse-indigo">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-indigo-500/25 text-indigo-200 font-bold border border-indigo-400/40 shadow-inner floating-3d">
                🛡️
              </div>
              <div>
                <div className="flex items-center gap-2 font-bold text-indigo-100">
                  <span className="text-sm">Admin Portal · Full Operational Authority</span>
                  <Badge variant="outline" className="border-indigo-400/60 text-indigo-200 font-mono text-[9px] uppercase px-2 py-0.5 bg-indigo-500/20">
                    Superuser Active
                  </Badge>
                </div>
                <p className="text-[11px] text-indigo-200/85 mt-0.5">
                  Full authority to manually add, edit, or delete student strength metrics, lab allocations, subject examination schedules, and certified reports.
                </p>
              </div>
            </div>
            <Badge className="bg-indigo-500/30 text-indigo-200 hover:bg-indigo-500/40 border border-indigo-400/40 text-xs font-semibold shadow-md">
              Operational Master
            </Badge>
          </div>
        </Interactive3DCard>
      )}

      {/* Main Tab Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="no-print overflow-x-auto pb-1">
          <TabsList className="glass inline-flex min-w-full sm:min-w-0 p-1.5 gap-1 shadow-md">
            <TabsTrigger value="overview" className="gap-1.5 text-xs">
              <Layers className="size-3.5" /> Overview & Metrics
            </TabsTrigger>
            <TabsTrigger value="tests" className="gap-1.5 text-xs">
              <Clock className="size-3.5" /> Tests & Scheduling ({tests.length})
            </TabsTrigger>
            <TabsTrigger value="strength" className="gap-1.5 text-xs">
              <Users className="size-3.5" /> Student Strength Matrix
            </TabsTrigger>
            <TabsTrigger value="labs" className="gap-1.5 text-xs">
              <Cpu className="size-3.5" /> Labs & Capacity Calculator
            </TabsTrigger>
            <TabsTrigger value="allocation" className="gap-1.5 text-xs">
              <Monitor className="size-3.5" /> Lab Allocation Desk
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-1.5 text-xs">
              <CalendarDays className="size-3.5" /> Exam Calendar
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-1.5 text-xs">
              <FileSpreadsheet className="size-3.5" /> Official Reports
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-1.5 text-xs">
              <Megaphone className="size-3.5" /> Test Notices ({notifications.length})
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* TAB 1: OVERVIEW & DASHBOARD                                        */}
        {/* ------------------------------------------------------------------ */}
        <TabsContent value="overview" className="space-y-6">
          {/* 3D Holographic Operations Radar Globe */}
          <div className="no-print">
            <HolographicOperationsGlobe
              activeExamsCount={metrics?.testsToday || tests.filter((t) => t.status === "in_progress" || t.status === "scheduled").length || 6}
              activeLabsCount={metrics?.labsAvailable || labs.length || 8}
              totalCandidates={metrics?.studentsWritingToday || metrics?.totalStudents || 1840}
            />
          </div>

          {/* Capacity Shortage Alert Banner */}
          {metrics?.capacityShortage > 0 && (
            <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-destructive flex items-center justify-between gap-4 animate-pulse card-3d">
              <div className="flex items-center gap-3">
                <ShieldAlert className="size-6 shrink-0" />
                <div>
                  <h4 className="font-bold text-sm">Infrastructure Capacity Shortage Alert!</h4>
                  <p className="text-xs opacity-90">
                    Additional {metrics.additionalLabsRequired} Computer Lab(s) and {metrics.additionalClassroomsRequired} Classroom(s) required to accommodate today's writing students.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setActiveTab("labs")}
                className="text-xs shrink-0 btn-3d"
              >
                Inspect Shortage
              </Button>
            </div>
          )}

          {/* 10 Core Metrics Grid with Interactive 3D Cards */}
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
            <Interactive3DCard maxRotation={10} depthOffset={14}>
              <Card className="card-3d h-full">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase">
                    <span>Total Students</span>
                    <GraduationCap className="size-4 text-primary" />
                  </div>
                  <div className="mt-2 text-2xl font-bold font-display text-foreground">
                    {metrics?.totalStudents ?? 500}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">100% Enrolled</p>
                </CardContent>
              </Card>
            </Interactive3DCard>

            <Interactive3DCard maxRotation={10} depthOffset={14}>
              <Card className="card-3d h-full">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase">
                    <span>Upcoming Tests</span>
                    <Calendar className="size-4 text-blue-500" />
                  </div>
                  <div className="mt-2 text-2xl font-bold font-display text-blue-600 dark:text-blue-400">
                    {metrics?.upcomingTests ?? 0}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">Scheduled sessions</p>
                </CardContent>
              </Card>
            </Interactive3DCard>

            <Interactive3DCard maxRotation={10} depthOffset={14}>
              <Card className="card-3d h-full">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase">
                    <span>Tests Today</span>
                    <Clock className="size-4 text-amber-500" />
                  </div>
                  <div className="mt-2 text-2xl font-bold font-display text-amber-600 dark:text-amber-400">
                    {metrics?.testsToday ?? 0}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">Active time-slots</p>
                </CardContent>
              </Card>
            </Interactive3DCard>

            <Interactive3DCard maxRotation={10} depthOffset={14}>
              <Card className="card-3d h-full">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase">
                    <span>Writing Today</span>
                    <Users className="size-4 text-emerald-500" />
                  </div>
                  <div className="mt-2 text-2xl font-bold font-display text-emerald-600 dark:text-emerald-400">
                    {metrics?.studentsWritingToday ?? 0}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">Candidates writing</p>
                </CardContent>
              </Card>
            </Interactive3DCard>

            <Interactive3DCard maxRotation={10} depthOffset={14}>
              <Card className="card-3d h-full">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase">
                    <span>Labs Required</span>
                    <Monitor className="size-4 text-indigo-500" />
                  </div>
                  <div className="mt-2 text-2xl font-bold font-display text-indigo-600 dark:text-indigo-400">
                    {metrics?.labsRequired ?? 0}{" "}
                    <span className="text-xs text-muted-foreground font-normal">
                      / {metrics?.labsAvailable ?? 10} Avail
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {metrics?.additionalLabsRequired > 0
                      ? `⚠️ Deficit: ${metrics.additionalLabsRequired}`
                      : "✓ Capacity Sufficient"}
                  </p>
                </CardContent>
              </Card>
            </Interactive3DCard>

            <Interactive3DCard maxRotation={10} depthOffset={14}>
              <Card className="card-3d h-full">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase">
                    <span>Labs Available</span>
                    <Cpu className="size-4 text-cyan-500" />
                  </div>
                  <div className="mt-2 text-2xl font-bold font-display text-foreground">
                    {metrics?.labsAvailable ?? 10}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">400 Total PC systems</p>
                </CardContent>
              </Card>
            </Interactive3DCard>

            <Interactive3DCard maxRotation={10} depthOffset={14}>
              <Card className="card-3d h-full">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase">
                    <span>Rooms Required</span>
                    <Building2 className="size-4 text-purple-500" />
                  </div>
                  <div className="mt-2 text-2xl font-bold font-display text-purple-600 dark:text-purple-400">
                    {metrics?.classroomsRequired ?? 0}{" "}
                    <span className="text-xs text-muted-foreground font-normal">
                      / {metrics?.classroomsAvailable ?? 40} Avail
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">Offline theory halls</p>
                </CardContent>
              </Card>
            </Interactive3DCard>

            <Interactive3DCard maxRotation={10} depthOffset={14}>
              <Card className="card-3d h-full">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase">
                    <span>Rooms Available</span>
                    <Building2 className="size-4 text-muted-foreground" />
                  </div>
                  <div className="mt-2 text-2xl font-bold font-display text-foreground">
                    {metrics?.classroomsAvailable ?? 40}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">Halls across 5 floors</p>
                </CardContent>
              </Card>
            </Interactive3DCard>

            <Interactive3DCard maxRotation={10} depthOffset={14}>
              <Card className="card-3d h-full">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase">
                    <span>Capacity Shortage</span>
                    <AlertTriangle className="size-4 text-rose-500" />
                  </div>
                  <div
                    className={`mt-2 text-2xl font-bold font-display ${
                      (metrics?.capacityShortage ?? 0) > 0 ? "text-rose-600" : "text-emerald-500"
                    }`}
                  >
                    {metrics?.capacityShortage ?? 0}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {(metrics?.capacityShortage ?? 0) > 0 ? "Action required" : "Zero deficit"}
                  </p>
                </CardContent>
              </Card>
            </Interactive3DCard>

            <Interactive3DCard maxRotation={10} depthOffset={14}>
              <Card className="card-3d h-full">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase">
                    <span>Completed Tests</span>
                    <CheckCircle2 className="size-4 text-emerald-500" />
                  </div>
                  <div className="mt-2 text-2xl font-bold font-display text-foreground">
                    {metrics?.completedTests ?? 0}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">Graded & concluded</p>
                </CardContent>
              </Card>
            </Interactive3DCard>
          </div>

          {/* Graphical Analytics & Live Section */}
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Visual Chart: Department Student Strength & Writing Volume */}
            <Interactive3DCard maxRotation={6} depthOffset={8} className="lg:col-span-8">
              <Card className="card-3d h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-bold flex items-center justify-between">
                    <span>Department Examination Volume & Candidate Strength</span>
                    <Badge variant="outline" className="text-xs">Live Matrix</Badge>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Comparison between total department enrollment, eligible candidates, and registered test takers.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={strengthData?.departments || []}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <XAxis dataKey="department" tick={{ fontSize: 10 }} tickLine={false} />
                        <YAxis tick={{ fontSize: 10 }} tickLine={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "var(--card)",
                            borderColor: "var(--border)",
                            borderRadius: "12px",
                            fontSize: "12px",
                          }}
                        />
                        <Bar dataKey="total_students" name="Total Strength" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="eligible_students" name="Eligible" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="writing_students" name="Writing Test" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </Interactive3DCard>

            {/* Quick Actions & Live Test Card */}
            <Interactive3DCard maxRotation={6} depthOffset={8} className="lg:col-span-4">
              <Card className="card-3d h-full flex flex-col justify-between">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Monitor className="size-4 text-primary" /> Live Test In Progress
                </CardTitle>
                <CardDescription className="text-xs">
                  Real-time exam tracking currently active in exam halls.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {tests.filter((t) => t.status === "in_progress").length > 0 ? (
                  tests
                    .filter((t) => t.status === "in_progress")
                    .map((t) => (
                      <div key={t.id} className="rounded-xl border border-border/60 bg-background/50 p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-foreground truncate">{t.name}</span>
                          <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40 text-[10px] animate-pulse">
                            LIVE
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                          <div className="rounded bg-muted/40 p-1.5">
                            <span className="block text-[10px] text-muted-foreground uppercase font-bold">Writing</span>
                            <span className="font-bold text-emerald-600">{t.actual_writing}</span>
                          </div>
                          <div className="rounded bg-muted/40 p-1.5">
                            <span className="block text-[10px] text-muted-foreground uppercase font-bold">Absent</span>
                            <span className="font-bold text-rose-500">{t.absent_count}</span>
                          </div>
                          <div className="rounded bg-muted/40 p-1.5">
                            <span className="block text-[10px] text-muted-foreground uppercase font-bold">Duration</span>
                            <span className="font-bold text-foreground">{t.duration_minutes}m</span>
                          </div>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">
                          Venues: Labs 1, 2, 3 · {t.start_time} - {t.end_time}
                        </p>
                      </div>
                    ))
                ) : (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    No examination is currently in progress.
                  </div>
                )}

                {/* Direct Shortcut Buttons */}
                <div className="space-y-2 pt-2 border-t border-border/40">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-between text-xs"
                    onClick={() => setActiveTab("allocation")}
                  >
                    <span className="flex items-center gap-1.5">
                      <Monitor className="size-3.5 text-primary" /> Open Lab Allocation Desk
                    </span>
                    <ChevronRight className="size-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-between text-xs"
                    onClick={() => setActiveTab("labs")}
                  >
                    <span className="flex items-center gap-1.5">
                      <Cpu className="size-3.5 text-indigo-500" /> Calculate Lab Capacity Shortage
                    </span>
                    <ChevronRight className="size-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Interactive3DCard>
          </div>
        </TabsContent>

        {/* ------------------------------------------------------------------ */}
        {/* TAB 2: TESTS & SCHEDULING                                          */}
        {/* ------------------------------------------------------------------ */}
        <TabsContent value="tests" className="space-y-4">
          {/* Search and Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/40 bg-card/60 p-4">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search test name, code, batch..."
                  value={testSearch}
                  onChange={(e) => setTestSearch(e.target.value)}
                  className="pl-9 h-9 text-xs"
                />
              </div>

              {/* Department filter */}
              <Select value={deptFilter} onValueChange={setDeptFilter}>
                <SelectTrigger className="h-9 w-40 text-xs">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="Computer Science">Computer Science</SelectItem>
                  <SelectItem value="Electrical">Electrical</SelectItem>
                  <SelectItem value="Mechanical">Mechanical</SelectItem>
                  <SelectItem value="Civil">Civil</SelectItem>
                  <SelectItem value="Electronics">Electronics</SelectItem>
                </SelectContent>
              </Select>

              {/* Mode filter */}
              <Select value={modeFilter} onValueChange={setModeFilter}>
                <SelectTrigger className="h-9 w-32 text-xs">
                  <SelectValue placeholder="Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modes</SelectItem>
                  <SelectItem value="online">Online (Lab)</SelectItem>
                  <SelectItem value="offline">Offline (Halls)</SelectItem>
                </SelectContent>
              </Select>

              {/* Status filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 w-36 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="rescheduled">Rescheduled</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExportExcel(filteredTests, "Scheduled_Examinations")}
              className="text-xs gap-1.5"
            >
              <Download className="size-3.5" /> Export List
            </Button>
          </div>

          {/* Tests Table */}
          <Card className="card-3d overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Test / Examination</TableHead>
                  <TableHead>Schedule & Timing</TableHead>
                  <TableHead>Department & Batch</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead className="text-center">Eligible</TableHead>
                  <TableHead className="text-center">Registered</TableHead>
                  <TableHead className="text-center">Writing</TableHead>
                  <TableHead className="text-center">Absent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="py-12 text-center text-sm text-muted-foreground">
                      No examinations found matching your filter criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTests.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>
                        <div className="font-bold text-sm text-foreground">{t.name}</div>
                        <div className="text-[11px] text-muted-foreground font-mono">
                          {t.subject_code} · {t.exam_type.toUpperCase()}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                          <Calendar className="size-3.5 text-primary" />
                          {t.exam_date}
                        </div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="size-3 text-muted-foreground" />
                          {t.start_time} - {t.end_time} ({t.duration_minutes}m)
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-xs font-medium text-foreground">{t.department}</div>
                        <div className="text-[11px] text-muted-foreground">{t.batch} (Sec {t.section})</div>
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            t.mode === "online"
                              ? "bg-blue-500/10 text-blue-600 border-blue-500/30"
                              : "bg-purple-500/10 text-purple-600 border-purple-500/30"
                          }
                        >
                          {t.mode === "online" ? (
                            <span className="flex items-center gap-1">
                              <Laptop className="size-3" /> Online Lab
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <Building2 className="size-3" /> Offline Hall
                            </span>
                          )}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-center font-bold text-xs">{t.total_eligible}</TableCell>
                      <TableCell className="text-center font-bold text-xs text-blue-600">{t.registered_count}</TableCell>
                      <TableCell className="text-center font-bold text-xs text-emerald-600">
                        {t.status === "in_progress" ? t.actual_writing : t.expected_writing}
                      </TableCell>
                      <TableCell className="text-center font-bold text-xs text-rose-500">{t.absent_count}</TableCell>

                      <TableCell>
                        <Badge
                          className={
                            t.status === "in_progress"
                              ? "bg-emerald-500 text-white animate-pulse"
                              : t.status === "upcoming"
                              ? "bg-blue-500 text-white"
                              : t.status === "completed"
                              ? "bg-muted text-muted-foreground"
                              : t.status === "rescheduled"
                              ? "bg-amber-500 text-white"
                              : t.status === "cancelled"
                              ? "bg-rose-500 text-white"
                              : "bg-secondary text-secondary-foreground"
                          }
                        >
                          {t.status.toUpperCase()}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setInspectTestId(t.id)}
                          className="h-8 px-2 text-xs"
                          title="View Details"
                        >
                          <Eye className="size-3.5" />
                        </Button>

                        {isAdmin && t.status !== "completed" && t.status !== "cancelled" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setRescheduleTarget(t);
                                setRescheduleDate(t.exam_date);
                                setRescheduleStart(t.start_time);
                                setRescheduleEnd(t.end_time);
                              }}
                              className="h-8 px-2 text-xs text-amber-600 hover:text-amber-700"
                              title="Reschedule Examination"
                            >
                              <RefreshCw className="size-3.5" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm(`Are you sure you want to cancel "${t.name}"?`)) {
                                  cancelMutation.mutate(t.id);
                                }
                              }}
                              className="h-8 px-2 text-xs text-rose-500 hover:text-rose-700"
                              title="Cancel Examination"
                            >
                              <XCircle className="size-3.5" />
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* ------------------------------------------------------------------ */}
        {/* TAB 3: STUDENT STRENGTH MANAGEMENT MATRIX                          */}
        {/* ------------------------------------------------------------------ */}
        <TabsContent value="strength" className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            <div className="card-3d p-3 text-center">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Total Enrolled</span>
              <span className="block text-xl font-bold font-display text-foreground mt-1">
                {strengthData?.overview?.total_students ?? 500}
              </span>
            </div>
            <div className="card-3d p-3 text-center">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Active Candidates</span>
              <span className="block text-xl font-bold font-display text-emerald-600 mt-1">
                {strengthData?.overview?.active_enrolled ?? 500}
              </span>
            </div>
            <div className="card-3d p-3 text-center">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Eligible for Tests</span>
              <span className="block text-xl font-bold font-display text-blue-600 mt-1">
                {strengthData?.overview?.eligible_students ?? 480}
              </span>
            </div>
            <div className="card-3d p-3 text-center">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Registered</span>
              <span className="block text-xl font-bold font-display text-indigo-600 mt-1">
                {strengthData?.overview?.registered_students ?? 468}
              </span>
            </div>
            <div className="card-3d p-3 text-center">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Writing Tests</span>
              <span className="block text-xl font-bold font-display text-amber-500 mt-1">
                {strengthData?.overview?.writing_students ?? 116}
              </span>
            </div>
            <div className="card-3d p-3 text-center">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Absentees</span>
              <span className="block text-xl font-bold font-display text-rose-500 mt-1">
                {strengthData?.overview?.absent_students ?? 4}
              </span>
            </div>
            <div className="card-3d p-3 text-center">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Completed</span>
              <span className="block text-xl font-bold font-display text-emerald-500 mt-1">
                {strengthData?.overview?.completed_students ?? 192}
              </span>
            </div>
            <div className="card-3d p-3 text-center">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Not Yet Attempted</span>
              <span className="block text-xl font-bold font-display text-purple-500 mt-1">
                {strengthData?.overview?.not_yet_attempted ?? 156}
              </span>
            </div>
          </div>

          {/* Department & Section Student Strength Matrix */}
          <Card className="card-3d">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-bold">Academic Department & Section Strength Matrix</CardTitle>
                <CardDescription className="text-xs">
                  Automated strength calculations across enrolled, eligible, registered, present, and absent students.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setNewDeptForm({
                        department: "",
                        total_students: 60,
                        eligible_students: 58,
                        registered_students: 56,
                        writing_students: 15,
                        absent_students: 0,
                        completed_students: 20,
                        not_attempted: 21,
                      });
                      setAddDeptModalOpen(true);
                    }}
                    className="btn-3d text-xs font-bold bg-primary text-primary-foreground gap-1.5 shadow"
                  >
                    <Plus className="size-3.5" /> + Add Department Record
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportExcel(strengthData?.departments || [], "Student_Strength_Report")}
                  className="text-xs gap-1.5"
                >
                  <Download className="size-3.5" /> Export Matrix
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Academic Department</TableHead>
                    <TableHead className="text-center">Total Strength</TableHead>
                    <TableHead className="text-center">Eligible</TableHead>
                    <TableHead className="text-center">Registered</TableHead>
                    <TableHead className="text-center">Present / Writing</TableHead>
                    <TableHead className="text-center">Absent</TableHead>
                    <TableHead className="text-center">Completed</TableHead>
                    <TableHead className="text-center">Pending</TableHead>
                    <TableHead>Sectional Breakdown (A-E)</TableHead>
                    {isAdmin && <TableHead className="text-right">Action</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(strengthData?.departments || []).map((d) => (
                    <TableRow key={d.department}>
                      <TableCell className="font-bold text-sm text-foreground">
                        {d.department}
                      </TableCell>
                      <TableCell className="text-center font-bold text-xs">{d.total_students}</TableCell>
                      <TableCell className="text-center font-bold text-xs text-blue-600">{d.eligible_students}</TableCell>
                      <TableCell className="text-center font-bold text-xs text-indigo-600">{d.registered_students}</TableCell>
                      <TableCell className="text-center font-bold text-xs text-emerald-600">{d.writing_students}</TableCell>
                      <TableCell className="text-center font-bold text-xs text-rose-500">{d.absent_students}</TableCell>
                      <TableCell className="text-center font-bold text-xs text-purple-600">{d.completed_students}</TableCell>
                      <TableCell className="text-center font-bold text-xs text-muted-foreground">{d.not_attempted}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {d.sections?.map((s) => (
                            <Badge key={s.section} variant="outline" className="text-[10px] px-1.5 py-0">
                              {s.section}: {s.total}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingDeptStrength(JSON.parse(JSON.stringify(d)));
                              setEditStrengthModalOpen(true);
                            }}
                            className="h-7 px-2 text-xs text-blue-600 gap-1 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                          >
                            <Edit className="size-3" /> Edit
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ------------------------------------------------------------------ */}
        {/* TAB 4: COMPUTER LAB MANAGEMENT & CAPACITY CALCULATOR               */}
        {/* ------------------------------------------------------------------ */}
        <TabsContent value="labs" className="space-y-6">
          {/* Dynamic Interactive Capacity Calculator */}
          <Card className="card-3d border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2 text-primary">
                    <Cpu className="size-5" /> Infrastructure Requirement Calculator & Simulator
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Uses official mathematical formula: <strong>Required Labs = Ceiling(Writing / Lab Capacity)</strong> and <strong>Required Classrooms = Ceiling(Students / Classroom Capacity)</strong>.
                  </CardDescription>
                </div>
                <Badge
                  className={
                    dynamicCalc.hasLabShortage || dynamicCalc.hasRoomShortage
                      ? "bg-rose-600 text-white font-bold"
                      : "bg-emerald-600 text-white font-bold"
                  }
                >
                  {dynamicCalc.hasLabShortage || dynamicCalc.hasRoomShortage
                    ? "⚠️ CAPACITY SHORTAGE DETECTED"
                    : "✓ INFRASTRUCTURE SUFFICIENT"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Inputs Grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <div>
                  <Label className="text-xs font-bold">Students Writing Test</Label>
                  <Input
                    type="number"
                    value={calcWritingCount}
                    onChange={(e) => setCalcWritingCount(Math.max(1, parseInt(e.target.value) || 0))}
                    className="mt-1 h-9 text-xs"
                  />
                  <span className="text-[10px] text-muted-foreground">Candidate test volume</span>
                </div>

                <div>
                  <Label className="text-xs font-bold">Lab Capacity (per Lab)</Label>
                  <Input
                    type="number"
                    value={calcLabCap}
                    onChange={(e) => setCalcLabCap(Math.max(1, parseInt(e.target.value) || 40))}
                    className="mt-1 h-9 text-xs"
                  />
                  <span className="text-[10px] text-muted-foreground">Configurable systems</span>
                </div>

                <div>
                  <Label className="text-xs font-bold">Available Computer Labs</Label>
                  <Input
                    type="number"
                    value={calcAvailLabs}
                    onChange={(e) => setCalcAvailLabs(Math.max(0, parseInt(e.target.value) || 0))}
                    className="mt-1 h-9 text-xs"
                  />
                  <span className="text-[10px] text-muted-foreground">Currently open labs</span>
                </div>

                <div>
                  <Label className="text-xs font-bold">Classroom Capacity</Label>
                  <Input
                    type="number"
                    value={calcRoomCap}
                    onChange={(e) => setCalcRoomCap(Math.max(1, parseInt(e.target.value) || 30))}
                    className="mt-1 h-9 text-xs"
                  />
                  <span className="text-[10px] text-muted-foreground">Desks per hall</span>
                </div>

                <div>
                  <Label className="text-xs font-bold">Available Classrooms</Label>
                  <Input
                    type="number"
                    value={calcAvailRooms}
                    onChange={(e) => setCalcAvailRooms(Math.max(0, parseInt(e.target.value) || 0))}
                    className="mt-1 h-9 text-xs"
                  />
                  <span className="text-[10px] text-muted-foreground">Open offline halls</span>
                </div>
              </div>

              {/* Dynamic Calculation Outputs */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 border-t border-border/40 pt-4">
                <div className="rounded-xl border border-border/60 bg-card p-3">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase">Labs Required</span>
                  <span className="block text-2xl font-bold font-display text-blue-600 mt-1">
                    {dynamicCalc.labsRequired} Labs
                  </span>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Ceiling({calcWritingCount} / {calcLabCap})
                  </p>
                </div>

                <div className="rounded-xl border border-border/60 bg-card p-3">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase">Additional Labs Needed</span>
                  <span
                    className={`block text-2xl font-bold font-display mt-1 ${
                      dynamicCalc.hasLabShortage ? "text-rose-600" : "text-emerald-500"
                    }`}
                  >
                    {dynamicCalc.additionalLabsRequired} Lab(s)
                  </span>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {dynamicCalc.hasLabShortage
                      ? `Shortage of ${dynamicCalc.labCapacityShortage} systems`
                      : "0 Shortage"}
                  </p>
                </div>

                <div className="rounded-xl border border-border/60 bg-card p-3">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase">Classrooms Required</span>
                  <span className="block text-2xl font-bold font-display text-purple-600 mt-1">
                    {dynamicCalc.classroomsRequired} Rooms
                  </span>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Ceiling({calcWritingCount} / {calcRoomCap})
                  </p>
                </div>

                <div className="rounded-xl border border-border/60 bg-card p-3">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase">Additional Rooms Needed</span>
                  <span
                    className={`block text-2xl font-bold font-display mt-1 ${
                      dynamicCalc.hasRoomShortage ? "text-rose-600" : "text-emerald-500"
                    }`}
                  >
                    {dynamicCalc.additionalClassroomsRequired} Room(s)
                  </span>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {dynamicCalc.hasRoomShortage
                      ? `Shortage of ${dynamicCalc.classroomCapacityShortage} seats`
                      : "0 Shortage"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 10 Computer Labs Grid View */}
          <div>
            <h3 className="text-base font-bold mb-3 flex items-center justify-between">
              <span>Configured Examination Computer Labs ({labs.length} Centres)</span>
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setNewLabForm({
                        name: "",
                        code: `LAB-${Date.now().toString().slice(-4)}`,
                        block: "Block A",
                        floor: 1,
                        total_capacity: 40,
                        operating_system: "Ubuntu Linux / Windows 11",
                        lab_incharge: "",
                        contact_phone: "",
                        has_internet: true,
                        has_webcam: true,
                        has_ups_backup: true,
                      });
                      setAddLabModalOpen(true);
                    }}
                    className="btn-3d text-xs font-bold bg-primary text-primary-foreground gap-1.5 shadow"
                  >
                    <Plus className="size-3.5" /> + Add Computer Lab
                  </Button>
                )}
                <Badge variant="outline" className="text-xs">40 PCs Each · Total {labs.reduce((s, l) => s + (l.total_capacity || 40), 0)} Seats</Badge>
              </div>
            </h3>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {labs.map((lab) => (
                <Interactive3DCard key={lab.id} maxRotation={8} depthOffset={10}>
                  <Card className="card-3d h-full flex flex-col justify-between">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <CardTitle className="text-sm font-bold text-foreground">{lab.name}</CardTitle>
                          <CardDescription className="text-xs font-mono text-muted-foreground">
                            {lab.code} · {lab.block} (Floor {lab.floor})
                          </CardDescription>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            lab.status === "Full"
                              ? "bg-rose-500/10 text-rose-600 border-rose-500/30"
                              : "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                          }
                        >
                          {lab.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-2">
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="rounded-lg bg-muted/40 p-2">
                          <span className="block text-[10px] text-muted-foreground uppercase font-bold">Capacity</span>
                          <span className="font-bold text-foreground">{lab.total_capacity}</span>
                        </div>
                        <div className="rounded-lg bg-muted/40 p-2">
                          <span className="block text-[10px] text-muted-foreground uppercase font-bold">Assigned</span>
                          <span className="font-bold text-blue-600">{lab.currently_assigned_students || 0}</span>
                        </div>
                        <div className="rounded-lg bg-muted/40 p-2">
                          <span className="block text-[10px] text-muted-foreground uppercase font-bold">Remaining</span>
                          <span className="font-bold text-emerald-600">{lab.available_seats}</span>
                        </div>
                      </div>

                      <div className="text-[11px] text-muted-foreground space-y-1">
                        <p>💻 OS: {lab.operating_system}</p>
                        <p>👤 In-Charge: {lab.lab_incharge} ({lab.contact_phone})</p>
                        <p>⚡ UPS Backup: {lab.has_ups_backup ? "✓ Active (2hr)" : "No"} · Webcams: {lab.has_webcam ? "✓ Installed" : "No"}</p>
                      </div>

                      {isAdmin && (
                        <div className="pt-2 border-t border-border/30 flex justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingLab(JSON.parse(JSON.stringify(lab)));
                              setEditLabModalOpen(true);
                            }}
                            className="h-7 px-2 text-xs text-blue-600 gap-1 hover:bg-blue-50 dark:hover:bg-blue-950/30 btn-3d"
                          >
                            <Edit className="size-3" /> Edit Lab
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Interactive3DCard>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ------------------------------------------------------------------ */}
        {/* TAB 5: LAB ALLOCATION DESK                                         */}
        {/* ------------------------------------------------------------------ */}
        <TabsContent value="allocation" className="space-y-6">
          {/* Test Selector and 1-Click Allocation Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/40 bg-card/60 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <Label className="text-xs font-bold text-muted-foreground">Select Online Examination</Label>
                <Select
                  value={selectedAllocationTestId}
                  onValueChange={setSelectedAllocationTestId}
                >
                  <SelectTrigger className="h-9 w-72 text-xs mt-1">
                    <SelectValue placeholder="Choose scheduled test" />
                  </SelectTrigger>
                  <SelectContent>
                    {tests
                      .filter((t) => t.mode === "online")
                      .map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name} ({t.expected_writing} candidates)
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {activeAllocationTest && (
                <div className="text-xs text-muted-foreground mt-5">
                  Expected Candidates: <strong className="text-foreground">{activeAllocationTest.expected_writing}</strong> · Labs Assigned: <strong className="text-foreground">{activeAllocationTest.assigned_lab_ids?.length || 0}</strong>
                </div>
              )}
            </div>

            {isAdmin && activeAllocationTest && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setNewManualAllocForm({
                      test_id: activeAllocationTest.id,
                      student_name: "",
                      register_no: "",
                      department: activeAllocationTest.department || "Computer Science",
                      section: "A",
                      lab_id: labs[0]?.id || "lab-1",
                      seat_no: "",
                      status: "allocated",
                    });
                    setAddManualAllocModalOpen(true);
                  }}
                  className="btn-3d text-xs font-bold border-primary/40 text-primary hover:bg-primary/10 gap-1.5 shadow-sm"
                >
                  <Plus className="size-3.5" /> + Add Manual Allocation
                </Button>

                {/* 1-Click Auto Allocation Button */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" className="btn-3d text-xs font-bold bg-primary text-primary-foreground gap-1.5 shadow">
                      <Monitor className="size-4" /> 1-Click Auto Lab Allocation
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="glass-strong max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Automatic Computer Lab Allocation</DialogTitle>
                      <DialogDescription className="text-xs">
                        Select available computer labs. The system will automatically allocate {activeAllocationTest.expected_writing} candidates sequentially to system seats (PC-01 to PC-40) preventing double bookings and capacity overloads.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3 py-2">
                      <Label className="text-xs font-bold">Select Active Computer Labs (40 seats each):</Label>
                      <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                        {labs.map((lab) => {
                          const isSelected = selectedLabsForAutoAlloc.includes(lab.id);
                          return (
                            <div
                              key={lab.id}
                              onClick={() => {
                                setSelectedLabsForAutoAlloc((prev) =>
                                  isSelected ? prev.filter((id) => id !== lab.id) : [...prev, lab.id]
                                );
                              }}
                              className={`p-2 rounded-xl border text-xs cursor-pointer transition ${
                                isSelected
                                  ? "border-primary bg-primary/10 text-primary font-bold"
                                  : "border-border/40 hover:border-primary/40 bg-card"
                              }`}
                            >
                              <div className="truncate">{lab.name.split("—")[0].trim()}</div>
                              <div className="text-[10px] text-muted-foreground font-normal">
                                Capacity: {lab.total_capacity} PCs
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="rounded-xl bg-muted/40 p-3 text-xs space-y-1">
                        <div className="flex justify-between">
                          <span>Selected Labs Capacity:</span>
                          <span className="font-bold text-foreground">{selectedLabsForAutoAlloc.length * 40} Seats</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Candidates to Allocate:</span>
                          <span className="font-bold text-foreground">{activeAllocationTest.expected_writing} Students</span>
                        </div>
                        {selectedLabsForAutoAlloc.length * 40 < activeAllocationTest.expected_writing && (
                          <p className="text-rose-500 font-bold text-[11px] pt-1">
                            ⚠️ Insufficient seats selected! Need at least {Math.ceil(activeAllocationTest.expected_writing / 40)} labs.
                          </p>
                        )}
                      </div>
                    </div>

                    <DialogFooter>
                      <Button
                        size="sm"
                        disabled={selectedLabsForAutoAlloc.length * 40 < activeAllocationTest.expected_writing || autoAllocateMutation.isPending}
                        onClick={() =>
                          autoAllocateMutation.mutate({
                            testId: activeAllocationTest.id,
                            labIds: selectedLabsForAutoAlloc,
                          })
                        }
                        className="btn-3d text-xs font-bold"
                      >
                        Confirm & Allocate Candidates
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleExportExcel(
                      allocationTestDetails?.allocations || [],
                      `${activeAllocationTest.name}_Lab_Allocations`
                    )
                  }
                  className="text-xs gap-1.5"
                >
                  <Download className="size-3.5" /> Export Roster
                </Button>
              </div>
            )}
          </div>

          {/* Lab Breakdown Summary Table */}
          <Card className="card-3d">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold">
                Assigned Computer Labs for {activeAllocationTest?.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lab Name / Code</TableHead>
                    <TableHead className="text-center">Total Capacity</TableHead>
                    <TableHead className="text-center">Assigned Candidates</TableHead>
                    <TableHead className="text-center">Available Seats</TableHead>
                    <TableHead className="text-center">Writing</TableHead>
                    <TableHead className="text-center">Completed</TableHead>
                    <TableHead className="text-center">Absent</TableHead>
                    <TableHead>Lab Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(allocationTestDetails?.labBreakdown || []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="py-8 text-center text-xs text-muted-foreground">
                        No labs have been allocated for this test yet. Click "1-Click Auto Lab Allocation" above.
                      </TableCell>
                    </TableRow>
                  ) : (
                    allocationTestDetails?.labBreakdown.map((lb) => (
                      <TableRow key={lb.lab_id}>
                        <TableCell className="font-bold text-xs text-foreground">
                          {lb.lab_name}
                          <span className="block text-[10px] text-muted-foreground font-mono">{lb.code}</span>
                        </TableCell>
                        <TableCell className="text-center font-bold text-xs">{lb.total_capacity}</TableCell>
                        <TableCell className="text-center font-bold text-xs text-blue-600">{lb.assigned_students}</TableCell>
                        <TableCell className="text-center font-bold text-xs text-emerald-600">{lb.available_seats}</TableCell>
                        <TableCell className="text-center font-bold text-xs text-amber-500">{lb.actual_writing}</TableCell>
                        <TableCell className="text-center font-bold text-xs text-purple-600">{lb.completed}</TableCell>
                        <TableCell className="text-center font-bold text-xs text-rose-500">{lb.absent}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              lb.status === "Full"
                                ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                                : "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                            }
                          >
                            {lb.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Student-wise System / Seat Roster Table */}
          <Card className="card-3d">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-sm font-bold">Candidate Computer System Allocation Roster</CardTitle>
                <CardDescription className="text-xs">
                  Assigned seat identifier (PC-01 to PC-40) per student for secure examination compliance.
                </CardDescription>
              </div>

              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2 size-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search student, SRN, PC..."
                  value={seatSearch}
                  onChange={(e) => setSeatSearch(e.target.value)}
                  className="pl-8 h-8 text-xs"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Register No / SRN</TableHead>
                      <TableHead>Department & Section</TableHead>
                      <TableHead>Assigned Lab</TableHead>
                      <TableHead className="text-center">Computer Seat ID</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      {isAdmin && <TableHead className="text-right">Action</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(allocationTestDetails?.allocations || [])
                      .filter((a) => {
                        const q = seatSearch.trim().toLowerCase();
                        return (
                          !q ||
                          a.student_name.toLowerCase().includes(q) ||
                          a.register_no.toLowerCase().includes(q) ||
                          a.lab_name.toLowerCase().includes(q) ||
                          a.seat_no.toLowerCase().includes(q)
                        );
                      })
                      .map((a) => (
                        <TableRow key={a.id}>
                          <TableCell className="font-bold text-xs text-foreground">{a.student_name}</TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">{a.register_no}</TableCell>
                          <TableCell className="text-xs">{a.department} (Sec {a.section})</TableCell>
                          <TableCell className="text-xs font-medium text-foreground">{a.lab_name}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary" className="font-mono font-bold text-xs bg-primary/10 text-primary border-primary/20">
                              {a.seat_no}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              className={
                                a.status === "writing"
                                  ? "bg-emerald-500 text-white"
                                  : a.status === "absent"
                                  ? "bg-rose-500 text-white"
                                  : a.status === "completed"
                                  ? "bg-purple-600 text-white"
                                  : "bg-muted text-muted-foreground"
                              }
                            >
                              {a.status.toUpperCase()}
                            </Badge>
                          </TableCell>
                          {isAdmin && (
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingAlloc(JSON.parse(JSON.stringify(a)));
                                    setEditAllocModalOpen(true);
                                  }}
                                  className="h-7 px-2 text-xs text-primary hover:bg-primary/10 gap-1"
                                >
                                  <Edit className="size-3" /> Edit
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setReallocateModalItem(a);
                                    setTargetReallocateLab(a.lab_id);
                                  }}
                                  className="h-7 px-2 text-xs text-blue-600"
                                >
                                  Reallocate
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    if (confirm(`Remove allocation for ${a.student_name} (${a.seat_no})?`)) {
                                      deleteAllocMutation.mutate(a.id);
                                    }
                                  }}
                                  className="h-7 px-2 text-xs text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                >
                                  <Trash2 className="size-3" />
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ------------------------------------------------------------------ */}
        {/* TAB 6: EXAMINATION CALENDAR SCHEDULE                               */}
        {/* ------------------------------------------------------------------ */}
        <TabsContent value="calendar" className="space-y-4">
          <Card className="card-3d">
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <CalendarDays className="size-5 text-primary" />
                    <span>Examination Schedule & Timetable Calendar</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Inspect and manage subject-wise timetable schedules with automated notification announcements.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => {
                          setNewTimetableForm({
                            name: "",
                            subject_code: "",
                            subject_name: "",
                            exam_type: "internal",
                            department: "Computer Science",
                            course: "B.Tech Computer Science",
                            batch: "2024-2028",
                            section: "A, B",
                            exam_date: new Date().toISOString().slice(0, 10),
                            start_time: "10:00 AM",
                            end_time: "11:30 AM",
                            duration_minutes: 90,
                            mode: "online",
                            total_eligible: 120,
                            registered_count: 120,
                            expected_writing: 120,
                            assigned_lab_ids: [],
                            assigned_room_ids: [],
                            special_instructions: "",
                            broadcast_notice: true,
                          });
                          setAddTimetableModalOpen(true);
                        }}
                        className="btn-3d text-xs font-bold bg-primary text-primary-foreground gap-1.5 shadow"
                      >
                        <Plus className="size-3.5" /> + Add Subject Timetable
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          broadcastTimetableMutation.mutate({});
                        }}
                        disabled={broadcastTimetableMutation.isPending}
                        className="btn-3d text-xs font-bold border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 gap-1.5 shadow-sm"
                      >
                        <Megaphone className="size-3.5" /> Broadcast Timetable Notice
                      </Button>
                    </>
                  )}
                  <Badge variant="outline" className="text-xs">Upcoming & Ongoing Sessions</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {calendarEvents.map((evt) => (
                  <Interactive3DCard key={evt.id} maxRotation={8} depthOffset={10}>
                    <div
                      onClick={() => setInspectTestId(evt.id)}
                      className="p-4 rounded-2xl border border-border/60 bg-card hover:border-primary/50 cursor-pointer transition space-y-2.5 shadow-md card-3d h-full flex flex-col justify-between"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-mono text-primary font-bold uppercase">{evt.date}</span>
                            <h4 className="font-bold text-sm text-foreground leading-tight mt-0.5">{evt.title}</h4>
                          </div>
                          <Badge
                            variant="outline"
                            className={
                              evt.mode === "online"
                                ? "bg-blue-500/10 text-blue-600 border-blue-500/30"
                                : "bg-purple-500/10 text-purple-600 border-purple-500/30"
                            }
                          >
                            {evt.mode.toUpperCase()}
                          </Badge>
                        </div>

                        <div className="text-xs text-muted-foreground space-y-1">
                          <p className="flex items-center gap-1.5">
                            <Clock className="size-3.5 text-muted-foreground" />
                            {evt.start_time} - {evt.end_time}
                          </p>
                          <p className="flex items-center gap-1.5">
                            <Users className="size-3.5 text-muted-foreground" />
                            {evt.expected_writing} Students writing
                          </p>
                          <p className="flex items-center gap-1.5">
                            <Monitor className="size-3.5 text-muted-foreground" />
                            {evt.mode === "online"
                              ? `${evt.labs_required} Labs required (${evt.assigned_labs.length} allocated)`
                              : `${evt.classrooms_required} Classrooms required`}
                          </p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-border/30 flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground">{evt.department}</span>
                        <div className="flex items-center gap-2">
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                const originalTest = tests.find((t) => t.id === evt.id);
                                if (originalTest) {
                                  setEditingTimetableTest(JSON.parse(JSON.stringify(originalTest)));
                                  setEditTimetableModalOpen(true);
                                }
                              }}
                              className="h-6 px-1.5 text-[11px] text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 gap-1 btn-3d"
                            >
                              <Edit className="size-3" /> Edit
                            </Button>
                          )}
                          <span className="text-primary font-bold flex items-center gap-0.5">
                            Details &rarr;
                          </span>
                        </div>
                      </div>
                    </div>
                  </Interactive3DCard>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ------------------------------------------------------------------ */}
        {/* TAB 7: OFFICIAL INSTITUTIONAL REPORTS                              */}
        {/* ------------------------------------------------------------------ */}
        <TabsContent value="reports" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/40 bg-card/60 p-4">
            <div className="flex items-center gap-3">
              <Label className="text-xs font-bold text-muted-foreground">Select Official Report:</Label>
              <Select value={selectedReport} onValueChange={setSelectedReport}>
                <SelectTrigger className="h-9 w-64 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student_strength">1. Student Strength Report</SelectItem>
                  <SelectItem value="lab_requirements">2. Lab Requirement & Shortage Report</SelectItem>
                  <SelectItem value="classroom_requirements">3. Classroom Requirement Report</SelectItem>
                  <SelectItem value="lab_allocation">4. Lab Allocation & Seat Roster Report</SelectItem>
                  <SelectItem value="exam_schedule">5. Examination Schedule Timetable</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              {isAdmin && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setNewReportNote("");
                    setAddReportNoteModalOpen(true);
                  }}
                  className="btn-3d text-xs font-bold border-primary/40 text-primary hover:bg-primary/10 gap-1.5 shadow-sm"
                >
                  <Plus className="size-3.5" /> + Add Certified Observation
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExportExcel(reportRows, `Institutional_${selectedReport}`)}
                className="text-xs gap-1.5"
              >
                <Download className="size-3.5" /> Export to Excel (.xlsx)
              </Button>
              <Button
                size="sm"
                variant="default"
                onClick={() => window.print()}
                className="text-xs gap-1.5"
              >
                <Printer className="size-3.5" /> Print Official Report
              </Button>
            </div>
          </div>

          <Card className="card-3d">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold uppercase tracking-wider">
                {selectedReport.replace(/_/g, " ")}
              </CardTitle>
              <CardDescription className="text-xs">
                Official institution document certified by the Exam Cell Controller.
              </CardDescription>

              {/* Certified Audit Notes Display */}
              {reportNotes.filter((n: any) => n.report_type === selectedReport).length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {reportNotes
                    .filter((n: any) => n.report_type === selectedReport)
                    .map((n: any) => (
                      <div
                        key={n.id}
                        className="rounded-xl border border-primary/30 bg-primary/5 p-2.5 text-xs flex items-start gap-2"
                      >
                        <Badge variant="outline" className="bg-primary/10 text-primary font-mono text-[9px] uppercase mt-0.5">
                          Certified
                        </Badge>
                        <div>
                          <p className="font-medium text-foreground text-xs">{n.note}</p>
                          <span className="text-[10px] text-muted-foreground">
                            Signed: {n.author} · {new Date(n.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {reportRows.length > 0 &&
                        Object.keys(reportRows[0]).map((col) => (
                          <TableHead key={col} className="uppercase text-[11px] font-bold">
                            {col.replace(/_/g, " ")}
                          </TableHead>
                        ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-8 text-center text-xs text-muted-foreground">
                          No report data available.
                        </TableCell>
                      </TableRow>
                    ) : (
                      reportRows.map((row, idx) => (
                        <TableRow key={idx}>
                          {Object.values(row).map((val: any, cIdx) => (
                            <TableCell key={cIdx} className="text-xs">
                              {String(val)}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ------------------------------------------------------------------ */}
        {/* TAB 8: TEST NOTIFICATIONS & BROADCASTS                             */}
        {/* ------------------------------------------------------------------ */}
        <TabsContent value="notifications" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Broadcast Notice Form */}
            {isAdmin && (
              <Card className="card-3d lg:col-span-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Megaphone className="size-4 text-primary" /> Broadcast Notice
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Announce test dates, lab seat changes, or emergency guidelines.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs font-bold">Notice Title</Label>
                    <Input
                      placeholder="e.g., CS301 Lab Seat Announcement"
                      value={noticeTitle}
                      onChange={(e) => setNoticeTitle(e.target.value)}
                      className="mt-1 h-9 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold">Target Audience</Label>
                    <Select value={noticeAudience} onValueChange={setNoticeAudience}>
                      <SelectTrigger className="mt-1 h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All (Students & Faculty)</SelectItem>
                        <SelectItem value="students">Students Only</SelectItem>
                        <SelectItem value="faculty">Faculty & Invigilators</SelectItem>
                        <SelectItem value="coordinators">Exam Coordinators</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs font-bold">Announcement Message</Label>
                    <textarea
                      rows={4}
                      placeholder="Enter detailed instructions for candidates..."
                      value={noticeMessage}
                      onChange={(e) => setNoticeMessage(e.target.value)}
                      className="w-full mt-1 p-2.5 rounded-xl border border-border/40 bg-background text-xs resize-none"
                    />
                  </div>

                  <Button
                    size="sm"
                    disabled={!noticeTitle || !noticeMessage || broadcastNoticeMutation.isPending}
                    onClick={() =>
                      broadcastNoticeMutation.mutate({
                        title: noticeTitle,
                        message: noticeMessage,
                        target_audience: noticeAudience,
                      })
                    }
                    className="w-full btn-3d text-xs font-bold"
                  >
                    Broadcast Announcement
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Notifications Feed */}
            <Card className={`card-3d ${isAdmin ? "lg:col-span-8" : "lg:col-span-12"}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold">Recent Examination Alerts & Reminders</CardTitle>
                <CardDescription className="text-xs">
                  Automated notifications for test date schedules, lab changes, and rescheduled sessions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {notifications.length === 0 ? (
                    <p className="text-center py-8 text-xs text-muted-foreground">No notices yet.</p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className="p-3 rounded-xl border border-border/40 bg-card hover:border-primary/40 transition space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                            <Megaphone className="size-3.5 text-primary" /> {n.title}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(n.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{n.message}</p>
                        <div className="flex items-center justify-between pt-1 text-[10px]">
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 uppercase">
                            {n.category.replace(/_/g, " ")}
                          </Badge>
                          <span className="text-muted-foreground font-medium">
                            Audience: {n.target_audience.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* ------------------------------------------------------------------ */}
      {/* MODAL: SCHEDULE NEW EXAMINATION                                    */}
      {/* ------------------------------------------------------------------ */}
      <Dialog open={openScheduleModal} onOpenChange={setOpenScheduleModal}>
        <DialogContent className="glass-strong max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Schedule Examination & Plan Infrastructure</DialogTitle>
            <DialogDescription className="text-xs">
              Configure exam parameters. System validates lab and classroom capacity conflicts automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2 py-2">
            <div className="sm:col-span-2">
              <Label className="text-xs font-bold">Examination / Test Name *</Label>
              <Input
                placeholder="e.g., CS302 Database Management Systems Lab Assessment"
                value={scheduleForm.name}
                onChange={(e) => setScheduleForm({ ...scheduleForm, name: e.target.value })}
                className="mt-1 h-9 text-xs"
              />
            </div>

            <div>
              <Label className="text-xs font-bold">Subject Code *</Label>
              <Input
                placeholder="e.g., CS302"
                value={scheduleForm.subject_code}
                onChange={(e) => setScheduleForm({ ...scheduleForm, subject_code: e.target.value })}
                className="mt-1 h-9 text-xs"
              />
            </div>

            <div>
              <Label className="text-xs font-bold">Subject Name</Label>
              <Input
                placeholder="e.g., Database Management Systems"
                value={scheduleForm.subject_name}
                onChange={(e) => setScheduleForm({ ...scheduleForm, subject_name: e.target.value })}
                className="mt-1 h-9 text-xs"
              />
            </div>

            <div>
              <Label className="text-xs font-bold">Exam Type</Label>
              <Select
                value={scheduleForm.exam_type}
                onValueChange={(v) => setScheduleForm({ ...scheduleForm, exam_type: v as any })}
              >
                <SelectTrigger className="mt-1 h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal">Internal Assessment (IA)</SelectItem>
                  <SelectItem value="lab_practical">Lab Practical Exam</SelectItem>
                  <SelectItem value="semester">Semester Final</SelectItem>
                  <SelectItem value="midterm">Midterm Exam</SelectItem>
                  <SelectItem value="quiz">Online Quiz</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-bold">Examination Mode *</Label>
              <Select
                value={scheduleForm.mode}
                onValueChange={(v) => setScheduleForm({ ...scheduleForm, mode: v as any })}
              >
                <SelectTrigger className="mt-1 h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">Online (Computer Labs)</SelectItem>
                  <SelectItem value="offline">Offline (Classrooms)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-bold">Department</Label>
              <Select
                value={scheduleForm.department}
                onValueChange={(v) => setScheduleForm({ ...scheduleForm, department: v })}
              >
                <SelectTrigger className="mt-1 h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Computer Science">Computer Science</SelectItem>
                  <SelectItem value="Electrical">Electrical</SelectItem>
                  <SelectItem value="Mechanical">Mechanical</SelectItem>
                  <SelectItem value="Civil">Civil</SelectItem>
                  <SelectItem value="Electronics">Electronics</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-bold">Academic Batch & Sections</Label>
              <Input
                placeholder="e.g., 2024-2028 (Sec A, B)"
                value={scheduleForm.batch}
                onChange={(e) => setScheduleForm({ ...scheduleForm, batch: e.target.value })}
                className="mt-1 h-9 text-xs"
              />
            </div>

            <div>
              <Label className="text-xs font-bold">Exam Date *</Label>
              <Input
                type="date"
                value={scheduleForm.exam_date}
                onChange={(e) => setScheduleForm({ ...scheduleForm, exam_date: e.target.value })}
                className="mt-1 h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-bold">Start Time *</Label>
                <Input
                  value={scheduleForm.start_time}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, start_time: e.target.value })}
                  placeholder="10:00 AM"
                  className="mt-1 h-9 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs font-bold">End Time *</Label>
                <Input
                  value={scheduleForm.end_time}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, end_time: e.target.value })}
                  placeholder="11:30 AM"
                  className="mt-1 h-9 text-xs"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <Label className="text-xs font-bold">Number of Candidates Writing *</Label>
              <Input
                type="number"
                value={scheduleForm.expected_writing}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  setScheduleForm({
                    ...scheduleForm,
                    total_eligible: val,
                    registered_count: val,
                    expected_writing: val,
                  });
                }}
                className="mt-1 h-9 text-xs"
              />
              <span className="text-[11px] text-muted-foreground">
                Required Labs: <strong>{Math.ceil((scheduleForm.expected_writing || 0) / 40)}</strong> (at 40 capacity per lab)
              </span>
            </div>

            <div className="sm:col-span-2">
              <Label className="text-xs font-bold">Special Candidate Instructions</Label>
              <textarea
                rows={2}
                placeholder="e.g., Closed book, scientific calculators allowed, terminal sandbox enforced..."
                value={scheduleForm.special_instructions}
                onChange={(e) => setScheduleForm({ ...scheduleForm, special_instructions: e.target.value })}
                className="w-full mt-1 p-2 rounded-xl border border-border/40 bg-background text-xs resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setOpenScheduleModal(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={createMutation.isPending}
              onClick={() => createMutation.mutate(scheduleForm)}
              className="btn-3d text-xs font-bold"
            >
              Confirm & Schedule Test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ------------------------------------------------------------------ */}
      {/* MODAL: RESCHEDULE EXAMINATION                                      */}
      {/* ------------------------------------------------------------------ */}
      <Dialog open={Boolean(rescheduleTarget)} onOpenChange={() => setRescheduleTarget(null)}>
        <DialogContent className="glass-strong max-w-md">
          <DialogHeader>
            <DialogTitle>Reschedule Examination</DialogTitle>
            <DialogDescription className="text-xs">
              Update exam date or time slot. Related allocations & candidate notices will be synchronized.
            </DialogDescription>
          </DialogHeader>

          {rescheduleTarget && (
            <div className="space-y-3 py-2 text-xs">
              <div className="rounded-xl bg-muted/40 p-3">
                <span className="font-bold text-foreground block">{rescheduleTarget.name}</span>
                <span className="text-muted-foreground text-[11px]">
                  Current: {rescheduleTarget.exam_date} ({rescheduleTarget.start_time} - {rescheduleTarget.end_time})
                </span>
              </div>

              <div>
                <Label className="text-xs font-bold">New Exam Date *</Label>
                <Input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="mt-1 h-9 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs font-bold">Start Time *</Label>
                  <Input
                    value={rescheduleStart}
                    onChange={(e) => setRescheduleStart(e.target.value)}
                    placeholder="10:00 AM"
                    className="mt-1 h-9 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold">End Time *</Label>
                  <Input
                    value={rescheduleEnd}
                    onChange={(e) => setRescheduleEnd(e.target.value)}
                    placeholder="11:30 AM"
                    className="mt-1 h-9 text-xs"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-bold">Reason for Rescheduling</Label>
                <Input
                  placeholder="e.g., Lab equipment upgrade or faculty timetable conflict"
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  className="mt-1 h-9 text-xs"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setRescheduleTarget(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={rescheduleMutation.isPending}
              onClick={() =>
                rescheduleMutation.mutate({
                  testId: rescheduleTarget.id,
                  examDate: rescheduleDate,
                  startTime: rescheduleStart,
                  endTime: rescheduleEnd,
                  reason: rescheduleReason,
                })
              }
              className="btn-3d text-xs font-bold"
            >
              Confirm Reschedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ------------------------------------------------------------------ */}
      {/* MODAL: TEST INSPECTOR POPUP                                        */}
      {/* ------------------------------------------------------------------ */}
      <Dialog open={Boolean(inspectTestId)} onOpenChange={() => setInspectTestId(null)}>
        <DialogContent className="glass-strong max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Examination Inspection & Infrastructure Roster</DialogTitle>
            <DialogDescription className="text-xs">
              Complete test status, candidate strength, and assigned venues.
            </DialogDescription>
          </DialogHeader>

          {inspectedTestDetails && (
            <div className="space-y-4 py-2 text-xs">
              <div className="rounded-xl border border-border/60 bg-muted/30 p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-foreground">{inspectedTestDetails.test.name}</h4>
                  <Badge>{inspectedTestDetails.test.status.toUpperCase()}</Badge>
                </div>
                <p className="text-muted-foreground text-[11px]">
                  Subject Code: {inspectedTestDetails.test.subject_code} · {inspectedTestDetails.test.department} · {inspectedTestDetails.test.batch}
                </p>
                <p className="text-muted-foreground text-[11px]">
                  📅 {inspectedTestDetails.test.exam_date} ({inspectedTestDetails.test.start_time} - {inspectedTestDetails.test.end_time})
                </p>
              </div>

              {/* Infrastructure Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="rounded-lg bg-card border p-2">
                  <span className="block text-[10px] text-muted-foreground uppercase font-bold">Mode</span>
                  <span className="font-bold text-foreground">{inspectedTestDetails.test.mode.toUpperCase()}</span>
                </div>
                <div className="rounded-lg bg-card border p-2">
                  <span className="block text-[10px] text-muted-foreground uppercase font-bold">Candidates</span>
                  <span className="font-bold text-blue-600">{inspectedTestDetails.test.expected_writing}</span>
                </div>
                <div className="rounded-lg bg-card border p-2">
                  <span className="block text-[10px] text-muted-foreground uppercase font-bold">Required Labs</span>
                  <span className="font-bold text-indigo-600">{inspectedTestDetails.infrastructure_calculations.labsRequired}</span>
                </div>
                <div className="rounded-lg bg-card border p-2">
                  <span className="block text-[10px] text-muted-foreground uppercase font-bold">Allocated Labs</span>
                  <span className="font-bold text-emerald-600">{inspectedTestDetails.assignedLabs.length}</span>
                </div>
              </div>

              {/* Assigned Venues List */}
              <div>
                <Label className="font-bold text-xs">Assigned Venues / Labs:</Label>
                <div className="mt-1.5 space-y-1.5">
                  {inspectedTestDetails.assignedLabs.length > 0 ? (
                    inspectedTestDetails.assignedLabs.map((l) => (
                      <div key={l.id} className="p-2 rounded-lg border bg-card flex justify-between items-center text-[11px]">
                        <span className="font-bold text-foreground">{l.name}</span>
                        <span className="text-muted-foreground">Floor {l.floor} · 40 Seats</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-xs">No labs currently assigned.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setInspectTestId(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ------------------------------------------------------------------ */}
      {/* MODAL: REALLOCATE CANDIDATE SEAT                                   */}
      {/* ------------------------------------------------------------------ */}
      <Dialog open={Boolean(reallocateModalItem)} onOpenChange={() => setReallocateModalItem(null)}>
        <DialogContent className="glass-strong max-w-sm">
          <DialogHeader>
            <DialogTitle>Reallocate Candidate Seat</DialogTitle>
            <DialogDescription className="text-xs">
              Move candidate to another computer lab or seat identifier.
            </DialogDescription>
          </DialogHeader>

          {reallocateModalItem && (
            <div className="space-y-3 py-2 text-xs">
              <div className="rounded-xl bg-muted/40 p-2.5">
                <span className="font-bold text-foreground block">{reallocateModalItem.student_name}</span>
                <span className="text-muted-foreground font-mono text-[11px]">{reallocateModalItem.register_no}</span>
                <span className="block text-muted-foreground text-[11px] mt-0.5">
                  Current: {reallocateModalItem.lab_name} · Seat {reallocateModalItem.seat_no}
                </span>
              </div>

              <div>
                <Label className="text-xs font-bold">Select Target Computer Lab:</Label>
                <Select value={targetReallocateLab} onValueChange={setTargetReallocateLab}>
                  <SelectTrigger className="mt-1 h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {labs
                      .filter((l) => l.active)
                      .map((lab) => (
                        <SelectItem key={lab.id} value={lab.id}>
                          {lab.name.split("—")[0].trim()} ({lab.available_seats} remaining)
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setReallocateModalItem(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={reallocateSeatMutation.isPending}
              onClick={() =>
                reallocateSeatMutation.mutate({
                  allocationId: reallocateModalItem.id,
                  targetLabId: targetReallocateLab,
                })
              }
              className="btn-3d text-xs font-bold"
            >
              Confirm Reallocate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ------------------------------------------------------------------ */}
      {/* MODAL: MANUALLY UPDATE STUDENT STRENGTH MATRIX                      */}
      {/* ------------------------------------------------------------------ */}
      <Dialog open={editStrengthModalOpen} onOpenChange={setEditStrengthModalOpen}>
        <DialogContent className="glass-strong max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Update Student Strength Matrix — {editingDeptStrength?.department}</DialogTitle>
            <DialogDescription className="text-xs">
              Manually update total strength, eligible, registered, present, absent, completed, pending, and section breakdowns.
            </DialogDescription>
          </DialogHeader>

          {editingDeptStrength && (
            <div className="space-y-4 py-2 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <Label className="text-xs font-bold">Total Strength *</Label>
                  <Input
                    type="number"
                    value={editingDeptStrength.total_students}
                    onChange={(e) =>
                      setEditingDeptStrength({
                        ...editingDeptStrength,
                        total_students: parseInt(e.target.value) || 0,
                      })
                    }
                    className="mt-1 h-9 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold text-blue-600">Eligible Students *</Label>
                  <Input
                    type="number"
                    value={editingDeptStrength.eligible_students}
                    onChange={(e) =>
                      setEditingDeptStrength({
                        ...editingDeptStrength,
                        eligible_students: parseInt(e.target.value) || 0,
                      })
                    }
                    className="mt-1 h-9 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold text-indigo-600">Registered *</Label>
                  <Input
                    type="number"
                    value={editingDeptStrength.registered_students}
                    onChange={(e) =>
                      setEditingDeptStrength({
                        ...editingDeptStrength,
                        registered_students: parseInt(e.target.value) || 0,
                      })
                    }
                    className="mt-1 h-9 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold text-emerald-600">Present / Writing *</Label>
                  <Input
                    type="number"
                    value={editingDeptStrength.writing_students}
                    onChange={(e) =>
                      setEditingDeptStrength({
                        ...editingDeptStrength,
                        writing_students: parseInt(e.target.value) || 0,
                      })
                    }
                    className="mt-1 h-9 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold text-rose-500">Absent Students *</Label>
                  <Input
                    type="number"
                    value={editingDeptStrength.absent_students}
                    onChange={(e) =>
                      setEditingDeptStrength({
                        ...editingDeptStrength,
                        absent_students: parseInt(e.target.value) || 0,
                      })
                    }
                    className="mt-1 h-9 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold text-purple-600">Completed *</Label>
                  <Input
                    type="number"
                    value={editingDeptStrength.completed_students}
                    onChange={(e) =>
                      setEditingDeptStrength({
                        ...editingDeptStrength,
                        completed_students: parseInt(e.target.value) || 0,
                      })
                    }
                    className="mt-1 h-9 text-xs"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs font-bold text-muted-foreground">Pending / Not Attempted *</Label>
                  <Input
                    type="number"
                    value={editingDeptStrength.not_attempted}
                    onChange={(e) =>
                      setEditingDeptStrength({
                        ...editingDeptStrength,
                        not_attempted: parseInt(e.target.value) || 0,
                      })
                    }
                    className="mt-1 h-9 text-xs"
                  />
                </div>
              </div>

              {/* Sectional Breakdown Editor */}
              <div className="border-t border-border/40 pt-3">
                <Label className="text-xs font-bold block mb-2">Sectional Breakdown (Sections A–E):</Label>
                <div className="space-y-2">
                  {editingDeptStrength.sections?.map((sec, sIdx) => (
                    <div key={sec.section} className="grid grid-cols-4 gap-2 items-center bg-muted/30 p-2 rounded-xl border">
                      <span className="font-bold text-foreground text-xs">Section {sec.section}</span>
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Total</span>
                        <Input
                          type="number"
                          value={sec.total}
                          onChange={(e) => {
                            const newSecs = [...editingDeptStrength.sections];
                            newSecs[sIdx].total = parseInt(e.target.value) || 0;
                            setEditingDeptStrength({ ...editingDeptStrength, sections: newSecs });
                          }}
                          className="h-7 text-xs"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Eligible</span>
                        <Input
                          type="number"
                          value={sec.eligible}
                          onChange={(e) => {
                            const newSecs = [...editingDeptStrength.sections];
                            newSecs[sIdx].eligible = parseInt(e.target.value) || 0;
                            setEditingDeptStrength({ ...editingDeptStrength, sections: newSecs });
                          }}
                          className="h-7 text-xs"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Registered</span>
                        <Input
                          type="number"
                          value={sec.registered}
                          onChange={(e) => {
                            const newSecs = [...editingDeptStrength.sections];
                            newSecs[sIdx].registered = parseInt(e.target.value) || 0;
                            setEditingDeptStrength({ ...editingDeptStrength, sections: newSecs });
                          }}
                          className="h-7 text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setEditStrengthModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={updateStrengthMutation.isPending}
              onClick={() => {
                if (editingDeptStrength) {
                  updateStrengthMutation.mutate({
                    department: editingDeptStrength.department,
                    updates: editingDeptStrength,
                  });
                }
              }}
              className="btn-3d text-xs font-bold"
            >
              {updateStrengthMutation.isPending ? "Saving…" : "Save Strength Matrix Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ------------------------------------------------------------------ */}
      {/* MODAL: ADD DEPARTMENT RECORD TO STRENGTH MATRIX                     */}
      {/* ------------------------------------------------------------------ */}
      <Dialog open={addDeptModalOpen} onOpenChange={setAddDeptModalOpen}>
        <DialogContent className="glass-strong max-w-md">
          <DialogHeader>
            <DialogTitle>Add Academic Department Record</DialogTitle>
            <DialogDescription className="text-xs">
              Add a new department with student strength metrics to the examination matrix.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div>
              <Label className="text-xs font-bold">Department Name *</Label>
              <Input
                value={newDeptForm.department}
                onChange={(e) => setNewDeptForm({ ...newDeptForm, department: e.target.value })}
                placeholder="e.g. Artificial Intelligence & Data Science"
                className="mt-1 h-9 text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-bold">Total Strength *</Label>
                <Input
                  type="number"
                  value={newDeptForm.total_students}
                  onChange={(e) => setNewDeptForm({ ...newDeptForm, total_students: parseInt(e.target.value) || 0 })}
                  className="mt-1 h-9 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs font-bold">Eligible Students *</Label>
                <Input
                  type="number"
                  value={newDeptForm.eligible_students}
                  onChange={(e) => setNewDeptForm({ ...newDeptForm, eligible_students: parseInt(e.target.value) || 0 })}
                  className="mt-1 h-9 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs font-bold">Registered *</Label>
                <Input
                  type="number"
                  value={newDeptForm.registered_students}
                  onChange={(e) => setNewDeptForm({ ...newDeptForm, registered_students: parseInt(e.target.value) || 0 })}
                  className="mt-1 h-9 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs font-bold">Present / Writing</Label>
                <Input
                  type="number"
                  value={newDeptForm.writing_students}
                  onChange={(e) => setNewDeptForm({ ...newDeptForm, writing_students: parseInt(e.target.value) || 0 })}
                  className="mt-1 h-9 text-xs"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setAddDeptModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!newDeptForm.department.trim() || createDeptMutation.isPending}
              onClick={() => createDeptMutation.mutate(newDeptForm)}
              className="btn-3d text-xs font-bold"
            >
              {createDeptMutation.isPending ? "Adding…" : "Add Department Record"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ------------------------------------------------------------------ */}
      {/* MODAL: ADD COMPUTER LAB                                             */}
      {/* ------------------------------------------------------------------ */}
      <Dialog open={addLabModalOpen} onOpenChange={setAddLabModalOpen}>
        <DialogContent className="glass-strong max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Computer Lab</DialogTitle>
            <DialogDescription className="text-xs">
              Register an examination lab centre with system capacity and operational specs.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div>
              <Label className="text-xs font-bold">Lab Name *</Label>
              <Input
                value={newLabForm.name}
                onChange={(e) => setNewLabForm({ ...newLabForm, name: e.target.value })}
                placeholder="e.g. Lab 11 — Grace Hopper Systems Lab"
                className="mt-1 h-9 text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-bold">Lab Code *</Label>
                <Input
                  value={newLabForm.code}
                  onChange={(e) => setNewLabForm({ ...newLabForm, code: e.target.value })}
                  placeholder="LAB-HOPPER-301"
                  className="mt-1 h-9 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs font-bold">Block Location *</Label>
                <Input
                  value={newLabForm.block}
                  onChange={(e) => setNewLabForm({ ...newLabForm, block: e.target.value })}
                  placeholder="Block A"
                  className="mt-1 h-9 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs font-bold">Floor *</Label>
                <Input
                  type="number"
                  value={newLabForm.floor}
                  onChange={(e) => setNewLabForm({ ...newLabForm, floor: parseInt(e.target.value) || 1 })}
                  className="mt-1 h-9 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs font-bold">Total Capacity (PCs) *</Label>
                <Input
                  type="number"
                  value={newLabForm.total_capacity}
                  onChange={(e) => setNewLabForm({ ...newLabForm, total_capacity: parseInt(e.target.value) || 40 })}
                  className="mt-1 h-9 text-xs"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs font-bold">Operating System & Tech Spec</Label>
              <Input
                value={newLabForm.operating_system}
                onChange={(e) => setNewLabForm({ ...newLabForm, operating_system: e.target.value })}
                placeholder="Ubuntu Linux 24.04 / Windows 11 Enterprise"
                className="mt-1 h-9 text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-bold">Lab In-Charge Name</Label>
                <Input
                  value={newLabForm.lab_incharge}
                  onChange={(e) => setNewLabForm({ ...newLabForm, lab_incharge: e.target.value })}
                  placeholder="Prof. Ramesh K"
                  className="mt-1 h-9 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs font-bold">Contact Phone</Label>
                <Input
                  value={newLabForm.contact_phone}
                  onChange={(e) => setNewLabForm({ ...newLabForm, contact_phone: e.target.value })}
                  placeholder="+91 98450 12345"
                  className="mt-1 h-9 text-xs"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setAddLabModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!newLabForm.name.trim() || !newLabForm.code.trim() || createLabMutation.isPending}
              onClick={() => createLabMutation.mutate(newLabForm)}
              className="btn-3d text-xs font-bold"
            >
              {createLabMutation.isPending ? "Adding…" : "Add Computer Lab"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ------------------------------------------------------------------ */}
      {/* MODAL: EDIT COMPUTER LAB                                            */}
      {/* ------------------------------------------------------------------ */}
      <Dialog open={editLabModalOpen} onOpenChange={setEditLabModalOpen}>
        <DialogContent className="glass-strong max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Computer Lab — {editingLab?.name}</DialogTitle>
            <DialogDescription className="text-xs">
              Update lab capacity, active systems, or operational in-charge contact.
            </DialogDescription>
          </DialogHeader>

          {editingLab && (
            <div className="space-y-3 py-2 text-xs">
              <div>
                <Label className="text-xs font-bold">Lab Name</Label>
                <Input
                  value={editingLab.name}
                  onChange={(e) => setEditingLab({ ...editingLab, name: e.target.value })}
                  className="mt-1 h-9 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs font-bold">Lab Code</Label>
                  <Input
                    value={editingLab.code}
                    onChange={(e) => setEditingLab({ ...editingLab, code: e.target.value })}
                    className="mt-1 h-9 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold">Block Location</Label>
                  <Input
                    value={editingLab.block}
                    onChange={(e) => setEditingLab({ ...editingLab, block: e.target.value })}
                    className="mt-1 h-9 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold">Total Capacity</Label>
                  <Input
                    type="number"
                    value={editingLab.total_capacity}
                    onChange={(e) => setEditingLab({ ...editingLab, total_capacity: parseInt(e.target.value) || 0 })}
                    className="mt-1 h-9 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold">Floor</Label>
                  <Input
                    type="number"
                    value={editingLab.floor}
                    onChange={(e) => setEditingLab({ ...editingLab, floor: parseInt(e.target.value) || 0 })}
                    className="mt-1 h-9 text-xs"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs font-bold">Operating System</Label>
                <Input
                  value={editingLab.operating_system}
                  onChange={(e) => setEditingLab({ ...editingLab, operating_system: e.target.value })}
                  className="mt-1 h-9 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs font-bold">Lab In-Charge</Label>
                  <Input
                    value={editingLab.lab_incharge}
                    onChange={(e) => setEditingLab({ ...editingLab, lab_incharge: e.target.value })}
                    className="mt-1 h-9 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold">Contact Phone</Label>
                  <Input
                    value={editingLab.contact_phone}
                    onChange={(e) => setEditingLab({ ...editingLab, contact_phone: e.target.value })}
                    className="mt-1 h-9 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setEditLabModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={updateLabMutation.isPending}
              onClick={() => {
                if (editingLab) {
                  updateLabMutation.mutate(editingLab);
                }
              }}
              className="btn-3d text-xs font-bold"
            >
              {updateLabMutation.isPending ? "Saving…" : "Save Lab Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ------------------------------------------------------------------ */}
      {/* MODAL: ADD MANUAL LAB ALLOCATION                                   */}
      {/* ------------------------------------------------------------------ */}
      <Dialog open={addManualAllocModalOpen} onOpenChange={setAddManualAllocModalOpen}>
        <DialogContent className="glass-strong max-w-md">
          <DialogHeader>
            <DialogTitle>Manual Computer Lab Allocation</DialogTitle>
            <DialogDescription className="text-xs">
              Manually assign an individual candidate to an examination lab seat.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div>
              <Label className="text-xs font-bold">Student Full Name *</Label>
              <Input
                value={newManualAllocForm.student_name}
                onChange={(e) => setNewManualAllocForm({ ...newManualAllocForm, student_name: e.target.value })}
                placeholder="e.g. Rahul Sharma"
                className="mt-1 h-9 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs font-bold">University Register No / USN *</Label>
              <Input
                value={newManualAllocForm.register_no}
                onChange={(e) => setNewManualAllocForm({ ...newManualAllocForm, register_no: e.target.value })}
                placeholder="1SN24CS088"
                className="mt-1 h-9 text-xs font-mono"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-bold">Academic Department</Label>
                <Input
                  value={newManualAllocForm.department}
                  onChange={(e) => setNewManualAllocForm({ ...newManualAllocForm, department: e.target.value })}
                  className="mt-1 h-9 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs font-bold">Section</Label>
                <Select
                  value={newManualAllocForm.section}
                  onValueChange={(val) => setNewManualAllocForm({ ...newManualAllocForm, section: val })}
                >
                  <SelectTrigger className="mt-1 h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["A", "B", "C", "D", "E"].map((s) => (
                      <SelectItem key={s} value={s}>Section {s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs font-bold">Assigned Computer Lab *</Label>
              <Select
                value={newManualAllocForm.lab_id}
                onValueChange={(val) => setNewManualAllocForm({ ...newManualAllocForm, lab_id: val })}
              >
                <SelectTrigger className="mt-1 h-9 text-xs">
                  <SelectValue placeholder="Choose lab centre" />
                </SelectTrigger>
                <SelectContent>
                  {labs.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name.split("—")[0].trim()} ({l.available_seats} free)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-bold">Seat PC ID (optional)</Label>
                <Input
                  value={newManualAllocForm.seat_no}
                  onChange={(e) => setNewManualAllocForm({ ...newManualAllocForm, seat_no: e.target.value })}
                  placeholder="e.g. PC-14 (auto if blank)"
                  className="mt-1 h-9 text-xs font-mono"
                />
              </div>
              <div>
                <Label className="text-xs font-bold">Attendance Status</Label>
                <Select
                  value={newManualAllocForm.status}
                  onValueChange={(val: any) => setNewManualAllocForm({ ...newManualAllocForm, status: val })}
                >
                  <SelectTrigger className="mt-1 h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="allocated">Allocated</SelectItem>
                    <SelectItem value="present">Present / Writing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setAddManualAllocModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!newManualAllocForm.student_name.trim() || !newManualAllocForm.register_no.trim() || addManualAllocMutation.isPending}
              onClick={() => addManualAllocMutation.mutate(newManualAllocForm)}
              className="btn-3d text-xs font-bold"
            >
              {addManualAllocMutation.isPending ? "Allocating…" : "Confirm & Allocate Student"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ------------------------------------------------------------------ */}
      {/* MODAL: EDIT LAB ALLOCATION                                          */}
      {/* ------------------------------------------------------------------ */}
      <Dialog open={editAllocModalOpen} onOpenChange={setEditAllocModalOpen}>
        <DialogContent className="glass-strong max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Candidate Seat Allocation</DialogTitle>
            <DialogDescription className="text-xs">
              Update candidate attendance status, computer seat, or destination lab.
            </DialogDescription>
          </DialogHeader>

          {editingAlloc && (
            <div className="space-y-3 py-2 text-xs">
              <div>
                <Label className="text-xs font-bold">Student Name</Label>
                <Input
                  value={editingAlloc.student_name}
                  onChange={(e) => setEditingAlloc({ ...editingAlloc, student_name: e.target.value })}
                  className="mt-1 h-9 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs font-bold">Register No</Label>
                  <Input
                    value={editingAlloc.register_no}
                    onChange={(e) => setEditingAlloc({ ...editingAlloc, register_no: e.target.value })}
                    className="mt-1 h-9 text-xs font-mono"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold">Seat PC ID</Label>
                  <Input
                    value={editingAlloc.seat_no}
                    onChange={(e) => setEditingAlloc({ ...editingAlloc, seat_no: e.target.value })}
                    className="mt-1 h-9 text-xs font-mono"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs font-bold">Attendance Status</Label>
                <Select
                  value={editingAlloc.status}
                  onValueChange={(val: any) => setEditingAlloc({ ...editingAlloc, status: val })}
                >
                  <SelectTrigger className="mt-1 h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="allocated">Allocated</SelectItem>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="writing">Writing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setEditAllocModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={updateAllocMutation.isPending}
              onClick={() => {
                if (editingAlloc) {
                  updateAllocMutation.mutate({
                    allocationId: editingAlloc.id,
                    student_name: editingAlloc.student_name,
                    register_no: editingAlloc.register_no,
                    seat_no: editingAlloc.seat_no,
                    status: editingAlloc.status,
                  });
                }
              }}
              className="btn-3d text-xs font-bold"
            >
              {updateAllocMutation.isPending ? "Saving…" : "Save Allocation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ------------------------------------------------------------------ */}
      {/* MODAL: ADD SUBJECT TIMETABLE SCHEDULE                               */}
      {/* ------------------------------------------------------------------ */}
      <Dialog open={addTimetableModalOpen} onOpenChange={setAddTimetableModalOpen}>
        <DialogContent className="glass-strong max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Subject Examination Timetable</DialogTitle>
            <DialogDescription className="text-xs">
              Add examination timetable entry for a subject with automatic notification broadcast.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-bold">Subject Code *</Label>
                <Input
                  value={newTimetableForm.subject_code}
                  onChange={(e) => setNewTimetableForm({ ...newTimetableForm, subject_code: e.target.value })}
                  placeholder="CS501"
                  className="mt-1 h-9 text-xs font-mono"
                />
              </div>
              <div>
                <Label className="text-xs font-bold">Subject Name *</Label>
                <Input
                  value={newTimetableForm.subject_name}
                  onChange={(e) => setNewTimetableForm({ ...newTimetableForm, subject_name: e.target.value, name: e.target.value })}
                  placeholder="Distributed Systems"
                  className="mt-1 h-9 text-xs"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-bold">Department *</Label>
                <Select
                  value={newTimetableForm.department}
                  onValueChange={(val) => setNewTimetableForm({ ...newTimetableForm, department: val })}
                >
                  <SelectTrigger className="mt-1 h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Computer Science", "Information Technology", "Electronics", "Electrical", "Mechanical", "Civil"].map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-bold">Exam Date *</Label>
                <Input
                  type="date"
                  value={newTimetableForm.exam_date}
                  onChange={(e) => setNewTimetableForm({ ...newTimetableForm, exam_date: e.target.value })}
                  className="mt-1 h-9 text-xs"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-bold">Start Time *</Label>
                <Input
                  value={newTimetableForm.start_time}
                  onChange={(e) => setNewTimetableForm({ ...newTimetableForm, start_time: e.target.value })}
                  placeholder="10:00 AM"
                  className="mt-1 h-9 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs font-bold">End Time *</Label>
                <Input
                  value={newTimetableForm.end_time}
                  onChange={(e) => setNewTimetableForm({ ...newTimetableForm, end_time: e.target.value })}
                  placeholder="11:30 AM"
                  className="mt-1 h-9 text-xs"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-bold">Mode *</Label>
                <Select
                  value={newTimetableForm.mode}
                  onValueChange={(val) => setNewTimetableForm({ ...newTimetableForm, mode: val })}
                >
                  <SelectTrigger className="mt-1 h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">Online (Computer Lab)</SelectItem>
                    <SelectItem value="offline">Offline (Hall Desks)</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-bold">Expected Candidates</Label>
                <Input
                  type="number"
                  value={newTimetableForm.expected_writing}
                  onChange={(e) => setNewTimetableForm({ ...newTimetableForm, expected_writing: parseInt(e.target.value) || 0 })}
                  className="mt-1 h-9 text-xs"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-xl bg-primary/5 border border-primary/20">
              <input
                type="checkbox"
                id="broadcastCheckbox"
                checked={newTimetableForm.broadcast_notice}
                onChange={(e) => setNewTimetableForm({ ...newTimetableForm, broadcast_notice: e.target.checked })}
                className="size-4 text-primary rounded"
              />
              <Label htmlFor="broadcastCheckbox" className="text-xs cursor-pointer">
                Automatically broadcast timetable notice to faculty and candidate notifications
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setAddTimetableModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!newTimetableForm.subject_code.trim() || !newTimetableForm.subject_name.trim() || createMutation.isPending}
              onClick={() => {
                createMutation.mutate({
                  ...newTimetableForm,
                  name: newTimetableForm.subject_name || newTimetableForm.name,
                  total_eligible: newTimetableForm.expected_writing,
                  registered_count: newTimetableForm.expected_writing,
                });
                setAddTimetableModalOpen(false);
              }}
              className="btn-3d text-xs font-bold"
            >
              {createMutation.isPending ? "Scheduling…" : "Save Subject Timetable"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ------------------------------------------------------------------ */}
      {/* MODAL: EDIT SUBJECT TIMETABLE SCHEDULE                              */}
      {/* ------------------------------------------------------------------ */}
      <Dialog open={editTimetableModalOpen} onOpenChange={setEditTimetableModalOpen}>
        <DialogContent className="glass-strong max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Subject Examination Timetable</DialogTitle>
            <DialogDescription className="text-xs">
              Update examination schedule details. Updates can be immediately broadcasted to notifications.
            </DialogDescription>
          </DialogHeader>

          {editingTimetableTest && (
            <div className="space-y-3 py-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs font-bold">Subject Code</Label>
                  <Input
                    value={editingTimetableTest.subject_code}
                    onChange={(e) => setEditingTimetableTest({ ...editingTimetableTest, subject_code: e.target.value })}
                    className="mt-1 h-9 text-xs font-mono"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold">Subject Name</Label>
                  <Input
                    value={editingTimetableTest.name}
                    onChange={(e) => setEditingTimetableTest({ ...editingTimetableTest, name: e.target.value })}
                    className="mt-1 h-9 text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs font-bold">Exam Date</Label>
                  <Input
                    type="date"
                    value={editingTimetableTest.exam_date}
                    onChange={(e) => setEditingTimetableTest({ ...editingTimetableTest, exam_date: e.target.value })}
                    className="mt-1 h-9 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold">Department</Label>
                  <Input
                    value={editingTimetableTest.department}
                    onChange={(e) => setEditingTimetableTest({ ...editingTimetableTest, department: e.target.value })}
                    className="mt-1 h-9 text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs font-bold">Start Time</Label>
                  <Input
                    value={editingTimetableTest.start_time}
                    onChange={(e) => setEditingTimetableTest({ ...editingTimetableTest, start_time: e.target.value })}
                    className="mt-1 h-9 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold">End Time</Label>
                  <Input
                    value={editingTimetableTest.end_time}
                    onChange={(e) => setEditingTimetableTest({ ...editingTimetableTest, end_time: e.target.value })}
                    className="mt-1 h-9 text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs font-bold">Mode</Label>
                  <Select
                    value={editingTimetableTest.mode}
                    onValueChange={(val: any) => setEditingTimetableTest({ ...editingTimetableTest, mode: val })}
                  >
                    <SelectTrigger className="mt-1 h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="online">Online (Computer Lab)</SelectItem>
                      <SelectItem value="offline">Offline (Hall Desks)</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-bold">Expected Candidates</Label>
                  <Input
                    type="number"
                    value={editingTimetableTest.expected_writing}
                    onChange={(e) => setEditingTimetableTest({ ...editingTimetableTest, expected_writing: parseInt(e.target.value) || 0 })}
                    className="mt-1 h-9 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setEditTimetableModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={updateTestMutation.isPending}
              onClick={() => {
                if (editingTimetableTest) {
                  updateTestMutation.mutate({
                    testId: editingTimetableTest.id,
                    name: editingTimetableTest.name,
                    subject_code: editingTimetableTest.subject_code,
                    subject_name: editingTimetableTest.name,
                    exam_date: editingTimetableTest.exam_date,
                    start_time: editingTimetableTest.start_time,
                    end_time: editingTimetableTest.end_time,
                    mode: editingTimetableTest.mode,
                    department: editingTimetableTest.department,
                    expected_writing: editingTimetableTest.expected_writing,
                    broadcast_notice: true,
                  });
                }
              }}
              className="btn-3d text-xs font-bold"
            >
              {updateTestMutation.isPending ? "Updating…" : "Update & Broadcast Notice"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ------------------------------------------------------------------ */}
      {/* MODAL: ADD CERTIFIED AUDIT OBSERVATION                              */}
      {/* ------------------------------------------------------------------ */}
      <Dialog open={addReportNoteModalOpen} onOpenChange={setAddReportNoteModalOpen}>
        <DialogContent className="glass-strong max-w-md">
          <DialogHeader>
            <DialogTitle>Add Certified Audit Observation</DialogTitle>
            <DialogDescription className="text-xs">
              Attach an official controller observation or certified audit note to the {selectedReport.replace(/_/g, " ")}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div>
              <Label className="text-xs font-bold">Official Certified Remark / Note *</Label>
              <Input
                value={newReportNote}
                onChange={(e) => setNewReportNote(e.target.value)}
                placeholder="e.g. Audit verified: 100% seating and attendance reconciled with biometric register."
                className="mt-1 h-12 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs font-bold text-muted-foreground">Certified By</Label>
              <Input
                disabled
                value="Controller of Examinations (Exam Cell)"
                className="mt-1 h-9 text-xs bg-muted/40"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setAddReportNoteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!newReportNote.trim() || addReportNoteMutation.isPending}
              onClick={() => {
                addReportNoteMutation.mutate({
                  report_type: selectedReport,
                  note: newReportNote,
                  author: "Controller of Examinations",
                });
              }}
              className="btn-3d text-xs font-bold"
            >
              {addReportNoteMutation.isPending ? "Attaching…" : "Attach Audit Observation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
