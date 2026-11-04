"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, CircleCheck, CircleX, History, Loader2, RotateCcw, RotateCw, Trophy } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QUIZ_QUESTIONS, scoreQuiz, type Quiz } from "@/lib/quiz/schema";
import { saveQuizAttemptAction } from "./actions";

const LETTERS = ["A", "B", "C"];

type SaveStatus = { state: "idle" | "saving" | "saved" } | { state: "error"; message: string };

// Id del intento. Lo genera el navegador para que reintentar el guardado no cree un intento duplicado.
function newAttemptId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

// HU11, escenario 2: una pregunta por pantalla con «Pregunta n de 10» y, al terminar, el puntaje final.
// HU14: al terminar, el intento se guarda en «Mi historial»; resolverlo otra vez guarda un intento nuevo.
export function QuizRunner({ quiz, courseId, classId }: { quiz: Quiz; courseId: string; classId: string }) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Array<number | null>>(() => quiz.questions.map(() => null));
  const [finished, setFinished] = useState(false);
  const [save, setSave] = useState<SaveStatus>({ state: "idle" });
  const [, startTransition] = useTransition();
  const attemptId = useRef<string | null>(null);

  function saveAttempt(finalAnswers: Array<number | null>) {
    if (!attemptId.current) attemptId.current = newAttemptId();
    const id = attemptId.current;
    setSave({ state: "saving" });
    startTransition(async () => {
      try {
        const result = await saveQuizAttemptAction({
          courseId,
          classId,
          attemptId: id,
          answers: finalAnswers.map((value) => value ?? -1),
        });
        setSave(result.ok ? { state: "saved" } : { state: "error", message: result.message });
      } catch {
        setSave({ state: "error", message: "No pudimos guardar este intento en tu historial. Inténtalo de nuevo." });
      }
    });
  }

  if (finished) {
    return (
      <Results
        quiz={quiz}
        answers={answers}
        save={save}
        onRetrySave={() => saveAttempt(answers)}
        onRestart={() => {
          attemptId.current = null;
          setSave({ state: "idle" });
          setAnswers(quiz.questions.map(() => null));
          setCurrent(0);
          setFinished(false);
        }}
      />
    );
  }

  const question = quiz.questions[current];
  const selected = answers[current];
  const isLast = current === QUIZ_QUESTIONS - 1;

  function choose(index: number) {
    setAnswers((prev) => prev.map((value, i) => (i === current ? index : value)));
  }

  return (
    <Card>
      <CardHeader className="gap-3">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          Pregunta {current + 1} de {QUIZ_QUESTIONS}
        </p>
        <div
          className="h-1 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={QUIZ_QUESTIONS}
          aria-valuenow={current + 1}
          aria-label="Avance del cuestionario"
        >
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${((current + 1) / QUIZ_QUESTIONS) * 100}%` }}
          />
        </div>
        <CardTitle className="text-lg leading-snug break-words">{question.question}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div role="radiogroup" aria-label={question.question} className="flex flex-col gap-2">
          {question.choices.map((choice, index) => {
            const active = selected === index;
            return (
              <button
                key={index}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => choose(index)}
                className={`flex items-start gap-3 rounded-lg border p-3 text-left text-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
                  active ? "border-primary bg-primary/10" : "border-border hover:bg-muted"
                }`}
              >
                <span
                  className={`flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium ${
                    active ? "border-primary bg-primary text-primary-foreground" : "border-border"
                  }`}
                  aria-hidden
                >
                  {LETTERS[index]}
                </span>
                <span className="min-w-0 break-words">{choice}</span>
              </button>
            );
          })}
        </div>

        <div className="flex justify-end">
          {isLast ? (
            <Button
              disabled={selected === null}
              onClick={() => {
                setFinished(true);
                saveAttempt(answers);
              }}
            >
              <Trophy aria-hidden />
              Ver mi puntaje
            </Button>
          ) : (
            <Button disabled={selected === null} onClick={() => setCurrent((n) => n + 1)}>
              Siguiente
              <ArrowRight aria-hidden />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Results({
  quiz,
  answers,
  save,
  onRetrySave,
  onRestart,
}: {
  quiz: Quiz;
  answers: Array<number | null>;
  save: SaveStatus;
  onRetrySave: () => void;
  onRestart: () => void;
}) {
  const score = scoreQuiz(quiz, answers);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <Trophy className="size-6 text-muted-foreground" aria-hidden />
          </div>
          <p className="text-sm text-muted-foreground">Tu puntaje final</p>
          <p className="font-heading text-4xl" role="status">
            {score} de {QUIZ_QUESTIONS}
          </p>
          <SaveNotice save={save} onRetry={onRetrySave} />
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="outline" onClick={onRestart} disabled={save.state === "saving"}>
              <RotateCcw aria-hidden />
              Resolver de nuevo
            </Button>
            <Link href="/historial" className={buttonVariants({ variant: "ghost" })}>
              <History aria-hidden />
              Mi historial
            </Link>
          </div>
        </CardContent>
      </Card>

      <h2 className="font-heading text-lg">Revisión</h2>
      <ol className="flex flex-col gap-3">
        {quiz.questions.map((question, i) => {
          const right = answers[i] === question.correctIndex;
          return (
            <li key={i}>
              <Card>
                <CardContent className="flex flex-col gap-2">
                  <p className="flex items-start gap-2 font-medium break-words">
                    {right ? (
                      <CircleCheck className="mt-0.5 size-4 shrink-0 text-green-400" aria-label="Correcta" />
                    ) : (
                      <CircleX className="mt-0.5 size-4 shrink-0 text-destructive" aria-label="Incorrecta" />
                    )}
                    {i + 1}. {question.question}
                  </p>
                  <p className="text-sm break-words text-muted-foreground">
                    Respuesta correcta: {question.choices[question.correctIndex]}
                  </p>
                  {!right && answers[i] !== null && (
                    <p className="text-sm break-words text-destructive">
                      Tu respuesta: {question.choices[answers[i] as number]}
                    </p>
                  )}
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// HU14: estado del guardado del intento en el historial
function SaveNotice({ save, onRetry }: { save: SaveStatus; onRetry: () => void }) {
  if (save.state === "saving") {
    return (
      <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Guardando el intento en tu historial…
      </p>
    );
  }
  if (save.state === "saved") {
    return (
      <p role="status" className="flex items-center gap-2 text-sm text-green-400">
        <CircleCheck className="size-4" aria-hidden />
        Intento guardado en tu historial
      </p>
    );
  }
  if (save.state === "error") {
    return (
      <div className="flex flex-col items-center gap-2">
        <p role="alert" className="flex items-start gap-2 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {save.message}
        </p>
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RotateCw aria-hidden />
          Reintentar guardado
        </Button>
      </div>
    );
  }
  return null;
}
