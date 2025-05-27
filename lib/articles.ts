import type { ArticleItem } from "@/types";
import fs from "fs";
import matter from "gray-matter";
import moment from "moment";
import path from "path";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";
import { remark } from "remark";
import remarkRehype from "remark-rehype";

const articlesDirectory = path.join(process.cwd(), "articles");

export const getSortedArticles = (): ArticleItem[] => {
  // Check if articles directory exists
  if (!fs.existsSync(articlesDirectory)) {
    console.warn("Articles directory does not exist:", articlesDirectory);
    return [];
  }

  const fileNames = fs.readdirSync(articlesDirectory);

  // Filter for only .md files
  const mdFiles = fileNames.filter((name) => name.endsWith(".md"));

  if (mdFiles.length === 0) {
    console.warn("No markdown files found in articles directory");
    return [];
  }

  const allArticleData = mdFiles.map((filename) => {
    const id = filename.replace(/\.md$/, "");
    const fullPath = path.join(articlesDirectory, filename);
    const fileContents = fs.readFileSync(fullPath, "utf-8");

    // Only process regular markdown files
    const matterResult = matter(fileContents);

    // Ensure categories is always an array
    let categories =
      (matterResult.data as any).categories ||
      (matterResult.data as any).category ||
      [];
    if (typeof categories === "string") {
      categories = [categories];
    }

    return {
      id,
      title: matterResult.data.title || id,
      date: matterResult.data.date || "01-01-2024",
      categories: categories,
      article_type: matterResult.data.article_type || "misc",
    };
  });
  return allArticleData.sort((a, b) => {
    const format = "MM-DD-YYYY";
    const dateOne = moment(a.date, format);
    const dateTwo = moment(b.date, format);
    return dateTwo.valueOf() - dateOne.valueOf();
  });
};
export const getArticlesByType = (): Record<string, ArticleItem[]> => {
  const sortedArticles = getSortedArticles();
  const typedArticles: Record<string, ArticleItem[]> = {};

  sortedArticles.forEach((article) => {
    if (!typedArticles[article.article_type]) {
      typedArticles[article.article_type] = [];
    }
    typedArticles[article.article_type].push(article);
  });

  return typedArticles;
};

export const getArticleData = async (id: string) => {
  const fullPath = path.join(articlesDirectory, `${id}.md`);
  const fileContents = fs.readFileSync(fullPath, "utf-8");

  // Parse the frontmatter and content
  const matterResult = matter(fileContents);

  // Process only the content (without frontmatter)
  const processedContent = await remark()
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeHighlight)
    .use(rehypeStringify)
    .process(matterResult.content);

  const contentHtml = processedContent.toString();

  return {
    id,
    contentHtml,
    title: matterResult.data.title,
    date: moment(matterResult.data.date, "MM-DD-YYYY").format("MMMM Do YYYY"),
    article_type: matterResult.data.article_type,
    categories: matterResult.data.categories,
  };
};

// Helper function to get first 20 words from content
export const getFirstWords = (
  content: string,
  wordCount: number = 20
): string => {
  // Remove markdown images and replace with [img]
  const contentWithImagePlaceholders = content.replace(
    /!\[.*?\]\(.*?\)/g,
    "[img]"
  );

  // Remove other markdown formatting
  const plainText = contentWithImagePlaceholders
    .replace(/#{1,6}\s/g, "") // Remove headers
    .replace(/\*\*(.*?)\*\*/g, "$1") // Remove bold
    .replace(/\*(.*?)\*/g, "$1") // Remove italic
    .replace(/`(.*?)`/g, "$1") // Remove inline code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Remove links, keep text
    .replace(/^\s*[-*+]\s+/gm, "") // Remove list markers
    .replace(/^\s*\d+\.\s+/gm, "") // Remove numbered list markers
    .replace(/\n+/g, " ") // Replace newlines with spaces
    .trim();

  const words = plainText.split(/\s+/).filter((word) => word.length > 0);
  return (
    words.slice(0, wordCount).join(" ") +
    (words.length > wordCount ? "..." : "")
  );
};
