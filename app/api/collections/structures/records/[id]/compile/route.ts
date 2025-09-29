import { NextRequest } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { compileStructureTree } from "@/lib/structureCompiler";

type Ctx = { params: { id: string } };

export async function GET(req: NextRequest, { params }: Ctx) {
  try {
    // Resolve structures collection by slug
    const structuresCollection = await prisma.collection.findUnique({
      where: { slug: "structures" }
    });

    if (!structuresCollection) {
      return new Response(
        JSON.stringify({ error: "Structures collection not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Load record by id + collectionId
    const record = await prisma.record.findFirst({
      where: {
        id: params.id,
        collectionId: structuresCollection.id
      }
    });

    if (!record) {
      return new Response(
        JSON.stringify({ error: "Structure record not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Extract tree from record data
    const recordData = record.data as any;
    const tree = recordData?.tree;

    if (!tree) {
      return new Response(
        JSON.stringify({ error: "No tree data found in record" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Compile the structure tree with new format
    const compileResult = compileStructureTree(tree);

    // Check if save=true query parameter
    const url = new URL(req.url);
    const shouldSave = url.searchParams.get("save") === "true";

    let saved = false;

    if (shouldSave) {
      // Persist compiled result to record.data.compiled
      await prisma.record.update({
        where: { id: record.id },
        data: {
          data: {
            ...recordData,
            compiled: compileResult
          }
        }
      });
      saved = true;
    }

    // Return compile result with metadata
    return Response.json({
      ...compileResult,
      meta: {
        recordId: record.id,
        saved
      }
    });

  } catch (error) {
    console.error("Compile error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
