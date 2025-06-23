import { getReportData, getSortedReports } from "@/lib/reports";
import { Calendar, Tag, User } from "lucide-react";
import { notFound } from "next/navigation";

type Props = {
  params: { slug: string };
};

export async function generateStaticParams() {
  const reports = getSortedReports();
  return reports.map((report) => ({
    slug: report.id,
  }));
}

export default async function ReportPage({ params }: Props) {
  try {
    const report = await getReportData(params.slug);

    return (
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="rts-panel mb-6">
          <div className="rts-panel-header px-3 py-1">
            <h1 className="text-2xl font-bold text-amber-400">JAM_REPORT</h1>
          </div>
          <div className="rts-panel-inner p-4">
            <h2 className="text-3xl font-bold mb-4 text-amber-300">
              {report.title}
            </h2>
            <div className="flex items-center gap-4 text-sm text-amber-400/70 mb-4">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" /> {report.date}
              </span>
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" /> COMMANDER
              </span>
              {report.categories.length > 0 && (
                <span className="flex items-center gap-1">
                  <Tag className="w-4 h-4" />
                  {report.categories.join(", ")}
                </span>
              )}
            </div>
            {report.image && (
              <div className="relative mb-4 rts-screen local-scanlines">
                <img
                  src={`/${report.image}`}
                  alt={`${report.title} screenshot`}
                  className="w-full h-auto object-contain z-10 relative"
                />
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="rts-panel">
          <div className="rts-panel-header px-3 py-1">
            <h3 className="text-lg font-bold text-amber-400">MISSION_REPORT</h3>
          </div>
          <div className="rts-panel-inner p-4">
            <div
              id="content"
              className="prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: report.contentHtml }}
            />
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error loading report:", error);
    notFound();
  }
}
