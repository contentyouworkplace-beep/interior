/**
 * Portfolio Service
 * Lightweight service for managing portfolio projects and media
 * Designed for minimal CRM load - all heavy operations happen in Supabase/workers
 */

import { createClient } from '@/lib/supabase/client'
import { generateThumbnail } from '@/lib/thumbnail-generator'
import type {
  PortfolioProject,
  PortfolioMedia,
  PortfolioCategory,
  PortfolioShare,
  VideoProcessingJob,
  CreatePortfolioProjectRequest,
  UpdatePortfolioProjectRequest,
  UploadMediaRequest,
  MediaUploadResponse,
  CreateShareRequest,
  ShareResponse,
  PortfolioFilters,
  MediaFilters,
  PortfolioStats,
  PaginationOptions,
  PaginatedResponse,
  PublicPortfolioProject
} from '@/types/portfolio'

export class PortfolioService {
  private static supabase = createClient()
  private static portfolioBucket = (process.env.NEXT_PUBLIC_PORTFOLIO_BUCKET || 'portfolio-media') as string
  // Use an untyped channel for portfolio-related tables that aren't in the generated Database types
  private static from(table: string) {
    return (this.supabase as any).from(table)
  }

  // ============ PROJECT MANAGEMENT ============

  /**
   * Get all portfolio projects with filters and pagination
   */
  static async getProjects(
    filters: PortfolioFilters = {},
    pagination: PaginationOptions = { page: 1, limit: 20 }
  ): Promise<PaginatedResponse<PortfolioProject>> {
    let query = this.from('portfolio_projects')
      .select('*', { count: 'exact' })

    // Apply filters
    if (filters.category) {
      query = query.eq('category', filters.category)
    }
    if (filters.status) {
      query = query.eq('status', filters.status)
    }
    if (filters.featured !== undefined) {
      query = query.eq('featured', filters.featured)
    }
    if (filters.client_id) {
      query = query.eq('client_id', filters.client_id)
    }
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,client_name.ilike.%${filters.search}%`)
    }
    if (filters.date_from) {
      query = query.gte('project_date', filters.date_from)
    }
    if (filters.date_to) {
      query = query.lte('project_date', filters.date_to)
    }

    // Apply sorting
    const sortBy = pagination.sort_by || 'updated_at'
    const sortOrder = pagination.sort_order || 'desc'
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Apply pagination
    const from = (pagination.page - 1) * pagination.limit
    const to = from + pagination.limit - 1
    query = query.range(from, to)

  const { data, error, count } = await query

    if (error) {
      throw new Error(`Failed to fetch projects: ${error.message}`)
    }

    const total = count || 0
    const total_pages = Math.ceil(total / pagination.limit)

    // Load media for each project and attach signed URLs for thumbnails where present
    const projects = ((data || []) as unknown) as PortfolioProject[]
    await Promise.all(projects.map(async (p) => {
      try {
        const media = await this.getProjectMedia(p.id)
        // Attach signed URLs
        const mediaWithUrls = await Promise.all(media.map(async (m) => {
          try {
            // Thumbnail signed URL if exists
            const thumb = m.thumbnail_path
              ? await this.supabase.storage.from(m.storage_bucket).createSignedUrl(m.thumbnail_path, 3600)
              : { data: null }
            const fileUrl = await this.supabase.storage
              .from(m.storage_bucket)
              .createSignedUrl(m.storage_path, 3600)
            const hls = m.hls_path
              ? await this.supabase.storage.from(m.storage_bucket).createSignedUrl(m.hls_path, 3600)
              : { data: null }
            
            return {
              ...m,
              thumbnail_url: thumb?.data?.signedUrl || undefined,
              media_url: fileUrl?.data?.signedUrl || undefined,
              hls_url: hls?.data?.signedUrl || undefined
            }
          } catch (error) {
            console.error(`Error generating signed URLs for media ${m.id}:`, error)
            return {
              ...m,
              thumbnail_url: undefined,
              media_url: undefined,
              hls_url: undefined
            }
          }
        }))
        p.media = mediaWithUrls
      } catch (error) {
        console.error(`Error loading media for project ${p.id}:`, error)
        p.media = []
      }
    }))

    return {
      data: projects,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        total_pages,
        has_next: pagination.page < total_pages,
        has_prev: pagination.page > 1
      }
    }
  }

  /**
   * Get a single project by ID with media
   */
  static async getProject(id: string, includeMedia = true): Promise<PortfolioProject | null> {
    let query = this.from('portfolio_projects')
      .select('*')
      .eq('id', id)
      .single()

  const { data: project, error } = await query

    if (error || !project) {
      return null
    }

    if (includeMedia) {
      const media = await this.getProjectMedia(id)
      // Attach signed URLs
      const mediaWithUrls = await Promise.all((media || []).map(async (m) => {
        const thumb = m.thumbnail_path
          ? await this.supabase.storage.from(m.storage_bucket).createSignedUrl(m.thumbnail_path, 3600)
          : { data: null }
        const fileUrl = await this.supabase.storage
          .from(m.storage_bucket)
          .createSignedUrl(m.storage_path, 3600)
        const hls = m.hls_path
          ? await this.supabase.storage.from(m.storage_bucket).createSignedUrl(m.hls_path, 3600)
          : { data: null }
        return {
          ...m,
          thumbnail_url: thumb?.data?.signedUrl,
          media_url: fileUrl?.data?.signedUrl,
          hls_url: hls?.data?.signedUrl
        }
      }))
      ;(project as any).media = mediaWithUrls
    }

    return (project as unknown) as PortfolioProject
  }

  /**
   * Create a new portfolio project
   */
  static async createProject(data: CreatePortfolioProjectRequest): Promise<PortfolioProject> {
    const { data: project, error } = await this.from('portfolio_projects')
      .insert([{
        ...data,
        user_id: (await this.supabase.auth.getUser()).data.user?.id
      }])
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create project: ${error.message}`)
    }

    return (project as unknown) as PortfolioProject
  }

  /**
   * Update a portfolio project
   */
  static async updateProject(data: UpdatePortfolioProjectRequest): Promise<PortfolioProject> {
    const { id, ...updateData } = data
    
    const { data: project, error } = await this.from('portfolio_projects')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update project: ${error.message}`)
    }

    return (project as unknown) as PortfolioProject
  }

  /**
   * Delete a portfolio project
   */
  static async deleteProject(id: string): Promise<void> {
    // First delete all media files from storage
    const media = await this.getProjectMedia(id)
    for (const mediaItem of media) {
      await this.deleteMediaFile(mediaItem)
    }

    // Then delete the project (cascade will handle related records)
    const { error } = await this.from('portfolio_projects')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete project: ${error.message}`)
    }
  }

  // ============ MEDIA MANAGEMENT ============

  /**
   * Get all media for a project
   */
  static async getProjectMedia(
    projectId: string,
    filters: MediaFilters = {}
  ): Promise<PortfolioMedia[]> {
    let query = this.from('portfolio_media')
      .select('*')
      .eq('project_id', projectId)

    // Apply filters
    if (filters.file_type) {
      query = query.eq('file_type', filters.file_type)
    }
    if (filters.video_status) {
      query = query.eq('video_status', filters.video_status)
    }
    if (filters.is_featured !== undefined) {
      query = query.eq('is_featured', filters.is_featured)
    }

    query = query.order('sort_order', { ascending: true })

  const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch media: ${error.message}`)
    }

    return ((data || []) as unknown) as PortfolioMedia[]
  }

  /**
   * Upload media (image or video) to Supabase Storage
   * Returns metadata only - actual file processing happens in background
   */
  static async uploadMedia(request: UploadMediaRequest): Promise<MediaUploadResponse> {
    try {
      const { project_id, file, title, description, alt_text, is_featured } = request

      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const storagePath = `projects/${project_id}/${fileName}`

      // Upload main file to Supabase Storage
      const { error: uploadError } = await this.supabase.storage
        .from(this.portfolioBucket)
        .upload(storagePath, file, { contentType: file.type || undefined, upsert: false, cacheControl: '3600' })

      if (uploadError) {
        return {
          success: false,
          error: `Upload failed: ${uploadError.message}`
        }
      }

      // Generate and upload thumbnail for images and videos
      let thumbnailPath: string | undefined
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        try {
          const thumbnailResult = await generateThumbnail(file)
          if (thumbnailResult.url && thumbnailResult.type === 'generated') {
            // Convert data URL to blob
            const response = await fetch(thumbnailResult.url)
            const thumbnailBlob = await response.blob()
            
            // Generate thumbnail filename
            const thumbnailFileName = `thumb_${fileName.replace(/\.[^/.]+$/, '')}.jpg`
            const thumbStoragePath = `projects/${project_id}/thumbnails/${thumbnailFileName}`
            
            // Upload thumbnail
            const { error: thumbUploadError } = await this.supabase.storage
              .from(this.portfolioBucket)
              .upload(thumbStoragePath, thumbnailBlob, { 
                contentType: 'image/jpeg',
                upsert: false,
                cacheControl: '3600'
              })
            
            if (!thumbUploadError) {
              thumbnailPath = thumbStoragePath
            }
          }
        } catch (thumbError) {
          console.warn('Failed to generate thumbnail:', thumbError)
          // Continue without thumbnail - not critical
        }
      }

  // Determine file type (treat pdf as image-like for gallery and download)
  const isVideo = file.type.startsWith('video/')
  const isImage = file.type.startsWith('image/') || file.type === 'application/pdf'
  const fileType: 'image' | 'video' = isVideo ? 'video' : 'image'

      // Create media metadata record
      const mediaData = {
        project_id,
        filename: fileName,
        original_filename: file.name,
        file_type: fileType,
        mime_type: file.type,
        file_size: file.size,
        storage_bucket: this.portfolioBucket,
        storage_path: storagePath,
        thumbnail_path: thumbnailPath,
        title: title || file.name,
        description,
        alt_text,
        is_featured: is_featured || false,
        user_id: (await this.supabase.auth.getUser()).data.user?.id,
        ...(isVideo && {
          video_status: 'uploading' as const
        })
      }

      const { data: media, error: dbError } = await this.from('portfolio_media')
        .insert([mediaData])
        .select()
        .single()

      if (dbError) {
        // Clean up uploaded file if database insert fails
        await this.supabase.storage
          .from(this.portfolioBucket)
          .remove([storagePath])

        return {
          success: false,
          error: `Database error: ${dbError.message}`
        }
      }

      // If it's a video, create processing job
      let processingJobId: string | undefined
      if (isVideo) {
        processingJobId = await this.createVideoProcessingJob((media as any).id, storagePath)
      }

      return {
        success: true,
        media: (media as unknown) as PortfolioMedia,
        processing_job_id: processingJobId
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Upload multiple files sequentially to keep RLS/storage simple. Returns array of results.
   */
  static async uploadMultipleMedia(project_id: string, files: File[], onProgress?: (uploaded: number, total: number) => void) {
    const results: MediaUploadResponse[] = []
    let uploaded = 0
    for (const f of files) {
      const res = await this.uploadMedia({ project_id, file: f })
      results.push(res)
      uploaded += 1
      onProgress?.(uploaded, files.length)
    }
    return results
  }

  /**
   * Delete media and its files
   */
  static async deleteMedia(id: string): Promise<void> {
    // Get media metadata
    const { data: media, error: fetchError } = await this.from('portfolio_media')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !media) {
      throw new Error(`Media not found: ${fetchError?.message}`)
    }

    // Delete the media record first
    const { error: deleteError } = await this.from('portfolio_media')
      .delete()
      .eq('id', id)

    if (deleteError) {
      throw new Error(`Failed to delete media: ${deleteError.message}`)
    }

    // Clean up files in background (don't wait)
    this.deleteMediaFile(media as any).catch(console.error)
  }

  /**
   * Update media metadata
   */
  static async updateMedia(id: string, updates: Partial<PortfolioMedia>): Promise<PortfolioMedia> {
    const { data: media, error } = await this.from('portfolio_media')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update media: ${error.message}`)
    }

    return (media as unknown) as PortfolioMedia
  }

  /**
   * Set a custom thumbnail for media using another image from the same project
   */
  static async setCustomThumbnail(mediaId: string, sourceImageId: string): Promise<PortfolioMedia> {
    try {
      // Get the source image (must be an image file in the same project)
      const { data: sourceMedia, error: sourceError } = await this.from('portfolio_media')
        .select('project_id, storage_path, storage_bucket, mime_type')
        .eq('id', sourceImageId)
        .single()

      if (sourceError || !sourceMedia) {
        throw new Error('Source image not found')
      }

      if (!sourceMedia.mime_type.startsWith('image/')) {
        throw new Error('Source must be an image file')
      }

      // Get the target media (to ensure it's in the same project)
      const { data: targetMedia, error: targetError } = await this.from('portfolio_media')
        .select('project_id, thumbnail_path, storage_bucket')
        .eq('id', mediaId)
        .single()

      if (targetError || !targetMedia) {
        throw new Error('Target media not found')
      }

      if (sourceMedia.project_id !== targetMedia.project_id) {
        throw new Error('Source and target must be in the same project')
      }

      // Copy the source image to use as thumbnail
      const sourceFile = await this.supabase.storage
        .from(sourceMedia.storage_bucket)
        .download(sourceMedia.storage_path)

      if (sourceFile.error || !sourceFile.data) {
        throw new Error('Failed to download source image')
      }

      // Generate new thumbnail filename
      const customThumbnailPath = `projects/${sourceMedia.project_id}/thumbnails/custom_${mediaId}_${Date.now()}.jpg`
      
      // Upload as new thumbnail
      const { error: uploadError } = await this.supabase.storage
        .from(this.portfolioBucket)
        .upload(customThumbnailPath, sourceFile.data, {
          contentType: 'image/jpeg',
          upsert: false,
          cacheControl: '3600'
        })

      if (uploadError) {
        throw new Error(`Failed to upload custom thumbnail: ${uploadError.message}`)
      }

      // Delete old thumbnail if it exists
      if (targetMedia.thumbnail_path) {
        await this.supabase.storage
          .from(targetMedia.storage_bucket)
          .remove([targetMedia.thumbnail_path])
          .catch(console.warn) // Don't fail if old thumbnail can't be deleted
      }

      // Update media record with new thumbnail path
      return await this.updateMedia(mediaId, {
        thumbnail_path: customThumbnailPath
      })
    } catch (error) {
      throw new Error(`Failed to set custom thumbnail: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // ============ VIDEO PROCESSING ============

  /**
   * Create a video processing job
   * This triggers the background worker
   */
  private static async createVideoProcessingJob(mediaId: string, inputPath: string): Promise<string> {
    const { data: job, error } = await this.from('video_processing_jobs')
      .insert([{
        media_id: mediaId,
        job_type: 'convert',
        status: 'pending',
        input_path: inputPath,
        progress: 0
      }])
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create processing job: ${error.message}`)
    }

    // Trigger background worker (this would be a webhook or message queue)
    this.triggerVideoProcessing((job as any).id).catch(console.error)

    return (job as any).id as string
  }

  /**
   * Trigger video processing worker
   * In production, this would send a message to a queue or webhook
   */
  private static async triggerVideoProcessing(jobId: string): Promise<void> {
    // This is a placeholder - in production you'd trigger your FFmpeg worker here
    // Example: send to Redis queue, call webhook, trigger Supabase Edge Function, etc.
    
    try {
      // Call your video processing endpoint
      await fetch('/api/portfolio/process-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: jobId })
      })
    } catch (error) {
      console.error('Failed to trigger video processing:', error)
    }
  }

  /**
   * Get video processing job status
   */
  static async getProcessingJob(jobId: string): Promise<VideoProcessingJob | null> {
    const { data, error } = await this.from('video_processing_jobs')
      .select('*')
      .eq('id', jobId)
      .single()

    if (error) {
      return null
    }

    return (data as unknown) as VideoProcessingJob
  }

  // ============ SHARING & PUBLIC ACCESS ============

  /**
   * Create a shareable link for a project
   */
  static async createShare(request: CreateShareRequest): Promise<ShareResponse> {
    try {
      const shareToken = this.generateShareToken()
      
      const shareData = {
        ...request,
        share_token: shareToken,
        created_by: (await this.supabase.auth.getUser()).data.user?.id,
        ...(request.password && {
          password_hash: await this.hashPassword(request.password)
        })
      }

      const { data: share, error } = await this.from('portfolio_shares')
        .insert([shareData])
        .select()
        .single()

      if (error) {
        return {
          success: false,
          error: `Failed to create share: ${error.message}`
        }
      }

      // Also update the project to be public
      await this.from('portfolio_projects')
        .update({ is_public: true })
        .eq('id', request.project_id)

      const shareUrl = `${window.location.origin}/portfolio/share/${shareToken}`

      return {
        success: true,
        share,
        share_url: shareUrl
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Create a portfolio showcase for sharing all projects
   */
  static async createPortfolioShowcase(): Promise<{ success: boolean; showcase_url?: string; error?: string }> {
    try {
      // Use the API route to handle showcase creation properly
      const response = await fetch('/api/portfolio/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to create showcase'
        }
      }

      return data
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get portfolio showcase by token - returns all published projects for a user
   */
  static async getPortfolioShowcase(showcaseToken: string): Promise<PortfolioProject[] | null> {
    try {
      // First get the showcase record
      const { data: showcase, error: showcaseError } = await this.from('portfolio_shares')
        .select('*')
        .eq('share_token', showcaseToken)
        .eq('project_id', 'showcase')
        .eq('is_active', true)
        .single()

      if (showcaseError || !showcase) {
        return null
      }

      // Get all published projects for this user
      const { data: projects, error: projectsError } = await this.from('portfolio_projects')
        .select('*')
        .eq('user_id', showcase.user_id)
        .eq('status', 'published')
        .eq('is_public', true)
        .order('created_at', { ascending: false })

      if (projectsError || !projects) {
        return []
      }

      // Get media for each project with signed URLs
      const projectsWithMedia = await Promise.all(
        projects.map(async (project: any) => {
          const media = await this.getProjectMedia(project.id)
          const mediaWithUrls = await Promise.all(media.map(async (m) => {
            const thumb = m.thumbnail_path 
              ? await this.supabase.storage.from(m.storage_bucket).createSignedUrl(m.thumbnail_path, 3600)
              : { data: null }
            const fileUrl = await this.supabase.storage
              .from(m.storage_bucket)
              .createSignedUrl(m.storage_path, 3600)
            const hls = m.hls_path
              ? await this.supabase.storage.from(m.storage_bucket).createSignedUrl(m.hls_path, 3600)
              : { data: null }
            return {
              ...m,
              thumbnail_url: thumb?.data?.signedUrl,
              media_url: fileUrl?.data?.signedUrl,
              hls_url: hls?.data?.signedUrl
            }
          }))
          
          return {
            ...project,
            media: mediaWithUrls
          } as PortfolioProject
        })
      )

      // Update view count for the showcase
      await this.from('portfolio_shares')
        .update({ 
          view_count: (showcase as any).view_count + 1,
          last_viewed_at: new Date().toISOString()
        })
        .eq('id', (showcase as any).id)

      return projectsWithMedia
    } catch (error) {
      console.error('Error fetching portfolio showcase:', error)
      return null
    }
  }

  /**
   * Get shared project by token (simplified version of getPublicProject)
   */
  static async getSharedProject(shareToken: string): Promise<PortfolioProject | null> {
    try {
      // First get the share record
      const { data: share, error: shareError } = await this.from('portfolio_shares')
        .select('*')
        .eq('share_token', shareToken)
        .single()

      if (shareError || !share) {
        return null
      }

      // Check if share is expired
      if (share.expires_at && new Date(share.expires_at) < new Date()) {
        return null
      }

      // Update view count
      await this.from('portfolio_shares')
        .update({ 
          view_count: (share as any).view_count + 1,
          last_viewed_at: new Date().toISOString()
        })
        .eq('id', (share as any).id)

      // Get the full project with media
      const project = await this.getProject(share.project_id)
      return project
    } catch (error) {
      console.error('Error fetching shared project:', error)
      return null
    }
  }

  /**
   * Get public project by share token
   */
  static async getPublicProject(shareToken: string, password?: string): Promise<PublicPortfolioProject | null> {
    // First get the share record
    const { data: share, error: shareError } = await this.from('portfolio_shares')
      .select('*')
      .eq('share_token', shareToken)
      .single()

    if (shareError || !share) {
      return null
    }

    // Check if share is expired
    if (share.expires_at && new Date(share.expires_at) < new Date()) {
      return null
    }

    // Check password if required
    if (share.share_type === 'password' && share.password_hash) {
      if (!password || !(await this.verifyPassword(password, share.password_hash))) {
        return null
      }
    }

    // Update view count
    await this.from('portfolio_shares')
      .update({ 
        view_count: (share as any).view_count + 1,
        last_viewed_at: new Date().toISOString()
      })
      .eq('id', (share as any).id)

    // Get the project
    const { data: project, error: projectError } = await this.from('portfolio_projects')
      .select('*')
      .eq('id', (share as any).project_id)
      .single()

    if (projectError || !project) {
      return null
    }

    // Get media with signed URLs
    const media = await this.getProjectMedia(share.project_id)
    const publicMedia = await Promise.all(media.map(async (m) => {
      const thumbnailUrl = m.thumbnail_path 
        ? await this.supabase.storage.from(m.storage_bucket).createSignedUrl(m.thumbnail_path, 3600)
        : { data: null }
      
      const mediaUrl = await this.supabase.storage
        .from(m.storage_bucket)
        .createSignedUrl(m.storage_path, 3600)

      const hlsUrl = m.hls_path
        ? await this.supabase.storage.from(m.storage_bucket).createSignedUrl(m.hls_path, 3600)
        : { data: null }

      return {
        id: m.id,
        filename: m.filename,
        file_type: m.file_type,
        title: m.title,
        description: m.description,
        alt_text: m.alt_text,
        thumbnail_url: thumbnailUrl?.data?.signedUrl,
        media_url: mediaUrl?.data?.signedUrl,
        hls_url: hlsUrl?.data?.signedUrl,
        width: m.width,
        height: m.height,
        aspect_ratio: m.aspect_ratio,
        video_duration: m.video_duration
      }
    }))

    return {
      id: project.id,
      title: project.title,
      category: project.category,
      description: project.description,
      client_name: project.client_name,
      project_date: project.project_date,
      location: project.location,
      media: publicMedia
    }
  }

  // ============ CATEGORIES ============

  /**
   * Get all portfolio categories
   */
  static async getCategories(): Promise<PortfolioCategory[]> {
    const { data, error } = await this.from('portfolio_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')

    if (error) {
      throw new Error(`Failed to fetch categories: ${error.message}`)
    }

    return ((data || []) as unknown) as PortfolioCategory[]
  }

  /**
   * Create a new category
   */
  static async createCategory(data: Omit<PortfolioCategory, 'id' | 'created_at' | 'updated_at'>): Promise<PortfolioCategory> {
    const { data: category, error } = await this.from('portfolio_categories')
      .insert([data])
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create category: ${error.message}`)
    }

    return (category as unknown) as PortfolioCategory
  }

  // ============ STATISTICS ============

  /**
   * Get portfolio statistics
   */
  static async getStats(): Promise<PortfolioStats> {
    const [
      { count: totalProjects },
      { count: publishedProjects },
      { count: totalMedia },
      { count: totalImages },
      { count: totalVideos },
      { count: processingVideos },
      { count: featuredProjects },
      { count: publicShares },
      { data: viewsData }
    ] = await Promise.all([
      this.from('portfolio_projects').select('*', { count: 'exact', head: true }),
      this.from('portfolio_projects').select('*', { count: 'exact', head: true }).eq('status', 'published'),
      this.from('portfolio_media').select('*', { count: 'exact', head: true }),
      this.from('portfolio_media').select('*', { count: 'exact', head: true }).eq('file_type', 'image'),
      this.from('portfolio_media').select('*', { count: 'exact', head: true }).eq('file_type', 'video'),
      this.from('portfolio_media').select('*', { count: 'exact', head: true }).eq('video_status', 'processing'),
      this.from('portfolio_projects').select('*', { count: 'exact', head: true }).eq('featured', true),
      this.from('portfolio_shares').select('*', { count: 'exact', head: true }),
      this.from('portfolio_shares').select('view_count')
    ])

  const totalViews = (viewsData as any[])?.reduce((sum: number, item: any) => sum + (item.view_count || 0), 0) || 0

    return {
      total_projects: totalProjects || 0,
      published_projects: publishedProjects || 0,
      total_media: totalMedia || 0,
      total_images: totalImages || 0,
      total_videos: totalVideos || 0,
      processing_videos: processingVideos || 0,
      featured_projects: featuredProjects || 0,
      public_shares: publicShares || 0,
      total_views: totalViews
    }
  }

  // ============ UTILITY METHODS ============

  /**
   * Generate signed URL for media
   */
  static async getSignedUrl(bucket: string, path: string, expiresIn = 3600): Promise<string | null> {
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn)

    if (error) {
      console.error('Failed to create signed URL:', error)
      return null
    }

    return data.signedUrl
  }

  /**
   * Generate a signed URL that forces download with the original filename when possible
   */
  static async getDownloadUrlForMedia(media: PortfolioMedia, expiresIn = 3600): Promise<string | null> {
    const filename = media.original_filename || media.filename
    // Some Supabase client versions support { download } option
    const { data, error } = await this.supabase.storage
      .from(media.storage_bucket)
      // @ts-ignore - options param may not be in older type defs
      .createSignedUrl(media.storage_path, expiresIn, { download: filename })
    if (error) {
      console.error('Failed to create download URL:', error)
      return null
    }
    return data.signedUrl
  }

  /**
   * Delete media files from storage
   */
  private static async deleteMediaFile(media: PortfolioMedia): Promise<void> {
    const filesToDelete = [media.storage_path]
    
    if (media.thumbnail_path) filesToDelete.push(media.thumbnail_path)
    if (media.hls_path) filesToDelete.push(media.hls_path)
    if (media.mp4_path) filesToDelete.push(media.mp4_path)

    const { error } = await this.supabase.storage
      .from(media.storage_bucket)
      .remove(filesToDelete)

    if (error) {
      console.error('Failed to delete media files:', error)
    }
  }

  /**
   * Generate a secure share token
   */
  private static generateShareToken(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .substring(0, 32)
  }

  /**
   * Hash password for share protection
   */
  private static async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  /**
   * Verify password against hash
   */
  private static async verifyPassword(password: string, hash: string): Promise<boolean> {
    const passwordHash = await this.hashPassword(password)
    return passwordHash === hash
  }
}

export default PortfolioService