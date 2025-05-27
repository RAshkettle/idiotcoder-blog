import { getArticlesByType, getFirstWords } from "@/lib/articles";
import fs from "fs";
import matter from "gray-matter";
import { Calendar, ChevronRight, Tag } from "lucide-react";
import Link from "next/link";
import path from "path";

const MISCList = () => {
  const groupedArticles = getArticlesByType();
  const MISCs = groupedArticles["MISC"] || [];

  // Get content preview for each MISC
  const MISCsWithPreview = MISCs.map((MISC) => {
    try {
      const fullPath = path.join(process.cwd(), "articles", `${MISC.id}.md`);
      const fileContents = fs.readFileSync(fullPath, "utf-8");
      const matterResult = matter(fileContents);
      const preview = getFirstWords(matterResult.content, 20);

      return {
        ...MISC,
        preview,
      };
    } catch (error) {
      return {
        ...MISC,
        preview: "Preview unavailable...",
      };
    }
  });

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="rts-panel mb-6">
        <div className="rts-panel-header px-3 py-1">
          <h1 className="text-2xl font-bold text-amber-400">
            TACTICAL_MANUALS
          </h1>
        </div>
        <div className="rts-panel-inner p-4">
          <p className="text-amber-100 mb-2">
            &gt; ACCESSING PROGRESSIVE PROTOCOLS...
          </p>
          <p className="text-amber-100">
            &gt; {MISCs.length} COMBAT EFFECTIVENESS ENHANCEMENT MODULES
            AVAILABLE
          </p>
        </div>
      </div>

      {/* MISCs List */}
      <div className="rts-panel">
        <div className="rts-panel-header px-3 py-1">
          <h2 className="text-lg font-bold text-amber-400">AVAILABLE_MISCS</h2>
        </div>
        <div className="rts-panel-inner p-4">
          {MISCsWithPreview.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-amber-100">&gt; NO MISCS AVAILABLE</p>
              <p className="text-amber-400/70 text-sm mt-2">
                Check back later for tactical training modules
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
              {MISCsWithPreview.map((MISC, index) => (
                <article
                  key={MISC.id}
                  className="grid md:grid-cols-4 gap-4 border-b border-amber-900/30 pb-6 last:border-b-0"
                >
                  <div className="rts-screen aspect-video md:aspect-square overflow-hidden local-scanlines">
                    <img
                      src={
                        ["baseAtt.webp", "tanks.webp", "rts.webp"][index % 3]
                      }
                      alt={`${MISC.title} thumbnail`}
                      className="w-full h-full object-cover z-10 relative"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <h3 className="text-xl font-bold mb-3 text-amber-300">
                      {MISC.title}
                    </h3>
                    <div className="flex items-center gap-4 text-xs text-amber-400/70 mb-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {MISC.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        {MISC.categories.join(", ")}
                      </span>
                    </div>
                    <p className="text-amber-100 mb-4 leading-relaxed">
                      &gt; {MISC.preview}
                    </p>
                    <Link
                      href={`/${MISC.id}`}
                      className="rts-button-small px-3 py-2 inline-flex items-center gap-2"
                    >
                      DEPLOY_MISC <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MISCList;
