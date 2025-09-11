// Middleware de autenticação simplificado para testes
const authSimple = (req, res, next) => {
  // Usar o usuário real que está logado no sistema
  req.user = {
    id: 'd1059681-d231-446c-8845-47bd38b86266', // ID real do usuário Rony
    email: 'rony@ronypetersonadv.com', // Email real do usuário
    role: 'owner'
  };
  
  console.log('🔐 Usuário real autenticado:', req.user);
  next();
};

module.exports = authSimple;
