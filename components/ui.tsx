import Link from "next/link";
import { Report, Tone } from "@/lib/mock-data";

export function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="section-title">
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}

export function StatusPill({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: Tone;
}) {
  return <span className={`status-pill tone-${tone}`}>{children}</span>;
}

export function MetricCard({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  tone: Tone;
}) {
  return (
    <article className="metric-card">
      <div className="card-row">
        <span className="label">{label}</span>
        <StatusPill tone={tone}>{detail}</StatusPill>
      </div>
      <strong>{value}</strong>
    </article>
  );
}

export function ReportCard({ report }: { report: Report }) {
  return (
    <article className="report-card">
      <div className="card-row">
        <div>
          <span className="label">{report.folio}</span>
          <h3>{report.branch}</h3>
        </div>
        <StatusPill tone={report.tone}>{report.status}</StatusPill>
      </div>
      <p>{report.summary}</p>
      <div className="report-meta">
        <span>{report.client}</span>
        <span>{report.technician}</span>
        <span>{report.timeRange}</span>
      </div>
      <div className="card-row">
        <div className="inline-tags">
          {report.pending.slice(0, 2).map((item) => (
            <span key={item} className="inline-chip">
              {item}
            </span>
          ))}
        </div>
        <Link className="text-link" href={`/reporte/${report.id}`}>
          Abrir acta
        </Link>
      </div>
    </article>
  );
}
