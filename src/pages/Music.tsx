import MusicPlayer from "@/components/MusicPlayer";

/**
 * Music — 音乐页面
 *
 * 包含一个音乐播放器组件。
 * 后续可以扩展为更丰富的音乐展示页面。
 */
export default function Music() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <header className="text-center mb-10">
        <h1 className="text-3xl font-bold">音乐</h1>
        <p className="mt-2 text-muted-foreground">
          分享我喜欢的音乐
        </p>
      </header>

      <MusicPlayer />
    </div>
  );
}
