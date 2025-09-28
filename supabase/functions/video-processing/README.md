# Video Processing Edge Function Configuration

This Edge Function handles video processing for the Portfolio Module using FFmpeg.

## Features

- Converts uploaded videos to MP4 format for compatibility
- Generates HLS (HTTP Live Streaming) segments for adaptive streaming
- Tracks processing progress and status
- Handles errors gracefully with job status updates

## Deployment

1. Deploy the function to Supabase:
```bash
npx supabase functions deploy video-processing
```

2. Set required environment variables in Supabase Dashboard:
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Service role key for full access

## API Endpoints

### POST /video-processing
Start a video processing job.

**Request Body:**
```json
{
  "media_id": "uuid",
  "storage_path": "path/to/video.mp4",
  "original_filename": "video.mp4"
}
```

**Response:**
```json
{
  "success": true,
  "job_id": "uuid",
  "message": "Video processing started"
}
```

### GET /video-processing?job_id=uuid
Get processing job status.

**Response:**
```json
{
  "success": true,
  "job": {
    "id": "uuid",
    "media_id": "uuid",
    "status": "completed",
    "progress": 100,
    "output_paths": {
      "mp4": "path/to/processed.mp4",
      "hls_playlist": "path/to/playlist.m3u8"
    }
  }
}
```

## Processing Status Flow

1. `pending` - Job created, waiting to start
2. `processing` - Video conversion in progress
3. `completed` - Processing finished successfully
4. `failed` - Processing failed with error

## FFmpeg Implementation Notes

The current implementation is a framework. For production use, you'll need to:

1. **Add FFmpeg Binary**: Use a containerized solution or external service
2. **Implement Actual Conversion**: Replace simulation with real FFmpeg commands
3. **Handle File I/O**: Proper temporary file management
4. **Add Quality Options**: Multiple resolution/bitrate outputs
5. **Optimize Performance**: Parallel processing, GPU acceleration if available

## Recommended FFmpeg Commands

### Basic MP4 Conversion
```bash
ffmpeg -i input.video \
  -c:v libx264 \
  -crf 23 \
  -preset medium \
  -c:a aac \
  -b:a 128k \
  -movflags +faststart \
  output.mp4
```

### HLS Generation
```bash
ffmpeg -i input.video \
  -c:v libx264 \
  -c:a aac \
  -hls_time 10 \
  -hls_list_size 0 \
  -hls_segment_filename "segment%03d.ts" \
  playlist.m3u8
```

### Adaptive Streaming (Multiple Qualities)
```bash
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
```

## Integration with Portfolio Service

The Portfolio Service automatically triggers video processing when videos are uploaded:

1. Video uploaded to Supabase Storage
2. Media record created with `processing_status: 'pending'`
3. Video processing job triggered via Edge Function
4. Job progress tracked in `video_processing_jobs` table
5. Completed paths updated in `portfolio_media` table
6. Frontend can poll job status or use real-time subscriptions

## Storage Structure

```
portfolio-media/
├── raw/
│   └── [timestamp]/
│       └── original-video.mp4
└── processed/
    └── [timestamp]/
        ├── video.mp4              # Optimized MP4
        └── video/                 # HLS segments
            ├── playlist.m3u8      # HLS playlist
            ├── segment001.ts      # Video segments
            ├── segment002.ts
            └── ...
```

## Monitoring and Debugging

- Check Edge Function logs in Supabase Dashboard
- Monitor `video_processing_jobs` table for job status
- Set up alerts for failed processing jobs
- Track storage usage and processing times

## Performance Considerations

- Large video files may timeout (Edge Functions have execution limits)
- Consider external processing services for production (AWS MediaConvert, etc.)
- Implement queue system for high-volume processing
- Use progress callbacks for long-running conversions