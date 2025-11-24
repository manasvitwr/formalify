import type { ConvertTextParams } from '../types/formalify.types'
import { config } from '../../../config/env'

// OpenRouter configuration using Vite environment variables
const getApiKey = () => {
  return config.openRouterKey || "";
};

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";



/**
 * Converts casual text to formal text using OpenRouter + DeepSeek v3.2-exp
 * Supports both text and email formats, with optional length control
 */
export async function convertText(
  params: ConvertTextParams,
): Promise<string> {
  const {
    text,
    formality,
    format,
    lengthControlEnabled,
    lengthPercentage,
    contextLabels = [],
    isTypeEnabled,
    selectedOutputType,
  } = params;

  if (!text.trim()) {
    throw new Error("Please enter some text to convert");
  }

  // Get current date for structured output
  const getCurrentDate = () => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'short'
    };
    return now.toLocaleDateString('en-US', options);
  };

  // Build the prompt based on parameters
  let formalityInstruction = "";

  if (formality === "professional") {
    formalityInstruction = "highly professional and formal";
  } else if (formality === "semi-formal") {
    formalityInstruction = "semi-formal with a balanced tone";
  } else {
    formalityInstruction = "moderately formal but conversational";
  }

  // Tone personality integration
  const tonePersonality = "Craft the response with a highly professional yet approachable tone, reflecting a sophisticated and detail-oriented persona.";

  // Build context block from selected labels (only for email format)
  let contextBlock = "";
  if (format === "email" && contextLabels.length > 0) {
    const selectedLabels = contextLabels.filter(label => label.isSelected && label.value.trim());
    if (selectedLabels.length > 0) {
      contextBlock = "\n\nAdditional Context for Email:\n";
      selectedLabels.forEach(label => {
        contextBlock += `- ${label.label}: ${label.value}\n`;
      });
    }
  }

  const formatInstruction =
    format === "email"
      ? "Format the response as a professional email with a subject line, greeting, body, and closing." + contextBlock
      : "Format the response as clean, formal text.";

  // Optional length control instruction
  let lengthInstruction = "";
  if (lengthControlEnabled) {
    if (lengthPercentage > 50) {
      const increase = (lengthPercentage - 50) * 2; // Scale to percentage
      lengthInstruction = `The output should be approximately ${increase}% longer than the input, adding relevant professional details.`;
    } else if (lengthPercentage < 50) {
      const decrease = (50 - lengthPercentage) * 2; // Scale to percentage
      lengthInstruction = `The output should be approximately ${decrease}% shorter than the input, being more concise.`;
    }
  }

  // Structured output type instruction
  let typeInstruction = "";
  if (isTypeEnabled && selectedOutputType !== 'default') {
    const currentDate = getCurrentDate();

    if (selectedOutputType === 'todo') {
      typeInstruction = `\n\nIMPORTANT FORMATTING REQUIREMENTS:
1. First line: "To-do List"
2. Second line: "${currentDate}"
3. Then convert all tasks/points into a numbered list (1., 2., 3., etc.)
4. Keep each task short and concise - brief action items
5. Use simple, clear language with minimal elaboration`;
    } else if (selectedOutputType === 'agenda') {
      typeInstruction = `\n\nIMPORTANT FORMATTING REQUIREMENTS:
1. First line: "Agenda"
2. Second line: "${currentDate}"
3. Then convert all tasks/points into a numbered list (1., 2., 3., etc.)
4. Use slightly more professional phrasing with better vocabulary
5. Keep tasks focused and concise - DO NOT elaborate excessively
6. Enhance the wording to sound more professional without adding extra content`;
    } else if (selectedOutputType === 'eod') {
      typeInstruction = `\n\nIMPORTANT FORMATTING REQUIREMENTS:
1. First line: "End of Day Report"
2. Second line: "${currentDate}"
3. Then convert all tasks/points into a numbered list (1., 2., 3., etc.)
4. Use slightly more professional phrasing with better vocabulary
5. Keep accomplishments focused and concise - DO NOT elaborate excessively
6. Enhance the wording to sound more professional without adding extra content`;
    }
  }

  const systemPrompt = `You are a headless text processing engine called the Formalify Engine. ${tonePersonality} Convert the following text into a ${formalityInstruction} tone. ${lengthInstruction} ${formatInstruction}${typeInstruction}

CRITICAL OUTPUT REQUIREMENTS:
- Output ONLY the final converted text
- NO meta-commentary (e.g., "Here is", "I hope this helps", "Let me know")
- NO conversational phrases or sign-offs
- NO preambles or postscripts
- Start with the first character of converted output
- End with the last character of converted output
- Be instantly actionable and concise
- Project confident professional authority without unnecessary verbosity`;

  const userPrompt = `Casual text: "${text}"\n\nFormal version:`;

  try {
    const apiKey = getApiKey();

    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": window.location.origin,
        "X-Title": "Formalify",
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-chat",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message ||
        `API request failed: ${response.statusText}`,
      );
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0]?.message?.content) {
      throw new Error("Invalid response from API");
    }

    // Clean up the response text
    let cleanedText = data.choices[0].message.content.trim();

    // Remove bold markdown (**text** or __text__)
    cleanedText = cleanedText.replace(/\*\*([^*]+)\*\*/g, '$1');
    cleanedText = cleanedText.replace(/__([^_]+)__/g, '$1');

    // Remove italic markdown (*text* or _text_)
    cleanedText = cleanedText.replace(/\*([^*]+)\*/g, '$1');
    cleanedText = cleanedText.replace(/_([^_]+)_/g, '$1');

    // Remove ALL quotes (curly and straight) unless they're part of actual dialogue
    cleanedText = cleanedText.replace(/["""]/g, '');
    cleanedText = cleanedText.replace(/[''']/g, '');

    // Remove em dashes (—) and en dashes (–), replace with regular hyphens
    cleanedText = cleanedText.replace(/—/g, '-');
    cleanedText = cleanedText.replace(/–/g, '-');

    // Remove double hyphens
    cleanedText = cleanedText.replace(/--/g, '-');

    // STRICT META-COMMENTARY REMOVAL
    // Remove meta-commentary prefixes from the beginning
    const metaPrefixes = [
      /^Here is the converted text:\s*/i,
      /^Here's the converted text:\s*/i,
      /^Here is the formal version:\s*/i,
      /^Here's the formal version:\s*/i,
      /^Here is your converted text:\s*/i,
      /^Here's your converted text:\s*/i,
      /^The converted text is:\s*/i,
      /^The formal version is:\s*/i,
      /^Below is the converted text:\s*/i,
      /^I've converted.*?:\s*/i,
      /^I have converted.*?:\s*/i,
      /^Formal version:\s*/i,
      /^Converted text:\s*/i,
      /^Here you go:\s*/i,
      /^Here it is:\s*/i,
      /^Sure,?\s*/i,
      /^Certainly,?\s*/i,
      /^Of course,?\s*/i,
    ];

    for (const pattern of metaPrefixes) {
      cleanedText = cleanedText.replace(pattern, '');
    }

    // Remove meta-commentary suffixes from the end
    const metaSuffixes = [
      /\s*Let me know if you'?d? like.*$/i,
      /\s*Let me know if you need.*$/i,
      /\s*Let me know if there'?s? anything.*$/i,
      /\s*I hope this helps.*$/i,
      /\s*Hope this helps.*$/i,
      /\s*Feel free to.*$/i,
      /\s*If you need.*$/i,
      /\s*If you'?d? like.*$/i,
      /\s*Please let me know if.*$/i,
      /\s*Is there anything else.*$/i,
      /\s*Would you like.*$/i,
      /\s*Do you need.*$/i,
    ];

    for (const pattern of metaSuffixes) {
      cleanedText = cleanedText.replace(pattern, '');
    }

    // Remove lines that are purely meta-commentary (before actual content)
    const lines = cleanedText.split('\n');
    let contentStartIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim().toLowerCase();
      const isMetaLine =
        line.startsWith('here') ||
        line.startsWith('i\'ve') ||
        line.startsWith('i have') ||
        line.startsWith('below') ||
        line.startsWith('formal') ||
        line.startsWith('converted') ||
        line === '' ||
        /^here'?s?\s/i.test(line) ||
        /^this is\s/i.test(line);

      if (!isMetaLine && line.length > 0) {
        contentStartIndex = i;
        break;
      }
    }

    if (contentStartIndex > 0) {
      cleanedText = lines.slice(contentStartIndex).join('\n');
    }

    return cleanedText.trim();
  } catch (error) {
    console.error("OpenRouter API Error:", error);
    // Fallback to mock response on error
    return getMockResponse(
      text,
      formality,
      format,
      lengthControlEnabled,
      lengthPercentage,
    );
  }
}

/**
 * Provides mock responses when the OpenRouter API is not available
 */
function getMockResponse(
  text: string,
  formality: string,
  format: string,
  lengthControlEnabled: boolean,
  lengthPercentage: number,
): string {
  const isProfessional = formality === "professional";
  const isSemiFormal = formality === "semi-formal";
  const isEmail = format === "email";

  // Simple mock transformation logic
  const transformations: Record<string, string> = {
    hey: isProfessional ? "Dear" : isSemiFormal ? "Hello" : "Hi",
    hi: isProfessional ? "Dear" : isSemiFormal ? "Hello" : "Hi",
    thanks: isProfessional ? "Thank you very much" : "Thank you",
    "can you": isProfessional
      ? "Would you be able to"
      : isSemiFormal
        ? "Could you please"
        : "Could you",
    "let me know": isProfessional
      ? "Please inform me"
      : isSemiFormal
        ? "Please let me know"
        : "Let me know",
    asap: isProfessional
      ? "at your earliest convenience"
      : isSemiFormal
        ? "as soon as possible"
        : "soon",
    gonna: "going to",
    wanna: isProfessional ? "would like to" : "want to",
  };

  let formalText = text;
  Object.entries(transformations).forEach(([casual, formal]) => {
    const regex = new RegExp(`\\b${casual}\\b`, "gi");
    formalText = formalText.replace(regex, formal);
  });

  // Capitalize first letter
  formalText = formalText.charAt(0).toUpperCase() + formalText.slice(1);

  // Ensure proper punctuation
  if (!formalText.match(/[.!?]$/)) {
    formalText += ".";
  }

  // Apply length control (simple simulation)
  if (lengthControlEnabled && lengthPercentage > 50) {
    formalText +=
      " I would appreciate your attention to this matter at your earliest convenience.";
  } else if (lengthControlEnabled && lengthPercentage < 50) {
    // Shorten by removing last sentence if possible
    const sentences = formalText.split(/[.!?]/);
    if (sentences.length > 1) {
      formalText = sentences[0] + ".";
    }
  }

  if (isEmail) {
    return `Subject: Professional Correspondence

Dear Recipient,

${formalText}

${isProfessional ? "Best regards" : isSemiFormal ? "Kind regards" : "Regards"},
[Your Name]`;
  }

  return formalText;
}
