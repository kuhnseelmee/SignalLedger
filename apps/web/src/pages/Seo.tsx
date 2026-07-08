import { useEffect } from "react";

type SeoProps = {
  title: string;
  description: string;
};

export default function Seo({ title, description }: SeoProps) {
  useEffect(() => {
    const previousTitle = document.title;
    const metaDescription = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]',
    );
    const previousDescription = metaDescription?.getAttribute("content");

    document.title = title;
    if (metaDescription) {
      metaDescription.setAttribute("content", description);
    }

    return () => {
      document.title = previousTitle;
      if (metaDescription && previousDescription != null) {
        metaDescription.setAttribute("content", previousDescription);
      }
    };
  }, [description, title]);

  return null;
}
