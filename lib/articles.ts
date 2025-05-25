import type { ArticleItem } from "@/types";
import fs from "fs";
import matter from "gray-matter";
import moment from "moment";
import path from "path";
import { remark } from "remark";
import html from "remark-html";

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

    let matterResult;

    // Check if this is a VSCode notebook file
    if (fileContents.includes("<VSCode.Cell")) {
      // Parse notebook file - extract frontmatter from first cell
      const firstCellMatch = fileContents.match(
        /<VSCode\.Cell[^>]*language="markdown"[^>]*>([\s\S]*?)<\/VSCode\.Cell>/
      );

      if (firstCellMatch) {
        const firstCellContent = firstCellMatch[1].trim();

        // Check if first cell contains frontmatter-like content
        if (
          firstCellContent.includes("title:") &&
          firstCellContent.includes("date:")
        ) {
          // Add YAML frontmatter delimiters if missing
          const frontmatterContent = firstCellContent.startsWith("---")
            ? firstCellContent
            : `---\n${firstCellContent}\n---`;

          matterResult = matter(frontmatterContent);
        } else {
          // Fallback for notebook without proper frontmatter
          matterResult = {
            data: {
              title: id
                .replace(/-/g, " ")
                .replace(/\b\w/g, (l) => l.toUpperCase()),
              date: "01-01-2024",
              categories: ["misc"],
              article_type: "misc",
            },
            content: fileContents,
          };
        }
      } else {
        // Fallback if no markdown cells found
        matterResult = {
          data: {
            title: id
              .replace(/-/g, " ")
              .replace(/\b\w/g, (l) => l.toUpperCase()),
            date: "01-01-2024",
            categories: ["misc"],
            article_type: "misc",
          },
          content: fileContents,
        };
      }
    } else {
      // Regular markdown file
      matterResult = matter(fileContents);
    }

    return {
      id,
      title: matterResult.data.title,
      date: matterResult.data.date,
      categories: matterResult.data.categories,
      article_type: matterResult.data.article_type,
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
  const matterResult = matter(fileContents);

  const processedContent = await remark()
    .use(html)
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
