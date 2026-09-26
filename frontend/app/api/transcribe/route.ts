import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as Blob | null;

    if (!file) {
      return NextResponse.json({ error: 'No audio provided' }, { status: 400 });
    }

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey || groqApiKey === 'gsk_your_groq_api_key_here') {
      // Generic server error, hiding infrastructure details
      return NextResponse.json({ error: 'Transcription service unavailable' }, { status: 503 });
    }

    // Determine filename / extension based on audio mime type
    const mimeType = file.type || 'audio/webm';
    const extension = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : 'webm';

    const groqFormData = new FormData();
    groqFormData.append('file', file, `audio.${extension}`);
    groqFormData.append('model', 'whisper-large-v3');
    groqFormData.append('response_format', 'json');
    groqFormData.append('temperature', '0.0'); // 0.0 forces the most deterministic, accurate output
    
    // 1. CRITICAL: Lock language to English to prevent accent misinterpretation
    groqFormData.append('language', 'en'); 
    
    // 2. REFINED PROMPT: Mix natural conversational phrasing with financial tickers
    groqFormData.append(
      'prompt', 
      'Hello. Here is the Finrena institutional financial research query regarding NVDA, TSLA, AAPL, BTC, ETH, EBITDA, DCF, WACC, and the FOMC order book.'
    );

    const groqResponse = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
      },
      body: groqFormData,
    });

    if (!groqResponse.ok) {
      console.error('Transcription upstream response not ok:', groqResponse.status);
      return NextResponse.json({ error: 'Transcription failed' }, { status: 502 });
    }

    const data = await groqResponse.json();
    return NextResponse.json({ text: data.text });
  } catch (error) {
    console.error('Internal error in transcription route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
