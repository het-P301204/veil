import { useQuery, useMutation } from '@tanstack/react-query';
import type { ScenarioConfig, Finding, PayloadDefinition, ScenarioResult } from '../types';

const BASE = '/api';

async function fetchJson<T>(path: string, opts?: RequestInit): Promise<T> {
  const r = await fetch(BASE + path, opts);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export function useScenarios() {
  return useQuery<ScenarioConfig[]>({
    queryKey: ['scenarios'],
    queryFn: () => fetchJson('/scenarios'),
  });
}

export function useFindings() {
  return useQuery<Finding[]>({
    queryKey: ['findings'],
    queryFn: () => fetchJson('/findings'),
    refetchInterval: 3000,
  });
}

export function useFinding(id: string) {
  return useQuery<Finding>({
    queryKey: ['finding', id],
    queryFn: () => fetchJson(`/findings/${id}`),
    enabled: !!id,
  });
}

export function usePayloads() {
  return useQuery<PayloadDefinition[]>({
    queryKey: ['payloads'],
    queryFn: () => fetchJson('/payloads'),
  });
}

export function useRunScenario() {
  return useMutation<{ run_id: string; scenario: string; status: string }, Error, string>({
    mutationFn: (scenario_name: string) =>
      fetchJson('/scenarios/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario_name }),
      }),
  });
}

export function useGenerateReport() {
  return useMutation({
    mutationFn: (finding_ids?: string[]) =>
      fetchJson('/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ finding_ids }),
      }),
  });
}
