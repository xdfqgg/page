import {
  createContext, useContext, useState, useCallback,
  type ReactNode,
} from "react";

/** 网易云 API 地址 */
const API = "https://api-enhanced-main-r18ayn7j8-xdfq.vercel.app";

interface Track {
  id: number;
  name: string;
  artist: string;
  album: string;
  cover: string;
  url?: string;
}

interface MusicState {
  /** 网易云登录状态 */
  neteaseLoggedIn: boolean;
  neteaseProfile: { nickname: string; avatar: string } | null;
  cookie: string;

  /** 当前播放 */
  currentTrack: Track | null;
  isPlaying: boolean;
  playlist: Track[];
  playlistName: string;

  /** 操作 */
  loginNetease: (phone: string, password: string) => Promise<string | null>;
  loadPlaylist: (id: number) => Promise<void>;
  play: (track?: Track) => void;
  pause: () => void;
  next: () => void;
  prev: () => void;
}

const MusicContext = createContext<MusicState | null>(null);

/** 全局音频元素（持久存在，不随路由销毁） */
let globalAudio: HTMLAudioElement | null = null;
function getAudio(): HTMLAudioElement {
  if (!globalAudio) {
    globalAudio = new Audio();
    globalAudio.volume = 0.5;
  }
  return globalAudio;
}

export function MusicProvider({ children }: { children: ReactNode }) {
  const [cookie, setCookie] = useState<string>(
    () => localStorage.getItem("ne_cookie") || ""
  );
  const [neteaseLoggedIn, setNeteaseLoggedIn] = useState(!!cookie);
  const [neteaseProfile, setNeteaseProfile] = useState<{
    nickname: string; avatar: string;
  } | null>(() => {
    const saved = localStorage.getItem("ne_profile");
    return saved ? JSON.parse(saved) : null;
  });

  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [playlistName, setPlaylistName] = useState("");

  /** 登录网易云 */
  const loginNetease = useCallback(async (phone: string, password: string) => {
    const res = await fetch(`${API}/login/cellphone?phone=${phone}&password=${password}`);
    const data = await res.json() as any;
    if (data.code !== 200) return data.msg || "登录失败";

    const ck = data.cookie || "";
    const profile = {
      nickname: data.profile?.nickname || "用户",
      avatar: data.profile?.avatarUrl || "",
    };

    localStorage.setItem("ne_cookie", ck);
    localStorage.setItem("ne_profile", JSON.stringify(profile));
    setCookie(ck);
    setNeteaseLoggedIn(true);
    setNeteaseProfile(profile);
    return null; // 无错误
  }, []);

  /** 加载歌单 */
  const loadPlaylist = useCallback(async (id: number) => {
    const res = await fetch(`${API}/playlist/track/all?id=${id}&cookie=${cookie}`);
    const data = await res.json() as any;
    if (data.code !== 200) return;

    const tracks: Track[] = (data.songs || []).map((s: any) => ({
      id: s.id,
      name: s.name,
      artist: (s.ar || []).map((a: any) => a.name).join(" / "),
      album: s.al?.name || "",
      cover: s.al?.picUrl || "",
    }));

    setPlaylist(tracks);
    setPlaylistName(data.playlist?.name || "");
  }, [cookie]);

  /** 获取歌曲播放地址并播放 */
  const play = useCallback(async (track?: Track) => {
    const t = track || currentTrack;
    if (!t) return;

    const audio = getAudio();

    if (!t.url) {
      const res = await fetch(`${API}/song/url/v1?id=${t.id}&level=standard&cookie=${cookie}`);
      const data = await res.json() as any;
      const url = data.data?.[0]?.url;
      if (!url) return;
      t.url = url;
    }

    audio.src = t.url!;
    audio.play();
    setCurrentTrack(t);
    setIsPlaying(true);

    // 设置媒体会话（浏览器通知栏显示）
    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: t.name,
        artist: t.artist,
        album: t.album,
        artwork: [{ src: t.cover, sizes: "300x300", type: "image/jpg" }],
      });
    }
  }, [currentTrack, cookie]);

  const pause = useCallback(() => {
    getAudio().pause();
    setIsPlaying(false);
  }, []);

  const next = useCallback(() => {
    if (playlist.length === 0) return;
    const idx = playlist.findIndex((t) => t.id === currentTrack?.id);
    const nextIdx = (idx + 1) % playlist.length;
    play(playlist[nextIdx]);
  }, [playlist, currentTrack, play]);

  const prev = useCallback(() => {
    if (playlist.length === 0) return;
    const idx = playlist.findIndex((t) => t.id === currentTrack?.id);
    const prevIdx = (idx - 1 + playlist.length) % playlist.length;
    play(playlist[prevIdx]);
  }, [playlist, currentTrack, play]);

  return (
    <MusicContext.Provider value={{
      neteaseLoggedIn, neteaseProfile, cookie,
      currentTrack, isPlaying, playlist, playlistName,
      loginNetease, loadPlaylist, play, pause, next, prev,
    }}>
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic(): MusicState {
  const ctx = useContext(MusicContext);
  if (!ctx) throw new Error("useMusic 必须在 MusicProvider 内使用");
  return ctx;
}
