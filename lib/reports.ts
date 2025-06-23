import type { ReportItem } from "@/types";
import fs from "fs";
import matter from "gray-matter";
import moment from "moment";
import path from "path";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";
import { remark } from "remark";
import remarkRehype from "remark-rehype";

const reportsDirectory = path.join(process.cwd(), "reports");

export const getSortedReports = (): ReportItem[] => {
  // Check if reports directory exists
  if (!fs.existsSync(reportsDirectory)) {
    console.warn("Reports directory does not exist:", reportsDirectory);
    return [];
  }

  const fileNames = fs.readdirSync(reportsDirectory);

  // Filter for only .md files
  const mdFiles = fileNames.filter((name) => name.endsWith(".md"));

  if (mdFiles.length === 0) {
    console.warn("No markdown files found in reports directory");
    return [];
  }

  const allReportData = mdFiles.map((filename) => {
    const id = filename.replace(/\.md$/, "");
    const fullPath = path.join(reportsDirectory, filename);
    const fileContents = fs.readFileSync(fullPath, "utf-8");

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
      article_type: matterResult.data.article_type || "REPORT",
      image: matterResult.data.image || "baseAtt.webp",
    };
  });

  return allReportData.sort((a, b) => {
    const format = "MM-DD-YYYY";
    const dateOne = moment(a.date, format);
    const dateTwo = moment(b.date, format);
    return dateTwo.valueOf() - dateOne.valueOf();
  });
};

export const getReportData = async (id: string) => {
  const fullPath = path.join(reportsDirectory, `${id}.md`);
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
    categories: matterResult.data.categories || [],
    image: matterResult.data.image || "baseAtt.webp",
  };
};

export const getFirstWords = (content: string, wordCount: number): string => {
  const words = content.split(/\s+/);
  return (
    words.slice(0, wordCount).join(" ") +
    (words.length > wordCount ? "..." : "")
  );
};
