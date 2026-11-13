'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import MDEditor, { commands, type ICommand } from '@uiw/react-md-editor/nohighlight';
import rehypeSanitize from 'rehype-sanitize';
import { ImagePlus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { uploadLiveQuizImage } from '@/hooks/use-live-quizzes';
import {
  LIVE_IMAGE_TYPES,
  LIVE_LIMITS,
  countMarkdownImages,
  toServerUrl,
  validateImageFile,
} from '@/lib/live-quiz';
import { cn } from '@/lib/utils';

// Savol matni muharriri. Rasm base64 sifatida QO'SHILMAYDI (backend rad etadi va
// har savolda o'nlab telefonga yuborilib internetni bo'g'adi) — avval serverga
// yuklanadi, keyin matnga havola qo'shiladi. Paste, drag-drop va toolbar tugmasi.
export function MarkdownField({
  value,
  onChange,
  invalid,
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  id?: string;
}) {
  const { resolvedTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  // Ketma-ket yuklashlarda oxirgi matn (prop hali yangilanmagan bo'lishi mumkin)
  const latestRef = useRef(value);
  useEffect(() => {
    latestRef.current = value;
  }, [value]);

  const imageCount = countMarkdownImages(value);
  const limitReached = imageCount >= LIVE_LIMITS.imagesPerText;

  async function insertImages(files: File[]) {
    const images = files.filter((f) => f.type.startsWith('image/'));
    if (!images.length) return;
    for (const file of images) {
      if (countMarkdownImages(latestRef.current) >= LIVE_LIMITS.imagesPerText) {
        toast.error("Matnda ko'pi bilan 3 ta rasm bo'lishi mumkin");
        return;
      }
      const problem = validateImageFile(file);
      if (problem) {
        toast.error(problem);
        continue;
      }
      setUploading((n) => n + 1);
      try {
        const path = await uploadLiveQuizImage(file);
        const alt = file.name.replace(/\.[^.]+$/, '').replace(/[[\]]/g, '');
        const next = `${latestRef.current}${latestRef.current && !latestRef.current.endsWith('\n') ? '\n' : ''}![${alt}](${path})\n`;
        if (next.length > LIVE_LIMITS.textMax) {
          toast.error('Matn 2000 belgidan oshib ketadi');
          return;
        }
        latestRef.current = next;
        onChange(next);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Rasmni yuklab bo'lmadi");
      } finally {
        setUploading((n) => n - 1);
      }
    }
  }

  const imageCommand: ICommand = useMemo(
    () => ({
      name: 'image',
      keyCommand: 'image',
      buttonProps: { 'aria-label': "Rasm qo'shish", title: "Rasm qo'shish (JPG/PNG/WEBP, ≤5 MB)" },
      icon: <ImagePlus className="size-3.5" />,
      execute: () => fileInputRef.current?.click(),
    }),
    []
  );

  const toolbar = useMemo(
    () => [
      commands.bold,
      commands.italic,
      commands.strikethrough,
      commands.divider,
      commands.quote,
      commands.code,
      commands.divider,
      commands.unorderedListCommand,
      commands.orderedListCommand,
      commands.divider,
      imageCommand,
    ],
    [imageCommand]
  );

  return (
    <div
      className={cn(
        'live-md-editor relative rounded-xl',
        invalid && 'ring-2 ring-destructive',
        dragOver && 'ring-2 ring-primary'
      )}
      data-color-mode={resolvedTheme === 'dark' ? 'dark' : 'light'}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes('Files')) {
          e.preventDefault();
          setDragOver(true);
        }
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        setDragOver(false);
        if (e.dataTransfer.files.length) {
          e.preventDefault();
          insertImages(Array.from(e.dataTransfer.files));
        }
      }}
    >
      <MDEditor
        value={value}
        onChange={(v) => onChange(v ?? '')}
        height={190}
        preview="edit"
        commands={toolbar}
        extraCommands={[commands.codeEdit, commands.codeLive, commands.codePreview]}
        visibleDragbar={false}
        textareaProps={{
          id,
          maxLength: LIVE_LIMITS.textMax,
          placeholder: 'Savol matni... (rasmni shu yerga tashlang yoki joylang)',
          onPaste: (e) => {
            const files = Array.from(e.clipboardData.files);
            if (files.some((f) => f.type.startsWith('image/'))) {
              e.preventDefault();
              insertImages(files);
            }
          },
        }}
        previewOptions={{
          rehypePlugins: [rehypeSanitize],
          className: 'live-md live-md-card',
          components: {
            img: ({ src, alt }) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={toServerUrl(typeof src === 'string' ? src : undefined)} alt={alt ?? ''} />
            ),
          },
        }}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept={LIVE_IMAGE_TYPES.join(',')}
        multiple
        hidden
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = '';
          if (limitReached) {
            toast.error("Matnda ko'pi bilan 3 ta rasm bo'lishi mumkin");
            return;
          }
          insertImages(files);
        }}
      />
      <div className="mt-1.5 flex items-center justify-between gap-2 px-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          {uploading > 0 ? (
            <>
              <Loader2 className="size-3.5 animate-spin" /> Rasm yuklanmoqda...
            </>
          ) : (
            `Rasmlar: ${imageCount}/${LIVE_LIMITS.imagesPerText}`
          )}
        </span>
        <span
          className={cn(
            'tabular-nums',
            value.length > LIVE_LIMITS.textMax * 0.9 && 'font-semibold text-destructive'
          )}
        >
          {value.length}/{LIVE_LIMITS.textMax}
        </span>
      </div>
    </div>
  );
}
