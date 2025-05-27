import CommanderProfile from "@/components/commander-profile";
import Tags from "@/components/tags";
import {
  getArticlesByType,
  getFirstWords,
  getSortedArticles,
} from "@/lib/articles";
import fs from "fs";
import matter from "gray-matter";
import { Calendar, ChevronRight, Gamepad2, Tag, User } from "lucide-react";
import Link from "next/link";
import path from "path";

export default function Home() {
  const sortedArticles = getSortedArticles();
  const groupedArticles = getArticlesByType();
  const articleCount = sortedArticles.length;

  const featuredPost = sortedArticles[0];
  const nextPosts = [sortedArticles[1], sortedArticles[2]].filter(Boolean);
  const placeholders = ["baseAtt.webp", "tanks.webp"];

  // Get preview for featured post
  const getFeaturedPreview = () => {
    try {
      const fullPath = path.join(
        process.cwd(),
        "articles",
        `${featuredPost.id}.md`
      );
      const fileContents = fs.readFileSync(fullPath, "utf-8");
      const matterResult = matter(fileContents);
      return getFirstWords(matterResult.content, 20);
    } catch (error) {
      return "Mission briefing unavailable...";
    }
  };

  // Get previews for next posts
  const nextPostsWithPreview = nextPosts.map((post) => {
    try {
      const fullPath = path.join(process.cwd(), "articles", `${post.id}.md`);
      const fileContents = fs.readFileSync(fullPath, "utf-8");
      const matterResult = matter(fileContents);
      const preview = getFirstWords(matterResult.content, 20);

      return {
        ...post,
        preview,
      };
    } catch (error) {
      return {
        ...post,
        preview: "Preview unavailable...",
      };
    }
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* Main content area */}
      <div className="md:col-span-3">
        {/* Resources bar - RTS style */}
        <div className="rts-resource-bar mb-6 flex justify-between items-center">
          <div className="rts-resource flex items-center gap-2">
            <div className="rts-resource-icon w-8 h-8 flex items-center justify-center">
              <span className="text-yellow-400">⚙️</span>
            </div>
            <span className="text-yellow-400">POSTS: {articleCount}</span>
          </div>
          <div className="rts-resource flex items-center gap-2">
            <div className="rts-resource-icon w-8 h-8 flex items-center justify-center">
              <span className="text-green-400">🏆</span>
            </div>
            <span className="text-green-400">JAMS: 0</span>
          </div>
          <div className="rts-resource flex items-center gap-2">
            <div className="rts-resource-icon w-8 h-8 flex items-center justify-center">
              <span className="text-blue-400">💾</span>
            </div>
            <span className="text-blue-400">PROJECTS: 0</span>
          </div>
        </div>

        {/* Featured post - RTS panel style */}
        {/* For this panel, we will use the most recent post of any kind...     */}
        <div className="rts-panel mb-6">
          <div className="rts-panel-header px-3 py-1">
            <h2 className="text-lg font-bold text-amber-400">
              MISSION_BRIEFING
            </h2>
          </div>
          <div className="rts-panel-inner p-4">
            <article>
              <h3 className="text-xl font-bold mb-2 text-amber-300">
                {featuredPost.title}
              </h3>
              <div className="flex items-center gap-4 text-xs text-amber-400/70 mb-4">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {featuredPost.date}
                </span>
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" /> COMMANDER
                </span>
                <span className="flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  {featuredPost.categories.map((category) => {
                    return category + " ";
                  })}
                </span>
              </div>
              <div className="relative aspect-video mb-4 rts-screen overflow-hidden local-scanlines">
                <img
                  src="rts.webp"
                  alt="Pixel Panic Game Screenshot"
                  className="w-full h-full object-cover z-10 relative"
                />
              </div>
              <p className="mb-4 leading-relaxed text-amber-100">
                &gt; {getFeaturedPreview()}
              </p>
              <div className="flex justify-end">
                <Link
                  href={`/${featuredPost.id}`}
                  className="rts-button px-4 py-2 inline-flex items-center gap-2"
                >
                  FULL_REPORT <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </article>
          </div>
        </div>

        {/* Recent posts - RTS panel style */}
        <div className="rts-panel">
          <div className="rts-panel-header px-3 py-1">
            <h2 className="text-lg font-bold text-amber-400">
              INTELLIGENCE_ARCHIVE
            </h2>
          </div>
          <div className="rts-panel-inner p-4">
            <div className="grid gap-6">
              {nextPostsWithPreview.map((post, index) => (
                <article key={post.title} className="grid md:grid-cols-4 gap-4">
                  <div className="rts-screen aspect-video md:aspect-square overflow-hidden local-scanlines">
                    <img
                      src={placeholders[index]}
                      alt={`Post ${post.title} thumbnail`}
                      className="w-full h-full object-cover z-10 relative"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <h3 className="text-lg font-bold mb-2 text-amber-300">
                      {post.title}
                    </h3>
                    <div className="flex items-center gap-4 text-xs text-amber-400/70 mb-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {post.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        {post.article_type}
                      </span>
                    </div>
                    <p className="text-amber-100 mb-2 leading-relaxed">
                      &gt; {post.preview}
                    </p>
                    <Link
                      href={`/${post.id}`}
                      className="rts-button-small px-2 py-1 inline-flex items-center gap-1"
                    >
                      ACCESS <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar - RTS style */}
      <div className="md:col-span-1">
        {/* Mini-map style about section */}
        <CommanderProfile />

        {/* Game jams section */}
        <div className="rts-panel mb-6">
          <div className="rts-panel-header px-3 py-1">
            <h2 className="text-lg font-bold text-amber-400">BATTLE_RECORDS</h2>
          </div>
          <div className="rts-panel-inner p-4">
            <ul className="space-y-3">
              <li className="flex items-center gap-2">
                <div className="rts-button-square w-6 h-6 flex items-center justify-center">
                  <Gamepad2 className="w-3 h-3 text-amber-400" />
                </div>
                <span className="text-sm text-amber-100">Ludum Dare 54</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="rts-button-square w-6 h-6 flex items-center justify-center">
                  <Gamepad2 className="w-3 h-3 text-amber-400" />
                </div>
                <span className="text-sm text-amber-100">
                  Global Game Jam 2023
                </span>
              </li>
              <li className="flex items-center gap-2">
                <div className="rts-button-square w-6 h-6 flex items-center justify-center">
                  <Gamepad2 className="w-3 h-3 text-amber-400" />
                </div>
                <span className="text-sm text-amber-100">js13kGames 2022</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="rts-button-square w-6 h-6 flex items-center justify-center">
                  <Gamepad2 className="w-3 h-3 text-amber-400" />
                </div>
                <span className="text-sm text-amber-100">
                  GMTK Game Jam 2022
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Tags section */}
        <Tags />
      </div>
    </div>
  );
}
