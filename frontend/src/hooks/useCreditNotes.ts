import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiService from '@/service/apiService';
import { ICreditNote } from '@/types';

const QUERY_KEY = 'creditNotes';

/* ─────────────── Query: list ─────────────── */

export const useCreditNotes = (params: {
  page?: number;
  limit?: number;
  status?: string;
  customerId?: string;
  fromDate?: string;
  toDate?: string;
} = {}) => {
  return useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: () => apiService.CreditNotes.getAll(params),
    refetchOnWindowFocus: false,
  });
};

/* ─────────────── Query: single ─────────────── */

export const useCreditNote = (id: string) => {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => apiService.CreditNotes.getById(id),
    enabled: !!id,
    refetchOnWindowFocus: false,
  });
};

/* ─────────────── Query: next number ─────────────── */

export const useNextCreditNoteNumber = () => {
  return useQuery({
    queryKey: [QUERY_KEY, 'nextNumber'],
    queryFn: () => apiService.CreditNotes.getNextNumber(),
    refetchOnWindowFocus: false,
    staleTime: 0,
  });
};

/* ─────────────── Mutation: create ─────────────── */

export const useCreateCreditNote = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<ICreditNote, '_id' | 'creditNoteNumber' | 'status' | 'summary' | 'createdAt' | 'updatedAt'>) =>
      apiService.CreditNotes.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
};

/* ─────────────── Mutation: update status ─────────────── */

export const useUpdateCreditNote = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { status?: string; reason?: string; customerNotes?: string } }) =>
      apiService.CreditNotes.updateStatus(id, data),
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [QUERY_KEY, id] });
    },
  });
};

/* ─────────────── Mutation: apply amount ─────────────── */

export const useApplyCreditNote = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) =>
      apiService.CreditNotes.applyAmount(id, amount),
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [QUERY_KEY, id] });
    },
  });
};

/* ─────────────── Mutation: delete ─────────────── */

export const useDeleteCreditNote = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiService.CreditNotes.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
};
