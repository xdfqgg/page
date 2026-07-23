import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMusic } from "@/contexts/MusicContext";
import { useAuth } from "@/contexts/AuthContext";
import { Play, Pause, Music, LogIn } from "lucide-react";

/**
 * Music — 音乐页面
 *
 * 管理员登录网易云后，加载歌单，播放音乐。
 */

export default function MusicPage() {
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const {
    neteaseLoggedIn, neteaseProfile,
    currentTrack, isPlaying, playlist, playlistName,
    loginNetease, loadPlaylist, play, pause,
  } = useMusic();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // 管理员自动加载推荐歌单
  useEffect(() => {
    if (neteaseLoggedIn && playlist.length === 0) {
      loadPlaylist(3778678); // 网易云热歌榜
    }
  }, [neteaseLoggedIn]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");
    const err = await loginNetease(phone, password);
    if (err) setLoginError(err);
    setLoginLoading(false);
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <header className="mb-10">
        <h1 className="text-3xl font-bold">音乐</h1>
        <p className="mt-2 text-muted-foreground">
          {neteaseLoggedIn
            ? `欢迎，${neteaseProfile?.nickname}`
            : "登录网易云以播放音乐"}
        </p>
      </header>

      {/* 网易云登录（仅管理员） */}
      {isAdmin && !neteaseLoggedIn && (
        <Card className="mb-8 border-primary/[0.1] bg-card/60 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-lg">登录网易云</CardTitle>
            <CardDescription>管理员登录后可加载歌单播放音乐</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                type="text"
                placeholder="手机号"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <Input
                type="password"
                placeholder="密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {loginError && <p className="text-sm text-destructive">{loginError}</p>}
              <Button type="submit" className="w-full" disabled={loginLoading}>
                <LogIn className="h-4 w-4" />
                {loginLoading ? "登录中..." : "登录网易云"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* 当前播放 */}
      {currentTrack && (
        <Card className="mb-8 border-primary/[0.1] bg-card/60 backdrop-blur-xl">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <img
                src={currentTrack.cover}
                alt=""
                className="h-24 w-24 rounded-lg object-cover shadow-lg"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">正在播放</p>
                <p className="text-lg font-bold truncate">{currentTrack.name}</p>
                <p className="text-sm text-muted-foreground truncate">{currentTrack.artist}</p>
                <p className="text-xs text-muted-foreground truncate mt-1">{currentTrack.album}</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3 rounded-full"
                  onClick={() => (isPlaying ? pause() : play())}
                >
                  {isPlaying ? <><Pause className="h-3.5 w-3.5" /> 暂停</> : <><Play className="h-3.5 w-3.5" /> 播放</>}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 歌单列表 */}
      {playlist.length > 0 && (
        <Card className="border-primary/[0.1] bg-card/60 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-lg">{playlistName || "歌单"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {playlist.map((track, i) => (
              <button
                key={track.id}
                onClick={() => play(track)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors cursor-pointer ${
                  currentTrack?.id === track.id
                    ? "bg-primary/[0.08] text-primary"
                    : "text-muted-foreground hover:bg-primary/[0.04] hover:text-foreground"
                }`}
              >
                <span className="w-6 text-center text-xs tabular-nums shrink-0">
                  {currentTrack?.id === track.id && isPlaying ? (
                    <span className="text-primary">▶</span>
                  ) : (
                    i + 1
                  )}
                </span>
                <span className="truncate flex-1 text-sm">{track.name}</span>
                <span className="text-xs text-muted-foreground truncate hidden sm:inline">
                  {track.artist}
                </span>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 未播放状态 */}
      {!currentTrack && !neteaseLoggedIn && (
        <div className="text-center py-16 text-muted-foreground">
          <Music className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>登录网易云后即可播放音乐</p>
        </div>
      )}
    </div>
  );
}
