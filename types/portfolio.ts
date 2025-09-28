/**
 * Portfolio Module Types
 * Lightweight types for minimal CRM load
 */

export interface PortfolioProject {
  id: string
  title: string
  category: string
  description?: string
  client_id?: string
  client_name?: string
  project_date?: string
  location?: string
  status: 'draft' | 'published' | 'archived'
  featured: boolean
  sort_order: number
  
  // Public sharing
  public_id?: string
  is_public: boolean
  public_access_expires_at?: string
  
  // Metadata
  user_id: string
  organization_id?: string
  created_at: string
  updated_at: string
  
  // Relations (loaded separately for performance)
  media?: PortfolioMedia[]
  shares?: PortfolioShare[]
}

export interface PortfolioMedia {
  id: string
  project_id: string
  
  // File metadata
  filename: string
  original_filename: string
  file_type: 'image' | 'video'
  mime_type: string
  file_size?: number
  
  // Storage paths (Supabase Storage)
  storage_bucket: string
  storage_path: string
  thumbnail_path?: string
  // Computed (signed) URLs for UI consumption
  media_url?: string
  thumbnail_url?: string
  hls_url?: string
  
  // Video-specific fields
  video_duration?: number
  video_status?: 'uploading' | 'processing' | 'ready' | 'error'
  hls_path?: string // Path to .m3u8 file
  mp4_path?: string // Path to MP4 file
  processing_job_id?: string
  
  // Display properties
  title?: string
  description?: string
  alt_text?: string
  sort_order: number
  is_featured: boolean
  
  // Technical metadata
  width?: number
  height?: number
  aspect_ratio?: number
  
  // Metadata
  user_id: string
  created_at: string
  updated_at: string
}

export interface PortfolioCategory {
  id: string
  name: string
  slug: string
  description?: string
  color?: string
  icon?: string
  sort_order: number
  is_active: boolean
  
  // Metadata
  organization_id?: string
  created_at: string
  updated_at: string
}

export interface PortfolioShare {
  id: string
  project_id: string
  
  // Sharing configuration
  share_token: string
  share_type: 'public' | 'password' | 'expires'
  password_hash?: string
  expires_at?: string
  
  // Access control
  allow_download: boolean
  allow_comments: boolean
  watermark_enabled: boolean
  
  // Analytics
  view_count: number
  last_viewed_at?: string
  
  // Metadata
  created_by: string
  created_at: string
  updated_at: string
}

export interface VideoProcessingJob {
  id: string
  media_id: string
  
  // Job details
  job_type: 'convert' | 'thumbnail' | 'optimize'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number // 0-100
  
  // Input/Output
  input_path: string
  output_paths?: string[]
  
  // Processing details
  started_at?: string
  completed_at?: string
  error_message?: string
  processing_metadata?: Record<string, any>
  
  // Metadata
  created_at: string
  updated_at: string
}

// API Request/Response Types
export interface CreatePortfolioProjectRequest {
  title: string
  category: string
  description?: string
  client_id?: string
  client_name?: string
  project_date?: string
  location?: string
  status?: 'draft' | 'published' | 'archived'
  featured?: boolean
}

export interface UpdatePortfolioProjectRequest extends Partial<CreatePortfolioProjectRequest> {
  id: string
}

export interface UploadMediaRequest {
  project_id: string
  file: File
  title?: string
  description?: string
  alt_text?: string
  is_featured?: boolean
}

export interface MediaUploadResponse {
  success: boolean
  media?: PortfolioMedia
  error?: string
  processing_job_id?: string // For videos
}

export interface CreateShareRequest {
  project_id: string
  share_type: 'public' | 'password' | 'expires'
  password?: string
  expires_at?: string
  allow_download?: boolean
  allow_comments?: boolean
  watermark_enabled?: boolean
}

export interface ShareResponse {
  success: boolean
  share?: PortfolioShare
  share_url?: string
  error?: string
}

// Frontend UI Types
export interface PortfolioFilters {
  category?: string
  status?: string
  featured?: boolean
  client_id?: string
  search?: string
  date_from?: string
  date_to?: string
}

export interface MediaFilters {
  file_type?: 'image' | 'video'
  video_status?: string
  is_featured?: boolean
}

export interface PortfolioStats {
  total_projects: number
  published_projects: number
  total_media: number
  total_images: number
  total_videos: number
  processing_videos: number
  featured_projects: number
  public_shares: number
  total_views: number
}

// Video Processing Types
export interface VideoConversionOptions {
  formats: ('mp4' | 'hls')[]
  quality: 'low' | 'medium' | 'high' | 'ultra'
  thumbnail_count: number
  thumbnail_times?: number[] // Specific times for thumbnails
}

export interface HLSPlaylist {
  master_url: string // .m3u8 file URL
  qualities: Array<{
    resolution: string
    bandwidth: number
    url: string
  }>
}

// Public Portfolio Types (for sharing)
export interface PublicPortfolioProject {
  id: string
  title: string
  category: string
  description?: string
  client_name?: string
  project_date?: string
  location?: string
  media: PublicPortfolioMedia[]
}

export interface PublicPortfolioMedia {
  id: string
  filename: string
  file_type: 'image' | 'video'
  title?: string
  description?: string
  alt_text?: string
  thumbnail_url?: string
  media_url?: string
  hls_url?: string // For video streaming
  width?: number
  height?: number
  aspect_ratio?: number
  video_duration?: number
}

// Error Types
export interface PortfolioError {
  code: string
  message: string
  details?: Record<string, any>
}

// Utility Types
export type MediaSortBy = 'created_at' | 'title' | 'file_type' | 'sort_order'
export type ProjectSortBy = 'created_at' | 'updated_at' | 'title' | 'project_date' | 'sort_order'
export type SortOrder = 'asc' | 'desc'

export interface PaginationOptions {
  page: number
  limit: number
  sort_by?: string
  sort_order?: SortOrder
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
    has_next: boolean
    has_prev: boolean
  }
}

// Component Props Types
export interface PortfolioProjectCardProps {
  project: PortfolioProject
  onEdit?: (project: PortfolioProject) => void
  onDelete?: (project: PortfolioProject) => void
  onShare?: (project: PortfolioProject) => void
  showActions?: boolean
  compact?: boolean
}

export interface MediaGalleryProps {
  media: PortfolioMedia[]
  onMediaClick?: (media: PortfolioMedia) => void
  onMediaEdit?: (media: PortfolioMedia) => void
  onMediaDelete?: (media: PortfolioMedia) => void
  layout?: 'grid' | 'masonry' | 'carousel'
  showControls?: boolean
}

export interface VideoPlayerProps {
  media: PortfolioMedia
  autoplay?: boolean
  controls?: boolean
  muted?: boolean
  loop?: boolean
  poster?: string
  onTimeUpdate?: (currentTime: number) => void
  onEnded?: () => void
}

export interface ProjectFormProps {
  project?: PortfolioProject
  onSubmit: (data: CreatePortfolioProjectRequest | UpdatePortfolioProjectRequest) => void
  onCancel: () => void
  loading?: boolean
  clients?: Array<{ id: string; name: string }>
  categories?: PortfolioCategory[]
}