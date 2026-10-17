// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { Printer, Plus, Edit2, Trash2, GraduationCap } from "lucide-react";
import { toast } from "sonner";

import { AppShell, useMe } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { listStudents, createStudent, updateStudent, deleteStudent } from "@/lib/invigilation.functions";
import { StudentImportDialog } from "@/components/StudentImportDialog";

export const Route = createFileRoute("/_authenticated/students")({
  head: () => ({
    meta: [
      { title: "Student seating roster — InvigilateOS" },
      { name: "description", content: "Serial-wise student roster with hall, section and seat allocation across all five floors." },
      { property: "og:title", content: "Student seating roster — InvigilateOS" },
      { property: "og:description", content: "Serial-wise student roster with section-wise hall and seat allocation." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: StudentsPage,
});

const PAGE = 60;

function StudentsPage() {
  const qc = useQueryClient();
  const fn = useServerFn(listStudents);
  const createFn = useServerFn(createStudent);
  const updateFn = useServerFn(updateStudent);
  const deleteFn = useServerFn(deleteStudent);

  const { data: me } = useMe();
  const isAdmin = Boolean(me?.isAdmin);
  const { data, isLoading } = useQuery({ queryKey: ["students"], queryFn: () => fn() });

  const [q, setQ] = useState("");
  const [selectedSection, setSelectedSection] = useState<string>("ALL");
  const [selectedDept, setSelectedDept] = useState<string>("ALL");
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState<"serial" | "name" | "section">("name");

  // Add Student State
  const [addOpen, setAddOpen] = useState(false);
  const [newStudent, setNewStudent] = useState({
    register_no: "",
    full_name: "",
    department: "Computer Science",
    section: "A",
    semester: 4,
  });

  // Edit Student State
  const [editOpen, setEditOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any | null>(null);

  const createMutation = useMutation({
    mutationFn: (studentData: any) => createFn({ data: studentData }),
    onSuccess: () => {
      toast.success("Student added successfully to seating roster");
      setAddOpen(false);
      setNewStudent({ register_no: "", full_name: "", department: "Computer Science", section: "A", semester: 4 });
      qc.invalidateQueries({ queryKey: ["students"] });
    },
    onError: (e: any) => toast.error("Failed to add student: " + e.message),
  });

  const updateMutation = useMutation({
    mutationFn: (studentData: any) => updateFn({ data: studentData }),
    onSuccess: () => {
      toast.success("Student record updated successfully");
      setEditOpen(false);
      setEditingStudent(null);
      qc.invalidateQueries({ queryKey: ["students"] });
    },
    onError: (e: any) => toast.error("Failed to update student: " + e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (studentId: string) => deleteFn({ data: { studentId } }),
    onSuccess: () => {
      toast.success("Student removed from examination roster");
      qc.invalidateQueries({ queryKey: ["students"] });
    },
    onError: (e: any) => toast.error("Failed to delete student: " + e.message),
  });

  const handleEditClick = (student: any) => {
    setEditingStudent({
      id: student.id,
      register_no: student.register_no,
      full_name: student.full_name,
      department: student.department || "Computer Science",
      section: student.section || "A",
      semester: student.semester || 4,
    });
    setEditOpen(true);
  };

  const handleDeleteClick = (student: any) => {
    if (confirm(`Are you sure you want to remove student ${student.full_name} (${student.register_no})?`)) {
      deleteMutation.mutate(student.id);
    }
  };

  const departments = useMemo(() => {
    const all = data ?? [];
    const unique = Array.from(new Set(all.map((s) => s.department).filter(Boolean))).sort();
    return unique;
  }, [data]);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    const all = data ?? [];
    const filtered = all.filter((s) => {
      const matchesSearch =
        !term ||
        String(s.serial_no).includes(term) ||
        s.register_no.toLowerCase().includes(term) ||
        s.full_name.toLowerCase().includes(term) ||
        (s.hall && s.hall.toLowerCase().includes(term)) ||
        (s.section && s.section.toLowerCase().includes(term));

      const matchesSection = selectedSection === "ALL" || s.section === selectedSection;
      const matchesDept = selectedDept === "ALL" || s.department === selectedDept;
      return matchesSearch && matchesSection && matchesDept;
    });

    const sorted = [...filtered];
    sorted.sort((a, b) => {
      if (sort === "name") {
        return a.full_name.localeCompare(b.full_name, undefined, { sensitivity: "base" });
      }
      if (sort === "section") {
        return (a.section || "A").localeCompare(b.section || "A");
      }
      return a.serial_no - b.serial_no;
    });
    return sorted;
  }, [data, q, selectedSection, selectedDept, sort]);

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE));
  const current = Math.min(page, pageCount - 1);
  const slice = rows.slice(current * PAGE, current * PAGE + PAGE);

  return (
    <AppShell
      title="Student Seating Roster & Section Matrix"
      description="Serial numbers 1 onward, 30 students per hall, 8 halls (A-101 to A-508) in Block A"
      actions={
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(0);
            }}
            placeholder="Search SRN, name, section or hall"
            className="w-full sm:w-56 no-print"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            title="Print Official Seating Roster"
            className="no-print"
          >
            <Printer className="mr-1.5 size-4" /> Print Roster
          </Button>

          {isAdmin ? (
            <div className="flex items-center gap-2 no-print">
              <Button
                size="sm"
                className="btn-3d flex items-center gap-1"
                onClick={() => setAddOpen(true)}
              >
                <Plus className="size-4" /> Add Student
              </Button>
              <StudentImportDialog />
            </div>
          ) : (
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs font-semibold no-print">
              Faculty View · Read Only
            </Badge>
          )}
        </div>
      }
    >
      {/* Official Print Header (Visible ONLY when printing) */}
      <div className="print-header">
        <h2 style={{ fontSize: "18pt", fontWeight: "bold", margin: 0 }}>EXAMINATION CELL — OFFICIAL STUDENT SEATING MATRIX</h2>
        <p style={{ fontSize: "11pt", margin: "4px 0" }}>Block A | Total Enrolled Students: {data?.length ?? 500} | 30 Students per Hall</p>
        <p style={{ fontSize: "9pt", color: "#555" }}>Date: {new Date().toLocaleDateString('en-IN', { dateStyle: 'full' })}</p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading student seating roster…</p>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3.5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            {[
              ["Total Students", data?.length ?? 0],
              ["Total Block A Halls", 40],
              ["Floors", 5],
              ["Capacity per Hall", 30],
              ["Sections", "A, B, C, D, E"],
            ].map(([label, value]) => (
              <div key={String(label)} className="card-3d p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
                <p className="mt-1 font-display text-xl font-semibold">{value}</p>
              </div>
            ))}
          </div>

          {/* Section Filter Pills */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-foreground/10 bg-card/60 p-3 no-print">
            <div className="flex flex-wrap items-center gap-3">
              {/* Department Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase text-muted-foreground">Dept:</span>
                <Select
                  value={selectedDept}
                  onValueChange={(v) => { setSelectedDept(v); setPage(0); }}
                >
                  <SelectTrigger className="h-8 w-44 text-xs">
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Departments</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold uppercase text-muted-foreground mr-1">Section:</span>
                {["ALL", "A", "B", "C", "D", "E"].map((sec) => (
                  <Button
                    key={sec}
                    variant={selectedSection === sec ? "default" : "outline"}
                    size="xs"
                    onClick={() => {
                      setSelectedSection(sec);
                      setPage(0);
                    }}
                    className="h-8 px-3 text-xs"
                  >
                    {sec === "ALL" ? "All Sections" : `Sec ${sec}`}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-xs font-semibold uppercase text-muted-foreground mr-1">Sort:</span>
              <Button
                variant={sort === "name" ? "default" : "outline"}
                size="sm"
                onClick={() => { setSort("name"); setPage(0); }}
                className="h-8 text-xs"
              >
                A–Z Name
              </Button>
              <Button
                variant={sort === "section" ? "default" : "outline"}
                size="sm"
                onClick={() => { setSort("section"); setPage(0); }}
                className="h-8 text-xs"
              >
                Section
              </Button>
              <Button
                variant={sort === "serial" ? "default" : "outline"}
                size="sm"
                onClick={() => { setSort("serial"); setPage(0); }}
                className="h-8 text-xs"
              >
                S.No
              </Button>
            </div>
          </div>

          <div className="card-3d overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>S.No</TableHead>
                  <TableHead>Register No (SRN)</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Hall</TableHead>
                  <TableHead>Floor</TableHead>
                  <TableHead>Seat No</TableHead>
                  {isAdmin && <TableHead className="text-right no-print">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {slice.map((s, i) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{current * PAGE + i + 1}</TableCell>
                    <TableCell className="font-mono text-xs font-semibold text-primary">{s.register_no}</TableCell>
                    <TableCell className="font-medium">{s.full_name}</TableCell>
                    <TableCell className="text-muted-foreground">{s.department}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-semibold bg-primary/10 text-primary border-primary/20">
                        Section {s.section || "A"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono">{s.hall}</Badge>
                    </TableCell>
                    <TableCell>Floor {s.floor ?? 1}</TableCell>
                    <TableCell className="font-semibold">Seat {s.seat_no}</TableCell>
                    {isAdmin && (
                      <TableCell className="text-right no-print">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            className="text-muted-foreground hover:text-foreground"
                            title="Edit Student"
                            onClick={() => handleEditClick(s)}
                          >
                            <Edit2 className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            className="text-destructive hover:bg-destructive/10"
                            title="Delete Student"
                            onClick={() => handleDeleteClick(s)}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between text-sm no-print">
            <p className="text-muted-foreground">
              Showing {slice.length} of {rows.length} students{selectedDept !== "ALL" ? ` · ${selectedDept}` : ""}{selectedSection !== "ALL" ? ` · Section ${selectedSection}` : ""}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={current === 0} onClick={() => setPage(current - 1)}>
                Previous
              </Button>
              <span className="text-muted-foreground">
                Page {current + 1} / {pageCount}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={current >= pageCount - 1}
                onClick={() => setPage(current + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Add Student Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="glass-strong max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="size-5 text-primary" />
              Add Student to Seating Pool
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="std-srn">Register Number / SRN *</Label>
              <Input
                id="std-srn"
                value={newStudent.register_no}
                onChange={(e) => setNewStudent({ ...newStudent, register_no: e.target.value })}
                placeholder="e.g. 24CS099"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="std-name">Student Full Name *</Label>
              <Input
                id="std-name"
                value={newStudent.full_name}
                onChange={(e) => setNewStudent({ ...newStudent, full_name: e.target.value })}
                placeholder="e.g. Rohan Malhotra"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="std-dept">Department *</Label>
                <Input
                  id="std-dept"
                  value={newStudent.department}
                  onChange={(e) => setNewStudent({ ...newStudent, department: e.target.value })}
                  placeholder="Computer Science"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="std-sec">Section *</Label>
                <Select
                  value={newStudent.section}
                  onValueChange={(v) => setNewStudent({ ...newStudent, section: v })}
                >
                  <SelectTrigger id="std-sec">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["A", "B", "C", "D", "E"].map((sec) => (
                      <SelectItem key={sec} value={sec}>
                        Section {sec}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="std-sem">Semester</Label>
              <Input
                id="std-sem"
                type="number"
                min={1}
                max={12}
                value={newStudent.semester}
                onChange={(e) => setNewStudent({ ...newStudent, semester: parseInt(e.target.value) || 1 })}
              />
            </div>
          </div>
          <DialogFooter className="pt-3">
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              className="btn-3d"
              disabled={createMutation.isPending || !newStudent.register_no.trim() || !newStudent.full_name.trim()}
              onClick={() => createMutation.mutate(newStudent)}
            >
              {createMutation.isPending ? "Adding…" : "Add Student"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Admin Edit Student Dialog */}
      <Dialog open={editOpen} onOpenChange={(v) => !v && setEditOpen(false)}>
        <DialogContent className="glass-strong max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="size-5 text-primary" />
              Edit Student Details
            </DialogTitle>
          </DialogHeader>
          {editingStudent && (
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="edit-std-srn">Register Number / SRN *</Label>
                <Input
                  id="edit-std-srn"
                  value={editingStudent.register_no}
                  onChange={(e) => setEditingStudent({ ...editingStudent, register_no: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-std-name">Student Full Name *</Label>
                <Input
                  id="edit-std-name"
                  value={editingStudent.full_name}
                  onChange={(e) => setEditingStudent({ ...editingStudent, full_name: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-std-dept">Department *</Label>
                  <Input
                    id="edit-std-dept"
                    value={editingStudent.department}
                    onChange={(e) => setEditingStudent({ ...editingStudent, department: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-std-sec">Section *</Label>
                  <Select
                    value={editingStudent.section}
                    onValueChange={(v) => setEditingStudent({ ...editingStudent, section: v })}
                  >
                    <SelectTrigger id="edit-std-sec">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["A", "B", "C", "D", "E"].map((sec) => (
                        <SelectItem key={sec} value={sec}>
                          Section {sec}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-std-sem">Semester</Label>
                <Input
                  id="edit-std-sem"
                  type="number"
                  min={1}
                  max={12}
                  value={editingStudent.semester}
                  onChange={(e) => setEditingStudent({ ...editingStudent, semester: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>
          )}
          <DialogFooter className="pt-3">
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button
              className="btn-3d"
              disabled={updateMutation.isPending || !editingStudent?.register_no?.trim() || !editingStudent?.full_name?.trim()}
              onClick={() => updateMutation.mutate(editingStudent)}
            >
              {updateMutation.isPending ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
