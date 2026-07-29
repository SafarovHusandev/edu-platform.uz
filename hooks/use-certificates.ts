"use client"

import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import type { Certificate, Paginated } from "@/types"

export function useMyCertificates(page = 1, limit = 10) {
  return useQuery({
    queryKey: ["my-certificates", page, limit],
    queryFn: () => api.get<Paginated<Certificate>>("/certificates/my", { page, limit }),
  })
}

export interface CertificateVerifyResult {
  valid: boolean
  studentName?: string
  courseTitle?: string
  issuedAt?: string
  certificateNumber?: string
}

export function useVerifyCertificate(certificateNumber: string | undefined) {
  return useQuery({
    queryKey: ["certificate-verify", certificateNumber],
    queryFn: () =>
      api.get<CertificateVerifyResult>(`/certificates/verify/${certificateNumber}`, undefined, {
        skipAuth: true,
      }),
    enabled: !!certificateNumber,
    retry: false,
  })
}

