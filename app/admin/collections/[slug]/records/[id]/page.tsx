"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import NavigationHeader from "../../../../../components/NavigationHeader";

type Props = {
  params: { slug: string; id: string };
};

export default function RecordEditPage({ params }: Props) {
  const { slug, id } = params;
  const router = useRouter();

  useEffect(() => {
    // Create a style element to forcefully hide the layout header
    const styleElement = document.createElement('style');
    styleElement.id = 'hide-layout-header';
    styleElement.textContent = `
      body > header {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        height: 0 !important;
        overflow: hidden !important;
      }
    `;
    document.head.appendChild(styleElement);
    
    return () => {
      // Remove the style element when leaving the page
      const styleElement = document.getElementById('hide-layout-header');
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, []);

  // Redirect structures to admin page (now edited via modal)
  useEffect(() => {
    if (slug === "structures") {
      router.push("/admin");
    }
  }, [slug, router]);

  // Generic editor fallback
  return (
    <>
      <NavigationHeader />
      <div style={{ paddingTop: 'calc(2.25rem + 1rem)' }}>
        <div className="p-6">
          <h1 className="text-2xl mb-4">Edit {slug} Record</h1>
          <p>Generic editor for collection: {slug}</p>
          <p>Record ID: {id}</p>
        </div>
      </div>
    </>
  );
}
