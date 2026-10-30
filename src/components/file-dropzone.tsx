"use client";

import { useRef, useState } from "react";
import { FileText, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FileDropzoneProps {
  id: string;
  accept: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
  disabled?: boolean;
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Zona para elegir un archivo haciendo clic o arrastrándolo. Se puede usar con el teclado:
// el <input> real queda oculto pero enfocable y la etiqueta lo activa.
export function FileDropzone({ id, accept, file, onFileChange, disabled }: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function clear() {
    // Se vacía el input para poder volver a elegir el mismo archivo
    if (inputRef.current) inputRef.current.value = "";
    onFileChange(null);
  }

  function handleDrop(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) onFileChange(dropped);
  }

  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        data-slot="file-dropzone"
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-input px-4 py-8 text-center transition-colors",
          "has-[:focus-visible]:border-ring has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
          "hover:bg-muted/50",
          dragging && "border-primary bg-primary/10",
          disabled && "pointer-events-none cursor-not-allowed opacity-50",
        )}
      >
        <Upload className="size-6 text-muted-foreground" aria-hidden />
        <span className="text-sm font-medium">Arrastra tu sílabo aquí o haz clic para elegirlo</span>
        <span className="text-xs text-muted-foreground">PDF, hasta 5 MB</span>
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={accept}
          disabled={disabled}
          className="sr-only"
          onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
        />
      </label>

      {file && (
        <div className="flex items-center gap-3 rounded-lg border border-input bg-input/30 px-3 py-2">
          <FileText className="size-5 shrink-0 text-muted-foreground" aria-hidden />
          <div className="min-w-0 flex-1 text-left">
            <p className="truncate text-sm font-medium">{file.name}</p>
            <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Quitar archivo"
            onClick={clear}
            disabled={disabled}
          >
            <X />
          </Button>
        </div>
      )}
    </div>
  );
}
