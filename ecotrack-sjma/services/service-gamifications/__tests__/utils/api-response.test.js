import { ApiResponse } from '../../src/utils/api-response.js';

describe('ApiResponse utility', () => {
  it('success returns normalized payload', () => {
    const out = ApiResponse.success({ id: 1 }, 'ok', 201);
    expect(out.success).toBe(true);
    expect(out.statusCode).toBe(201);
    expect(out.message).toBe('ok');
    expect(out.data).toEqual({ id: 1 });
    expect(typeof out.timestamp).toBe('string');
  });

  it('error returns normalized error payload', () => {
    const details = [{ field: 'id' }];
    const out = ApiResponse.error(400, 'bad request', details);
    expect(out.success).toBe(false);
    expect(out.statusCode).toBe(400);
    expect(out.details).toEqual(details);
    expect(typeof out.timestamp).toBe('string');
  });

  it('paginated computes pages and hasMore', () => {
    const out = ApiResponse.paginated([{ id: 1 }], 2, 10, 35, 'list');
    expect(out.success).toBe(true);
    expect(out.pagination).toEqual({
      page: 2,
      limit: 10,
      total: 35,
      pages: 4,
      hasMore: true
    });
    expect(out.data).toHaveLength(1);
  });

  it('paginated hasMore false when page reaches end', () => {
    const out = ApiResponse.paginated([], 4, 10, 35);
    expect(out.pagination.hasMore).toBe(false);
  });
});
