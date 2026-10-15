import { createAvatar } from '@dicebear/core';
import { avataaars } from '@dicebear/collection';

/**
 * 基于用户名生成头像 SVG
 * @param username 用户名（作为种子）
 * @returns SVG 字符串
 */
export const generateAvatar = (username: string): string => {
  const avatar = createAvatar(avataaars, {
    seed: username,
    size: 128,
    backgroundColor: ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf'],
  });

  return avatar.toString();
};

/**
 * 生成头像的 Data URL
 * @param username 用户名
 * @returns Data URL
 */
const avatarCache = new Map<string, string>();
const AVATAR_CACHE_LIMIT = 200;

export const getAvatarDataUrl = (username: string): string => {
  // 生成 SVG 开销较大，而聊天列表里每条消息都会渲染头像，因此按用户名缓存
  const cached = avatarCache.get(username);
  if (cached) return cached;

  const svg = generateAvatar(username);
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  if (avatarCache.size >= AVATAR_CACHE_LIMIT) {
    avatarCache.delete(avatarCache.keys().next().value as string);
  }
  avatarCache.set(username, url);
  return url;
};

