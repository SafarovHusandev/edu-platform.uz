import type { Metadata } from 'next';
import { Container } from '@/components/layout/container';

export const metadata: Metadata = {
  title: 'Ommaviy oferta',
  description:
    "edu-platform.uz onlayn ta'lim xizmatlaridan foydalanish shartlari to'g'risidagi ommaviy oferta.",
};

const SECTIONS = [
  {
    title: '1. Asosiy tushunchalar',
    items: [
      'Platforma — edu-platform.uz veb-sayti va unga tegishli mobil/veb ilovalar.',
      "Xizmat ko'rsatuvchi — edu-platform.uz platformasi egasi, YaTT Safarov Husan Normamat o'g'li.",
      'Foydalanuvchi — platformada roʻyxatdan oʻtgan va/yoki xizmatlardan foydalanuvchi jismoniy shaxs.',
      'Xizmatlar — platforma orqali taqdim etiladigan onlayn darslar, testlar va kurslar.',
      'Tarif rejasi — "Standart" va "Premium" nomli xizmat ko\'rsatish shartlari toʻplami.',
      'Aksept — Foydalanuvchining ushbu Oferta shartlariga toʻliq rozilik bildirishi; roʻyxatdan oʻtish, kursga yozilish yoki toʻlovni amalga oshirish shu tariqa aksept hisoblanadi.',
      'Shaxsiy kabinet — Foydalanuvchi platformada roʻyxatdan oʻtgach kiradigan, oʻzining kurslari, testlari va toʻlovlari haqida maʼlumot koʻra oladigan shaxsiy sahifasi.',
      'Elektron aloqa kanali — Foydalanuvchi bilan bogʻlanishning har qanday elektron shakli, jumladan SMS-xabar, email yoki platforma ichidagi bildirishnomalar.',
      'Sayt — edu-platform.uz manzilida joylashgan Platformaning internet-resursi.',
      "Individual taklif — Xizmat ko'rsatuvchi tomonidan muayyan Foydalanuvchiga Elektron aloqa kanali orqali yuboriladigan, tanlangan kurs yoki tarif rejasiga oid maxsus shartlarni o'z ichiga olgan taklif hujjati.",
    ],
  },
  {
    title: '2. Oferta predmeti',
    paragraphs: [
      "2.1. Xizmat ko'rsatuvchi Foydalanuvchiga edu-platform.uz platformasi orqali quyidagi xizmatlarni taqdim etadi: onlayn darslar, bilimlarni tekshirish uchun testlar, video va matnli kurslar.",
      '2.2. Xizmatlar ikki tarif rejasi asosida taqdim etiladi:',
    ],
    items: [
      'Standart — platformaning asosiy funksiyalariga cheklangan yoki bepul kirish huquqini beruvchi tarif.',
      'Premium — toʻlov asosida barcha darslar, testlar va kurslarga toʻliq kirish huquqini beruvchi tarif.',
    ],
    trailingParagraphs: [
      "2.3. Har bir tarif rejasining aniq tarkibi, narxi va amal qilish muddati platformaning tegishli sahifasida koʻrsatiladi va Xizmat ko'rsatuvchi tomonidan bir tomonlama oʻzgartirilishi mumkin, biroq bu allaqachon toʻlangan xizmatlarga taʼsir qilmaydi.",
    ],
  },
  {
    title: "3. To'lov tartibi",
    paragraphs: [
      '3.1. Premium tarif rejasi uchun toʻlovlar Multicard toʻlov tizimi orqali amalga oshiriladi.',
      '3.2. Toʻlov Foydalanuvchi tomonidan bank kartasi maʼlumotlarini kiritish va tranzaksiyani tasdiqlash orqali amalga oshiriladi. Toʻlov muvaffaqiyatli yakunlangandan soʻng Foydalanuvchiga tegishli tarif reja doirasidagi xizmatlardan foydalanish huquqi beriladi.',
      "3.3. Toʻlov tizimidagi texnik nosozliklar yuzasidan Xizmat ko'rsatuvchi javobgar boʻlmaydi, biroq bunday holatlarda Foydalanuvchiga yordam koʻrsatish choralarini koʻradi.",
      '3.4. Notoʻgʻri yechilgan yoki ikki marta yechilgan mablagʻlar Foydalanuvchining murojaati asosida tekshirilib, tasdiqlangan taqdirda qaytariladi.',
    ],
  },
  {
    title: '4. Tomonlarning huquq va majburiyatlari',
    paragraphs: ["4.1. Xizmat ko'rsatuvchi majburiyatlari:"],
    items: [
      'Tanlangan tarif rejasiga muvofiq xizmatlarni sifatli taqdim etish;',
      'Platformaning barqaror ishlashini taʼminlash uchun choralar koʻrish;',
      'Foydalanuvchining shaxsiy maʼlumotlarini Maxfiylik siyosatiga muvofiq himoya qilish.',
    ],
    trailingParagraphs: ['4.2. Foydalanuvchi majburiyatlari:'],
    trailingItems: [
      'Roʻyxatdan oʻtishda haqiqiy maʼlumotlarni kiritish;',
      'Tanlangan tarif reja shartlariga muvofiq toʻlovni oʻz vaqtida amalga oshirish;',
      'Platforma orqali olingan materiallarni uchinchi shaxslarga tarqatmaslik yoki tijorat maqsadida ishlatmaslik.',
    ],
  },
  {
    title: '5. Tomonlarning javobgarligi',
    paragraphs: [
      "5.1. Xizmat ko'rsatuvchi platformadan foydalanish natijasida Foydalanuvchiga yetkazilgan bilvosita zararlar uchun javobgar boʻlmaydi.",
      '5.2. Foydalanuvchi platformadan Oʻzbekiston Respublikasi qonunchiligiga zid maqsadlarda foydalanganligi uchun mustaqil javobgar boʻladi.',
    ],
  },
  {
    title: '6. Shartnomani bekor qilish va mablagʻni qaytarish',
    paragraphs: [
      '6.1. Foydalanuvchi Premium tarifga yozilgandan soʻng, xizmatdan foydalanishni boshlamagan boʻlsa, toʻlov sanasidan 3 (uch) kun ichida mablagʻni qaytarishni talab qilishi mumkin.',
      '6.2. Xizmatdan foydalanish boshlangandan (masalan, kurs materiallariga kirilgandan) soʻng mablagʻ qaytarilmaydi, agar qonunchilikda boshqacha tartib nazarda tutilmagan boʻlsa.',
    ],
  },
  {
    title: '7. Nizolarni hal qilish tartibi',
    paragraphs: [
      '7.1. Ushbu Oferta yuzasidan kelib chiqadigan barcha nizolar tomonlar oʻrtasida muzokaralar yoʻli bilan hal qilinadi.',
      '7.2. Kelishuvga erishilmagan taqdirda, nizolar Oʻzbekiston Respublikasi qonunchiligida belgilangan tartibda sud orqali hal qilinadi.',
    ],
  },
  {
    title: '8. Yakuniy qoidalar',
    paragraphs: [
      "8.1. Xizmat ko'rsatuvchi ushbu Oferta shartlarini bir tomonlama oʻzgartirish huquqiga ega. Yangi tahrir platformada eʼlon qilingan paytdan eʼtiboran kuchga kiradi.",
      '8.2. Ushbu Oferta muddatsiz amal qiladi.',
    ],
  },
];

const REKVIZITLAR = [
  ['Yakka tartibdagi tadbirkor', "Safarov Husan Normamat o'g'li"],
  ["Ro'yxat raqami (YaTT)", '7594647'],
  ['STIR', '611478387'],
  ['Telefon', '+998 90 676 29 20'],
  ['Veb-sayt', 'edu-platform.uz'],
];

export default function OfertaPage() {
  return (
    <Container className="max-w-3xl py-16">
      <h1 className="font-heading text-3xl font-semibold tracking-tight">Ommaviy oferta</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        edu-platform.uz onlayn ta&apos;lim xizmatlaridan foydalanish shartlari to&apos;g&apos;risida
      </p>

      <p className="mt-8 text-sm leading-relaxed text-muted-foreground">
        Ushbu hujjat Oʻzbekiston Respublikasi Fuqarolik kodeksining 369-370- moddalariga,
        &quot;Elektron tijorat toʻgʻrisida&quot;gi Qonunga, Vazirlar Mahkamasining 2016-yil
        2-iyundagi 185-son qarori bilan tasdiqlangan &quot;Elektron tijoratni amalga oshirish
        qoidalari&quot;ga hamda &quot;Isteʼmolchilarning huquqlarini himoya qilish
        toʻgʻrisida&quot;gi Qonunga muvofiq ommaviy oferta (taklif) hisoblanadi va yakka tartibdagi
        tadbirkor Safarov Husan Normamat o&apos;g&apos;li (F.I.Sh.) (bundan buyon matnda
        &quot;Xizmat ko&apos;rsatuvchi&quot; deb yuritiladi) tomonidan edu-platform.uz
        platformasidan foydalanuvchi shaxslarga (bundan buyon &quot;Foydalanuvchi&quot;) qaratilgan.
      </p>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Foydalanuvchi platformada roʻyxatdan oʻtishi, kursga yozilishi yoki xizmat uchun toʻlov
        amalga oshirishi bilan ushbu Oferta shartlarini toʻliq va soʻzsiz qabul qilgan hisoblanadi
        (aksept).
      </p>

      <div className="mt-10 space-y-10">
        {SECTIONS.map((section) => (
          <section key={section.title}>
            <h2 className="font-heading text-xl font-semibold tracking-tight">{section.title}</h2>
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
              {section.paragraphs?.map((p) => (
                <p key={p}>{p}</p>
              ))}
              {section.items && (
                <ul className="list-disc space-y-2 pl-5">
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
              {section.trailingParagraphs?.map((p) => (
                <p key={p}>{p}</p>
              ))}
              {section.trailingItems && (
                <ul className="list-disc space-y-2 pl-5">
                  {section.trailingItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        ))}

        <section>
          <h2 className="font-heading text-xl font-semibold tracking-tight">
            9. Xizmat ko&apos;rsatuvchi rekvizitlari
          </h2>
          <dl className="mt-3 divide-y divide-border/60 rounded-lg border border-border/60 text-sm">
            {REKVIZITLAR.map(([label, value]) => (
              <div
                key={label}
                className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="font-medium text-foreground">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </Container>
  );
}
