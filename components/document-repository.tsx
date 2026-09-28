"use client";

import { useRef, useState } from "react";
import { ArrowUpRight, CalendarDays, FileImage, FileText, FileType2, FolderOpen, Plus, Search, Upload, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "cn";

export type RepositoryDocument = {
  id: string;
  name: string;
  type: string;
  uploadedAt: string;
  size: number;
  href?: string;
};

type DocumentRepositoryProps = {
  projectName: string;
  documents?: RepositoryDocument[];
  onUpload?: (file: File) => void | Promise<void>;
  className?: string;
};

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileLabel(type: string, name: string) {
  if (type.includes("pdf") || name.toLowerCase().endsWith(".pdf")) return "PDF";
  if (type.startsWith("image/")) return "Gambar";
  if (type.includes("spreadsheet") || /\.(csv|xls|xlsx)$/i.test(name)) return "Spreadsheet";
  if (type.includes("word") || /\.(doc|docx)$/i.test(name)) return "Dokumen";
  return "File";
}

function getFileIcon(type: string, name: string) {
  const label = getFileLabel(type, name);
  if (label === "PDF" || label === "Dokumen") return FileText;
  if (label === "Gambar") return FileImage;
  if (label === "Spreadsheet") return FileType2;
  return FileType2;
}

function formatUploadedDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function DocumentRepository({
  projectName,
  documents = [],
  onUpload,
  className,
}: DocumentRepositoryProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "documents" | "images" | "spreadsheets">("all");

  const counts = {
    all: documents.length,
    documents: documents.filter((document) => !["Gambar", "Spreadsheet"].includes(getFileLabel(document.type, document.name))).length,
    images: documents.filter((document) => getFileLabel(document.type, document.name) === "Gambar").length,
    spreadsheets: documents.filter((document) => getFileLabel(document.type, document.name) === "Spreadsheet").length,
  };
  const filters = [
    { id: "all" as const, label: "Semua" },
    { id: "documents" as const, label: "Dokumen" },
    { id: "images" as const, label: "Gambar" },
    { id: "spreadsheets" as const, label: "Spreadsheet" },
  ];
  const visibleDocuments = documents.filter((document) => {
    const label = getFileLabel(document.type, document.name);
    const matchesFilter = activeFilter === "all"
      || (activeFilter === "images" && label === "Gambar")
      || (activeFilter === "spreadsheets" && label === "Spreadsheet")
      || (activeFilter === "documents" && !["Gambar", "Spreadsheet"].includes(label));
    return matchesFilter && document.name.toLocaleLowerCase("id-ID").includes(searchQuery.trim().toLocaleLowerCase("id-ID"));
  });

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !onUpload) return;

    setIsUploading(true);
    try {
      await onUpload(file);
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  return (
    <section className={cn("min-h-full text-foreground", className)}>
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <FolderOpen className="size-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Repository dokumen</h1>
              <p className="mt-1 truncate text-sm text-muted-foreground">{projectName}</p>
            </div>
          </div>
          <input
            ref={inputRef}
            type="file"
            className="sr-only"
            onChange={handleFileChange}
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv"
          />
          <Button
            type="button"
            className="w-full sm:w-auto"
            onClick={() => inputRef.current?.click()}
            disabled={!onUpload || isUploading}
          >
            <Upload />
            {isUploading ? "Mengunggah..." : "Unggah dokumen"}
          </Button>
        </header>

        <div className="mt-5 flex flex-col gap-4 border-b border-border pb-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-baseline gap-2">
              <h2 className="text-sm font-semibold">Semua file</h2>
              <span className="text-xs tabular-nums text-muted-foreground">{documents.length}</span>
            </div>
            <div className="mt-3 flex max-w-full gap-1 overflow-x-auto" role="group" aria-label="Filter jenis file">
              {filters.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  aria-pressed={activeFilter === filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition-colors",
                    activeFilter === filter.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {filter.label}
                  <span className={cn("tabular-nums", activeFilter === filter.id ? "text-primary-foreground/75" : "text-muted-foreground/75")}>
                    {counts[filter.id]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <label className="relative block w-full lg:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Cari nama file"
              aria-label="Cari nama file"
              className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-9 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery("")} aria-label="Hapus pencarian" className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
                <X className="size-4" />
              </button>
            )}
          </label>
        </div>

        {visibleDocuments.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
            <div className="grid size-12 place-items-center rounded-xl bg-muted text-muted-foreground">
              {documents.length === 0 ? <FolderOpen className="size-5" aria-hidden="true" /> : <Search className="size-5" aria-hidden="true" />}
            </div>
            <h3 className="mt-4 text-sm font-semibold">
              {documents.length === 0 ? "Belum ada dokumen" : "Dokumen tidak ditemukan"}
            </h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              {documents.length === 0
                ? `Unggah file pertama untuk arsip ${projectName}.`
                : "Coba kata pencarian atau jenis file yang berbeda."}
            </p>
            {documents.length > 0 && (searchQuery || activeFilter !== "all") && (
              <button type="button" onClick={() => { setSearchQuery(""); setActiveFilter("all"); }} className="mt-3 text-sm font-medium text-primary hover:underline">
                Reset pencarian dan filter
              </button>
            )}
          </div>
        ) : (
          <div className="mt-2 overflow-hidden rounded-lg border border-border bg-card">
            <div className="hidden grid-cols-[minmax(0,1fr)_110px_130px_80px_28px] gap-4 border-b border-border bg-muted/50 px-4 py-2.5 text-xs font-medium text-muted-foreground md:grid">
              <span>Nama file</span>
              <span>Jenis</span>
              <span>Tanggal unggah</span>
              <span>Ukuran</span>
              <span />
            </div>
            <div className="divide-y divide-border">
              {visibleDocuments.map((document) => {
                const Icon = getFileIcon(document.type, document.name);
                const label = getFileLabel(document.type, document.name);
                const uploadedAt = formatUploadedDate(document.uploadedAt);
                const content = (
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 py-3 transition-colors hover:bg-muted/40 sm:px-4 md:grid-cols-[minmax(0,1fr)_110px_130px_80px_28px] md:gap-4 md:py-3.5">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="size-4" aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{document.name}</p>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground md:hidden">
                          <CalendarDays className="size-3.5" aria-hidden="true" />
                          {label} <span aria-hidden="true">·</span> {uploadedAt}
                        </p>
                      </div>
                    </div>
                    <div className="hidden md:block">
                      <Badge variant="outline" className="border-border bg-background text-muted-foreground">{label}</Badge>
                    </div>
                    <span className="hidden text-xs text-muted-foreground md:block">{uploadedAt}</span>
                    <span className="hidden text-xs tabular-nums text-muted-foreground md:block">{formatFileSize(document.size)}</span>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="text-xs md:hidden">{formatFileSize(document.size)}</span>
                      {document.href && <ArrowUpRight className="size-4" aria-hidden="true" />}
                    </div>
                  </div>
                );

                return document.href ? (
                  <a key={document.id} href={document.href} target="_blank" rel="noreferrer" className="block focus-visible:bg-muted/50 focus-visible:outline-none">
                    {content}
                  </a>
                ) : (
                  <div key={document.id}>{content}</div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
