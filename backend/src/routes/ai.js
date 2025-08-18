const express = require('express');
const router = express.Router();
const OpenAI = require('openai');

// Configuração do OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// GET /api/ai/health - Verificar status da IA
router.get('/health', async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({
        status: 'error',
        message: 'OpenAI API Key não configurada'
      });
    }
    
    res.json({
      status: 'ok',
      message: 'IA configurada e funcionando',
      provider: 'OpenAI'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Erro ao verificar status da IA',
      error: error.message
    });
  }
});

// POST /api/ai/generate-response - Gerar resposta automática
router.post('/generate-response', async (req, res) => {
  try {
    const { 
      customerMessage, 
      customerName, 
      customerHistory, 
      context, 
      tone = 'professional',
      maxLength = 150 
    } = req.body;

    if (!customerMessage) {
      return res.status(400).json({ error: 'Mensagem do cliente é obrigatória' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ error: 'OpenAI API Key não configurada' });
    }

    // Construir prompt baseado no contexto
    let systemPrompt = `Você é um assistente de vendas profissional e amigável. 
    Responda de forma ${tone} e objetiva, sempre focando em ajudar o cliente.
    Limite sua resposta a ${maxLength} caracteres.
    
    Contexto da empresa: ${context || 'Empresa de produtos e serviços'}
    
    Regras importantes:
    - Seja sempre educado e profissional
    - Foque em resolver a dúvida do cliente
    - Ofereça ajuda adicional quando apropriado
    - Use emojis moderadamente
    - Não seja muito formal, mas mantenha profissionalismo`;

    if (customerHistory && customerHistory.length > 0) {
      systemPrompt += `\n\nHistórico do cliente ${customerName}:\n`;
      customerHistory.slice(-5).forEach(msg => {
        systemPrompt += `${msg.role}: ${msg.content}\n`;
      });
    }

    const userPrompt = `Cliente ${customerName || 'Cliente'}: ${customerMessage}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 200,
      temperature: 0.7
    });

    const response = completion.choices[0].message.content.trim();

    res.json({
      success: true,
      data: {
        response,
        tokens: completion.usage.total_tokens,
        model: completion.model
      }
    });

  } catch (error) {
    console.error('Erro ao gerar resposta:', error);
    res.status(500).json({
      error: 'Erro ao gerar resposta automática',
      message: error.message
    });
  }
});

// POST /api/ai/analyze-sentiment - Analisar sentimento da mensagem
router.post('/analyze-sentiment', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Mensagem é obrigatória' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ error: 'OpenAI API Key não configurada' });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Analise o sentimento da mensagem e retorne apenas um JSON com: sentiment (positive, negative, neutral), confidence (0-1), urgency (low, medium, high), intent (question, complaint, purchase, greeting, other)"
        },
        {
          role: "user",
          content: message
        }
      ],
      max_tokens: 100,
      temperature: 0.1
    });

    const analysis = JSON.parse(completion.choices[0].message.content);

    res.json({
      success: true,
      data: analysis
    });

  } catch (error) {
    console.error('Erro ao analisar sentimento:', error);
    res.status(500).json({
      error: 'Erro ao analisar sentimento',
      message: error.message
    });
  }
});

// POST /api/ai/suggest-tags - Sugerir tags para cliente
router.post('/suggest-tags', async (req, res) => {
  try {
    const { customerName, customerMessages, customerBehavior } = req.body;

    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ error: 'OpenAI API Key não configurada' });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Com base nas informações do cliente, sugira até 5 tags relevantes para categorização. Retorne apenas um JSON com array de strings: ['tag1', 'tag2']"
        },
        {
          role: "user",
          content: `Cliente: ${customerName}
          Mensagens: ${customerMessages?.join(', ') || 'N/A'}
          Comportamento: ${customerBehavior || 'N/A'}`
        }
      ],
      max_tokens: 100,
      temperature: 0.3
    });

    const tags = JSON.parse(completion.choices[0].message.content);

    res.json({
      success: true,
      data: {
        suggestedTags: tags,
        confidence: 0.8
      }
    });

  } catch (error) {
    console.error('Erro ao sugerir tags:', error);
    res.status(500).json({
      error: 'Erro ao sugerir tags',
      message: error.message
    });
  }
});

// POST /api/ai/summarize-conversation - Resumir conversa
router.post('/summarize-conversation', async (req, res) => {
  try {
    const { messages, customerName } = req.body;

    if (!messages || messages.length === 0) {
      return res.status(400).json({ error: 'Mensagens são obrigatórias' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ error: 'OpenAI API Key não configurada' });
    }

    const conversationText = messages.map(msg => 
      `${msg.role}: ${msg.content}`
    ).join('\n');

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Resuma a conversa de forma concisa, destacando pontos principais, dúvidas do cliente e próximos passos sugeridos. Máximo 200 caracteres."
        },
        {
          role: "user",
          content: `Conversa com ${customerName}:\n${conversationText}`
        }
      ],
      max_tokens: 150,
      temperature: 0.3
    });

    const summary = completion.choices[0].message.content.trim();

    res.json({
      success: true,
      data: {
        summary,
        keyPoints: summary.split('. ').slice(0, 3)
      }
    });

  } catch (error) {
    console.error('Erro ao resumir conversa:', error);
    res.status(500).json({
      error: 'Erro ao resumir conversa',
      message: error.message
    });
  }
});

// POST /api/ai/generate-follow-up - Gerar follow-up
router.post('/generate-follow-up', async (req, res) => {
  try {
    const { 
      customerName, 
      lastInteraction, 
      customerInterests, 
      daysSinceLastContact = 1 
    } = req.body;

    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ error: 'OpenAI API Key não configurada' });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Gere uma mensagem de follow-up personalizada e não intrusiva. Seja natural e ofereça valor ao cliente."
        },
        {
          role: "user",
          content: `Cliente: ${customerName}
          Última interação: ${lastInteraction}
          Interesses: ${customerInterests}
          Dias desde último contato: ${daysSinceLastContact}`
        }
      ],
      max_tokens: 150,
      temperature: 0.7
    });

    const followUp = completion.choices[0].message.content.trim();

    res.json({
      success: true,
      data: {
        followUp,
        suggestedTiming: 'today',
        priority: 'medium'
      }
    });

  } catch (error) {
    console.error('Erro ao gerar follow-up:', error);
    res.status(500).json({
      error: 'Erro ao gerar follow-up',
      message: error.message
    });
  }
});

module.exports = router; 