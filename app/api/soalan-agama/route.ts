import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `Anda adalah seorang ustaz/ustazah yang berpengetahuan luas dalam ilmu agama Islam. Anda akan menjawab soalan-soalan berkaitan agama Islam dengan:

1. JAWAPAN yang jelas, mudah difahami, dan berdasarkan sumber-sumber yang sahih
2. RUJUKAN kepada:
   - Al-Quran (dengan surah dan ayat)
   - Hadis (dengan riwayat)
   - Pendapat ulama mazhab (terutama Mazhab Shafie kerana majoriti Muslim di Malaysia)
   - Fatwa dari Jabatan Mufti (jika berkaitan)

3. FORMAT jawapan:
   - Mulakan dengan "Bismillahirrahmanirrahim"
   - Jawab dengan bahasa Melayu yang sopan dan mudah difahami
   - Sertakan dalil dari Al-Quran atau Hadis jika ada
   - Nyatakan sumber rujukan di akhir jawapan
   - Jika soalan di luar bidang agama Islam, nyatakan dengan sopan bahawa anda hanya menjawab soalan berkaitan agama Islam

4. GAYA penulisan:
   - Gunakan bahasa Melayu yang formal tetapi mesra
   - Elakkan menggunakan istilah yang terlalu teknikal tanpa penjelasan
   - Berikan contoh praktikal jika perlu

5. BATASAN:
   - Jangan memberikan fatwa sendiri untuk isu-isu khilafiyyah yang kompleks
   - Sarankan untuk merujuk kepada mufti atau ustaz tempatan untuk isu yang memerlukan penelitian lanjut
   - Jangan menjawab soalan yang boleh menyebabkan perpecahan atau fitnah

PENTING: Sentiasa ingatkan bahawa untuk isu-isu yang kompleks, adalah lebih baik merujuk kepada mufti atau ustaz yang berkelayakan.`;

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// POST - Ask a question to Claude AI
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { soalan, sejarah } = body as { soalan: string; sejarah?: Message[] };

    if (!soalan || soalan.trim().length < 5) {
      return NextResponse.json(
        { error: 'Sila masukkan soalan yang lengkap (minimum 5 aksara)' },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key tidak dikonfigurasi. Sila hubungi pentadbir sistem.' },
        { status: 500 }
      );
    }

    const anthropic = new Anthropic({
      apiKey: apiKey,
    });

    // Build messages array with history if provided
    const messages: { role: 'user' | 'assistant'; content: string }[] = [];

    if (sejarah && sejarah.length > 0) {
      // Include previous conversation history (last 10 messages)
      const recentHistory = sejarah.slice(-10);
      for (const msg of recentHistory) {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      }
    }

    // Add current question
    messages.push({
      role: 'user',
      content: soalan
    });

    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: messages
    });

    // Extract text from response
    const jawapan = response.content
      .filter(block => block.type === 'text')
      .map(block => (block as { type: 'text'; text: string }).text)
      .join('\n');

    return NextResponse.json({
      soalan,
      jawapan,
      model: 'Claude AI',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Error in soalan-agama API:', error);

    if (error.status === 401) {
      return NextResponse.json(
        { error: 'API key tidak sah. Sila hubungi pentadbir sistem.' },
        { status: 500 }
      );
    }

    if (error.status === 429) {
      return NextResponse.json(
        { error: 'Terlalu banyak permintaan. Sila cuba sebentar lagi.' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: 'Maaf, berlaku ralat semasa memproses soalan anda. Sila cuba lagi.' },
      { status: 500 }
    );
  }
}

// GET - For backwards compatibility, return info about the service
export async function GET() {
  return NextResponse.json({
    service: 'Soal Jawab Agama',
    description: 'Tanyakan apa-apa soalan berkaitan agama Islam dan dapatkan jawapan berdasarkan Al-Quran, Hadis, dan pandangan ulama.',
    usage: 'POST /api/soalan-agama dengan body: { "soalan": "soalan anda" }',
    powered_by: 'Claude AI'
  });
}
