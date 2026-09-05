import { myFamilyRemote, pullAll } from '../store/sync';

/** 登录成功后取回家庭；返回可直接 dispatch 的 joinFamily 载荷，没有家庭返回 null */
export async function loadMyFamily(userId: string) {
  const mine = await myFamilyRemote();
  if (!mine) return null;
  const slices = await pullAll(mine.familyId);
  const me = slices.members.find((m) => m.id === mine.memberId);
  if (!me) return null;
  return { type: 'joinFamily' as const, pregnancy: mine.pregnancy, me, familyCode: mine.inviteCode, cloud: { familyId: mine.familyId, userId, bound: true }, slices };
}
