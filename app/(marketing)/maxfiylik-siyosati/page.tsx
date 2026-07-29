import type { Metadata } from "next"
import { Container } from "@/components/layout/container"

export const metadata: Metadata = {
  title: "Maxfiylik siyosati",
  description:
    "edu-platform.uz platformasi foydalanuvchilarining shaxsiy maʼlumotlarini qayta ishlash tartibi toʻgʻrisida.",
}

const SECTIONS = [
  {
    title: "1. Yigʻiladigan maʼlumotlar",
    paragraphs: ["Platformadan foydalanish jarayonida quyidagi maʼlumotlar yigʻilishi mumkin:"],
    items: [
      "Roʻyxatdan oʻtishda taqdim etiladigan maʼlumotlar: ism, familiya, telefon raqami, email manzil;",
      "Toʻlov bilan bogʻliq maʼlumotlar: Multicard toʻlov tizimi orqali amalga oshirilgan tranzaksiyalar toʻgʻrisidagi maʼlumotlar (bank karta raqami Xizmat ko'rsatuvchida saqlanmaydi, u toʻgʻridan-toʻgʻri Multicard tizimi tomonidan qayta ishlanadi);",
      "Foydalanish maʼlumotlari: kirilgan darslar, testlar natijalari, kurslardagi faoliyat statistikasi;",
      "Texnik maʼlumotlar: IP-manzil, qurilma turi, brauzer turi, cookie-fayllar orqali yigʻiladigan maʼlumotlar.",
    ],
  },
  {
    title: "2. Maʼlumotlardan foydalanish maqsadlari",
    paragraphs: ["Yigʻilgan maʼlumotlardan quyidagi maqsadlarda foydalaniladi:"],
    items: [
      "Foydalanuvchini roʻyxatdan oʻtkazish va shaxsiy kabinetini yuritish;",
      "Standart va Premium tarif rejalari boʻyicha xizmatlarni taqdim etish;",
      "Toʻlovlarni Multicard toʻlov tizimi orqali amalga oshirish va tasdiqlash;",
      "Foydalanuvchiga texnik yordam koʻrsatish va bildirishnomalar yuborish;",
      "Platforma xavfsizligini taʼminlash va suiisteʼmol holatlarining oldini olish.",
    ],
  },
  {
    title: "3. Maʼlumotlarni uchinchi shaxslarga uzatish",
    paragraphs: [
      "3.1. Xizmat ko'rsatuvchi Foydalanuvchining shaxsiy maʼlumotlarini uning roziligisiz uchinchi shaxslarga sotmaydi va tijorat maqsadida taqdim etmaydi.",
      "3.2. Toʻlovlarni amalga oshirish maqsadida zarur boʻlgan maʼlumotlar Multicard toʻlov tizimiga, faqat tranzaksiyani yakunlash uchun zarur hajmda uzatiladi.",
      "3.3. Maʼlumotlar Oʻzbekiston Respublikasi qonunchiligida belgilangan hollarda vakolatli davlat organlarining qonuniy soʻrovi asosida taqdim etilishi mumkin.",
    ],
  },
  {
    title: "4. Maʼlumotlarni saqlash va himoya qilish",
    paragraphs: [
      "4.1. Xizmat ko'rsatuvchi Foydalanuvchi maʼlumotlarini ruxsatsiz kirish, oʻzgartirish, oshkor qilish yoki yoʻqotishdan himoya qilish uchun zarur texnik va tashkiliy choralarni koʻradi.",
      "4.2. Maʼlumotlar Foydalanuvchi platformadan foydalanishni davom ettirgan davrda, shuningdek qonunchilikda belgilangan muddatlarga muvofiq saqlanadi.",
    ],
  },
  {
    title: "5. Cookie-fayllar",
    paragraphs: [
      "Platforma foydalanuvchi tajribasini yaxshilash, sessiyani saqlash va statistik tahlil maqsadida cookie-fayllardan foydalanadi. Foydalanuvchi brauzer sozlamalari orqali cookie-fayllarni oʻchirib qoʻyishi mumkin, biroq bu holda platformaning ayrim funksiyalari toʻliq ishlamasligi mumkin.",
    ],
  },
  {
    title: "6. Foydalanuvchining huquqlari",
    paragraphs: ["Foydalanuvchi quyidagi huquqlarga ega:"],
    items: [
      "Oʻzi haqidagi qanday maʼlumotlar saqlanayotgani toʻgʻrisida maʼlumot olish;",
      "Notoʻgʻri yoki eskirgan maʼlumotlarni tuzatishni soʻrash;",
      "Qonunchilikka zid boʻlmagan holatlarda maʼlumotlarini oʻchirishni yoki qayta ishlashni toʻxtatishni soʻrash;",
      "Xizmat ko'rsatuvchiga murojaat qilish orqali oʻz hisobini faolsizlantirishni yoki platformadan foydalanishni toʻxtatishni soʻrash. Hozirgi holatda Platformada hisobni mustaqil (avtomatik) oʻchirish funksiyasi mavjud emas — bunday soʻrovlar Xizmat ko'rsatuvchi tomonidan qoʻlda koʻrib chiqiladi va bajariladi.",
    ],
  },
  {
    title: "7. Siyosatga oʻzgartirish kiritish",
    paragraphs: [
      "Xizmat ko'rsatuvchi ushbu Siyosatni istalgan vaqtda bir tomonlama yangilash huquqiga ega. Yangilangan tahrir platformada eʼlon qilingan paytdan eʼtiboran kuchga kiradi. Foydalanuvchiga platformadan foydalanishni davom ettirishi orqali yangi tahrirga rozilik bildirgan hisoblanadi.",
    ],
  },
]

const ALOQA = [
  ["Yakka tartibdagi tadbirkor", "Safarov Husan Normamat o'g'li"],
  ["Telefon", "+998 90 676 29 20"],
  ["Veb-sayt", "edu-platform.uz"],
]

export default function PrivacyPolicyPage() {
  return (
    <Container className="max-w-3xl py-16">
      <h1 className="font-heading text-3xl font-semibold tracking-tight">
        Maxfiylik siyosati
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        edu-platform.uz platformasi foydalanuvchilarining shaxsiy
        maʼlumotlarini qayta ishlash tartibi toʻgʻrisida
      </p>

      <p className="mt-8 text-sm leading-relaxed text-muted-foreground">
        Ushbu Maxfiylik siyosati (bundan buyon — &quot;Siyosat&quot;) Oʻzbekiston
        Respublikasining &quot;Shaxsga doir maʼlumotlar toʻgʻrisida&quot;gi
        Qonuniga muvofiq ishlab chiqilgan boʻlib, edu-platform.uz platformasi
        (bundan buyon — &quot;Platforma&quot;) orqali yakka tartibdagi
        tadbirkor Safarov Husan Normamat o&apos;g&apos;li (bundan buyon —
        &quot;Xizmat ko&apos;rsatuvchi&quot;) tomonidan Foydalanuvchilarning
        shaxsiy maʼlumotlari qanday yigʻilishi, ishlatilishi, saqlanishi va
        himoya qilinishini belgilaydi.
      </p>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Platformadan foydalanish orqali Foydalanuvchi ushbu Siyosat
        shartlariga rozilik bildirgan hisoblanadi.
      </p>

      <div className="mt-10 space-y-10">
        {SECTIONS.map((section) => (
          <section key={section.title}>
            <h2 className="font-heading text-xl font-semibold tracking-tight">
              {section.title}
            </h2>
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
              {section.paragraphs?.map((p) => <p key={p}>{p}</p>)}
              {section.items && (
                <ul className="list-disc space-y-2 pl-5">
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        ))}

        <section>
          <h2 className="font-heading text-xl font-semibold tracking-tight">
            8. Aloqa maʼlumotlari
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Maxfiylik siyosati yuzasidan savol yoki murojaatlar boʻyicha
            quyidagi aloqa maʼlumotlari orqali bogʻlanishingiz mumkin:
          </p>
          <dl className="mt-3 divide-y divide-border/60 rounded-lg border border-border/60 text-sm">
            {ALOQA.map(([label, value]) => (
              <div key={label} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="font-medium text-foreground">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </Container>
  )
}
