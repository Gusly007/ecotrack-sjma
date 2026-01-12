import * as avatarService from '../../src/services/avatarService.js';
import pool from '../../src/config/database.js';
import fs from 'fs/promises';
import sharp from 'sharp';

jest.mock('../../src/services/avatarService.js', () => ({
  deleteOldAvatars: jest.fn(),
  processAvatar: jest.fn(),
  saveAvatarUrls: jest.fn(),
  getUserAvatar: jest.fn()
}));

jest.mock('../../src/config/database.js', () => ({
  query: jest.fn()
}));

jest.mock('fs/promises', () => ({
  unlink: jest.fn()
}));

jest.mock('sharp');

let uploadAvatar;
let getUserAvatar;
let deleteAvatar;

const mockRequest = (overrides = {}) => ({
  user: { id: 1 },
  body: {},
  params: {},
  file: undefined,
  ...overrides
});

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

const setImageDimensions = (width, height) => {
  sharp.mockImplementation(() => ({
    metadata: jest.fn().mockResolvedValue({ width, height })
  }));
};

describe('Avatar Controller', () => {
  beforeAll(async () => {
    ({ uploadAvatar, getUserAvatar, deleteAvatar } = await import('../../src/controllers/avatarController.js'));
  });

  beforeEach(() => {
    jest.clearAllMocks();
    sharp.mockReset();
    fs.unlink.mockReset();
  });

  describe('uploadAvatar', () => {
    it('uploads avatar and persists urls', async () => {
      setImageDimensions(250, 250);
      avatarService.deleteOldAvatars.mockResolvedValue();
      const urls = {
        original: '/avatars/original/1.png',
        thumbnail: '/avatars/thumbnails/1.png',
        mini: '/avatars/mini/1.png'
      };
      avatarService.processAvatar.mockResolvedValue(urls);
      avatarService.saveAvatarUrls.mockResolvedValue({
        id_utilisateur: 1,
        avatar_url: urls.original,
        avatar_thumbnail: urls.thumbnail,
        avatar_mini: urls.mini
      });

      const req = mockRequest({ file: { path: 'storage/temp/1.png', filename: '1.png' } });
      const res = mockResponse();

      uploadAvatar(req, res, jest.fn());
      await flushPromises();

      expect(res.status).toHaveBeenCalledWith(201);
      expect(avatarService.deleteOldAvatars).toHaveBeenCalledWith(1);
      expect(avatarService.processAvatar).toHaveBeenCalledWith(1, req.file);
      expect(avatarService.saveAvatarUrls).toHaveBeenCalledWith(1, urls);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Avatar uploaded successfully',
        data: {
          id_utilisateur: 1,
          avatar_url: urls.original,
          avatar_thumbnail: urls.thumbnail,
          avatar_mini: urls.mini
        }
      });
    });

    it('returns 400 when no file is provided', async () => {
      const req = mockRequest();
      const res = mockResponse();

      uploadAvatar(req, res, jest.fn());
      await flushPromises();

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'No file uploaded' });
      expect(avatarService.deleteOldAvatars).not.toHaveBeenCalled();
    });

    it('rejects images smaller than 100x100 and cleans temp file', async () => {
      setImageDimensions(80, 90);
      const req = mockRequest({ file: { path: 'storage/temp/small.png', filename: 'small.png' } });
      const res = mockResponse();
      fs.unlink.mockResolvedValue();

      uploadAvatar(req, res, jest.fn());
      await flushPromises();

      expect(fs.unlink).toHaveBeenCalledWith('storage/temp/small.png');
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Image must be at least 100x100 pixels' });
      expect(avatarService.deleteOldAvatars).not.toHaveBeenCalled();
    });
  });

  describe('getUserAvatar', () => {
    it('returns avatar urls for given user', async () => {
      const avatar = { avatar_url: '/original.png' };
      avatarService.getUserAvatar.mockResolvedValue(avatar);
      const req = mockRequest({ params: { userId: '5' } });
      const res = mockResponse();

      getUserAvatar(req, res, jest.fn());
      await flushPromises();

      expect(avatarService.getUserAvatar).toHaveBeenCalledWith(5);
      expect(res.json).toHaveBeenCalledWith({ data: avatar });
    });
  });

  describe('deleteAvatar', () => {
    it('deletes files and clears database columns', async () => {
      avatarService.deleteOldAvatars.mockResolvedValue();
      pool.query.mockResolvedValue();
      const req = mockRequest();
      const res = mockResponse();

      deleteAvatar(req, res, jest.fn());
      await flushPromises();

      expect(avatarService.deleteOldAvatars).toHaveBeenCalledWith(1);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE UTILISATEUR SET avatar_url = NULL'),
        [1]
      );
      expect(res.json).toHaveBeenCalledWith({ message: 'Avatar deleted successfully' });
    });
  });
});
