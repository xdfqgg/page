import { Link } from "react-router";
import { useMusic } from "@/contexts/MusicContext";
import { Play, Pause, SkipBack, SkipForward, Music } from "lucide-react";

/**
 * MusicBar — 底部固定播放栏（全站持久）
 *
 * 显示当前播放歌曲，播放/暂停/切歌控制。
 * 只在有歌曲播放时显示。
 */

export default function MusicBar() {
  const { currentTrack, isPlaying, playlist, play, pause, next, prev } = useMusic();

  if (!currentTrack) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-primary/[0.08] bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3">
        {/* 封面 */}
        <img
          src={currentTrack.cover}
          alt=""
          className="h-12 w-12 rounded-md object-cover shrink-0"
        />

        {/* 歌曲信息 */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{currentTrack.name}</p>
          <p className="text-xs text-muted-foreground truncate">{currentTrack.artist}</p>
        </div>

        {/* 控制按钮 */}
        <div className="flex items-center gap-2">
          <button
            onClick={prev}
            disabled={playlist.length === 0}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-primary/[0.06] transition-colors cursor-pointer disabled:opacity-30"
          >
            <SkipBack className="h-4 w-4" />
          </button>

          <button
            onClick={() => (isPlaying ? pause() : play())}
            className="p-2 rounded-full bg-primary/12 text-primary hover:bg-primary/20 transition-colors cursor-pointer"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4 ml-0.5" />
            )}
          </button>

          <button
            onClick={next}
            disabled={playlist.length === 0}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-primary/[0.06] transition-colors cursor-pointer disabled:opacity-30"
          >
            <SkipForward className="h-4 w-4" />
          </button>
        </div>

        {/* 跳转音乐页 */}
        <Link
          to="/music"
          className="text-xs text-muted-foreground hover:text-primary transition-colors shrink-0"
        >
          <Music className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
