export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { imageData, mediaType } = req.body;
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) return res.status(500).json({ error: 'API key missing' });

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey,
        'HTTP-Referer': 'https://promptora-ai.vercel.app',
        'X-Title': 'Promptora'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-exp:free',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: 'data:' + mediaType + ';base64,' + imageData
                }
              },
              {
                type: 'text',
                text: 'Analyze this image and write a detailed AI art prompt to recreate it. Include style, lighting, colors, mood, composition, and subject details. Write only the prompt text, nothing else.'
              }
            ]
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      const errMsg = data.error ? data.error.message : JSON.stringify(data);
      return res.status(response.status).json({ error: errMsg });
    }

    if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
      return res.status(200).json({ prompt: data.choices[0].message.content });
    } else {
      return res.status(500).json({ error: 'No response from AI' });
    }

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
