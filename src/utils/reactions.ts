export type ReactionType = 'LIKE' | 'LOVE' | 'HAHA' | 'WOW' | 'SAD' | 'ANGRY';

export const REACTION_OPTIONS: { type: ReactionType; emoji: string; label: string }[] = [
  { type: 'LIKE', emoji: '👍', label: 'Thích' },
  { type: 'LOVE', emoji: '❤️', label: 'Yêu thích' },
  { type: 'HAHA', emoji: '😂', label: 'Haha' },
  { type: 'WOW', emoji: '😮', label: 'Wow' },
  { type: 'SAD', emoji: '😢', label: 'Buồn' },
  { type: 'ANGRY', emoji: '😡', label: 'Phẫn nộ' },
];

export function reactionEmoji(type: string): string {
  return REACTION_OPTIONS.find((r) => r.type === type)?.emoji ?? '👍';
}

export function groupReactions(
  reactions: { userId: string; reactionType: string }[] | undefined
): { type: string; emoji: string; count: number; userIds: string[] }[] {
  if (!reactions?.length) return [];
  const map = new Map<string, string[]>();
  for (const r of reactions) {
    const list = map.get(r.reactionType) ?? [];
    list.push(r.userId);
    map.set(r.reactionType, list);
  }
  return [...map.entries()]
    .map(([type, userIds]) => ({
      type,
      emoji: reactionEmoji(type),
      count: userIds.length,
      userIds,
    }))
    .sort((a, b) => b.count - a.count);
}
