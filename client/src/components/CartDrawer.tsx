import { useCart, CartItem } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ShoppingCart, Trash2, Plus, Minus } from 'lucide-react';
import { useState } from 'react';

function formatPrice(price: number, currency: string | null): string {
  const currencySymbols: { [key: string]: string } = {
    'EUR': '€',
    'BRL': 'R$',
    'COP': 'COP',
    'ARS': '$',
  };
  const symbol = currencySymbols[currency || 'EUR'] || currency || '€';
  return `${symbol}${price.toFixed(2)}`;
}

export function CartDrawer() {
  const { cart, removeFromCart, updateQuantity, getTotalItems, getTotalPrice, getItemsByStore, clearCart } = useCart();
  const [isOpen, setIsOpen] = useState(false);

  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();
  const itemsByStore = getItemsByStore();

  const handleCheckout = () => {
    if (cart.length === 0) return;

    // Group items by store and create WhatsApp message
    let message = '🛍️ *Meu Carrinho de Compras*\n\n';

    Object.entries(itemsByStore).forEach(([storeSlug, items]) => {
      const store = items[0];
      message += `*${store.storeName}*\n`;
      message += '─────────────────\n';

      items.forEach(item => {
        const price = parseFloat(item.price);
        const discount = item.discountPercent ? parseFloat(item.discountPercent) : 0;
        const finalPrice = discount > 0 ? price * (1 - discount / 100) : price;
        const itemTotal = finalPrice * item.quantity;
        const currency = item.currency || 'EUR';

        message += `${item.name}`;
        if (item.brand) message += ` - ${item.brand}`;
        message += `\n`;
        message += `Tamanho: ${item.selectedSize} | Qtd: ${item.quantity}\n`;
        message += `${formatPrice(finalPrice, currency)} x ${item.quantity} = ${formatPrice(itemTotal, currency)}\n`;
        if (discount > 0) {
          message += `(${discount}% OFF)\n`;
        }
        message += '\n';
      });

      message += `*Subtotal da loja: ${formatPrice(items.reduce((sum, item) => {
        const price = parseFloat(item.price);
        const discount = item.discountPercent ? parseFloat(item.discountPercent) : 0;
        const finalPrice = discount > 0 ? price * (1 - discount / 100) : price;
        return sum + finalPrice * item.quantity;
      }, 0), store.currency)}*\n\n`;
    });

    message += '═════════════════\n';
    message += `*TOTAL: ${formatPrice(totalPrice, cart[0]?.currency || 'EUR')}*\n`;
    message += `*Itens: ${totalItems}*\n\n`;
    message += '📱 Clique no link abaixo para confirmar seu pedido:';

    // Get WhatsApp number from first item (all items in same store)
    const firstStore = Object.values(itemsByStore)[0][0];
    const whatsappNumber = firstStore.storeSlug; // This will be replaced with actual number from store

    // For now, we'll open WhatsApp with the message
    // In production, you'd get the actual WhatsApp number from the store
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');

    // Clear cart after checkout
    clearCart();
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <ShoppingCart className="w-5 h-5" />
          {totalItems > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {totalItems > 99 ? '99+' : totalItems}
            </span>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full sm:w-96 flex flex-col">
        <SheetHeader>
          <SheetTitle>Carrinho de Compras</SheetTitle>
        </SheetHeader>

        {cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
            <ShoppingCart className="w-12 h-12 text-gray-300" />
            <p className="text-gray-500">Seu carrinho está vazio</p>
            <p className="text-sm text-gray-400">Adicione produtos para começar</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto space-y-4 py-4">
              {Object.entries(itemsByStore).map(([storeSlug, items]) => (
                <div key={storeSlug} className="border rounded-lg p-4">
                  <h3 className="font-semibold text-sm mb-3">{items[0].storeName}</h3>
                  <div className="space-y-3">
                    {items.map((item) => {
                      const price = parseFloat(item.price);
                      const discount = item.discountPercent ? parseFloat(item.discountPercent) : 0;
                      const finalPrice = discount > 0 ? price * (1 - discount / 100) : price;

                      return (
                        <div
                          key={`${item.productId}-${item.selectedSize}`}
                          className="flex gap-3 pb-3 border-b last:border-b-0"
                        >
                          {item.imageUrl && (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-16 h-16 object-cover rounded"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.name}</p>
                            {item.brand && <p className="text-xs text-gray-500">{item.brand}</p>}
                            <p className="text-xs text-gray-500">Tamanho: {item.selectedSize}</p>
                            <p className="text-sm font-semibold mt-1">
                              {formatPrice(finalPrice, item.currency)}
                              {discount > 0 && (
                                <span className="text-xs text-red-500 ml-1">({discount}% OFF)</span>
                              )}
                            </p>
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center gap-1 border rounded">
                              <button
                                onClick={() =>
                                  updateQuantity(
                                    item.productId,
                                    item.selectedSize,
                                    item.storeSlug,
                                    item.quantity - 1
                                  )
                                }
                                className="p-1 hover:bg-gray-100"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="px-2 text-sm font-medium">{item.quantity}</span>
                              <button
                                onClick={() =>
                                  updateQuantity(
                                    item.productId,
                                    item.selectedSize,
                                    item.storeSlug,
                                    item.quantity + 1
                                  )
                                }
                                className="p-1 hover:bg-gray-100"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            <button
                              onClick={() =>
                                removeFromCart(item.productId, item.selectedSize, item.storeSlug)
                              }
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-3">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total:</span>
                <span>{formatPrice(totalPrice, cart[0]?.currency || 'EUR')}</span>
              </div>
              <Button
                onClick={handleCheckout}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                Finalizar Compra via WhatsApp
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="w-full"
              >
                Continuar Comprando
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
