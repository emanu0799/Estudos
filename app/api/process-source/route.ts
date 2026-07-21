import { createClient } from "@supabase/supabase-js";

export const maxDuration = 60;

type StudyMap = {
  title: string;
  summary: string;
  items: Array<{ key: string; title: string; body: string }>;
};

const studyMapSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "summary", "items"],
  properties: {
    title: { type: "string" },
    summary: { type: "string" },
    items: {
      type: "array",
      minItems: 3,
      maxItems: 40,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["key", "title", "body"],
        properties: {
          key: { type: "string" },
          title: { type: "string" },
          body: { type: "string" },
        },
      },
    },
  },
};

export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const authorization = request.headers.get("authorization");

  if (!url || !publishableKey || !openaiKey) return Response.json({ error: "Configuracao do servidor incompleta." }, { status: 500 });
  if (!authorization?.startsWith("Bearer ")) return Response.json({ error: "Sessao ausente." }, { status: 401 });

  const token = authorization.slice(7);
  const adminless = createClient(url, publishableKey);
  const { data: userData, error: userError } = await adminless.auth.getUser(token);
  if (userError || !userData.user) return Response.json({ error: "Sessao invalida." }, { status: 401 });

  const userClient = createClient(url, publishableKey, { global: { headers: { Authorization: authorization } } });
  const body = await request.json().catch(() => null) as { sourceId?: string } | null;
  if (!body?.sourceId) return Response.json({ error: "Fonte ausente." }, { status: 400 });

  const { data: source, error: sourceError } = await userClient
    .from("sources")
    .select("id, title, storage_path, original_filename")
    .eq("id", body.sourceId)
    .single();
  if (sourceError || !source?.storage_path) return Response.json({ error: "Fonte nao encontrada." }, { status: 404 });

  await userClient.from("sources").update({ processing_status: "extracting", extraction_error: null }).eq("id", source.id);
  await userClient.from("source_processing_jobs").update({ status: "processing" }).eq("source_id", source.id);

  try {
    const { data: signed, error: signedError } = await userClient.storage.from("study-materials").createSignedUrl(source.storage_path, 300);
    if (signedError || !signed?.signedUrl) throw new Error("Nao foi possivel acessar o arquivo privado.");

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${openaiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-5.6",
        instructions: "Voce organiza materiais de estudo em portugues do Brasil. Use somente o arquivo fornecido. Nao invente regras, datas ou referencias. Produza um mapa fiel com topicos que conservem a referencia interna quando ela existir. Os itens serao usados para revisao e criacao posterior de questoes; escreva conteudo objetivo e verificavel.",
        input: [{ role: "user", content: [
          { type: "input_text", text: "Extraia uma visao geral e os principais itens de estudo deste arquivo. Para leis, priorize artigos, capitulos e regras; para materiais de curso, priorize conceitos, definicoes, formulas e procedimentos." },
          { type: "input_file", file_url: signed.signedUrl, filename: source.original_filename || source.title },
        ] }],
        text: { format: { type: "json_schema", name: "study_map", strict: true, schema: studyMapSchema } },
      }),
    });
    if (!response.ok) throw new Error(`A IA retornou erro ${response.status}.`);
    const output = await response.json() as { output_text?: string };
    if (!output.output_text) throw new Error("A IA nao retornou conteudo estruturado.");
    const map = JSON.parse(output.output_text) as StudyMap;

    await userClient.from("study_items").delete().eq("source_id", source.id);
    const items = [
      { source_id: source.id, external_key: "overview", title: map.title, body: map.summary },
      ...map.items.map((item, index) => ({ source_id: source.id, external_key: item.key || `item-${index + 1}`, title: item.title, body: item.body })),
    ];
    const { error: insertError } = await userClient.from("study_items").insert(items);
    if (insertError) throw new Error("Nao foi possivel salvar o mapa de estudo.");

    await userClient.from("sources").update({ processing_status: "ready", extracted_at: new Date().toISOString(), extraction_error: null }).eq("id", source.id);
    await userClient.from("source_processing_jobs").update({ status: "completed", completed_at: new Date().toISOString(), error_message: null }).eq("source_id", source.id);
    return Response.json({ ok: true, items: items.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao organizar a fonte.";
    await userClient.from("sources").update({ processing_status: "failed", extraction_error: message }).eq("id", source.id);
    await userClient.from("source_processing_jobs").update({ status: "failed", error_message: message }).eq("source_id", source.id);
    return Response.json({ error: message }, { status: 500 });
  }
}
