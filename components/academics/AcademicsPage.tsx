'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, X, Clock, CheckCircle2, AlertCircle, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

interface Course {
  id: string; courseName: string; courseCode?: string; semester?: string;
  year?: number; instructor?: string; status: string;
  _count: { assignments: number; studySessions: number };
  assignments: { id: string; status: string; dueDate?: string }[];
}
interface Assignment {
  id: string; assignmentName: string; type: string; dueDate?: string;
  status: string; grade?: string; notes?: string;
  course: { courseName: string; courseCode?: string };
}
interface StudySession {
  id: string; sessionDate: string; durationMinutes: number;
  topicCovered?: string; keyTakeaways?: string;
  course: { courseName: string };
}

const STATUS_BADGE: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'secondary', 'in-progress': 'default', submitted: 'outline', graded: 'outline',
};

function daysUntil(dateStr?: string): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function AcademicsPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);

  const [addCourseOpen, setAddCourseOpen] = useState(false);
  const [addAssignmentOpen, setAddAssignmentOpen] = useState(false);
  const [addStudyOpen, setAddStudyOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const loadAll = useCallback(async () => {
    const [cRes, aRes, sRes] = await Promise.all([
      fetch('/api/academics/courses'),
      fetch('/api/academics/assignments'),
      fetch('/api/academics/study-sessions'),
    ]);
    if (cRes.ok) setCourses(await cRes.json());
    if (aRes.ok) setAssignments(await aRes.json());
    if (sRes.ok) setStudySessions(await sRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  if (loading) return <div className="h-48 flex items-center justify-center text-muted-foreground animate-pulse">Loading…</div>;

  const pending = assignments.filter((a) => a.status === 'pending' || a.status === 'in-progress');
  const overdue = pending.filter((a) => a.dueDate && daysUntil(a.dueDate)! < 0);
  const totalStudyHours = Math.round(studySessions.reduce((s, ss) => s + ss.durationMinutes, 0) / 60);

  return (
    <div className="space-y-4">
      {/* KPI Row */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="p-3 border rounded-lg">
          <p className="text-2xl font-bold">{courses.filter((c) => c.status === 'current').length}</p>
          <p className="text-xs text-muted-foreground">Current Courses</p>
        </div>
        <div className={`p-3 border rounded-lg ${overdue.length > 0 ? 'border-red-300 bg-red-50 dark:bg-red-950/20' : ''}`}>
          <p className={`text-2xl font-bold ${overdue.length > 0 ? 'text-red-600' : ''}`}>{pending.length}</p>
          <p className="text-xs text-muted-foreground">Pending {overdue.length > 0 && `(${overdue.length} overdue)`}</p>
        </div>
        <div className="p-3 border rounded-lg">
          <p className="text-2xl font-bold text-indigo-600">{totalStudyHours}h</p>
          <p className="text-xs text-muted-foreground">Study Time</p>
        </div>
      </div>

      <Tabs defaultValue="assignments">
        <TabsList>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="study">Study Log</TabsTrigger>
        </TabsList>

        {/* ── ASSIGNMENTS TAB ── */}
        <TabsContent value="assignments" className="mt-4 space-y-3">
          <Button size="sm" className="w-full" onClick={() => setAddAssignmentOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add Assignment
          </Button>
          {assignments.map((a) => {
            const days = daysUntil(a.dueDate);
            const urgent = days !== null && days <= 2 && a.status !== 'submitted' && a.status !== 'graded';
            return (
              <Card key={a.id} className={urgent ? 'border-red-300' : ''}>
                <CardContent className="pt-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{a.assignmentName}</p>
                      <p className="text-xs text-muted-foreground">{a.course.courseCode ? `${a.course.courseCode} · ` : ''}{a.course.courseName}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <select
                        value={a.status}
                        onChange={async (e) => {
                          await fetch(`/api/academics/assignments/${a.id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: e.target.value }),
                          });
                          loadAll();
                        }}
                        className="text-xs border rounded px-1 h-6 bg-background"
                      >
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="submitted">Submitted</option>
                        <option value="graded">Graded</option>
                      </select>
                      {a.grade && <span className="text-xs font-medium text-green-600">{a.grade}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <Badge variant="outline" className="text-xs">{a.type}</Badge>
                    {a.dueDate && (
                      <span className={`flex items-center gap-1 ${urgent ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                        {urgent && <AlertCircle className="h-3 w-3" />}
                        Due: {new Date(a.dueDate).toLocaleDateString()}
                        {days !== null && ` (${days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left`})`}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {assignments.length === 0 && (
            <div className="text-center py-10 border border-dashed rounded-lg text-muted-foreground">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p>No assignments yet</p>
            </div>
          )}
        </TabsContent>

        {/* ── COURSES TAB ── */}
        <TabsContent value="courses" className="mt-4 space-y-3">
          <Button size="sm" className="w-full" onClick={() => setAddCourseOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add Course
          </Button>
          {courses.map((c) => (
            <Card key={c.id} className="cursor-pointer hover:border-indigo-300 transition-colors" onClick={() => { setSelectedCourse(c); setAddAssignmentOpen(true); }}>
              <CardContent className="pt-3 space-y-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{c.courseName}</p>
                    {c.courseCode && <p className="text-xs text-muted-foreground">{c.courseCode}{c.semester ? ` · ${c.semester}` : ''}</p>}
                  </div>
                  <Badge variant={c.status === 'current' ? 'default' : 'secondary'}>{c.status}</Badge>
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>{c._count.assignments} assignments</span>
                  <span>{c._count.studySessions} study sessions</span>
                  {c.instructor && <span>👨‍🏫 {c.instructor}</span>}
                </div>
              </CardContent>
            </Card>
          ))}
          {courses.length === 0 && (
            <div className="text-center py-10 border border-dashed rounded-lg text-muted-foreground">
              <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p>No courses yet</p>
            </div>
          )}
        </TabsContent>

        {/* ── STUDY LOG TAB ── */}
        <TabsContent value="study" className="mt-4 space-y-3">
          <Button size="sm" className="w-full" onClick={() => setAddStudyOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Log Study Session
          </Button>
          {studySessions.map((s) => (
            <Card key={s.id}>
              <CardContent className="pt-3 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{s.course.courseName}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {s.durationMinutes}m · {new Date(s.sessionDate).toLocaleDateString()}
                  </div>
                </div>
                {s.topicCovered && <p className="text-xs text-muted-foreground">📖 {s.topicCovered}</p>}
                {s.keyTakeaways && <p className="text-xs text-indigo-600">💡 {s.keyTakeaways}</p>}
              </CardContent>
            </Card>
          ))}
          {studySessions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
              <p>No study sessions logged yet</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {addCourseOpen && <AddCourseModal onClose={() => setAddCourseOpen(false)} onAdded={() => { setAddCourseOpen(false); loadAll(); }} />}
      {addAssignmentOpen && <AddAssignmentModal courses={courses} preselectedCourse={selectedCourse} onClose={() => { setAddAssignmentOpen(false); setSelectedCourse(null); }} onAdded={() => { setAddAssignmentOpen(false); setSelectedCourse(null); loadAll(); }} />}
      {addStudyOpen && <AddStudySessionModal courses={courses} onClose={() => setAddStudyOpen(false)} onAdded={() => { setAddStudyOpen(false); loadAll(); }} />}
    </div>
  );
}

function AddCourseModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [form, setForm] = useState({ courseName: '', courseCode: '', semester: '', year: '', instructor: '', status: 'current' });
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/academics/courses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    toast.success('Course added'); onAdded();
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-background rounded-xl shadow-xl w-full max-w-md p-5 space-y-3">
        <div className="flex items-center justify-between"><h3 className="font-semibold">Add Course</h3><button onClick={onClose}><X className="h-4 w-4 text-muted-foreground" /></button></div>
        <form onSubmit={submit} className="space-y-3">
          <Input placeholder="Course name *" value={form.courseName} onChange={(e) => setForm({ ...form, courseName: e.target.value })} required />
          <div className="flex gap-2">
            <Input placeholder="Course code (e.g. CS101)" value={form.courseCode} onChange={(e) => setForm({ ...form, courseCode: e.target.value })} className="flex-1" />
            <Input placeholder="Semester" value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} className="flex-1" />
          </div>
          <Input placeholder="Instructor" value={form.instructor} onChange={(e) => setForm({ ...form, instructor: e.target.value })} />
          <select className="w-full border rounded-md h-9 px-3 text-sm bg-background" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="current">Current</option><option value="completed">Completed</option><option value="planned">Planned</option>
          </select>
          <div className="flex gap-2"><Button type="submit" className="flex-1">Add</Button><Button type="button" variant="outline" onClick={onClose}>Cancel</Button></div>
        </form>
      </div>
    </div>
  );
}

function AddAssignmentModal({ courses, preselectedCourse, onClose, onAdded }: {
  courses: Course[]; preselectedCourse: Course | null; onClose: () => void; onAdded: () => void;
}) {
  const [form, setForm] = useState({
    assignmentName: '', type: 'homework', dueDate: '', notes: '',
    courseId: preselectedCourse?.id ?? courses[0]?.id ?? '',
  });
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/academics/assignments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    toast.success('Assignment added'); onAdded();
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-background rounded-xl shadow-xl w-full max-w-md p-5 space-y-3">
        <div className="flex items-center justify-between"><h3 className="font-semibold">Add Assignment</h3><button onClick={onClose}><X className="h-4 w-4 text-muted-foreground" /></button></div>
        <form onSubmit={submit} className="space-y-3">
          <select className="w-full border rounded-md h-9 px-3 text-sm bg-background" value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })}>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.courseCode ? `${c.courseCode} — ` : ''}{c.courseName}</option>)}
          </select>
          <Input placeholder="Assignment name *" value={form.assignmentName} onChange={(e) => setForm({ ...form, assignmentName: e.target.value })} required />
          <div className="flex gap-2">
            <select className="flex-1 border rounded-md h-9 px-3 text-sm bg-background" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {['homework', 'quiz', 'exam', 'project', 'paper', 'other'].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="flex-1" />
          </div>
          <Input placeholder="Notes (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <div className="flex gap-2"><Button type="submit" className="flex-1">Add</Button><Button type="button" variant="outline" onClick={onClose}>Cancel</Button></div>
        </form>
      </div>
    </div>
  );
}

function AddStudySessionModal({ courses, onClose, onAdded }: { courses: Course[]; onClose: () => void; onAdded: () => void }) {
  const [form, setForm] = useState({ courseId: courses[0]?.id ?? '', durationMinutes: '60', topicCovered: '', keyTakeaways: '' });
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/academics/study-sessions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    toast.success('Session logged'); onAdded();
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-background rounded-xl shadow-xl w-full max-w-md p-5 space-y-3">
        <div className="flex items-center justify-between"><h3 className="font-semibold">Log Study Session</h3><button onClick={onClose}><X className="h-4 w-4 text-muted-foreground" /></button></div>
        <form onSubmit={submit} className="space-y-3">
          <select className="w-full border rounded-md h-9 px-3 text-sm bg-background" value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })}>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.courseName}</option>)}
          </select>
          <Input type="number" placeholder="Duration (minutes) *" value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })} min="1" required />
          <Input placeholder="Topic covered" value={form.topicCovered} onChange={(e) => setForm({ ...form, topicCovered: e.target.value })} />
          <Textarea placeholder="Key takeaways" value={form.keyTakeaways} onChange={(e) => setForm({ ...form, keyTakeaways: e.target.value })} rows={2} />
          <div className="flex gap-2"><Button type="submit" className="flex-1">Log</Button><Button type="button" variant="outline" onClick={onClose}>Cancel</Button></div>
        </form>
      </div>
    </div>
  );
}
