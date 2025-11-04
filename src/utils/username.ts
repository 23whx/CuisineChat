import { CUISINES } from '@/data/cuisines';

/**
 * 生成随机美食名称作为用户名
 * @param seed 可选的种子，用于生成一致的结果
 * @returns 随机的美食名称
 */
export const getRandomCuisineName = (seed?: string): string => {
  if (seed) {
    // 基于种子生成确定性的索引
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    const index = Math.abs(hash) % CUISINES.length;
    return CUISINES[index];
  }
  
  // 完全随机
  const randomIndex = Math.floor(Math.random() * CUISINES.length);
  return CUISINES[randomIndex];
};

/**
 * 生成临时用户 ID
 * @returns 唯一的用户 ID
 */
export const generateUserId = (): string => {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * 验证用户名是否有效
 * @param username 用户名
 * @returns 是否有效
 */
export const isValidUsername = (username: string): boolean => {
  return username.length > 0 && username.length <= 30;
};

