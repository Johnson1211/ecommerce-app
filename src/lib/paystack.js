const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY

export const initializePayment = ({ email, amount, reference, onSuccess, onClose, metadata = {} }) => {
  return new Promise((resolve, reject) => {
    if (!window.PaystackPop) {
      reject(new Error('Paystack SDK not loaded'))
      return
    }

    const handler = window.PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email,
      amount: Math.round(amount * 100), // Convert to pesewas
      currency: 'GHS',
      ref: reference,
      metadata,
      callback: (response) => {
        onSuccess?.(response)
        resolve(response)
      },
      onClose: () => {
        onClose?.()
        reject(new Error('Payment window closed'))
      },
    })

    handler.openIframe()
  })
}

export const generateReference = () => {
  return `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
}
