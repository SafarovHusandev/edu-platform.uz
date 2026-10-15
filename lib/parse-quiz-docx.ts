import mammoth from 'mammoth';
import type { QuestionPayload } from '@/hooks/use-quizzes';

export interface ParsedQuestionError {
  questionNumber: number;
  text: string;
  reason: string;
}

export interface ParseQuizDocxResult {
  questions: QuestionPayload[];
  errors: ParsedQuestionError[];
}

const LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

const QUESTION_START = /^(\d+)[.)]\s*(.*)$/;
const OPTION_LINE = /^([A-Fa-f])[).]\s*(.+)$/;
const ANSWER_LINE = /^(?:javob|namuna javob)\s*:\s*(.*)$/i;
const POINTS_LINE = /^ball\s*:\s*(\d+)\s*$/i;

// O'zbekcha apostrof turlari (to'g'ri/noto'g'ri'ni solishtirish uchun) olib tashlanadi.
function normalize(s: string) {
  return s
    .toLowerCase()
    .replace(/[ʻʼ'’`´]/g, '')
    .trim();
}

interface Block {
  number: number;
  lines: string[];
}

function splitIntoBlocks(rawText: string): Block[] {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const blocks: Block[] = [];
  for (const line of lines) {
    const match = line.match(QUESTION_START);
    if (match) {
      blocks.push({ number: Number(match[1]), lines: match[2] ? [match[2]] : [] });
    } else if (blocks.length > 0) {
      blocks[blocks.length - 1].lines.push(line);
    }
  }
  return blocks;
}

function parseBlock(block: Block): QuestionPayload | ParsedQuestionError {
  const textLines: string[] = [];
  const options: { text: string; correct: boolean }[] = [];
  let sampleAnswer: string | undefined;
  let points = 1;

  for (const line of block.lines) {
    const optMatch = line.match(OPTION_LINE);
    const ansMatch = line.match(ANSWER_LINE);
    const ptsMatch = line.match(POINTS_LINE);

    if (optMatch) {
      let text = optMatch[2].trim();
      const correct = /\*\s*$/.test(text);
      if (correct) text = text.replace(/\*\s*$/, '').trim();
      options.push({ text, correct });
    } else if (ansMatch) {
      sampleAnswer = ansMatch[1].trim() || undefined;
    } else if (ptsMatch) {
      points = Number(ptsMatch[1]) || 1;
    } else if (options.length === 0 && sampleAnswer === undefined) {
      textLines.push(line);
    }
  }

  const text = textLines.join(' ').trim();
  if (!text) {
    return { questionNumber: block.number, text: '', reason: 'Savol matni topilmadi' };
  }

  if (options.length === 0) {
    return { text, type: 'open_ended', points, sampleAnswer };
  }

  const normalized = options.map((o) => normalize(o.text));
  const isTrueFalse =
    options.length === 2 &&
    normalized.includes('togri') &&
    normalized.includes('notogri');

  const correctIdx = options.findIndex((o) => o.correct);

  if (isTrueFalse) {
    if (correctIdx === -1) {
      return { questionNumber: block.number, text, reason: "To'g'ri javob * bilan belgilanmagan" };
    }
    return {
      text,
      type: 'true_false',
      points,
      correctAnswer: normalize(options[correctIdx].text) === 'togri',
      options: [
        { label: 'A', text: "To'g'ri" },
        { label: 'B', text: "Noto'g'ri" },
      ],
    };
  }

  if (options.length < 2) {
    return { questionNumber: block.number, text, reason: 'Kamida 2 ta variant kerak' };
  }
  if (correctIdx === -1) {
    return { questionNumber: block.number, text, reason: "To'g'ri javob * bilan belgilanmagan" };
  }

  return {
    text,
    type: 'multiple_choice',
    points,
    correctAnswer: correctIdx,
    options: options.map((o, i) => ({ label: LABELS[i] ?? String(i + 1), text: o.text })),
  };
}

function isError(value: QuestionPayload | ParsedQuestionError): value is ParsedQuestionError {
  return 'questionNumber' in value;
}

export async function parseQuizDocx(file: File): Promise<ParseQuizDocxResult> {
  const arrayBuffer = await file.arrayBuffer();
  const { value: rawText } = await mammoth.extractRawText({ arrayBuffer });

  const blocks = splitIntoBlocks(rawText);
  const questions: QuestionPayload[] = [];
  const errors: ParsedQuestionError[] = [];

  for (const block of blocks) {
    const result = parseBlock(block);
    if (isError(result)) {
      errors.push(result);
    } else {
      questions.push(result);
    }
  }

  return { questions, errors };
}
