import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Download, Play, X, Package, ScanLine, Palette } from 'lucide-react'
import { Photo, FilterPreset } from '@/types'
import { toast } from 'sonner'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'

interface BatchProcessorProps {
  photos: Photo[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ProcessingOptions {
  resize: {
    enabled: boolean
    width: number
    height: number
    maintainAspectRatio: boolean
  }
  filters: {
    brightness: number
    contrast: number
    saturation: number
    blur: number
  }
  format: 'png' | 'jpeg' | 'webp'
  quality: number
}

const defaultOptions: ProcessingOptions = {
  resize: {
    enabled: false,
    width: 1920,
    height: 1080,
    maintainAspectRatio: true
  },
  filters: {
    brightness: 0,
    contrast: 0,
    saturation: 0,
    blur: 0
  },
  format: 'jpeg',
  quality: 90
}

export const BatchProcessor: React.FC<BatchProcessorProps> = ({
  photos,
  open,
  onOpenChange
}) => {
  const [options, setOptions] = useState<ProcessingOptions>(defaultOptions)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentPhoto, setCurrentPhoto] = useState('')

  const processImage = async (photo: Photo): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Could not get canvas context'))
        return
      }

      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      img.onload = () => {
        // Calculate dimensions
        let width = img.naturalWidth
        let height = img.naturalHeight
        
        if (options.resize.enabled) {
          if (options.resize.maintainAspectRatio) {
            const aspectRatio = width / height
            if (width > height) {
              width = options.resize.width
              height = width / aspectRatio
            } else {
              height = options.resize.height
              width = height * aspectRatio
            }
          } else {
            width = options.resize.width
            height = options.resize.height
          }
        }

        canvas.width = width
        canvas.height = height

        // Apply filters
        ctx.filter = `
          brightness(${100 + options.filters.brightness}%)
          contrast(${100 + options.filters.contrast}%)
          saturate(${100 + options.filters.saturation}%)
          blur(${options.filters.blur}px)
        `

        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Failed to process image'))
            }
          },
          `image/${options.format}`,
          options.quality / 100
        )
      }

      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = photo.file_url
    })
  }

  const startBatchProcessing = async () => {
    if (photos.length === 0) return

    setProcessing(true)
    setProgress(0)

    try {
      const zip = new JSZip()
      const processedPhotos: { name: string; blob: Blob }[] = []

      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i]
        setCurrentPhoto(photo.title)
        
        try {
          const processedBlob = await processImage(photo)
          const fileName = `${photo.title}.${options.format}`
          processedPhotos.push({ name: fileName, blob: processedBlob })
          zip.file(fileName, processedBlob)
        } catch (error) {
          console.error(`Failed to process ${photo.title}:`, error)
          toast.error(`Failed to process ${photo.title}`)
        }

        setProgress(((i + 1) / photos.length) * 100)
      }

      if (processedPhotos.length > 0) {
        const zipBlob = await zip.generateAsync({ type: 'blob' })
        saveAs(zipBlob, `batch-processed-${Date.now()}.zip`)
        toast.success(`Successfully processed ${processedPhotos.length} photos`)
      }
    } catch (error) {
      console.error('Batch processing error:', error)
      toast.error('Batch processing failed')
    } finally {
      setProcessing(false)
      setProgress(0)
      setCurrentPhoto('')
    }
  }

  const updateOptions = (key: keyof ProcessingOptions, value: any) => {
    setOptions(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const updateNestedOptions = (
    parentKey: keyof ProcessingOptions,
    childKey: string,
    value: any
  ) => {
    setOptions(prev => ({
      ...prev,
      [parentKey]: {
        ...(prev[parentKey] as any),
        [childKey]: value
      }
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Batch Process {photos.length} Photos
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 space-y-6">
          <Tabs defaultValue="resize" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="resize">
                <ScanLine className="h-4 w-4 mr-2" />
                Resize
              </TabsTrigger>
              <TabsTrigger value="filters">
                <Palette className="h-4 w-4 mr-2" />
                Filters
              </TabsTrigger>
              <TabsTrigger value="export">
                <Download className="h-4 w-4 mr-2" />
                Export
              </TabsTrigger>
            </TabsList>

            <TabsContent value="resize" className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="resize-enabled"
                  checked={options.resize.enabled}
                  onChange={(e) =>
                    updateNestedOptions('resize', 'enabled', e.target.checked)
                  }
                  className="rounded"
                />
                <Label htmlFor="resize-enabled">Enable resizing</Label>
              </div>

              {options.resize.enabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Width (px)</Label>
                    <input
                      type="number"
                      value={options.resize.width}
                      onChange={(e) =>
                        updateNestedOptions('resize', 'width', parseInt(e.target.value))
                      }
                      className="w-full px-3 py-2 border rounded-md"
                      min="1"
                    />
                  </div>
                  <div>
                    <Label>Height (px)</Label>
                    <input
                      type="number"
                      value={options.resize.height}
                      onChange={(e) =>
                        updateNestedOptions('resize', 'height', parseInt(e.target.value))
                      }
                      className="w-full px-3 py-2 border rounded-md"
                      min="1"
                    />
                  </div>
                </div>
              )}

              {options.resize.enabled && (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="maintain-aspect"
                    checked={options.resize.maintainAspectRatio}
                    onChange={(e) =>
                      updateNestedOptions('resize', 'maintainAspectRatio', e.target.checked)
                    }
                    className="rounded"
                  />
                  <Label htmlFor="maintain-aspect">Maintain aspect ratio</Label>
                </div>
              )}
            </TabsContent>

            <TabsContent value="filters" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label>Brightness</Label>
                  <Slider
                    value={[options.filters.brightness]}
                    onValueChange={([value]) =>
                      updateNestedOptions('filters', 'brightness', value)
                    }
                    min={-100}
                    max={100}
                    step={1}
                  />
                  <div className="text-sm text-muted-foreground">
                    {options.filters.brightness > 0 ? '+' : ''}{options.filters.brightness}%
                  </div>
                </div>

                <div>
                  <Label>Contrast</Label>
                  <Slider
                    value={[options.filters.contrast]}
                    onValueChange={([value]) =>
                      updateNestedOptions('filters', 'contrast', value)
                    }
                    min={-100}
                    max={100}
                    step={1}
                  />
                  <div className="text-sm text-muted-foreground">
                    {options.filters.contrast > 0 ? '+' : ''}{options.filters.contrast}%
                  </div>
                </div>

                <div>
                  <Label>Saturation</Label>
                  <Slider
                    value={[options.filters.saturation]}
                    onValueChange={([value]) =>
                      updateNestedOptions('filters', 'saturation', value)
                    }
                    min={-100}
                    max={100}
                    step={1}
                  />
                  <div className="text-sm text-muted-foreground">
                    {options.filters.saturation > 0 ? '+' : ''}{options.filters.saturation}%
                  </div>
                </div>

                <div>
                  <Label>Blur</Label>
                  <Slider
                    value={[options.filters.blur]}
                    onValueChange={([value]) =>
                      updateNestedOptions('filters', 'blur', value)
                    }
                    min={0}
                    max={20}
                    step={0.5}
                  />
                  <div className="text-sm text-muted-foreground">
                    {options.filters.blur}px
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="export" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Format</Label>
                  <Select
                    value={options.format}
                    onValueChange={(value: 'png' | 'jpeg' | 'webp') =>
                      updateOptions('format', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="jpeg">JPEG</SelectItem>
                      <SelectItem value="png">PNG</SelectItem>
                      <SelectItem value="webp">WebP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {options.format !== 'png' && (
                  <div>
                    <Label>Quality</Label>
                    <Slider
                      value={[options.quality]}
                      onValueChange={([value]) => updateOptions('quality', value)}
                      min={10}
                      max={100}
                      step={5}
                    />
                    <div className="text-sm text-muted-foreground">
                      {options.quality}%
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {processing && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
              <div className="flex justify-between text-sm">
                <span>Processing: {currentPhoto}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {photos.length} photos selected
              </Badge>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={processing}
              >
                Cancel
              </Button>
              <Button
                onClick={startBatchProcessing}
                disabled={processing || photos.length === 0}
              >
                <Play className="h-4 w-4 mr-2" />
                {processing ? 'Processing...' : 'Start Processing'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}