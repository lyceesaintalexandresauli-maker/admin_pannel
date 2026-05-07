import { useParams } from "react-router-dom";
import Seo from "../components/Seo";
import { useEffect, useState } from "react";
import { api } from "../api/client";

export default function ContentPage() {
  const { slug } = useParams();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/content/${slug}`);
        setContent(response.data);
      } catch (err) {
        setError("Content not found");
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchContent();
    }
  }, [slug]);

  if (loading) {
    return (
      <main className="main">
        <div className="container section-pad">
          <p>Loading...</p>
        </div>
      </main>
    );
  }

  if (error || !content) {
    return (
      <main className="main">
        <Seo title="Content Not Found" path={`/${slug}`} />
        <div className="container section-pad">
          <h1>Content Not Found</h1>
          <p>The page you are looking for does not exist.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="main">
      <Seo title={content.title || "Content"} description={content.description || ""} path={`/${slug}`} />

      <div className="page-title" data-aos="fade">
        <div className="heading">
          <div className="container">
            <div className="row d-flex justify-content-center text-center">
              <div className="col-lg-8">
                <h1>{content.title}</h1>
                {content.subtitle && <p className="mb-0">{content.subtitle}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="section py-5">
        <div className="container">
          <div className="row justify-content-center" data-aos="fade-up">
            <div className="col-lg-10">
              <div dangerouslySetInnerHTML={{ __html: content.body }} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
