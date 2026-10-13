
function validateStoryGraph(nodes, edges) {
  const errors = [];

  if (!Array.isArray(nodes) || nodes.length === 0) {
    return {
      valid: false,
      errors: ['Story must contain at least one node']
    };
  }

  if (!Array.isArray(edges)) {
    return {
      valid: false,
      errors: ['Invalid story edges']
    };
  }

  const nodeMap = new Map(
    nodes.map((node) => [String(node.id), node])
  );

  const startNodes = nodes.filter(
    (node) => node.data?.nodeType === 'start'
  );

  const endingNodes = nodes.filter(
    (node) => node.data?.nodeType === 'ending'
  );

  if (startNodes.length !== 1) {
    errors.push('Story must contain exactly one Start node');
  }

  if (endingNodes.length === 0) {
    errors.push('Story must contain at least one Ending node');
  }

  for (const edge of edges) {
    if (
      !nodeMap.has(String(edge.source)) ||
      !nodeMap.has(String(edge.target))
    ) {
      errors.push(`Edge ${edge.id} references a missing node`);
    }
  }

  // Validate reachable ending
  if (startNodes.length === 1) {
    const visited = new Set();
    const queue = [String(startNodes[0].id)];

    while (queue.length > 0) {
      const currentId = queue.shift();

      if (visited.has(currentId)) continue;
      visited.add(currentId);

      const outgoing = edges.filter(
        (edge) => String(edge.source) === currentId
      );

      for (const edge of outgoing) {
        const target = String(edge.target);

        if (nodeMap.has(target) && !visited.has(target)) {
          queue.push(target);
        }
      }
    }

    const hasReachableEnding = endingNodes.some(
      (node) => visited.has(String(node.id))
    );

    if (!hasReachableEnding) {
      errors.push('No Ending node is reachable from Start');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateStoryGraph
};
