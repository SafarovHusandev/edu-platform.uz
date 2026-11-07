import { parseQuizDocx, type ParsedQuestionError } from '@/lib/parse-quiz-docx';

const REQUIRED_OPTIONS = 4;

export interface ParsedSpinQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

// Test savollari bilan bir xil Word format, lekin baraban savoli doim aniq 4 variantli
export async function parseSpinQuestionsDocx(file: File) {
  const { questions, numbers, errors: parseErrors } = await parseQuizDocx(file);
  const parsed: ParsedSpinQuestion[] = [];
  const errors: ParsedQuestionError[] = [...parseErrors];

  questions.forEach((question, index) => {
    const options = question.options ?? [];
    if (question.type !== 'multiple_choice' || options.length !== REQUIRED_OPTIONS) {
      errors.push({
        questionNumber: numbers[index],
        text: question.text,
        reason: `Aniq ${REQUIRED_OPTIONS} ta variant kerak`,
      });
      return;
    }
    parsed.push({
      question: question.text,
      options: options.map((option) => option.text),
      correctIndex: question.correctAnswer as number,
    });
  });

  errors.sort((a, b) => a.questionNumber - b.questionNumber);
  return { questions: parsed, errors };
}
