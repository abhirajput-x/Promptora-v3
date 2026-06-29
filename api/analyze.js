export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageData, mediaType } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + apiKey;

    const requestBody = {
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: mediaType,
                data: imageData
              }
            },
            {
              text: 'Analyze this image and write a detailed AI art prompt to recreate it. Include style, lighting, colors, mood, composition, and subject details. Write only the prompt text, nothing else.'
            }
          ]
        }
      ]
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (!response.ok) {
      const errMsg = data.error ? data.error.message : 'API Error';
      return res.status(response.status).json({ error: errMsg });
    }

    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
      const text = data.candidates[0].content.parts[0].text;
      return res.status(200).json({ prompt: text });
    } else {
      return res.status(500).json({ error: 'No response from Gemini' });
    }

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
