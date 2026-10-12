const pool = require('../config/db');

const getGraph = async (chapterId) => {
  const [nodes] = await pool.execute(
    `SELECT *
     FROM story_nodes
     WHERE chapter_id = ?`,
    [chapterId]
  );

  const [edges] = await pool.execute(
    `SELECT *
     FROM story_edges
     WHERE chapter_id = ?`,
    [chapterId]
  );

  return {
    nodes: nodes.map((node) => ({
      id: node.node_id,
      type: node.node_type,
      position: {
        x: node.position_x,
        y: node.position_y
      },
      data: typeof node.node_data === 'string'
        ? JSON.parse(node.node_data)
        : node.node_data
    })),
    edges: edges.map((edge) => ({
      id: edge.edge_id,
      source: edge.source_node_id,
      target: edge.target_node_id,
      sourceHandle: edge.source_handle
    }))
  };
};

const saveGraph = async (chapterId, nodes, edges) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // ลบ Edge ก่อน Node เพื่อรักษา Foreign Key
    await connection.execute(
      'DELETE FROM story_edges WHERE chapter_id = ?',
      [chapterId]
    );

    await connection.execute(
      'DELETE FROM story_nodes WHERE chapter_id = ?',
      [chapterId]
    );

    // บันทึก Node ทั้งหมด
    for (const node of nodes) {
      await connection.execute(
        `INSERT INTO story_nodes
          (node_id, chapter_id, node_type,
           node_data, position_x, position_y)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          node.id,
          chapterId,
          node.type,
          JSON.stringify(node.data),
          node.position.x,
          node.position.y
        ]
      );
    }

    // บันทึก Edge หลังจาก Node ครบแล้ว
    for (const edge of edges) {
      await connection.execute(
        `INSERT INTO story_edges
          (edge_id, chapter_id, source_node_id,
           target_node_id, source_handle)
         VALUES (?, ?, ?, ?, ?)`,
        [
          edge.id,
          chapterId,
          edge.source,
          edge.target,
          edge.sourceHandle
        ]
      );
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  getGraph,
  saveGraph
};