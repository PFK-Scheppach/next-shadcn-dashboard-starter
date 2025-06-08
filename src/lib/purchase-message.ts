let purchaseMessage = 'Gracias por tu compra!';

export function getPurchaseMessage(): string {
  return purchaseMessage;
}

export function setPurchaseMessage(message: string): void {
  purchaseMessage = message;
}
