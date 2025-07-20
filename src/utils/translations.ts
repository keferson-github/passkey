// Traduções para categorias e tipos de conta
export const categoryTranslations: Record<string, string> = {
  'Social Media': 'Redes Sociais',
  'Work & Business': 'Trabalho e Negócios',
  'Entertainment': 'Entretenimento',
  'Finance': 'Finanças',
  'Shopping': 'Compras',
  'Education': 'Educação',
  'Development': 'Desenvolvimento',
  'Health': 'Saúde',
  'Personal': 'Pessoal',
  'Site': 'Site',
  'Campanha de Marketing': 'Campanha de Marketing'
};

export const accountTypeTranslations: Record<string, string> = {
  'Google': 'Google',
  'Microsoft': 'Microsoft',
  'Meta': 'Meta',
  'Apple': 'Apple',
  'Amazon': 'Amazon',
  'Netflix': 'Netflix',
  'Spotify': 'Spotify',
  'LinkedIn': 'LinkedIn',
  'Twitter': 'Twitter',
  'Instagram': 'Instagram',
  'Facebook': 'Facebook',
  'WhatsApp': 'WhatsApp',
  'Telegram': 'Telegram',
  'Discord': 'Discord',
  'Slack': 'Slack',
  'Zoom': 'Zoom',
  'Dropbox': 'Dropbox',
  'GitHub': 'GitHub',
  'GitLab': 'GitLab',
  'Bitbucket': 'Bitbucket',
  'Adobe': 'Adobe',
  'Canva': 'Canva',
  'Figma': 'Figma',
  'Notion': 'Notion',
  'Trello': 'Trello',
  'Asana': 'Asana',
  'Jira': 'Jira',
  'Confluence': 'Confluence',
  'Salesforce': 'Salesforce',
  'HubSpot': 'HubSpot',
  'Mailchimp': 'Mailchimp',
  'WordPress': 'WordPress',
  'Shopify': 'Shopify',
  'WooCommerce': 'WooCommerce',
  'PayPal': 'PayPal',
  'Stripe': 'Stripe',
  'PicPay': 'PicPay',
  'Nubank': 'Nubank',
  'Banco do Brasil': 'Banco do Brasil',
  'Bradesco': 'Bradesco',
  'Itaú': 'Itaú',
  'Santander': 'Santander',
  'Caixa': 'Caixa',
  'Inter': 'Inter',
  'C6 Bank': 'C6 Bank',
  'XP Investimentos': 'XP Investimentos',
  'BTG Pactual': 'BTG Pactual',
  'Rico': 'Rico',
  'Clear': 'Clear',
  'Mercado Livre': 'Mercado Livre',
  'Amazon Brasil': 'Amazon Brasil',
  'Americanas': 'Americanas',
  'Casas Bahia': 'Casas Bahia',
  'Magazine Luiza': 'Magazine Luiza',
  'Shopee': 'Shopee',
  'AliExpress': 'AliExpress',
  'Wish': 'Wish',
  'Udemy': 'Udemy',
  'Coursera': 'Coursera',
  'Khan Academy': 'Khan Academy',
  'Duolingo': 'Duolingo',
  'Alura': 'Alura',
  'Rocketseat': 'Rocketseat',
  'Dio': 'Dio',
  'YouTube Premium': 'YouTube Premium',
  'Prime Video': 'Prime Video',
  'Disney+': 'Disney+',
  'HBO Max': 'HBO Max',
  'Paramount+': 'Paramount+',
  'Apple TV+': 'Apple TV+',
  'Crunchyroll': 'Crunchyroll',
  'Globoplay': 'Globoplay',
  'SporTV': 'SporTV',
  'Deezer': 'Deezer',
  'Apple Music': 'Apple Music',
  'Tidal': 'Tidal',
  'SoundCloud': 'SoundCloud',
  'Twitch': 'Twitch',
  'Steam': 'Steam',
  'Epic Games': 'Epic Games',
  'PlayStation': 'PlayStation',
  'Xbox': 'Xbox',
  'Nintendo': 'Nintendo',
  'MyFitnessPal': 'MyFitnessPal',
  'Nike Training': 'Nike Training',
  'Strava': 'Strava',
  'Fitbit': 'Fitbit',
  'Samsung Health': 'Samsung Health',
  'Google Fit': 'Google Fit'
};

export const subcategoryTranslations: Record<string, string> = {
  // Google subcategories
  'Gmail': 'Gmail',
  'Google Drive': 'Google Drive',
  'Google Calendar': 'Google Calendar',
  'Google Cloud': 'Google Cloud',
  'Google Play': 'Google Play',
  'Google Ads': 'Google Ads',
  'YouTube': 'YouTube',
  'Google Photos': 'Google Photos',
  
  // Microsoft subcategories
  'Outlook': 'Outlook',
  'OneDrive': 'OneDrive',
  'Teams': 'Teams',
  'Azure': 'Azure',
  'Xbox': 'Xbox',
  'Office 365': 'Office 365',
  'Skype': 'Skype',
  
  // Meta subcategories
  'Facebook': 'Facebook',
  'Instagram': 'Instagram',
  'WhatsApp': 'WhatsApp',
  'Messenger': 'Messenger',
  'Threads': 'Threads',
  
  // General subcategories
  'Institucional': 'Institucional'
};

// Função para traduzir categoria
export const translateCategory = (categoryName: string): string => {
  return categoryTranslations[categoryName] || categoryName;
};

// Função para traduzir tipo de conta
export const translateAccountType = (accountTypeName: string): string => {
  return accountTypeTranslations[accountTypeName] || accountTypeName;
};

// Função para traduzir subcategoria
export const translateSubcategory = (subcategoryName: string): string => {
  return subcategoryTranslations[subcategoryName] || subcategoryName;
};