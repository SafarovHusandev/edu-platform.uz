// Bu skript baraban savollari uchun na'muna Word (.docx) faylini generatsiya qiladi
// — natija public/templates/baraban-savollari-namunasi.docx'ga yoziladi va shu fayl
// admin paneldagi "Fayldan yuklash" oynasida yuklab olish uchun ishlatiladi.
// Qayta generatsiya qilish uchun: node scripts/generate-spin-template.mjs
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';

const __dirname = dirname(fileURLToPath(import.meta.url));

function heading(text) {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_1 });
}

function sub(text) {
  return new Paragraph({ children: [new TextRun({ text, italics: true })] });
}

function p(text) {
  return new Paragraph({ text });
}

function blank() {
  return new Paragraph({ text: '' });
}

function question(number, text, options) {
  return [
    p(`${number}. ${text}`),
    ...options.map((option, i) => p(`${'ABCD'[i]}) ${option}`)),
    blank(),
  ];
}

const doc = new Document({
  sections: [
    {
      children: [
        heading('Baraban savollari — naʼmuna fayl'),
        sub(
          "Har bir savol raqam bilan boshlanadi (1. 2. 3. ...). Har bir savolda aniq 4 ta variant " +
            "bo'lishi kerak: A) B) C) D). To'g'ri javob oxiriga * (yulduzcha) qo'yiladi. Pastdagi " +
            "savollarni o'chirib, o'z savollaringizni shu formatda yozing."
        ),
        sub(
          "Toifa va sinf fayl yuklanayotganda tanlanadi, shuning uchun bitta faylga bir sinfning " +
            'savollarini yoki faqat mantiqiy savollarni yozing.'
        ),
        blank(),

        ...question(1, "O'zbekistonning poytaxti qaysi shahar?", [
          'Samarqand',
          'Toshkent *',
          'Buxoro',
          'Xiva',
        ]),
        ...question(2, 'Bir haftada necha kun bor?', ['5', '6', '7 *', '8']),
        ...question(3, "Ketma-ketlikni davom ettiring: 2, 4, 8, 16, ...", [
          '18',
          '24',
          '32 *',
          '64',
        ]),
      ],
    },
  ],
});

const buffer = await Packer.toBuffer(doc);
const outPath = join(__dirname, '..', 'public', 'templates', 'baraban-savollari-namunasi.docx');
writeFileSync(outPath, buffer);
console.log('Yozildi:', outPath);
