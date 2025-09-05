import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  
  const getBreadcrumbs = () => {
    const pathnames = location.pathname.split('/').filter(x => x);
    
    const breadcrumbs = pathnames.map((name, index) => {
      const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
      const isLast = index === pathnames.length - 1;
      
      // Mapear nomes amigáveis para as rotas
      const getDisplayName = (route: string) => {
        const routeMap: { [key: string]: string } = {
          'dashboard': 'Dashboard',
          'leads': 'Leads',
          'pipeline-vendas': 'Pipeline de Vendas',
          'whatsapp': 'WhatsApp',
          'gerenciar-instancias': 'Gerenciar Instâncias',
          'relatorios': 'Relatórios',
          'configuracoes': 'Configurações'
        };
        
        return routeMap[route] || route.charAt(0).toUpperCase() + route.slice(1);
      };
      
      return {
        name: getDisplayName(name),
        route: routeTo,
        isLast
      };
    });
    
    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  if (breadcrumbs.length === 0) return null;

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
      {/* Home */}
      <Link
        to="/dashboard"
        className="flex items-center space-x-1 text-gray-400 hover:text-gray-600 transition-colors duration-200"
      >
        <Home className="h-4 w-4" />
        <span>Home</span>
      </Link>
      
      {/* Separador */}
      <ChevronRight className="h-4 w-4 text-gray-300" />
      
      {/* Breadcrumbs */}
      {breadcrumbs.map((breadcrumb, index) => (
        <React.Fragment key={breadcrumb.route}>
          {breadcrumb.isLast ? (
            <span className="text-gray-900 font-medium">
              {breadcrumb.name}
            </span>
          ) : (
            <Link
              to={breadcrumb.route}
              className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
            >
              {breadcrumb.name}
            </Link>
          )}
          
          {!breadcrumb.isLast && (
            <ChevronRight className="h-4 w-4 text-gray-300" />
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumbs;

