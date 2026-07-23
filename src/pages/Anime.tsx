import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Tv, Star } from "lucide-react";

/** Bangumi API v0 */
const BGM = "https://api.bgm.tv/v0";
const USER = "1266983";

interface Subject {
  id: number;
  name: string;
  name_cn: string;
  images?: { large?: string };
  score: number;
  rank?: number;
}

interface Collection {
  subject_id: number;
  subject: Subject;
  rate?: number;
  type: number; // 1=想看 2=在看 3=看过
  updated_at: string;
}

export default function AnimePage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${BGM}/users/${USER}/collections?subject_type=2&type=3&limit=50`)
      .then(r => { if (!r.ok) throw new Error("请求失败"); return r.json(); })
      .then(d => setCollections((d as any).data || []))
      .catch(() => setError("加载失败，Bangumi API 可能需要代理"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = collections.filter(c => {
    const n = (c.subject.name_cn || c.subject.name).toLowerCase();
    return n.includes(search.toLowerCase());
  });

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <header className="mb-10">
        <h1 className="text-3xl font-bold">番剧</h1>
        <p className="mt-2 text-muted-foreground">
          同步自 <a href={`https://bgm.tv/user/${USER}`} target="_blank" className="text-primary hover:underline">Bangumi @{USER}</a>
        </p>
      </header>

      {loading && <div className="text-center py-16 text-muted-foreground">加载中...</div>}

      {error && (
        <div className="text-center py-16 text-muted-foreground">
          <Tv className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p>{error}</p>
          <a href={`https://bgm.tv/anime/list/${USER}/collect`} target="_blank"
            className="text-primary hover:underline text-sm mt-2 inline-block">
            直接访问 Bangumi 查看 →
          </a>
        </div>
      )}

      {/* 搜索 */}
      {collections.length > 0 && (
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="搜索番剧..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
      )}

      {/* 番剧列表 */}
      <div className="space-y-3">
        {filtered.map(c => {
          const s = c.subject;
          const name = s.name_cn || s.name;
          return (
            <a key={c.subject_id} href={`https://bgm.tv/subject/${s.id}`} target="_blank"
              className="block">
              <Card className="border-primary/[0.1] bg-card/60 backdrop-blur-xl hover:bg-primary/[0.03] transition-colors">
                <CardContent className="p-4 flex items-center gap-4">
                  <img
                    src={s.images?.large || ""}
                    alt={name}
                    className="h-20 w-14 rounded-md object-cover shrink-0 bg-primary/[0.06]"
                    loading="lazy"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{name}</p>
                    {s.name !== s.name_cn && s.name_cn && (
                      <p className="text-xs text-muted-foreground truncate">{s.name}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5">
                      {s.score > 0 && (
                        <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                          <Star className="h-3 w-3 text-primary/60" />{s.score.toFixed(1)}
                        </span>
                      )}
                      {s.rank && <span className="text-xs text-muted-foreground"># {s.rank}</span>}
                    </div>
                  </div>
                  {c.rate && (
                    <Badge variant="secondary" className="bg-primary/[0.06] border-0 text-xs shrink-0">
                      ⭐ {c.rate}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            </a>
          );
        })}
      </div>
    </div>
  );
}
