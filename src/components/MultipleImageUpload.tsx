import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Upload, X, Image as ImageIcon, Plus } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";

interface MultipleImageUploadProps {
  onImagesUpload: (urls: string[]) => void;
  values?: string[];
  label?: string;
  maxSizeInMB?: number;
  maxImages?: number;
  acceptedFileTypes?: string;
}

const MultipleImageUpload: React.FC<MultipleImageUploadProps> = ({
  onImagesUpload,
  values = [],
  label = "Selecionar imagens",
  maxSizeInMB = 5,
  maxImages = 5,
  acceptedFileTypes = "image/*"
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previews, setPreviews] = useState<string[]>(values);
  const [tempPreviews, setTempPreviews] = useState<string[]>([]);
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    // Verificar se não excede o número máximo de imagens
    if (previews.length + files.length > maxImages) {
      toast({
        title: "Muitas imagens",
        description: `Você pode fazer upload de no máximo ${maxImages} imagens`,
        variant: "destructive"
      });
      return;
    }
    
    setIsUploading(true);
    const uploadPromises = Array.from(files).map(async (file) => {
      // Preview local temporário
      const objectUrl = URL.createObjectURL(file);
      setTempPreviews((prev) => [...prev, objectUrl]);
      
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;
        const { error } = await supabase.storage.from('produtos').upload(filePath, file);
        if (error) throw error;
        const { data: publicUrl } = supabase.storage.from('produtos').getPublicUrl(filePath);
        if (!publicUrl?.publicUrl) throw new Error('URL pública não gerada');
        return publicUrl.publicUrl;
      } catch (err) {
        toast({ title: 'Erro no upload', description: `Não foi possível carregar a imagem ${file.name}`, variant: 'destructive' });
        return null;
      }
    });

    try {
      const results = await Promise.all(uploadPromises);
      const validUrls = results.filter((url): url is string => !!url);
      const allUrls = [...previews, ...validUrls];
      setPreviews(allUrls); // Só URLs públicas!
      onImagesUpload(allUrls);
      toast({ title: "Upload concluído", description: `${validUrls.length} imagens carregadas com sucesso!` });
    } finally {
      setIsUploading(false);
      setTempPreviews([]);
    }
  };
  
  const handleRemoveImage = (index: number) => {
    const newPreviews = [...previews];
    newPreviews.splice(index, 1);
    setPreviews(newPreviews);
    onImagesUpload(newPreviews);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {previews.map((preview, index) => (
          <div key={index} className="relative rounded-md overflow-hidden h-40 bg-gray-100">
            <img 
              src={preview} 
              alt={`Preview ${index + 1}`} 
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder.svg';
              }}
            />
            <Button
              type="button"
              size="icon"
              variant="destructive"
              className="absolute top-2 right-2"
              onClick={() => handleRemoveImage(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {tempPreviews.map((preview, index) => (
          <div key={index} className="relative rounded-md overflow-hidden h-40 bg-gray-100">
            <img 
              src={preview} 
              alt={`Preview ${index + 1}`} 
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder.svg';
              }}
            />
          </div>
        ))}
        
        {previews.length + tempPreviews.length < maxImages && (
          <div className="relative flex items-center justify-center border-2 border-dashed border-gray-300 rounded-md h-40 bg-gray-50">
            <div className="space-y-2 text-center">
              <Plus className="mx-auto h-12 w-12 text-gray-400" />
              <div className="text-gray-500 text-sm">
                Adicionar imagem
              </div>
            </div>
            <input
              type="file"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileChange}
              accept={acceptedFileTypes}
              disabled={isUploading}
              multiple
            />
          </div>
        )}
      </div>
      
      <div className="flex justify-center">
        {!isUploading && previews.length + tempPreviews.length < maxImages && (
          <div className="relative">
            <input
              type="file"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileChange}
              accept={acceptedFileTypes}
              multiple
            />
            <Button
              type="button"
              variant="outline"
              disabled={isUploading}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              {label} ({previews.length + tempPreviews.length}/{maxImages})
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MultipleImageUpload;
