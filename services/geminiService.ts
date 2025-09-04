import { GoogleGenAI, Type } from "@google/genai";
import type { FeedbackData, Language, SentimentAnalysisResult, Suggestion, PositiveHighlight } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const analyzeSentiment = async (text: string): Promise<SentimentAnalysisResult> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analyze the sentiment of the following customer comments. Categorize them as 'positive', 'neutral', or 'negative'. Provide the output as a JSON object with the total count for each category, like {"positive": number, "neutral": number, "negative": number}. Do not include any other text, explanation, or markdown formatting. Comments: \n\n${text}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            positive: { type: Type.NUMBER },
            neutral: { type: Type.NUMBER },
            negative: { type: Type.NUMBER },
          },
        },
      },
    });
    
    const jsonString = response.text.trim();
    const result = JSON.parse(jsonString);
    
    return {
      positive: result.positive || 0,
      neutral: result.neutral || 0,
      negative: result.negative || 0,
    };

  } catch (error) {
    console.error("Error analyzing sentiment:", error);
    throw new Error("Failed to perform sentiment analysis.");
  }
};

export const generateSuggestions = async (data: FeedbackData[], language: Language): Promise<Suggestion[]> => {
  try {
    const langInstruction = language === 'es' ? 'Spanish' : 'Portuguese';
    const feedbackForSuggestions = data
      .filter(d => (d.whatBetter && d.whatBetter.trim() !== '') || (d.wowIdeas && d.wowIdeas.trim() !== ''))
      .map(d => `- Comment: "${d.whatBetter || d.wowIdeas}". NPS Score: ${d.nps}`)
      .join('\n');

    if (!feedbackForSuggestions) {
      return [];
    }

    const prompt = `
      You are an expert business consultant. Based on the following customer feedback, provide 3-5 concrete, actionable improvement suggestions.
      For each suggestion, cite the original customer comment that inspired it.
      Respond in ${langInstruction}.
      
      Feedback:
      ${feedbackForSuggestions}
    `;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                originalComment: { type: Type.STRING, description: "The original, verbatim customer comment." },
                suggestion: { type: Type.STRING, description: "Your actionable suggestion based on the comment." },
              },
              required: ["originalComment", "suggestion"],
            }
          }
        }
    });

    const jsonString = response.text.trim();
    return JSON.parse(jsonString);

  } catch (error) {
    console.error("Error generating suggestions:", error);
    throw new Error("Failed to generate improvement suggestions.");
  }
};


export const findPositiveHighlights = async (data: FeedbackData[], language: Language): Promise<PositiveHighlight[]> => {
    try {
        const langInstruction = language === 'es' ? 'Spanish' : 'Portuguese';
        const positiveFeedback = data
            .filter(d => d.nps >= 9 && d.whyUs && d.whyUs.trim() !== '')
            .map(d => JSON.stringify({ comment: d.whyUs, nps: d.nps }))
            .join('\n');

        if (!positiveFeedback) {
            return [];
        }

        const prompt = `
            From the following list of positive customer feedback (NPS >= 9), identify the top 2-3 most impactful comments that highlight the company's strengths.
            For each, provide the original comment, its NPS score, and a brief reason explaining why this is a key strength.
            Respond in ${langInstruction}.

            Positive Feedback Data:
            ${positiveFeedback}
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            positiveComment: { type: Type.STRING, description: "The original, verbatim positive comment." },
                            npsScore: { type: Type.NUMBER, description: "The NPS score given by the customer." },
                            reason: { type: Type.STRING, description: "A brief explanation of why this highlights a key strength." }
                        },
                        required: ["positiveComment", "npsScore", "reason"]
                    }
                }
            }
        });

        const jsonString = response.text.trim();
        return JSON.parse(jsonString);

    } catch (error) {
        console.error("Error finding positive highlights:", error);
        throw new Error("Failed to identify positive highlights.");
    }
};
