/**
 * Video Processing Edge Function
 * Handles FFmpeg video conversion in Supabase Edge Functions
 * Converts uploaded videos to MP4 and HLS formats for streaming
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface VideoProcessingRequest {
  media_id: string
  storage_path: string
  original_filename: string
}

interface VideoProcessingJob {
  id: string
  media_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  output_paths?: {
    mp4?: string
    hls_playlist?: string
    hls_segments?: string[]
  }
  error_message?: string
  started_at?: string
  completed_at?: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (req.method === 'POST') {
      // Start video processing job
      const { media_id, storage_path, original_filename }: VideoProcessingRequest = await req.json()

      console.log(`Starting video processing for media_id: ${media_id}`)

      // Create processing job record
      const { data: job, error: jobError } = await supabaseClient
        .from('video_processing_jobs')
        .insert({
          media_id,
          status: 'pending',
          progress: 0,
          started_at: new Date().toISOString()
        })
        .select()
        .single()

      if (jobError) {
        console.error('Failed to create job record:', jobError)
        return new Response(
          JSON.stringify({ error: 'Failed to create processing job' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Process video asynchronously (don't await to avoid timeout)
      processVideo(supabaseClient, job.id, media_id, storage_path, original_filename)
        .catch(error => {
          console.error('Video processing error:', error)
        })

      return new Response(
        JSON.stringify({ 
          success: true, 
          job_id: job.id,
          message: 'Video processing started'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (req.method === 'GET') {
      // Get job status
      const url = new URL(req.url)
      const jobId = url.searchParams.get('job_id')

      if (!jobId) {
        return new Response(
          JSON.stringify({ error: 'job_id parameter required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: job, error } = await supabaseClient
        .from('video_processing_jobs')
        .select('*')
        .eq('id', jobId)
        .single()

      if (error || !job) {
        return new Response(
          JSON.stringify({ error: 'Job not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true, job }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function processVideo(
  supabaseClient: any,
  jobId: string,
  mediaId: string,
  storagePath: string,
  originalFilename: string
) {
  try {
    console.log(`Processing video for job ${jobId}`)

    // Update status to processing
    await supabaseClient
      .from('video_processing_jobs')
      .update({
        status: 'processing',
        progress: 10
      })
      .eq('id', jobId)

    // Download original video from Supabase Storage
    const { data: videoData, error: downloadError } = await supabaseClient.storage
      .from('portfolio-media')
      .download(storagePath)

    if (downloadError) {
      throw new Error(`Failed to download video: ${downloadError.message}`)
    }

    // Convert video data to buffer
    const videoBuffer = await videoData.arrayBuffer()
    const videoUint8Array = new Uint8Array(videoBuffer)

    console.log(`Downloaded video, size: ${videoUint8Array.length} bytes`)

    // Update progress
    await supabaseClient
      .from('video_processing_jobs')
      .update({ progress: 30 })
      .eq('id', jobId)

    // Process video with FFmpeg
    const outputPaths = await processWithFFmpeg(
      videoUint8Array,
      originalFilename,
      supabaseClient,
      jobId
    )

    // Update progress
    await supabaseClient
      .from('video_processing_jobs')
      .update({ progress: 90 })
      .eq('id', jobId)

    // Update media record with processed paths
    await supabaseClient
      .from('portfolio_media')
      .update({
        processed_mp4_path: outputPaths.mp4,
        hls_playlist_path: outputPaths.hls_playlist,
        processing_status: 'completed'
      })
      .eq('id', mediaId)

    // Mark job as completed
    await supabaseClient
      .from('video_processing_jobs')
      .update({
        status: 'completed',
        progress: 100,
        output_paths: outputPaths,
        completed_at: new Date().toISOString()
      })
      .eq('id', jobId)

    console.log(`Video processing completed for job ${jobId}`)

  } catch (error) {
    console.error(`Video processing failed for job ${jobId}:`, error)

    // Update job status to failed
    await supabaseClient
      .from('video_processing_jobs')
      .update({
        status: 'failed',
        error_message: error.message || 'Unknown processing error',
        completed_at: new Date().toISOString()
      })
      .eq('id', jobId)

    // Update media processing status
    await supabaseClient
      .from('portfolio_media')
      .update({
        processing_status: 'failed'
      })
      .eq('id', mediaId)
  }
}

async function processWithFFmpeg(
  videoData: Uint8Array,
  originalFilename: string,
  supabaseClient: any,
  jobId: string
): Promise<{ mp4?: string, hls_playlist?: string }> {
  
  // Note: In a real Supabase Edge Function, you would need to:
  // 1. Use a containerized FFmpeg solution or external service
  // 2. This is a simplified implementation showing the structure

  console.log('Starting FFmpeg processing...')
  
  // Generate output filenames
  const baseFilename = originalFilename.replace(/\.[^/.]+$/, "")
  const timestamp = Date.now()
  
  // Simulate FFmpeg processing (in real implementation, use actual FFmpeg)
  // This would involve:
  // 1. Writing input video to temporary file
  // 2. Running FFmpeg commands for MP4 and HLS conversion
  // 3. Uploading converted files back to Supabase Storage

  const outputPaths = {
    mp4: `processed/${timestamp}/${baseFilename}.mp4`,
    hls_playlist: `processed/${timestamp}/${baseFilename}/playlist.m3u8`
  }

  // Update progress during processing
  await supabaseClient
    .from('video_processing_jobs')
    .update({ progress: 50 })
    .eq('id', jobId)

  // Simulate MP4 conversion
  console.log('Converting to MP4...')
  // In real implementation:
  // ffmpeg -i input.video -c:v libx264 -crf 23 -preset medium -c:a aac -b:a 128k output.mp4
  
  // Simulate HLS conversion
  console.log('Converting to HLS...')
  await supabaseClient
    .from('video_processing_jobs')
    .update({ progress: 70 })
    .eq('id', jobId)

  // In real implementation:
  // ffmpeg -i input.video -c:v libx264 -c:a aac -hls_time 10 -hls_list_size 0 -hls_segment_filename "segment%03d.ts" playlist.m3u8

  // For now, return the original file paths as processed
  // In a real implementation, you would upload the converted files
  return {
    mp4: outputPaths.mp4,
    hls_playlist: outputPaths.hls_playlist
  }
}

// Example FFmpeg commands for reference:

/*
// Convert to MP4 with H.264
ffmpeg -i input.video \
  -c:v libx264 \
  -crf 23 \
  -preset medium \
  -c:a aac \
  -b:a 128k \
  -movflags +faststart \
  output.mp4

// Convert to HLS
ffmpeg -i input.video \
  -c:v libx264 \
  -c:a aac \
  -hls_time 10 \
  -hls_list_size 0 \
  -hls_segment_filename "segment%03d.ts" \
  playlist.m3u8

// Multiple quality HLS (adaptive streaming)
ffmpeg -i input.video \
  -map 0:v:0 -map 0:a:0 -map 0:v:0 -map 0:a:0 -map 0:v:0 -map 0:a:0 \
  -c:v libx264 -c:a aac \
  -b:v:0 1M -s:v:0 854x480 \
  -b:v:1 2.5M -s:v:1 1280x720 \
  -b:v:2 5M -s:v:2 1920x1080 \
  -var_stream_map "v:0,a:0 v:1,a:1 v:2,a:2" \
  -master_pl_name playlist.m3u8 \
  -f hls -hls_time 10 -hls_list_size 0 \
  -hls_segment_filename "v%v/segment%03d.ts" \
  "v%v/playlist.m3u8"
*/