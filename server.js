require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 10000;

// CORS - Permitir frontend no Vercel
app.use(cors({
  origin: ['https://medi-cloud-delta.vercel.app', 'http://localhost:3000', 'http://localhost:8080'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============ MONGODB ============
const MONGODB_URI = process.env.MONGODB_URI;

if (MONGODB_URI && MONGODB_URI.startsWith('mongodb')) {
  mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ MongoDB conectado'))
    .catch(err => console.error('❌ Erro MongoDB:', err.message));
} else {
  console.warn('⚠️  MongoDB não configurado');
}

// ============ SCHEMA ============
const pacienteSchema = new mongoose.Schema({
  nome: String,
  cpf: String,
  dataNascimento: Date,
  telefone: String,
  email: String,
  convenio: String,
  endereco: String,
  observacoes: String,
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

const Paciente = mongoose.models.Paciente || mongoose.model('Paciente', pacienteSchema);

// ============ ROTAS DA API ============

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'MediCLOUD API',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// API - Pacientes
app.get('/api/pacientes', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({ success: false, message: 'MongoDB não conectado' });
    }

    const { busca } = req.query;
    let filtro = {};

    if (busca) {
      filtro = {
        $or: [
          { nome: { $regex: busca, $options: 'i' } },
          { cpf: { $regex: busca, $options: 'i' } },
          { email: { $regex: busca, $options: 'i' } }
        ]
      };
    }

    const pacientes = await Paciente.find(filtro).sort({ createdAt: -1 });
    res.json({ success: true, data: pacientes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/pacientes', async (req, res) => {
  try {
    const paciente = new Paciente(req.body);
    await paciente.save();
    res.status(201).json({ success: true, data: paciente });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.get('/api/pacientes/:id', async (req, res) => {
  try {
    const paciente = await Paciente.findById(req.params.id);
    if (!paciente) {
      return res.status(404).json({ success: false, message: 'Não encontrado' });
    }
    res.json({ success: true, data: paciente });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/pacientes/:id', async (req, res) => {
  try {
    const paciente = await Paciente.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    res.json({ success: true, data: paciente });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.delete('/api/pacientes/:id', async (req, res) => {
  try {
    await Paciente.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Removido' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Schema de Documento (adicione após o schema de Paciente)
const documentoSchema = new mongoose.Schema({
  pacienteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Paciente',
    required: true
  },
  tipo: {
    type: String,
    enum: ['Prontuário', 'Exame', 'Receita', 'Outro'],
    required: true
  },
  conteudo: String,
  status: {
    type: String,
    enum: ['Ativo', 'Pendente', 'Arquivado'],
    default: 'Ativo'
  },
  dataRegistro: { type: Date, default: Date.now }
}, { timestamps: true });

const Documento = mongoose.models.Documento || mongoose.model('Documento', documentoSchema);

// ============ ROTAS DE DOCUMENTOS ============

// LISTAR documentos
app.get('/api/documentos', async (req, res) => {
  try {
    console.log('📥 GET /api/documentos');

    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({ success: false, message: 'MongoDB não conectado' });
    }

    const { status, periodo, pacienteId } = req.query;
    let filtro = {};

    if (status) filtro.status = status;
    if (pacienteId) filtro.pacienteId = pacienteId;

    if (periodo) {
      const dias = { '7': 7, '30': 30, '90': 90 }[periodo] || 7;
      filtro.dataRegistro = {
        $gte: new Date(Date.now() - dias * 24 * 60 * 60 * 1000)
      };
    }

    const documentos = await Documento.find(filtro)
      .populate('pacienteId', 'nome')
      .sort({ dataRegistro: -1 });

    console.log('✅ Encontrados:', documentos.length, 'documentos');
    res.json({ success: true, data: documentos });

  } catch (err) {
    console.error('❌ Erro em GET /api/documentos:', err);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar documentos',
      error: err.message
    });
  }
});

// CRIAR documento
app.post('/api/documentos', async (req, res) => {
  try {
    console.log('📥 POST /api/documentos', req.body);

    const { pacienteId, tipo, conteudo, status } = req.body;

    if (!pacienteId || !tipo) {
      return res.status(400).json({
        success: false,
        message: 'Paciente e tipo são obrigatórios'
      });
    }

    const novoDocumento = new Documento({
      pacienteId,
      tipo,
      conteudo: conteudo || '',
      status: status || 'Ativo'
    });

    await novoDocumento.save();
    console.log('✅ Documento criado:', novoDocumento._id);

    res.status(201).json({
      success: true,
      data: novoDocumento
    });

  } catch (err) {
    console.error('❌ Erro em POST /api/documentos:', err);
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
});

// BUSCAR documento por ID
app.get('/api/documentos/:id', async (req, res) => {
  try {
    const documento = await Documento.findById(req.params.id)
      .populate('pacienteId', 'nome');

    if (!documento) {
      return res.status(404).json({
        success: false,
        message: 'Documento não encontrado'
      });
    }

    res.json({ success: true, data: documento });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// ATUALIZAR documento
app.put('/api/documentos/:id', async (req, res) => {
  try {
    const { tipo, conteudo, status } = req.body;

    const atualizado = await Documento.findByIdAndUpdate(
      req.params.id,
      { tipo, conteudo, status },
      { new: true, runValidators: true }
    );

    res.json({ success: true, data: atualizado });

  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
});

// EXCLUIR documento
app.delete('/api/documentos/:id', async (req, res) => {
  try {
    await Documento.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Documento removido' });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// ============ INICIAR ============

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`🌐 API: https://medicloud-backend-wy7s.onrender.com`);
});