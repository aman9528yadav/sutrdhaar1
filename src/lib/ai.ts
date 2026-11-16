export async function generateAIContent(prompt: string, providedApiKey?: string, systemInstruction?: string): Promise<string> {
  
  // Try to get API key from localStorage if not provided
  let apiKey = providedApiKey;
  if (!apiKey && typeof window !== 'undefined') {
    try {
      const profileStr = localStorage.getItem('sutradhaar_profile');
      if (profileStr) {
        const profile = JSON.parse(profileStr);
        apiKey = profile.settings?.geminiApiKey;
      }
    } catch (e) {
      // ignore
    }
  }

  // If we have an API key, use Google Gemini (Highest Quality)
  if (apiKey && apiKey.trim().length > 0) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

    const requestBody: any = {
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ]
    };

    if (systemInstruction) {
      requestBody.systemInstruction = {
        parts: [{ text: systemInstruction }]
      };
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error?.message || "Failed to generate AI content with Gemini.");
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!text) {
        throw new Error("Received empty response from Gemini.");
      }
      
      return text;
    } catch (err: any) {
      throw new Error(`Gemini API Error: ${err.message}`);
    }
  }

  // Fallback to Free Pollinations API if no key is provided
  let fullPrompt = prompt;
  if (systemInstruction) {
    fullPrompt = `${systemInstruction}\n\nUser: ${prompt}`;
  }

  const endpoint = `https://text.pollinations.ai/prompt/${encodeURIComponent(fullPrompt)}?seed=${Math.floor(Math.random() * 1000000)}`;

  try {
    const response = await fetch(endpoint);

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error("Free AI access is blocked by your internet provider or VPN (Status 403). Please add a Gemini API Key in Settings.");
      }
      throw new Error(`Free AI service failed with status: ${response.status}`);
    }

    const text = await response.text();
    
    if (!text) {
      throw new Error("Received empty response from AI.");
    }
    
    return text;
  } catch (error: any) {
    throw new Error(error.message || "Network error while connecting to AI.");
  }
}
