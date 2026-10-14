import LoadingState from "../components/ui/LoadingState";
import { useToast } from "../components/ui/ToastProvider";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  useUpdateNodeInternals,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  ArrowLeft,
  Save,
  Eye,
  Workflow,
  List,
  AlertCircle,
} from "lucide-react";
import { getMyGame } from "../api/games";
import { getStoryGraph, saveStoryGraph } from "../api/story";
import NodePalette from "../components/editor/NodePalette";
import StoryNode from "../components/editor/StoryNode";
import NodeProperties from "../components/editor/NodeProperties";
import FormStoryEditor from "../components/editor/FormStoryEditor";
import StoryPreview from "../components/editor/StoryPreview";
import { randomUUID } from "../components/editor/uuid";
import { getAssets } from "../api/assets";
import { getCharacters } from "../api/characters";

const nodeTypes = {
  story: StoryNode,
};

const initialData = {
  start: { label: "Start" },

  dialogue: { speaker: "Narrator", text: "" },

  choice: { question: "What will you do?", options: [] },

  scene: { sceneName: "", backgroundUrl: "" },

  ending: { endingName: "The End" },
};

const toFlowNode = (node) => ({
  id: node.id,

  type: "story",

  position: node.position,

  data: {
    ...node.data,

    nodeType: node.type,
  },
});

const toApiNode = (node) => {
  const { nodeType, ...data } = node.data;

  return {
    id: node.id,

    type: nodeType,

    position: node.position,

    data,
  };
};

// Require one Start node when saving. Move this rule to Publish if empty drafts should be allowed.
// Validate graph integrity before saving.
function validateStory(nodes, edges) {
  const starts = nodes.filter((node) => node.data.nodeType === "start");
  if (starts.length !== 1) {
    return "Story must contain exactly one Start node.";
  }

  const nodeIds = new Set(nodes.map((node) => node.id));
  for (const edge of edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      return "A connection references a missing node.";
    }
  }
  return null;
}

function StoryEditorContent() {
  const { notify } = useToast();
  const { gameId, chapterId } = useParams();

  const [game, setGame] = useState(null);

  const [nodes, setNodes] = useState([]);

  const [edges, setEdges] = useState([]);

  const [assets, setAssets] = useState([]);
  const [characters, setCharacters] = useState([]);

  const [selectedNodeId, setSelectedNodeId] = useState(null);

  const [mode, setMode] = useState("visual");

  const [preview, setPreview] = useState(false);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [dirty, setDirty] = useState(false);

  const [error, setError] = useState("");

  const [message, setMessage] = useState("");

  const dirtyRef = useRef(false);

  useEffect(() => {
    dirtyRef.current = dirty;
  }, [dirty]);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (!dirtyRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const updateNodeInternals = useUpdateNodeInternals();

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);

      setError("");

      try {
        const [gameData, graph, assetData, characterData] = await Promise.all([
          getMyGame(gameId),
          getStoryGraph(chapterId),
          getAssets(gameId),
          getCharacters(gameId),
        ]);

        if (!active) return;

        setGame(gameData);
        setAssets(assetData);
        setCharacters(characterData);

        setNodes((graph.nodes || []).map(toFlowNode));

        setEdges(
          (graph.edges || []).map((edge) => ({
            ...edge,

            type: "smoothstep",
          })),
        );

        setDirty(false);
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message || "Unable to load story graph.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [gameId, chapterId]);

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId),

    [nodes, selectedNodeId],
  );

  const onNodesChange = useCallback((changes) => {
    setNodes((current) => applyNodeChanges(changes, current));

    if (
      changes.some((change) =>
        ["position", "remove", "add"].includes(change.type),
      )
    ) {
      setDirty(true);
    }
  }, []);

  const onEdgesChange = useCallback((changes) => {
    setEdges((current) => applyEdgeChanges(changes, current));

    if (changes.some((change) => ["remove", "add"].includes(change.type))) {
      setDirty(true);
    }
  }, []);

  const addNode = useCallback(
    (type) => {
      if (
        type === "start" &&
        nodes.some((node) => node.data.nodeType === "start")
      ) {
        setError("Only one Start node is allowed.");

        return;
      }

      const id = randomUUID();

      const data =
        type === "choice"
          ? {
              question: "What will you do?",

              options: [
                { id: randomUUID(), text: "Option 1" },

                { id: randomUUID(), text: "Option 2" },
              ],
            }
          : { ...initialData[type] };

      const newNode = {
        id,

        type: "story",

        position: {
          x: 100 + (nodes.length % 4) * 260,

          y: 100 + Math.floor(nodes.length / 4) * 180,
        },

        data: {
          ...data,

          nodeType: type,
        },
      };

      setNodes((current) => [...current, newNode]);

      setSelectedNodeId(id);

      setDirty(true);

      setError("");
    },

    [nodes],
  );

  const updateNode = useCallback(
    (nodeId, changes) => {
      setNodes((current) =>
        current.map((node) =>
          node.id === nodeId
            ? {
                ...node,

                data: { ...node.data, ...changes },
              }
            : node,
        ),
      );

      updateNodeInternals(nodeId);

      setDirty(true);
    },

    [updateNodeInternals],
  );

  const removeOption = useCallback(
    (nodeId, optionId) => {
      setNodes((current) =>
        current.map((node) =>
          node.id === nodeId
            ? {
                ...node,

                data: {
                  ...node.data,

                  options: (node.data.options || []).filter(
                    (option) => option.id !== optionId,
                  ),
                },
              }
            : node,
        ),
      );

      setEdges((current) =>
        current.filter(
          (edge) => !(edge.source === nodeId && edge.sourceHandle === optionId),
        ),
      );

      updateNodeInternals(nodeId);

      setDirty(true);
    },

    [updateNodeInternals],
  );

  const deleteNode = useCallback((nodeId) => {
    setNodes((current) => current.filter((node) => node.id !== nodeId));

    setEdges((current) =>
      current.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId,
      ),
    );

    setSelectedNodeId(null);

    setDirty(true);
  }, []);

  const connectNodes = useCallback(
    (connection) => {
      const sourceNode = nodes.find((node) => node.id === connection.source);

      const targetNode = nodes.find((node) => node.id === connection.target);

      if (
        !sourceNode ||
        !targetNode ||
        sourceNode.id === targetNode.id ||
        sourceNode.data.nodeType === "ending" ||
        targetNode.data.nodeType === "start"
      ) {
        return;
      }

      const handle = connection.sourceHandle || "default";

      if (
        sourceNode.data.nodeType === "choice" &&
        !sourceNode.data.options?.some((option) => option.id === handle)
      ) {
        return;
      }

      setEdges((current) => {
        const remaining = current.filter(
          (edge) =>
            !(
              edge.source === connection.source && edge.sourceHandle === handle
            ),
        );

        return addEdge(
          {
            ...connection,

            id: randomUUID(),

            sourceHandle: handle,

            type: "smoothstep",
          },

          remaining,
        );
      });

      setDirty(true);
    },

    [nodes],
  );

  const connectFromForm = useCallback((source, sourceHandle, target) => {
    setEdges((current) => {
      const remaining = current.filter(
        (edge) =>
          !(edge.source === source && edge.sourceHandle === sourceHandle),
      );

      if (!target) return remaining;

      return addEdge(
        {
          id: randomUUID(),

          source,

          target,

          sourceHandle,

          type: "smoothstep",
        },

        remaining,
      );
    });

    setDirty(true);
  }, []);

  const save = async () => {
    const validationError = validateStory(nodes, edges);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);

    setError("");

    setMessage("");

    try {
      await saveStoryGraph(
        chapterId,

        nodes.map(toApiNode),

        edges.map((edge) => ({
          id: edge.id,

          source: edge.source,

          target: edge.target,

          sourceHandle: edge.sourceHandle || "default",
        })),
      );

      setDirty(false);

      setMessage("Story saved successfully.");
      notify("Story saved successfully.", "success");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save story.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading Story Editor..." fullPage />;
  }

  if (!game) {
    return (
      <div className="p-12 text-center text-red-400">
        {error || "Game not found."}
      </div>
    );
  }

  return (
    <main className="flex min-h-[calc(100dvh-73px)] min-w-0 flex-col bg-[#09090f] text-white">
      <header className="flex min-w-0 flex-col gap-4 border-b border-white/10 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <Link
            to={`/creator/games/${gameId}/chapters`}
            className="mb-2 inline-flex items-center gap-2 text-xs text-gray-400 hover:text-white"
          >
            <ArrowLeft size={14} />
            Back to Chapters
          </Link>

          <h1 className="break-words text-sm font-semibold sm:text-base">
            {game.title} / Chapter {chapterId}
          </h1>

          <p className="mt-1 text-xs text-gray-400">
            {dirty ? "Unsaved changes" : "No unsaved changes"}
          </p>
        </div>

        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap">
          <button
            onClick={() => setMode("visual")}
            className={`flex min-w-0 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm sm:px-4 ${
              mode === "visual" ? "bg-purple-600" : "bg-[#171725]"
            }`}
          >
            <Workflow size={17} />
            Visual
          </button>

          <button
            onClick={() => setMode("form")}
            className={`flex min-w-0 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm sm:px-4 ${
              mode === "form" ? "bg-purple-600" : "bg-[#171725]"
            }`}
          >
            <List size={17} />
            Form
          </button>

          <button
            onClick={() => setPreview(true)}
            className="flex min-w-0 items-center justify-center gap-2 rounded-lg border border-white/15 px-3 py-2.5 text-sm sm:px-4"
          >
            <Eye size={17} />
            Preview
          </button>

          <button
            onClick={save}
            disabled={saving || !dirty}
            className="flex min-w-0 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2.5 text-sm font-medium disabled:opacity-50 sm:px-4"
          >
            <Save size={17} />

            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </header>

      {error && (
        <div
          role="alert"
          className="mx-4 mt-4 flex min-w-0 items-start gap-2 break-words rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300"
        >
          <AlertCircle size={18} />

          {error}
        </div>
      )}

      {message && (
        <p role="status" className="mx-4 mt-4 break-words text-sm text-emerald-400">
          {message}
        </p>
      )}

      <div className="flex min-w-0 flex-1 flex-col lg:min-h-[650px] lg:flex-row">
        <div className="min-w-0 shrink-0 overflow-x-auto lg:overflow-visible">
          <NodePalette onAdd={addNode} />
        </div>

        <div className="relative h-[55dvh] min-h-[350px] min-w-0 flex-none overflow-hidden sm:h-[65dvh] lg:h-auto lg:min-h-[550px] lg:flex-1">
          {mode === "visual" ? (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={connectNodes}
              onNodeClick={(_, node) => setSelectedNodeId(node.id)}
              onPaneClick={() => setSelectedNodeId(null)}
              fitView
              colorMode="dark"
              deleteKeyCode={null}
              className="bg-[#0d0d17]"
            >
              <Background color="#343044" gap={20} />

              <Controls />

              <MiniMap nodeColor="#8b5cf6" maskColor="rgba(0,0,0,0.6)" />
            </ReactFlow>
          ) : (
            <FormStoryEditor
              nodes={nodes}
              edges={edges}
              selectedNodeId={selectedNodeId}
              onSelect={setSelectedNodeId}
              onConnect={connectFromForm}
              onAdd={addNode}
            />
          )}
        </div>

        <div className="min-w-0 shrink-0 overflow-x-auto lg:overflow-visible">
          <NodeProperties
          node={selectedNode}
          onUpdate={updateNode}
          onDelete={deleteNode}
          onRemoveOption={removeOption}
          assets={assets}
          characters={characters}
          />
        </div>
      </div>

      {preview && (
        <StoryPreview
          nodes={nodes}
          edges={edges}
          assets={assets}
          characters={characters}
          onClose={() => setPreview(false)}
        />
      )}
    </main>
  );
}

export default function StoryEditor() {
  return (
    <ReactFlowProvider>
      <StoryEditorContent />
    </ReactFlowProvider>
  );
}
