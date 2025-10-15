
import { GoogleGenAI } from "@google/genai";

// Ensure the API key is available from environment variables
if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

// Initialize the GoogleGenAI client with the API key
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Extracts text from a single image using the Gemini API.
 * @param {string} base64Image - The base64 encoded image string.
 * @param {string} mimeType - The MIME type of the image (e.g., 'image/jpeg').
 * @returns {Promise<string>} - A promise that resolves to the extracted text.
 */
export const extractTextFromImage = async (base64Image: string, mimeType: string): Promise<string> => {
  try {
    // A more detailed prompt to preserve formatting
    const prompt = `أنت محرك OCR متقدم للغاية ولديك قدرات على اكتشاف التنسيق. مهمتك هي استخراج كل النصوص من هذه الصورة مع الحفاظ على البنية والتنسيق الأصليين بأكبر قدر ممكن من الدقة. انتبه جيدًا لما يلي:
- **العناوين الرئيسية والفرعية:** حددها وحافظ على تسلسلها الهرمي.
- **الفقرات:** حافظ على فواصل الفقرات كما هي.
- **القوائم:** حافظ على القوائم النقطية أو الرقمية.
- **المحاذاة:** حاول محاكاة محاذاة النص (يمين، يسار، وسط) حيثما كان ذلك مناسبًا.
- **المسافات البيضاء:** استخدم فواصل الأسطر والمسافات لتقليد التنسيق الأصلي.

قد يكون النص باللغة العربية أو الإنجليزية. يجب أن يكون الإخراج نصًا نظيفًا ومنسقًا جيدًا يمثل النص كما يظهر في الصورة.`;

    // Prepare the content parts for the API request
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                { text: prompt },
                {
                    inlineData: {
                        data: base64Image,
                        mimeType,
                    },
                },
            ],
        },
    });

    // Return the extracted text from the response
    return response.text;
  } catch (error) {
    console.error("Error extracting text from image:", error);
    throw new Error("فشل استخراج النص من الصورة. يرجى المحاولة مرة أخرى.");
  }
};


/**
 * Extracts text from multiple images (e.g., pages of a PDF) using the Gemini API.
 * @param {Array<{base64: string; mimeType: string}>} images - An array of image objects.
 * @returns {Promise<string>} - A promise that resolves to the concatenated extracted text.
 */
export const extractTextFromImages = async (images: { base64: string; mimeType: string }[]): Promise<string> => {
    try {
        const prompt = `أنت نظام متطور لمعالجة المستندات. مهمتك هي استخراج كل النصوص من صفحات المستند التالية بالترتيب. من الضروري معالجة الصفحات بالترتيب المحدد ودمج محتواها في مستند واحد متماسك.

حافظ على البنية والتنسيق الأصليين بدقة عالية:
- **العناوين والأقسام:** حافظ على التسلسل الهرمي للعناوين الرئيسية والفرعية عبر الصفحات.
- **الفقرات وفواصل الأسطر:** قم بإعادة إنتاج بنية الفقرة بدقة.
- **القوائم:** قم بتنسيق القوائم المرتبة (الرقمية) وغير المرتبة (النقطية) بشكل صحيح.
- **الاستمرارية:** تأكد من أن النص الذي يتدفق من صفحة إلى أخرى متصل بسلاسة.

استخرج النص بلغته الأصلية (العربية أو الإنجليزية). يجب أن يكون الناتج النهائي مستندًا نصيًا جيد التنظيم يمثل محتوى جميع الصفحات مجتمعة.`;

        // Create the parts array with the initial prompt and all image data
        const parts = [
            { text: prompt },
            ...images.map(image => ({
                inlineData: {
                    data: image.base64,
                    mimeType: image.mimeType,
                },
            }))
        ];
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts }
        });

        // Return the combined extracted text
        return response.text;

// FIX: Added curly braces to the catch block to fix a syntax error.
    } catch (error) {
        console.error("Error extracting text from multiple images:", error);
        throw new Error("فشل استخراج النص من صفحات PDF. يرجى المحاولة مرة أخرى.");
    }
};

/**
 * Summarizes the given text using the Gemini API.
 * @param {string} textToSummarize - The text content to be summarized.
 * @returns {Promise<string>} - A promise that resolves to the summarized text.
 */
export const summarizeText = async (textToSummarize: string): Promise<string> => {
    try {
        const prompt = `أنت خبير في تلخيص النصوص. قم بتلخيص النص التالي باللغة العربية في نقاط واضحة وموجزة. ركز على الأفكار الرئيسية والمعلومات الهامة فقط. النص هو:\n\n"${textToSummarize}"`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return response.text;
    } catch (error) {
        console.error("Error summarizing text:", error);
        throw new Error("فشل تلخيص النص. يرجى المحاولة مرة أخرى.");
    }
};
