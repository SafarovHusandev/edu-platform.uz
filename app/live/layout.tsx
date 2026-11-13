import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Jonli viktorina',
  description: "PIN kodni kiriting va o'yinga qo'shiling",
};

export const viewport: Viewport = {
  themeColor: '#141B3D',
};

// Ishtirokchi sahifasi: public, minimal mobil layout (o'qituvchi paneli yo'q)
export default function LiveLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dark flex min-h-svh flex-col bg-[#141B3D] text-white antialiased">{children}</div>
  );
}
