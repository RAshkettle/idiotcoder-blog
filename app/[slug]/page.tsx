import { getArticleData } from "@/lib/articles";

const Article = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;
  const articleData = await getArticleData(slug);

  return (
    <div id="content">
      <article dangerouslySetInnerHTML={{ __html: articleData.contentHtml }} />
    </div>
  );
};

export default Article;
