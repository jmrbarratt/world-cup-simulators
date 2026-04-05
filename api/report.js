export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Call Anthropic API with the API key from environment variable
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', errorText);
      return res.status(response.status).json({ 
        error: 'Failed to generate report from Anthropic API' 
      });
    }

    const data = await response.json();

    if (data.error) {
      console.error('Anthropic API returned error:', data.error);
      return res.status(500).json({ error: data.error.message || 'API error' });
    }

    const text = data.content && data.content[0] && data.content[0].text;
    
    if (!text) {
      return res.status(500).json({ error: 'No content returned from API' });
    }

    // Return the report text
    res.status(200).json({
      report: text
    });

  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ 
      error: 'Internal server error: ' + err.message 
    });
  }
}
