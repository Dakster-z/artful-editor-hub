import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Upload, Edit, Package, Download } from 'lucide-react'
import { PhotoUpload } from '@/components/gallery/PhotoUpload'
import { PhotoGrid } from '@/components/gallery/PhotoGrid'
import { PhotoEditor } from '@/components/editor/PhotoEditor'
import { BatchProcessor } from '@/components/batch/BatchProcessor'
import { Photo } from '@/types'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/auth/AuthProvider'
import { toast } from 'sonner'

export const Gallery: React.FC = () => {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([])
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null)
  const [showBatchProcessor, setShowBatchProcessor] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchPhotos()
    }
  }, [user])

  const fetchPhotos = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPhotos(data || [])
    } catch (error) {
      console.error('Fetch photos error:', error)
      toast.error('Failed to fetch photos')
    } finally {
      setLoading(false)
    }
  }

  const handleUploadComplete = (newPhotos: Photo[]) => {
    setPhotos(prev => [...newPhotos, ...prev])
  }

  const handlePhotosChange = (updatedPhotos: Photo[]) => {
    setPhotos(updatedPhotos)
  }

  const handleEditPhoto = (photo: Photo) => {
    setEditingPhoto(photo)
  }

  const handleBatchProcess = () => {
    if (selectedPhotos.length === 0) {
      toast.error('Please select photos to process')
      return
    }
    setShowBatchProcessor(true)
  }

  const selectedPhotoObjects = photos.filter(photo => 
    selectedPhotos.includes(photo.id)
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading photos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Photo Gallery</h1>
          <p className="text-muted-foreground">
            Manage and edit your photos with professional tools
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {selectedPhotos.length > 0 && (
            <Button onClick={handleBatchProcess} variant="outline">
              <Package className="h-4 w-4 mr-2" />
              Batch Process ({selectedPhotos.length})
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="gallery" className="w-full">
        <TabsList>
          <TabsTrigger value="gallery">Gallery</TabsTrigger>
          <TabsTrigger value="upload">Upload</TabsTrigger>
        </TabsList>
        
        <TabsContent value="gallery" className="space-y-6">
          <PhotoGrid
            photos={photos}
            onPhotosChange={handlePhotosChange}
            onEditPhoto={handleEditPhoto}
            selectedPhotos={selectedPhotos}
            onSelectionChange={setSelectedPhotos}
          />
        </TabsContent>
        
        <TabsContent value="upload" className="space-y-6">
          <div className="max-w-3xl mx-auto">
            <PhotoUpload onUploadComplete={handleUploadComplete} />
          </div>
        </TabsContent>
      </Tabs>

      <PhotoEditor
        photo={editingPhoto}
        open={!!editingPhoto}
        onOpenChange={(open) => !open && setEditingPhoto(null)}
        onSave={(blob, metadata) => {
          // Handle saving edited photo
          toast.success('Photo saved successfully!')
          setEditingPhoto(null)
        }}
      />

      <BatchProcessor
        photos={selectedPhotoObjects}
        open={showBatchProcessor}
        onOpenChange={setShowBatchProcessor}
      />
    </div>
  )
}