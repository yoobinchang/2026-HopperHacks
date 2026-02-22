import { mockAnalyzeTrashImage } from './mockAnalysis'

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const MODEL = 'gemini-2.5-flash'

const PROMPT = `You are analyzing an image to see if it shows a single trash/recyclable item.

1. First decide: Does this image clearly show one specific piece of trash or recyclable material (e.g. a bottle, can, box, wrapper)? If the image shows no trash, is unclear, shows multiple unrelated items, or is not a photo of trash, set "isValidTrashImage" to false and you may omit other fields.

2. If isValidTrashImage is true, classify the item into exactly ONE of these categories (use the exact string):
- "waste" – general waste, non-recyclable, food waste, mixed or unknown
- "plastic" – plastics, bottles, wrappers, containers
- "paper and cardboard" – paper, cardboard, cartons
- "glass" – glass bottles, jars
- "metals" – metal cans, foil, scrap metal

Respond with ONLY a valid JSON object (no markdown, no extra text). When the image is valid trash, use this structure:
{
  "isValidTrashImage": true,
  "name": "item name (e.g. Plastic Bottle)",
  "materials": ["material1", "material2"],
  "recyclingMethod": "step-by-step recycling instructions",
  "reuseMethod": "creative reuse ideas",
  "category": "exactly one of: waste, plastic, paper and cardboard, glass, metals"
}

When the image does NOT show valid trash, use:
{
  "isValidTrashImage": false
}`

async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result?.split(',')[1]
      resolve(base64 || '')
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function parseJsonFromText(text) {
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON found in response')
  return JSON.parse(jsonMatch[0])
}

export async function analyzeTrashImage(file) {
  if (!API_KEY) throw new Error('VITE_GEMINI_API_KEY is not set')
  const base64Data = await fileToBase64(file)
  const mimeType = file.type || 'image/jpeg'

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': API_KEY,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Data,
                },
              },
              { text: PROMPT },
            ],
          },
        ],
        generationConfig: {
          response_mime_type: 'application/json',
        },
      }),
    }
  )

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const msg = err.error?.message || ''
    if (
      res.status === 429 ||
      msg.includes('quota') ||
      msg.includes('Quota exceeded') ||
      msg.includes('rate limit')
    ) {
      return mockAnalyzeTrashImage()
    }
    throw new Error(msg || `API error: ${res.status}`)
  }

  const data = await res.json()
  const text =
    data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '{}'

  const parsed = parseJsonFromText(text)

  if (parsed.isValidTrashImage === false) {
    return {
      isValidTrashImage: false,
      error: 'Please upload a valid picture of trash. This image could not be recognized as a single trash or recyclable item.',
    }
  }

  const VALID_CATEGORIES = ['waste', 'plastic', 'paper and cardboard', 'glass', 'metals']
  const rawCategory = (parsed.category || '').toLowerCase().trim()
  let category = VALID_CATEGORIES.find((c) => c === rawCategory)
  if (!category) {
    if (/paper|cardboard/.test(rawCategory)) category = 'paper and cardboard'
    else if (/plastic/.test(rawCategory)) category = 'plastic'
    else if (/metal/.test(rawCategory)) category = 'metals'
    else if (/glass/.test(rawCategory)) category = 'glass'
    else category = 'waste'
  }

  return {
    isValidTrashImage: true,
    name: parsed.name || 'Unknown',
    materials: Array.isArray(parsed.materials) ? parsed.materials : [parsed.materials ?? 'Unknown'],
    recyclingMethod: parsed.recyclingMethod || 'Check local recycling guidelines.',
    reuseMethod: parsed.reuseMethod || 'Consider reusing or upcycling.',
    category,
  }
}
