const { randomUUID } = require('crypto');

const chapterModel = require('../models/chapterModel');
const storyModel = require('../models/storyModel');

const NODE_TYPES = new Set([
  'start',
  'dialogue',
  'choice',
  'scene',
  'ending'
]);

const validId = (value) => {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

const validateGraph = (body) => {
  if (
    !body ||
    !Array.isArray(body.nodes) ||
    !Array.isArray(body.edges) ||
    body.nodes.length > 500 ||
    body.edges.length > 1000
  ) {
    return { error: 'Invalid graph structure or size' };
  }

  const nodes = [];
  const edges = [];
  const nodeIds = new Set();
  const edgeIds = new Set();
  const usedHandles = new Set();

  let startCount = 0;

  for (const node of body.nodes) {
    if (
      !node ||
      !NODE_TYPES.has(node.type) ||
      !node.position ||
      !Number.isFinite(node.position.x) ||
      !Number.isFinite(node.position.y) ||
      !node.data ||
      typeof node.data !== 'object' ||
      Array.isArray(node.data)
    ) {
      return { error: 'Invalid node data' };
    }

    const id = node.id || randomUUID();

    if (
      typeof id !== 'string' ||
      id.length > 36 ||
      !id ||
      nodeIds.has(id)
    ) {
      return { error: 'Duplicate or invalid node ID' };
    }

    if (node.type === 'start') startCount++;

    nodeIds.add(id);

    nodes.push({
      id,
      type: node.type,
      position: {
        x: node.position.x,
        y: node.position.y
      },
      data: node.data
    });
  }

  if (startCount > 1) {
    return { error: 'Only one Start node is allowed' };
  }

  // สร้าง Node ID ก่อนสร้าง Edge
  for (const edge of body.edges) {
    if (
      !edge ||
      typeof edge.source !== 'string' ||
      typeof edge.target !== 'string' ||
      !nodeIds.has(edge.source) ||
      !nodeIds.has(edge.target)
    ) {
      return { error: 'Edge references an unknown node' };
    }

    const id = edge.id || randomUUID();
    const sourceHandle = edge.sourceHandle || 'default';

    if (
      typeof id !== 'string' ||
      !id ||
      id.length > 36 ||
      edgeIds.has(id) ||
      typeof sourceHandle !== 'string' ||
      !sourceHandle ||
      sourceHandle.length > 100
    ) {
      return { error: 'Invalid edge data' };
    }

    const handleKey = JSON.stringify([
      edge.source,
      sourceHandle
    ]);

    if (usedHandles.has(handleKey)) {
      return { error: 'Duplicate source handle' };
    }

    edgeIds.add(id);
    usedHandles.add(handleKey);

    edges.push({
      id,
      source: edge.source,
      target: edge.target,
      sourceHandle
    });
  }

  return { nodes, edges };
};

const getGraph = async (req, res) => {
  try {
    const chapterId = validId(req.params.chapterId);

    if (!chapterId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid chapter ID'
      });
    }

    const chapter = await chapterModel.getOwnedChapter(
      chapterId,
      req.user.userId
    );

    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found'
      });
    }

    const graph = await storyModel.getGraph(chapterId);

    return res.json({
      success: true,
      chapter_id: chapterId,
      ...graph
    });
  } catch (error) {
    console.error('Get graph error:', error);

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const saveGraph = async (req, res) => {
  try {
    const chapterId = validId(req.params.chapterId);

    if (!chapterId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid chapter ID'
      });
    }

    const chapter = await chapterModel.getOwnedChapter(
      chapterId,
      req.user.userId
    );

    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found'
      });
    }

    const result = validateGraph(req.body);

    if (result.error) {
      return res.status(400).json({
        success: false,
        message: result.error
      });
    }

    await storyModel.saveGraph(
      chapterId,
      result.nodes,
      result.edges
    );

    return res.json({
      success: true,
      message: 'Story graph saved successfully',
      nodes: result.nodes.length,
      edges: result.edges.length
    });
  } catch (error) {
    console.error('Save graph error:', error);

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getGraph,
  saveGraph
};