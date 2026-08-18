import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiService from '@/service/apiService';
import { IDebitNote } from '@/types';

const QUERY_KEY = 'debitNotes';

/* ─────────────── Query: list ─────────────── */

export const useDebitNotes = (params: {
  page?: number;
  limit?: number;
  status?: string;
  vendorId?: string;
  fromDate?: string;
  toDate?: string;
} = {}) => {
  return useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: () => apiService.DebitNotes.getAll(params),
    refetchOnWindowFocus: false,
  });
};

/* ─────────────── Query: single ─────────────── */

export const useDebitNote = (id: string) => {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => apiService.DebitNotes.getById(id),
    enabled: !!id,
    refetchOnWindowFocus: false,
  });
};

/* ─────────────── Query: next number ─────────────── */

export const useNextDebitNoteNumber = () => {
  return useQuery({
    queryKey: [QUERY_KEY, 'nextNumber'],
    queryFn: () => apiService.DebitNotes.getNextNumber(),
    refetchOnWindowFocus: false,
    staleTime: 0,
  });
};

/* ─────────────── Mutation: create ─────────────── */

export const useCreateDebitNote = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<IDebitNote, '_id' | 'debitNoteNumber' | 'status' | 'summary' | 'createdAt' | 'updatedAt'>) =>
      apiService.DebitNotes.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
};

/* ─────────────── Mutation: update status ─────────────── */

export const useUpdateDebitNote = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { status?: string; reason?: string; vendorNotes?: string } }) =>
      apiService.DebitNotes.updateStatus(id, data),
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [QUERY_KEY, id] });
    },
  });
};

/* ─────────────── Mutation: apply amount ─────────────── */

export const useApplyDebitNote = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) =>
      apiService.DebitNotes.applyAmount(id, amount),
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [QUERY_KEY, id] });
    },
  });
};

/* ─────────────── Mutation: delete ─────────────── */

export const useDeleteDebitNote = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiService.DebitNotes.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
};
