import { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { Play, Pause, SkipBack, SkipForward, LogIn, QrCode, Key } from "lucide-react";

const API = "https://api-enhanced-main-orpin.vercel.app";
const BACKEND = "https://cf-backend-lake.vercel.app";

export default function MusicPage() {
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const audioRef = useRef<HTMLAudioElement>(null);

  // 播放器状态
  const [playlist, setPlaylist] = useState<any[]>([]);
  const [playlistName, setPlaylistName] = useState("");
  const [currentIdx, setCurrentIdx] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);

  // 管理员状态
  const [cookie, setCookie] = useState(() => localStorage.getItem("ne_cookie") || "");
  const [neteaseLoggedIn, setNeteaseLoggedIn] = useState(!!cookie);
  const [profile, setProfile] = useState<any>(() => {
    const s = localStorage.getItem("ne_profile");
    return s ? JSON.parse(s) : null;
  });
  const [userPlaylists, setUserPlaylists] = useState<any[]>([]);
  const [qrImage, setQrImage] = useState("");
  const [qrStatus, setQrStatus] = useState("");
  const [loginMode, setLoginMode] = useState<"qr" | "password">("qr");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const qrTimerRef = useRef<number | null>(null);

  // 当前歌曲
  const currentTrack = playlist[currentIdx] || null;

  // 加载默认歌单
  useEffect(() => {
    fetch(`${BACKEND}/api/music/config`)
      .then(r => r.json())
      .then(c => {
        const id = c.playlistId;
        if (id) return fetch(`${API}/playlist/track/all?id=${id}`);
        return fetch(`${API}/playlist/track/all?id=3778678`);
      })
      .then(r => r.json())
      .then(d => {
        const tracks = (d.songs || []).map((s: any) => ({
          id: s.id, name: s.name,
          artist: (s.ar || []).map((a: any) => a.name).join(" / "),
          album: s.al?.name || "", cover: s.al?.picUrl || "",
        }));
        setPlaylist(tracks);
        setPlaylistName(d.playlist?.name || "歌单");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // 管理员加载网易云歌单 + 自动设为"我喜欢的音乐"
  useEffect(() => {
    if (!neteaseLoggedIn) return;
    const uid = localStorage.getItem("ne_uid") || "";
    fetch(`${API}/user/playlist?uid=${uid}&cookie=${cookie}`)
      .then(r => r.json())
      .then(d => {
        if (d.playlist) {
          setUserPlaylists(d.playlist);
          // 自动找到"我喜欢的音乐"
          const liked = d.playlist.find((p: any) =>
            p.name === "我喜欢的音乐" || p.specialType === 5
          );
          if (liked) loadNeteasePlaylist(liked.id);
        }
      });
  }, [neteaseLoggedIn]);

  // 播放
  const play = async (idx: number) => {
    const t = playlist[idx];
    if (!t) return;
    const res = await fetch(`${API}/song/url/v1?id=${t.id}&level=standard`);
    const d = await res.json();
    const url = d.data?.[0]?.url;
    if (!url) return;

    const a = audioRef.current!;
    a.src = url;
    a.play();
    setCurrentIdx(idx);
    setIsPlaying(true);
  };

  const togglePlay = () => {
    const a = audioRef.current!;
    isPlaying ? a.pause() : a.play();
    setIsPlaying(!isPlaying);
  };

  const next = () => { if (playlist.length) play((currentIdx + 1) % playlist.length); };
  const prev = () => { if (playlist.length) play((currentIdx - 1 + playlist.length) % playlist.length); };
  const onEnded = () => { next(); };

  // 管理员加载歌单
  const loadNeteasePlaylist = async (id: number) => {
    const res = await fetch(`${API}/playlist/track/all?id=${id}`);
    const d = await res.json();
    const tracks = (d.songs || []).map((s: any) => ({
      id: s.id, name: s.name,
      artist: (s.ar || []).map((a: any) => a.name).join(" / "),
      album: s.al?.name || "", cover: s.al?.picUrl || "",
    }));
    setPlaylist(tracks);
    setPlaylistName(d.playlist?.name || "");
    setCurrentIdx(-1);

    // 设为默认
    await fetch(`${BACKEND}/api/music/config`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playlistId: String(id), updated: new Date().toISOString() }),
    });
  };

  // 二维码
  const startQr = async () => {
    const kRes = await fetch(`${API}/login/qr/key`);
    const kData = await kRes.json();
    const key = kData.data?.unikey;
    if (!key) return;

    const qRes = await fetch(`${API}/login/qr/create?key=${key}&qrimg=true`);
    const qData = await qRes.json();
    setQrImage(qData.data?.qrimg || "");
    setQrStatus("请用网易云 App 扫码");

    const poll = async () => {
      const cRes = await fetch(`${API}/login/qr/check?key=${key}`);
      const cData = await cRes.json();
      if (cData.code === 800) { clearInterval(timer!); startQr(); }
      if (cData.code === 802) setQrStatus("已扫描，请确认");
      if (cData.code === 803) {
        clearInterval(timer!);
        const ck = cData.cookie;
        localStorage.setItem("ne_cookie", ck);
        setCookie(ck);
        setNeteaseLoggedIn(true);
        setQrImage("");
        fetch(`${API}/login/status?cookie=${ck}`).then(r => r.json()).then(d => {
          if (d.data?.profile) {
            const p = d.data.profile;
            localStorage.setItem("ne_profile", JSON.stringify({ nickname: p.nickname, avatar: p.avatarUrl }));
            localStorage.setItem("ne_uid", String(p.userId));
            setProfile({ nickname: p.nickname, avatar: p.avatarUrl });
          }
        });
      }
    };
    let timer: any = setInterval(poll, 2000);
    qrTimerRef.current = timer;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`${API}/login/cellphone?phone=${phone}&password=${password}`);
    const data = await res.json();
    if (data.code !== 200) { setLoginError(data.msg || "登录失败"); return; }
    const ck = data.cookie || "";
    localStorage.setItem("ne_cookie", ck);
    localStorage.setItem("ne_profile", JSON.stringify({ nickname: data.profile?.nickname || "用户", avatar: data.profile?.avatarUrl || "" }));
    localStorage.setItem("ne_uid", String(data.profile?.userId || ""));
    setCookie(ck);
    setNeteaseLoggedIn(true);
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <audio ref={audioRef} onEnded={onEnded} />

      <header className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">音乐</h1>
          <p className="mt-2 text-muted-foreground">
            {neteaseLoggedIn ? `🎧 ${profile?.nickname}` : playlistName || "加载中..."}
          </p>
        </div>
        {neteaseLoggedIn && (
          <Button variant="ghost" size="sm" onClick={() => {
            ["ne_cookie", "ne_profile", "ne_uid"].forEach(k => localStorage.removeItem(k));
            setCookie(""); setNeteaseLoggedIn(false); setProfile(null); setUserPlaylists([]);
          }} className="text-muted-foreground hover:text-destructive">退出</Button>
        )}
      </header>

      {/* 管理员登录 */}
      {isAdmin && !neteaseLoggedIn && (
        <Card className="mb-8 border-primary/[0.1] bg-card/60 backdrop-blur-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">登录网易云</CardTitle>
              <button onClick={() => setLoginMode(loginMode === "qr" ? "password" : "qr")}
                className="text-xs text-muted-foreground hover:text-primary cursor-pointer flex items-center gap-1">
                {loginMode === "qr" ? <><Key className="h-3 w-3" />密码</> : <><QrCode className="h-3 w-3" />扫码</>}
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {loginMode === "qr" ? (
              <div className="text-center space-y-3">
                {!qrImage ? (
                  <Button onClick={startQr} variant="outline"><QrCode className="h-4 w-4" />生成二维码</Button>
                ) : (
                  <>
                    <img src={qrImage} className="mx-auto rounded-lg w-48 h-48 bg-white p-2" />
                    <p className="text-sm text-muted-foreground">{qrStatus}</p>
                  </>
                )}
              </div>
            ) : (
              <form onSubmit={handleLogin} className="space-y-3">
                <Input placeholder="手机号" value={phone} onChange={e => setPhone(e.target.value)} />
                <Input type="password" placeholder="密码" value={password} onChange={e => setPassword(e.target.value)} />
                {loginError && <p className="text-sm text-destructive">{loginError}</p>}
                <Button type="submit" className="w-full"><LogIn className="h-4 w-4" />登录</Button>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      {/* 当前播放 */}
      {currentTrack && (
        <Card className="mb-8 border-primary/[0.1] bg-card/60 backdrop-blur-xl overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <img src={currentTrack.cover} alt="" className="h-48 w-48 rounded-xl object-cover shadow-2xl" />
              <div className="flex-1 min-w-0 text-center sm:text-left">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">正在播放</p>
                <p className="text-2xl font-bold truncate">{currentTrack.name}</p>
                <p className="text-muted-foreground truncate mt-1">{currentTrack.artist}</p>
                <div className="flex items-center justify-center sm:justify-start gap-3 mt-6">
                  <button onClick={prev} className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-primary/[0.06] transition-colors cursor-pointer"><SkipBack className="h-5 w-5" /></button>
                  <button onClick={togglePlay} className="p-4 rounded-full bg-primary text-primary-foreground hover:bg-primary/80 transition-colors cursor-pointer shadow-lg">
                    {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}</button>
                  <button onClick={next} className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-primary/[0.06] transition-colors cursor-pointer"><SkipForward className="h-5 w-5" /></button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 管理员歌单 */}
      {isAdmin && neteaseLoggedIn && userPlaylists.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm text-muted-foreground mb-3">我的歌单（点击加载并设为默认）</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {userPlaylists.slice(0, 9).map((pl: any) => (
              <button key={pl.id} onClick={() => loadNeteasePlaylist(pl.id)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl border border-primary/[0.08] bg-primary/[0.02] hover:bg-primary/[0.05] transition-colors cursor-pointer text-center">
                <img src={pl.coverImgUrl || ""} alt="" className="w-14 h-14 rounded-lg object-cover" />
                <p className="text-xs line-clamp-2">{pl.name}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 歌单 */}
      {playlist.length > 0 && (
        <Card className="border-primary/[0.1] bg-card/60 backdrop-blur-xl">
          <CardHeader><CardTitle className="text-lg">{playlistName}</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            {playlist.map((track, i) => (
              <button key={track.id} onClick={() => play(i)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors cursor-pointer ${
                  i === currentIdx ? "bg-primary/[0.08] text-primary font-medium" : "text-muted-foreground hover:bg-primary/[0.04] hover:text-foreground"
                }`}>
                <span className="w-6 text-center text-xs">{i === currentIdx && isPlaying ? "▶" : i + 1}</span>
                <img src={track.cover} alt="" className="h-8 w-8 rounded object-cover shrink-0" />
                <span className="truncate flex-1 text-sm">{track.name}</span>
                <span className="text-xs text-muted-foreground truncate">{track.artist}</span>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {loading && <div className="text-center py-16 text-muted-foreground">加载中...</div>}
    </div>
  );
}
