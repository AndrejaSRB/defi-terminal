import { atom } from 'jotai';
import type { FundingPayment } from '@/normalizer/types';

export const userFundingsAtom = atom<FundingPayment[]>([]);
