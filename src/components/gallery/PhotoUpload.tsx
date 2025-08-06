import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import { supabase, uploadImage } from '@/lib/supabase'
import { useAuth } from '@/components/auth/AuthProvider'

interface PhotoUploadProps {
  onUploadComplete: (photos: any[]) => void
}

export const PhotoUpload: React.FC<PhotoUploadProps> = ({ onUploadComplete }) => {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const { user } = useAuth()

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const imageFiles = acceptedFiles.filter(file => file.type.startsWith('image/'))
    if (imageFiles.length !== acceptedFiles.length) {
      toast.error('Only image files are supported')
    }
    setSelectedFiles(prev => [...prev, ...imageFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp', '.webp']
    },
    multiple: true
  })

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const uploadFiles = async () => {
    if (!user || selectedFiles.length === 0) return

    setUploading(true)
    setUploadProgress(0)
    
    try {
      const uploadedPhotos = []
      
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i]
        
        // Upload to Supabase Storage
        const { path, url } = await uploadImage(file, user.id)
        
        // Save metadata to database
        const { data: photo, error } = await supabase
          .from('photos')
          .insert({
            user_id: user.id,
            title: file.name.split('.')[0],
            file_path: path,
            file_url: url,
            file_size: file.size,
            mime_type: file.type
          })
          .select()
          .single()
        
        if (error) throw error
        
        uploadedPhotos.push(photo)
        setUploadProgress(((i + 1) / selectedFiles.length) * 100)
      }
      
      toast.success(`Successfully uploaded ${uploadedPhotos.length} photos`)
      onUploadComplete(uploadedPhotos)
      setSelectedFiles([])
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload photos')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-primary bg-primary/10'
            : 'border-muted-foreground/25 hover:border-primary'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        {isDragActive ? (
          <p>Drop the images here ...</p>
        ) : (
          <div>
            <p className="text-lg font-medium mb-2">Drag & drop images here</p>
            <p className="text-muted-foreground">or click to select files</p>
          </div>
        )}
      </div>

      {selectedFiles.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-medium">Selected Files ({selectedFiles.length})</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {selectedFiles.map((file, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square rounded-lg border bg-muted flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-sm truncate mt-1">{file.name}</p>
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeFile(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
          
          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}
          
          <Button 
            onClick={uploadFiles} 
            disabled={uploading || !user}
            className="w-full"
          >
            {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} file(s)`}
          </Button>
        </div>
      )}
    </div>
  )
}