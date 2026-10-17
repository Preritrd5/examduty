// @ts-nocheck
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useMemo } from "react";
import * as XLSX from "xlsx";
import { daysDiff } from "@/lib/utils";
import {
  CalendarDays,
  CalendarClock,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  PlayCircle,
  Filter,
  Download,
  Printer,
  Plus,
  ArrowRight,
  ShieldCheck,
  Building2,
  Users,
  Search,
  BookOpen,
  FileSpreadsheet,
  RotateCcw,
  Flag,
  FileCheck2,
  FileText,
  ChevronRight,
  ListOrdered,
  CalendarRange,
  Layers,
  Sparkles,
  ExternalLink,
  Eye,
  Check,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell, useMe } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  getAcademicCalendarOverview,
  listAcademicActivities,
  updateAcademicActivity,
  toggleActivityStatusWithDependencyCheck,
  createAcademicActivity,
  deleteAcademicActivity,
  resetAcademicCalendarToDefault,
  getMyAcademicActivities,
  getTestWorkflows,
  getAcademicReportsData,
  type AcademicActivity,
  type ActivityStatus,
  type ResponsibleTeam,
} from "@/lib/academic-calendar.functions";

export const Route = createFileRoute("/_authenticated/academic-calendar")({
  head: () => ({
    meta: [
      { title: "Academic Timeline & Milestones — UniDuty" },
      {
        name: "description",
        content:
          "Complete semester academic activity calendar, Test-1/Test-2 workflows, Gantt view, and institutional reports.",
      },
      { property: "og:title", content: "Academic Timeline & Milestones — UniDuty" },
    ],
  }),
  component: AcademicCalendarPage,
});

// Responsibility Color Mappings
const TEAM_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  University: { bg: "bg-purple-500/10", text: "text-purple-700 dark:text-purple-300", border: "border-purple-500/30" },
  "Course Faculty": { bg: "bg-blue-500/10", text: "text-blue-700 dark:text-blue-300", border: "border-blue-500/30" },
  "Test Committee": { bg: "bg-amber-500/10", text: "text-amber-700 dark:text-amber-300", border: "border-amber-500/30" },
  "Scrutiny Team": { bg: "bg-emerald-500/10", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-500/30" },
  Department: { bg: "bg-indigo-500/10", text: "text-indigo-700 dark:text-indigo-300", border: "border-indigo-500/30" },
  "—": { bg: "bg-muted/50", text: "text-muted-foreground", border: "border-border" },
};

// Status Badges
function StatusBadge({ status }: { status: ActivityStatus }) {
  switch (status) {
    case "Completed":
      return (
        <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-medium">
          <CheckCircle2 className="w-3 h-3 mr-1 inline" /> Completed
        </Badge>
      );
    case "In Progress":
      return (
        <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30 font-medium">
          <PlayCircle className="w-3 h-3 mr-1 inline animate-pulse" /> In Progress
        </Badge>
      );
    case "Delayed":
    case "Overdue":
      return (
        <Badge className="bg-destructive/15 text-destructive border-destructive/30 font-medium">
          <AlertCircle className="w-3 h-3 mr-1 inline" /> {status}
        </Badge>
      );
    case "Upcoming":
      return (
        <Badge variant="outline" className="text-muted-foreground font-medium">
          <Clock className="w-3 h-3 mr-1 inline" /> Upcoming
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" className="font-normal">
          {status}
        </Badge>
      );
  }
}

function AcademicCalendarPage() {
  const qc = useQueryClient();
  const { data: me } = useMe();
  const isAdmin = Boolean(me?.isAdmin);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState("overview");

  // Timeline view switch (gantt | timeline | calendar | list)
  const [timelineSubView, setTimelineSubView] = useState<"gantt" | "timeline" | "calendar" | "list">("gantt");

  // Filters for activities list
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTeam, setFilterTeam] = useState("all");
  const [filterTest, setFilterTest] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Role filter for "My Activities" tab
  const [myRole, setMyRole] = useState("Course Faculty");

  // Modals & Inspection State
  const [selectedActivity, setSelectedActivity] = useState<AcademicActivity | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [overrideModal, setOverrideModal] = useState<{
    isOpen: boolean;
    activityId: string;
    targetStatus: ActivityStatus;
    dependencies: { id: string; name: string; status: string }[];
    reason: string;
  }>({
    isOpen: false,
    activityId: "",
    targetStatus: "Completed",
    dependencies: [],
    reason: "",
  });

  // Server functions
  const overviewFn = useServerFn(getAcademicCalendarOverview);
  const listActivitiesFn = useServerFn(listAcademicActivities);
  const myActivitiesFn = useServerFn(getMyAcademicActivities);
  const workflowsFn = useServerFn(getTestWorkflows);
  const updateActFn = useServerFn(updateAcademicActivity);
  const toggleStatusFn = useServerFn(toggleActivityStatusWithDependencyCheck);
  const createActFn = useServerFn(createAcademicActivity);
  const resetCalendarFn = useServerFn(resetAcademicCalendarToDefault);
  const reportsDataFn = useServerFn(getAcademicReportsData);

  // Queries
  const { data: overview, isLoading: loadingOverview } = useQuery({
    queryKey: ["academic-calendar-overview"],
    queryFn: () => overviewFn(),
    refetchInterval: 20000,
  });

  const { data: activities = [], isLoading: loadingActivities } = useQuery({
    queryKey: ["academic-activities", searchQuery, filterTeam, filterTest, filterStatus],
    queryFn: () =>
      listActivitiesFn({
        data: {
          search: searchQuery,
          responsible_team: filterTeam,
          test_association: filterTest,
          status: filterStatus,
        },
      }),
  });

  const { data: myActs } = useQuery({
    queryKey: ["my-academic-activities", myRole],
    queryFn: () => myActivitiesFn({ data: { role: myRole } }),
  });

  const { data: workflows } = useQuery({
    queryKey: ["academic-test-workflows"],
    queryFn: () => workflowsFn(),
  });

  // Mutations
  const toggleStatusMut = useMutation({
    mutationFn: (payload: { id: string; target_status: ActivityStatus; allow_override?: boolean; override_reason?: string }) =>
      toggleStatusFn({ data: payload }),
    onSuccess: (res) => {
      if (res.blocked_by_dependency) {
        setOverrideModal({
          isOpen: true,
          activityId: res.activity?.id || "",
          targetStatus: "Completed",
          dependencies: res.incomplete_dependencies || [],
          reason: "Administrative verification completed ahead of schedule.",
        });
        toast.warning(res.message);
      } else {
        toast.success("Milestone status updated");
        qc.invalidateQueries({ queryKey: ["academic-calendar-overview"] });
        qc.invalidateQueries({ queryKey: ["academic-activities"] });
        qc.invalidateQueries({ queryKey: ["my-academic-activities"] });
        qc.invalidateQueries({ queryKey: ["academic-test-workflows"] });
      }
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateActMut = useMutation({
    mutationFn: (payload: any) => updateActFn({ data: payload }),
    onSuccess: () => {
      toast.success("Activity details saved");
      setIsEditOpen(false);
      qc.invalidateQueries({ queryKey: ["academic-calendar-overview"] });
      qc.invalidateQueries({ queryKey: ["academic-activities"] });
      qc.invalidateQueries({ queryKey: ["academic-test-workflows"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const resetCalendarMut = useMutation({
    mutationFn: () => resetCalendarFn(),
    onSuccess: (res) => {
      toast.success(`Reset successfully to official schedule (${res.count} activities restored)`);
      qc.invalidateQueries({ queryKey: ["academic-calendar-overview"] });
      qc.invalidateQueries({ queryKey: ["academic-activities"] });
      qc.invalidateQueries({ queryKey: ["my-academic-activities"] });
      qc.invalidateQueries({ queryKey: ["academic-test-workflows"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const createActMut = useMutation({
    mutationFn: (payload: any) => createActFn({ data: payload }),
    onSuccess: () => {
      toast.success("New academic milestone added");
      setIsAddOpen(false);
      qc.invalidateQueries({ queryKey: ["academic-calendar-overview"] });
      qc.invalidateQueries({ queryKey: ["academic-activities"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Handle Export to Excel
  const handleExportExcel = async (reportType: "master" | "responsibility" | "test1" | "test2" | "delayed") => {
    try {
      const data = await reportsDataFn();
      let sheetData: any[] = [];
      let filename = "Academic_Schedule_Report.xlsx";

      if (reportType === "master") {
        sheetData = data.masterReport;
        filename = `Master_Academic_Schedule_${data.semester.academic_year.replace(/[–—]/g, "-")}.xlsx`;
      } else if (reportType === "responsibility") {
        sheetData = data.responsibilityReport;
        filename = `Stakeholder_Workload_Report.xlsx`;
      } else if (reportType === "test1") {
        sheetData = data.test1Report;
        filename = `Test1_Milestone_Progress_Report.xlsx`;
      } else if (reportType === "test2") {
        sheetData = data.test2Report;
        filename = `Test2_Milestone_Progress_Report.xlsx`;
      } else if (reportType === "delayed") {
        sheetData = data.delayedReport;
        filename = `Delayed_At_Risk_Milestones_Report.xlsx`;
      }

      const ws = XLSX.utils.json_to_sheet(sheetData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Report");
      XLSX.writeFile(wb, filename);
      toast.success(`Exported ${filename}`);
    } catch (err: any) {
      toast.error(`Export failed: ${err.message}`);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AppShell
      title="Academic Timeline & Milestones"
      description="Official Odd Semester 2026–2027 Schedule, Test-1/Test-2 Milestones & Examination Workflows"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => handleExportExcel("master")} className="shrink-0 gap-1.5">
            <Download className="size-3.5 text-muted-foreground" /> Export Excel
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint} className="shrink-0 gap-1.5">
            <Printer className="size-3.5 text-muted-foreground" /> Print Calendar
          </Button>
          {isAdmin && (
            <Button size="sm" onClick={() => setIsAddOpen(true)} className="btn-3d shrink-0 gap-1.5 bg-primary text-primary-foreground font-semibold shadow">
              <Plus className="size-3.5" /> Add Milestone
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* SEMESTER PROGRESS & QUICK BANNER */}
        {overview && (
          <Card className="glass border-primary/20 bg-gradient-to-r from-primary/5 via-card to-card overflow-hidden">
            <CardContent className="p-5 sm:p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                      {overview.config.academic_year}
                    </Badge>
                    <Badge variant="secondary">{overview.config.semester_name}</Badge>
                    <span className="text-xs text-muted-foreground">
                      Commenced: <strong className="text-foreground">7 Sep 2026</strong> · Concludes:{" "}
                      <strong className="text-foreground">5 Jan 2027</strong>
                    </span>
                  </div>
                  <h2 className="text-xl font-bold tracking-tight">Academic Milestone Control Radar</h2>
                  <p className="text-xs text-muted-foreground max-w-2xl">
                    Dynamic timeline tracking all 32 official academic milestones, module coverage benchmarks,
                    question paper lifecycle, and automated schedule bottleneck detection.
                  </p>
                </div>

                {/* Progress bar and countdowns */}
                <div className="flex flex-wrap items-center gap-4 bg-muted/30 p-3.5 rounded-xl border border-border/50 min-w-[280px]">
                  <div className="flex-1 min-w-[140px]">
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span>Semester Progress</span>
                      <span className="text-primary">{overview.metrics.semesterProgressPercent}%</span>
                    </div>
                    <Progress value={overview.metrics.semesterProgressPercent} className="h-2" />
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {overview.metrics.daysRemaining} days remaining in semester
                    </p>
                  </div>
                  <div className="border-l border-border pl-4 space-y-0.5">
                    <div className="text-[11px] text-muted-foreground">Next Exam Milestone</div>
                    <div className="text-xs font-bold text-primary flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Test–1 in {overview.metrics.test1CountdownDays} days
                    </div>
                    <div className="text-[10px] text-muted-foreground">22–29 October 2026</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* CRITICAL SCHEDULE RISKS BANNER */}
        {overview && overview.risks.length > 0 && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                  Critical Milestones Requiring Immediate Attention ({overview.risks.length})
                </h4>
                <div className="mt-2 grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {overview.risks.slice(0, 3).map((risk) => (
                    <div
                      key={risk.id}
                      className="text-xs p-2.5 rounded-lg bg-background/60 border border-amber-500/20 space-y-1"
                    >
                      <div className="flex items-center justify-between font-medium">
                        <span className="truncate max-w-[160px] font-semibold">{risk.activity_name}</span>
                        <Badge
                          variant="outline"
                          className={risk.severity === "high" ? "text-destructive border-destructive/30" : "text-amber-600 border-amber-500/30"}
                        >
                          {risk.severity.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground leading-relaxed line-clamp-2">{risk.message}</p>
                      <div className="text-[11px] text-primary pt-0.5 flex items-center justify-between">
                        <span>Assigned: {risk.responsible_team}</span>
                        <Button
                          variant="link"
                          size="xs"
                          className="h-auto p-0 text-primary text-[11px]"
                          onClick={() => {
                            const act = activities.find((a) => a.id === risk.activity_id);
                            if (act) {
                              setSelectedActivity(act);
                              setIsDetailOpen(true);
                            }
                          }}
                        >
                          Inspect →
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MAIN NAVIGATION TABS */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted/60 p-1 flex-wrap h-auto gap-1">
            <TabsTrigger value="overview" className="text-xs sm:text-sm">
              <Layers className="w-3.5 h-3.5 mr-1.5" /> Overview
            </TabsTrigger>
            <TabsTrigger value="timeline_gantt" className="text-xs sm:text-sm">
              <CalendarRange className="w-3.5 h-3.5 mr-1.5" /> Gantt & Timeline
            </TabsTrigger>
            <TabsTrigger value="my_activities" className="text-xs sm:text-sm">
              <Users className="w-3.5 h-3.5 mr-1.5" /> My Activities
            </TabsTrigger>
            <TabsTrigger value="test1_workflow" className="text-xs sm:text-sm">
              <BookOpen className="w-3.5 h-3.5 mr-1.5" /> Test–1 Workflow
            </TabsTrigger>
            <TabsTrigger value="test2_workflow" className="text-xs sm:text-sm">
              <BookOpen className="w-3.5 h-3.5 mr-1.5" /> Test–2 Workflow
            </TabsTrigger>
            <TabsTrigger value="risk_monitor" className="text-xs sm:text-sm">
              <AlertTriangle className="w-3.5 h-3.5 mr-1.5" /> Delay & Risk Radar
            </TabsTrigger>
            <TabsTrigger value="official_reports" className="text-xs sm:text-sm">
              <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" /> Official Reports
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="configuration" className="text-xs sm:text-sm">
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Configuration
              </TabsTrigger>
            )}
          </TabsList>

          {/* ========================================================================= */}
          {/* TAB 1: OVERVIEW & DASHBOARD */}
          {/* ========================================================================= */}
          <TabsContent value="overview" className="space-y-6">
            {overview && (
              <div className="grid gap-3.5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-7">
                <Card className="glass card-3d">
                  <CardContent className="p-4">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">Total Milestones</div>
                    <div className="text-2xl font-bold font-display mt-1 tracking-tight text-foreground">{overview.metrics.total}</div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">32 Official Activities</p>
                  </CardContent>
                </Card>

                <Card className="glass card-3d border-emerald-500/30 bg-emerald-500/5">
                  <CardContent className="p-4">
                    <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider truncate">Completed</div>
                    <div className="text-2xl font-bold font-display text-emerald-600 dark:text-emerald-300 mt-1 tracking-tight">
                      {overview.metrics.completed}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                      {overview.metrics.completionRate}% completion rate
                    </p>
                  </CardContent>
                </Card>

                <Card className="glass card-3d border-blue-500/30 bg-blue-500/5">
                  <CardContent className="p-4">
                    <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider truncate">In Progress</div>
                    <div className="text-2xl font-bold font-display text-blue-600 dark:text-blue-300 mt-1 tracking-tight">
                      {overview.metrics.inProgress}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">Active stages</p>
                  </CardContent>
                </Card>

                <Card className="glass card-3d border-destructive/30 bg-destructive/5">
                  <CardContent className="p-4">
                    <div className="text-xs font-semibold text-destructive uppercase tracking-wider truncate">Delayed / Overdue</div>
                    <div className="text-2xl font-bold font-display text-destructive mt-1 tracking-tight">{overview.metrics.overdue}</div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">Bottlenecks flagged</p>
                  </CardContent>
                </Card>

                <Card className="glass card-3d">
                  <CardContent className="p-4">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">Upcoming</div>
                    <div className="text-2xl font-bold font-display mt-1 tracking-tight text-foreground">{overview.metrics.upcoming}</div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">Scheduled on calendar</p>
                  </CardContent>
                </Card>

                <Card className="glass card-3d border-primary/30 bg-primary/5">
                  <CardContent className="p-4">
                    <div className="text-xs font-semibold text-primary uppercase tracking-wider truncate">Test–1 Starts In</div>
                    <div className="text-2xl font-bold font-display text-primary mt-1 tracking-tight">
                      {overview.metrics.test1CountdownDays} <span className="text-xs font-normal">days</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">22 Oct 2026</p>
                  </CardContent>
                </Card>

                <Card className="glass card-3d border-indigo-500/30 bg-indigo-500/5">
                  <CardContent className="p-4">
                    <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider truncate">Test–2 Starts In</div>
                    <div className="text-2xl font-bold font-display text-indigo-600 dark:text-indigo-400 mt-1 tracking-tight">
                      {overview.metrics.test2CountdownDays} <span className="text-xs font-normal">days</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">7 Dec 2026</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* UPCOMING IMMEDIATE MILESTONES & QUICK ACTIONS */}
            <div className="grid lg:grid-cols-12 gap-6">
              {/* Immediate milestones stream */}
              <Card className="glass card-3d lg:col-span-8">
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                        <Clock className="size-4 text-primary shrink-0" /> Immediate Upcoming Milestones
                      </CardTitle>
                      <CardDescription className="text-xs">Chronological sequence of next key semester activities</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab("timeline_gantt")} className="text-xs shrink-0">
                      View Full Schedule →
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 space-y-3">
                  {overview?.nextMilestones.map((milestone) => (
                    <div
                      key={milestone.id}
                      className="p-3.5 rounded-xl border border-border/60 hover:border-primary/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/20"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-muted/80 shrink-0">
                            Sl. {milestone.sl_no}
                          </span>
                          <span className="font-semibold text-sm text-foreground break-words">{milestone.name}</span>
                          <StatusBadge status={milestone.status} />
                          {milestone.test_association !== "None" && (
                            <Badge variant="outline" className="text-xs shrink-0">
                              {milestone.test_association}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2.5 text-xs text-muted-foreground flex-wrap">
                          <span>
                            Timeline: <strong className="text-foreground">{milestone.timeline_display}</strong>
                          </span>
                          <span>·</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-medium border shrink-0 ${
                              TEAM_COLORS[milestone.responsible_team]?.bg || "bg-muted"
                            } ${TEAM_COLORS[milestone.responsible_team]?.text || "text-foreground"} ${
                              TEAM_COLORS[milestone.responsible_team]?.border || "border-border"
                            }`}
                          >
                            {milestone.responsible_team}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => {
                            setSelectedActivity(milestone);
                            setIsDetailOpen(true);
                          }}
                          className="shrink-0"
                        >
                          <Eye className="size-3.5" /> View
                        </Button>
                        <Button
                          size="xs"
                          className={
                            milestone.status === "In Progress"
                              ? "bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 font-semibold shadow-sm"
                              : "bg-primary hover:bg-primary/90 text-primary-foreground shrink-0 font-semibold shadow-sm"
                          }
                          onClick={() =>
                            toggleStatusMut.mutate({
                              id: milestone.id,
                              target_status: milestone.status === "In Progress" ? "Completed" : "In Progress",
                            })
                          }
                        >
                          {milestone.status === "In Progress" ? (
                            <>
                              <Check className="size-3.5" /> Mark Done
                            </>
                          ) : (
                            <>
                              <PlayCircle className="size-3.5" /> Start
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Connected Modules Quick Jump */}
              <div className="space-y-4 lg:col-span-4">
                <Card className="glass card-3d">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-bold flex items-center gap-2 leading-snug">
                      <Sparkles className="size-4 text-primary shrink-0" />
                      <span>Integrated Examination Operations</span>
                    </CardTitle>
                    <CardDescription className="text-xs">Direct shortcuts to linked exam administration modules</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2.5">
                    <Link
                      to="/test-management"
                      className="block p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 transition-all"
                    >
                      <div className="flex items-center justify-between font-medium text-xs">
                        <span className="text-foreground font-semibold">Test & Lab Operations Desk</span>
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Manage 10 computer labs (40 PCs each), capacity calculator, and student seat assignments.
                      </p>
                    </Link>

                    <Link
                      to="/seating"
                      className="block p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 transition-all"
                    >
                      <div className="flex items-center justify-between font-medium text-xs">
                        <span className="text-foreground font-semibold">Hall Seating Arrangement</span>
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Classroom layout allocation, roll number tags, and student desk plans.
                      </p>
                    </Link>

                    <Link
                      to="/forms/b-form"
                      className="block p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 transition-all"
                    >
                      <div className="flex items-center justify-between font-medium text-xs">
                        <span className="text-foreground font-semibold">B-Form & Duty Allotment</span>
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Generate official invigilation B-Forms and manage staff rosters.
                      </p>
                    </Link>

                    <Link
                      to="/invigilation"
                      className="block p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 transition-all"
                    >
                      <div className="flex items-center justify-between font-medium text-xs">
                        <span className="text-foreground font-semibold">Invigilation Duties</span>
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Track invigilator acceptance, standby reserves, and live duty swaps.
                      </p>
                    </Link>
                  </CardContent>
                </Card>

                {/* Schedule Summary Stats */}
                <Card className="glass">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Stakeholder Responsibilities</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs">
                    <div className="flex justify-between items-center py-1 border-b border-border/50">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-500" /> Course Faculty
                      </span>
                      <span className="font-semibold">13 Activities</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-border/50">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500" /> Test Committee
                      </span>
                      <span className="font-semibold">8 Activities</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-border/50">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-indigo-500" /> Department
                      </span>
                      <span className="font-semibold">6 Activities</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-border/50">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" /> Scrutiny Team
                      </span>
                      <span className="font-semibold">2 Activities</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-purple-500" /> University
                      </span>
                      <span className="font-semibold">2 Activities</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ========================================================================= */}
          {/* TAB 2: MULTI-VIEW TIMELINE & GANTT CHART */}
          {/* ========================================================================= */}
          <TabsContent value="timeline_gantt" className="space-y-6">
            {/* View Switcher & Filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass p-4 rounded-xl">
              <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-lg">
                <Button
                  variant={timelineSubView === "gantt" ? "default" : "ghost"}
                  size="xs"
                  onClick={() => setTimelineSubView("gantt")}
                >
                  <CalendarRange className="size-3.5" /> Gantt View
                </Button>
                <Button
                  variant={timelineSubView === "timeline" ? "default" : "ghost"}
                  size="xs"
                  onClick={() => setTimelineSubView("timeline")}
                >
                  <Clock className="size-3.5" /> Timeline View
                </Button>
                <Button
                  variant={timelineSubView === "calendar" ? "default" : "ghost"}
                  size="xs"
                  onClick={() => setTimelineSubView("calendar")}
                >
                  <CalendarDays className="size-3.5" /> Calendar View
                </Button>
                <Button
                  variant={timelineSubView === "list" ? "default" : "ghost"}
                  size="xs"
                  onClick={() => setTimelineSubView("list")}
                >
                  <ListOrdered className="size-3.5" /> List View
                </Button>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-[180px]">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                  <Input
                    placeholder="Search milestones..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-8 text-xs"
                  />
                </div>

                <Select value={filterTeam} onValueChange={setFilterTeam}>
                  <SelectTrigger className="h-8 text-xs w-[130px]">
                    <SelectValue placeholder="Team" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Teams</SelectItem>
                    <SelectItem value="Course Faculty">Course Faculty</SelectItem>
                    <SelectItem value="Test Committee">Test Committee</SelectItem>
                    <SelectItem value="Scrutiny Team">Scrutiny Team</SelectItem>
                    <SelectItem value="Department">Department</SelectItem>
                    <SelectItem value="University">University</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterTest} onValueChange={setFilterTest}>
                  <SelectTrigger className="h-8 text-xs w-[110px]">
                    <SelectValue placeholder="Exam" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tests</SelectItem>
                    <SelectItem value="Test-1">Test–1</SelectItem>
                    <SelectItem value="Test-2">Test–2</SelectItem>
                    <SelectItem value="None">Non-Exam</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-8 text-xs w-[110px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Upcoming">Upcoming</SelectItem>
                    <SelectItem value="Delayed">Delayed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* SUB-VIEW 1: GANTT CHART */}
            {timelineSubView === "gantt" && (
              <Card className="glass overflow-x-auto">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Semester Gantt Timeline (Sep 2026 – Jan 2027)</CardTitle>
                      <CardDescription>
                        Horizontal visualization of overlapping activities, preparation windows, and examination weeks
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block" /> Course Faculty
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" /> Test Committee
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 inline-block" /> Department
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" /> Scrutiny Team
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  {/* Gantt Header with Months */}
                  <div className="min-w-[950px] border border-border rounded-xl overflow-hidden bg-background">
                    <div className="grid grid-cols-12 bg-muted/50 border-b border-border text-xs font-semibold text-center py-2 text-muted-foreground">
                      <div className="col-span-4 text-left pl-4 font-bold text-foreground">
                        Activity & Responsibility
                      </div>
                      <div className="col-span-1 border-l border-border">Sep '26</div>
                      <div className="col-span-2 border-l border-border">Oct '26 (Test 1)</div>
                      <div className="col-span-2 border-l border-border">Nov '26</div>
                      <div className="col-span-2 border-l border-border">Dec '26 (Test 2)</div>
                      <div className="col-span-1 border-l border-border">Jan '27</div>
                    </div>

                    {/* Activity Rows */}
                    <div className="divide-y divide-border/60 max-h-[580px] overflow-y-auto text-xs">
                      {activities.map((act) => {
                        // Calculate percentage position along the 120-day semester (Sep 7 to Jan 5)
                        const totalDays = 120;
                        const startOffset = Math.max(0, daysDiff("2026-09-07", act.start_date));
                        const duration = Math.max(1, daysDiff(act.start_date, act.end_date) + 1);
                        const leftPercent = Math.min(100, Math.max(0, (startOffset / totalDays) * 100));
                        const widthPercent = Math.min(100 - leftPercent, Math.max(2, (duration / totalDays) * 100));

                        let barColor = "bg-primary";
                        if (act.responsible_team === "Course Faculty") barColor = "bg-blue-500";
                        if (act.responsible_team === "Test Committee") barColor = "bg-amber-500";
                        if (act.responsible_team === "Department") barColor = "bg-indigo-500";
                        if (act.responsible_team === "Scrutiny Team") barColor = "bg-emerald-500";
                        if (act.responsible_team === "University") barColor = "bg-purple-500";
                        if (act.activity_type === "holiday") barColor = "bg-muted-foreground/40";

                        return (
                          <div
                            key={act.id}
                            className="grid grid-cols-12 items-center hover:bg-muted/30 py-2 transition-colors group cursor-pointer"
                            onClick={() => {
                              setSelectedActivity(act);
                              setIsDetailOpen(true);
                            }}
                          >
                            <div className="col-span-4 pl-4 pr-2 truncate flex items-center gap-2">
                              <span className="w-5 text-[10px] text-muted-foreground font-mono shrink-0">
                                {act.sl_no}.
                              </span>
                              <span className="font-medium text-foreground truncate">{act.name}</span>
                              <span
                                className={`text-[9px] px-1 py-0.2 rounded font-medium border shrink-0 ${
                                  TEAM_COLORS[act.responsible_team]?.bg || ""
                                } ${TEAM_COLORS[act.responsible_team]?.text || ""} ${
                                  TEAM_COLORS[act.responsible_team]?.border || ""
                                }`}
                              >
                                {act.responsible_team}
                              </span>
                            </div>

                            {/* Gantt Bar Area across remaining 8 columns */}
                            <div className="col-span-8 px-2 relative h-6 flex items-center border-l border-border/40">
                              <div
                                style={{
                                  left: `${leftPercent}%`,
                                  width: `${widthPercent}%`,
                                }}
                                className={`absolute h-4 rounded-md ${barColor} text-white text-[10px] flex items-center px-1.5 font-medium shadow-xs truncate group-hover:ring-2 group-hover:ring-primary/50 transition-all`}
                                title={`${act.name}: ${act.timeline_display} (${duration} day${
                                  duration > 1 ? "s" : ""
                                })`}
                              >
                                <span className="truncate">{act.timeline_display}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* SUB-VIEW 2: TIMELINE VERTICAL STREAM */}
            {timelineSubView === "timeline" && (
              <div className="space-y-4 max-w-4xl mx-auto">
                <div className="relative pl-6 sm:pl-8 border-l-2 border-primary/30 space-y-6">
                  {activities.map((act) => (
                    <div key={act.id} className="relative group">
                      {/* Node Icon */}
                      <div
                        className={`absolute -left-[31px] sm:-left-[39px] top-1.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-xs ${
                          act.status === "Completed"
                            ? "bg-emerald-500 text-white"
                            : act.status === "In Progress"
                            ? "bg-blue-500 text-white ring-4 ring-blue-500/20"
                            : "bg-muted text-muted-foreground border border-border"
                        }`}
                      >
                        {act.sl_no}
                      </div>

                      {/* Content Box */}
                      <div className="p-4 rounded-xl border border-border/70 glass hover:border-primary/40 transition-colors space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-sm text-foreground">{act.name}</span>
                              <StatusBadge status={act.status} />
                              {act.test_association !== "None" && (
                                <Badge variant="outline" className="text-xs">
                                  {act.test_association}
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-3">
                              <span>
                                Schedule: <strong className="text-foreground">{act.timeline_display}</strong>
                              </span>
                              <span>·</span>
                              <span className="font-medium text-primary">Team: {act.responsible_team}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={() => {
                                setSelectedActivity(act);
                                setIsDetailOpen(true);
                              }}
                            >
                              Inspect Details
                            </Button>
                            <Button
                              size="xs"
                              onClick={() =>
                                toggleStatusMut.mutate({
                                  id: act.id,
                                  target_status: act.status === "In Progress" ? "Completed" : "In Progress",
                                })
                              }
                            >
                              {act.status === "In Progress" ? "Complete" : "Set Active"}
                            </Button>
                          </div>
                        </div>

                        {act.description && <p className="text-xs text-muted-foreground">{act.description}</p>}

                        {act.notes && (
                          <div className="text-[11px] p-2 rounded bg-muted/40 text-muted-foreground font-mono">
                            Note: {act.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SUB-VIEW 3: MONTHLY CALENDAR GRID */}
            {timelineSubView === "calendar" && (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  {/* October 2026 Highlight (Test-1 Month) */}
                  <Card className="glass">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center justify-between">
                        <span>October 2026 (Test–1 Phase)</span>
                        <Badge variant="secondary">Mid-Semester</Badge>
                      </CardTitle>
                      <CardDescription>QP setting, scrutiny, printing, and Test-1 execution</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {activities
                        .filter((a) => a.start_date.startsWith("2026-10") || a.end_date.startsWith("2026-10"))
                        .map((act) => (
                          <div
                            key={act.id}
                            className="p-2 rounded-lg border border-border text-xs flex items-center justify-between hover:bg-muted/40 cursor-pointer"
                            onClick={() => {
                              setSelectedActivity(act);
                              setIsDetailOpen(true);
                            }}
                          >
                            <div className="space-y-0.5 truncate pr-2">
                              <div className="font-medium text-foreground truncate">
                                {act.sl_no}. {act.name}
                              </div>
                              <div className="text-[11px] text-muted-foreground">{act.timeline_display}</div>
                            </div>
                            <StatusBadge status={act.status} />
                          </div>
                        ))}
                    </CardContent>
                  </Card>

                  {/* December 2026 Highlight (Test-2 Month) */}
                  <Card className="glass">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center justify-between">
                        <span>December 2026 (Test–2 Phase)</span>
                        <Badge variant="secondary">Semester End Pipeline</Badge>
                      </CardTitle>
                      <CardDescription>Test-2 execution, valuation, marks submission, result analysis</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {activities
                        .filter((a) => a.start_date.startsWith("2026-12") || a.end_date.startsWith("2026-12"))
                        .map((act) => (
                          <div
                            key={act.id}
                            className="p-2 rounded-lg border border-border text-xs flex items-center justify-between hover:bg-muted/40 cursor-pointer"
                            onClick={() => {
                              setSelectedActivity(act);
                              setIsDetailOpen(true);
                            }}
                          >
                            <div className="space-y-0.5 truncate pr-2">
                              <div className="font-medium text-foreground truncate">
                                {act.sl_no}. {act.name}
                              </div>
                              <div className="text-[11px] text-muted-foreground">{act.timeline_display}</div>
                            </div>
                            <StatusBadge status={act.status} />
                          </div>
                        ))}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* SUB-VIEW 4: LIST DATA TABLE */}
            {timelineSubView === "list" && (
              <Card className="glass">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted/50 border-b border-border text-muted-foreground">
                        <tr>
                          <th className="p-3 font-semibold w-12">Sl.</th>
                          <th className="p-3 font-semibold">Activity</th>
                          <th className="p-3 font-semibold">Timeline</th>
                          <th className="p-3 font-semibold">Responsibility</th>
                          <th className="p-3 font-semibold">Exam</th>
                          <th className="p-3 font-semibold">Status</th>
                          <th className="p-3 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {activities.map((act) => (
                          <tr key={act.id} className="hover:bg-muted/30 transition-colors">
                            <td className="p-3 font-mono text-muted-foreground">{act.sl_no}</td>
                            <td className="p-3 font-medium text-foreground">
                              <div className="font-semibold">{act.name}</div>
                              {act.notes && (
                                <div className="text-[11px] text-muted-foreground truncate max-w-xs">{act.notes}</div>
                              )}
                            </td>
                            <td className="p-3 text-muted-foreground whitespace-nowrap font-medium">
                              {act.timeline_display}
                            </td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                                  TEAM_COLORS[act.responsible_team]?.bg || ""
                                } ${TEAM_COLORS[act.responsible_team]?.text || ""} ${
                                  TEAM_COLORS[act.responsible_team]?.border || ""
                                }`}
                              >
                                {act.responsible_team}
                              </span>
                            </td>
                            <td className="p-3">
                              {act.test_association !== "None" ? (
                                <Badge variant="outline">{act.test_association}</Badge>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                            <td className="p-3">
                              <StatusBadge status={act.status} />
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  variant="ghost"
                                  size="xs"
                                  onClick={() => {
                                    setSelectedActivity(act);
                                    setIsDetailOpen(true);
                                  }}
                                >
                                  View
                                </Button>
                                {isAdmin && (
                                  <Button
                                    variant="outline"
                                    size="xs"
                                    onClick={() => {
                                      setSelectedActivity(act);
                                      setIsEditOpen(true);
                                    }}
                                  >
                                    Edit
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ========================================================================= */}
          {/* TAB 3: MY ACADEMIC ACTIVITIES (RESPONSIBILITY VIEW) */}
          {/* ========================================================================= */}
          <TabsContent value="my_activities" className="space-y-6">
            {/* Stakeholder Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass p-4 rounded-xl">
              <div>
                <h3 className="font-bold text-sm">Personalized Stakeholder Responsibility Desk</h3>
                <p className="text-xs text-muted-foreground">
                  View and manage activities assigned directly to your faculty role or examination committee
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Viewing As:</span>
                <Select value={myRole} onValueChange={setMyRole}>
                  <SelectTrigger className="h-8 text-xs w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Course Faculty">Course Faculty</SelectItem>
                    <SelectItem value="Test Committee">Test Committee</SelectItem>
                    <SelectItem value="Scrutiny Team">Scrutiny Team</SelectItem>
                    <SelectItem value="Department">Department</SelectItem>
                    <SelectItem value="admin">Administrator (All)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Responsibility KPI Cards */}
            {myActs && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-3 rounded-xl glass border border-border text-center">
                  <div className="text-xs text-muted-foreground">Total Assigned</div>
                  <div className="text-xl font-bold mt-0.5">{myActs.stats.totalAssigned}</div>
                </div>
                <div className="p-3 rounded-xl glass border border-amber-500/30 bg-amber-500/5 text-center">
                  <div className="text-xs text-amber-700 dark:text-amber-400 font-medium">Due This Week</div>
                  <div className="text-xl font-bold text-amber-700 dark:text-amber-300 mt-0.5">
                    {myActs.stats.dueThisWeekCount}
                  </div>
                </div>
                <div className="p-3 rounded-xl glass border border-destructive/30 bg-destructive/5 text-center">
                  <div className="text-xs text-destructive font-medium">Overdue</div>
                  <div className="text-xl font-bold text-destructive mt-0.5">{myActs.stats.overdueCount}</div>
                </div>
                <div className="p-3 rounded-xl glass border border-blue-500/30 bg-blue-500/5 text-center">
                  <div className="text-xs text-blue-700 dark:text-blue-400 font-medium">In Progress</div>
                  <div className="text-xl font-bold text-blue-700 dark:text-blue-300 mt-0.5">
                    {myActs.inProgress.length}
                  </div>
                </div>
                <div className="p-3 rounded-xl glass border border-emerald-500/30 bg-emerald-500/5 text-center">
                  <div className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Completed</div>
                  <div className="text-xl font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">
                    {myActs.stats.completedCount}
                  </div>
                </div>
              </div>
            )}

            {/* List of Assigned Milestones */}
            <Card className="glass">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Assigned Milestone Checklist ({myRole})</CardTitle>
                <CardDescription>
                  Mark your milestones completed as soon as documentation and submissions are confirmed
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {myActs?.all.map((act) => (
                  <div
                    key={act.id}
                    className="p-3.5 rounded-xl border border-border/70 hover:border-primary/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/20"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-muted">Sl. {act.sl_no}</span>
                        <span className="font-semibold text-sm text-foreground">{act.name}</span>
                        <StatusBadge status={act.status} />
                        {act.test_association !== "None" && <Badge variant="outline">{act.test_association}</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <span>
                          Timeline: <strong className="text-foreground">{act.timeline_display}</strong>
                        </span>
                        <span>·</span>
                        <span>Due: {act.due_date || act.end_date}</span>
                      </div>
                      {act.notes && <p className="text-xs text-muted-foreground mt-1 font-mono">{act.notes}</p>}
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => {
                          setSelectedActivity(act);
                          setIsDetailOpen(true);
                        }}
                      >
                        Details
                      </Button>
                      <Button
                        size="xs"
                        variant={act.status === "Completed" ? "secondary" : "default"}
                        onClick={() =>
                          toggleStatusMut.mutate({
                            id: act.id,
                            target_status: act.status === "Completed" ? "In Progress" : "Completed",
                          })
                        }
                      >
                        {act.status === "Completed" ? "Reopen Milestone" : "Mark as Completed"}
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ========================================================================= */}
          {/* TAB 4: TEST-1 COMPLETE WORKFLOW STEPPER */}
          {/* ========================================================================= */}
          <TabsContent value="test1_workflow" className="space-y-6">
            {workflows?.test1 && (
              <Card className="glass border-primary/20">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-primary/10 text-primary border-primary/20">Official Pipeline</Badge>
                        <CardTitle className="text-base">{workflows.test1.name}</CardTitle>
                      </div>
                      <CardDescription>
                        Execution Window: <strong>{workflows.test1.scheduled_dates}</strong> ·{" "}
                        {workflows.test1.completed_count} of {workflows.test1.total_count} Stages Completed
                      </CardDescription>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link to="/test-management">
                        <Button variant="outline" size="sm">
                          Open Lab Operations →
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Stages List */}
                  <div className="space-y-3">
                    {workflows.test1.stages.map((stage, idx) => (
                      <div
                        key={stage.id}
                        className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          stage.status === "Completed"
                            ? "border-emerald-500/30 bg-emerald-500/5"
                            : stage.status === "In Progress"
                            ? "border-blue-500/40 bg-blue-500/5 ring-1 ring-blue-500/20"
                            : "border-border/60 bg-muted/20"
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                              {idx + 1}
                            </span>
                            <span className="font-semibold text-sm text-foreground">{stage.name}</span>
                            <StatusBadge status={stage.status} />
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded font-medium border ${
                                TEAM_COLORS[stage.responsible_team]?.bg || ""
                              } ${TEAM_COLORS[stage.responsible_team]?.text || ""} ${
                                TEAM_COLORS[stage.responsible_team]?.border || ""
                              }`}
                            >
                              {stage.responsible_team}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-3 pl-8">
                            <span>
                              Scheduled: <strong className="text-foreground">{stage.timeline_display}</strong>
                            </span>
                            {stage.actual_completion_date && (
                              <span className="text-emerald-700 dark:text-emerald-400">
                                Completed on: {stage.actual_completion_date}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => {
                              setSelectedActivity(stage);
                              setIsDetailOpen(true);
                            }}
                          >
                            Inspect
                          </Button>
                          <Button
                            size="xs"
                            onClick={() =>
                              toggleStatusMut.mutate({
                                id: stage.id,
                                target_status: stage.status === "Completed" ? "In Progress" : "Completed",
                              })
                            }
                          >
                            {stage.status === "Completed" ? "Revert" : "Complete Stage"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ========================================================================= */}
          {/* TAB 5: TEST-2 COMPLETE WORKFLOW STEPPER */}
          {/* ========================================================================= */}
          <TabsContent value="test2_workflow" className="space-y-6">
            {workflows?.test2 && (
              <Card className="glass border-primary/20">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-primary/10 text-primary border-primary/20">Official Pipeline</Badge>
                        <CardTitle className="text-base">{workflows.test2.name}</CardTitle>
                      </div>
                      <CardDescription>
                        Execution Window: <strong>{workflows.test2.scheduled_dates}</strong> ·{" "}
                        {workflows.test2.completed_count} of {workflows.test2.total_count} Stages Completed
                      </CardDescription>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link to="/test-management">
                        <Button variant="outline" size="sm">
                          Open Lab Operations →
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Stages List */}
                  <div className="space-y-3">
                    {workflows.test2.stages.map((stage, idx) => (
                      <div
                        key={stage.id}
                        className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          stage.status === "Completed"
                            ? "border-emerald-500/30 bg-emerald-500/5"
                            : stage.status === "In Progress"
                            ? "border-blue-500/40 bg-blue-500/5 ring-1 ring-blue-500/20"
                            : "border-border/60 bg-muted/20"
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                              {idx + 1}
                            </span>
                            <span className="font-semibold text-sm text-foreground">{stage.name}</span>
                            <StatusBadge status={stage.status} />
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded font-medium border ${
                                TEAM_COLORS[stage.responsible_team]?.bg || ""
                              } ${TEAM_COLORS[stage.responsible_team]?.text || ""} ${
                                TEAM_COLORS[stage.responsible_team]?.border || ""
                              }`}
                            >
                              {stage.responsible_team}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-3 pl-8">
                            <span>
                              Scheduled: <strong className="text-foreground">{stage.timeline_display}</strong>
                            </span>
                            {stage.actual_completion_date && (
                              <span className="text-emerald-700 dark:text-emerald-400">
                                Completed on: {stage.actual_completion_date}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => {
                              setSelectedActivity(stage);
                              setIsDetailOpen(true);
                            }}
                          >
                            Inspect
                          </Button>
                          <Button
                            size="xs"
                            onClick={() =>
                              toggleStatusMut.mutate({
                                id: stage.id,
                                target_status: stage.status === "Completed" ? "In Progress" : "Completed",
                              })
                            }
                          >
                            {stage.status === "Completed" ? "Revert" : "Complete Stage"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ========================================================================= */}
          {/* TAB 6: CRITICAL RISKS & DELAY RADAR */}
          {/* ========================================================================= */}
          <TabsContent value="risk_monitor" className="space-y-6">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" /> Automated Schedule Delay & Risk Engine
                </CardTitle>
                <CardDescription>
                  Real-time heuristic analysis identifying approaching submission deadlines, unscrutinized question
                  papers, unfinalized seating, and marks upload bottlenecks.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {overview?.risks && overview.risks.length > 0 ? (
                  <div className="space-y-3">
                    {overview.risks.map((risk) => (
                      <div
                        key={risk.id}
                        className="p-4 rounded-xl border border-border/80 glass flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={
                                risk.severity === "high"
                                  ? "bg-destructive/10 text-destructive border-destructive/30 font-semibold"
                                  : "bg-amber-500/10 text-amber-600 border-amber-500/30"
                              }
                            >
                              {risk.severity.toUpperCase()} RISK
                            </Badge>
                            <span className="font-semibold text-sm text-foreground">{risk.activity_name}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{risk.message}</p>
                          <div className="text-xs text-primary font-medium flex items-center gap-1.5 pt-1">
                            <Sparkles className="w-3 h-3 text-primary shrink-0" />
                            <span>Recommendation: {risk.recommendation}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-muted-foreground">Team: {risk.responsible_team}</span>
                          <Button
                            size="xs"
                            onClick={() => {
                              const act = activities.find((a) => a.id === risk.activity_id);
                              if (act) {
                                setSelectedActivity(act);
                                setIsDetailOpen(true);
                              }
                            }}
                          >
                            Resolve Alert →
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-muted-foreground text-sm space-y-1">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="font-medium text-foreground">Schedule Operating at Peak Compliance</p>
                    <p className="text-xs">No active milestone delays or overdue tasks detected.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ========================================================================= */}
          {/* TAB 7: OFFICIAL INSTITUTIONAL REPORTS */}
          {/* ========================================================================= */}
          <TabsContent value="official_reports" className="space-y-6">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-primary" /> Official Semester Academic Reports
                </CardTitle>
                <CardDescription>
                  Download official formatted Excel spreadsheets or generate print-ready institutional copies
                  incorporating university seals and signatory sections.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Report 1 */}
                  <div className="p-4 rounded-xl border border-border/80 glass space-y-3">
                    <div className="space-y-1">
                      <Badge variant="outline">Report 1</Badge>
                      <h4 className="font-semibold text-sm">Semester Activity Master Report</h4>
                      <p className="text-xs text-muted-foreground">
                        Complete chronological register of all 32 activities, timelines, responsibilities, and delay days.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <Button size="xs" variant="outline" onClick={() => handleExportExcel("master")} className="gap-1.5">
                        <Download className="size-3.5" /> Excel (.xlsx)
                      </Button>
                      <Button size="xs" variant="ghost" onClick={handlePrint} className="gap-1.5">
                        <Printer className="size-3.5" /> Print Copy
                      </Button>
                    </div>
                  </div>

                  {/* Report 2 */}
                  <div className="p-4 rounded-xl border border-border/80 glass space-y-3">
                    <div className="space-y-1">
                      <Badge variant="outline">Report 2</Badge>
                      <h4 className="font-semibold text-sm">Stakeholder Responsibility Report</h4>
                      <p className="text-xs text-muted-foreground">
                        Workload distribution across University, Course Faculty, Test Committee, Scrutiny, and Department.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <Button size="xs" variant="outline" onClick={() => handleExportExcel("responsibility")} className="gap-1.5">
                        <Download className="size-3.5" /> Excel (.xlsx)
                      </Button>
                      <Button size="xs" variant="ghost" onClick={handlePrint} className="gap-1.5">
                        <Printer className="size-3.5" /> Print Copy
                      </Button>
                    </div>
                  </div>

                  {/* Report 3 */}
                  <div className="p-4 rounded-xl border border-border/80 glass space-y-3">
                    <div className="space-y-1">
                      <Badge variant="outline">Report 3</Badge>
                      <h4 className="font-semibold text-sm">Test–1 Milestone Progress Report</h4>
                      <p className="text-xs text-muted-foreground">
                        Stage-by-stage audit from syllabus completion to Test-1 marks upload.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <Button size="xs" variant="outline" onClick={() => handleExportExcel("test1")} className="gap-1.5">
                        <Download className="size-3.5" /> Excel (.xlsx)
                      </Button>
                      <Button size="xs" variant="ghost" onClick={handlePrint} className="gap-1.5">
                        <Printer className="size-3.5" /> Print Copy
                      </Button>
                    </div>
                  </div>

                  {/* Report 4 */}
                  <div className="p-4 rounded-xl border border-border/80 glass space-y-3">
                    <div className="space-y-1">
                      <Badge variant="outline">Report 4</Badge>
                      <h4 className="font-semibold text-sm">Test–2 Milestone Progress Report</h4>
                      <p className="text-xs text-muted-foreground">
                        Pipeline tracking for Test-2 QP cycle, execution, valuation, and result analysis.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <Button size="xs" variant="outline" onClick={() => handleExportExcel("test2")} className="gap-1.5">
                        <Download className="size-3.5" /> Excel (.xlsx)
                      </Button>
                      <Button size="xs" variant="ghost" onClick={handlePrint} className="gap-1.5">
                        <Printer className="size-3.5" /> Print Copy
                      </Button>
                    </div>
                  </div>

                  {/* Report 5 */}
                  <div className="p-4 rounded-xl border border-border/80 glass space-y-3">
                    <div className="space-y-1">
                      <Badge variant="outline" className="border-destructive/30 text-destructive">
                        Report 5
                      </Badge>
                      <h4 className="font-semibold text-sm">Delayed & At-Risk Milestones</h4>
                      <p className="text-xs text-muted-foreground">
                        Audit sheet detailing delayed activities, days overdue, and mitigation directives.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <Button size="xs" variant="outline" onClick={() => handleExportExcel("delayed")}>
                        <Download className="w-3.5 h-3.5 mr-1" /> Excel (.xlsx)
                      </Button>
                      <Button size="xs" variant="ghost" onClick={handlePrint}>
                        <Printer className="w-3.5 h-3.5 mr-1" /> Print Copy
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ========================================================================= */}
          {/* TAB 8: CALENDAR CONFIGURATION (ADMIN) */}
          {/* ========================================================================= */}
          {isAdmin && (
            <TabsContent value="configuration" className="space-y-6">
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-primary" /> Academic Calendar Configuration & Maintenance
                  </CardTitle>
                  <CardDescription>
                    Modify semester dates, add customized milestones, or reset the schedule back to official defaults.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-xl border border-border/80 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="font-semibold text-sm">Reset to Official Provided Semester Schedule</h4>
                      <p className="text-xs text-muted-foreground">
                        Restores the pristine 32-activity timeline (7 September 2026 to 5 January 2027) matching the
                        institutional syllabus requirements.
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => resetCalendarMut.mutate()}
                      disabled={resetCalendarMut.isPending}
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Reset Schedule
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: MILESTONE DETAILS INSPECTOR */}
      {/* ========================================================================= */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-lg">
          {selectedActivity && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Sl. {selectedActivity.sl_no}</Badge>
                  <StatusBadge status={selectedActivity.status} />
                </div>
                <DialogTitle className="text-lg font-bold">{selectedActivity.name}</DialogTitle>
                <DialogDescription>
                  Timeline: <strong className="text-foreground">{selectedActivity.timeline_display}</strong>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2 text-xs">
                <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/40 border border-border">
                  <div>
                    <span className="text-muted-foreground">Responsible Team</span>
                    <div className="font-semibold text-foreground mt-0.5">{selectedActivity.responsible_team}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Exam Association</span>
                    <div className="font-semibold text-foreground mt-0.5">{selectedActivity.test_association}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Start – End Window</span>
                    <div className="font-semibold text-foreground mt-0.5">
                      {selectedActivity.start_date} → {selectedActivity.end_date}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Deadline / Due Date</span>
                    <div className="font-semibold text-foreground mt-0.5">
                      {selectedActivity.due_date || selectedActivity.end_date}
                    </div>
                  </div>
                </div>

                {selectedActivity.description && (
                  <div>
                    <span className="font-semibold text-muted-foreground">Description</span>
                    <p className="mt-1 text-muted-foreground leading-relaxed">{selectedActivity.description}</p>
                  </div>
                )}

                {selectedActivity.notes && (
                  <div>
                    <span className="font-semibold text-muted-foreground">Instructions & Notes</span>
                    <p className="mt-1 font-mono text-muted-foreground bg-muted/30 p-2.5 rounded border border-border">
                      {selectedActivity.notes}
                    </p>
                  </div>
                )}

                {selectedActivity.actual_completion_date && (
                  <div className="p-2.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                    Officially marked completed on: <strong>{selectedActivity.actual_completion_date}</strong>
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsDetailOpen(false)}>
                  Close
                </Button>
                {isAdmin && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsDetailOpen(false);
                      setIsEditOpen(true);
                    }}
                  >
                    Edit Milestone
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={() => {
                    toggleStatusMut.mutate({
                      id: selectedActivity.id,
                      target_status: selectedActivity.status === "Completed" ? "In Progress" : "Completed",
                    });
                    setIsDetailOpen(false);
                  }}
                >
                  {selectedActivity.status === "Completed" ? "Revert to In Progress" : "Mark as Completed"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 2: DEPENDENCY OVERRIDE CONFIRMATION */}
      {/* ========================================================================= */}
      <Dialog open={overrideModal.isOpen} onOpenChange={(open) => setOverrideModal((prev) => ({ ...prev, isOpen: open }))}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2 text-amber-600">
              <AlertTriangle className="w-5 h-5" /> Predecessor Milestone Incomplete
            </DialogTitle>
            <DialogDescription>
              One or more prerequisites for this milestone have not yet been marked completed.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 space-y-1.5">
              <span className="font-semibold text-amber-900 dark:text-amber-200">Uncompleted Predecessors:</span>
              <ul className="list-disc pl-4 space-y-0.5 text-muted-foreground">
                {overrideModal.dependencies.map((dep) => (
                  <li key={dep.id}>
                    <strong>{dep.name}</strong> (Current Status: {dep.status})
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Reason for Administrative Override</Label>
              <Input
                value={overrideModal.reason}
                onChange={(e) => setOverrideModal((prev) => ({ ...prev, reason: e.target.value }))}
                placeholder="e.g. Scrutiny completed ahead of schedule by special committee"
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOverrideModal((prev) => ({ ...prev, isOpen: false }))}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                toggleStatusMut.mutate({
                  id: overrideModal.activityId,
                  target_status: overrideModal.targetStatus,
                  allow_override: true,
                  override_reason: overrideModal.reason,
                });
                setOverrideModal((prev) => ({ ...prev, isOpen: false }));
              }}
            >
              Confirm Override & Complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 3: ADD NEW ACTIVITY */}
      {/* ========================================================================= */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Add Academic Milestone</DialogTitle>
            <DialogDescription>Create a custom semester activity or exam checkpoint</DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              createActMut.mutate({
                name: fd.get("name"),
                activity_type: fd.get("activity_type"),
                timeline_display: fd.get("timeline_display"),
                start_date: fd.get("start_date"),
                end_date: fd.get("end_date"),
                due_date: fd.get("due_date"),
                responsible_team: fd.get("responsible_team"),
                test_association: fd.get("test_association"),
                priority: fd.get("priority"),
                notes: fd.get("notes"),
              });
            }}
            className="space-y-3 text-xs"
          >
            <div className="space-y-1">
              <Label className="text-xs">Activity Name</Label>
              <Input name="name" required placeholder="e.g. Remedial Class Schedule" className="text-xs h-8" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Timeline Display Text</Label>
                <Input
                  name="timeline_display"
                  required
                  placeholder="e.g. By 10 November 2026"
                  className="text-xs h-8"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Activity Type</Label>
                <Select name="activity_type" defaultValue="academic">
                  <SelectTrigger className="text-xs h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="academic">Academic</SelectItem>
                    <SelectItem value="syllabus">Syllabus</SelectItem>
                    <SelectItem value="notification">Notification</SelectItem>
                    <SelectItem value="qp_setting">QP Setting</SelectItem>
                    <SelectItem value="scrutiny">Scrutiny</SelectItem>
                    <SelectItem value="exam">Examination</SelectItem>
                    <SelectItem value="valuation">Valuation</SelectItem>
                    <SelectItem value="marks">Marks</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Start Date</Label>
                <Input name="start_date" type="date" defaultValue="2026-10-01" required className="text-xs h-8" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">End Date</Label>
                <Input name="end_date" type="date" defaultValue="2026-10-05" required className="text-xs h-8" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Responsible Team</Label>
                <Select name="responsible_team" defaultValue="Course Faculty">
                  <SelectTrigger className="text-xs h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Course Faculty">Course Faculty</SelectItem>
                    <SelectItem value="Test Committee">Test Committee</SelectItem>
                    <SelectItem value="Scrutiny Team">Scrutiny Team</SelectItem>
                    <SelectItem value="Department">Department</SelectItem>
                    <SelectItem value="University">University</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Exam Association</Label>
                <Select name="test_association" defaultValue="None">
                  <SelectTrigger className="text-xs h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="None">None</SelectItem>
                    <SelectItem value="Test-1">Test–1</SelectItem>
                    <SelectItem value="Test-2">Test–2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Priority</Label>
              <Select name="priority" defaultValue="Medium">
                <SelectTrigger className="text-xs h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Notes / Instructions</Label>
              <Textarea name="notes" placeholder="Additional directions..." className="text-xs min-h-[60px]" />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={createActMut.isPending}>
                Create Milestone
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
