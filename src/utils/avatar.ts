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
export const getAvatarDataUrl = (username: string): string => {
  const svg = generateAvatar(username);
  const base64 = btoa(unescape(encodeURIComponent(svg)));
  return `data:image/svg+xml;base64,${base64}`;
};

