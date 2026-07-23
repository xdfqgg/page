import {
  createContext, useContext, useState, useCallback,
  type ReactNode,
} from "react";

/** API 地址 */
const NE_API = "https://api-enhanced-main-orpin.vercel.app";
const BACKEND = "https://cf-backend-lake.vercel.app";

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
  currentPlaylistId: string;

  /** 用户歌单 */
  userPlaylists: Array<{ id: number; name: string; cover: string; count: number }>;
  fmTracks: Track[];

  /** 操作 */
  loginNetease: (phone: string, password: string) => Promise<string | null>;
  logoutNetease: () => void;
  getQrKey: () => Promise<string>;
  getQrImage: (key: string) => Promise<string>;
  checkQr: (key: string) => Promise<number>;
  loadPlaylist: (id: number) => Promise<void>;
  loadUserPlaylists: () => Promise<void>;
  loadPersonalFm: () => Promise<void>;
  setDefaultPlaylist: (id: number) => Promise<void>;
  initMusic: () => void;
  play: (track?: Track) => void;
  pause: () => void;
  next: () => void;
  prev: () => void;
}

const MusicContext = createContext<MusicState | null>(null);

/** 全局音频元素（持久存在，不随路由销毁） */
let globalAudio: HTMLAudioElement | null = null;
let onEnded: (() => void) | null = null;
function getAudio(): HTMLAudioElement {
  if (!globalAudio) {
    globalAudio = new Audio();
    globalAudio.volume = 0.5;
    globalAudio.addEventListener("ended", () => onEnded?.());
  }
  return globalAudio;
}

export function MusicProvider({ children }: { children: ReactNode }) {
  const [cookie, setCookie] = useState<string>(
    () => localStorage.getItem("ne_cookie") || ""
  );
  const [neteaseUid, setNeteaseUid] = useState<string>(
    () => localStorage.getItem("ne_uid") || ""
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
  const [currentPlaylistId, setCurrentPlaylistId] = useState("");
  const [userPlaylists, setUserPlaylists] = useState<Array<{ id: number; name: string; cover: string; count: number }>>([]);
  const [fmTracks, setFmTracks] = useState<Track[]>([]);

  /** 二维码登录 - 获取 key */
  const getQrKey = useCallback(async () => {
    const res = await fetch(`${NE_API}/login/qr/key`);
    const data = await res.json() as any;
    return data.data?.unikey || "";
  }, []);

  /** 二维码登录 - 生成二维码 */
  const getQrImage = useCallback(async (key: string) => {
    const res = await fetch(`${NE_API}/login/qr/create?key=${key}&qrimg=true`);
    const data = await res.json() as any;
    return data.data?.qrimg || "";
  }, []);

  /** 二维码登录 - 检查扫码状态 */
  const checkQr = useCallback(async (key: string) => {
    const res = await fetch(`${NE_API}/login/qr/check?key=${key}`);
    const data = await res.json() as any;
    // 800=过期 801=等待 802=已扫待确认 803=成功
    if (data.code === 803 && data.cookie) {
      const ck = data.cookie;
      localStorage.setItem("ne_cookie", ck);
      setCookie(ck);
      setNeteaseLoggedIn(true);
      // 获取用户信息
      const statusRes = await fetch(`${NE_API}/login/status?cookie=${ck}`);
      const statusData = await statusRes.json() as any;
      if (statusData.data?.profile) {
        const p = statusData.data.profile;
        const profile = { nickname: p.nickname, avatar: p.avatarUrl };
        localStorage.setItem("ne_profile", JSON.stringify(profile));
        localStorage.setItem("ne_uid", String(p.userId));
        setNeteaseUid(String(p.userId));
        setNeteaseProfile(profile);
      }
    }
    return data.code as number;
  }, []);

  /** 退出网易云 */
  const logoutNetease = useCallback(() => {
    localStorage.removeItem("ne_cookie");
    localStorage.removeItem("ne_profile");
    localStorage.removeItem("ne_uid");
    setCookie("");
    setNeteaseUid("");
    setNeteaseLoggedIn(false);
    setNeteaseProfile(null);
    setPlaylist([]);
    setPlaylistName("");
    setFmTracks([]);
    setUserPlaylists([]);
    const a = getAudio();
    a.pause();
    a.src = "";
    setCurrentTrack(null);
    setIsPlaying(false);
  }, []);

  /** 密码登录 */
  const loginNetease = useCallback(async (phone: string, password: string) => {
    const res = await fetch(`${NE_API}/login/cellphone?phone=${phone}&password=${password}`);
    const data = await res.json() as any;
    if (data.code !== 200) return data.msg || "登录失败";

    const ck = data.cookie || "";
    const profile = {
      nickname: data.profile?.nickname || "用户",
      avatar: data.profile?.avatarUrl || "",
    };

    const uid = String(data.profile?.userId || data.account?.id || "");
    localStorage.setItem("ne_cookie", ck);
    localStorage.setItem("ne_profile", JSON.stringify(profile));
    localStorage.setItem("ne_uid", uid);
    setCookie(ck);
    setNeteaseUid(uid);
    setNeteaseLoggedIn(true);
    setNeteaseProfile(profile);
    return null; // 无错误
  }, []);

  /** 加载歌单 */
  const loadPlaylist = useCallback(async (id: number) => {
    const res = await fetch(`${NE_API}/playlist/track/all?id=${id}&cookie=${cookie}`);
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
    setCurrentPlaylistId(String(id));
  }, [cookie]);

  /** 加载用户歌单列表 */
  const loadUserPlaylists = useCallback(async () => {
    const uid = neteaseUid || localStorage.getItem("ne_uid") || "";
    const res = await fetch(`${NE_API}/user/playlist?uid=${uid}&cookie=${cookie}`);
    const data = await res.json() as any;
    if (data.code !== 200) return;
    const pls = (data.playlist || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      cover: p.coverImgUrl || "",
      count: p.trackCount || 0,
    }));
    setUserPlaylists(pls);
  }, [cookie, neteaseUid]);

  /** 加载私人 FM */
  const loadPersonalFm = useCallback(async () => {
    const res = await fetch(`${NE_API}/personal_fm?cookie=${cookie}`);
    const data = await res.json() as any;
    if (data.code !== 200) return;
    const tracks: Track[] = (data.data || []).map((s: any) => ({
      id: s.id,
      name: s.name,
      artist: (s.ar || []).map((a: any) => a.name).join(" / "),
      album: s.al?.name || "",
      cover: s.al?.picUrl || "",
    }));
    setFmTracks(tracks);
    if (tracks.length > 0) {
      setPlaylist(tracks);
      const t = tracks[0];
      // 直接拿播放地址并播放
      fetch(`${NE_API}/song/url/v1?id=${t.id}&level=standard&cookie=${cookie}`)
        .then(r => r.json())
        .then(d => {
          const url = (d as any).data?.[0]?.url;
          if (url) {
            t.url = url;
            const a = getAudio();
            a.src = url;
            a.play();
            setCurrentTrack(t);
            setIsPlaying(true);
          }
        });
    }
  }, [cookie]);

  /** 设默认歌单（管理员） */
  const setDefaultPlaylist = useCallback(async (id: number) => {
    await fetch(`${BACKEND}/api/music/config`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playlistId: String(id) }),
    });
  }, []);

  /** 初始化 + 轮询同步（返回清理函数） */
  const initMusic = useCallback(() => {
    const sync = async () => {
      try {
        const res = await fetch(`${BACKEND}/api/music/now-playing`);
        const data = await res.json() as any;
        if (!data.track) return;

        setCurrentTrack(data.track);
        setIsPlaying(data.isPlaying);
        setPlaylist(data.playlist || []);
        setPlaylistName(data.playlistName || "");

        const a = getAudio();
        // 用歌曲 ID 判断是否是同一首歌
        const currentId = (a as any)._trackId;
        const sameSong = currentId === data.track.id;
        if (data.isPlaying && !sameSong && data.track) {
          // 获取新的播放 URL（旧的已过期）
          const urlRes = await fetch(`${NE_API}/song/url/v1?id=${data.track.id}&level=standard`);
          const urlData = await urlRes.json() as any;
          const url = urlData.data?.[0]?.url;
          if (!url) return;
          (a as any)._trackId = data.track.id;
          a.src = url;
          if (data.startedAt) {
            a.currentTime = Math.max(0, (Date.now() - data.startedAt) / 1000);
          }
          let retries = 3;
          const tryPlay = async () => {
            try { await a.play(); setIsPlaying(true); return; } catch {}
            if (--retries > 0) setTimeout(tryPlay, 500);
            else setIsPlaying(false);
          };
          tryPlay();
        } else if (!data.isPlaying) {
          a.pause();
          setIsPlaying(false);
        }
      } catch { /* 无数据 */ }
    };
    sync();
    const timer = setInterval(sync, 5000);
    return () => clearInterval(timer);
  }, []) as unknown as () => void;

  const play = useCallback(async (track?: Track) => {
    const t = track || currentTrack;
    if (!t) return;

    const audio = getAudio();

    if (!t.url) {
      const res = await fetch(`${NE_API}/song/url/v1?id=${t.id}&level=standard&cookie=${cookie}`);
      const data = await res.json() as any;
      const url = data.data?.[0]?.url;
      if (!url) return;
      t.url = url;
    }

    audio.src = t.url!;
    audio.play();
    setCurrentTrack(t);
    setIsPlaying(true);
    // 直接同步到后端
    const syncData = {
      track: { id: t.id, name: t.name, artist: t.artist, album: t.album, cover: t.cover },
      isPlaying: true, startedAt: Date.now(),
      playlist: playlist.map(p => ({ id: p.id, name: p.name, artist: p.artist, album: p.album, cover: p.cover })),
      playlistName,
    };
    fetch(`${BACKEND}/api/music/now-playing`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(syncData) });

    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: t.name, artist: t.artist, album: t.album,
        artwork: [{ src: t.cover, sizes: "300x300", type: "image/jpg" }],
      });
    }
  }, [currentTrack, cookie]);

  const pause = useCallback(() => {
    getAudio().pause();
    setIsPlaying(false);
    fetch(`${BACKEND}/api/music/now-playing`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isPlaying: false }) });
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

  // 自动续播：歌曲结束后自动下一首
  onEnded = useCallback(() => {
    if (playlist.length === 0) return;
    const idx = playlist.findIndex((t) => t.id === currentTrack?.id);
    const nextIdx = (idx + 1) % playlist.length;
    play(playlist[nextIdx]);
  }, [playlist, currentTrack, play]);

  return (
    <MusicContext.Provider value={{
      neteaseLoggedIn, neteaseProfile, cookie,
      currentTrack, isPlaying, playlist, playlistName, currentPlaylistId,
      userPlaylists, fmTracks,
      loginNetease, logoutNetease, getQrKey, getQrImage, checkQr,
      loadPlaylist, loadUserPlaylists, loadPersonalFm,
      setDefaultPlaylist, initMusic,
      play, pause, next, prev,
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
