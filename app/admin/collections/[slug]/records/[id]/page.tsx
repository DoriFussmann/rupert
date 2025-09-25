import StructureEditor from "./StructureEditor";

type Props = {
  params: { slug: string; id: string };
};

export default function RecordEditPage({ params }: Props) {
  const { slug, id } = params;

  // Conditional render based on collection slug
  if (slug === "structures") {
    return <StructureEditor recordId={id} />;
  }

  // Generic editor fallback
  return (
    <div className="p-6">
      <h1 className="text-2xl mb-4">Edit {slug} Record</h1>
      <p>Generic editor for collection: {slug}</p>
      <p>Record ID: {id}</p>
    </div>
  );
}
