import { PaymentMethod } from '@/api/premium/types'

export type PaymentMethodOption = {
  label: string
  value: PaymentMethod
  iconClass: string
}

export const VN_PAYMENT_METHOD_OPTIONS: PaymentMethodOption[] = [
  {
    label: 'VNBANK QR',
    value: PaymentMethod.VNBANKQR,
    iconClass: 'payment-VNBANKQR'
  },
  {
    label: 'Zalo Pay',
    value: PaymentMethod.VNZALO,
    iconClass: 'payment-VNZALO'
  },
  {
    label: 'Momo Pay',
    value: PaymentMethod.VNMOMO,
    iconClass: 'payment-VNMOMO'
  },
  {
    label: 'Viettel Pay',
    value: PaymentMethod.VNVTPAY,
    iconClass: 'payment-VNVTPAY'
  }
]

export const IN_PAYMENT_METHOD_OPTIONS: PaymentMethodOption[] = [
  {
    label: 'UPI',
    value: PaymentMethod.UPI,
    iconClass: 'payment-UPI'
  }
]

export const BR_PAYMENT_METHOD_OPTIONS: PaymentMethodOption[] = [
  {
    label: 'PIX',
    value: PaymentMethod.PIX,
    iconClass: 'payment-PIX'
  }
]

export const US_PAYMENT_METHOD_OPTIONS: PaymentMethodOption[] = [
  {
    label: 'Card Payment',
    value: PaymentMethod.CARD,
    iconClass: 'payment-CARD'
  },
  {
    label: 'Online Payment',
    value: PaymentMethod.ONLINE,
    iconClass: 'payment-ONLINE'
  }
]

export type PaymentScene = 'vip' | 'tokens'

export const getPaymentMethodOptions = (
  language: string,
  scene: PaymentScene
): PaymentMethodOption[] => {
  if (String(language).toLowerCase().startsWith('pt')) return BR_PAYMENT_METHOD_OPTIONS
  if (language === 'hi-IN') return IN_PAYMENT_METHOD_OPTIONS
  if (language === 'en-US') return US_PAYMENT_METHOD_OPTIONS
  return VN_PAYMENT_METHOD_OPTIONS
}

export const getPaymentMethodOption = (
  method: PaymentMethod
): PaymentMethodOption | undefined => {
  return [...VN_PAYMENT_METHOD_OPTIONS, ...IN_PAYMENT_METHOD_OPTIONS, ...BR_PAYMENT_METHOD_OPTIONS, ...US_PAYMENT_METHOD_OPTIONS].find(
    (item) => item.value === method
  )
}
