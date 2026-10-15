'use client';

import { createContext, useContext } from 'react';

export type Invitation = {
  kind: 'friend' | 'request' | 'game'; parameter?: string; id?: string; self?: boolean;
  opponent: { name: string; elo?: number }; role?: 'host' | 'guest';
  status?: 'pending' | 'ready' | 'declined' | 'cancelled' | 'expired';
  game_id?: string; url?: string; free: boolean; wager?: number; time_control: number;
};

export const InvitationContext = createContext({ busy: false, items: [] as Invitation[], unavailable: false, open: (_item: Invitation) => {} });
export const useInvitations = () => useContext(InvitationContext);
