import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Play, Pause, SkipBack, SkipForward, Music } from "lucide-react";

/**
 * MusicPlayer — 简易音乐播放器
 *
 * 功能：播放/暂停、上一首/下一首、显示当前曲目。
 * 播放列表是硬编码的示例数据，后续可以接入真实音频文件或 API。
 */

/** 曲目数据结构 */
interface Track {
  title: string;
  artist: string;
  /** 音频文件 URL（本地或远程） */
  src: string;
  /** 封面描述 */
  cover?: string;
}

/** 示例播放列表——替换为你自己的音乐文件和标题 */
const PLAYLIST: Track[] = [
  {
    title: "示例曲目 1",
    artist: "未知艺术家",
    src: "",
  },
  {
    title: "示例曲目 2",
    artist: "未知艺术家",
    src: "",
  },
  {
    title: "示例曲目 3",
    artist: "未知艺术家",
    src: "",
  },
];

export default function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(false);

  const currentTrack = PLAYLIST[currentIndex];

  /* ─── 播放/暂停 ─── */
  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack.src) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(() => setError(true));
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, currentTrack.src]);

  /* ─── 上一首/下一首 ─── */
  const prevTrack = useCallback(() => {
    setCurrentIndex((i) => (i === 0 ? PLAYLIST.length - 1 : i - 1));
    setIsPlaying(false);
    setError(false);
  }, []);

  const nextTrack = useCallback(() => {
    setCurrentIndex((i) => (i === PLAYLIST.length - 1 ? 0 : i + 1));
    setIsPlaying(false);
    setError(false);
  }, []);

  /* ─── 曲目结束时自动下一首 ─── */
  const handleEnded = useCallback(() => {
    nextTrack();
    // 自动播放下一首
    setTimeout(() => {
      audioRef.current?.play().catch(() => {});
      setIsPlaying(true);
    }, 100);
  }, [nextTrack]);

  const hasSrc = !!currentTrack.src;

  return (
    <Card className="border-primary/[0.1] bg-card p-6 max-w-md mx-auto">
      {/* 隐藏的 audio 元素 */}
      <audio ref={audioRef} src={currentTrack.src} onEnded={handleEnded} />

      {/* ─── 当前播放信息 ─── */}
      <div className="flex items-center gap-4 mb-5">
        {/* 封面占位 */}
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-primary/[0.1]">
          <Music className="h-7 w-7 text-primary/50" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold truncate">
            {currentTrack.title}
          </p>
          <p className="text-sm text-muted-foreground truncate">
            {currentTrack.artist}
          </p>
          {!hasSrc && (
            <Badge variant="secondary" className="mt-1 text-xs border-0 bg-primary/[0.08]">
              等待音频文件
            </Badge>
          )}
          {error && (
            <Badge variant="destructive" className="mt-1 text-xs border-0">
              播放失败
            </Badge>
          )}
        </div>
      </div>

      {/* ─── 控制按钮 ─── */}
      <div className="flex items-center justify-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={prevTrack}
          className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground"
        >
          <SkipBack className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={togglePlay}
          disabled={!hasSrc}
          className="h-12 w-12 rounded-full border-primary/[0.15] hover:bg-primary/[0.08]"
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 ml-0.5" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={nextTrack}
          className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground"
        >
          <SkipForward className="h-4 w-4" />
        </Button>
      </div>

      {/* ─── 播放列表 ─── */}
      <Separator className="my-5 bg-primary/[0.08]" />
      <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wider">
        播放列表
      </p>
      <div className="space-y-1">
        {PLAYLIST.map((track, i) => (
          <button
            key={i}
            onClick={() => {
              setCurrentIndex(i);
              setIsPlaying(false);
              setError(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-left transition-colors ${
              i === currentIndex
                ? "bg-primary/[0.08] text-primary font-medium"
                : "text-muted-foreground hover:bg-primary/[0.04] hover:text-foreground"
            }`}
          >
            <span className="w-6 text-center text-xs tabular-nums">
              {i === currentIndex && isPlaying ? "▶" : i + 1}
            </span>
            <span className="truncate">{track.title}</span>
            <span className="ml-auto text-xs text-muted-foreground truncate hidden sm:inline">
              {track.artist}
            </span>
          </button>
        ))}
      </div>
    </Card>
  );
}
