"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Bell,
  Building2,
  CalendarDays,
  Check,
  Download,
  ExternalLink,
  FileText,
  FolderKanban,
  HelpCircle,
  ImageIcon,
  LayoutDashboard,
  LockKeyhole,
  MapPin,
  Menu,
  Moon,
  Plus,
  Settings2,
  ShieldCheck,
  TriangleAlert,
  Upload,
  Users,
  Sun,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  packageNames,
  packageTemplates,
  vendorCategories,
  type DashboardSummary,
  type FileKind,
  type PackageName,
  type Project,
  type TimelineStatus,
} from "@/lib/domain";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Trash2, X } from "lucide-react";
import { apiFetch, apiJson } from "@/lib/domain";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { jsPDF } from "jspdf";
import { DocumentRepository, type RepositoryDocument } from "@/components/document-repository";
import { NotificationDropdown } from "@/components/notification-dropdown";
import { getApproachingDeadlineNotifications, type DeadlineNotification } from "@/lib/notifications";
import { LoadingScreen } from "@/components/loading-screen";
import { buildMasterData } from "@/lib/master-data";

type View = "dashboard" | "documents" | "add" | "detail" | "vendors" | "packages" | "soft-opening";
function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
        <Building2 />
      </div>
      <div>
        <p className="text-sm font-bold">
          Bikin<span className="text-primary">Laundry</span>
        </p>
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Outlet management
        </p>
      </div>
    </div>
  );
}
function Sidebar({
  view,
  setView,
  projectId,
  onHelp,
}: {
  view: View;
  setView: (view: View) => void;
  projectId: string;
  onHelp: () => void;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const items = [
    { id: "dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
    { id: "documents" as const, label: "Documents", icon: FileText },
    { id: "soft-opening" as const, label: "Soft Opening", icon: Check },
    { id: "detail" as const, label: "Continue Project", icon: FolderKanban },
    { id: "vendors" as const, label: "Vendors", icon: Users },
    { id: "packages" as const, label: "Master Paket", icon: Settings2 },
  ];
  const active = view === "add" ? "dashboard" : view;
  const navigate = (id: View) => {
    setView(id === "detail" ? "dashboard" : id);
    setMobileMenuOpen(false);
  };
  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-[4.5rem] shrink-0 flex-col border-r bg-card sm:flex sm:w-56">
        <div className="flex h-20 items-center justify-center px-2 sm:justify-start sm:px-6">
          <div className="hidden sm:block">
            <Logo />
          </div>
        </div>
        <nav className="flex flex-col gap-1 px-2 sm:px-4">
          {items.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              aria-current={active === id ? "page" : undefined}
              onClick={() => navigate(id)}
              aria-label={label}
              className={`motion-lift flex items-center justify-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium sm:justify-start ${active === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
            >
              <Icon className="size-5" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </nav>
        <div className="mt-auto hidden p-4 sm:block">
          <button type="button" onClick={onHelp} className="block w-full rounded-xl text-left transition-transform hover:-translate-y-0.5 focus-visible:outline-none">
            <Card className="border-0 bg-muted/60 shadow-none transition-colors hover:bg-muted">
              <CardContent className="p-4">
                <HelpCircle className="mb-3 text-primary" />
                <p className="text-sm font-semibold">Butuh bantuan?</p>
                <p className="mt-1 text-xs text-muted-foreground">Kelola proyek outlet dengan mudah.</p>
              </CardContent>
            </Card>
          </button>
        </div>
      </aside>

      <div className="sm:hidden">
        {mobileMenuOpen && (
          <>
            <button type="button" aria-label="Tutup navigasi" onClick={() => setMobileMenuOpen(false)} className="fixed inset-0 z-40 bg-foreground/10" />
            <nav id="mobile-navigation" aria-label="Navigasi utama" className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] right-4 z-50 w-56 rounded-xl border bg-card p-2 shadow-xl">
              {items.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  aria-current={active === id ? "page" : undefined}
                  onClick={() => navigate(id)}
                  className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${active === id ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"}`}
                >
                  <Icon className="size-4 shrink-0" />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
          </>
        )}
        <button
          type="button"
          aria-label={mobileMenuOpen ? "Tutup navigasi" : "Buka navigasi"}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMobileMenuOpen((open) => !open)}
          className="fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom))] right-4 z-50 grid size-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg"
        >
          {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
    </>
  );
}

function DocumentsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("");
  const [projectName, setProjectName] = useState("Project documents");
  const [documents, setDocuments] = useState<RepositoryDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProject = async (id: string) => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const project = await apiFetch<Project>(`/api/projects/${id}`);
      setProjectName(project.name);
      setDocuments(project.files.map((file) => ({
        id: file.id,
        name: file.name,
        type: file.type,
        uploadedAt: file.createdAt,
        size: file.size,
        href: `/api/files/${encodeURIComponent(file.id)}`,
      })));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat dokumen.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    apiFetch<Project[]>("/api/projects")
      .then((items) => {
        setProjects(items);
        const firstProject = items[0];
        if (firstProject) {
          setProjectId(firstProject.id);
          return loadProject(firstProject.id);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Gagal memuat project.");
        setLoading(false);
      });
  }, []);

  const uploadDocument = async (file: File) => {
    if (!projectId) return;
    const form = new FormData();
    form.append("file", file);
    form.append("projectId", projectId);
    form.append("kind", "legal-document");
    await apiFetch("/api/files", { method: "POST", body: form });
    await loadProject(projectId);
  };

  if (loading && !documents.length) {
    return (
      <div className="space-y-5 animate-pulse" aria-label="Memuat dokumen">
        <div className="h-10 w-48 rounded-md bg-muted" />
        <div className="h-12 rounded-lg bg-muted/70" />
        <div className="space-y-2 border-y py-3">
          {[0, 1, 2].map((row) => <div key={row} className="h-16 rounded-md bg-muted/50" />)}
        </div>
      </div>
    );
  }

  if (!projects.length) {
    return (
      <div className="border-y border-dashed py-16 text-center">
        <FolderKanban className="mx-auto size-8 text-muted-foreground" />
        <p className="mt-4 font-semibold">Belum ada proyek</p>
        <p className="mt-1 text-sm text-muted-foreground">Buat proyek outlet untuk mulai menyimpan dokumen.</p>
      </div>
    );
  }

  return (
    <div className="min-h-full space-y-6">
      <div className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <label htmlFor="document-project" className="text-sm font-semibold">Pilih proyek</label>
          <p className="mt-1 text-xs text-muted-foreground">Pilih arsip yang ingin Anda buka.</p>
        </div>
        <Select
          value={projectId}
          onValueChange={(id) => {
            if (!id) return;
            setProjectId(id);
            loadProject(id);
          }}
        >
          <SelectTrigger id="document-project" className="h-12 w-full rounded-xl border-border/80 bg-card px-3 shadow-sm transition-[border-color,box-shadow] hover:border-primary/50 hover:shadow-md data-[size=default]:h-12 sm:w-[min(100%,24rem)]">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <Building2 className="size-4" aria-hidden="true" />
            </span>
            <SelectValue placeholder="Pilih proyek">{projectName}</SelectValue>
          </SelectTrigger>
          <SelectContent align="end" className="rounded-xl border border-border/80 p-1.5 shadow-xl">
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id} className="min-h-12 rounded-lg px-2.5 py-2">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                  <Building2 className="size-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 truncate font-medium">{project.name}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {error && <ErrorText error={error} />}
      <DocumentRepository projectName={projectName} documents={documents} onUpload={uploadDocument} />
    </div>
  );
}
type ActivityNotification = {
  id: string;
  action: string;
  project_name?: string;
  metadata?: { projectName?: string; deletedBy?: string };
  created_at: string;
};

function Header({ refresh }: { refresh: number }) {
  const notificationReadKey = "bikinlaundry-read-notifications";
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [profile, setProfile] = useState({ name: "", email: "", initials: "U" });
  const [notifications, setNotifications] = useState<ActivityNotification[]>([]);
  const [deadlineNotifications, setDeadlineNotifications] = useState<DeadlineNotification[]>([]);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([]);
  const [notificationsError, setNotificationsError] = useState("");
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(notificationReadKey);
      if (stored) setReadNotificationIds(JSON.parse(stored));
    } catch {
      setReadNotificationIds([]);
    }
  }, []);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("bikinlaundry-theme");
    const shouldUseDark = savedTheme === "dark";
    setDarkMode(shouldUseDark);
    document.documentElement.classList.toggle("dark", shouldUseDark);
  }, []);

  const toggleTheme = () => {
    setDarkMode((current) => {
      const next = !current;
      document.documentElement.classList.toggle("dark", next);
      window.localStorage.setItem("bikinlaundry-theme", next ? "dark" : "light");
      return next;
    });
  };

  useEffect(() => {
    const supabase = createSupabaseClient();
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (!user) return;
      const email = user.email || "";
      const name = email.split("@")[0]
        .replace(/[._-]+/g, " ")
        .replace(/\b\w/g, (character) => character.toUpperCase()) || "Pengguna";
      const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "U";
      setProfile({ name, email, initials });
    });
  }, []);

  useEffect(() => {
    Promise.all([
      apiFetch<ActivityNotification[]>("/api/activity"),
      apiFetch<Project[]>("/api/projects"),
    ])
      .then(([items, projects]) => {
        setNotifications(items);
        setDeadlineNotifications(getApproachingDeadlineNotifications(projects));
        setNotificationsError("");
      })
      .catch((error) => setNotificationsError(error instanceof Error ? error.message : "Gagal memuat notifikasi."));
  }, [refresh]);

  const formatNotification = (notification: ActivityNotification) => {
    if (notification.action === "project.updated") return `${notification.project_name || "Project"} diperbarui`;
    if (notification.action === "project.created") return `${notification.project_name || "Project"} dibuat`;
    if (notification.action === "project.deleted") return `${notification.metadata?.projectName || notification.project_name || "Project"} dihapus oleh ${notification.metadata?.deletedBy || "pengguna lain"}`;
    return notification.action.replaceAll(".", " ");
  };

  const visibleActivities = notifications.slice(0, 20).map((notification) => ({
    id: notification.id,
    title: formatNotification(notification),
    timestamp: notification.created_at,
  }));
  const visibleDeadlines = deadlineNotifications.slice(0, Math.max(0, 20 - visibleActivities.length));
  const visibleNotificationIds = [...visibleActivities.map((item) => item.id), ...visibleDeadlines.map((item) => item.id)];
  const unreadCount = visibleNotificationIds.filter((id) => !readNotificationIds.includes(id)).length;
  const toggleNotifications = () => {
    if (!showNotifications) {
      const nextReadIds = Array.from(new Set([...readNotificationIds, ...visibleNotificationIds])).slice(-20);
      setReadNotificationIds(nextReadIds);
      window.localStorage.setItem(notificationReadKey, JSON.stringify(nextReadIds));
    }
    setShowNotifications((value) => !value);
    setShowProfile(false);
  };

  return (
    <header className="relative flex h-20 items-center justify-between border-b bg-background/90 px-5 md:px-8">
      <div className="lg:hidden">
        <Logo />
      </div>
      <div className="hidden text-sm text-muted-foreground md:block">
        Selamat datang kembali,{" "}
        <span className="font-semibold text-foreground">{profile.name || "Pengguna"}</span>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <Button variant="ghost" size="icon" aria-label={darkMode ? "Gunakan mode terang" : "Gunakan night mode"} onClick={toggleTheme}>
          {darkMode ? <Sun /> : <Moon />}
        </Button>
        <NotificationDropdown
          open={showNotifications}
          onToggle={toggleNotifications}
          unreadCount={unreadCount}
          deadlines={visibleDeadlines}
          activities={visibleActivities}
          error={notificationsError}
        />
        <div className="relative flex items-center gap-2 border-l pl-3">
          <button
            type="button"
            aria-label="Buka profil"
            aria-expanded={showProfile}
            onClick={() => {
              setShowProfile((value) => !value);
              setShowNotifications(false);
            }}
          >
            <Avatar className="size-9 bg-primary/10">
              <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                {profile.initials}
              </AvatarFallback>
            </Avatar>
          </button>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold">{profile.name || "Pengguna"}</p>
            <p className="text-xs text-muted-foreground">Project Manager</p>
          </div>
          {showProfile && (
            <Card className="absolute right-0 top-12 z-10 w-64 shadow-lg">
              <CardContent className="flex flex-col gap-3 p-4">
                <div>
                  <p className="text-sm font-semibold">{profile.name || "Pengguna"}</p>
                  <p className="text-xs text-muted-foreground">
                    Project Manager
                  </p>
                </div>
                <div className="border-t pt-3 text-xs text-muted-foreground">
                  <p>Email: {profile.email || "Belum tersedia"}</p>
                  <p className="mt-1">Akses: Administrator proyek</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </header>
  );
}
function Heading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          Project pipeline
        </p>
        <h1 className="text-2xl font-bold md:text-3xl">{title}</h1>
        {description && (
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
function ErrorText({ error }: { error: string }) {
  return error ? (
    <p
      role="alert"
      className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
    >
      {error}
    </p>
  ) : null;
}
function HelpDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [activeTopic, setActiveTopic] = useState("dashboard");
  const topics = [
    {
      id: "dashboard",
      title: "Dashboard",
      eyebrow: "Mulai dari sini",
      body: "Gunakan Dashboard untuk melihat outlet yang sedang berjalan, progres setiap project, estimasi selesai, dan kendala yang perlu ditindaklanjuti.",
      steps: ["Cek ringkasan progres", "Buka project yang ingin diperiksa", "Tinjau daftar kendala dan timeline"],
    },
    {
      id: "security",
      title: "Keamanan & akses",
      eyebrow: "Jaga data tetap aman",
      body: "Akses dashboard dan data project hanya tersedia untuk akun dengan email terverifikasi. Data project, vendor, aktivitas, dan dokumen dibatasi berdasarkan akun yang sedang masuk.",
      steps: ["Verifikasi email sebelum masuk", "Jangan membagikan password atau tautan akses", "Gunakan tombol keluar setelah memakai perangkat bersama", "Laporkan aktivitas atau akses yang tidak dikenal"],
    },
    {
      id: "documents",
      title: "Documents",
      eyebrow: "Simpan semuanya rapi",
      body: "Halaman Documents menyatukan foto, PDF, dan dokumen pendukung untuk setiap outlet agar tim tidak perlu mencari file di banyak tempat.",
      steps: ["Pilih project aktif", "Upload dokumen", "Buka file dari daftar repository"],
    },
    {
      id: "vendors",
      title: "Vendors",
      eyebrow: "Kelola partner kerja",
      body: "Tambahkan vendor berdasarkan kategori, simpan PIC dan kontaknya, lalu pilih vendor yang digunakan pada tahapan project.",
      steps: ["Buka Master Vendors", "Tambahkan data vendor", "Hubungkan vendor dari halaman project"],
    },
    {
      id: "soft-opening",
      title: "Soft Opening",
      eyebrow: "Tahap akhir outlet",
      body: "Setelah seluruh barang terverifikasi dan tahap project selesai, outlet dapat dipindahkan ke Soft Opening untuk pemantauan tahap akhir.",
      steps: ["Verifikasi barang", "Pastikan tidak ada kendala terbuka", "Pindahkan outlet ke Soft Opening"],
    },
  ];
  const selectedTopic = topics.find((topic) => topic.id === activeTopic) || topics[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(680px,calc(100vh-2rem))] overflow-y-auto rounded-lg border-zinc-200 bg-white p-0 text-zinc-950 shadow-lg backdrop-blur-sm dark:border-border dark:bg-popover dark:text-popover-foreground sm:max-w-3xl">
        <DialogHeader className="border-b border-zinc-200 px-6 py-5 pr-12 dark:border-border">
          <DialogTitle className="text-xl tracking-tight">Panduan BikinLaundry</DialogTitle>
          <DialogDescription className="max-w-2xl leading-relaxed text-zinc-600 dark:text-muted-foreground">
            Ikuti alur sederhana ini untuk mengelola project outlet dari persiapan sampai Soft Opening.
          </DialogDescription>
        </DialogHeader>
        <div className="grid md:grid-cols-[190px_minmax(0,1fr)]">
          <div className="border-b border-zinc-200 p-3 dark:border-border md:border-b-0 md:border-r">
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">Topik panduan</p>
            <div className="flex gap-1 overflow-x-auto md:flex-col">
              {topics.map((topic) => (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => setActiveTopic(topic.id)}
                  className={`shrink-0 rounded-md px-3 py-2 text-left text-sm transition-colors ${activeTopic === topic.id ? "bg-zinc-950 font-medium text-white dark:bg-primary dark:text-primary-foreground" : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950 dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-foreground"}`}
                >
                  {topic.title}
                </button>
              ))}
            </div>
          </div>
          <div className="px-6 py-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">{selectedTopic.eyebrow}</p>
            <h3 className="mt-2 text-lg font-semibold tracking-tight">{selectedTopic.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-muted-foreground">{selectedTopic.body}</p>
            <div className="mt-6 border-t border-zinc-200 pt-5 dark:border-border">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">Urutan yang disarankan</p>
              <ol className="mt-3 space-y-3">
                {selectedTopic.steps.map((step, index) => (
                  <li key={step} className="flex items-start gap-3 text-sm text-zinc-600 dark:text-muted-foreground">
                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-zinc-100 text-[11px] font-semibold text-zinc-600 dark:bg-muted dark:text-foreground">{index + 1}</span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
        <DialogFooter className="border-t border-zinc-200 px-6 py-4 dark:border-border">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Tutup panduan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
function DeleteConfirmationDialog({ open, itemName, itemType, saving, onOpenChange, onConfirm }: { open: boolean; itemName: string; itemType: "project" | "vendor" | "file"; saving: boolean; onOpenChange: (open: boolean) => void; onConfirm: () => void }) {
  const [confirmation, setConfirmation] = useState("");
  useEffect(() => { if (!open) setConfirmation(""); }, [open]);
  const label = itemType === "project" ? "project" : itemType === "vendor" ? "vendor" : "foto";
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Hapus {label}?</DialogTitle><DialogDescription>Tindakan ini permanen dan akan menghapus <strong>{itemName}</strong>. Ketik DELETE untuk melanjutkan.</DialogDescription></DialogHeader><Input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="DELETE" autoComplete="off" aria-label="Ketik DELETE untuk konfirmasi" /><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button><Button variant="destructive" onClick={onConfirm} disabled={confirmation !== "DELETE" || saving}>{saving ? "Menghapus..." : "Hapus permanen"}</Button></DialogFooter></DialogContent></Dialog>;
}
function ImagePreviewDialog({ file, onClose }: { file: Project["files"][number] | null; onClose: () => void }) {
  const isPdf = file?.type === "application/pdf" || file?.name?.toLowerCase().endsWith(".pdf");
  const fileUrl = file?.id ? `/api/files/${encodeURIComponent(file.id)}` : file?.thumbnailUrl;
  return <Dialog open={Boolean(file)} onOpenChange={(open) => !open && onClose()}><DialogContent className="max-w-5xl overflow-hidden p-2 sm:p-4"><DialogHeader className="px-2 sm:px-4"><DialogTitle className="truncate text-left">{file?.name}</DialogTitle><DialogDescription className="text-left">Preview dokumentasi</DialogDescription></DialogHeader>{fileUrl && (isPdf ? <iframe src={fileUrl} title={file?.name} className="h-[70vh] w-full rounded-lg border" /> : <div className="flex max-h-[70vh] items-center justify-center overflow-auto rounded-lg bg-muted/40 p-2 sm:p-4"><img src={fileUrl} alt={file?.caption || file?.name || "Dokumentasi"} className="max-h-[65vh] max-w-full object-contain" /></div>)}<DialogFooter className="px-2 sm:px-4"><Button variant="outline" onClick={() => fileUrl && window.open(fileUrl, "_blank", "noopener,noreferrer")}>Buka di tab baru</Button></DialogFooter></DialogContent></Dialog>;
}
function Analytics({ projects }: { projects: Project[] }) {
  const now = Date.now();
  const averageDuration = projects.length
    ? Math.round(projects.reduce((total, project) => total + Math.max(1, Math.round(((project.phase === "Selesai" ? new Date(project.updatedAt).getTime() : now) - new Date(project.createdAt).getTime()) / 86400000)), 0) / projects.length)
    : 0;
  const activeProjects = projects.filter((project) => project.phase !== "Selesai" && !project.sections?.softOpening);
  const issueItems = activeProjects.flatMap((project) => [
    ...Object.entries(project.sections?.issues || {}).map(([item, note]) => ({ project: project.name, item, note })),
    ...project.timeline.filter((task) => task.status === "In Progress" && !project.sections?.issues?.[task.title]).map((task) => ({ project: project.name, item: task.title, note: "Tahap sedang berjalan dan perlu dipantau." })),
  ]);
  const activeIssues = issueItems.length;
  const monthlyCounts = Array.from({ length: 12 }, (_, month) => projects.filter((project) => {
    const createdAt = new Date(project.createdAt);
    return createdAt.getMonth() === month;
  }).length);
  const maxMonthlyCount = Math.max(1, ...monthlyCounts);
  const bars = monthlyCounts.map((count) => count ? Math.max(12, Math.round((count / maxMonthlyCount) * 100)) : 4);
  return (
    <section className="mb-7">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Analytics & Performa Cabang</h2>
        <p className="text-sm text-muted-foreground">
          Ringkasan operasional dan lead time pembukaan cabang.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">
              Rata-rata Durasi Proyek
            </p>
            <p className="mt-2 text-2xl font-bold">{averageDuration} Hari</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Berdasarkan proyek aktif dan selesai
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">
              Kendala Aktif (Issue)
            </p>
            <p className="mt-2 text-2xl font-bold text-destructive">
              {activeIssues} Item berjalan
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Perlu tindak lanjut tim
            </p>
          </CardContent>
        </Card>
      </div>
      <Card className="mt-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Daftar Kendala</CardTitle>
        </CardHeader>
        <CardContent>
          {issueItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada kendala yang dilaporkan.</p>
          ) : (
            <div className="flex flex-col divide-y">
              {issueItems.map((issue, index) => (
                <div key={`${issue.project}-${issue.item}-${index}`} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0">
                  <p className="text-sm font-semibold">{issue.project} · {issue.item}</p>
                  <p className="text-sm text-muted-foreground">{issue.note}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <Card className="mt-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">
            Jumlah Pembukaan Cabang per Bulan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-36 items-end gap-3 border-b border-l px-4 pb-0 pt-4">
              {bars.map((height, index) => (
              <div
                key={index}
                className="flex flex-1 flex-col items-center gap-2"
              >
                  <span className="text-[10px] font-semibold text-foreground">{monthlyCounts[index]}</span>
                <div
                  className="w-full rounded-t-md bg-primary/70"
                  style={{ height: `${height}%` }}
                    title={`${monthlyCounts[index]} pembukaan pada ${["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"][index]}`}
                />
                <span className="text-[10px] text-muted-foreground">
                  {
                    [
                      "Jan",
                      "Feb",
                      "Mar",
                      "Apr",
                      "Mei",
                      "Jun",
                      "Jul",
                      "Agu",
                      "Sep",
                      "Okt",
                      "Nov",
                      "Des",
                    ][index]
                  }
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
function Dashboard({
  setView,
  setProjectId,
  refresh,
}: {
  setView: (view: View) => void;
  setProjectId: (id: string) => void;
  refresh: number;
}) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [summary, setSummary] = useState<DashboardSummary>({
    totalActive: 0,
    waitingUpdate: 0,
    completedThisMonth: 0,
  });
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    Promise.all([
      apiFetch<Project[]>("/api/projects"),
      apiFetch<{ summary: DashboardSummary }>("/api/dashboard"),
    ])
      .then(([items, result]) => {
        setProjects(items);
        setSummary(result.summary);
      })
      .catch((err) => setError(err.message));
  }, [refresh]);
  const remove = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/projects/${deleteTarget.id}`, { method: "DELETE" });
      setProjects((current) => current.filter((item) => item.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Project gagal dihapus.");
    } finally {
      setDeleting(false);
    }
  };
  return (
    <>
      <Heading
        title="Outlet On Progress"
        description="Pantau perkembangan seluruh proyek outlet Anda dalam satu tampilan."
        action={
          <Button onClick={() => setView("add")}>
            <Plus />
            Tambah Outlet Baru
          </Button>
        }
      />
      <ErrorText error={error} />
      <Analytics projects={projects} />
      <div className="mb-7 grid gap-4 sm:grid-cols-3">
        <Stat
          icon={<FolderKanban />}
          value={summary.totalActive}
          label="Total proyek aktif"
        />
        <Stat
          icon={<FolderKanban />}
          value={summary.waitingUpdate}
          label="Menunggu update"
        />
        <Stat
          icon={<ShieldCheck />}
          value={summary.completedThisMonth}
          label="Selesai bulan ini"
        />
      </div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Proyek terbaru</h2>
        <span className="text-xs text-muted-foreground">
          {projects.length} proyek terdaftar
        </span>
      </div>
      <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
          {projects.filter((project) => !project.sections?.softOpening).map((project, index) => (
          <div key={project.id} className="flex flex-col gap-2">
            <Card className="motion-enter motion-lift flex aspect-square flex-col overflow-y-auto" style={{ animationDelay: `${Math.min(index * 45, 240)}ms` }}>
              <CardHeader className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Building2 />
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{project.phase}</Badge>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => setDeleteTarget(project)}
                      aria-label={`Hapus project ${project.name}`}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
                <CardTitle className="pt-3 text-base">{project.name}</CardTitle>
                <div className="flex flex-col gap-1.5">
                  <CardDescription className="flex items-center gap-1.5">
                    <MapPin />
                    {project.locationData?.address || project.location}
                    {project.locationData?.mapsUrl && (
                      <a
                        href={project.locationData.mapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Buka lokasi ${project.name}`}
                        className="ml-auto rounded-md p-1 text-primary hover:bg-primary/10"
                      >
                        <MapPin />
                      </a>
                    )}
                  </CardDescription>
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarDays />
                    Waktu pengerjaan:{" "}
                    {new Date(project.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    – {project.sections?.estimatedCompletionDate
                      ? `estimasi selesai ${new Date(`${project.sections.estimatedCompletionDate}T00:00:00`).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}`
                      : "berjalan"}
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-2 flex justify-between text-xs">
                  <span className="text-muted-foreground">Progress proyek</span>
                  <b className="text-primary">{project.progress}%</b>
                </div>
                <p className="mb-3 text-xs text-muted-foreground">
                  Persentase dihitung dari seluruh tahapan project.
                </p>
                <Progress value={project.progress} />
                <div className="mt-4 border-t pt-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-semibold">Progress project</p>
                    <span className="text-xs text-muted-foreground">
                      {
                        project.timeline.filter(
                          (task) =>
                            task.status === "Selesai dikerjakan" ||
                            task.status === "Tidak diperlukan",
                        ).length
                      }
                      /{project.timeline.length} selesai
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {project.timeline.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center gap-2 text-xs"
                      >
                        <span
                          className={`size-2 shrink-0 rounded-full ${task.status === "Selesai dikerjakan" || task.status === "Tidak diperlukan" ? "bg-primary" : task.status === "In Progress" ? "bg-amber-500" : "bg-muted-foreground/30"}`}
                        />
                        <span
                          className={
                            task.status === "Selesai dikerjakan" ||
                            task.status === "Tidak diperlukan"
                              ? "text-foreground"
                              : "text-muted-foreground"
                          }
                        >
                          {task.title}
                        </span>
                        <span className="ml-auto text-[11px] text-muted-foreground">
                          {task.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-4 text-primary"
                  onClick={() => {
                    setProjectId(project.id);
                    setView("detail");
                  }}
                >
                  Continue Project <ArrowLeft className="rotate-180" />
                </Button>
              </CardContent>
            </Card>
            <Button
              className="w-full"
              onClick={() => {
                setProjectId(project.id);
                setView("detail");
              }}
            >
              Continue Project
            </Button>
          </div>
        ))}
      </div>
      <DeleteConfirmationDialog open={Boolean(deleteTarget)} itemName={deleteTarget?.name || "project"} itemType="project" saving={deleting} onOpenChange={(open) => !open && setDeleteTarget(null)} onConfirm={remove} />
    </>
  );
}
function Stat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function SoftOpeningOutlets({
  setView,
  setProjectId,
}: {
  setView: (view: View) => void;
  setProjectId: (id: string) => void;
}) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    apiFetch<Project[]>("/api/projects")
      .then((items) => setProjects(items.filter((project) => project.sections?.softOpening)))
      .catch((err) => setError(err.message));
  }, []);

  const remove = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/projects/${deleteTarget.id}`, { method: "DELETE" });
      setProjects((current) => current.filter((project) => project.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Project gagal dihapus.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Heading
        title="Soft Opening Outlet"
        description="Daftar outlet yang sudah memasuki tahap Soft Opening."
      />
      <ErrorText error={error} />
      {projects.length === 0 ? (
        <Card><CardContent className="p-6 text-sm text-muted-foreground">Belum ada outlet di tahap Soft Opening.</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">{project.name}</CardTitle>
                    <CardDescription className="mt-1">{project.location}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge>Soft Opening</Badge>
                    <Button variant="destructive" size="icon" onClick={() => setDeleteTarget(project)} aria-label={`Hapus project ${project.name}`}>
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-2 flex justify-between text-xs">
                  <span className="text-muted-foreground">Progress proyek</span>
                  <b className="text-primary">{project.progress}%</b>
                </div>
                <Progress value={project.progress} />
                <Button className="mt-4 w-full" onClick={() => { setProjectId(project.id); setView("detail"); }}>
                  Buka Detail Outlet
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <DeleteConfirmationDialog
        open={Boolean(deleteTarget)}
        itemName={deleteTarget?.name || "project"}
        itemType="project"
        saving={deleting}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={remove}
      />
    </>
  );
}

const allTimelineTasks = [
  { title: 'Survey Lokasi', detail: 'Survey lokasi dan validasi area outlet', group: 'Perencanaan' },
  { title: 'Perizinan', detail: 'Pengurusan dokumen perizinan outlet', group: 'Perencanaan' },
  { title: 'Proses Gambar', detail: 'Pembuatan desain dan gambar kerja', group: 'Perencanaan' },
  { title: 'Kickoff Meeting Bersama Vendor', detail: 'Koordinasi awal dengan vendor terpilih', group: 'Perencanaan' },
  { title: 'Vendor Renovasi', detail: 'Pemilihan vendor renovasi outlet', group: 'Perencanaan' },
  { title: 'Vendor Advertisements', detail: 'Pemilihan vendor untuk advertising', group: 'Perencanaan' },
  { title: 'Vendor Furniture', detail: 'Pemilihan vendor untuk furniture', group: 'Perencanaan' },
  { title: 'Renovasi', detail: 'Persiapan area kerja, pekerjaan sipil, utilitas, dan finishing outlet', group: 'Pelaksanaan' },
  { title: 'Pembuatan Furniture', detail: 'Finalisasi ukuran, produksi, quality check, dan pemasangan furniture', group: 'Pelaksanaan' },
  { title: 'Pembuatan Neon Sign', detail: 'Finalisasi desain, produksi, uji lampu, dan pemasangan neon sign', group: 'Pelaksanaan' },
  { title: 'Pengiriman Mesin', detail: 'Penjadwalan armada, pengecekan packing, pengiriman, dan serah terima mesin', group: 'Pelaksanaan' },
  { title: 'Fulfillment', detail: 'Picking, packing, pengecekan jumlah, dan pemenuhan perlengkapan outlet', group: 'Pelaksanaan' },
  { title: 'Instalasi', detail: 'Penempatan mesin, pemasangan utilitas, commissioning, dan uji fungsi', group: 'Pelaksanaan' },
  { title: 'Final Check', detail: 'Pemeriksaan akhir kesiapan outlet', group: 'Pelaksanaan' },
];

function AddOutlet({
  setView,
  onCreated,
}: {
  setView: (view: View) => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [location, setLocation] = useState("");
  const [mapsUrl, setMapsUrl] = useState("");
  const [estimatedCompletionDate, setEstimatedCompletionDate] = useState("");
  const [packageName, setPackageName] = useState<string>("");
  const [availablePackages, setAvailablePackages] = useState<Array<{ name: string }>>(
    packageNames.map((name) => ({ name })),
  );
  const [selectedTasks, setSelectedTasks] = useState<Record<string, boolean>>(
    Object.fromEntries(allTimelineTasks.map((t) => [t.title, true]))
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    apiFetch<{ packages: Array<{ name: string }> }>("/api/packages")
      .then((data) => setAvailablePackages(data.packages))
      .catch(() => undefined);
  }, []);
  const submit = async () => {
    if (!name.trim() || !ownerName.trim() || !location.trim() || !packageName || !estimatedCompletionDate) {
      setError("Nama outlet, nama owner, lokasi, paket, dan estimasi selesai wajib diisi.");
      return;
    }
    if (estimatedCompletionDate < new Date().toISOString().slice(0, 10)) {
      setError("Estimasi tanggal selesai tidak boleh sebelum hari ini.");
      return;
    }
    setSaving(true);
    try {
      const timeline = allTimelineTasks
        .filter((task) => selectedTasks[task.title])
        .map((task, index) => ({
          title: task.title,
          detail: task.detail,
          status: "Akan dikerjakan" as TimelineStatus,
          stage: task.group === "Perencanaan" ? "planning" : "execution",
          order: index + 1,
        }));
      await apiFetch(
        "/api/projects",
        apiJson("POST", {
          name: name.trim(),
          owner: { name: ownerName.trim(), phone: "", email: "" },
          location: location.trim(),
          locationData: { address: location.trim(), mapsUrl: mapsUrl.trim() },
          packageName,
          estimatedCompletionDate,
          timeline,
        }),
      );
      onCreated();
      setView("dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat outlet.");
    } finally {
      setSaving(false);
    }
  };
  return (
    <>
      <Heading
        title="Tambah Outlet Baru"
        description="Buat project dengan data awal terlebih dahulu."
        action={
          <Button variant="ghost" onClick={() => setView("dashboard")}>
            <ArrowLeft />
            Kembali
          </Button>
        }
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Data awal outlet</CardTitle>
            <CardDescription>
              Nama outlet, owner, lokasi, dan paket wajib diisi.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <Field label="Nama outlet">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Outlet Kopra Bintaro"
              />
            </Field>
            <Field label="Nama owner">
              <Input
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Contoh: Budi Santoso"
              />
            </Field>
            <Field label="Paket Laundry Terpilih">
              <Select
                value={packageName}
                onValueChange={(value) => setPackageName(value || "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih paket laundry" />
                </SelectTrigger>
                <SelectContent>
                  {availablePackages.map((item) => (
                    <SelectItem key={item.name} value={item.name}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Alamat Lengkap Outlet">
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Jl. Dipati Ukur No. 46, Bandung"
              />
            </Field>
            <Field label="Link Google Maps URL">
              <Input
                value={mapsUrl}
                onChange={(e) => setMapsUrl(e.target.value)}
                placeholder="https://maps.app.goo.gl/..."
              />
              <p className="text-xs text-muted-foreground">
                Salin link lokasi dari aplikasi Google Maps dan tempel di sini.
              </p>
            </Field>
            <Field label="Estimasi tanggal selesai">
              <Input
                type="date"
                value={estimatedCompletionDate}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setEstimatedCompletionDate(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Dihitung mulai dari tanggal outlet dibuat.
              </p>
            </Field>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tahapan Timeline</CardTitle>
            <CardDescription>
              Pilih tahapan yang akan dimasukkan ke timeline.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <h4 className="font-semibold text-sm">Perencanaan</h4>
              {allTimelineTasks.filter((t) => t.group === "Perencanaan").map((task) => (
                <label key={task.title} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    className="size-4 accent-primary"
                    checked={selectedTasks[task.title]}
                    onChange={(e) =>
                      setSelectedTasks({
                        ...selectedTasks,
                        [task.title]: e.target.checked,
                      })
                    }
                  />
                  <span className="text-sm">{task.title}</span>
                </label>
              ))}
            </div>
            <div className="flex flex-col gap-3">
              <h4 className="font-semibold text-sm">Pelaksanaan</h4>
              {allTimelineTasks.filter((t) => t.group === "Pelaksanaan").map((task) => (
                <label key={task.title} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    className="size-4 accent-primary"
                    checked={selectedTasks[task.title]}
                    onChange={(e) =>
                      setSelectedTasks({
                        ...selectedTasks,
                        [task.title]: e.target.checked,
                      })
                    }
                  />
                  <span className="text-sm">{task.title}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <div className="md:col-span-2 flex flex-col gap-4">
          <ErrorText error={error} />
          <Button onClick={submit} disabled={saving} className="w-full">
            {saving ? "Membuat project..." : "Buat Project"}
          </Button>
        </div>
      </div>
    </>
  );
}
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
const sectionKinds: Array<{
  key: string;
  title: string;
  kind: FileKind;
  description: string;
}> = [
  {
    key: "owner",
    title: "Data Owner",
    kind: "owner-photo",
    description: "Kontak owner dan dokumentasi KTP.",
  },
  {
    key: "purchasePackage",
    title: "Bukti Pembelian Paket",
    kind: "purchase-proof",
    description: "Detail paket yang dibeli.",
  },
  {
    key: "setupFee",
    title: "Pembayaran Setup Fee",
    kind: "setup-fee-proof",
    description: "Bukti pembayaran dan nominal.",
  },
  {
    key: "leaseAgreement",
    title: "Perjanjian Sewa",
    kind: "lease-agreement",
    description: "Data pihak sewa dan periode.",
  },
  {
    key: "location",
    title: "Data Lokasi",
    kind: "location-document",
    description: "Alamat, wilayah, dan titik lokasi.",
  },
  {
    key: "kickoff",
    title: "MOM Kickoff Meeting",
    kind: "kickoff-mom",
    description: "Tanggal, peserta, agenda, dan dokumentasi.",
  },
];
function Documentation({
  projectId,
  kind,
  files,
  onAdded,
}: {
  projectId: string;
  kind: FileKind;
  files: Project["files"];
  onAdded: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [previewFile, setPreviewFile] = useState<Project["files"][number] | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const inputId = `file-${projectId}-${kind}`;
  const docs = files.filter((file) => file.kind === kind);
  const add = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSaving(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("projectId", projectId);
      form.append("kind", kind);
      await apiFetch("/api/files", { method: "POST", body: form });
      onAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengunggah file. Pastikan bucket 'project-files' sudah dibuat di Supabase Storage.");
    } finally {
      setSaving(false);
      event.target.value = "";
    }
  };
  const remove = async (file: Project["files"][number]) => {
    setDeleting(true);
    setError("");
    try {
      await apiFetch(`/api/files/${file.id}`, { method: "DELETE" });
      await onAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus foto.");
    } finally {
      setDeleting(false);
    }
  };
  return (
    <div className="flex flex-col gap-3">
      <ErrorText error={error} />
      {kind === "purchase-proof" && (
        <p className="rounded-lg bg-muted px-3 py-2 text-sm">
          Paket: ditetapkan saat membuat project
        </p>
      )}
      <input
        id={inputId}
        type="file"
        accept="image/*,.pdf,.doc,.docx"
        className="sr-only"
        onChange={add}
      />
      <Button variant="outline" size="sm" disabled={saving} onClick={() => document.getElementById(inputId)?.click()}>
        <Upload />
        {saving ? "Mengunggah..." : "Tambah dokumentasi"}
      </Button>
      {docs.length ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {docs.map((file) => {
            const isPdf = file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf');
            return (
              <div key={file.id} className="flex gap-3 rounded-xl border p-3">
              {isPdf ? (
                <div className="grid size-20 place-items-center rounded-lg bg-red-50 dark:bg-red-950/30 cursor-pointer" onClick={() => window.open(`/api/files/${encodeURIComponent(file.id)}`, '_blank', 'noopener,noreferrer')}>
                  <FileText className="size-8 text-red-500" />
                </div>
              ) : file.thumbnailUrl ? (
                <button type="button" className="cursor-zoom-in" onClick={() => setPreviewFile(file)} aria-label={`Lihat ${file.name}`}><img src={`/api/files/${encodeURIComponent(file.id)}`} alt={file.caption || file.name} className="size-20 rounded-lg object-cover" /></button>
              ) : (
                <div className="grid size-16 place-items-center rounded-lg bg-muted">
                  <ImageIcon className="text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {isPdf ? 'Dokumen PDF' : file.caption || "Tanpa caption"}
                </p>
                {isPdf && file.thumbnailUrl && (
                  <a href={`/api/files/${encodeURIComponent(file.id)}`} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                    <ExternalLink className="size-3" /> Buka PDF
                  </a>
                )}
              </div>
              <Button variant="destructive" size="icon" className="ml-auto shrink-0" onClick={() => remove(file)} disabled={deleting} aria-label={`Hapus ${file.name}`}><Trash2 /></Button>
            </div>
            );
          })}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          Belum ada dokumentasi. Tambahkan nama file dan URL thumbnail.
        </p>
      )}
      <ImagePreviewDialog file={previewFile} onClose={() => setPreviewFile(null)} />
    </div>
  );
}

function DetailStageCard({
  title,
  description,
  icon: Icon,
  isLocked,
  children,
  onSave,
  onContinue,
  isSaving,
  isNextUnlocked,
  hideActions,
  readOnly,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  isLocked: boolean;
  children: React.ReactNode;
  onSave?: () => void;
  onContinue?: () => void;
  isSaving?: boolean;
  isNextUnlocked?: boolean;
  hideActions?: boolean;
  readOnly?: boolean;
}) {
  return (
    <Card className="relative overflow-hidden mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="size-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className={`${isLocked ? "pointer-events-none select-none blur-[2px] opacity-60" : ""} ${readOnly ? "pointer-events-none select-none opacity-75" : ""}`}>
          {children}
          
          {!isLocked && !hideActions && !readOnly && (
            <div className="mt-5 flex items-center justify-end gap-3 border-t pt-5">
              {onSave && (
                <Button variant="outline" onClick={onSave} disabled={isSaving}>
                  {isSaving ? "Menyimpan..." : "Simpan"}
                </Button>
              )}
              {onContinue && !isNextUnlocked && (
                <Button onClick={onContinue} disabled={isSaving}>
                  Lanjut ke Tahap Selanjutnya
                </Button>
              )}
            </div>
          )}
        </div>

        {isLocked && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/50 backdrop-blur-[1px]">
            <LockKeyhole className="size-10 text-muted-foreground mb-3" />
            <p className="font-medium text-sm">Tahap ini masih terkunci.</p>
            <p className="text-xs text-muted-foreground mt-1">Selesaikan tahap sebelumnya terlebih dahulu.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Detail({
  projectId,
  setView,
  onSaved,
}: {
  projectId: string;
  setView: (view: View) => void;
  onSaved: () => void;
}) {
  type ProjectVendor = {
    id: string;
    name: string;
    category: string;
    contact?: { name?: string; phone?: string; email?: string; notes?: string };
  };
  type ProjectAssignment = { id: string; vendor_id: string; category?: string; role?: string; vendors?: ProjectVendor };
  const [project, setProject] = useState<Project | null>(null);
  const [packageItems, setPackageItems] = useState<Array<{ name: string; qty: number }>>([]);
  const [vendors, setVendors] = useState<ProjectVendor[]>([]);
  const [assignments, setAssignments] = useState<ProjectAssignment[]>([]);
  const [mapsUrl, setMapsUrl] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [ktpNumber, setKtpNumber] = useState("");
  const [ownerAddress, setOwnerAddress] = useState("");
  const [location, setLocation] = useState({ address: "", city: "", province: "", postalCode: "", latitude: "", longitude: "", notes: "" });
  const [sections, setSections] = useState<Record<string, any>>({});
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [issues, setIssues] = useState<Record<string, string>>({});
  const [deleting, setDeleting] = useState(false);
  const [previewFile, setPreviewFile] = useState<Project["files"][number] | null>(null);
  const [vendorDialogTask, setVendorDialogTask] = useState("");
  const [vendorForm, setVendorForm] = useState({ name: "", contactName: "", phone: "" });
  
  const [issueOpen, setIssueOpen] = useState(false);
  const [issueItem, setIssueItem] = useState("");
  const [issueNote, setIssueNote] = useState("");

  const [customItems, setCustomItems] = useState<Array<{ sku: string; name: string }>>([]);
  const [customSku, setCustomSku] = useState("");
  const [customName, setCustomName] = useState("");
  const [exportingToSheets, setExportingToSheets] = useState(false);
  const [notice, setNotice] = useState("");

  const load = async () => {
    try {
      const item = await apiFetch<Project & { assignments?: ProjectAssignment[] }>(`/api/projects/${projectId}?_t=${Date.now()}`);
      const packageData = await apiFetch<{ packages: Array<{ name: string; items: Array<{ name: string; qty: number }> }> }>('/api/packages');
      const selectedPackage = packageData.packages.find((packageItem) => packageItem.name === item.owner?.packageName);
      setPackageItems(selectedPackage?.items || []);
        setProject({
          ...item,
          owner: item.owner || {},
          files: item.files || [],
          timeline: item.timeline || [],
          sections: item.sections || {},
        });
        setAssignments(item.assignments || []);
        setCheckedItems(item.sections?.verifiedItems || {});
        setCustomItems(item.sections?.customItems || []);
        setIssues(item.sections?.issues || {});
        setPhone(item.owner?.phone || "");
        setEmail(item.owner?.email || "");
        setKtpNumber(item.owner?.ktpNumber || "");
        setOwnerAddress(item.owner?.address || "");
        setMapsUrl(item.locationData?.mapsUrl || "");
        setLocation({
          address: item.locationData?.address || item.location,
          city: item.locationData?.city || "",
          province: item.locationData?.province || "",
          postalCode: item.locationData?.postalCode || "",
          latitude: String(item.locationData?.latitude || ""),
          longitude: String(item.locationData?.longitude || ""),
          notes: item.locationData?.notes || "",
        });
        setSections(item.sections || {});

      // Vendor data is supplementary; it must not delay the project detail view.
      Promise.all([
        apiFetch<ProjectVendor[]>('/api/vendors'),
      ]).then(([vendorList]) => {
        setVendors(vendorList);
      }).catch(() => undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat detail proyek.');
    }
  };
      
  useEffect(() => { load(); }, [projectId]);

  if (!project) {
    return (
      <div>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Continue Project</p>
            <h1 className="text-2xl font-bold">Detail Project</h1>
          </div>
        </div>
        <Card><CardContent className="p-6 text-sm text-muted-foreground">Memuat detail proyek...</CardContent></Card>
      </div>
    );
  }

  const isCompleted = Boolean(project.sections?.softOpening) || project.phase === "Selesai";
  const unlockedStages: string[] = sections.unlockedStages || ['persiapan'];
  const hasStage = (stage: string) => unlockedStages.includes(stage);
  
  const updateSection = (key: string, field: string, value: string) =>
    setSections((current) => ({ ...current, [key]: { ...(current[key] || {}), [field]: value } }));

  const unlockStage = async (nextStage: string) => {
    if (!project) return;
    setSavingId('unlocking');
    try {
      const newUnlocked = Array.from(new Set([...unlockedStages, nextStage]));
      const newSections = { ...sections, unlockedStages: newUnlocked };
      await apiFetch(`/api/projects/${projectId}`, apiJson("PATCH", { sections: newSections }));
      setSections(newSections);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengupdate tahap.");
    } finally {
      setSavingId('');
    }
  };

  const savePersiapan = async () => {
    if (!project) return;
    setSavingId('persiapan');
    try {
      await apiFetch(`/api/projects/${projectId}`, apiJson("PATCH", {
        owner: { ...(project.owner || {}), phone, email, ktpNumber, address: ownerAddress },
        locationData: {
          ...location,
          mapsUrl: mapsUrl.trim() || undefined,
          latitude: location.latitude ? Number(location.latitude) : undefined,
          longitude: location.longitude ? Number(location.longitude) : undefined,
        },
      }));
      await load();
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan.");
    } finally {
      setSavingId('');
    }
  };

  const uploadDocumentation = async (taskId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSavingId(taskId);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("projectId", projectId);
      form.append("kind", "timeline-document");
      form.append("timelineTaskId", taskId);
      await apiFetch("/api/files", { method: "POST", body: form });
      await load();
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal unggah foto.");
    } finally {
      setSavingId("");
      event.target.value = "";
    }
  };
  const removeDocumentation = async (file: Project["files"][number]) => {
    setDeleting(true);
    try {
      await apiFetch(`/api/files/${file.id}`, { method: "DELETE" });
      await load();
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus foto.");
    } finally {
      setDeleting(false);
    }
  };

  const completeTask = async (taskId: string) => {
    setSavingId(taskId);
    try {
      await apiFetch(`/api/projects/${projectId}/timeline/${taskId}`, apiJson("PATCH", { status: "Selesai dikerjakan" }));
      setProject((current) => current ? {
        ...current,
        timeline: current.timeline.map((task) => task.id === taskId ? { ...task, status: "Selesai dikerjakan" } : task),
      } : current);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memperbarui tugas.");
    } finally {
      setSavingId("");
    }
  };

  const saveIssue = async () => {
    if (!issueItem || !issueNote.trim()) return;
    const nextIssues = { ...issues, [issueItem]: issueNote.trim() };
    const nextSections = { ...sections, issues: nextIssues };
    setIssues(nextIssues);
    setSections(nextSections);
    try {
      await apiFetch(`/api/projects/${projectId}`, apiJson("PATCH", { sections: nextSections }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan kendala.");
      return;
    }
    setIssueOpen(false);
    setIssueNote("");
  };

  const moveToSoftOpening = async () => {
    setSavingId('soft-opening');
    try {
      const newSections = { ...sections, verifiedItems: checkedItems, softOpening: true };
      await apiFetch(`/api/projects/${projectId}`, apiJson('PATCH', { sections: newSections }));
      setSections(newSections);
      onSaved();
      setView('soft-opening');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memindahkan outlet ke Soft Opening.');
    } finally {
      setSavingId('');
    }
  };

  const addCustomItem = async () => {
    if (!customSku.trim() || !customName.trim()) return;
    const newItem = { sku: customSku, name: customName };
    const newCustomItems = [...customItems, newItem];
    setCustomItems(newCustomItems);
    setCustomSku('');
    setCustomName('');
    
    // Auto save
    try {
      const newSections = { ...sections, customItems: newCustomItems };
      await apiFetch(`/api/projects/${projectId}`, apiJson('PATCH', { sections: newSections }));
      setSections(newSections);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan barang tambahan.');
    }
  };

  const exportToSheets = async () => {
    if (!project) return;
    setExportingToSheets(true);
    try {
      const payload = { project, packageItems, customItems, files: project.files };
      const res = await apiFetch<{ success: boolean; count: number }>(`/api/projects/${projectId}/export`, apiJson('POST', payload));
      setNotice('Data outlet dan master barang berhasil dikirim ke Google Sheets.');
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Gagal mengekspor data ke Google Sheets.');
    } finally {
      setExportingToSheets(false);
    }
  };

  const exportToPdf = async () => {
    if (!project) return;
    const pdf = new jsPDF();
    let y = 20;
    const pageWidth = pdf.internal.pageSize.width;
    
    // Helper to add page if needed
    const checkPage = (height: number) => {
      if (y + height > 280) {
        pdf.addPage();
        y = 20;
        return true;
      }
      return false;
    };

    // Header styling
    pdf.setFillColor(41, 128, 185); // Primary blue
    pdf.rect(0, 0, pageWidth, 40, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(22);
    pdf.text('LAPORAN OUTLET', 15, 25);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(project.name, 15, 33);
    
    y = 50;

    // Helper for section titles
    const addSectionTitle = (title: string) => {
      checkPage(20);
      pdf.setDrawColor(41, 128, 185);
      pdf.setFillColor(240, 248, 255);
      pdf.rect(15, y - 5, pageWidth - 30, 10, 'F');
      pdf.setTextColor(41, 128, 185);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text(title.toUpperCase(), 20, y + 2);
      y += 15;
    };

    // Write text helper
    const write = (label: string, value: string, isFullWidth = false, offsetX = 15) => {
      checkPage(8);
      pdf.setTextColor(100, 100, 100);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.text(label + ':', offsetX, y);
      
      pdf.setTextColor(40, 40, 40);
      pdf.setFont('helvetica', 'normal');
      const lines = pdf.splitTextToSize(value, isFullWidth ? 150 : 60);
      pdf.text(lines, offsetX + 35, y);
      const height = lines.length * 5;
      if (isFullWidth) y += height + 3;
      return height;
    };

    const drawTable = (headers: string[], tableRows: string[][], columnRatios: number[], links = new Map<string, string>()) => {
      const tableWidth = pageWidth - 30;
      const columnWidths = columnRatios.map((ratio) => tableWidth * ratio);
      const splitCell = (text: string, width: number) => {
        const lines = pdf.splitTextToSize(text || '-', width);
        return Array.isArray(lines) ? lines : [lines];
      };
      const drawHeader = () => {
        const headerLines = headers.map((header, index) => splitCell(header, columnWidths[index] - 4));
        const headerHeight = Math.max(9, ...headerLines.map((lines) => lines.length * 3.5 + 4));
        if (y + headerHeight > 280) {
          pdf.addPage();
          y = 20;
        }
        pdf.setFillColor(41, 128, 185);
        pdf.setTextColor(255, 255, 255);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7);
        let x = 15;
        headerLines.forEach((lines, index) => {
          pdf.rect(x, y, columnWidths[index], headerHeight, 'F');
          pdf.text(lines, x + 2, y + 4);
          x += columnWidths[index];
        });
        y += headerHeight;
      };

      drawHeader();
      tableRows.forEach((row, rowIndex) => {
        const cellLines = headers.map((_, columnIndex) => splitCell(row[columnIndex] || '-', columnWidths[columnIndex] - 4));
        const rowHeight = Math.max(8, ...cellLines.map((lines) => lines.length * 3.5 + 4));
        if (y + rowHeight > 280) {
          pdf.addPage();
          y = 20;
          drawHeader();
        }
        pdf.setFillColor(rowIndex % 2 === 0 ? 248 : 238, rowIndex % 2 === 0 ? 250 : 244, rowIndex % 2 === 0 ? 251 : 247);
        pdf.setTextColor(40, 40, 40);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7);
        let x = 15;
        cellLines.forEach((lines, columnIndex) => {
          pdf.rect(x, y, columnWidths[columnIndex], rowHeight, 'F');
          pdf.setDrawColor(220, 226, 230);
          pdf.rect(x, y, columnWidths[columnIndex], rowHeight, 'S');
          const link = links.get(`${rowIndex}:${columnIndex}`);
          if (link) {
            pdf.setTextColor(25, 85, 160);
            pdf.setFont('helvetica', 'bold');
          }
          pdf.text(lines, x + 2, y + 4);
          if (link) pdf.link(x, y, columnWidths[columnIndex], rowHeight, { url: link });
          pdf.setTextColor(40, 40, 40);
          pdf.setFont('helvetica', 'normal');
          x += columnWidths[columnIndex];
        });
        y += rowHeight;
      });
      y += 5;
    };

    // 1. Data Outlet
    addSectionTitle('Informasi Outlet & Owner');
    let currentY = y;
    write('Owner', project.owner?.name || '-');
    write('Telepon', project.owner?.phone || '-', false, 105);
    y = currentY + 8;
    currentY = y;
    write('Email', project.owner?.email || '-');
    write('Paket', project.owner?.packageName || '-', false, 105);
    y = currentY + 8;
    write('Alamat', project.locationData?.address || project.location || '-', true);
    write('Status', project.phase, true);
    write('Progress', `${project.progress}%`, true);
    
    y += 5;

    // 2. Timeline
    addSectionTitle('Status Pengerjaan (Timeline)');
    pdf.setFontSize(10);
    project.timeline.forEach((task) => {
      checkPage(8);
      
      // Status icon/color
      if (task.status === 'Selesai dikerjakan') {
        pdf.setTextColor(39, 174, 96); // Green
        pdf.setFont('helvetica', 'bold');
        pdf.text('✓', 15, y);
      } else if (task.status === 'In Progress') {
        pdf.setTextColor(243, 156, 18); // Orange
        pdf.setFont('helvetica', 'bold');
        pdf.text('○', 15, y);
      } else {
        pdf.setTextColor(149, 165, 166); // Gray
        pdf.setFont('helvetica', 'normal');
        pdf.text('-', 15, y);
      }

      pdf.setTextColor(40, 40, 40);
      pdf.setFont('helvetica', 'normal');
      pdf.text(task.title, 25, y);
      
      pdf.setTextColor(100, 100, 100);
      pdf.text(task.status, 140, y);
      
      pdf.setDrawColor(230, 230, 230);
      pdf.line(15, y + 2, pageWidth - 15, y + 2);
      y += 8;
    });

    y += 5;

    // 3. Kendala
    addSectionTitle('Kendala (Issues)');
    if (!Object.keys(issues).length) {
      pdf.setTextColor(40, 40, 40);
      pdf.setFont('helvetica', 'italic');
      pdf.text('Tidak ada kendala yang dilaporkan.', 15, y);
      y += 8;
    } else {
      Object.entries(issues).forEach(([item, note]) => {
        checkPage(15);
        pdf.setTextColor(192, 57, 43); // Red
        pdf.setFont('helvetica', 'bold');
        pdf.text('• ' + item, 15, y);
        
        pdf.setTextColor(40, 40, 40);
        pdf.setFont('helvetica', 'normal');
        const lines = pdf.splitTextToSize(String(note), pageWidth - 35);
        pdf.text(lines, 20, y + 5);
        y += (lines.length * 5) + 8;
      });
    }

    y += 5;

    // 4. Dokumentasi
    addSectionTitle('Dokumentasi');
    const kindLabels: Record<string, string> = {
      'owner-photo': 'Foto Owner',
      'purchase-proof': 'Bukti Pembelian',
      'setup-fee-proof': 'Bukti Setup Fee',
      'lease-agreement': 'Perjanjian Sewa',
      'location-document': 'Dokumen Lokasi',
      'kickoff-mom': 'MOM Kickoff',
      'timeline-document': 'Dokumen Timeline',
      'timeline-photo': 'Foto Timeline',
      'legal-document': 'Dokumen Legal',
    };
    const documentLinks = new Map<string, string>();
    const documentRows = project.files.map((file, index) => {
      const link = file.id ? `${window.location.origin}/api/files/${encodeURIComponent(file.id)}` : file.thumbnailUrl;
      if (link) documentLinks.set(`${index}:3`, link);
      return [kindLabels[file.kind] || file.kind, file.name, file.type, link ? 'Buka dokumen' : '-'];
    });
    if (documentRows.length > 0) {
      drawTable(['Kategori', 'Nama File', 'Tipe', 'Link'], documentRows, [0.2, 0.42, 0.2, 0.18], documentLinks);
    } else {
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(9);
      pdf.text('Belum ada dokumentasi.', 15, y);
      y += 8;
    }

    const imageFiles = project.files.filter(f => f.type.startsWith('image/') && f.thumbnailUrl);
    if (imageFiles.length > 0) {
      addSectionTitle('Dokumentasi Foto');
      for (const file of imageFiles) {
        try {
          const response = await fetch(file.thumbnailUrl as string);
          const blob = await response.blob();
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          const properties = pdf.getImageProperties(dataUrl);
          const maxWidth = pageWidth - 30;
          let imgWidth = 140;
          if (imgWidth > maxWidth) imgWidth = maxWidth;
          const imgHeight = imgWidth * properties.height / properties.width;
          
          if (checkPage(imgHeight + 15)) {
            // Already added page
          }
          
          // Photo frame and title
          pdf.setFillColor(245, 245, 245);
          pdf.rect(15, y, imgWidth, 8, 'F');
          pdf.setTextColor(40, 40, 40);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(9);
          pdf.text(file.name, 17, y + 6);
          y += 8;
          
          pdf.addImage(dataUrl, properties.fileType, 15, y, imgWidth, imgHeight);
          
          // Border around image
          pdf.setDrawColor(200, 200, 200);
          pdf.rect(15, y, imgWidth, imgHeight, 'S');
          
          y += imgHeight + 10;
        } catch {
          // Ignore image load failures
        }
      }
    }

    // 5. Vendor proyek, immediately after documentation
    addSectionTitle('Data Vendor');
    const vendorRows = assignments.map((assignment) => {
      const vendor = assignment.vendors;
      const contact = vendor?.contact;
      return [
        assignment.category || vendor?.category || '-',
        vendor?.name || '-',
        contact?.name || '-',
        contact?.phone || '-',
        contact?.email || '-',
        contact?.notes || '-',
      ];
    });
    if (vendorRows.length > 0) {
      drawTable(['Kategori', 'Nama Vendor', 'Kontak', 'Telepon', 'Email', 'Catatan'], vendorRows, [0.16, 0.2, 0.17, 0.16, 0.17, 0.14]);
    } else {
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(9);
      pdf.text('Belum ada vendor yang ditugaskan.', 15, y);
      y += 8;
    }

    // 6. Loading & setup package verification
    addSectionTitle(`Paket ${project.owner?.packageName || '-'} | Setup & Loading`);
    const setupRows = [
      ...packageItems.map((item) => [
        'STANDARD',
        item.name,
        String(item.qty || 1),
        issues[item.name] || '-',
        checkedItems[item.name] ? 'Terverifikasi' : 'Belum diverifikasi',
      ]),
      ...customItems.map((item) => [item.sku || '-', item.name, '1', '-', '-']),
    ];
    if (setupRows.length > 0) {
      drawTable(['Kode Barang', 'Nama Barang', 'Qty', 'Kendala', 'Verifikasi'], setupRows, [0.16, 0.29, 0.09, 0.23, 0.23]);
    } else {
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(9);
      pdf.text('Tidak ada barang paket untuk diverifikasi.', 15, y);
      y += 8;
    }

    // 7. Static and package-dependent master inventory
    addSectionTitle('Master Data Barang');
    const masterRows = buildMasterData(packageItems).slice(2).map((row) => row.map(String));
    drawTable(['Kode Barang', 'Nama Barang', 'Kuantitas', 'Fulfillment'], masterRows, [0.17, 0.47, 0.15, 0.21]);

    const pageCount = (pdf as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFillColor(41, 128, 185);
      pdf.rect(0, 285, pageWidth, 15, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(8);
      pdf.text(`BikinLaundry - Laporan Project | Dicetak: ${new Date().toLocaleDateString('id-ID')}`, 15, 292);
      pdf.text(`Halaman ${i} dari ${pageCount}`, pageWidth - 35, 292);
    }
    pdf.save(`${project.name.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'laporan-outlet'}.pdf`);
    setNotice('Laporan PDF berhasil diunduh.');
  };

  const updateVerifiedItem = (item: string, verified: boolean) => {
    const nextCheckedItems = { ...checkedItems, [item]: verified };
    const nextSections = { ...sections, verifiedItems: nextCheckedItems };
    setCheckedItems(nextCheckedItems);
    setSections(nextSections);
    apiFetch(`/api/projects/${projectId}`, apiJson("PATCH", { sections: nextSections })).catch((err) => {
      setError(err instanceof Error ? err.message : "Gagal menyimpan verifikasi barang.");
    });
  };

  const updateTaskStatus = async (taskId: string, status: string) => {
    setSavingId(taskId);
    setProject(prev => prev ? {
      ...prev,
      timeline: prev.timeline.map(t => t.id === taskId ? { ...t, status: status as TimelineStatus } : t)
    } : null);
    
    try {
      await apiFetch(`/api/projects/${projectId}/timeline/${taskId}`, apiJson("PATCH", { status }));
      await load();
      onSaved();
    } catch (err) {
      await load();
      setError(err instanceof Error ? err.message : "Gagal memperbarui status.");
    } finally {
      setSavingId("");
    }
  };

  const vendorCategoryForTask = (title: string) =>
    title === 'Vendor Renovasi' ? 'Renovasi' : title === 'Vendor Advertisements' ? 'Advertisements' : 'Furniture';

  const vendorMatchesTask = (vendor: ProjectVendor, title: string) => {
    const category = vendor.category.toLowerCase();
    const expected = vendorCategoryForTask(title).toLowerCase();
    return category === expected || (expected === 'advertisements' && (category === 'ads' || category.includes('advert')));
  };

  const assignVendor = async (taskTitle: string, vendorId: string) => {
    if (!vendorId) return;
    setSavingId(`vendor-${taskTitle}`);
    try {
      const assignment = await apiFetch<ProjectAssignment>(
        `/api/projects/${projectId}/assignments`,
        apiJson('POST', { vendorId, category: vendorCategoryForTask(taskTitle) }),
      );
      setAssignments((current) => [
        ...current.filter((item) => (item.category || item.role) !== taskTitle && (item.category || item.role) !== vendorCategoryForTask(taskTitle)),
        assignment,
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memilih vendor.');
    } finally {
      setSavingId('');
    }
  };

  const createVendorForTask = async () => {
    if (!vendorDialogTask || !vendorForm.name.trim()) return;
    setSavingId('vendor-create');
    try {
      const vendor = await apiFetch<ProjectVendor>('/api/vendors', apiJson('POST', {
        name: vendorForm.name.trim(),
        category: vendorCategoryForTask(vendorDialogTask),
        contactName: vendorForm.contactName.trim(),
        phone: vendorForm.phone.trim(),
      }));
      setVendors((current) => [vendor, ...current]);
      await assignVendor(vendorDialogTask, vendor.id);
      setVendorDialogTask("");
      setVendorForm({ name: "", contactName: "", phone: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menambahkan vendor.');
    } finally {
      setSavingId('');
    }
  };

  const renderVendorPlanning = () => (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
      <div className="mb-4 flex items-start gap-3">
        <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <Users className="size-5" />
        </div>
        <div>
          <p className="font-semibold">Vendor yang digunakan</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Pilih vendor dari Master Vendors untuk setiap kebutuhan proyek.
          </p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {(['Vendor Renovasi', 'Vendor Advertisements', 'Vendor Furniture'] as const).map((taskTitle) => {
          const assignment = assignments.find((item) => (item.category || item.role) === taskTitle || (item.category || item.role) === vendorCategoryForTask(taskTitle));
          const availableVendors = vendors.filter((vendor) => vendorMatchesTask(vendor, taskTitle));
          const selectedVendor = availableVendors.find((vendor) => vendor.id === assignment?.vendor_id) || assignment?.vendors;
          return (
            <div key={taskTitle} className="flex flex-col gap-2 rounded-lg border bg-background p-3">
              <Label>{taskTitle}</Label>
              <Select value={assignment?.vendor_id || ''} onValueChange={(value) => value && assignVendor(taskTitle, value)} disabled={savingId === `vendor-${taskTitle}`}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={availableVendors.length ? 'Pilih vendor' : 'Belum ada data vendor'}>
                    {selectedVendor?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {availableVendors.map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.id}>{vendor.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedVendor && (
                <div className="rounded-md bg-muted/50 p-2 text-xs text-muted-foreground">
                  <p className="font-medium text-foreground">{selectedVendor.name}</p>
                  <p className="mt-1">Kategori: {selectedVendor.category}</p>
                  <p>PIC: {selectedVendor.contact?.name || 'Belum diisi'}</p>
                  <p>Telepon: {selectedVendor.contact?.phone || 'Belum diisi'}</p>
                  <p>Email: {selectedVendor.contact?.email || 'Belum diisi'}</p>
                  {selectedVendor.contact?.notes && <p className="mt-1">Catatan: {selectedVendor.contact.notes}</p>}
                </div>
              )}
              <Button type="button" variant="ghost" size="sm" className="justify-start px-0 text-xs text-primary" onClick={() => setVendorDialogTask(taskTitle)}>
                <Plus className="size-3" /> Tambah vendor baru
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderTimelineTasks = (stage: 'planning' | 'execution') => {
    return [...project.timeline]
      .filter(t => t.stage === stage && !(stage === 'execution' && t.title === 'Soft Opening'))
      .sort((first, second) => first.order - second.order)
      .map(task => {
      const docs = project.files.filter(f => f.timelineTaskId === task.id);
      
      if (stage === 'execution') {
        return (
          <div key={task.id} className="flex items-center justify-between rounded-xl border p-4">
            <div>
              <p className="font-medium">{task.title}</p>
              <p className="text-sm text-muted-foreground">{task.detail}</p>
            </div>
            <Select value={task.status} onValueChange={(value) => updateTaskStatus(task.id!, value as string)} disabled={savingId === task.id}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Akan dikerjakan">Akan dikerjakan</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Selesai dikerjakan">Selesai dikerjakan</SelectItem>
                <SelectItem value="Tidak diperlukan">Tidak diperlukan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );
      }

      return (
        <div key={task.id} className="rounded-xl border p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-medium">{task.title}</p>
              <p className="text-sm text-muted-foreground">{task.detail}</p>
              <Badge variant={task.status === "Selesai dikerjakan" ? "default" : "secondary"} className="mt-2">
                {task.status}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <input type="file" accept="image/*,.pdf" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => uploadDocumentation(task.id, e)} disabled={savingId === task.id} />
                <Button variant="outline" size="sm" disabled={savingId === task.id}>
                  <Upload className="size-4 mr-2" /> {savingId === task.id ? "..." : "Dokumentasi"}
                </Button>
              </div>
              {task.status !== "Selesai dikerjakan" && task.status !== "Tidak diperlukan" && (
                <Button size="sm" onClick={() => completeTask(task.id)} disabled={savingId === task.id}>Selesai</Button>
              )}
            </div>
          </div>
          {docs.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-3">
              {docs.map((file) => (
                <div key={file.id} className="group flex flex-col items-center gap-1">
                  {file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf") ? (
                    <button type="button" onClick={() => setPreviewFile(file)} aria-label={`Lihat ${file.name}`} className="flex w-20 h-20 items-center justify-center rounded-md border bg-red-50 text-red-500 shadow-sm">
                      <FileText className="size-6" />
                    </button>
                  ) : file.thumbnailUrl ? (
                    <button type="button" onClick={() => setPreviewFile(file)} aria-label={`Lihat ${file.name}`} className="block w-20 h-20 cursor-zoom-in overflow-hidden rounded-md border shadow-sm">
                      <img src={`/api/files/${encodeURIComponent(file.id)}`} alt={file.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                    </button>
                  ) : (
                    <div className="flex w-20 h-20 items-center justify-center rounded-md border bg-muted text-xs shadow-sm">
                      <FileText className="size-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex max-w-[100px] items-center gap-1"><span className="truncate text-[10px] text-muted-foreground" title={file.name}>{file.name}</span><button type="button" onClick={() => removeDocumentation(file)} aria-label={`Hapus ${file.name}`} className="text-destructive"><Trash2 className="size-3" /></button></div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    });
  };

  const verifiedCount = Object.values(checkedItems).filter(Boolean).length;

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" onClick={() => setView('dashboard')} className="mb-2 -ml-3 text-muted-foreground">
            <ArrowLeft className="mr-1 size-4" /> Kembali
          </Button>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{project.location}</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Badge className="px-3 py-1 text-sm">Paket: {project.owner.packageName || 'Gold'}</Badge>
          <Button variant="outline" size="sm" onClick={exportToSheets} disabled={exportingToSheets}>
            <Download className="size-4 mr-1" /> {exportingToSheets ? 'Mengekspor...' : 'Google Sheets'}
          </Button>
          <Button variant="outline" size="sm" onClick={exportToPdf}>
            <FileText className="size-4 mr-1" /> PDF
          </Button>
        </div>
      </div>
      
      {error && <div className="p-3 mb-5 text-sm font-medium text-destructive bg-destructive/10 rounded-md">{error}</div>}

      <DetailStageCard
        title="1. Tahap Persiapan"
        description="Data owner dan dokumentasi awal."
        icon={Users}
        isLocked={false}
        isNextUnlocked={hasStage('perencanaan')}
        onSave={savePersiapan}
        onContinue={() => unlockStage('perencanaan')}
        isSaving={savingId === 'persiapan' || savingId === 'unlocking'}
        readOnly={isCompleted}
      >
        <div className="grid gap-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground border-b pb-2">Data Owner</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nomor telepon"><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
              <Field label="Email"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
              <Field label="Nomor KTP"><Input value={ktpNumber} onChange={(e) => setKtpNumber(e.target.value)} /></Field>
              <div className="md:col-span-2"><Field label="Alamat owner"><Input value={ownerAddress} onChange={(e) => setOwnerAddress(e.target.value)} /></Field></div>
              <div className="md:col-span-2"><Documentation projectId={projectId} kind="owner-photo" files={project.files} onAdded={load} /></div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground border-b pb-2">Data Lokasi</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2"><Field label="Alamat Lokasi"><Input value={location.address} onChange={(e) => setLocation(l => ({ ...l, address: e.target.value }))} /></Field></div>
              <Field label="Kota"><Input value={location.city} onChange={(e) => setLocation(l => ({ ...l, city: e.target.value }))} /></Field>
              <Field label="Provinsi"><Input value={location.province} onChange={(e) => setLocation(l => ({ ...l, province: e.target.value }))} /></Field>
              <Field label="Kode Pos"><Input value={location.postalCode} onChange={(e) => setLocation(l => ({ ...l, postalCode: e.target.value }))} /></Field>
              <div className="md:col-span-2"><Field label="Link Google Maps"><Input value={mapsUrl} onChange={(e) => setMapsUrl(e.target.value)} /></Field></div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground border-b pb-2">Dokumentasi Persiapan</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="border rounded-lg p-4 bg-muted/20">
                <p className="font-medium mb-3 text-sm">Bukti Pembayaran / Setup Fee</p>
                <Documentation projectId={projectId} kind="setup-fee-proof" files={project.files} onAdded={load} />
              </div>
              <div className="border rounded-lg p-4 bg-muted/20">
                <p className="font-medium mb-3 text-sm">Perjanjian Sewa (Lease Agreement)</p>
                <Documentation projectId={projectId} kind="lease-agreement" files={project.files} onAdded={load} />
              </div>
              <div className="border rounded-lg p-4 bg-muted/20">
                <p className="font-medium mb-3 text-sm">Dokumen Lokasi Tambahan</p>
                <Documentation projectId={projectId} kind="location-document" files={project.files} onAdded={load} />
              </div>
              <div className="border rounded-lg p-4 bg-muted/20">
                <p className="font-medium mb-3 text-sm">MOM Kickoff Meeting</p>
                <Documentation projectId={projectId} kind="kickoff-mom" files={project.files} onAdded={load} />
              </div>
            </div>
          </div>
        </div>
      </DetailStageCard>

      <DetailStageCard
        title="2. Tahap Perencanaan"
        description="Survey, perizinan, desain, dan pemilihan vendor."
        icon={CalendarDays}
        isLocked={!hasStage('perencanaan')}
        isNextUnlocked={hasStage('pelaksanaan')}
        onContinue={() => unlockStage('pelaksanaan')}
        isSaving={savingId === 'unlocking'}
        readOnly={isCompleted}
      >
        <div className="flex flex-col gap-5">
          {renderVendorPlanning()}
          <div className="flex flex-col gap-3">
            {renderTimelineTasks('planning')}
          </div>
        </div>
      </DetailStageCard>

      <Dialog open={Boolean(vendorDialogTask)} onOpenChange={(open) => !open && setVendorDialogTask("")}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Vendor {vendorDialogTask && `- ${vendorCategoryForTask(vendorDialogTask)}`}</DialogTitle>
            <DialogDescription>Vendor baru akan langsung dipilih untuk proyek ini.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <Field label="Nama vendor"><Input value={vendorForm.name} onChange={(event) => setVendorForm({ ...vendorForm, name: event.target.value })} placeholder="Contoh: CV Maju Jaya" /></Field>
            <Field label="Contact person"><Input value={vendorForm.contactName} onChange={(event) => setVendorForm({ ...vendorForm, contactName: event.target.value })} placeholder="Nama PIC vendor" /></Field>
            <Field label="Nomor telepon"><Input value={vendorForm.phone} onChange={(event) => setVendorForm({ ...vendorForm, phone: event.target.value })} /></Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVendorDialogTask("")}>Batal</Button>
            <Button onClick={createVendorForTask} disabled={!vendorForm.name.trim() || savingId === 'vendor-create'}>{savingId === 'vendor-create' ? 'Menyimpan...' : 'Simpan & Pilih Vendor'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DetailStageCard
        title="3. Tahap Pelaksanaan"
        description="Renovasi, pembuatan furniture, hingga instalasi mesin."
        icon={FolderKanban}
        isLocked={!hasStage('pelaksanaan')}
        isNextUnlocked={hasStage('loading')}
        onContinue={() => unlockStage('loading')}
        isSaving={savingId === 'unlocking'}
        readOnly={isCompleted}
      >
        <div className="flex flex-col gap-3">
          {renderTimelineTasks('execution')}
        </div>
      </DetailStageCard>

      <DetailStageCard
        title="4. Loading & Setup Barang"
        description="Verifikasi inventory dan pengecekan kelengkapan outlet."
        icon={Check}
        isLocked={!hasStage('loading')}
        hideActions
        readOnly={isCompleted}
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border">
            <span className="font-semibold">Barang Terverifikasi</span>
            <Badge variant="secondary" className="text-base px-3 py-1">{verifiedCount} / {packageItems.length}</Badge>
          </div>
          
          <div className="overflow-x-auto border rounded-xl">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left">
                  <th className="px-4 py-3">Nama Barang</th>
                  <th className="px-4 py-3 w-20">Qty</th>
                  <th className="px-4 py-3 w-32">Kendala</th>
                  <th className="px-4 py-3 w-24 text-center">Verifikasi</th>
                </tr>
              </thead>
              <tbody>
                {packageItems.map(({ name: item, qty }) => (
                  <tr key={item} className="border-t">
                    <td className="px-4 py-3">
                      <p className="font-medium">{item}</p>
                      {issues[item] && <p className="text-xs text-destructive mt-1">{issues[item]}</p>}
                    </td>
                    <td className="px-4 py-3">{qty}</td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm" onClick={() => { setIssueItem(item); setIssueOpen(true); }} className="h-8 px-2 text-muted-foreground hover:text-destructive">
                        <TriangleAlert className="size-4 mr-2" /> Lapor
                      </Button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input type="checkbox" className="size-5 accent-primary cursor-pointer" checked={!!checkedItems[item]} onChange={(e) => updateVerifiedItem(item, e.target.checked)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-2 p-4 border rounded-xl bg-muted/20">
            <h4 className="text-sm font-semibold">Tambah Data Barang Tambahan</h4>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <Label className="text-xs">Kode Barang (SKU)</Label>
                <Input value={customSku} onChange={(e) => setCustomSku(e.target.value)} placeholder="Misal: SKU0040" className="mt-1" />
              </div>
              <div className="flex-1">
                <Label className="text-xs">Nama Barang</Label>
                <Input value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="Misal: Dryer Mayteg" className="mt-1" />
              </div>
              <Button onClick={addCustomItem} disabled={!customSku.trim() || !customName.trim()}>Tambah</Button>
            </div>
            {customItems.length > 0 && (
              <div className="mt-2 flex flex-col gap-1">
                {customItems.map((item, idx) => (
                  <div key={idx} className="text-xs text-muted-foreground flex justify-between bg-background p-2 rounded-md border">
                    <span>{item.name}</span>
                    <span>SKU: {item.sku}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={exportToSheets} disabled={exportingToSheets} className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200">
              <Download className="size-4 mr-2" /> {exportingToSheets ? 'Mengekspor...' : 'Export ke Google Sheets'}
            </Button>
            <Button variant="outline" onClick={exportToPdf}>
              <FileText className="size-4 mr-2" /> Export ke PDF
            </Button>
            <Button onClick={moveToSoftOpening} disabled={!packageItems.length || verifiedCount < packageItems.length || savingId === 'soft-opening'}>
              {savingId === 'soft-opening' ? 'Memindahkan...' : 'Soft Opening'}
            </Button>
          </div>
        </div>

        <Dialog open={issueOpen} onOpenChange={setIssueOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Laporkan Kendala</DialogTitle>
              <DialogDescription>Barang: {issueItem}</DialogDescription>
            </DialogHeader>
            <Textarea value={issueNote} onChange={(e) => setIssueNote(e.target.value)} placeholder="Contoh: Barang rusak saat pengiriman..." className="min-h-[100px]" />
            <DialogFooter>
              <Button onClick={saveIssue} disabled={!issueNote.trim()}>Simpan Issue</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DetailStageCard>
      
      {notice && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm rounded-lg border bg-background px-4 py-3 text-sm font-medium shadow-lg" role="status">
          {notice}
          <button type="button" className="ml-3 text-muted-foreground hover:text-foreground" onClick={() => setNotice("")} aria-label="Tutup notifikasi">×</button>
        </div>
      )}
      <div className="h-10" />
      <ImagePreviewDialog file={previewFile} onClose={() => setPreviewFile(null)} />
    </div>
  );
}

function MasterPackages() {
  type PackageRow = {
    id: string;
    name: PackageName | string;
    description: string;
    items: Array<{ name: string; qty: number }>;
  };
  const requiredGoods = [
    "Set Mesin Cuci",
    "Boiler 35Lt",
    "Meja Kasir",
    "CCTV Bardi",
    "POS Kasir",
  ];
  const initial = packageNames.map((name) => ({
    id: `default-${name.toLowerCase()}`,
    name,
    description: `Template barang outlet paket ${name}.`,
    items: packageTemplates[name].map((item) => {
      const match = item.match(/^(\d+)\s*(.*)$/);
      return { name: match?.[2] || item, qty: Number(match?.[1] || 1) };
    }),
  }));
  const [packages, setPackages] = useState<PackageRow[]>(initial);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [itemName, setItemName] = useState("");
  const [customGoods, setCustomGoods] = useState<string[]>([]);
  const [customGoodName, setCustomGoodName] = useState("");
  const [qty, setQty] = useState(1);
  const [items, setItems] = useState<Array<{ name: string; qty: number }>>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const goods = [...requiredGoods, ...customGoods];
  useEffect(() => {
    apiFetch<{ packages: PackageRow[]; customGoods: string[] }>("/api/packages")
      .then((data) => {
        if (data.packages.length) setPackages(data.packages);
        setCustomGoods(data.customGoods);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Gagal memuat master paket."))
      .finally(() => setLoading(false));
  }, []);
  const resetForm = () => {
    setName("");
    setDescription("");
    setItemName("");
    setCustomGoodName("");
    setQty(1);
    setItems([]);
    setEditing(null);
  };
  const openNew = () => {
    resetForm();
    setOpen(true);
  };
  const openEdit = (item: PackageRow) => {
    setEditing(item.name);
    setName(item.name);
    setDescription(item.description);
    setItems(item.items);
    setOpen(true);
  };
  const addItem = () => {
    if (!itemName || qty < 1) return;
    setItems((current) => [...current, { name: itemName, qty }]);
    setItemName("");
    setQty(1);
  };
  const addCustomGood = () => {
    const nextGood = customGoodName.trim();
    if (!nextGood || goods.includes(nextGood)) return;
    setCustomGoods((current) => [...current, nextGood]);
    setItemName(nextGood);
    setCustomGoodName("");
  };
  const save = async () => {
    if (!name.trim() || !items.length) return;
    setSaving(true);
    try {
      const current = packages.find((item) => item.name === editing);
      const next = { id: current?.id, name: name.trim(), description: description.trim(), items };
      const data = await apiFetch<{ packages: PackageRow[]; customGoods: string[] }>("/api/packages", apiJson("POST", { package: next, customGoods: customGoods[customGoods.length - 1] }));
      setPackages(data.packages);
      setCustomGoods(data.customGoods);
      setOpen(false);
      resetForm();
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan master paket.");
    } finally {
      setSaving(false);
    }
  };
  const remove = async (packageId: string) => {
    try {
      const data = await apiFetch<{ packages: PackageRow[]; customGoods: string[] }>("/api/packages", apiJson("DELETE", { id: packageId }));
      setPackages(data.packages);
      setCustomGoods(data.customGoods);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus master paket.");
    }
  };
  return (
    <>
      <Heading
        title="Manajemen Data Paket Laundry"
        description="Kelola template inventaris yang digunakan saat onboarding outlet."
        action={
          <Button onClick={openNew}>
            <Plus />
            Tambah Paket Baru
          </Button>
        }
      />
      <ErrorText error={error} />
      {loading && <p className="mb-4 text-sm text-muted-foreground">Memuat master paket...</p>}
      <div className="grid gap-5 lg:grid-cols-3">
        {packages.map((item) => (
          <Card key={item.name} className="flex min-h-[360px] flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{item.name}</CardTitle>
                <Badge variant="secondary">{item.items.length} item</Badge>
              </div>
              <CardDescription>
                {item.description || "Belum ada deskripsi."}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-4">
              <div className="max-h-52 overflow-y-auto rounded-lg border p-2">
                <ul className="flex flex-col gap-2 text-sm">
                  {item.items.map((row, index) => (
                    <li
                      key={`${row.name}-${index}`}
                      className="flex items-center justify-between rounded-md bg-muted/60 px-3 py-2"
                    >
                      <span className="truncate">
                        {row.qty}x {row.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Qty {row.qty}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-auto flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => openEdit(item)}
                >
                  <Pencil />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => remove(item.id)}
                >
                  <Trash2 />
                  Hapus
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          setOpen(value);
          if (!value) resetForm();
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Form Master Paket</DialogTitle>
            <DialogDescription>
              Tambahkan paket dan pilih barang dari Master Barang.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <Field label="Nama Paket">
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Contoh: Titanium"
              />
            </Field>
            <Field label="Deskripsi Singkat (Opsional)">
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Deskripsi paket"
              />
            </Field>
            <div className="rounded-xl border p-4">
              <p className="mb-3 text-sm font-semibold">
                Tambah barang ke paket
              </p>
              <div className="grid gap-2 sm:grid-cols-[1fr_90px_auto]">
                <Select
                  value={itemName}
                  onValueChange={(value) => setItemName(value || "")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Barang" />
                  </SelectTrigger>
                  <SelectContent>
                    {goods.map((good) => (
                      <SelectItem key={good} value={good}>
                        {good}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min={1}
                  value={qty}
                  onChange={(event) =>
                    setQty(Math.max(1, Number(event.target.value) || 1))
                  }
                  aria-label="Qty barang"
                />
                <Button type="button" onClick={addItem}>
                  <Plus />
                  Tambah
                </Button>
              </div>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <Input
                  value={customGoodName}
                  onChange={(event) => setCustomGoodName(event.target.value)}
                  placeholder="Nama barang custom"
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addCustomGood();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addCustomGood} disabled={!customGoodName.trim()}>
                  <Plus />
                  Tambah ke Master Barang
                </Button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Barang custom akan tersimpan saat paket disimpan.
              </p>
            </div>
            <div className="rounded-xl border">
              <div className="grid grid-cols-[1fr_80px_40px] border-b px-3 py-2 text-xs font-semibold text-muted-foreground">
                <span>Nama Barang</span>
                <span>Qty</span>
                <span />
              </div>
              <div className="max-h-48 overflow-y-auto">
                {items.length ? (
                  items.map((row, index) => (
                    <div
                      key={`${row.name}-${index}`}
                      className="grid grid-cols-[1fr_80px_40px] items-center border-b px-3 py-2 text-sm last:border-0"
                    >
                      <span>{row.name}</span>
                      <span>{row.qty}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setItems((current) =>
                            current.filter(
                              (_, itemIndex) => itemIndex !== index,
                            ),
                          )
                        }
                        aria-label={`Hapus ${row.name}`}
                      >
                        <X />
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="p-4 text-sm text-muted-foreground">
                    Belum ada barang dalam paket.
                  </p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button onClick={save} disabled={!name.trim() || !items.length || saving}>
              {saving ? "Menyimpan..." : "Simpan Paket"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
function Vendors() {
  const [vendors, setVendors] = useState<
    Array<{
      id: string;
      name: string;
      category: string;
      contact?: { name?: string; phone?: string; email?: string; notes?: string };
    }>
  >([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<(typeof vendors)[number] | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    category: "",
    contactName: "",
    phone: "",
    email: "",
    notes: "",
  });
  const load = () =>
    apiFetch<typeof vendors>("/api/vendors")
      .then(setVendors)
      .catch((err) => setError(err.message));
  useEffect(() => {
    load();
  }, []);
  const submit = async () => {
    const name = form.name.trim();
    const category = form.category.trim();
    if (!name || !category) {
      setError("Nama dan kategori vendor wajib diisi.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await apiFetch(
        "/api/vendors",
        apiJson("POST", {
          name,
          category,
          contactName: form.contactName.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          notes: form.notes.trim(),
        }),
      );
      setForm({
        name: "",
        category: "",
        contactName: "",
        phone: "",
        email: "",
        notes: "",
      });
      setOpen(false);
      await load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Vendor gagal ditambahkan.",
      );
    } finally {
      setSaving(false);
    }
  };
  const remove = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/vendors/${deleteTarget.id}`, { method: "DELETE" });
      setDeleteTarget(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Vendor gagal dihapus.");
    } finally {
      setDeleting(false);
    }
  };
  return (
    <>
      <Heading
        title="Master Vendors"
        description="Kelola vendor renovasi, furniture, signage, dan kebutuhan outlet."
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus />
            Tambah Vendor
          </Button>
        }
      />
      <ErrorText error={error} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {vendors.map((vendor) => (
          <Card key={vendor.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-base">{vendor.name}</CardTitle>
                  <CardDescription>{vendor.category}</CardDescription>
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => setDeleteTarget(vendor)}
                  aria-label={`Hapus vendor ${vendor.name}`}
                >
                  <Trash2 />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>{vendor.contact?.name || "Contact person belum diisi"}</p>
              <p>{vendor.contact?.phone || "Telepon belum diisi"}</p>
              <p>{vendor.contact?.email || "Email belum diisi"}</p>
              {vendor.contact?.notes && <p>{vendor.contact.notes}</p>}
            </CardContent>
          </Card>
        ))}
      </div>
      {vendors.length === 0 && (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Belum ada vendor. Tambahkan vendor pertama.
          </CardContent>
        </Card>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Vendor</DialogTitle>
            <DialogDescription>
              Masukkan informasi vendor baru untuk digunakan pada project.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <Field label="Nama vendor">
              <Input
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
                placeholder="Contoh: CV Maju Jaya"
              />
            </Field>
            <Field label="Kategori">
              <Select
                value={form.category}
                onValueChange={(value) => setForm({ ...form, category: value || "" })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih kategori vendor" />
                </SelectTrigger>
                <SelectContent>
                  {vendorCategories.map((category) => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Contact person (opsional)">
              <Input
                value={form.contactName}
                onChange={(event) =>
                  setForm({ ...form, contactName: event.target.value })
                }
                placeholder="Nama PIC vendor"
              />
            </Field>
            <Field label="Nomor telepon">
              <Input
                value={form.phone}
                onChange={(event) =>
                  setForm({ ...form, phone: event.target.value })
                }
              />
            </Field>
            <Field label="Email">
              <Input
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm({ ...form, email: event.target.value })
                }
              />
            </Field>
            <Field label="Catatan">
              <Textarea
                value={form.notes}
                onChange={(event) =>
                  setForm({ ...form, notes: event.target.value })
                }
              />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button onClick={submit} disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan Vendor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <DeleteConfirmationDialog
        open={Boolean(deleteTarget)}
        itemName={deleteTarget?.name || "vendor"}
        itemType="vendor"
        saving={deleting}
        onOpenChange={(value) => !value && setDeleteTarget(null)}
        onConfirm={remove}
      />
    </>
  );
}
export default function Page() {
  const router = useRouter();
  const [view, setView] = useState<View>("dashboard");
  const [projectId, setProjectId] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [helpOpen, setHelpOpen] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  useEffect(() => {
    const supabase = createSupabaseClient();
    let timer: number | undefined;
    supabase.auth
      .getUser()
      .then(async ({ data }) => {
        if (!data.user) router.replace("/login");
        else if (!data.user.email_confirmed_at) {
          await supabase.auth.signOut();
          router.replace("/login?error=email_not_confirmed");
        }
        else {
          setAuthChecking(false);
          timer = window.setTimeout(() => setDashboardLoading(false), 3000);
        }
      })
      .catch(() => router.replace("/login"));
    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [router]);
  if (authChecking || dashboardLoading)
    return <LoadingScreen />;
  const content =
    view === "add" ? (
      <AddOutlet
        setView={setView}
        onCreated={() => setRefresh((value) => value + 1)}
      />
    ) : view === "detail" ? (
      <Detail
        projectId={projectId}
        setView={setView}
        onSaved={() => setRefresh((value) => value + 1)}
      />
    ) : view === "documents" ? (
      <DocumentsPage />
    ) : view === "vendors" ? (
      <Vendors />
    ) : view === "packages" ? (
      <MasterPackages />
    ) : view === "soft-opening" ? (
      <SoftOpeningOutlets setView={setView} setProjectId={setProjectId} />
    ) : (
      <Dashboard
        setView={setView}
        setProjectId={setProjectId}
        refresh={refresh}
      />
    );
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="flex min-h-screen">
        <Sidebar view={view} setView={setView} projectId={projectId} onHelp={() => setHelpOpen(true)} />
        <div className="min-w-0 flex-1">
          <Header refresh={refresh} />
          <main id="main-content" className="mx-auto max-w-[1500px] p-5 pb-24 md:p-8 md:pb-8">{content}</main>
        </div>
      </div>
      <HelpDialog open={helpOpen} onOpenChange={setHelpOpen} />
    </div>
  );
}
