// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'))); // Serve os HTMLs da pasta /public

// 🔗 Conexão com MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'sua_uri_aqui';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB conectado'))
  .catch(err => console.error('❌ Erro ao conectar:', err));

// ==================== SCHEMAS ====================
const pacienteSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  cpf: { type: String, required: true, unique: true },
  dataNascimento: Date,
  telefone: String,
  email: String,
  convenio: { 
    type: String, 
    enum: ['Particular', 'Unimed', 'Bradesco Saúde', 'SUS', 'Amil'],
    default: 'Particular'
  },
  endereco: String,
  observacoes: String,
  createdAt: { type: Date, default: Date.now }
});

const documentoSchema = new mongoose.Schema({
  pacienteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Paciente' },
  tipo: { type: String, enum: ['Prontuário', 'Exame', 'Receita', 'Outro'] },
  conteudo: String,
  status: { type: String, enum: ['Ativo', 'Pendente', 'Arquivado'], default: 'Ativo' },
  dataRegistro: { type: Date, default: Date.now }
});

const leitoSchema = new mongoose.Schema({
  numero: { type: String, required: true },
  andar: String,
  tipo: { type: String, enum: ['UTI', 'Enfermaria', 'Apartamento'] },
  status: { type: String, enum: ['Livre', 'Ocupado', 'Manutenção'], default: 'Livre' },
  pacienteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Paciente' },
  observacoes: String
});

const usuarioSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  senha: { type: String, required: true }, // ⚠️ Use bcrypt em produção!
  nome: String,
  role: { type: String, default: 'admin' }
});

const Paciente = mongoose.model('Paciente', pacienteSchema);
const Documento = mongoose.model('Documento', documentoSchema);
const Leito = mongoose.model('Leito', leitoSchema);
const Usuario = mongoose.model('Usuario', usuarioSchema);

// ==================== ROTAS ====================

// 🏠 Serve o login como página inicial
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 🔐 Login
app.post('/api/login', async (req, res) => {
  const { email, senha } = req.body;
  try {
    const usuario = await Usuario.findOne({ email, senha });
    if (usuario) {
      res.json({ success: true, usuario: { nome: usuario.nome, email: usuario.email } });
    } else {
      res.status(401).json({ success: false, message: 'Email ou senha incorretos!' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erro no servidor' });
  }
});

// 👥 PACIENTES
app.get('/api/pacientes', async (req, res) => {
  try {
    const { busca } = req.query;
    const filtro = busca ? {
      $or: [
        { nome: { $regex: busca, $options: 'i' } },
        { cpf: { $regex: busca, $options: 'i' } },
        { email: { $regex: busca, $options: 'i' } }
      ]
    } : {};
    const pacientes = await Paciente.find(filtro).sort({ createdAt: -1 });
    res.json({ success: true, data: pacientes });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erro ao buscar pacientes' });
  }
});

app.post('/api/pacientes', async (req, res) => {
  try {
    const novoPaciente = new Paciente(req.body);
    await novoPaciente.save();
    res.status(201).json({ success: true, message: 'Paciente cadastrado!', data: novoPaciente });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.get('/api/pacientes/:id', async (req, res) => {
  try {
    const paciente = await Paciente.findById(req.params.id);
    if (!paciente) return res.status(404).json({ success: false, message: 'Paciente não encontrado' });
    res.json({ success: true, data: paciente });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erro ao buscar paciente' });
  }
});

app.put('/api/pacientes/:id', async (req, res) => {
  try {
    const atualizado = await Paciente.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, message: 'Paciente atualizado!', data: atualizado });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.delete('/api/pacientes/:id', async (req, res) => {
  try {
    await Paciente.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Paciente removido!' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erro ao remover paciente' });
  }
});

// 📄 DOCUMENTOS / PRONTUÁRIOS
app.get('/api/documentos', async (req, res) => {
  try {
    const { status, periodo, pacienteId } = req.query;
    let filtro = {};
    if (status) filtro.status = status;
    if (pacienteId) filtro.pacienteId = pacienteId;
    if (periodo) {
      const dias = { '7': 7, '30': 30, '90': 90 }[periodo] || 7;
      filtro.dataRegistro = { $gte: new Date(Date.now() - dias * 24 * 60 * 60 * 1000) };
    }
    const docs = await Documento.find(filtro).populate('pacienteId', 'nome').sort({ dataRegistro: -1 });
    res.json({ success: true, data: docs });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erro ao buscar documentos' });
  }
});

app.post('/api/documentos', async (req, res) => {
  try {
    const novoDoc = new Documento(req.body);
    await novoDoc.save();
    res.status(201).json({ success: true, message: 'Documento salvo!', data: novoDoc });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.put('/api/documentos/:id', async (req, res) => {
  try {
    const atualizado = await Documento.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, message: 'Documento atualizado!', data: atualizado });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 🛏️ LEITOS
app.get('/api/leitos', async (req, res) => {
  try {
    const leitos = await Leito.find().populate('pacienteId', 'nome').sort({ numero: 1 });
    res.json({ success: true, data: leitos });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erro ao buscar leitos' });
  }
});

app.post('/api/leitos', async (req, res) => {
  try {
    const novoLeito = new Leito(req.body);
    await novoLeito.save();
    res.status(201).json({ success: true, message: 'Leito cadastrado!', data: novoLeito });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.put('/api/leitos/:id', async (req, res) => {
  try {
    const atualizado = await Leito.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, message: 'Leito atualizado!', data: atualizado });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 📦 Serve demais páginas HTML
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));
app.get('/pacientes', (req, res) => res.sendFile(path.join(__dirname, 'public', 'cadastro.html')));
app.get('/documentos', (req, res) => res.sendFile(path.join(__dirname, 'public', 'documento.html')));
app.get('/leitos', (req, res) => res.sendFile(path.join(__dirname, 'public', 'leitos.html')));

// 🚀 Inicia servidor
app.listen(PORT, () => {
  console.log(`🌐 Servidor rodando em http://localhost:${PORT}`);
});