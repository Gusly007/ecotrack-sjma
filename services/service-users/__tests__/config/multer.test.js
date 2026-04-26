describe('config/multer', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('creates upload config, ensures dirs, validates extensions and mime types', async () => {
    const existsSync = jest.fn().mockReturnValue(false);
    const mkdirSync = jest.fn();
    const diskStorage = jest.fn((cfg) => cfg);
    const multerFactory = jest.fn((opts) => ({ opts }));
    multerFactory.diskStorage = diskStorage;

    jest.doMock('fs', () => ({
      __esModule: true,
      default: { existsSync, mkdirSync },
      existsSync,
      mkdirSync,
    }));

    jest.doMock('../../src/config/env.js', () => ({
      __esModule: true,
      default: {
        upload: {
          allowedExtensions: ['jpg', 'jpeg', 'png', 'webp'],
          maxFileSizeBytes: 1234,
        },
      },
    }));

    jest.doMock('multer', () => ({ __esModule: true, default: multerFactory }));

    const mod = await import('../../src/config/multer.js');

    expect(existsSync).toHaveBeenCalledTimes(2);
    expect(mkdirSync).toHaveBeenCalledTimes(2);
    expect(multerFactory).toHaveBeenCalledWith(expect.objectContaining({ limits: { fileSize: 1234 } }));

    const storageCfg = diskStorage.mock.calls[0][0];
    const req = { user: { id: 9 } };
    const cbOk = jest.fn();
    storageCfg.destination(req, {}, cbOk);
    expect(cbOk).toHaveBeenCalledWith(null, 'storage/temp');

    const cbFilename = jest.fn();
    storageCfg.filename(req, { originalname: 'avatar.jpeg' }, cbFilename);
    expect(cbFilename.mock.calls[0][1]).toContain('9-');
    expect(cbFilename.mock.calls[0][1].endsWith('.jpg')).toBe(true);

    const cbInvalidExt = jest.fn();
    storageCfg.filename(req, { originalname: 'avatar.gif' }, cbInvalidExt);
    expect(cbInvalidExt.mock.calls[0][0]).toBeInstanceOf(Error);

    const fileFilter = multerFactory.mock.calls[0][0].fileFilter;
    const allowCb = jest.fn();
    fileFilter(req, { originalname: 'x.png', mimetype: 'image/png' }, allowCb);
    expect(allowCb).toHaveBeenCalledWith(null, true);

    const rejectCb = jest.fn();
    fileFilter(req, { originalname: 'x.png', mimetype: 'text/plain' }, rejectCb);
    expect(rejectCb.mock.calls[0][0]).toBeInstanceOf(Error);

    expect(mod.default).toEqual({ opts: expect.any(Object) });
  });
});
