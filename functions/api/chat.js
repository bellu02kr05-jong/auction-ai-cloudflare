export async function onRequestPost(context) {
  const { request, env } = context;
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    const body = await request.json();
    const { message, top_k = 5 } = body;

    if (!message) {
      return new Response(JSON.stringify({ error: '메시지가 없습니다' }), {
        status: 400, headers: corsHeaders
      });
    }

    const embedding = await getEmbedding(message, env);
    const searchResults = await searchQdrant(embedding, top_k, env);
    const answer = await generateAnswer(message, searchResults, env);

    return new Response(JSON.stringify({ 
      answer: answer,
      sources: searchResults.map(r => ({ 
        filename: r.payload?.filename || 'unknown',
        score: r.score 
      }))
    }), { status: 200, headers: corsHeaders });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: corsHeaders
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}

async function getEmbedding(text, env) {
  const response = await fetch(
    'https://router.huggingface.co/hf-inference/models/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.HF_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ inputs: text, options: { wait_for_model: true } })
    }
  );
  if (!response.ok) throw new Error(`HuggingFace API 오류: ${response.status}`);
  return await response.json();
}

async function searchQdrant(vector, topK, env) {
  const response = await fetch(
    `${env.QDRANT_URL}/collections/lectures/points/search`,
    {
      method: 'POST',
      headers: {
        'api-key': env.QDRANT_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ vector: vector, limit: topK, with_payload: true })
    }
  );
  if (!response.ok) throw new Error(`Qdrant API 오류: ${response.status}`);
  const result = await response.json();
  return result.result || [];
}

async function generateAnswer(question, searchResults, env) {
  const context = searchResults
    .map(r => `[${r.payload?.filename || 'unknown'}]\n${r.payload?.text || ''}`)
    .join('\n\n');

  const systemPrompt = `당신은 20년 경력의 경매 전문가입니다. 
제공된 강의 내용을 참고하여 질문에 답변하세요.
- 실전 경험에 기반한 구체적인 조언을 제공하세요
- 초보자도 이해할 수 있도록 쉽게 설명하세요
- 강의 내용에 없는 내용은 추측하지 마세요`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `참고 강의 내용:\n${context}\n\n질문: ${question}` }
      ],
      temperature: 0.7,
      max_tokens: 1024
    })
  });

  if (!response.ok) throw new Error(`Groq API 오류: ${response.status}`);
  const result = await response.json();
  return result.choices[0]?.message?.content || '답변을 생성하지 못했습니다.';
}
