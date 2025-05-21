import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { useCart } from '@/context/CartContext';
import { Loader2, CreditCard, Wallet, CreditCardIcon, DollarSign, QrCode } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DeliveryAddressFormProps } from './DeliveryAddressFormProps';
import { supabase } from '@/integrations/supabase/client';

// Payment method type
type PaymentMethod = 'card' | 'pix' | 'cash' | 'card_delivery';

const DeliveryAddressForm = ({ onSuccess }: DeliveryAddressFormProps) => {
  const { subtotal, cartItems, clearCart } = useCart();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isCepLoading, setIsCepLoading] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'address' | 'payment'>('address');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [paymentTab, setPaymentTab] = useState<'online' | 'delivery'>('online');
  const [needChange, setNeedChange] = useState(false);
  const [changeAmount, setChangeAmount] = useState('');
  const deliveryFee = 5;
  const total = subtotal + deliveryFee;
  
  // Dados de endereço
  const [cep, setCep] = useState('45603652'); // CEP padrão para testes
  const [endereco, setEndereco] = useState('R. Nova');
  const [numero, setNumero] = useState('325');
  const [bairro, setBairro] = useState('Califórnia');
  const [complemento, setComplemento] = useState('');
  const [cidade, setCidade] = useState('Itabuna');
  const [estado, setEstado] = useState('BA');
  
  // Script do Mercado Pago
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://sdk.mercadopago.com/js/v2';
    script.async = true;
    document.body.appendChild(script);
    
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Função para buscar endereço pelo CEP
  const buscarEnderecoPorCep = async () => {
    if (!cep || cep.length !== 8) {
      toast({
        title: "CEP inválido",
        description: "Por favor, insira um CEP válido com 8 dígitos.",
        variant: "destructive"
      });
      return;
    }
    
    setIsCepLoading(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      
      if (data.erro) {
        toast({
          title: "CEP não encontrado",
          description: "Não foi possível encontrar o endereço para este CEP.",
          variant: "destructive"
        });
      } else {
        setEndereco(data.logradouro);
        setBairro(data.bairro);
        setCidade(data.localidade);
        setEstado(data.uf);
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao buscar o endereço. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsCepLoading(false);
    }
  };

  const handleAddressSubmit = () => {
    // Validar dados do endereço
    if (!cep || !endereco || !numero || !bairro || !cidade || !estado) {
      toast({
        title: "Dados incompletos",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }
    
    setPaymentStep('payment');
  };
  
  // Função centralizada para criar pedido (delivery ou interno)
  const createOrder = async ({ paymentMethod, paymentInfo, deliveryAddress }: { paymentMethod: PaymentMethod; paymentInfo: string; deliveryAddress: any; }) => {
    const baseOrder = { total, restaurant_id: 1, status: 'pending', delivery_type: 'delivery', payment_method: paymentMethod };
    const orderObj = { ...baseOrder, address: deliveryAddress, table_name: null };
    console.log('Payload orderObj:', orderObj);
    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([orderObj])
        .select('id');
      if (orderError || !orderData || orderData.length === 0) {
        console.error('Supabase error detalhe:', orderError);
        console.log('Order payload:', orderObj);
        throw new Error('Não foi possível criar o pedido');
      }
      const orderId = orderData[0].id;
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(cartItems.map(item => ({ product_id: item.id, quantity: item.quantity, price: item.price, notes: item.notes || undefined, order_id: orderId })));
      if (itemsError) {
        console.error("Erro ao criar itens do pedido:", itemsError);
        throw new Error("Não foi possível adicionar os itens ao pedido");
      }
      clearCart();
      if (onSuccess) onSuccess();
      toast({ title: "Pedido realizado!", description: `Seu pedido foi registrado com sucesso. Pagamento: ${paymentInfo}` });
    } catch (error) {
      console.error("Erro ao processar pedido:", error);
      toast({ title: "Erro ao processar pedido", description: error instanceof Error ? error.message : "Ocorreu um erro ao processar seu pedido", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const initMercadoPago = async () => {
    if ((paymentMethod === 'card' || paymentMethod === 'pix') && window.MercadoPago) {
      setIsLoading(true);
      setTimeout(async () => {
        const paymentInfo = paymentMethod === 'card' ? 'Cartão (Mercado Pago)' : 'Pix (Mercado Pago)';
        const addressObj = { street: endereco, number: numero, complement: complemento || undefined, neighborhood: bairro, city: cidade, state: estado, zipcode: cep };
        await createOrder({ paymentMethod, paymentInfo, deliveryAddress: addressObj });
      }, 2000);
    }
  };

  const handlePayment = async () => {
    if (paymentTab === 'online' && (paymentMethod === 'card' || paymentMethod === 'pix')) {
      await initMercadoPago();
    } else if (paymentTab === 'delivery' && (paymentMethod === 'cash' || paymentMethod === 'card_delivery')) {
      setIsLoading(true);
      const paymentInfo = paymentMethod === 'cash'
        ? (needChange ? `Dinheiro (Troco para R$ ${changeAmount})` : 'Dinheiro (Sem troco)')
        : 'Cartão na entrega';
      const addressObj = { street: endereco, number: numero, complement: complemento || undefined, neighborhood: bairro, city: cidade, state: estado, zipcode: cep };
      await createOrder({ paymentMethod, paymentInfo, deliveryAddress: addressObj });
    }
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setCep(value);
  };

  const handleCepBlur = () => {
    if (cep.length === 8) {
      buscarEnderecoPorCep();
    }
  };

  const handleChangeAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d.,]/g, '');
    setChangeAmount(value);
  };

  const handleTabChange = (value: 'online' | 'delivery') => {
    setPaymentTab(value);
    
    // Atualizar método de pagamento com base na aba selecionada
    if (value === 'online') {
      setPaymentMethod('card');
    } else {
      setPaymentMethod('card_delivery');
    }
  };

  return (
    <div className="space-y-6">
      {paymentStep === 'address' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cep">CEP</Label>
              <div className="flex">
                <Input
                  id="cep"
                  placeholder="00000000"
                  value={cep}
                  onChange={handleCepChange}
                  onBlur={handleCepBlur}
                  maxLength={8}
                  className="flex-1"
                  disabled={isCepLoading}
                />
                {isCepLoading && (
                  <div className="ml-2 flex items-center">
                    <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="endereco">Endereço</Label>
              <Input
                id="endereco"
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                placeholder="Rua, Avenida, etc"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="numero">Número</Label>
              <Input
                id="numero"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                placeholder="123"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bairro">Bairro</Label>
              <Input
                id="bairro"
                value={bairro}
                onChange={(e) => setBairro(e.target.value)}
                placeholder="Bairro"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="complemento">Complemento (opcional)</Label>
              <Input
                id="complemento"
                value={complemento}
                onChange={(e) => setComplemento(e.target.value)}
                placeholder="Apto, Bloco, etc"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cidade">Cidade</Label>
              <Input
                id="cidade"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                placeholder="Cidade"
                readOnly
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="estado">Estado</Label>
              <Input
                id="estado"
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                placeholder="UF"
                readOnly
              />
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">R$ {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Taxa de entrega</span>
              <span className="font-medium">R$ {deliveryFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-6">
              <span className="font-bold text-lg">Total</span>
              <span className="font-bold text-lg">R$ {total.toFixed(2)}</span>
            </div>
          </div>

          <Button
            onClick={handleAddressSubmit}
            className="w-full bg-menu-primary hover:bg-menu-primary/90"
          >
            Continuar para pagamento
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="font-bold text-lg">Forma de pagamento</h3>
          
          <Tabs defaultValue="online" value={paymentTab} onValueChange={(v) => handleTabChange(v as 'online' | 'delivery')} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="online">Pagar agora</TabsTrigger>
              <TabsTrigger value="delivery">Pagar na entrega</TabsTrigger>
            </TabsList>
            
            <TabsContent value="online" className="mt-4 space-y-4">
              <RadioGroup 
                value={paymentMethod} 
                onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
                className="space-y-3"
              >
                <Card className={`p-4 cursor-pointer ${paymentMethod === 'card' ? 'border-menu-primary ring-2 ring-menu-primary' : ''}`}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card" className="flex items-center cursor-pointer">
                      <CreditCard className="h-4 w-4 mr-2" />
                      <span>Cartão de Crédito/Débito</span>
                    </Label>
                  </div>
                </Card>
                
                <Card className={`p-4 cursor-pointer ${paymentMethod === 'pix' ? 'border-menu-primary ring-2 ring-menu-primary' : ''}`}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pix" id="pix" />
                    <Label htmlFor="pix" className="flex items-center cursor-pointer">
                      <QrCode className="h-4 w-4 mr-2" />
                      <span>PIX</span>
                    </Label>
                  </div>
                </Card>
              </RadioGroup>
              
              {/* Aqui seria renderizado o formulário do Mercado Pago */}
              <div id="mercadopago-checkout" className="mt-4"></div>
            </TabsContent>
            
            <TabsContent value="delivery" className="mt-4 space-y-4">
              <RadioGroup 
                value={paymentMethod} 
                onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
                className="space-y-3"
              >
                <Card className={`p-4 cursor-pointer ${paymentMethod === 'card_delivery' ? 'border-menu-primary ring-2 ring-menu-primary' : ''}`}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="card_delivery" id="card_delivery" />
                    <Label htmlFor="card_delivery" className="flex items-center cursor-pointer">
                      <CreditCardIcon className="h-4 w-4 mr-2" />
                      <span>Cartão na entrega</span>
                    </Label>
                  </div>
                </Card>
                
                <div>
                  <Card className={`p-4 cursor-pointer ${paymentMethod === 'cash' ? 'border-menu-primary ring-2 ring-menu-primary' : ''}`}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="cash" id="cash" />
                      <Label htmlFor="cash" className="flex items-center cursor-pointer">
                        <DollarSign className="h-4 w-4 mr-2" />
                        <span>Dinheiro</span>
                      </Label>
                    </div>
                  </Card>
                  
                  {paymentMethod === 'cash' && (
                    <div className="mt-3 pl-2">
                      <div className="flex items-center mb-2">
                        <input
                          type="checkbox"
                          id="needChange"
                          checked={needChange}
                          onChange={(e) => setNeedChange(e.target.checked)}
                          className="mr-2"
                        />
                        <Label htmlFor="needChange">Precisa de troco?</Label>
                      </div>
                      
                      {needChange && (
                        <div className="space-y-1">
                          <Label htmlFor="changeAmount">Troco para quanto?</Label>
                          <Input
                            id="changeAmount"
                            value={changeAmount}
                            onChange={handleChangeAmountChange}
                            placeholder="50,00"
                            className="w-full"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </RadioGroup>
            </TabsContent>
          </Tabs>
          
          <div className="pt-4 border-t">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">R$ {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Taxa de entrega</span>
              <span className="font-medium">R$ {deliveryFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-6">
              <span className="font-bold text-lg">Total</span>
              <span className="font-bold text-lg">R$ {total.toFixed(2)}</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setPaymentStep('address')}
              className="flex-1"
            >
              Voltar
            </Button>
            
            <Button
              onClick={handlePayment}
              className="flex-1 bg-menu-primary hover:bg-menu-primary/90"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                'Finalizar Pedido'
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryAddressForm;
