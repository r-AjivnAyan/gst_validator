import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, HsnResult, ValidationStatus, IndianStates } from '../types';

// Let TypeScript know Tesseract is available globally from the script tag
declare const Tesseract: any;

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

const billAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        overallStatus: { type: Type.STRING, enum: ['VERIFIED', 'ISSUES_FOUND'] },
        storeName: { type: Type.STRING },
        billDate: { type: Type.STRING },
        totalTax: { type: Type.NUMBER },
        totalAmount: { type: Type.NUMBER },
        items: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    itemName: { type: Type.STRING },
                    quantity: { type: Type.NUMBER },
                    price: { type: Type.NUMBER },
                    total: { type: Type.NUMBER },
                    taxAmount: { type: Type.NUMBER },
                    status: { type: Type.STRING, enum: Object.values(ValidationStatus) },
                    suggestion: { type: Type.STRING, description: 'Format as "Rule: [The rule]. Action: [The suggested action]."' },
                },
                required: ['itemName', 'quantity', 'price', 'total', 'taxAmount', 'status']
            }
        }
    },
    required: ['overallStatus', 'storeName', 'billDate', 'totalTax', 'totalAmount', 'items']
};

const sanitizeForPrompt = (input: string): string => {
  // A simple sanitizer to remove characters that might be used in prompt injection.
  // This is a basic defense layer; the model's safety settings provide the primary protection.
  return input.replace(/[`<>{}]/g, '').trim();
}

/**
 * Pre-processes an image file to improve clarity and reduce noise before analysis.
 * Applies a pipeline of filters using an HTML canvas: grayscale, brightness/contrast adjustment, 
 * and sharpening to enhance edges. This helps the AI model better recognize text and structure on the bill.
 */
const processImage = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const objectUrl = URL.createObjectURL(file);

    if (!ctx) {
      URL.revokeObjectURL(objectUrl);
      return reject(new Error("Could not get canvas context for image processing."));
    }

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      // 1. Draw original image
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // 2. Apply Grayscale, Brightness, and Contrast in a single pass for efficiency.
      const brightness = 10;  // Slightly increase brightness for clarity in shadows.
      const contrast = 50;    // Increase contrast to make text stand out.
      const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

      for (let i = 0; i < data.length; i += 4) {
        // Grayscale using the luminosity method for more perceptually accurate results.
        const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        
        // Apply brightness and contrast to the grayscale value.
        let color = gray + brightness;
        color = factor * (color - 128) + 128;
        
        // Clamp the value to the valid 0-255 range.
        const clampedColor = Math.max(0, Math.min(255, color));

        data[i] = clampedColor;
        data[i + 1] = clampedColor;
        data[i + 2] = clampedColor;
      }
      ctx.putImageData(imageData, 0, 0);

      // 3. Apply a Sharpening Filter (Convolution) to enhance edges.
      // This helps the model distinguish characters and lines more easily.
      const weights = [0, -1, 0, -1, 5, -1, 0, -1, 0]; // A standard sharpening kernel.
      const side = 3;
      const halfSide = 1;

      const srcData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const dstData = ctx.createImageData(canvas.width, canvas.height);
      const src = srcData.data;
      const dst = dstData.data;
      
      // Iterate over the entire image, handling edges by clamping coordinates.
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const dstOff = (y * canvas.width + x) * 4;
          let r = 0, g = 0, b = 0;

          for (let cy = 0; cy < side; cy++) {
            for (let cx = 0; cx < side; cx++) {
              // Clamp coordinates to stay within image bounds
              const scy = Math.min(canvas.height - 1, Math.max(0, y + cy - halfSide));
              const scx = Math.min(canvas.width - 1, Math.max(0, x + cx - halfSide));
              
              const srcOff = (scy * canvas.width + scx) * 4;
              const wt = weights[cy * side + cx];
              r += src[srcOff] * wt;
              g += src[srcOff + 1] * wt;
              b += src[srcOff + 2] * wt;
            }
          }

          // Clamp the final pixel values
          dst[dstOff] = Math.max(0, Math.min(255, r));
          dst[dstOff + 1] = Math.max(0, Math.min(255, g));
          dst[dstOff + 2] = Math.max(0, Math.min(255, b));
          dst[dstOff + 3] = src[dstOff + 3]; // Preserve alpha channel
        }
      }
      ctx.putImageData(dstData, 0, 0);

      // 4. Convert canvas back to a high-quality JPEG file.
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
          } else {
            reject(new Error("Canvas toBlob returned null during image processing."));
          }
        }, 'image/jpeg', 0.95 // High quality JPEG
      );

      URL.revokeObjectURL(objectUrl);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image for processing."));
    };

    img.src = objectUrl;
  });
};


export const analyzeBill = async (billImages: File[], userState: string, onProgress: (message: string) => void): Promise<AnalysisResult> => {
    if (billImages.length === 0) {
        throw new Error("No images provided for analysis.");
    }
    
    onProgress('Optimizing image quality...');
    const processedImages = await Promise.all(billImages.map(file => processImage(file)));

    let ocrText = '';
    try {
        onProgress('Initializing OCR engine (English + Hindi)...');
        const worker = await Tesseract.createWorker('eng+hin');
        
        // Define a whitelist of characters commonly found on bills to improve accuracy.
        const charWhitelist = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,-/:()₹%@#&*_ ';
        await worker.setParameters({
            // PSM_SPARSE_TEXT is often best for receipts with scattered text blocks.
            tessedit_pageseg_mode: Tesseract.PSM.SPARSE_TEXT,
            tessedit_char_whitelist: charWhitelist,
        });

        onProgress('Extracting text from bill (OCR)...');
        for (const image of processedImages) {
            const { data: { text } } = await worker.recognize(image);
            ocrText += text + '\n\n';
        }
        await worker.terminate();
    } catch (error) {
        console.warn("OCR process failed. Falling back to image-only analysis.", error);
        ocrText = "OCR failed or was not available."; // Provide a note to the model
    }

    const imageParts = await Promise.all(processedImages.map(file => fileToGenerativePart(file)));
    
    const promptInstructions = `You are an expert GST (Goods and Services Tax) validator for India. The user is located in **${userState}**. Analyze the provided bill information based on this location.
    
    You will receive two types of input: text extracted via OCR and the original bill image(s).
    
    1.  **Primary Source**: Use the OCR text as the main source for item names, prices, and quantities.
    2.  **Verification Source**: Use the image(s) to verify the OCR's accuracy. The image is the ground truth. Correct any OCR mistakes (like misread characters or numbers) by cross-referencing with the image.
    3.  **Consolidation**: Treat all images and all OCR text as parts of a single, consolidated bill.
    4.  **Analysis & Location Context**: For each line item, verify the GST applied based on common Indian tax slabs (0%, 5%, 12%, 18%, 28%). 
        *   Infer the item category to determine the likely correct slab.
        *   **Crucially, apply ${userState}-specific rules**. If the seller's location (inferred from the bill) is also in ${userState}, validate CGST and SGST. If the seller is in a different state, validate IGST. Assume the transaction is intra-state unless evidence suggests otherwise.
    5.  **Status Assignment**: Assign a status to each item ('CORRECT', 'INCORRECT_TAX_SLAB', 'INCORRECT_CALCULATION', 'MISSING_INFO', 'SUSPICIOUS').
    6.  **Suggestions**: For any issue, provide a concise 'suggestion' formatted strictly as: "Rule: [The rule violated]. Action: [Suggested action]."
    7.  **Summary**: Determine an 'overallStatus': 'VERIFIED' if all items are correct, otherwise 'ISSUES_FOUND'. Extract store name, bill date, total tax, and total amount.
    8.  **Output**: Return the entire analysis exclusively in the specified JSON format.`;
    
    const contentParts = [
        { text: promptInstructions },
        { text: "--- OCR-EXTRACTED TEXT START ---\n" + ocrText + "\n--- OCR-EXTRACTED TEXT END ---" },
        ...imageParts
    ];

    try {
        onProgress('Validating with AI expert...');
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: contentParts },
            config: {
                responseMimeType: 'application/json',
                responseSchema: billAnalysisSchema,
            }
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error: any) {
        console.error("Error analyzing bill with Gemini API:", error);
        if (error instanceof SyntaxError) {
          throw new Error("Could not read the bill from the image. Please try again with a clearer, well-lit image.");
        }
        if (error.message && (error.message.includes('fetch') || error.message.includes('NetworkError'))) {
             throw new Error("Network error. Please check your connection and try again.");
        }
        throw new Error("An API error occurred during analysis. The service may be busy.");
    }
};

const hsnResponseSchema = {
    type: Type.OBJECT,
    properties: {
        code: { type: Type.STRING, description: "The most relevant 4 or 8-digit HSN/SAC code." },
        description: { type: Type.STRING, description: "Official description for this HSN/SAC code." },
        igst: { type: Type.STRING, description: "The typical IGST rate as a percentage, e.g., '18%'." },
        cgst: { type: Type.STRING, description: "The typical CGST rate as a percentage, e.g., '9%'." },
        sgst: { type: Type.STRING, description: "The typical SGST rate as a percentage, e.g., '9%'." },
        details: { type: Type.STRING, description: "Provide brief, important details. Mention common exemptions, special conditions, or if the rate is subject to frequent changes. If none, state 'No specific exemptions or conditions.'." },
    },
    required: ['code', 'description', 'igst', 'cgst', 'sgst', 'details'],
};

export const lookupHsnCode = async (itemName: string): Promise<HsnResult> => {
    const sanitizedItemName = sanitizeForPrompt(itemName);
    if (!sanitizedItemName) {
        throw new Error("Invalid item name provided.");
    }
    const prompt = `You are an Indian GST tax expert. For the item "${sanitizedItemName}", provide its most relevant HSN or SAC code and associated tax details. Find the most common HSN code, its official description, the typical IGST, CGST, and SGST rates, and a brief note on any common exemptions or special conditions. Return the data in the specified JSON format.`;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
             config: {
                responseMimeType: 'application/json',
                responseSchema: hsnResponseSchema,
            }
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error: any) {
        console.error("Error looking up HSN code:", error);
        if (error instanceof SyntaxError) {
          throw new Error("The service couldn't understand the item. Please try a more specific name.");
        }
        if (error.message && (error.message.includes('fetch') || error.message.includes('NetworkError'))) {
            throw new Error("Service unavailable due to a network error. Please try again later.");
        }
        throw new Error("Could not retrieve HSN/SAC information for this item.");
    }
};

// NEW: Add a function to determine state from coordinates.
export const getStateFromGeolocation = async (latitude: number, longitude: number): Promise<string> => {
    const validStates = Object.values(IndianStates).join("', '");
    const prompt = `Based on the geographic coordinates latitude=${latitude} and longitude=${longitude}, identify the corresponding state or union territory within India.
    
    Your response MUST be one of the following exact string values: ['${validStates}'].
    
    Do not provide any other text, explanation, or formatting. Just the name of the state or union territory.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        const stateName = response.text.trim();
        return stateName;
    } catch (error: any) {
         console.error("Error getting state from geolocation:", error);
         throw new Error("Could not determine state from your location via the API.");
    }
}