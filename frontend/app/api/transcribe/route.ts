import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as Blob | null;

    if (!file) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey || groqApiKey === 'gsk_your_groq_api_key_here') {
      return NextResponse.json(
        { error: 'GROQ_API_KEY is not configured. Please set your Groq API key in .env.local.' },
        { status: 500 }
      );
    }

    // Determine filename / extension based on blob type
    const mimeType = file.type || 'audio/webm';
    const extension = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : 'webm';

    // Prepare multipart payload for Groq OpenAI-compatible audio endpoint
    const groqFormData = new FormData();
    groqFormData.append('file', file, `audio.${extension}`);
    groqFormData.append('model', 'whisper-large-v3');
    groqFormData.append('response_format', 'json');
    groqFormData.append('temperature', '0.0');
    // Financial keyword priming prevents ticker distortion
    groqFormData.append(
      'prompt',
      'Finrena institutional finance research: NVDA, TSLA, AAPL, BTC, ETH, EBITDA, DCF, WACC, Monte Carlo, Order Book, FOMC.'
    );

    const groqResponse = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
      },
      body: groqFormData,
    });

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      return NextResponse.json(
        { error: `Groq Whisper failed: ${errorText}` },
        { status: groqResponse.status }
      );
    }

    const data = await groqResponse.json();
    return NextResponse.json({ text: data.text });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
