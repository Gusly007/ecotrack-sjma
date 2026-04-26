import { z } from 'zod';

const toInt = (v) => {
  if (v === undefined || v === null || v === '') return undefined;
  const n = parseInt(v, 10);
  return isNaN(n) ? undefined : n;
};

export const paginationSchema = z.object({
  page: z.preprocess((v) => toInt(v), z.number().int().positive().optional().default(1)),
  limit: z.preprocess((v) => toInt(v), z.number().int().positive().max(100).optional().default(20))
});

export const classementQuerySchema = paginationSchema.extend({
  limite: z.preprocess((v) => toInt(v), z.number().int().positive().max(100).optional()),
  id_utilisateur: z.preprocess((v) => toInt(v), z.number().int().positive().optional())
});

export const notificationQuerySchema = paginationSchema.extend({
  id_utilisateur: z.preprocess((v) => toInt(v), z.number().int().positive())
});

export const defisQuerySchema = paginationSchema.extend({
  statut: z.string().optional(),
  type_defi: z.string().optional()
});

export const badgesQuerySchema = paginationSchema.extend({
  id_utilisateur: z.preprocess((v) => toInt(v), z.number().int().positive().optional())
});

export const actionsQuerySchema = paginationSchema.extend({
  id_utilisateur: z.preprocess((v) => toInt(v), z.number().int().positive().optional())
});

export const notificationBodySchema = z.object({
  id_utilisateur: z.number().int(),
  type: z.string().min(1),
  titre: z.string().min(1),
  corps: z.string().min(1)
});
