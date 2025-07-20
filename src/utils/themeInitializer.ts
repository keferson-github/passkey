// Inicializador de tema que roda antes do React carregar
// Garante que o tema seja aplicado imediatamente ao carregar a página

export const initializeTheme = () => {
  try {
    const savedTheme = localStorage.getItem('theme');
    const htmlElement = document.documentElement;
    
    // Remover classes existentes
    htmlElement.classList.remove('dark', 'light');
    
    if (savedTheme === null) {
      // Modo escuro como padrão para novos usuários
      localStorage.setItem('theme', 'dark');
      htmlElement.classList.add('dark');
      htmlElement.setAttribute('data-theme', 'dark');
      console.log('Tema padrão aplicado: dark');
    } else if (savedTheme === 'dark') {
      htmlElement.classList.add('dark');
      htmlElement.setAttribute('data-theme', 'dark');
      console.log('Tema dark aplicado do localStorage');
    } else {
      htmlElement.classList.add('light');
      htmlElement.setAttribute('data-theme', 'light');
      console.log('Tema light aplicado do localStorage');
    }
    
    return savedTheme || 'dark';
  } catch (error) {
    console.error('Erro ao inicializar tema:', error);
    // Fallback para modo escuro
    document.documentElement.classList.add('dark');
    document.documentElement.setAttribute('data-theme', 'dark');
    return 'dark';
  }
};

// Função para aplicar tema de forma robusta
export const applyTheme = (theme: 'dark' | 'light') => {
  try {
    const htmlElement = document.documentElement;
    
    // Salvar no localStorage
    localStorage.setItem('theme', theme);
    
    // Remover classes existentes
    htmlElement.classList.remove('dark', 'light');
    
    // Aplicar nova classe
    htmlElement.classList.add(theme);
    htmlElement.setAttribute('data-theme', theme);
    
    console.log(`Tema aplicado: ${theme}`);
    console.log(`Classes HTML: ${htmlElement.classList.toString()}`);
    
    return true;
  } catch (error) {
    console.error('Erro ao aplicar tema:', error);
    return false;
  }
};