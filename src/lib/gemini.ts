import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export interface GeneratedCatalogDraft {
  title: string;
  sku: string;
  seoTitle: string;
  description: string;
  seoTags: string[];
  suggestedPriceCents: number;
  variants: Array<{
    name: string;
    sku: string;
    priceCents: number;
    stock: number;
  }>;
  marketingScript: string;
  translations: {
    en: { title: string; description: string };
    es: { title: string; description: string };
  };
}

export async function generateCatalogDraft(params: {
  sourceInput: string;
  sourceType: 'supplier_url' | 'product_brief';
  targetChannels: string[];
  tone: string;
}): Promise<GeneratedCatalogDraft> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error(
      'Clé API Gemini manquante côté serveur. Vérifiez la configuration des secrets.'
    );
  }

  const channelList =
    params.targetChannels.length > 0
      ? params.targetChannels.join(', ')
      : 'Shopify, WooCommerce, TikTok Shop';

  const prompt = `Tu es un expert en e-commerce multi-canaux, SEO et copywriting de conversion.
Analyse cette source produit (${params.sourceType === 'supplier_url' ? 'lien ou référence fournisseur' : 'brief produit marchand'}) :
"${params.sourceInput}"

Canaux cibles : ${channelList}
Ton éditorial souhaité : ${params.tone || 'Premium, précis et orienté conversion'}

Génère une fiche produit complète prête à être publiée simultanément sur tous les canaux connectés :
1. Un titre commercial clair en français (title), un SKU court standardisé (ex: MH-XXXX-01), un titre SEO optimisé de moins de 65 caractères (seoTitle).
2. Une description persuasive et structurée en français mettant en avant bénéfices, matériaux et garanties (description, ~90 à 130 mots).
3. 6 balises SEO pertinentes (seoTags).
4. Un prix de vente conseillé en centimes d'euro (suggestedPriceCents, entier réaliste, ex: 7900 pour 79,00 EUR).
5. 3 variantes concrètes (variants) avec nom de variante, suffixe SKU complet, prix en centimes et stock initial réaliste.
6. Un script vidéo court (TikTok Shop / Instagram Reels, 30 secondes avec Hook, Démonstration et Call-To-Action) adapté au produit (marketingScript).
7. Des traductions natives fidèles en anglais (en) et espagnol (es) contenant titre et description courte.`;

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: prompt,
    config: {
      systemInstruction:
        'Réponds uniquement en JSON strict conforme au schéma fourni. Langue principale : français naturel et professionnel pour marchands e-commerce européens.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          sku: { type: Type.STRING },
          seoTitle: { type: Type.STRING },
          description: { type: Type.STRING },
          seoTags: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          suggestedPriceCents: { type: Type.INTEGER },
          variants: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                sku: { type: Type.STRING },
                priceCents: { type: Type.INTEGER },
                stock: { type: Type.INTEGER },
              },
              required: ['name', 'sku', 'priceCents', 'stock'],
            },
          },
          marketingScript: { type: Type.STRING },
          translations: {
            type: Type.OBJECT,
            properties: {
              en: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                },
                required: ['title', 'description'],
              },
              es: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                },
                required: ['title', 'description'],
              },
            },
            required: ['en', 'es'],
          },
        },
        required: [
          'title',
          'sku',
          'seoTitle',
          'description',
          'seoTags',
          'suggestedPriceCents',
          'variants',
          'marketingScript',
          'translations',
        ],
      },
    },
  });

  const rawText = (response.text ?? '').trim();
  if (!rawText) {
    throw new Error('Réponse vide retournée par le moteur IA.');
  }

  return JSON.parse(rawText) as GeneratedCatalogDraft;
}
