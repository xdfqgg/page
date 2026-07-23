import { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMusic } from "@/contexts/MusicContext";
import { useAuth } from "@/contexts/AuthContext";
import { Play, Pause, SkipBack, SkipForward, Music, LogIn, QrCode, Key, Radio, ListMusic } from "lucide-react";

export default function MusicPage() {
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const {
    neteaseLoggedIn, neteaseProfile,
    currentTrack, isPlaying, playlist, playlistName,
    userPlaylists,
    loginNetease, logoutNetease, getQrKey, getQrImage, checkQr,
    loadPlaylist, loadUserPlaylists, loadPersonalFm, setDefaultPlaylist,
    play, pause, next, prev,
  } = useMusic();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const playlistId = "3778678";
  const [loginMode, setLoginMode] = useState<"qr" | "password">("qr");
  const [qrImage, setQrImage] = useState("");
  const [qrStatus, setQrStatus] = useState("");
  const qrTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (neteaseLoggedIn) {
      loadUserPlaylists();
      loadPlaylist(Number(playlistId));
    }
  }, [neteaseLoggedIn]);

  useEffect(() => {
    if (isAdmin && !neteaseLoggedIn) {
      if (qrTimerRef.current) { clearInterval(qrTimerRef.current); qrTimerRef.current = null; }
      getQrKey().then((key) => {
        if (key) {
          getQrImage(key).then((img) => {
            if (img) { setQrImage(img); setQrStatus("请用网易云 App 扫码"); startPolling(key); }
          });
        }
      }).catch(() => setQrStatus("加载失败，请刷新"));
    }
  }, [isAdmin, neteaseLoggedIn]);

  const startPolling = (key: string) => {
    const stopPoll = () => {
      if (qrTimerRef.current) { clearInterval(qrTimerRef.current); qrTimerRef.current = null; }
    };
    const poll = async () => {
      const code = await checkQr(key);
      switch (code) {
        case 800: setQrStatus("二维码已过期，重新生成"); stopPoll(); break;
        case 801: break;
        case 802: setQrStatus("已扫描，请在手机上确认"); break;
        case 803: setQrStatus("登录成功！"); setQrImage(""); stopPoll(); break;
      }
    };
    stopPoll();
    poll();
    qrTimerRef.current = window.setInterval(poll, 2000);
  };

  const startQrLogin = async () => {
    if (qrTimerRef.current) { clearInterval(qrTimerRef.current); qrTimerRef.current = null; }
    setQrImage("");
    setQrStatus("生成中...");
    try {
      const key = await getQrKey();
      if (!key) { setQrStatus("获取二维码失败，请重试"); return; }
      const img = await getQrImage(key);
      if (!img) { setQrStatus("生成二维码失败，请重试"); return; }
      setQrImage(img);
      setQrStatus("请用网易云 App 扫码");
      startPolling(key);
    } catch { setQrStatus("网络错误，请重试"); }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true); setLoginError("");
    const err = await loginNetease(phone, password);
    if (err) setLoginError(err);
    setLoginLoading(false);
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <header className="mb-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">音乐</h1>
            <p className="mt-2 text-muted-foreground">
              {neteaseLoggedIn ? `🎧 ${neteaseProfile?.nickname} 已登录` : "管理员登录后可播放音乐"}
            </p>
          </div>
          {neteaseLoggedIn && (
            <Button variant="ghost" size="sm" onClick={logoutNetease}
              className="text-muted-foreground hover:text-destructive">
              退出网易云
            </Button>
          )}
        </div>
      </header>

      {/* 登录 */}
      {isAdmin && !neteaseLoggedIn && (
        <Card className="mb-8 border-primary/[0.1] bg-card/60 backdrop-blur-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">登录网易云</CardTitle>
              <button onClick={() => setLoginMode(loginMode === "qr" ? "password" : "qr")}
                className="text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer flex items-center gap-1">
                {loginMode === "qr" ? <><Key className="h-3 w-3" />密码登录</> : <><QrCode className="h-3 w-3" />扫码登录</>}
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {loginMode === "qr" ? (
              <div className="text-center space-y-4">
                {qrImage ? (
                  <>
                    <img src={qrImage} alt="二维码" className="mx-auto rounded-lg w-48 h-48 bg-white p-2" />
                    <p className="text-sm text-muted-foreground">{qrStatus}</p>
                    <Button onClick={startQrLogin} variant="ghost" size="sm">重新生成</Button>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-3 py-6">
                    <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    <p className="text-sm text-muted-foreground">获取二维码中...</p>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4">
                <Input type="text" placeholder="手机号" value={phone} onChange={(e) => setPhone(e.target.value)} />
                <Input type="password" placeholder="密码" value={password} onChange={(e) => setPassword(e.target.value)} />
                {loginError && <p className="text-sm text-destructive">{loginError}</p>}
                <Button type="submit" className="w-full" disabled={loginLoading}>
                  <LogIn className="h-4 w-4" />{loginLoading ? "登录中..." : "登录"}
                </Button>
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
                <p className="text-sm text-muted-foreground truncate mt-0.5">{currentTrack.album}</p>
                <div className="flex items-center justify-center sm:justify-start gap-3 mt-6">
                  <button onClick={prev} disabled={playlist.length === 0} className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-primary/[0.06] transition-colors cursor-pointer disabled:opacity-30">
                    <SkipBack className="h-5 w-5" /></button>
                  <button onClick={() => isPlaying ? pause() : play()} className="p-4 rounded-full bg-primary text-primary-foreground hover:bg-primary/80 transition-colors cursor-pointer shadow-lg">
                    {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}</button>
                  <button onClick={next} disabled={playlist.length === 0} className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-primary/[0.06] transition-colors cursor-pointer disabled:opacity-30">
                    <SkipForward className="h-5 w-5" /></button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 登录后：私人 FM + 用户歌单 + 歌单歌曲 */}
      {neteaseLoggedIn && (
        <div className="space-y-8">
          {/* 私人 FM + 设默认 */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={loadPersonalFm} className="flex-1 rounded-full border-primary/[0.12] bg-primary/[0.04]">
              <Radio className="h-4 w-4" />私人 FM
            </Button>
            {isAdmin && playlist.length > 0 && (
              <Button variant="outline" onClick={() => setDefaultPlaylist(Number(playlistId))}
                className="rounded-full border-primary/[0.12] bg-primary/[0.04] text-xs">
                设为默认歌单
              </Button>
            )}
          </div>

          {/* 用户歌单 */}
          {userPlaylists.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <ListMusic className="h-4 w-4" />我的歌单
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {userPlaylists.slice(0, 6).map((pl) => (
                  <button key={pl.id} onClick={() => loadPlaylist(pl.id)}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl border border-primary/[0.08] bg-primary/[0.02] hover:bg-primary/[0.05] transition-colors cursor-pointer text-center">
                    <img src={pl.cover} alt="" className="w-16 h-16 rounded-lg object-cover" />
                    <div>
                      <p className="text-xs font-medium line-clamp-2">{pl.name}</p>
                      <p className="text-xs text-muted-foreground">{pl.count}首</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 当前歌单歌曲列表 */}
          {playlist.length > 0 && (
            <Card className="border-primary/[0.1] bg-card/60 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-lg">{playlistName || "歌单"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {playlist.map((track, i) => (
                  <button key={track.id} onClick={() => play(track)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors cursor-pointer ${
                      currentTrack?.id === track.id ? "bg-primary/[0.08] text-primary font-medium" : "text-muted-foreground hover:bg-primary/[0.04] hover:text-foreground"
                    }`}>
                    <span className="w-6 text-center text-xs tabular-nums shrink-0">
                      {currentTrack?.id === track.id && isPlaying ? "▶" : i + 1}</span>
                    <img src={track.cover} alt="" className="h-8 w-8 rounded object-cover shrink-0" />
                    <span className="truncate flex-1 text-sm">{track.name}</span>
                    <span className="text-xs text-muted-foreground truncate">{track.artist}</span>
                  </button>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {!currentTrack && !neteaseLoggedIn && (
        <div className="text-center py-16 text-muted-foreground">
          <Music className="h-16 w-16 mx-auto mb-4 opacity-20" />
          <p>登录后即可播放音乐</p>
        </div>
      )}
    </div>
  );
}
