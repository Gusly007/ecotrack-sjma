import {
  paginationSchema,
  classementQuerySchema,
  notificationQuerySchema,
  defisQuerySchema,
  badgesQuerySchema,
  actionsQuerySchema,
  notificationBodySchema
} from '../../src/validators/schemas.js';

describe('validators schemas', () => {
  it('paginationSchema parses strings and applies defaults', () => {
    const parsed = paginationSchema.parse({ page: '2', limit: '15' });
    expect(parsed).toEqual({ page: 2, limit: 15 });

    const defaults = paginationSchema.parse({});
    expect(defaults).toEqual({ page: 1, limit: 20 });
  });

  it('paginationSchema rejects invalid values', () => {
    const result = paginationSchema.safeParse({ page: '-1', limit: '101' });
    expect(result.success).toBe(false);
  });

  it('classementQuerySchema parses optional fields', () => {
    const parsed = classementQuerySchema.parse({ limite: '5', id_utilisateur: '9' });
    expect(parsed.limite).toBe(5);
    expect(parsed.id_utilisateur).toBe(9);
  });

  it('notificationQuerySchema requires id_utilisateur', () => {
    const ok = notificationQuerySchema.safeParse({ id_utilisateur: '3' });
    const ko = notificationQuerySchema.safeParse({});
    expect(ok.success).toBe(true);
    expect(ko.success).toBe(false);
  });

  it('defisQuerySchema accepts optional statut/type_defi', () => {
    const parsed = defisQuerySchema.parse({ statut: 'ACTIF', type_defi: 'INDIVIDUEL' });
    expect(parsed.statut).toBe('ACTIF');
    expect(parsed.type_defi).toBe('INDIVIDUEL');
  });

  it('badgesQuerySchema parses user id when provided', () => {
    const parsed = badgesQuerySchema.parse({ id_utilisateur: '7' });
    expect(parsed.id_utilisateur).toBe(7);
  });

  it('actionsQuerySchema parses user id when provided', () => {
    const parsed = actionsQuerySchema.parse({ id_utilisateur: '11' });
    expect(parsed.id_utilisateur).toBe(11);
  });

  it('notificationBodySchema validates required body fields', () => {
    const ok = notificationBodySchema.safeParse({
      id_utilisateur: 1,
      type: 'BADGE',
      titre: 'Bravo',
      corps: 'Nouveau badge obtenu'
    });
    expect(ok.success).toBe(true);

    const ko = notificationBodySchema.safeParse({
      id_utilisateur: 1,
      type: '',
      titre: 'x',
      corps: 'x'
    });
    expect(ko.success).toBe(false);
  });
});
