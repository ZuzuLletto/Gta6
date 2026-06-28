import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const geminiApiKey = process.env.GEMINI_API_KEY!;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text, targetLang } = body;

    if (!text || !targetLang) {
      return NextResponse.json({ error: "text ve targetLang alanları zorunlu." }, { status: 400 });
    }

    if (!geminiApiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY sunucuda tanımlanmamış." }, { status: 500 });
    }

    // Google GenAI SDK ile çeviriyi yap
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    
    const prompt = `Translate this user comment into the language specified by the code "${targetLang}". 
Keep the original tone, gaming references, slangs, emojis and format. 
Return ONLY the translation, no explanation, no quotes around the result.

Comment:
"${text}"`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    const translatedText = response.text?.trim() || text;

    return NextResponse.json({ translatedText });
  } catch (error: any) {
    console.error("Translate API Error:", error);
    return NextResponse.json({ error: error.message || "Çeviri sırasında bir hata oluştu." }, { status: 500 });
  }
}
