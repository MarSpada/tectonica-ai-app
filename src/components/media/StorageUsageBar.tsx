"use client";

interface StorageUsageBarProps {
  usedBytes: number;
  totalBytes: number;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 MB";
  const mb = bytes / (1024 * 1024);
  if (mb < 1) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${mb.toFixed(1)} MB`;
}

export default function StorageUsageBar({ usedBytes, totalBytes }: StorageUsageBarProps) {
  const pct = totalBytes > 0 ? Math.min(100, (usedBytes / totalBytes) * 100) : 0;
  const isNearLimit = pct >= 90;

  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden max-w-48">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            backgroundColor: isNearLimit
              ? "var(--widget-bg-fundraising)"
              : "var(--widget-bg-recruitment-goal)",
          }}
        />
      </div>
      <span className="whitespace-nowrap font-medium">
        {formatBytes(usedBytes)} used of {formatBytes(totalBytes)}
      </span>
    </div>
  );
}
