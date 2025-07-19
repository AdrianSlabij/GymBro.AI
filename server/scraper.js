import axios from "axios";
import { parseStringPromise } from "xml2js";
import { addDocumentToVectorStore } from "./embeddings.js";

const PUBMED_API = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/";

// ✅ Search PubMed
export async function searchPubMed(query, maxResults = 5) {
  const url = `${PUBMED_API}esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${maxResults}&retmode=json`;
  const { data } = await axios.get(url);
  return data.esearchresult.idlist;
}

// ✅ Get abstract & metadata
export async function fetchSummary(id) {
  const url = `${PUBMED_API}efetch.fcgi?db=pubmed&id=${id}&retmode=xml`;
  const { data } = await axios.get(url);
  const parsed = await parseStringPromise(data);
  const article = parsed.PubmedArticleSet.PubmedArticle[0];

  const title = article.MedlineCitation[0].Article[0].ArticleTitle[0];
  const abstract = article.MedlineCitation[0].Article[0].Abstract?.[0]?.AbstractText?.join(" ") || "";
  return { id, title, abstract };
}

// ✅ Try fetching full text from PMC
export async function fetchPMCFullText(pmid) {
  try {
    const url = `https://www.ncbi.nlm.nih.gov/pmc/oai/oai.cgi?verb=GetRecord&identifier=oai:pubmed:${pmid}&metadataPrefix=pmc`;
    const { data } = await axios.get(url);
    const parsed = await parseStringPromise(data);

    const article = parsed?.OAI_PMH?.GetRecord?.[0]?.record?.[0]?.metadata?.[0]?.article?.[0];
    if (!article) return null;

    // Extract paragraphs
    const sections = article.body?.[0]?.sec || [];
    const paragraphs = sections.flatMap(sec => (sec.p || []).map(p => (typeof p === "string" ? p : p._)));
    return paragraphs.join("\n\n");
  } catch {
    return null;
  }
}

// ✅ Fetch, combine, store in Vector DB
export async function scrapeAndStore(query) {
  const ids = await searchPubMed(query, 5);

  for (const id of ids) {
    const summary = await fetchSummary(id);
    const fullText = await fetchPMCFullText(id);
    const content = fullText || summary.abstract;

    if (!content) continue;

    await addDocumentToVectorStore({
      content,
      source: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
      id
    });

    console.log(`Stored: ${summary.title} (${fullText ? "Full text" : "Abstract"})`);
  }
}
