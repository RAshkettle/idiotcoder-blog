import { getArticleData } from "@/lib/articles";

const Article = async ({ params }: { params: { slug: string } }) => {
  const articleData = await getArticleData(params.slug);

  return (
    <>
      <article dangerouslySetInnerHTML={{ __html: articleData.contentHtml }} />
    </>
  );
};

export default Article;
