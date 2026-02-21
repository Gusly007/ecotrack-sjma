import path from 'path';
import {
  processAvatar,
  saveAvatarUrls,
  deleteOldAvatars,
  getUserAvatar
} from '../../src/services/avatarService.js';
import sharp from 'sharp';
import fs from 'fs/promises';
import pool from '../../src/config/database.js';

jest.mock('sharp', () => jest.fn());

jest.mock('fs/promises', () => ({
  access: jest.fn(),
  mkdir: jest.fn(),
  unlink: jest.fn(),
  readdir: jest.fn()
}));

jest.mock('../../src/config/database.js', () => ({
  query: jest.fn()
}));

describe('Avatar Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sharp.mockReset();
  });

  describe('processAvatar', () => {
    const setupSharpPipeline = () => {
      sharp.mockImplementation(() => ({
        resize: jest.fn(() => ({ toFile: jest.fn().mockResolvedValue() }))
      }));
    };

    it('resizes images and returns urls', async () => {
      fs.access.mockResolvedValue();
      fs.unlink.mockResolvedValue();
      setupSharpPipeline();

      const result = await processAvatar(1, {
        path: 'storage/temp/avatar.png',
        filename: 'avatar.png'
      });

      expect(sharp).toHaveBeenCalledTimes(3);
      expect(fs.unlink).toHaveBeenCalledWith('storage/temp/avatar.png');
      expect(result).toEqual({
        original: '/avatars/original/1.png',
        thumbnail: '/avatars/thumbnails/1.png',
        mini: '/avatars/mini/1.png'
      });
    });

    it('cleans temp file when resizing fails', async () => {
      const error = new Error('sharp failure');
      fs.access.mockResolvedValue();
      fs.unlink.mockResolvedValue();
      sharp.mockImplementation(() => ({
        resize: () => ({ toFile: jest.fn().mockRejectedValue(error) })
      }));

      await expect(processAvatar(2, {
        path: 'storage/temp/bad.png',
        filename: 'bad.png'
      })).rejects.toThrow('sharp failure');

      expect(fs.unlink).toHaveBeenCalledWith('storage/temp/bad.png');
    });
  });

  describe('saveAvatarUrls', () => {
    it('persists urls and returns row', async () => {
      const stored = {
        id_utilisateur: 1,
        avatar_url: '/a.png',
        avatar_thumbnail: '/t.png',
        avatar_mini: '/m.png'
      };
      pool.query.mockResolvedValue({ rows: [stored] });

      const result = await saveAvatarUrls(1, {
        original: '/a.png',
        thumbnail: '/t.png',
        mini: '/m.png'
      });

      expect(pool.query).toHaveBeenCalledWith(expect.any(String), [
        1,
        '/a.png',
        '/t.png',
        '/m.png'
      ]);
      expect(result).toEqual(stored);
    });

    it('throws when user is missing', async () => {
      pool.query.mockResolvedValue({ rows: [] });
      await expect(saveAvatarUrls(9, { original: '', thumbnail: '', mini: '' }))
        .rejects.toThrow('User not found');
    });
  });

  describe('deleteOldAvatars', () => {
    it('removes matching files from all directories', async () => {
      fs.readdir
        .mockResolvedValueOnce(['1.png', 'other.png'])
        .mockResolvedValueOnce(['1.png'])
        .mockResolvedValueOnce([]);
      fs.unlink.mockResolvedValue();

      await deleteOldAvatars(1);

      const deletedPaths = fs.unlink.mock.calls.map(([filePath]) => filePath);
      expect(deletedPaths).toEqual(expect.arrayContaining([
        path.join('storage', 'avatars', 'original', '1.png'),
        path.join('storage', 'avatars', 'thumbnails', '1.png')
      ]));
    });
  });

  describe('getUserAvatar', () => {
    it('returns stored urls', async () => {
      const avatar = { avatar_url: '/a.png' };
      pool.query.mockResolvedValue({ rows: [avatar] });

      const result = await getUserAvatar(3);

      expect(pool.query).toHaveBeenCalledWith(expect.any(String), [3]);
      expect(result).toEqual(avatar);
    });

    it('throws when no avatar is found', async () => {
      pool.query.mockResolvedValue({ rows: [] });
      await expect(getUserAvatar(3)).rejects.toThrow('User not found');
    });
  });
});
