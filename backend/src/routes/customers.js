const express = require('express');
const router = express.Router();
const {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  searchCustomers
} = require('../controllers/customerController');

// GET /api/customers - Listar todos os clientes
router.get('/', getAllCustomers);

// GET /api/customers/search - Buscar clientes por termo
router.get('/search', searchCustomers);

// GET /api/customers/:id - Buscar cliente por ID
router.get('/:id', getCustomerById);

// POST /api/customers - Criar novo cliente
router.post('/', createCustomer);

// PUT /api/customers/:id - Atualizar cliente
router.put('/:id', updateCustomer);

// DELETE /api/customers/:id - Deletar cliente
router.delete('/:id', deleteCustomer);

module.exports = router; 