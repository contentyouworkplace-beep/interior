/**
 * Video Player Component
 * Lightweight HLS video player with fallback to direct MP4
 * Minimal load design using native HTML5 video with HLS.js for streaming
 */

'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import PortfolioService from '@/lib/services/portfolio-service'
import type { PortfolioMedia } from '@/types/portfolio'
import { 
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  RotateCcw,
  Loader2,
  AlertCircle,
  Download,
  ExternalLink
} from 'lucide-react'

interface VideoPlayerProps {
  media: PortfolioMedia
  autoplay?: boolean
  controls?: boolean
  className?: string
  onError?: (error: string) => void
  onLoadStart?: () => void
  onLoadedData?: () => void
}

interface PlayerState {
  playing: boolean
  muted: boolean
  currentTime: number
  duration: number
  buffered: number
  volume: number
  fullscreen: boolean
  loading: boolean
  error: string | null
}

export function VideoPlayer({ 
  media, 
  autoplay = false,
  controls = true,
  className = '',
  onError,
  onLoadStart,
  onLoadedData
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [playerState, setPlayerState] = useState<PlayerState>({
    playing: false,
    muted: false,
    currentTime: 0,
    duration: 0,
    buffered: 0,
    volume: 1,
    fullscreen: false,
    loading: true,
    error: null
  })
  const [videoUrls, setVideoUrls] = useState<{
    hls?: string
    mp4?: string
    original?: string
  }>({})
  const [hlsSupported, setHlsSupported] = useState(false)
  const [hlsInstance, setHlsInstance] = useState<any>(null)
  const { toast } = useToast()

  // Check HLS support and load HLS.js if needed
  useEffect(() => {
    const checkHlsSupport = async () => {
      const video = document.createElement('video')
      const nativeSupport = video.canPlayType('application/vnd.apple.mpegurl')
      
      if (nativeSupport) {
        setHlsSupported(true)
      } else {
        try {
          // Dynamically import HLS.js for non-Safari browsers
          const Hls = (await import('hls.js')).default
          if (Hls.isSupported()) {
            setHlsSupported(true)
          }
        } catch (error) {
          console.log('HLS.js not available, using MP4 fallback')
        }
      }
    }

    checkHlsSupport()
  }, [])

  // Load video URLs
  useEffect(() => {
    const loadVideoUrls = async () => {
      try {
        setPlayerState(prev => ({ ...prev, loading: true, error: null }))

        const urls: { hls?: string, mp4?: string, original?: string } = {}

        // Load HLS playlist if available and supported
        if (media.hls_playlist_path && hlsSupported) {
          try {
            urls.hls = await PortfolioService.getMediaUrl(media.hls_playlist_path)
          } catch (error) {
            console.warn('Failed to load HLS playlist:', error)
          }
        }

        // Load MP4 version if available
        if (media.processed_mp4_path) {
          try {
            urls.mp4 = await PortfolioService.getMediaUrl(media.processed_mp4_path)
          } catch (error) {
            console.warn('Failed to load processed MP4:', error)
          }
        }

        // Fallback to original file
        if (!urls.hls && !urls.mp4) {
          try {
            urls.original = await PortfolioService.getMediaUrl(media.storage_path)
          } catch (error) {
            throw new Error('Failed to load video file')
          }
        }

        setVideoUrls(urls)
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load video'
        setPlayerState(prev => ({ ...prev, error: errorMessage, loading: false }))
        onError?.(errorMessage)
      }
    }

    loadVideoUrls()
  }, [media, hlsSupported, onError])

  // Initialize video player when URLs are loaded
  useEffect(() => {
    if (!videoRef.current || (!videoUrls.hls && !videoUrls.mp4 && !videoUrls.original)) {
      return
    }

    const video = videoRef.current
    let hls: any = null

    const initializePlayer = async () => {
      try {
        // Try HLS first if available
        if (videoUrls.hls && hlsSupported) {
          const nativeSupport = video.canPlayType('application/vnd.apple.mpegurl')
          
          if (nativeSupport) {
            // Native HLS support (Safari)
            video.src = videoUrls.hls
          } else {
            // Use HLS.js for other browsers
            const Hls = (await import('hls.js')).default
            if (Hls.isSupported()) {
              hls = new Hls({
                enableWorker: true,
                lowLatencyMode: false,
                backBufferLength: 90
              })
              hls.loadSource(videoUrls.hls)
              hls.attachMedia(video)
              
              hls.on(Hls.Events.ERROR, (event: any, data: any) => {
                if (data.fatal) {
                  console.error('HLS fatal error:', data)
                  // Fallback to MP4
                  if (videoUrls.mp4) {
                    video.src = videoUrls.mp4
                  } else if (videoUrls.original) {
                    video.src = videoUrls.original
                  }
                }
              })
              
              setHlsInstance(hls)
            }
          }
        } 
        // Fallback to MP4 or original
        else if (videoUrls.mp4) {
          video.src = videoUrls.mp4
        } else if (videoUrls.original) {
          video.src = videoUrls.original
        }

        setPlayerState(prev => ({ ...prev, loading: false }))

      } catch (error) {
        console.error('Player initialization error:', error)
        setPlayerState(prev => ({ 
          ...prev, 
          loading: false, 
          error: 'Failed to initialize video player' 
        }))
      }
    }

    initializePlayer()

    return () => {
      if (hls) {
        hls.destroy()
        setHlsInstance(null)
      }
    }
  }, [videoUrls, hlsSupported])

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadStart = () => {
      setPlayerState(prev => ({ ...prev, loading: true }))
      onLoadStart?.()
    }

    const handleLoadedData = () => {
      setPlayerState(prev => ({ 
        ...prev, 
        loading: false,
        duration: video.duration 
      }))
      onLoadedData?.()
    }

    const handleTimeUpdate = () => {
      setPlayerState(prev => ({ ...prev, currentTime: video.currentTime }))
    }

    const handleProgress = () => {
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1)
        const bufferedPercent = (bufferedEnd / video.duration) * 100
        setPlayerState(prev => ({ ...prev, buffered: bufferedPercent }))
      }
    }

    const handlePlay = () => {
      setPlayerState(prev => ({ ...prev, playing: true }))
    }

    const handlePause = () => {
      setPlayerState(prev => ({ ...prev, playing: false }))
    }

    const handleVolumeChange = () => {
      setPlayerState(prev => ({ 
        ...prev, 
        volume: video.volume,
        muted: video.muted 
      }))
    }

    const handleError = () => {
      const error = video.error
      const errorMessage = error ? `Video error: ${error.message}` : 'Unknown video error'
      setPlayerState(prev => ({ 
        ...prev, 
        loading: false,
        error: errorMessage 
      }))
      onError?.(errorMessage)
    }

    // Add event listeners
    video.addEventListener('loadstart', handleLoadStart)
    video.addEventListener('loadeddata', handleLoadedData)
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('progress', handleProgress)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('volumechange', handleVolumeChange)
    video.addEventListener('error', handleError)

    return () => {
      video.removeEventListener('loadstart', handleLoadStart)
      video.removeEventListener('loadeddata', handleLoadedData)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('progress', handleProgress)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('volumechange', handleVolumeChange)
      video.removeEventListener('error', handleError)
    }
  }, [onError, onLoadStart, onLoadedData])

  // Player controls
  const togglePlayPause = () => {
    const video = videoRef.current
    if (!video) return

    if (playerState.playing) {
      video.pause()
    } else {
      video.play().catch(error => {
        console.error('Play error:', error)
        toast({
          title: "Playback Error",
          description: "Could not start video playback",
          variant: "destructive",
        })
      })
    }
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current
    if (!video) return
    video.volume = parseFloat(e.target.value)
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = parseFloat(e.target.value)
  }

  const toggleFullscreen = () => {
    const container = containerRef.current
    if (!container) return

    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => {
        setPlayerState(prev => ({ ...prev, fullscreen: true }))
      }).catch(error => {
        console.error('Fullscreen error:', error)
      })
    } else {
      document.exitFullscreen().then(() => {
        setPlayerState(prev => ({ ...prev, fullscreen: false }))
      })
    }
  }

  const restartVideo = () => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = 0
    video.play()
  }

  const downloadVideo = async () => {
    try {
      const url = videoUrls.mp4 || videoUrls.original
      if (url) {
        const a = document.createElement('a')
        a.href = url
        a.download = media.title
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      }
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Could not download video file",
        variant: "destructive",
      })
    }
  }

  // Format time
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // Loading state
  if (playerState.loading && !videoUrls.hls && !videoUrls.mp4 && !videoUrls.original) {
    return (
      <Card className={className}>
        <CardContent className="aspect-video flex items-center justify-center bg-muted">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading video...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (playerState.error) {
    return (
      <Card className={className}>
        <CardContent className="aspect-video flex items-center justify-center bg-muted">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-red-500" />
            <p className="text-sm text-red-600 mb-4">{playerState.error}</p>
            <Button size="sm" onClick={() => window.location.reload()}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardContent className="p-0">
        <div 
          ref={containerRef}
          className="relative aspect-video bg-black group"
        >
          {/* Video Element */}
          <video
            ref={videoRef}
            className="w-full h-full"
            autoPlay={autoplay}
            muted={playerState.muted}
            playsInline
            poster={media.thumbnail_path ? undefined : undefined} // Add thumbnail support if available
          />

          {/* Loading Overlay */}
          {playerState.loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
          )}

          {/* Controls Overlay */}
          {controls && (
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
              {/* Top Controls */}
              <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-white font-medium">{media.title}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      {videoUrls.hls && (
                        <Badge className="bg-blue-600">HLS</Badge>
                      )}
                      {media.processing_status === 'completed' && (
                        <Badge className="bg-green-600">Processed</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button size="sm" variant="secondary" onClick={downloadVideo}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="secondary" onClick={toggleFullscreen}>
                      <Maximize className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Center Play Button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <Button
                  size="lg"
                  variant="secondary"
                  className="bg-white/20 backdrop-blur-sm hover:bg-white/30"
                  onClick={togglePlayPause}
                >
                  {playerState.playing ? (
                    <Pause className="h-8 w-8" />
                  ) : (
                    <Play className="h-8 w-8" />
                  )}
                </Button>
              </div>

              {/* Bottom Controls */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="relative">
                    <div className="h-1 bg-white/30 rounded-full">
                      <div 
                        className="h-full bg-white/50 rounded-full"
                        style={{ width: `${playerState.buffered}%` }}
                      />
                      <div 
                        className="h-full bg-white rounded-full absolute top-0"
                        style={{ width: `${(playerState.currentTime / playerState.duration) * 100}%` }}
                      />
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={playerState.duration || 0}
                      value={playerState.currentTime}
                      onChange={handleSeek}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Control Buttons */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <Button size="sm" variant="ghost" onClick={togglePlayPause}>
                      {playerState.playing ? (
                        <Pause className="h-4 w-4 text-white" />
                      ) : (
                        <Play className="h-4 w-4 text-white" />
                      )}
                    </Button>
                    
                    <Button size="sm" variant="ghost" onClick={restartVideo}>
                      <RotateCcw className="h-4 w-4 text-white" />
                    </Button>

                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="ghost" onClick={toggleMute}>
                        {playerState.muted ? (
                          <VolumeX className="h-4 w-4 text-white" />
                        ) : (
                          <Volume2 className="h-4 w-4 text-white" />
                        )}
                      </Button>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={playerState.muted ? 0 : playerState.volume}
                        onChange={handleVolumeChange}
                        className="w-16 accent-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <span className="text-white text-sm">
                      {formatTime(playerState.currentTime)} / {formatTime(playerState.duration)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default VideoPlayer