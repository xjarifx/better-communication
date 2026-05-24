import { useMutation } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"

export interface UploadResponse {
  url: string
  thumbnailUrl: string
  fileName: string
  fileSize: number
}

export function useFileUpload() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append("file", file)
      return apiClient.upload<UploadResponse>("/api/upload", formData)
    },
  })
}
