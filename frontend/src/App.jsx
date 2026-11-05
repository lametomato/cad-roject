import React from "react";
import ModelViewer from "./components/ModelViewer";

import {
  Box,
  Cuboid,
  Layers,
  Settings,
  Plus,
  Download,
  Sparkles,
  Search,
  RotateCcw,
  Maximize,
  Eye,
  SlidersHorizontal,
  FileBox,
  History,
  CircleHelp,
  ChevronDown,
  PanelLeftClose,
} from "lucide-react";

function App() {
  const [description, setDescription] = React.useState("");
  const [result, setResult] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [isMaximized, setIsMaximized] = React.useState(false);
  const [modelName, setModelName] = React.useState("Untitled Model");
  const [editingName, setEditingName] = React.useState(false);
  const [savedModels, setSavedModels] = React.useState([]);
  const [selectedModel, setSelectedModel] = React.useState(null);
  const [activePage, setActivePage] = React.useState("workspace");
  const [units, setUnits] = React.useState(
  () => localStorage.getItem("cad-units") || "mm"
);

const [showGrid, setShowGrid] = React.useState(
  () => localStorage.getItem("cad-grid") !== "false"
);

const [showAxes, setShowAxes] = React.useState(
  () => localStorage.getItem("cad-axes") !== "false"
);

React.useEffect(() => {
  localStorage.setItem("cad-units", units);
}, [units]);

React.useEffect(() => {
  localStorage.setItem("cad-grid", showGrid);
}, [showGrid]);

React.useEffect(() => {
  localStorage.setItem("cad-axes", showAxes);
}, [showAxes]);

  const [currentModelId, setCurrentModelId] = React.useState(null);

  async function deleteModel(modelId) {
  try {
    const response = await fetch(
      `http://127.0.0.1:8000/models/${modelId}`,
      {
        method: "DELETE",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Unable to delete model.");
    }

    setSavedModels((prev) =>
      prev.filter((model) => model.model_id !== modelId)
    );

    if (currentModelId === modelId) {
      setCurrentModelId(null);
      setResult(null);
    }

    alert("Model deleted successfully.");
  } catch (err) {
    alert(err.message);
  }
}

  async function renameModel(modelId, newName) {
  try {
    const response = await fetch(
      `http://127.0.0.1:8000/models/${modelId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          new_name: newName,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Unable to rename model.");
    }

    setSavedModels((prev) =>
      prev.map((model) =>
        model.model_id === modelId
          ? { ...model, name: newName }
          : model
      )
    );

    if (currentModelId === modelId) {
      setModelName(newName);
    }

    alert("Model renamed successfully.");
  } catch (err) {
    alert(err.message);
  }
}

  function openModelDetails(model) {
  setSelectedModel(model);
  setActivePage("details");
}

  React.useEffect(() => {
  async function loadModels() {
    try {
      const response = await fetch("http://127.0.0.1:8000/models");

      if (!response.ok) {
        throw new Error("Unable to load saved models.");
      }

      const data = await response.json();
      setSavedModels(data);
    } catch (err) {
      console.error("Error loading models:", err);
    }
  }

  loadModels();
}, []);

  async function generateModel() {
    if (!description.trim()) {
      setError("Please describe the object first.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("http://127.0.0.1:8000/generate-cad", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
  description,
  name: modelName,
}),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Generation failed.");
      }

      setResult(data.parameters);
      setCurrentModelId(data.model_id);
      setSavedModels((prev) => [
  ...prev,
  {
    model_id: data.model_id,
    name: modelName,
    description: description,
    parameters: data.parameters,
  },
]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="min-h-screen bg-[#090d16] text-slate-200 flex">

      {/* Sidebar */}
      {sidebarOpen && (
  <aside className="w-64 border-r border-slate-800 p-5 flex flex-col">
        <div className="flex items-center gap-3 mb-10">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Cuboid size={23} />
          </div>
          <div>
            <h1 className="font-bold text-lg">AI CAD Studio</h1>
            <p className="text-xs text-slate-500">Intelligent CAD workspace</p>
          </div>
        </div>

        <p className="text-xs text-slate-500 mb-3">WORKSPACE</p>

        <nav className="space-y-2">
          <button
  onClick={() => setActivePage("workspace")}
  className="w-full flex items-center gap-3 bg-blue-600/15 text-blue-400 p-3 rounded-lg"
>
  <Box size={19} />
  <span>Model Workspace</span>
</button>

          <button
  onClick={() => setActivePage("models")}
  className="w-full flex items-center gap-3 p-3 text-slate-400 hover:bg-slate-800 rounded-lg"
>
  <Layers size={19} />
  <span>My Models</span>
</button>

          <button
  onClick={() => setActivePage("recent")}
  className="w-full flex items-center gap-3 p-3 text-slate-400 hover:bg-slate-800 rounded-lg"
>
  <History size={19} />
  <span>Recent Projects</span>
</button>
        </nav>

        <div className="mt-auto space-y-3">
          
          <button
  onClick={() => setActivePage("settings")}
  className={`w-full flex items-center gap-3 p-3 rounded-lg ${
    activePage === "settings"
      ? "bg-blue-600/15 text-blue-400"
      : "text-slate-400 hover:bg-slate-800"
  }`}
>
  <Settings size={18} />
  <span>Settings</span>
</button>
          <div className="border-t border-slate-800 pt-4 text-xs text-slate-500">
            AI CAD Generator v0.1
          </div>
        </div>
      </aside>)}

      {/* Main Workspace */}
      <main className="flex-1 min-w-0">

        {/* Topbar */}
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-7">
          <div className="flex items-center gap-3">
            <button
  onClick={() => setSidebarOpen(!sidebarOpen)}
  className="text-slate-500 hover:text-white"
  title="Toggle sidebar"
>
  <PanelLeftClose size={19} />
</button>
            <span className="text-sm text-slate-400">Workspace /</span>
            {editingName ? (
  <input
    value={modelName}
    onChange={(e) => setModelName(e.target.value)}
    onBlur={() => setEditingName(false)}
    onKeyDown={(e) => {
      if (e.key === "Enter") setEditingName(false);
    }}
    autoFocus
    className="bg-slate-800 text-white px-2 py-1 rounded w-40 outline-none"
  />
) : (
  <span
    onClick={() => setEditingName(true)}
    className="cursor-pointer hover:text-white"
    title="Click to rename"
  >
    {modelName}
  </span>
)}
            <ChevronDown size={15} className="text-slate-500" />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">All changes saved</span>
            <button
onClick={() => window.open(`http://127.0.0.1:8000/download-model/${currentModelId}`, "_blank")}  disabled={!result}
  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 px-4 py-2 rounded-lg text-sm"
>
  <Download size={16} />
  Export
</button>
          </div>
        </header>

        {activePage === "workspace" ? (
  <div className="p-7">

          {/* Page heading */}
          <div className="mb-7">
            <h2 className="text-2xl font-semibold">Model Workspace</h2>
            <p className="text-sm text-slate-500 mt-1">
              Describe your idea and turn it into a 3D printable model.
            </p>
          </div>

          {/* AI Prompt */}
          {!isMaximized && (
<section className="bg-[#111827] border border-slate-800 rounded-xl p-5 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={18} className="text-blue-400" />
              <h3 className="font-medium">AI Model Generator</h3>
              <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-1 rounded-full">
                Gemini AI
              </span>
            </div>

            <textarea
              value={description}
onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the 3D object you want to create... Example: Create a rectangular box with length 120mm, width 80mm and height 50mm."
              className="w-full h-24 bg-[#090d16] border border-slate-700 rounded-lg p-4 text-sm outline-none focus:border-blue-500 resize-none"
            />

            <div className="flex justify-between items-center mt-4">
              <p className="text-xs text-slate-500">
                Be specific about dimensions and features.
              </p>
              <button onClick={generateModel} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-5 py-2.5 rounded-lg text-sm font-medium">
                <Sparkles size={16} />
                {loading ? "generating..." : "GenerateModel"}
              </button>
              {error && (
  <p className="text-red-400 text-sm mt-3">
    {error}
  </p>
)}
{loading && (
  <p className="text-blue-400 text-sm mt-3">
    Analyzing your description...
  </p>
)}
            </div>
          </section>)}

          {/* Workspace Grid */}
          <div className={isMaximized ? "grid grid-cols-1 gap-5" : "grid grid-cols-1 xl:grid-cols-3 gap-5"}>

            {/* 3D Viewport */}
            <section className="xl:col-span-2 bg-[#111827] border border-slate-800 rounded-xl overflow-hidden">

              <div className="h-14 border-b border-slate-800 flex items-center justify-between px-5">
                <div className="flex items-center gap-2">
                  <Eye size={17} className="text-blue-400" />
                  <span className="text-sm font-medium">3D Viewport</span>
                </div>

                <div className="flex items-center gap-4">
  <button
    onClick={() => window.open("http://127.0.0.1:8000/download-model", "_blank")}
    disabled={!result}
    className="flex items-center gap-2 text-xs bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 px-3 py-2 rounded-lg text-white"
  >
    <Download size={15} />
    Download STL
  </button>

  <RotateCcw size={17} className="text-slate-500" />
  <button
  onClick={() => setIsMaximized(!isMaximized)}
  className="text-slate-400 hover:text-white"
  title="Maximize viewer"
>
  <Maximize size={16} />
</button>
</div>
              </div>

              <div className={`${isMaximized ? "h-[80vh]" : "h-[430px]"} bg-[#0c1220] flex flex-col items-center justify-center relative`}>
                {showGrid && (
  <div
    className="absolute inset-0 opacity-20"
    style={{
      backgroundImage:
        "linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)",
      backgroundSize: "35px 35px"
    }}
  />
)}

                {result ? (
  <ModelViewer
  modelUrl={`http://127.0.0.1:8000/download-model/${currentModelId}`}
  showAxes={showAxes}
/>
) : (
  <div className="relative text-center">
    <Cuboid size={65} className="mx-auto text-slate-600 mb-4" />
    <h3 className="text-slate-300 font-medium">No model generated</h3>
    <p className="text-sm text-slate-500 mt-2">
      Your 3D model will appear here.
    </p>
  </div>
)}

                <div className="absolute bottom-4 left-5 text-xs text-slate-500">
                  {`Perspective View · ${
  units === "mm" ? "Millimeters" : units === "cm" ? "Centimeters" : "Inches"
}`}
                </div>
              </div>
            </section>

            {/* Parameters */}
            {!isMaximized && (
<section className="bg-[#111827] border border-slate-800 rounded-xl">

              <div className="h-14 border-b border-slate-800 flex items-center px-5 gap-2">
                <SlidersHorizontal size={17} className="text-blue-400" />
                <span className="text-sm font-medium">Model Parameters</span>
              </div>

              <div className="p-5">
                {result ? (
  <div className="space-y-4">
    <div>
      <p className="text-xs text-slate-500">Object Type</p>
      <p className="text-sm text-white">{result.object_type}</p>
    </div>

    {["length", "width", "height", "thickness", "radius", "inner_radius", "hole_diameter", "angle"].map((key) => (
  result[key] != null && (
    <div key={key} className="flex justify-between text-sm">
      <span className="text-slate-400 capitalize">{key.replace("_", " ")}</span>
      <span className="text-white">
        {key === "angle"
          ? `${result[key]} °`
          : `${(result[key] / (units === "mm" ? 1 : units === "cm" ? 10 : 25.4)).toFixed(2)} ${units}`}
      </span>
    </div>
  )
))}

    <div className="border-t border-slate-800 pt-3">
      <p className="text-xs text-slate-500 mb-2">Features</p>
      {result.features?.length > 0 ? (
        result.features.map((feature, index) => (
          <p key={index} className="text-sm text-slate-300">
            {feature.type} {feature.diameter ? `- ${feature.diameter} mm` : ""}
          </p>
        ))
      ) : (
        <p className="text-sm text-slate-500">No additional features</p>
      )}
    </div>

    {result.clarification_needed && (
      <p className="text-sm text-yellow-400">
        {result.clarification_question}
      </p>
    )}
  </div>
) : (
  <div className="text-center py-10">
    <FileBox size={38} className="mx-auto text-slate-600 mb-3" />
    <p className="text-sm text-slate-400">No parameters yet</p>
    <p className="text-xs text-slate-600 mt-2">
      Generate a model to view its dimensions and features.
    </p>
  </div>
)}

                <div className="border-t border-slate-800 pt-4">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Units</span>
                    <span>
  {units === "mm" ? "Millimeters (mm)" : units === "cm" ? "Centimeters (cm)" : "Inches (in)"}
</span>
                  </div>
                </div>
              </div>
            </section>)}

          </div>

          {/* Bottom status */}
          <div className="flex justify-between items-center mt-6 text-xs text-slate-500">
            <span>Ready to generate</span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              Frontend running
            </span>
          </div>

        </div>
        ) : activePage === "models" ? (
  <div className="p-7">
    <h2 className="text-2xl font-semibold mb-6">My Models</h2>
    {savedModels.length > 0 ? (
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mt-6">
    {savedModels.map((model) => (
      <div
  key={model.model_id}
  onClick={() => {
    setCurrentModelId(model.model_id);
    setResult(model.parameters);
    setModelName(model.name);
    setActivePage("workspace");
  }}
  className="bg-[#111827] border border-slate-800 rounded-xl p-5 cursor-pointer hover:border-blue-500"
>
        <h3 className="font-medium text-white">{model.name}</h3>

        <button
  onClick={(e) => {
    e.stopPropagation();
    openModelDetails(model);
  }}
  className="mt-3 mr-4 text-sm text-purple-400 hover:text-purple-300"
>
  View Details
</button>

        <button
  onClick={(e) => {
    e.stopPropagation();

    const newName = window.prompt(
      "Enter the new model name:",
      model.name
    );

    if (newName !== null && newName.trim()) {
      renameModel(model.model_id, newName.trim());
    }
  }}
  className="mt-3 mr-4 text-sm text-blue-400 hover:text-blue-300"
>
  Rename
</button>

        <button
  onClick={(e) => {
    e.stopPropagation();
    deleteModel(model.model_id);
  }}
  className="mt-4 text-sm text-red-400 hover:text-red-300"
>
  Delete Model
</button>
        <p className="text-sm text-slate-500 mt-2">
          {model.parameters.object_type}
        </p>
        <p className="text-xs text-slate-500 mt-2">
          ID: {model.model_id.slice(0, 8)}
        </p>
      </div>
    ))}
  </div>
) : (
  <p className="text-sm text-slate-500 mt-4">
    No models generated yet.
  </p>
)}
  </div>
) : activePage === "details" ? (
  <div className="p-7">
    <button
  onClick={() => setActivePage("models")}
  className="text-sm text-blue-400 hover:text-blue-300 mb-5"
>
  ← Back to My Models
</button>
    <h2 className="text-2xl font-semibold mb-6">Model Details</h2>
    {selectedModel ? (
  <div className="bg-[#111827] border border-slate-800 rounded-xl p-6">
    <h3 className="text-xl font-medium text-white">
      {selectedModel.name}
    </h3>

    <p className="text-sm text-slate-400 mt-3">
      {selectedModel.description || "No description available."}
    </p>
  <div className="border-t border-slate-800 mt-5 pt-5 space-y-3">
  <div>
    <p className="text-xs text-slate-500">Object Type</p>
    <p className="text-sm text-white">
      {selectedModel.parameters?.object_type || "Unknown"}
    </p>
  </div>

  <div>
    <p className="text-xs text-slate-500">Model ID</p>
    <p className="text-sm text-slate-300 break-all">
      {selectedModel.model_id}
    </p>
  </div>
  <div className="border-t border-slate-800 mt-5 pt-5">
  <h4 className="text-sm font-medium text-white mb-4">
    Model Parameters
  </h4>

  {["length", "width", "height", "thickness", "radius", "angle"].map((key) => (
    selectedModel.parameters?.[key] != null && (
      <div key={key} className="flex justify-between text-sm mb-3">
        <span className="text-slate-400 capitalize">{key}</span>
        <span className="text-white">
          {selectedModel.parameters[key]} {key === "angle" ? "°" : "mm"}
        </span>
      </div>
    )
  ))}
</div>
<div className="border-t border-slate-800 mt-5 pt-5">
  <h4 className="text-sm font-medium text-white mb-4">
    Additional Features
  </h4>

  {selectedModel.parameters?.features?.length > 0 ? (
    selectedModel.parameters.features.map((feature, index) => (
      <div key={index} className="bg-[#090d16] rounded-lg p-3 mb-3">
        <p className="text-sm text-white capitalize">
          {feature.type}
        </p>

        {feature.diameter != null && (
          <p className="text-xs text-slate-400 mt-1">
            Diameter: {feature.diameter} mm
          </p>
        )}
      </div>
    ))
  ) : (
    <p className="text-sm text-slate-500">
      No additional features.
    </p>
  )}
</div>
</div>
  </div>
) : (
  <p className="text-slate-500">No model selected.</p>
)}
  </div>
) : activePage === "settings" ? (
  <div className="p-7">
    <h2 className="text-2xl font-semibold mb-2">Settings</h2>
    <p className="text-sm text-slate-500 mb-6">
      Customize your CAD workspace.
    </p>

    <div className="max-w-2xl space-y-5">
      <section className="bg-[#111827] border border-slate-800 rounded-xl p-5">
        <h3 className="font-medium mb-3">General</h3>
        <label className="text-sm text-slate-400">
          Measurement Units
        </label>
        <select
          value={units}
          onChange={(e) => setUnits(e.target.value)}
          className="mt-2 w-full bg-[#090d16] border border-slate-700 rounded-lg p-3 text-sm"
        >
          <option value="mm">Millimeters (mm)</option>
          <option value="cm">Centimeters (cm)</option>
          <option value="in">Inches (in)</option>
        </select>
      </section>

      <section className="bg-[#111827] border border-slate-800 rounded-xl p-5">
        <h3 className="font-medium mb-3">3D Viewer</h3>

        <label className="flex items-center gap-3 text-sm text-slate-300 mb-3">
          <input
            type="checkbox"
            checked={showGrid}
            onChange={(e) => setShowGrid(e.target.checked)}
          />
          Show Grid
        </label>

        <label className="flex items-center gap-3 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={showAxes}
            onChange={(e) => setShowAxes(e.target.checked)}
          />
          Show Axes
        </label>
      </section>

      
    </div>
  </div>
) : (
  <div className="p-7">
    <h2 className="text-2xl font-semibold mb-6">Recent Projects</h2>

    {savedModels.length > 0 ? (
      <div className="space-y-3">
        {[...savedModels].reverse().map((model) => (
          <div
            key={model.model_id}
            onClick={() => {
              setCurrentModelId(model.model_id);
              setResult(model.parameters);
              setModelName(model.name);
              setActivePage("workspace");
            }}
            className="bg-[#111827] border border-slate-800 rounded-xl p-5 cursor-pointer hover:border-blue-500"
          >
            <h3 className="font-medium text-white">{model.name}</h3>
            <p className="text-sm text-slate-500 mt-2">
              {model.parameters.object_type}
            </p>
          </div>
        ))}
      </div>
    ) : (
      <p className="text-sm text-slate-500">
        No recent projects yet.
      </p>
    )}
  </div>
)}
      </main>
    </div>
  );
}

export default App;