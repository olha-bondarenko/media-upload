export type UploadStartResponse = {
  media_id: string
  part_size: number
  part_count: number
}

export type PartUrl = {
  part_number: number
  url: string
}

export type CompletedPart = {
  part_number: number
  etag: string
}