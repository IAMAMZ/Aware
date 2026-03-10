const CLAUDE_API_KEY = import.meta.env.VITE_CLAUDE_API_KEY;
const MODEL = import.meta.env.VITE_CLAUDE_MODEL || 'claude-3-sonnet-20240229';

export const generateInsight = async (prompt: string, context: any) => {
    if (!CLAUDE_API_KEY) {
        console.warn('Claude API key missing. Returning mock insight.');
        return 'This is a mock insight because the API key is not configured. Add VITE_CLAUDE_API_KEY to your .env.local file.';
    }

    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': CLAUDE_API_KEY,
                'anthropic-version': '2023-06-01',
                // For browser usage, we typically need to proxy this or use a backend, 
                // but for this MVP we'll use the anthropic-dangerously-allow-browser header if needed
                'anthropic-dangerously-allow-browser': 'true'
            },
            body: JSON.stringify({
                model: MODEL,
                max_tokens: 1024,
                messages: [{
                    role: 'user',
                    content: `You are an AI health counselor for an ADHD user. Analyze this context: ${JSON.stringify(context)}. Prompt: ${prompt}`
                }]
            })
        });

        if (!response.ok) {
            throw new Error(`API returned ${response.status}`);
        }

        const data = await response.json();
        return data.content[0].text;
    } catch (error) {
        console.error('Error calling Claude API:', error);
        return 'Failed to generate insight. Please check your API configuration and try again.';
    }
};
