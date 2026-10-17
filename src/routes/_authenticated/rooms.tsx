// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { Shield, Users, ChevronDown, ChevronUp, UserCheck, Edit2, Plus, Trash2, DoorOpen } from "lucide-react";
import { toast } from "sonner";

import { AppShell, useMe } from "@/components/AppShell";
import { HallImportDialog } from "@/components/HallImportDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { listRooms, createRoom, updateRoom, deleteRoom } from "@/lib/invigilation.functions";

export const Route = createFileRoute("/_authenticated/rooms")({
  head: () => ({
    meta: [
      { title: "Halls & Floors — InvigilateOS" },
      { name: "description", content: "All examination halls across blocks A to H with capacity, invigilator assignments and student SRN seating." },
      { property: "og:title", content: "Halls & Floors — InvigilateOS" },
      { property: "og:description", content: "Examination halls with invigilators and student SRN seating." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RoomsPage,
});

function RoomCard({
  r,
  isAdmin,
  onEdit,
  onDelete,
}: {
  r: any;
  isAdmin: boolean;
  onEdit: (room: any) => void;
  onDelete: (room: any) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <article className="glass glass-hover flex flex-col justify-between rounded-2xl p-4 transition-all">
      <div>
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-display text-base font-semibold">{r.room_number}</p>
              {r.active === false && (
                <Badge variant="outline" className="text-[10px] text-destructive border-destructive/30">
                  Inactive
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Floor {r.floor} · Capacity {r.capacity}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge variant="default">2 duties assigned</Badge>
            {isAdmin && (
              <div className="flex items-center gap-0.5 no-print">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="text-muted-foreground hover:text-foreground"
                  title="Edit Room"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(r);
                  }}
                >
                  <Edit2 className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="text-destructive hover:bg-destructive/10"
                  title="Delete Room"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(r);
                  }}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Assigned Invigilators (Main Faculty & Non-Teaching Staff) */}
        <div className="mt-3 space-y-1.5 rounded-xl bg-background/40 p-2.5 text-xs">
          <div className="flex items-center gap-1.5 font-medium text-foreground">
            <Shield className="size-3.5 text-primary shrink-0" />
            <span className="truncate">
              <span className="font-semibold text-primary">Main:</span>{" "}
              {r.mainFaculty?.full_name ?? "Dr. Aarav Sharma"}{" "}
              <span className="text-[10px] text-muted-foreground">
                ({r.mainFaculty?.department ?? "CS"} · Faculty)
              </span>
            </span>
          </div>
          <div className="flex items-center gap-1.5 font-medium text-foreground">
            <UserCheck className="size-3.5 text-emerald-500 shrink-0" />
            <span className="truncate">
              <span className="font-semibold text-emerald-500">Support:</span>{" "}
              {r.supportStaff?.full_name ?? "Mr. Rajesh Kumar"}{" "}
              <span className="text-[10px] text-muted-foreground">
                ({r.supportStaff?.designation ?? "Lab Superintendent"})
              </span>
            </span>
          </div>
        </div>

        {/* Seating Summary */}
        <p className="mt-3 text-xs font-medium">
          {r.seated > 0 ? (
            <>
              Seating: serial{" "}
              <span className="font-semibold text-foreground">
                {r.seatFrom}–{r.seatTo}
              </span>{" "}
              <span className="text-muted-foreground">({r.seated} students)</span>
            </>
          ) : (
            <span className="text-muted-foreground">No students seated in this hall</span>
          )}
        </p>

        {/* Seat Grid */}
        <div className={r.seated > 0 ? "mt-2 grid grid-cols-4 gap-1 sm:grid-cols-6" : "hidden"}>
          {Array.from({ length: Math.min(r.seated, 12) }, (_, i) => (
            <span
              key={i}
              title={`Seat ${i + 1} · SRN ${(r.seatFrom ?? 1) + i}`}
              className="rounded-[4px] bg-primary/80 py-1 text-center text-[9px] font-semibold text-primary-foreground"
            >
              {(r.seatFrom ?? 1) + i}
            </span>
          ))}
          {r.seated > 12 ? (
            <span className="col-span-6 text-center text-[10px] text-muted-foreground">
              + {r.seated - 12} more seats
            </span>
          ) : null}
        </div>
      </div>

      {/* Expandable Seated Students Roster with SRN */}
      {r.seated > 0 ? (
        <div className="mt-3 border-t border-border/40 pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="w-full justify-between text-xs text-muted-foreground hover:text-foreground"
          >
            <span className="flex items-center gap-1">
              <Users className="size-3.5" />
              View Seated Roster ({r.seated})
            </span>
            {expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </Button>

          {expanded ? (
            <div className="mt-2 max-h-48 space-y-1 overflow-y-auto rounded-lg bg-background/60 p-2 text-xs">
              {(r.studentsList ?? []).map((s: any) => (
                <div key={s.registerNo} className="flex items-center justify-between gap-1 text-[11px]">
                  <span className="font-mono font-medium text-foreground">
                    Seat {s.seatNo}: {s.registerNo}
                  </span>
                  <span className="truncate text-muted-foreground">{s.name}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function RoomsPage() {
  const qc = useQueryClient();
  const fn = useServerFn(listRooms);
  const createFn = useServerFn(createRoom);
  const updateFn = useServerFn(updateRoom);
  const deleteFn = useServerFn(deleteRoom);

  const { data } = useQuery({ queryKey: ["rooms"], queryFn: () => fn() });
  const [q, setQ] = useState("");
  const { data: me } = useMe();
  const isAdmin = Boolean(me?.isAdmin);

  // Add Hall State
  const [addOpen, setAddOpen] = useState(false);
  const [newRoom, setNewRoom] = useState({
    room_number: "",
    floor: 1,
    block: "Block A",
    capacity: 30,
  });

  // Edit Hall State
  const [editOpen, setEditOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any | null>(null);

  const createMutation = useMutation({
    mutationFn: (roomData: any) => createFn({ data: roomData }),
    onSuccess: () => {
      toast.success("Examination hall added successfully");
      setAddOpen(false);
      setNewRoom({ room_number: "", floor: 1, block: "Block A", capacity: 30 });
      qc.invalidateQueries({ queryKey: ["rooms"] });
    },
    onError: (e: any) => toast.error("Failed to add hall: " + e.message),
  });

  const updateMutation = useMutation({
    mutationFn: (roomData: any) => updateFn({ data: roomData }),
    onSuccess: () => {
      toast.success("Examination hall updated successfully");
      setEditOpen(false);
      setEditingRoom(null);
      qc.invalidateQueries({ queryKey: ["rooms"] });
    },
    onError: (e: any) => toast.error("Failed to update hall: " + e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (roomId: string) => deleteFn({ data: { roomId } }),
    onSuccess: () => {
      toast.success("Examination hall removed");
      qc.invalidateQueries({ queryKey: ["rooms"] });
    },
    onError: (e: any) => toast.error("Failed to delete hall: " + e.message),
  });

  const handleEditClick = (room: any) => {
    setEditingRoom({
      id: room.id,
      room_number: room.room_number,
      floor: room.floor ?? 1,
      block: room.block ?? "Block A",
      capacity: room.capacity ?? 30,
      active: room.active !== false,
    });
    setEditOpen(true);
  };

  const handleDeleteClick = (room: any) => {
    if (confirm(`Are you sure you want to remove hall ${room.room_number}?`)) {
      deleteMutation.mutate(room.id);
    }
  };

  const grouped = useMemo(() => {
    const rooms = (data ?? []).filter((r: any) => r.room_number.toLowerCase().includes(q.toLowerCase()));
    const map = new Map<string, typeof rooms>();
    for (const r of rooms) map.set(r.block, [...(map.get(r.block) ?? []), r]);
    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(
        ([block, list]) =>
          [
            block,
            [...list].sort((a, b) => a.floor - b.floor || a.room_number.localeCompare(b.room_number)),
          ] as const,
      );
  }, [data, q]);

  return (
    <AppShell
      title="Halls & Floors"
      description={`${data?.length ?? 0} examination halls · Main Faculty & Support Staff assigned · Serial-wise seating with SRNs`}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Search hall (e.g. A-101)…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-36 sm:w-48 no-print"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            title="Print Official Hall Duty & Seating Matrix"
            className="no-print gap-1.5"
          >
            Print Matrix
          </Button>

          {isAdmin ? (
            <div className="flex items-center gap-2 no-print">
              <Button
                size="sm"
                className="btn-3d flex items-center gap-1.5"
                onClick={() => setAddOpen(true)}
              >
                <Plus className="size-4" /> Add Hall
              </Button>
              <HallImportDialog halls={data ?? []} />
            </div>
          ) : (
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs font-semibold no-print">
              Faculty View · Read Only
            </Badge>
          )}
        </div>
      }
    >
      {/* Official Print Header */}
      <div className="print-header">
        <h2 style={{ fontSize: "18pt", fontWeight: "bold", margin: 0 }}>EXAMINATION CELL — BLOCK A HALL ALLOCATION & SEATING MATRIX</h2>
        <p style={{ fontSize: "11pt", margin: "4px 0" }}>Block A | Total Halls: {data?.length ?? 40} | Capacity per Hall: 30 Students</p>
        <p style={{ fontSize: "9pt", color: "#555" }}>Date: {new Date().toLocaleDateString('en-IN', { dateStyle: 'full' })}</p>
      </div>

      <div className="space-y-8">
        {grouped.map(([block, rooms]) => (
          <section key={block}>
            <div className="mb-3 flex items-baseline gap-3">
              <h2 className="font-display text-lg font-semibold tracking-tight">{block}</h2>
              <span className="text-xs text-muted-foreground">
                Floor {rooms[0]?.floor ?? "—"} · {rooms.length} halls ·{" "}
                {rooms.reduce((n, r) => n + r.seated, 0)} students seated
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {rooms.map((r) => (
                <RoomCard
                  key={r.id}
                  r={r}
                  isAdmin={isAdmin}
                  onEdit={handleEditClick}
                  onDelete={handleDeleteClick}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Admin Add Hall Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="glass-strong max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DoorOpen className="size-5 text-primary" />
              Add Examination Hall
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="room-number">Hall / Room Number *</Label>
              <Input
                id="room-number"
                value={newRoom.room_number}
                onChange={(e) => setNewRoom({ ...newRoom, room_number: e.target.value })}
                placeholder="e.g. A-601"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="room-floor">Floor *</Label>
                <Input
                  id="room-floor"
                  type="number"
                  min={1}
                  max={20}
                  value={newRoom.floor}
                  onChange={(e) => setNewRoom({ ...newRoom, floor: parseInt(e.target.value) || 1 })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="room-block">Block *</Label>
                <Input
                  id="room-block"
                  value={newRoom.block}
                  onChange={(e) => setNewRoom({ ...newRoom, block: e.target.value })}
                  placeholder="Block A"
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="room-cap">Student Capacity *</Label>
              <Input
                id="room-cap"
                type="number"
                min={1}
                max={300}
                value={newRoom.capacity}
                onChange={(e) => setNewRoom({ ...newRoom, capacity: parseInt(e.target.value) || 30 })}
                required
              />
            </div>
          </div>
          <DialogFooter className="pt-3">
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              className="btn-3d"
              disabled={createMutation.isPending || !newRoom.room_number.trim()}
              onClick={() => createMutation.mutate(newRoom)}
            >
              {createMutation.isPending ? "Creating…" : "Create Hall"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Admin Edit Hall Dialog */}
      <Dialog open={editOpen} onOpenChange={(v) => !v && setEditOpen(false)}>
        <DialogContent className="glass-strong max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="size-5 text-primary" />
              Edit Examination Hall
            </DialogTitle>
          </DialogHeader>
          {editingRoom && (
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="edit-room-number">Hall / Room Number *</Label>
                <Input
                  id="edit-room-number"
                  value={editingRoom.room_number}
                  onChange={(e) => setEditingRoom({ ...editingRoom, room_number: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-room-floor">Floor *</Label>
                  <Input
                    id="edit-room-floor"
                    type="number"
                    min={1}
                    max={20}
                    value={editingRoom.floor}
                    onChange={(e) => setEditingRoom({ ...editingRoom, floor: parseInt(e.target.value) || 1 })}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-room-block">Block *</Label>
                  <Input
                    id="edit-room-block"
                    value={editingRoom.block}
                    onChange={(e) => setEditingRoom({ ...editingRoom, block: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-room-cap">Student Capacity *</Label>
                <Input
                  id="edit-room-cap"
                  type="number"
                  min={1}
                  max={300}
                  value={editingRoom.capacity}
                  onChange={(e) => setEditingRoom({ ...editingRoom, capacity: parseInt(e.target.value) || 30 })}
                  required
                />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Checkbox
                  id="edit-room-active"
                  checked={editingRoom.active}
                  onCheckedChange={(checked) => setEditingRoom({ ...editingRoom, active: Boolean(checked) })}
                />
                <Label htmlFor="edit-room-active" className="text-xs cursor-pointer">
                  Hall is Active and available for duty allocations
                </Label>
              </div>
            </div>
          )}
          <DialogFooter className="pt-3">
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button
              className="btn-3d"
              disabled={updateMutation.isPending || !editingRoom?.room_number?.trim()}
              onClick={() => updateMutation.mutate(editingRoom)}
            >
              {updateMutation.isPending ? "Saving…" : "Save Hall Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}