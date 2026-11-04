"use client";

import { startTransition, useActionState, useState } from "react";
import { AlertCircle, CircleCheck, Loader2, Upload } from "lucide-react";
import { FileDropzone } from "@/components/file-dropzone";
import { Button } from "@/components/ui/button";
import {
  extensionOf,
  MANUAL_TRANSCRIPT_ACCEPT,
  MANUAL_TRANSCRIPT_EXTENSIONS,
  MANUAL_TRANSCRIPT_MESSAGES,
  MAX_MANUAL_TRANSCRIPT_BYTES,
} from "@/lib/transcription/manual";
import { uploadTranscriptAction, type UploadTranscriptState } from "./actions";

const initialState: UploadTranscriptState = {};

// Revisión rápida en el navegador para avisar antes de subir. El servidor vuelve a validar todo.
function quickCheck(file: File): string | null {
  if (!(MANUAL_TRANSCRIPT_EXTENSIONS as readonly string[]).includes(extensionOf(file.name))) {
    return MANUAL_TRANSCRIPT_MESSAGES.invalidFormat;
  }
  if (file.size === 0) return MANUAL_TRANSCRIPT_MESSAGES.empty;
  if (file.size > MAX_MANUAL_TRANSCRIPT_BYTES) return MANUAL_TRANSCRIPT_MESSAGES.tooLarge;
  return null;
}

// HU17: carga manual de la transcripción (.vtt o .txt) cuando no se pudo obtener desde Zoom
export function ManualTranscriptForm({ courseId, classId }: { courseId: string; classId: string }) {
  const [state, formAction, pending] = useActionState(uploadTranscriptAction, initialState);
  const [file, setFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  // El error del servidor se muestra hasta que el estudiante elige otro archivo
  const [showServerError, setShowServerError] = useState(false);

  function handleFileChange(next: File | null) {
    setFile(next);
    setShowServerError(false);
    setLocalError(next ? quickCheck(next) : null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setLocalError(MANUAL_TRANSCRIPT_MESSAGES.noFile);
      return;
    }
    const problem = quickCheck(file);
    if (problem) {
      setLocalError(problem);
      return;
    }

    const formData = new FormData();
    formData.append("courseId", courseId);
    formData.append("classId", classId);
    formData.append("transcript", file);
    setShowServerError(true);
    startTransition(() => formAction(formData));
  }

  if (state.status === "done") {
    return (
      <p role="status" className="flex items-center gap-2 text-sm text-green-400">
        <CircleCheck className="size-4" aria-hidden />
        Transcripción guardada. Ya puedes generar el resumen y el cuestionario.
      </p>
    );
  }

  const error = localError ?? (showServerError && state.status === "error" ? state.message : null);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <FileDropzone
        id={`transcript-${classId}`}
        accept={MANUAL_TRANSCRIPT_ACCEPT}
        file={file}
        onFileChange={handleFileChange}
        disabled={pending}
        label="Arrastra la transcripción aquí o haz clic para elegirla"
        hint=".vtt o .txt, hasta 800 KB"
      />

      {error && !pending && (
        <p role="alert" className="flex items-start gap-2 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}

      <Button type="submit" disabled={pending || !file || Boolean(localError)} className="self-start">
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Upload aria-hidden />}
        {pending ? "Subiendo…" : "Subir transcripción"}
      </Button>
    </form>
  );
}
