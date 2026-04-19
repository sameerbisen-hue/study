import { useEffect } from "react";
import { Bookmark } from "lucide-react";
import { MaterialCard } from "@/components/materials/MaterialCard";
import { useStore, select, materials } from "@/services/store";

export default function Bookmarks() {
  useEffect(() => { materials.loadAll(); }, []);
  const bm = useStore(select.bookmarks);
  useStore(select.materials);
  const list = materials.list().filter((m) => bm.includes(m.id));

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2"><Bookmark className="text-primary" /> Bookmarks</h1>
        <p className="text-muted-foreground">Materials you've saved for later.</p>
      </div>
      {list.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">No bookmarks yet.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {list.map((m) => <MaterialCard key={m.id} material={m} />)}
        </div>
      )}
    </div>
  );
}
