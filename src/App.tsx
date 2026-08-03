import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Activity,
  ArrowLeft,
  BookOpen,
  CalendarDays,
  Check,
  ChevronRight,
  Clock,
  Cloud,
  CloudOff,
  Download,
  GripVertical,
  Home,
  LogOut,
  MapPin,
  Menu,
  Mic2,
  Music2,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  X,
  Zap,
} from "lucide-react";
import { gigs as seedGigs, songs as seedSongs, users } from "./data";
import { canEdit, canSeeFinance, exportGigPdf } from "./lib";
import type { Availability, Gig, Song, User } from "./types";
import { isSupabaseConfigured, supabase } from "./supabase";
type View =
  | "home"
  | "songs"
  | "setlists"
  | "calendar"
  | "production"
  | "team"
  | "settings";
type BandDataValue = {
  songs: Song[];
  saveNote: (songId: string, note: string) => Promise<void>;
};
const BandDataContext = createContext<BandDataValue>({
  songs: seedSongs,
  saveNote: async () => {},
});
const useBandData = () => useContext(BandDataContext);
const formatDuration = (seconds: number | null) => {
  const value = seconds || 0;
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, "0")}`;
};
const formatTime = (value: string | null) =>
  value
    ? new Date(value).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      })
    : "—";
const nav = [
  ["home", "Home", Home],
  ["songs", "Songs", Music2],
  ["setlists", "Setlists", SlidersHorizontal],
  ["calendar", "Calendar", CalendarDays],
  ["production", "Production", Mic2],
  ["team", "Team", Users],
] as const;
function SortableSong({
  song,
  index,
  onRemove,
}: {
  song: Song;
  index: number;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: song.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`set-song ${isDragging ? "dragging" : ""}`}
    >
      <button
        className="grip"
        {...attributes}
        {...listeners}
        aria-label={`Reorder ${song.title}`}
      >
        <GripVertical />
      </button>
      <span className="track">{String(index + 1).padStart(2, "0")}</span>
      <div className="grow">
        <b>{song.title}</b>
        <span>
          {song.key} · {song.bpm} BPM · {song.duration}
        </span>
      </div>
      <button
        className="icon-btn"
        onClick={onRemove}
        aria-label={`Remove ${song.title}`}
      >
        <X />
      </button>
    </div>
  );
}
function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: string;
}) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
function Login({
  onLogin,
  onReset,
}: {
  onLogin: (email: string, password: string) => Promise<string | void>;
  onReset: (email: string) => Promise<string | void>;
}) {
  const [email, setEmail] = useState(
    isSupabaseConfigured ? "" : "leader@ktb-demo.example",
  );
  const [password, setPassword] = useState(
    isSupabaseConfigured ? "" : "demo-access",
  );
  const [reset, setReset] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const run = async (action: () => Promise<string | void>) => {
    setBusy(true);
    setMessage("");
    const result = await action();
    if (result) setMessage(result);
    setBusy(false);
  };
  return (
    <main className="login">
      <section className="login-art">
        <div className="brandmark">KT</div>
        <p>KEVIN THOMAS BAND</p>
        <h1>
          Everything the band needs.
          <br />
          <em>Right on cue.</em>
        </h1>
        <div className="soundwave">▂▅▃▇▆▂▅▇▃▆▂▇▅▃</div>
      </section>
      <section className="login-panel">
        <div className="mobile-brand">
          <div className="brandmark small">KT</div>
          <b>KTB HUB</b>
        </div>
        <div className="login-card">
          {reset ? (
            <>
              <button className="backlink" onClick={() => setReset(false)}>
                <ArrowLeft /> Back to sign in
              </button>
              <h2>Reset your password</h2>
              <p className="muted">
                We’ll send a secure reset link to your email address.
              </p>
              <label>
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              {message && <p className="auth-message">{message}</p>}
              <button
                className="primary"
                disabled={busy}
                onClick={() =>
                  run(async () => {
                    const error = await onReset(email);
                    if (!error)
                      setMessage("Check your inbox for the secure reset link.");
                    return error;
                  })
                }
              >
                {busy ? "Sending..." : "Send reset link"}
              </button>
            </>
          ) : (
            <>
              <p className="eyebrow">MEMBER ACCESS</p>
              <h2>Welcome back.</h2>
              <p className="muted">Sign in to get tonight’s details.</p>
              <label>
                Email address
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
              {message && <p className="auth-message error">{message}</p>}
              <button
                className="primary"
                disabled={busy}
                onClick={() => run(() => onLogin(email, password))}
              >
                {busy ? (
                  "Signing in..."
                ) : (
                  <>
                    Sign in <ChevronRight />
                  </>
                )}
              </button>
              <button className="link" onClick={() => setReset(true)}>
                Forgot password?
              </button>
              {!isSupabaseConfigured && (
                <div className="demo">
                  <b>Explore demo roles</b>
                  <span>No real passwords or private data.</span>
                  <div>
                    {users.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => {
                          setEmail(u.email);
                          onLogin(u.email, "demo-access");
                        }}
                      >
                        {u.role}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        <p className="secure">
          <ShieldCheck /> Protected with secure authentication
        </p>
      </section>
    </main>
  );
}
export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(isSupabaseConfigured);
  const [view, setView] = useState<View>("home");
  const [gigs, setGigs] = useState(seedGigs);
  const [catalog, setCatalog] = useState(seedSongs);
  const [selectedGig, setSelectedGig] = useState<Gig | null>(null);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [stage, setStage] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [menu, setMenu] = useState(false);
  useEffect(() => {
    const onlineHandler = () => setOnline(true);
    const offlineHandler = () => setOnline(false);
    addEventListener("online", onlineHandler);
    addEventListener("offline", offlineHandler);
    return () => {
      removeEventListener("online", onlineHandler);
      removeEventListener("offline", offlineHandler);
    };
  }, []);

  const loadBandData = useCallback(async (role: string, userId: string) => {
    const client = supabase;
    if (!client) return;
    const [
      songResult,
      gigResult,
      setlistResult,
      availabilityResult,
      noteResult,
    ] = await Promise.all([
      client
        .from("songs")
        .select("id,title,artist,key,bpm,duration_seconds,feel,tags,chart")
        .order("title"),
      client
        .from("gigs")
        .select(
          "id,title,venue,address,starts_at,doors_at,soundcheck_at,itinerary,advance,status",
        )
        .order("starts_at"),
      client
        .from("setlist_items")
        .select("gig_id,song_id,position")
        .order("position"),
      client.from("availability").select("gig_id,user_id,response"),
      client
        .from("musician_notes")
        .select("song_id,note")
        .eq("user_id", userId),
    ]);
    const firstError = [
      songResult.error,
      gigResult.error,
      setlistResult.error,
      availabilityResult.error,
      noteResult.error,
    ].find(Boolean);
    if (firstError) throw firstError;

    const noteMap = new Map(
      (noteResult.data || []).map((row) => [row.song_id, row.note || ""]),
    );
    const nextSongs: Song[] = (songResult.data || []).map((row) => ({
      id: row.id,
      title: row.title,
      artist: row.artist,
      key: row.key,
      bpm: row.bpm,
      duration: formatDuration(row.duration_seconds),
      feel: row.feel || "",
      tags: row.tags || [],
      chart: row.chart || "",
      notes: noteMap.get(row.id) || "",
    }));

    const financeMap = new Map<string, number>();
    if (role === "Administrator") {
      await Promise.all(
        (gigResult.data || []).map(async (row) => {
          const { data } = await client.rpc("get_gig_finance", {
            gig_uuid: row.id,
          });
          const cents = data?.[0]?.fee_cents;
          if (typeof cents === "number") financeMap.set(row.id, cents / 100);
        }),
      );
    }
    const nextGigs: Gig[] = (gigResult.data || []).map((row) => ({
      id: row.id,
      title: row.title,
      venue: row.venue,
      address: row.address || "",
      date: row.starts_at.slice(0, 10),
      doors: formatTime(row.doors_at),
      soundcheck: formatTime(row.soundcheck_at),
      downbeat: formatTime(row.starts_at),
      status: row.status || "Hold",
      setlist: (setlistResult.data || [])
        .filter((item) => item.gig_id === row.id)
        .sort((a, b) => a.position - b.position)
        .map((item) => item.song_id),
      availability: Object.fromEntries(
        (availabilityResult.data || [])
          .filter((item) => item.gig_id === row.id)
          .map((item) => [item.user_id, item.response]),
      ),
      itinerary: Array.isArray(row.itinerary) ? row.itinerary : [],
      advance: row.advance || "",
      fee: financeMap.get(row.id),
    }));
    if (nextSongs.length) setCatalog(nextSongs);
    if (nextGigs.length) setGigs(nextGigs);
    if (nextSongs.length && nextGigs.length) {
      localStorage.setItem(
        "ktb-offline-pack",
        JSON.stringify({
          songs: nextSongs.map((item) => ({ ...item, notes: "" })),
          gigs: nextGigs.map((item) => ({ ...item, fee: undefined })),
        }),
      );
    }
  }, []);

  const loadProfile = useCallback(
    async (id: string, email = "") => {
      if (!supabase) return;
      const { data, error } = await supabase
        .from("profiles")
        .select("id,name,role,instrument")
        .eq("id", id)
        .single();
      if (error)
        throw new Error(
          "Your login works, but your band profile has not been added yet.",
        );
      const name = data.name || email.split("@")[0];
      setUser({
        id: data.id,
        name,
        email,
        role: data.role,
        instrument: data.instrument || "",
        initials: name
          .split(/\s+/)
          .map((part: string) => part[0])
          .join("")
          .slice(0, 2)
          .toUpperCase(),
      });
      await loadBandData(data.role, data.id);
    },
    [loadBandData],
  );

  useEffect(() => {
    const client = supabase;
    if (!client) return;
    let active = true;
    client.auth.getSession().then(async ({ data }) => {
      if (data.session && active) {
        try {
          await loadProfile(
            data.session.user.id,
            data.session.user.email || "",
          );
        } catch {
          await client.auth.signOut();
        }
      }
      if (active) setAuthLoading(false);
    });
    const { data: listener } = client.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_OUT") {
          setUser(null);
          setAuthLoading(false);
        } else if (session) {
          setTimeout(
            () =>
              loadProfile(session.user.id, session.user.email || "").catch(() =>
                setUser(null),
              ),
            0,
          );
        }
      },
    );
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const handleLogin = async (email: string, password: string) => {
    if (!supabase) {
      setUser(users.find((item) => item.email === email) || users[1]);
      return;
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return error.message;
    try {
      await loadProfile(data.user.id, data.user.email || email);
    } catch (profileError) {
      await supabase.auth.signOut();
      return profileError instanceof Error
        ? profileError.message
        : "Unable to load your band profile.";
    }
  };
  const handleReset = async (email: string) => {
    if (!supabase)
      return "Password reset needs the secure database connection.";
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: location.origin,
    });
    return error?.message;
  };
  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    setUser(null);
  };
  const saveNote = useCallback(
    async (songId: string, note: string) => {
      if (!supabase || !user) return;
      const { error } = await supabase.from("musician_notes").upsert(
        {
          song_id: songId,
          user_id: user.id,
          note,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "song_id,user_id" },
      );
      if (!error)
        setCatalog((items) =>
          items.map((item) =>
            item.id === songId ? { ...item, notes: note } : item,
          ),
        );
    },
    [user],
  );
  const updateSetlist = async (gigId: string, songIds: string[]) => {
    setGigs((items) =>
      items.map((item) =>
        item.id === gigId ? { ...item, setlist: songIds } : item,
      ),
    );
    if (!supabase) return;
    const { error } = await supabase
      .from("setlist_items")
      .delete()
      .eq("gig_id", gigId);
    if (!error && songIds.length)
      await supabase.from("setlist_items").insert(
        songIds.map((songId, index) => ({
          gig_id: gigId,
          song_id: songId,
          position: index + 1,
        })),
      );
  };
  const updateAvailability = async (gigId: string, response: Availability) => {
    if (!user) return;
    setGigs((items) =>
      items.map((item) =>
        item.id === gigId
          ? {
              ...item,
              availability: { ...item.availability, [user.id]: response },
            }
          : item,
      ),
    );
    if (supabase)
      await supabase.from("availability").upsert(
        {
          gig_id: gigId,
          user_id: user.id,
          response,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "gig_id,user_id" },
      );
  };

  if (authLoading)
    return (
      <div className="auth-loading">
        <div className="brandmark">KT</div>
        <p>Opening the band hub...</p>
      </div>
    );
  if (!user) return <Login onLogin={handleLogin} onReset={handleReset} />;
  const gig = selectedGig || gigs[0];
  const selectView = (v: View) => {
    setView(v);
    setMenu(false);
    setSelectedGig(null);
    setSelectedSong(null);
  };
  if (stage) return <StageMode gig={gig} onClose={() => setStage(false)} />;
  return (
    <BandDataContext.Provider value={{ songs: catalog, saveNote }}>
      <div className="app">
        <aside className={menu ? "open" : ""}>
          <div className="logo">
            <div className="brandmark small">KT</div>
            <div>
              <b>KTB HUB</b>
              <span>Band operations</span>
            </div>
            <button
              className="icon-btn close-menu"
              onClick={() => setMenu(false)}
            >
              <X />
            </button>
          </div>
          <nav>
            {nav.map(([id, label, Icon]) => (
              <button
                key={id}
                className={view === id ? "active" : ""}
                onClick={() => selectView(id)}
              >
                <Icon />
                {label}
              </button>
            ))}
          </nav>
          <div className="side-bottom">
            <div className="sync">
              {online ? <Cloud /> : <CloudOff />}
              <span>
                <b>{online ? "All changes synced" : "Working offline"}</b>
                <small>{online ? "Just now" : "Will sync on reconnect"}</small>
              </span>
            </div>
            <button className="profile" onClick={() => setView("settings")}>
              <span className="avatar">{user.initials}</span>
              <span>
                <b>{user.name}</b>
                <small>{user.role}</small>
              </span>
              <Settings />
            </button>
          </div>
        </aside>
        {menu && <button className="scrim" onClick={() => setMenu(false)} />}
        <section className="main">
          <header>
            <button className="icon-btn menu-btn" onClick={() => setMenu(true)}>
              <Menu />
            </button>
            <div>
              <p className="eyebrow">KEVIN THOMAS BAND</p>
              <b>{nav.find((x) => x[0] === view)?.[1] || "Hub"}</b>
            </div>
            <div className="header-actions">
              <Badge tone={online ? "success" : "warning"}>
                {online ? <Cloud /> : <CloudOff />}
                {online ? "Synced" : "Offline"}
              </Badge>
              <button className="avatar">{user.initials}</button>
            </div>
          </header>
          <div className="content">
            {view === "home" && (
              <Dashboard
                user={user}
                gigs={gigs}
                onGig={(g) => {
                  setSelectedGig(g);
                  setView("calendar");
                }}
                onStage={(g) => {
                  setSelectedGig(g);
                  setStage(true);
                }}
              />
            )}
            {view === "songs" && (
              <Songs selected={selectedSong} onSelect={setSelectedSong} />
            )}{" "}
            {view === "setlists" && (
              <Setlists gig={gig} onUpdate={updateSetlist} user={user} />
            )}{" "}
            {view === "calendar" && (
              <Calendar
                gig={selectedGig}
                gigs={gigs}
                user={user}
                onSelect={setSelectedGig}
                onAvailability={updateAvailability}
                onStage={() => setStage(true)}
              />
            )}{" "}
            {view === "production" && <Production gig={gig} user={user} />}{" "}
            {view === "team" && <Team gigs={gigs} />}{" "}
            {view === "settings" && (
              <SettingsView user={user} onLogout={handleLogout} />
            )}
          </div>
        </section>
      </div>
    </BandDataContext.Provider>
  );
}
function Dashboard({
  user,
  gigs,
  onGig,
  onStage,
}: {
  user: User;
  gigs: Gig[];
  onGig: (g: Gig) => void;
  onStage: (g: Gig) => void;
}) {
  const { songs } = useBandData();
  const next = gigs[0];
  return (
    <>
      <div className="welcome">
        <div>
          <p className="eyebrow">MONDAY, AUGUST 3</p>
          <h1>Good afternoon, {user.name.split(" ")[0]}.</h1>
          <p>Here’s what’s happening with the band.</p>
        </div>
        <button className="primary compact" onClick={() => onStage(next)}>
          <Zap /> Launch stage mode
        </button>
      </div>
      <div className="dashboard-grid">
        <article className="hero-gig">
          <div className="gig-top">
            <Badge tone="lime">NEXT SHOW · 4 DAYS</Badge>
            <button className="icon-btn" onClick={() => onGig(next)}>
              <ChevronRight />
            </button>
          </div>
          <h2>{next.title}</h2>
          <p>
            <CalendarDays /> Friday, August 7 · {next.downbeat}
          </p>
          <p>
            <MapPin /> {next.venue} · Raleigh, NC
          </p>
          <div className="schedule">
            <span>
              <small>LOAD-IN</small>
              <b>4:30 PM</b>
            </span>
            <span>
              <small>SOUNDCHECK</small>
              <b>{next.soundcheck}</b>
            </span>
            <span>
              <small>DOWNBEAT</small>
              <b>{next.downbeat}</b>
            </span>
          </div>
          <div className="availability">
            <div className="avatar-stack">
              {users.slice(0, 4).map((u) => (
                <span key={u.id}>{u.initials}</span>
              ))}
            </div>
            <b>4 of 5 confirmed</b>
            <span className="grow" />
            <button onClick={() => onGig(next)}>
              View gig details <ChevronRight />
            </button>
          </div>
        </article>
        <article className="quick-card">
          <p className="eyebrow">QUICK ACCESS</p>
          <button onClick={() => onStage(next)}>
            <span className="quick-icon lime">
              <Zap />
            </span>
            <span>
              <b>Stage mode</b>
              <small>Large text setlist & charts</small>
            </span>
            <ChevronRight />
          </button>
          <button onClick={() => exportGigPdf(next, songs)}>
            <span className="quick-icon">
              <Download />
            </span>
            <span>
              <b>Download gig packet</b>
              <small>Setlist, itinerary & advance</small>
            </span>
            <ChevronRight />
          </button>
          <button>
            <span className="quick-icon">
              <BookOpen />
            </span>
            <span>
              <b>Song library</b>
              <small>{songs.length} charts ready offline</small>
            </span>
            <ChevronRight />
          </button>
        </article>
      </div>
      <div className="section-head">
        <div>
          <p className="eyebrow">UPCOMING</p>
          <h2>On the calendar</h2>
        </div>
        <button>
          View all <ChevronRight />
        </button>
      </div>
      <div className="gig-list">
        {gigs.map((g, i) => (
          <button key={g.id} onClick={() => onGig(g)}>
            <span className="date-block">
              <b>{i ? "22" : "07"}</b>
              <small>AUG</small>
            </span>
            <span className="grow">
              <b>{g.title}</b>
              <small>
                <MapPin /> {g.venue} · {g.downbeat}
              </small>
            </span>
            <Badge tone={g.status === "Confirmed" ? "success" : "warning"}>
              {g.status}
            </Badge>
            <ChevronRight />
          </button>
        ))}
      </div>
    </>
  );
}
function Songs({
  selected,
  onSelect,
}: {
  selected: Song | null;
  onSelect: (s: Song | null) => void;
}) {
  const { songs } = useBandData();
  const [q, setQ] = useState("");
  const filtered = songs.filter((s) =>
    (s.title + s.artist + s.tags.join(" "))
      .toLowerCase()
      .includes(q.toLowerCase()),
  );
  if (selected)
    return <SongDetail song={selected} onBack={() => onSelect(null)} />;
  return (
    <>
      <div className="page-title">
        <div>
          <p className="eyebrow">REPERTOIRE</p>
          <h1>Song library</h1>
          <p>{songs.length} songs · charts cached for offline use</p>
        </div>
        <button className="primary compact">
          <Plus /> Add song
        </button>
      </div>
      <div className="toolbar">
        <label className="search">
          <Search />
          <input
            placeholder="Search title, artist or tag"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        <button>
          <SlidersHorizontal /> Filter
        </button>
      </div>
      <div className="table songs-table">
        <div className="thead">
          <span>SONG</span>
          <span>KEY</span>
          <span>TEMPO</span>
          <span>TAGS</span>
          <span />
        </div>
        {filtered.map((s) => (
          <button className="trow" key={s.id} onClick={() => onSelect(s)}>
            <span>
              <b>{s.title}</b>
              <small>{s.artist}</small>
            </span>
            <span>
              <Badge>{s.key}</Badge>
            </span>
            <span>{s.bpm} BPM</span>
            <span>
              {s.tags.map((t) => (
                <Badge key={t}>{t}</Badge>
              ))}
            </span>
            <ChevronRight />
          </button>
        ))}
      </div>
    </>
  );
}
function SongDetail({ song, onBack }: { song: Song; onBack: () => void }) {
  const { saveNote } = useBandData();
  return (
    <>
      <button className="backlink" onClick={onBack}>
        <ArrowLeft /> Song library
      </button>
      <div className="song-head">
        <div>
          <p className="eyebrow">CHART</p>
          <h1>{song.title}</h1>
          <p>{song.artist}</p>
        </div>
        <div>
          <Badge>{song.key}</Badge>
          <Badge>{song.bpm} BPM</Badge>
          <Badge>{song.feel}</Badge>
        </div>
      </div>
      <div className="detail-grid">
        <article className="chart">
          <div className="card-head">
            <b>Nashville number chart</b>
            <button>
              <Download /> PDF
            </button>
          </div>
          <pre>{song.chart}</pre>
        </article>
        <article>
          <div className="card-head">
            <b>My musician notes</b>
            <Badge tone="success">PRIVATE</Badge>
          </div>
          <textarea
            defaultValue={song.notes}
            onBlur={(event) => saveNote(song.id, event.target.value)}
          />
          <p className="hint">
            <ShieldCheck /> Only you can see these notes.
          </p>
        </article>
      </div>
    </>
  );
}
function Setlists({
  gig,
  onUpdate,
  user,
}: {
  gig: Gig;
  onUpdate: (gigId: string, songIds: string[]) => void;
  user: User;
}) {
  const { songs } = useBandData();
  const [query, setQuery] = useState("");
  const ids = gig.setlist;
  const update = (next: string[]) => onUpdate(gig.id, next);
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id) {
      update(
        arrayMove(
          ids,
          ids.indexOf(String(active.id)),
          ids.indexOf(String(over.id)),
        ),
      );
    }
  };
  return (
    <>
      <div className="page-title">
        <div>
          <p className="eyebrow">SHOW BUILDER</p>
          <h1>{gig.title}</h1>
          <p>
            {gig.date} · {gig.venue}
          </p>
        </div>
        <div className="row">
          <Badge tone="success">Saved</Badge>
          <button onClick={() => exportGigPdf(gig, songs)}>
            <Download /> Export PDF
          </button>
        </div>
      </div>
      <div className="builder">
        <section className="library-pane">
          <div className="card-head">
            <b>Song library</b>
            <Badge>{songs.length}</Badge>
          </div>
          <label className="search">
            <Search />
            <input
              placeholder="Find a song"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          {songs
            .filter(
              (s) =>
                !ids.includes(s.id) &&
                s.title.toLowerCase().includes(query.toLowerCase()),
            )
            .map((s) => (
              <button
                className="library-song"
                key={s.id}
                onClick={() => canEdit(user.role) && update([...ids, s.id])}
              >
                <span>
                  <b>{s.title}</b>
                  <small>
                    {s.key} · {s.bpm} BPM
                  </small>
                </span>
                <Plus />
              </button>
            ))}
        </section>
        <section className="set-pane">
          <div className="card-head">
            <div>
              <b>Set 1</b>
              <small>{ids.length} songs · approx. 48 min</small>
            </div>
            <Badge tone="lime">DRAG TO REORDER</Badge>
          </div>
          {!canEdit(user.role) && (
            <p className="notice">
              <ShieldCheck /> View only — Bandleaders and administrators can
              edit setlists.
            </p>
          )}
          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={canEdit(user.role) ? onDragEnd : () => {}}
          >
            <SortableContext items={ids} strategy={verticalListSortingStrategy}>
              {ids.map((id, i) => (
                <SortableSong
                  key={id}
                  index={i}
                  song={songs.find((s) => s.id === id)!}
                  onRemove={() =>
                    canEdit(user.role) && update(ids.filter((x) => x !== id))
                  }
                />
              ))}
            </SortableContext>
          </DndContext>
        </section>
      </div>
    </>
  );
}
function Calendar({
  gig,
  gigs,
  user,
  onSelect,
  onAvailability,
  onStage,
}: {
  gig: Gig | null;
  gigs: Gig[];
  user: User;
  onSelect: (g: Gig | null) => void;
  onAvailability: (id: string, a: Availability) => void;
  onStage: () => void;
}) {
  const { songs } = useBandData();
  if (!gig)
    return (
      <>
        <div className="page-title">
          <div>
            <p className="eyebrow">SCHEDULE</p>
            <h1>Gig calendar</h1>
            <p>Shows, rehearsals and travel in one place.</p>
          </div>
          <button className="primary compact">
            <Plus /> Add gig
          </button>
        </div>
        <div className="calendar-strip">
          <b>AUGUST 2026</b>
          <div>
            {[3, 4, 5, 6, 7, 8, 9].map((d) => (
              <span className={d === 7 ? "showday" : ""} key={d}>
                <small>
                  {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"][d - 3]}
                </small>
                <b>{d}</b>
              </span>
            ))}
          </div>
        </div>
        <div className="gig-list">
          {gigs.map((g) => (
            <button key={g.id} onClick={() => onSelect(g)}>
              <span className="date-block">
                <b>{g.date.slice(-2)}</b>
                <small>AUG</small>
              </span>
              <span className="grow">
                <b>{g.title}</b>
                <small>
                  <MapPin /> {g.venue} · {g.downbeat}
                </small>
              </span>
              <Badge tone={g.status === "Confirmed" ? "success" : "warning"}>
                {g.status}
              </Badge>
              <ChevronRight />
            </button>
          ))}
        </div>
      </>
    );
  return (
    <>
      <button className="backlink" onClick={() => onSelect(null)}>
        <ArrowLeft /> All gigs
      </button>
      <div className="page-title">
        <div>
          <Badge tone="success">{gig.status}</Badge>
          <h1>{gig.title}</h1>
          <p>
            <CalendarDays /> {gig.date} · <MapPin /> {gig.venue}
          </p>
        </div>
        <button className="primary compact" onClick={onStage}>
          <Zap /> Stage mode
        </button>
      </div>
      <div className="detail-grid">
        <article>
          <div className="card-head">
            <b>Run of show</b>
            <Clock />
          </div>
          <div className="timeline">
            {gig.itinerary.map((x) => (
              <div key={x.time}>
                <b>{x.time}</b>
                <span>{x.label}</span>
              </div>
            ))}
          </div>
        </article>
        <article>
          <div className="card-head">
            <b>Your availability</b>
            <Badge>{user.instrument}</Badge>
          </div>
          <p>Can you make this show?</p>
          <div className="availability-buttons">
            {(["available", "maybe", "unavailable"] as Availability[]).map(
              (a) => (
                <button
                  className={gig.availability[user.id] === a ? "selected" : ""}
                  key={a}
                  onClick={() => onAvailability(gig.id, a)}
                >
                  {a === "available" ? (
                    <Check />
                  ) : a === "unavailable" ? (
                    <X />
                  ) : (
                    <Clock />
                  )}
                  {a}
                </button>
              ),
            )}
          </div>
          {canSeeFinance(user.role) && (
            <div className="finance">
              <ShieldCheck />
              <span>
                <small>PRIVATE · ADMIN ONLY</small>
                <b>Contracted fee: ${gig.fee?.toLocaleString()}</b>
              </span>
            </div>
          )}
        </article>
        <article className="full">
          <div className="card-head">
            <b>Setlist</b>
            <Badge>{gig.setlist.length} SONGS</Badge>
          </div>
          {gig.setlist.map((id, i) => (
            <div className="mini-song" key={id}>
              <span>{i + 1}</span>
              <b>{songs.find((s) => s.id === id)?.title}</b>
              <small>{songs.find((s) => s.id === id)?.key}</small>
            </div>
          ))}
        </article>
      </div>
    </>
  );
}
function Production({ gig, user }: { gig: Gig; user: User }) {
  const { songs } = useBandData();
  return (
    <>
      <div className="page-title">
        <div>
          <p className="eyebrow">SHOW FILES</p>
          <h1>Production</h1>
          <p>Stage plots, inputs and venue advances.</p>
        </div>
        <button className="primary compact">
          <Plus /> Upload file
        </button>
      </div>
      <div className="production-grid">
        <article>
          <div className="file-preview stageplot">
            <span>
              DRUMS<small>SR</small>
            </span>
            <span>
              KEYS<small>JE</small>
            </span>
            <span>
              VOCAL / GTR<small>KT</small>
            </span>
            <span>
              BASS<small>MB</small>
            </span>
          </div>
          <h3>Standard 5-piece stage plot</h3>
          <p>Updated Jul 28 · PDF</p>
          <button>
            <Download /> Download
          </button>
        </article>
        <article>
          <div className="file-preview inputlist">
            <b>INPUT LIST / 16 CH</b>
            {["Kick", "Snare", "Bass DI", "Guitar", "Keys L/R", "Vocal 1"].map(
              (x, i) => (
                <span key={x}>
                  {String(i + 1).padStart(2, "0")} — {x}
                </span>
              ),
            )}
          </div>
          <h3>Festival input list</h3>
          <p>Updated Jul 28 · PDF</p>
          <button>
            <Download /> Download
          </button>
        </article>
        <article>
          <div className="file-preview advance">
            <MapPin />
            <b>{gig.venue}</b>
            <small>{gig.address}</small>
          </div>
          <h3>{gig.title} advance</h3>
          <p>Show-specific · Ready</p>
          <button onClick={() => exportGigPdf(gig, songs)}>
            <Download /> Generate PDF
          </button>
        </article>
      </div>
      <div className="audit">
        <div className="card-head">
          <b>Recent activity</b>
          <Activity />
        </div>
        <p>
          <span className="avatar">KT</span>
          <b>Kevin</b> reordered the setlist <small>Today, 2:14 PM</small>
        </p>
        <p>
          <span className="avatar">{user.initials}</span>
          <b>{user.name.split(" ")[0]}</b> viewed the venue advance{" "}
          <small>Just now</small>
        </p>
      </div>
    </>
  );
}
function Team({ gigs }: { gigs: Gig[] }) {
  return (
    <>
      <div className="page-title">
        <div>
          <p className="eyebrow">PEOPLE</p>
          <h1>Band & crew</h1>
          <p>Roles and availability across the team.</p>
        </div>
        <button className="primary compact">
          <Plus /> Invite member
        </button>
      </div>
      <div className="team-grid">
        {users.map((u) => (
          <article key={u.id}>
            <span className="avatar big">{u.initials}</span>
            <div>
              <h3>{u.name}</h3>
              <p>{u.instrument}</p>
              <Badge>{u.role}</Badge>
            </div>
            <div className={`dot ${gigs[0].availability[u.id]}`} />
          </article>
        ))}
      </div>
    </>
  );
}
function SettingsView({
  user,
  onLogout,
}: {
  user: User;
  onLogout: () => void;
}) {
  return (
    <>
      <div className="page-title">
        <div>
          <p className="eyebrow">ACCOUNT</p>
          <h1>Settings</h1>
          <p>Profile, security and app preferences.</p>
        </div>
      </div>
      <div className="settings-card">
        <span className="avatar big">{user.initials}</span>
        <div className="grow">
          <h2>{user.name}</h2>
          <p>{user.instrument || "Band team"}</p>
          <p>{user.email}</p>
          <Badge>{user.role}</Badge>
        </div>
        <button>Edit profile</button>
      </div>
      <div className="settings-card">
        <ShieldCheck />
        <div className="grow">
          <h3>Password & security</h3>
          <p>
            Password resets are sent by secure, expiring email links. Sessions
            are protected by Supabase Auth.
          </p>
        </div>
        <button>Reset password</button>
      </div>
      <button className="logout" onClick={onLogout}>
        <LogOut /> Sign out
      </button>
    </>
  );
}
function StageMode({ gig, onClose }: { gig: Gig; onClose: () => void }) {
  const { songs } = useBandData();
  const [index, setIndex] = useState(0);
  const list = useMemo(
    () => gig.setlist.map((id) => songs.find((s) => s.id === id)!),
    [gig, songs],
  );
  const song = list[index];
  return (
    <div className="stage-mode">
      <header>
        <button onClick={onClose}>
          <X /> Exit stage mode
        </button>
        <div>
          <Cloud /> OFFLINE READY
        </div>
        <b>{gig.title}</b>
        <span>
          {index + 1} / {list.length}
        </span>
      </header>
      <main>
        <aside>
          {list.map((s, i) => (
            <button
              className={i === index ? "active" : ""}
              onClick={() => setIndex(i)}
              key={s.id}
            >
              <span>{i + 1}</span>
              <div>
                <b>{s.title}</b>
                <small>
                  {s.key} · {s.bpm}
                </small>
              </div>
            </button>
          ))}
        </aside>
        <section>
          <div className="stage-title">
            <div>
              <p>NOW PLAYING</p>
              <h1>{song.title}</h1>
              <span>{song.artist}</span>
            </div>
            <b>{song.key}</b>
            <em>
              {song.bpm}
              <small>BPM</small>
            </em>
          </div>
          <pre>{song.chart}</pre>
          <div className="stage-note">
            <b>NOTE</b>
            {song.notes}
          </div>
          <div className="stage-controls">
            <button disabled={!index} onClick={() => setIndex((i) => i - 1)}>
              ← Previous
            </button>
            <button
              disabled={index === list.length - 1}
              onClick={() => setIndex((i) => i + 1)}
            >
              Next song →
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
