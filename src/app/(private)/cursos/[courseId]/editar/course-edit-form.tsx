"use client";

import { useActionState, useState } from "react";
import { AlertCircle, ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  COURSE_EDIT_MESSAGES,
  COURSE_NAME_MAX_LENGTH,
  COURSE_TITLE_MAX_LENGTH,
} from "@/lib/courses/edit";
import { editCourseAction, type EditCourseState } from "./actions";

// Cada fila lleva un `key` propio para que React no mezcle los campos al mover o quitar filas
type SessionDraft = { key: string; title: string };
type UnitDraft = { key: string; title: string; sessions: SessionDraft[] };

export type CourseDraft = {
  name: string;
  units: { title: string; sessions: { title: string }[] }[];
};

const initialState: EditCourseState = {};

let keyCounter = 0;
const newKey = () => `k${++keyCounter}`;

function toDraft(course: CourseDraft): { name: string; units: UnitDraft[] } {
  return {
    name: course.name,
    units: course.units.map((unit) => ({
      key: newKey(),
      title: unit.title,
      sessions: unit.sessions.map((session) => ({ key: newKey(), title: session.title })),
    })),
  };
}

// Mueve un elemento una posición arriba (-1) o abajo (+1)
function move<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction;
  if (target < 0 || target >= items.length) return items;
  const copy = [...items];
  [copy[index], copy[target]] = [copy[target], copy[index]];
  return copy;
}

export function CourseEditForm({ courseId, course }: { courseId: string; course: CourseDraft }) {
  const [state, formAction, pending] = useActionState(editCourseAction, initialState);
  const [draft, setDraft] = useState(() => toDraft(course));

  const hasEmptyTitle =
    draft.units.some((u) => !u.title.trim() || u.sessions.some((s) => !s.title.trim()));
  const canSubmit = draft.name.trim() !== "" && !hasEmptyTitle;

  const setUnits = (update: (units: UnitDraft[]) => UnitDraft[]) =>
    setDraft((d) => ({ ...d, units: update(d.units) }));
  const setUnit = (index: number, update: (unit: UnitDraft) => UnitDraft) =>
    setUnits((units) => units.map((u, i) => (i === index ? update(u) : u)));

  // Solo se manda lo que el estudiante escribe y el orden. Los números los calcula el servidor.
  const payload = JSON.stringify({
    name: draft.name,
    units: draft.units.map((u) => ({
      title: u.title,
      sessions: u.sessions.map((s) => ({ title: s.title })),
    })),
  });

  return (
    <form action={formAction} noValidate className="flex flex-col gap-6">
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="course" value={payload} />

      {state.formError && (
        <Alert variant="destructive">
          <AlertCircle aria-hidden />
          <AlertDescription className="text-destructive">{state.formError}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Nombre del curso</Label>
        <Input
          id="name"
          autoComplete="off"
          maxLength={COURSE_NAME_MAX_LENGTH}
          value={draft.name}
          onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          aria-invalid={draft.name.trim() === ""}
          disabled={pending}
          className="h-10"
        />
        {draft.name.trim() === "" && (
          <p className="text-sm text-destructive">{COURSE_EDIT_MESSAGES.nameRequired}</p>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="font-heading text-lg">Unidades y sesiones</h2>

        {draft.units.length === 0 && (
          <p className="text-sm text-muted-foreground">Este curso todavía no tiene unidades.</p>
        )}

        {draft.units.map((unit, ui) => (
          <Card key={unit.key}>
            <CardHeader className="gap-2">
              <Label htmlFor={`unit-${unit.key}`}>Unidad {ui + 1}</Label>
              <div className="flex gap-2">
                <Input
                  id={`unit-${unit.key}`}
                  autoComplete="off"
                  maxLength={COURSE_TITLE_MAX_LENGTH}
                  value={unit.title}
                  onChange={(e) => setUnit(ui, (u) => ({ ...u, title: e.target.value }))}
                  aria-invalid={!unit.title.trim()}
                  disabled={pending}
                  className="h-10"
                />
                <RowButtons
                  label={`unidad ${ui + 1}`}
                  disabled={pending}
                  canUp={ui > 0}
                  canDown={ui < draft.units.length - 1}
                  onUp={() => setUnits((units) => move(units, ui, -1))}
                  onDown={() => setUnits((units) => move(units, ui, 1))}
                  onRemove={() => setUnits((units) => units.filter((_, i) => i !== ui))}
                />
              </div>
              {!unit.title.trim() && (
                <p className="text-sm text-destructive">{COURSE_EDIT_MESSAGES.unitTitleRequired}</p>
              )}
            </CardHeader>

            <CardContent className="flex flex-col gap-3">
              {unit.sessions.length === 0 && (
                <p className="text-sm text-muted-foreground">Esta unidad no tiene sesiones.</p>
              )}

              {unit.sessions.map((session, si) => (
                <div key={session.key} className="flex flex-col gap-1">
                  <div className="flex gap-2">
                    <Input
                      aria-label={`Título de la sesión ${si + 1} de la unidad ${ui + 1}`}
                      autoComplete="off"
                      maxLength={COURSE_TITLE_MAX_LENGTH}
                      value={session.title}
                      onChange={(e) =>
                        setUnit(ui, (u) => ({
                          ...u,
                          sessions: u.sessions.map((s, i) =>
                            i === si ? { ...s, title: e.target.value } : s,
                          ),
                        }))
                      }
                      aria-invalid={!session.title.trim()}
                      disabled={pending}
                      className="h-9"
                    />
                    <RowButtons
                      label={`sesión ${si + 1} de la unidad ${ui + 1}`}
                      disabled={pending}
                      canUp={si > 0}
                      canDown={si < unit.sessions.length - 1}
                      onUp={() => setUnit(ui, (u) => ({ ...u, sessions: move(u.sessions, si, -1) }))}
                      onDown={() => setUnit(ui, (u) => ({ ...u, sessions: move(u.sessions, si, 1) }))}
                      onRemove={() =>
                        setUnit(ui, (u) => ({ ...u, sessions: u.sessions.filter((_, i) => i !== si) }))
                      }
                    />
                  </div>
                  {!session.title.trim() && (
                    <p className="text-sm text-destructive">{COURSE_EDIT_MESSAGES.sessionTitleRequired}</p>
                  )}
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="self-start"
                disabled={pending}
                onClick={() =>
                  setUnit(ui, (u) => ({ ...u, sessions: [...u.sessions, { key: newKey(), title: "" }] }))
                }
              >
                <Plus aria-hidden />
                Agregar sesión
              </Button>
            </CardContent>
          </Card>
        ))}

        <Button
          type="button"
          variant="outline"
          className="self-start"
          disabled={pending}
          onClick={() => setUnits((units) => [...units, { key: newKey(), title: "", sessions: [] }])}
        >
          <Plus aria-hidden />
          Agregar unidad
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <Button type="submit" size="lg" className="h-10 w-full" disabled={!canSubmit || pending}>
          {pending ? "Guardando cambios…" : "Guardar cambios"}
        </Button>
        {!canSubmit && (
          <p className="text-center text-xs text-muted-foreground">
            Completa el nombre y todos los títulos para guardar.
          </p>
        )}
      </div>
    </form>
  );
}

// Subir, bajar y quitar una fila (unidad o sesión)
function RowButtons({
  label,
  disabled,
  canUp,
  canDown,
  onUp,
  onDown,
  onRemove,
}: {
  label: string;
  disabled: boolean;
  canUp: boolean;
  canDown: boolean;
  onUp: () => void;
  onDown: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex shrink-0 gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={`Subir ${label}`}
        disabled={disabled || !canUp}
        onClick={onUp}
      >
        <ArrowUp />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={`Bajar ${label}`}
        disabled={disabled || !canDown}
        onClick={onDown}
      >
        <ArrowDown />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={`Quitar ${label}`}
        disabled={disabled}
        onClick={onRemove}
      >
        <Trash2 />
      </Button>
    </div>
  );
}
