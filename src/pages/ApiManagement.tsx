
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useUserSwitcher } from '@/context/UserSwitcherContext';
import { useNavigate } from 'react-router-dom';
import { ArrowDownToLine, RefreshCcw, Check, X, Key } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const ApiManagement = () => {
  const { currentUser } = useUserSwitcher();
  const navigate = useNavigate();
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'restaurant_owner';
  
  const [apiUrl, setApiUrl] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importedApi, setImportedApi] = useState<string | null>(null);
  const [resetOrderTracking, setResetOrderTracking] = useState(false);
  const [importMethod, setImportMethod] = useState<'url' | 'token'>('url');

  const handleImport = () => {
    if (importMethod === 'url' && !apiUrl) {
      toast({
        title: "URL vazia",
        description: "Por favor, insira uma URL para importar a API.",
        variant: "destructive",
      });
      return;
    }

    if (importMethod === 'token' && !apiToken) {
      toast({
        title: "Token vazio",
        description: "Por favor, insira um token para importar a API.",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    
    // Simulando o processo de importação
    setTimeout(() => {
      // Verificar se é uma API de rastreamento válida
      const isTrackerApi = importMethod === 'url' 
        ? (apiUrl.includes('tracking') || apiUrl.includes('motoboy') || apiUrl.includes('rastreio'))
        : apiToken === 'delivery_tracker_api_g2sly4g0l86';

      if (isTrackerApi) {
        setImportedApi('OrderTrackingAPI');
        toast({
          title: "API importada com sucesso!",
          description: "A API de rastreamento de pedidos foi importada e está pronta para uso.",
        });
        
        // Redirecionar para a página de rastreamento para ver a nova implementação
        setTimeout(() => {
          navigate('/order-tracking');
        }, 1500);
      } else {
        toast({
          title: "API não reconhecida",
          description: "A URL ou Token fornecido não corresponde a uma API compatível ou válida.",
          variant: "destructive",
        });
      }
      
      setIsImporting(false);
    }, 2000);
  };

  const handleReset = () => {
    setResetOrderTracking(true);
    
    toast({
      title: "Página restaurada",
      description: "A página de rastreamento de pedidos foi restaurada para sua versão original.",
    });
    
    setTimeout(() => {
      setResetOrderTracking(false);
    }, 1000);
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="container mx-auto px-4 py-8">
          <Card className="w-full max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Acesso restrito</CardTitle>
              <CardDescription>
                Você não tem permissão para acessar esta página
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">
                Esta página é destinada apenas para administradores ou proprietários do restaurante.
              </p>
              <Button className="mt-4" onClick={() => navigate('/')}>
                Voltar para o início
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Gerenciamento de APIs</h1>
          <Button onClick={() => navigate('/')}>
            Voltar para o menu
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card de importação de APIs */}
          <Card>
            <CardHeader>
              <CardTitle>Importar nova API</CardTitle>
              <CardDescription>
                Insira a URL ou o Token da API que deseja importar para o sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs defaultValue="url" onValueChange={(value) => setImportMethod(value as 'url' | 'token')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="url">URL</TabsTrigger>
                  <TabsTrigger value="token">Token</TabsTrigger>
                </TabsList>
                <TabsContent value="url" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="api-url">URL da API</Label>
                    <Input 
                      id="api-url" 
                      placeholder="https://api.exemplo.com/v1/tracking" 
                      value={apiUrl}
                      onChange={(e) => setApiUrl(e.target.value)}
                    />
                  </div>
                </TabsContent>
                <TabsContent value="token" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="api-token">Token da API</Label>
                    <div className="flex gap-2">
                      <Input
                        id="api-token"
                        placeholder="delivery_tracker_api_xxxx"
                        value={apiToken}
                        onChange={(e) => setApiToken(e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="text-sm text-gray-500">
                <p>APIs suportadas:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>API de Rastreamento de Pedidos</li>
                  <li>API de Pagamentos (em breve)</li>
                  <li>API de Integração com Delivery (em breve)</li>
                </ul>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => {
                  setApiUrl('');
                  setApiToken('');
                }}
              >
                Limpar
              </Button>
              <Button 
                onClick={handleImport}
                disabled={isImporting || (importMethod === 'url' ? !apiUrl : !apiToken)}
                className="flex items-center gap-2"
              >
                {isImporting ? (
                  <>
                    <RefreshCcw className="h-4 w-4 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <ArrowDownToLine className="h-4 w-4" />
                    Importar API
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
          
          {/* Card de APIs ativas */}
          <Card>
            <CardHeader>
              <CardTitle>APIs Ativas</CardTitle>
              <CardDescription>
                Gerencie as APIs atualmente ativas no sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <p className="font-medium">API de Rastreamento de Pedidos</p>
                    <p className="text-sm text-gray-500">{importedApi ? 'Versão personalizada' : 'Versão padrão'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch 
                      checked={!!importedApi} 
                      onCheckedChange={(checked) => {
                        if (!checked) handleReset();
                      }}
                    />
                    <span className={importedApi ? 'text-green-500 text-sm' : 'text-gray-500 text-sm'}>
                      {importedApi ? 'Personalizada' : 'Padrão'}
                    </span>
                  </div>
                </div>
                
                {importedApi && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Restaurar versão padrão</span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleReset}
                      className="flex items-center gap-1"
                    >
                      <RefreshCcw className="h-3 w-3" />
                      Reset
                    </Button>
                  </div>
                )}
              </div>
              
              {/* APIs futuras */}
              <div className="space-y-4 mt-8">
                <h3 className="text-sm font-medium text-gray-500">Outras APIs (em breve)</h3>
                
                <div className="flex items-center justify-between border-b pb-3 opacity-50">
                  <div>
                    <p className="font-medium">API de Pagamentos</p>
                    <p className="text-sm text-gray-500">Integração com múltiplos gateways</p>
                  </div>
                  <span className="text-amber-500 text-sm">Em breve</span>
                </div>
                
                <div className="flex items-center justify-between opacity-50">
                  <div>
                    <p className="font-medium">API de Delivery</p>
                    <p className="text-sm text-gray-500">Integração com serviços de entrega</p>
                  </div>
                  <span className="text-amber-500 text-sm">Em breve</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center">
              <div className="text-center text-xs text-gray-500">
                <p>Contate nosso suporte para mais integrações</p>
                <p>suporte@cardapiodigital.com.br</p>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ApiManagement;
