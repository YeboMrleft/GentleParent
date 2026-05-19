const SA_SLANG = [
  'eish', 'yoh', 'sharp', 'lekker', 'bra', 'sho', 'hawu', 'hayibo',
  'ntwana', 'mzansi', 'kasi', 'hectic', 'my guy', 'joh', 'ay',
  'haibo', 'mara', 'neh', 'ja', 'nah',
];

export const detectsSlang = (messages: { text: string; isUser: boolean }[]): boolean => {
  const userMessages = messages
    .filter(m => m.isUser)
    .slice(-5)
    .map(m => m.text.toLowerCase());
  const slangCount = userMessages.reduce((count, msg) => {
    return count + SA_SLANG.filter(slang => msg.includes(slang)).length;
  }, 0);
  return slangCount >= 2;
};
