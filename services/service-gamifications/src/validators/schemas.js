import { z } from 'zod';

export const classementQuerySchema = z.object({
  limite: z.string().regex(/^\d+$/).transform(Number).optional(),
  id_utilisateur: z.string().regex(/^\d+$/).transform(Number).optional()
});

export const notificationQuerySchema = z.object({
  id_utilisateur: z.string().regex(/^\d+$/).transform(Number)
});

export const notificationBodySchema = z.object({
  id_utilisateur: z.number().int(),
  type: z.string().min(1),
  titre: z.string().min(1),
  corps: z.string().min(1)
});
