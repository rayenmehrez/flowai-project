const express = require('express');
const router = express.Router({ mergeParams: true });
const { supabase } = require('../config/supabase');
const { authenticate } = require('../middleware/auth');
const logger = require('../utils/logger');
const Joi = require('joi');
const multer = require('multer');
const { extractTextFromFile } = require('../utils/fileProcessor');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, TXT, and DOCX are allowed.'));
    }
  }
});

// Validation schemas
const knowledgeCreateSchema = Joi.object({
  title: Joi.string().min(2).max(200).required(),
  content: Joi.string().optional().allow(''),
  content_type: Joi.string().valid('text', 'file', 'url').required()
});

const knowledgeUpdateSchema = Joi.object({
  title: Joi.string().min(2).max(200).optional(),
  content: Joi.string().optional().allow(''),
  is_active: Joi.boolean().optional()
});

/**
 * GET /api/agents/:agentId/knowledge
 * Get all knowledge entries for agent
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { agentId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const isActive = req.query.is_active !== undefined ? req.query.is_active === 'true' : undefined;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('knowledge_base')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (isActive !== undefined) {
      query = query.eq('is_active', isActive);
    }

    const { data: knowledge, error } = await query;

    if (error) {
      logger.error('Knowledge fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch knowledge' });
    }

    // Get total count
    let countQuery = supabase
      .from('knowledge_base')
      .select('*', { count: 'exact', head: true })
      .eq('agent_id', agentId);

    if (isActive !== undefined) {
      countQuery = countQuery.eq('is_active', isActive);
    }

    const { count } = await countQuery;

    res.json({
      knowledge,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    logger.error('Get knowledge error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/agents/:agentId/knowledge
 * Create knowledge entry
 */
router.post('/', authenticate, upload.single('file'), async (req, res) => {
  try {
    const { agentId } = req.params;
    const { error, value } = knowledgeCreateSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    let content = value.content || '';
    let fileUrl = null;

    // Handle file upload
    if (value.content_type === 'file') {
      if (!req.file) {
        return res.status(400).json({ error: 'File is required for file type' });
      }

      // Extract text from file
      content = await extractTextFromFile(req.file);
      
      // Upload file to Supabase Storage
      const fileName = `${agentId}/${Date.now()}_${req.file.originalname}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('knowledge-files')
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype
        });

      if (uploadError) {
        logger.error('File upload error:', uploadError);
        return res.status(500).json({ error: 'Failed to upload file' });
      }

      const { data: { publicUrl } } = supabase.storage
        .from('knowledge-files')
        .getPublicUrl(fileName);

      fileUrl = publicUrl;
    }

    // Calculate word count
    const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;

    const { data: knowledge, error: insertError } = await supabase
      .from('knowledge_base')
      .insert({
        agent_id: agentId,
        title: value.title,
        content,
        content_type: value.content_type,
        file_url: fileUrl,
        word_count: wordCount,
        is_active: true
      })
      .select()
      .single();

    if (insertError) {
      logger.error('Knowledge creation error:', insertError);
      return res.status(500).json({ error: 'Failed to create knowledge entry' });
    }

    res.status(201).json(knowledge);
  } catch (error) {
    logger.error('Create knowledge error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * GET /api/agents/:agentId/knowledge/:knowledgeId
 * Get knowledge entry
 */
router.get('/:knowledgeId', authenticate, async (req, res) => {
  try {
    const { knowledgeId } = req.params;

    const { data: knowledge, error } = await supabase
      .from('knowledge_base')
      .select('*')
      .eq('id', knowledgeId)
      .single();

    if (error || !knowledge) {
      return res.status(404).json({ error: 'Knowledge entry not found' });
    }

    res.json(knowledge);
  } catch (error) {
    logger.error('Get knowledge error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/agents/:agentId/knowledge/:knowledgeId
 * Update knowledge entry
 */
router.put('/:knowledgeId', authenticate, async (req, res) => {
  try {
    const { knowledgeId } = req.params;
    const { error, value } = knowledgeUpdateSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const updateData = { ...value };

    // Recalculate word count if content changed
    if (value.content !== undefined) {
      updateData.word_count = value.content.split(/\s+/).filter(word => word.length > 0).length;
    }

    const { data: knowledge, error: updateError } = await supabase
      .from('knowledge_base')
      .update(updateData)
      .eq('id', knowledgeId)
      .select()
      .single();

    if (updateError) {
      logger.error('Knowledge update error:', updateError);
      return res.status(500).json({ error: 'Failed to update knowledge entry' });
    }

    res.json(knowledge);
  } catch (error) {
    logger.error('Update knowledge error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/agents/:agentId/knowledge/:knowledgeId
 * Delete knowledge entry
 */
router.delete('/:knowledgeId', authenticate, async (req, res) => {
  try {
    const { knowledgeId } = req.params;

    // Get knowledge entry to check for file
    const { data: knowledge, error: fetchError } = await supabase
      .from('knowledge_base')
      .select('file_url')
      .eq('id', knowledgeId)
      .single();

    if (fetchError) {
      return res.status(404).json({ error: 'Knowledge entry not found' });
    }

    // Delete file from storage if exists
    if (knowledge.file_url) {
      const fileName = knowledge.file_url.split('/').pop();
      await supabase.storage
        .from('knowledge-files')
        .remove([fileName]);
    }

    const { error } = await supabase
      .from('knowledge_base')
      .delete()
      .eq('id', knowledgeId);

    if (error) {
      logger.error('Knowledge deletion error:', error);
      return res.status(500).json({ error: 'Failed to delete knowledge entry' });
    }

    res.json({ message: 'Knowledge entry deleted successfully' });
  } catch (error) {
    logger.error('Delete knowledge error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/agents/:agentId/knowledge/import-url
 * Import knowledge from URL
 */
router.post('/import-url', authenticate, async (req, res) => {
  try {
    const { agentId } = req.params;
    const { url, title } = req.body;

    if (!url || !title) {
      return res.status(400).json({ error: 'URL and title are required' });
    }

    // Scrape content from URL
    const axios = require('axios');
    const cheerio = require('cheerio');

    const { data: html } = await axios.get(url);
    const $ = cheerio.load(html);
    
    // Remove script and style elements
    $('script, style').remove();
    
    // Extract text content
    const content = $('body').text()
      .replace(/\s+/g, ' ')
      .trim();

    if (!content) {
      return res.status(400).json({ error: 'Could not extract content from URL' });
    }

    const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;

    const { data: knowledge, error: insertError } = await supabase
      .from('knowledge_base')
      .insert({
        agent_id: agentId,
        title,
        content,
        content_type: 'url',
        word_count: wordCount,
        is_active: true
      })
      .select()
      .single();

    if (insertError) {
      logger.error('URL import error:', insertError);
      return res.status(500).json({ error: 'Failed to import URL' });
    }

    res.status(201).json(knowledge);
  } catch (error) {
    logger.error('URL import error:', error);
    res.status(500).json({ error: error.message || 'Failed to import URL' });
  }
});

module.exports = router;
