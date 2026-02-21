import { mockAnalyzeTrashImage } from './mockAnalysis'

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const MODEL = 'gemini-2.5-flash'

const PROMPT = `Analyze this trash/recyclable item in the image. Respond with ONLY a valid JSON object (no markdown, no extra text) with this exact structure:
{
  "name": "item name (e.g. Plastic Bottle)",
  "materials": ["material1", "material2"],
  "recyclingMethod": "step-by-step recycling instructions",
  "reuseMethod": "creative reuse ideas"
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
  return {
    name: parsed.name || 'Unknown',
    materials: Array.isArray(parsed.materials) ? parsed.materials : [parsed.materials ?? 'Unknown'],
    recyclingMethod: parsed.recyclingMethod || 'Check local recycling guidelines.',
    reuseMethod: parsed.reuseMethod || 'Consider reusing or upcycling.',
  }
}
