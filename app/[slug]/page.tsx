import { getArticleData } from "@/lib/articles";

const Article = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;
  const articleData = await getArticleData(slug);

  return (
    <>
      <article dangerouslySetInnerHTML={{ __html: articleData.contentHtml }} />
    </>
  );
};

export default Article;
