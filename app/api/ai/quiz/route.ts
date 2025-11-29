import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getCurrentUser } from '@/lib/auth';

const MODEL_NAME = 'gemini-2.5-flash';

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number; // 0-based index
  explanation?: string;
}

interface Quiz {
  title: string;
  description: string;
  subject: string;
  questions: QuizQuestion[];
}

function parseQuizResponse(text: string): Quiz | null {
  try {
    // Clean the text - remove markdown code blocks
    let cleanedText = text.trim();
    
    // Remove markdown code blocks
    cleanedText = cleanedText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    // Try to find JSON object
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in response');
      return null;
    }
    
    let jsonStr = jsonMatch[0];
    
    // Fix common JSON issues
    // Replace unescaped newlines in strings
    jsonStr = jsonStr.replace(/("(?:[^"\\]|\\.)*")\s*\n\s*/g, '$1 ');
    
    // Try to parse
    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (parseError) {
      // If parsing fails, try to fix common issues
      console.error('Initial parse failed, attempting fixes...', parseError);
      
      // Try fixing escaped characters
      jsonStr = jsonStr.replace(/\\'/g, "'");
      jsonStr = jsonStr.replace(/\\"/g, '"');
      
      // Try parsing again
      try {
        parsed = JSON.parse(jsonStr);
      } catch (secondError) {
        console.error('Failed to parse after fixes:', secondError);
        // Last resort: try to extract just the essential parts
        return extractQuizFromText(text);
      }
    }
    
    // Validate structure
    if (!parsed || !parsed.questions || !Array.isArray(parsed.questions)) {
      return extractQuizFromText(text);
    }

        // Validate and map questions with correct answers
        const validatedQuestions = parsed.questions.map((q: any, index: number): QuizQuestion => {
          const options = Array.isArray(q.options) ? q.options.map((opt: any) => String(opt).trim()).filter((opt: string) => opt.length > 0) : [];
          let correctAnswer = typeof q.correctAnswer === 'number' && q.correctAnswer >= 0 && q.correctAnswer < options.length 
            ? q.correctAnswer 
            : 0; // Default to first option if invalid
          
          // Ensure correctAnswer is within valid range
          if (correctAnswer < 0 || correctAnswer >= options.length) {
            console.warn(`Question ${index + 1}: Invalid correctAnswer ${q.correctAnswer}, defaulting to 0`);
            correctAnswer = 0;
          }

          return {
            question: String(q.question || '').trim(),
            options,
            correctAnswer, // This is stored and used for evaluation
            explanation: String(q.explanation || '').trim(),
          };
        }).filter((q: QuizQuestion) => q.question && q.options.length >= 2);

        if (validatedQuestions.length === 0) {
          console.error('No valid questions found after validation');
          return null;
        }

        return {
          title: parsed.title || 'Generated Quiz',
          description: parsed.description || '',
          subject: parsed.subject || 'General',
          questions: validatedQuestions, // All questions include correctAnswer for evaluation
        };
  } catch (error) {
    console.error('Error parsing quiz JSON:', error);
    return extractQuizFromText(text);
  }
}

function extractQuizFromText(text: string): Quiz | null {
  // Fallback: try to extract quiz data from unstructured text
  try {
    const lines = text.split('\n').filter(l => l.trim());
    const questions: QuizQuestion[] = [];
    let currentQuestion: Partial<QuizQuestion> | null = null;
    let currentOptions: string[] = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Detect question
      if (trimmed.match(/^\d+[\.\)]\s+/) || trimmed.match(/^Q\d*[\.\):]\s+/i)) {
        if (currentQuestion && currentOptions.length >= 2) {
          questions.push({
            question: currentQuestion.question || '',
            options: currentOptions,
            correctAnswer: currentQuestion.correctAnswer || 0,
            explanation: currentQuestion.explanation || '',
          });
        }
        currentQuestion = { question: trimmed.replace(/^\d+[\.\)]\s*/, '').replace(/^Q\d*[\.\):]\s*/i, '') };
        currentOptions = [];
      }
      // Detect options
      else if (trimmed.match(/^[A-D][\.\)]\s+/i)) {
        currentOptions.push(trimmed.replace(/^[A-D][\.\)]\s*/i, ''));
      }
    }
    
    if (currentQuestion && currentOptions.length >= 2) {
      questions.push({
        question: currentQuestion.question || '',
        options: currentOptions,
        correctAnswer: 0,
        explanation: '',
      });
    }
    
    if (questions.length > 0) {
      return {
        title: 'Generated Quiz',
        description: '',
        subject: 'General',
        questions,
      };
    }
  } catch (error) {
    console.error('Error in fallback extraction:', error);
  }
  
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'AI is not configured. Missing GEMINI_API_KEY.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { prompt, subject, difficulty, numQuestions } = body as {
      prompt?: string;
      subject?: string;
      difficulty?: string;
      numQuestions?: number;
    };

    if (!prompt || !prompt.trim()) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const questionsCount = numQuestions || 5;
    const difficultyLevel = difficulty || 'medium';
    const subjectType = subject || 'General';

    const systemPrompt = `You are an expert quiz generator for educational purposes. Your task is to create a high-quality quiz that tests understanding and knowledge.

Generate a quiz in JSON format with this exact structure:
{
  "title": "Clear, descriptive quiz title",
  "description": "Brief 1-2 sentence description of what the quiz covers",
  "subject": "${subjectType}",
  "questions": [
    {
      "question": "Clear, well-formulated question",
      "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
      "correctAnswer": 0,
      "explanation": "Clear explanation of why the correct answer is right"
    }
  ]
}

CRITICAL REQUIREMENTS - READ CAREFULLY:
1. Generate exactly ${questionsCount} questions - no more, no less
2. Difficulty: ${difficultyLevel}
   - Easy: Basic concepts, straightforward questions
   - Medium: Moderate complexity, requires some understanding
   - Hard: Advanced concepts, requires deep understanding
3. Subject focus: ${subjectType}
4. Topic: ${prompt}
5. Each question MUST have exactly 4 options (A, B, C, D)
6. **MANDATORY: correctAnswer field is REQUIRED for EVERY question**
   - correctAnswer MUST be a number: 0 (first option/A), 1 (second option/B), 2 (third option/C), or 3 (fourth option/D)
   - This is the index of the CORRECT answer in the options array
   - The correctAnswer will be used to automatically evaluate user responses
   - You MUST ensure the correctAnswer index matches the actual correct option
   - Double-check that correctAnswer points to the truly correct option
7. Make all options plausible - avoid obviously wrong distractors
8. Questions should be clear, unambiguous, and test real understanding
9. Explanations should be educational and help learners understand why the correct answer is right
10. Use proper JSON formatting - escape quotes in strings with backslash
11. Return ONLY the JSON object, no markdown, no code blocks, no extra text


VALIDATION CHECKLIST (before returning):
- Every question has exactly 4 options
- Every question has a correctAnswer field (0, 1, 2, or 3)
- The correctAnswer index actually points to the correct option
- All questions are relevant to the topic: ${prompt}
- All questions match the difficulty level: ${difficultyLevel}

Example of properly formatted JSON with correct answer:
{
  "question": "What is the capital of France?",
  "options": ["London", "Paris", "Berlin", "Madrid"],
  "correctAnswer": 1,
  "explanation": "Paris is the capital of France. It is the second option in the array (index 1)."
}

IMPORTANT: The correctAnswer field is essential for automatic scoring. Make sure it is accurate and present in every question.

Now generate the quiz:`;

    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    const text = response.text();

    const quiz = parseQuizResponse(text);

    if (!quiz || quiz.questions.length === 0) {
      return NextResponse.json(
        { error: 'Failed to generate valid quiz. Please try again.' },
        { status: 500 }
      );
    }

    // Log to console
    console.log('Generated Quiz:', JSON.stringify(quiz, null, 2));

    return NextResponse.json({ quiz }, { status: 200 });
  } catch (error: any) {
    console.error('Error generating quiz:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate quiz',
        details: error?.message ?? 'Unknown error',
      },
      { status: 500 }
    );
  }
}

