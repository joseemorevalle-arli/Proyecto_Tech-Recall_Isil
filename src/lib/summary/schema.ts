import { z } from "zod";

// HU10: el resumen de una clase es una lista de temas, cada uno con sus ideas clave.
export const MAX_TOPICS = 10;
export const MAX_KEY_IDEAS = 6;

const text = (max: number) => z.string().trim().min(1).max(max);

// `evidence` es la frase de la clase que muestra que el tema sí se dictó (escenario 2).
// Se guarda y se muestra para que el estudiante pueda comprobarlo.
export const topicSchema = z.object({
  title: text(200),
  keyIdeas: z.array(text(500)).min(1).max(MAX_KEY_IDEAS),
  evidence: text(800),
});

export const summarySchema = z.object({
  topics: z.array(topicSchema).min(1).max(MAX_TOPICS),
});

export type Summary = z.output<typeof summarySchema>;
export type SummaryTopic = Summary["topics"][number];
