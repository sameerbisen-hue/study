import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MaterialCard } from "@/components/materials/MaterialCard";
import { useStore, select, materials } from "@/services/store";

export default function Library() {
  const all = useStore(select.materials);
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [subject, setSubject] = useState("all");
  const [semester, setSemester] = useState("all");
  const [sort, setSort] = useState<"newest" | "popular" | "rating">("newest");

  useEffect(() => { materials.loadAll(); }, []);
  useEffect(() => setQ(params.get("q") ?? ""), [params]);

  const subjects = useMemo(() => Array.from(new Set(all.map((m) => m.subject))).sort(), [all]);
  const semesters = useMemo(() => Array.from(new Set(all.map((m) => m.semester))).sort(), [all]);

  const filtered = useMemo(() => {
    let res = all;
    if (q.trim()) {
      const k = q.toLowerCase();
      res = res.filter((m) =>
        m.title.toLowerCase().includes(k) ||
        m.subject.toLowerCase().includes(k) ||
        m.tags.some((t) => t.includes(k))
      );
    }
    if (subject !== "all") res = res.filter((m) => m.subject === subject);
    if (semester !== "all") res = res.filter((m) => m.semester === semester);
    res = [...res];
    if (sort === "newest") res.sort((a, b) => +new Date(b.uploadedAt) - +new Date(a.uploadedAt));
    if (sort === "popular") res.sort((a, b) => b.upvotes - a.upvotes);
    if (sort === "rating") res.sort((a, b) => b.ratingAvg - a.ratingAvg);
    return res;
  }, [all, q, subject, semester, sort]);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold">Study material library</h1>
        <p className="text-muted-foreground">Browse, filter and discover notes shared by students.</p>
      </div>

      <div className="rounded-xl border bg-card p-4 shadow-card space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => { setQ(e.target.value); setParams({ q: e.target.value }); }}
            placeholder="Search by title, subject, tag..."
            className="pl-9"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select value={subject} onValueChange={setSubject}>
            <SelectTrigger><SelectValue placeholder="Subject" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All subjects</SelectItem>
              {subjects.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={semester} onValueChange={setSemester}>
            <SelectTrigger><SelectValue placeholder="Semester" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All semesters</SelectItem>
              {semesters.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v: "newest" | "popular" | "rating") => setSort(v)}>
            <SelectTrigger><SlidersHorizontal className="h-3.5 w-3.5" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="popular">Most upvoted</SelectItem>
              <SelectItem value="rating">Highest rated</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">{filtered.length} materials</div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((m) => <MaterialCard key={m.id} material={m} />)}
      </div>
      {filtered.length === 0 && (
        <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
          No materials match your filters.
        </div>
      )}
    </div>
  );
}
