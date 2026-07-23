import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMusic } from "@/contexts/MusicContext";
import { useAuth } from "@/contexts/AuthContext";
import { Play, Pause, SkipBack, SkipForward, Music, LogIn } from "lucide-react";

/**
 * Music — 音乐页面
 *
 * 管理员登录网易云后加载歌单。音乐全局播放，切换页面不中断。
 * 此页面显示当前播放歌曲、歌单和控制按钮。
 */

export default function MusicPage() {
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const {
    neteaseLoggedIn, neteaseProfile,
    currentTrack, isPlaying, playlist, playlistName,
    loginNetease, loadPlaylist, play, pause, next, prev,
  } = useMusic();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [playlistId, setPlaylistId] = useState("3778678"); // 默认热歌榜

  useEffect(() => {
    if (neteaseLoggedIn && playlist.length === 0) {
      loadPlaylist(Number(playlistId));
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

  const handleLoadPlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    loadPlaylist(Number(playlistId));
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <header className="mb-10">
        <h1 className="text-3xl font-bold">音乐</h1>
        <p className="mt-2 text-muted-foreground">
          {neteaseLoggedIn
            ? `🎧 ${neteaseProfile?.nickname} 已登录`
            : "管理员登录后可播放音乐"}
        </p>
      </header>

      {/* 网易云登录（仅管理员） */}
      {isAdmin && !neteaseLoggedIn && (
        <Card className="mb-8 border-primary/[0.1] bg-card/60 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-lg">登录网易云</CardTitle>
            <CardDescription>登录后加载歌单，音乐全局播放</CardDescription>
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
        <Card className="mb-8 border-primary/[0.1] bg-card/60 backdrop-blur-xl overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* 封面 */}
              <img
                src={currentTrack.cover}
                alt=""
                className="h-48 w-48 rounded-xl object-cover shadow-2xl"
              />

              {/* 歌曲信息和控制 */}
              <div className="flex-1 min-w-0 text-center sm:text-left">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                  正在播放
                </p>
                <p className="text-2xl font-bold truncate">{currentTrack.name}</p>
                <p className="text-muted-foreground truncate mt-1">{currentTrack.artist}</p>
                <p className="text-sm text-muted-foreground truncate mt-0.5">
                  {currentTrack.album}
                </p>

                {/* 控制区 */}
                <div className="flex items-center justify-center sm:justify-start gap-3 mt-6">
                  <button
                    onClick={prev}
                    disabled={playlist.length === 0}
                    className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-primary/[0.06] transition-colors cursor-pointer disabled:opacity-30"
                  >
                    <SkipBack className="h-5 w-5" />
                  </button>

                  <button
                    onClick={() => (isPlaying ? pause() : play())}
                    className="p-4 rounded-full bg-primary text-primary-foreground hover:bg-primary/80 transition-colors cursor-pointer shadow-lg"
                  >
                    {isPlaying ? (
                      <Pause className="h-6 w-6" />
                    ) : (
                      <Play className="h-6 w-6 ml-0.5" />
                    )}
                  </button>

                  <button
                    onClick={next}
                    disabled={playlist.length === 0}
                    className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-primary/[0.06] transition-colors cursor-pointer disabled:opacity-30"
                  >
                    <SkipForward className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 歌单 ID 输入 + 歌单列表（仅登录后） */}
      {neteaseLoggedIn && (
        <Card className="border-primary/[0.1] bg-card/60 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-lg">{playlistName || "歌单"}</CardTitle>
            <CardDescription>
              <form onSubmit={handleLoadPlaylist} className="flex gap-2 mt-2">
                <Input
                  placeholder="歌单 ID"
                  value={playlistId}
                  onChange={(e) => setPlaylistId(e.target.value)}
                  className="h-8 text-xs"
                />
                <Button type="submit" size="sm" variant="outline">
                  加载
                </Button>
              </form>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {playlist.map((track, i) => (
              <button
                key={track.id}
                onClick={() => play(track)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors cursor-pointer ${
                  currentTrack?.id === track.id
                    ? "bg-primary/[0.08] text-primary font-medium"
                    : "text-muted-foreground hover:bg-primary/[0.04] hover:text-foreground"
                }`}
              >
                <span className="w-6 text-center text-xs tabular-nums shrink-0">
                  {currentTrack?.id === track.id && isPlaying ? "▶" : i + 1}
                </span>
                <img
                  src={track.cover}
                  alt=""
                  className="h-8 w-8 rounded object-cover shrink-0"
                />
                <span className="truncate flex-1 text-sm">{track.name}</span>
                <span className="text-xs text-muted-foreground truncate">
                  {track.artist}
                </span>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 未登录/未播放 */}
      {!currentTrack && !neteaseLoggedIn && (
        <div className="text-center py-16 text-muted-foreground">
          <Music className="h-16 w-16 mx-auto mb-4 opacity-20" />
          <p>登录后即可播放音乐</p>
        </div>
      )}
    </div>
  );
}
