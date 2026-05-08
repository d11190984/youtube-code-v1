import {getRequestConfig} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {routing} from '@/i18n/routing';

export default getRequestConfig(async ({requestLocale}) => {
  let locale = await requestLocale;

  // Ensure that the incoming `locale` parameter is valid
  if (!locale || !routing.locales.includes(locale as any)) {
    notFound();
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});
