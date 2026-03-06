import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

export const useCurrency = () => {
  const { locale } = useI18n();

  const currencyConfig = computed(() => {
    const currentLocale = String(locale.value || '').trim();

    if (currentLocale.toLowerCase().startsWith('pt')) {
      return {
        symbol: 'R$',
        fractionDigits: 2,
        numberLocale: 'pt-BR',
      };
    }

    if (currentLocale === 'hi-IN') {
      return {
        symbol: '₹',
        fractionDigits: 2,
        numberLocale: 'hi-IN',
      };
    }

    if (currentLocale === 'en-US') {
      return {
        symbol: '$',
        fractionDigits: 2,
        numberLocale: 'en-US',
      };
    }

    return {
      symbol: '₫',
      fractionDigits: 0,
      numberLocale: 'vi-VN',
    };
  });

  const currencySymbol = computed(() => {
    return currencyConfig.value.symbol;
  });

  const formatCurrency = (value: number | string) => {
    const num = Number(value);
    if (isNaN(num)) return String(value);

    const { fractionDigits, numberLocale } = currencyConfig.value;

    return num.toLocaleString(numberLocale, {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
  };

  const formatNumber = (value: number | string) => {
    const num = Number(value);
    if (isNaN(num)) return String(value);

    const { numberLocale } = currencyConfig.value;

    return num.toLocaleString(numberLocale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  return {
    currencySymbol,
    formatCurrency,
    formatNumber,
  };
};
