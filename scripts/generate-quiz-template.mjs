// Bu skript o'qituvchilar uchun na'muna Word (.docx) faylini generatsiya qiladi
// — natija public/templates/savol-namunasi.docx'ga yoziladi va shu fayl
// "Word fayldan yuklash" dialogida yuklab olish uchun ishlatiladi.
// Qayta generatsiya qilish uchun: node scripts/generate-quiz-template.mjs
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

const doc = new Document({
  sections: [
    {
      children: [
        heading('Test savollari — naʼmuna fayl'),
        sub(
          "Har bir savol raqam bilan boshlanadi (1. 2. 3. ...). Variantlar A) B) C) D) shaklida, " +
            "to'g'ri javob oxiriga * (yulduzcha) qo'yiladi. Shu tartibni saqlab, pastdagi savollarni " +
            "o'chirib, o'z savollaringizni shu formatda yozing."
        ),
        blank(),

        p("1. O'zbekiston poytaxti qaysi shahar?"),
        p('A) Samarqand'),
        p('B) Buxoro'),
        p('C) Toshkent *'),
        p("D) Andijon"),
        blank(),

        p('2. Quyosh — bu sayyora.'),
        p("A) To'g'ri"),
        p("B) Noto'g'ri *"),
        blank(),

        p('3. Nyutonning birinchi qonunini o’z so‘zlaringiz bilan tushuntiring.'),
        p("Javob: Jism unga ta'sir etuvchi kuchlar yig'indisi nolga teng bo'lsa, tinch holatini yoki to'g'ri chiziqli tekis harakatini saqlaydi."),
        blank(),

        sub(
          "Izoh: 2-savoldagi kabi To'g'ri/Noto'g'ri savollarda ikkita variant bo'lishi shart. " +
            "3-savoldagi kabi \"Javob:\" qatori ochiq savollar uchun ixtiyoriy namuna javobdir " +
            "(variantlar bo'lmasa, savol avtomatik ochiq savol deb olinadi). Ball ko'rsatish uchun " +
            "savol oxiriga \"Ball: 2\" qatorini qo'shishingiz mumkin (ko'rsatilmasa, 1 ball)."
        ),
      ],
    },
  ],
});

const buffer = await Packer.toBuffer(doc);
const outPath = join(__dirname, '..', 'public', 'templates', 'savol-namunasi.docx');
writeFileSync(outPath, buffer);
console.log('Yozildi:', outPath);
