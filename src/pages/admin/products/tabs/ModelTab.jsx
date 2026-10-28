import {
  Upload,
  Box,
  Link as LinkIcon,
  AlertCircle,
  Trash2,
} from "lucide-react";

// Phase 7 split (from Products.jsx) — the 3D Model tab of the
// product form drawer. Markup moved verbatim; all state arrives
// via the useProductFormState return (`form`).
function getFileName(url) {
  if (!url) return "";
  try {
    const decodedUrl = decodeURIComponent(url);
    const parts = decodedUrl.split("/");
    return parts[parts.length - 1];
  } catch {
    return url.substring(url.lastIndexOf("/") + 1);
  }
}

export default function ModelTab({ form }) {
  const {
    modelInputType,
    setModelInputType,
    newModelUrl,
    setNewModelUrl,
    existingModelFiles,
    modelFiles,
    modelUrls,
    isDraggingModel,
    modelFileInputRef,
    handleModelFileChange,
    handleModelDragOver,
    handleModelDragLeave,
    handleModelDrop,
    removeModelFile,
    addModelUrl,
  } = form;

  return (
    <div className="space-y-6">
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Box className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-purple-800">
              3D Model for AR/VR Experience
            </p>
            <p className="text-sm text-purple-700 mt-0.5">
              Upload a 3D model to enable customers to view this product in AR
              on their devices. Supported formats: .glb, .gltf, .usdz (for iOS)
            </p>
          </div>
        </div>
      </div>

      {/* Input Type Toggle */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Add 3D Model
        </label>
        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={() => setModelInputType("url")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 h-10 rounded-lg border text-sm font-medium transition-all cursor-pointer ${
              modelInputType === "url"
                ? "border-teal-600 bg-teal-50 text-teal-700"
                : "border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <LinkIcon className="w-4 h-4" />
            URL / Link
          </button>
          <button
            type="button"
            onClick={() => setModelInputType("upload")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 h-10 rounded-lg border text-sm font-medium transition-all cursor-pointer ${
              modelInputType === "upload"
                ? "border-teal-600 bg-teal-50 text-teal-700"
                : "border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Upload className="w-4 h-4" />
            Upload File
          </button>
        </div>
      </div>

      {/* URL Input */}
      {modelInputType === "url" && (
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700">
            Add 3D Model URL
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              value={newModelUrl}
              onChange={(e) => setNewModelUrl(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && (e.preventDefault(), addModelUrl())
              }
              className="flex-1 px-4 h-10 bg-white rounded-lg border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 outline-none text-sm font-medium transition-all"
              placeholder="https://example.com/model.glb"
            />
            <button
              type="button"
              onClick={addModelUrl}
              className="px-4 h-10 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 transition-colors cursor-pointer"
            >
              Add
            </button>
          </div>
          <p className="text-xs text-gray-500">
            Enter URLs to .glb, .gltf, or .usdz files. Format is auto-detected
            from URL.
          </p>
        </div>
      )}

      {/* File Upload */}
      {modelInputType === "upload" && (
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700">
            Upload 3D Model File
          </label>
          {existingModelFiles.filter((m) => !m.isExternal).length +
            modelFiles.length ===
          0 ? (
            <div
              onClick={() => modelFileInputRef.current?.click()}
              onDragOver={handleModelDragOver}
              onDragLeave={handleModelDragLeave}
              onDrop={handleModelDrop}
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                isDraggingModel
                  ? "border-teal-500 bg-teal-500/5"
                  : "border-gray-200 hover:border-teal-500"
              }`}
            >
              <Box className="w-10 h-10 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-700">
                Drop your 3D models here
              </p>
              <p className="text-xs text-gray-400 mt-1">or click to browse</p>
              <p className="text-[10px] text-gray-400 mt-2">
                Supported: .glb, .gltf, .usdz (max 50MB each)
              </p>
            </div>
          ) : (
            <div
              onClick={() => modelFileInputRef.current?.click()}
              onDragOver={handleModelDragOver}
              onDragLeave={handleModelDragLeave}
              onDrop={handleModelDrop}
              className={`border-2 border-dashed rounded-lg py-3 px-4 text-center transition-colors cursor-pointer flex items-center justify-center gap-2 hover:bg-gray-50/80 ${
                isDraggingModel
                  ? "border-teal-500 bg-teal-500/5"
                  : "border-gray-200 hover:border-teal-500"
              }`}
            >
              <Upload className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-semibold text-gray-500">
                Upload another model file
              </span>
            </div>
          )}
          <input
            ref={modelFileInputRef}
            type="file"
            accept=".glb,.gltf,.usdz"
            multiple
            onChange={handleModelFileChange}
            className="hidden"
          />
        </div>
      )}

      {/* Unified 3D Models List (Shown always) */}
      {(existingModelFiles.length > 0 ||
        modelFiles.length > 0 ||
        modelUrls.length > 0) && (
        <div className="space-y-3.5 pt-2">
          <label className="block text-sm font-semibold text-gray-700">
            Current 3D Models (
            {existingModelFiles.length + modelFiles.length + modelUrls.length})
          </label>

          <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
            {/* 1. Existing Model Files (from Database) */}
            {existingModelFiles.map((model, index) => (
              <div
                key={`existing-${index}`}
                className="border border-gray-100 bg-white hover:border-teal-200 transition-all rounded-lg p-3 flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      model.platform === "ios"
                        ? "bg-indigo-50 text-indigo-650"
                        : "bg-blue-55 text-blue-650"
                    }`}
                  >
                    {model.isExternal ? (
                      <LinkIcon className="w-4.5 h-4.5 text-indigo-600" />
                    ) : (
                      <Box className="w-4.5 h-4.5 text-blue-600" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className="text-sm font-semibold text-gray-800 truncate max-w-[280px] sm:max-w-[380px]"
                      title={model.url}
                    >
                      {getFileName(model.url)}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-gray-50 text-gray-500 border border-gray-100">
                        {model.format}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-100/50">
                        {model.isExternal ? "URL Link" : "Stored File"}
                      </span>
                      {model.fileSize && (
                        <span className="text-[10px] font-medium text-gray-400">
                          {(model.fileSize / (1024 * 1024)).toFixed(2)} MB
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    removeModelFile(existingModelFiles.indexOf(model), true)
                  }
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors cursor-pointer shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            {/* 2. New Uploaded Files */}
            {modelFiles.map((model, index) => (
              <div
                key={`new-file-${index}`}
                className="border border-gray-100 bg-white hover:border-teal-200 transition-all rounded-lg p-3 flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <Box className="w-4.5 h-4.5 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className="text-sm font-semibold text-gray-800 truncate max-w-[280px] sm:max-w-[380px]"
                      title={model.name}
                    >
                      {model.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-gray-50 text-gray-500 border border-gray-100">
                        {model.format}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-100/50">
                        New File
                      </span>
                      <span className="text-[10px] font-medium text-gray-400">
                        {(model.size / (1024 * 1024)).toFixed(2)} MB
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeModelFile(index, false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors cursor-pointer shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            {/* 3. New URL Links */}
            {modelUrls.map((model, index) => (
              <div
                key={`new-url-${index}`}
                className="border border-gray-100 bg-white hover:border-teal-200 transition-all rounded-lg p-3 flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                    <LinkIcon className="w-4.5 h-4.5 text-indigo-650" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className="text-sm font-semibold text-gray-800 truncate max-w-[280px] sm:max-w-[380px]"
                      title={model.url}
                    >
                      {getFileName(model.url)}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-gray-50 text-gray-500 border border-gray-100">
                        {model.format}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-100/50">
                        New URL Link
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeModelFile(index, false, true)}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors cursor-pointer shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cross-platform AR Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-800">
              Cross-Platform AR Support
            </p>
            <p className="text-sm text-blue-700 mt-0.5">
              For the best AR experience across all devices:
            </p>
            <ul className="text-sm text-blue-700 mt-1 list-disc list-inside">
              <li>
                <strong>.glb/.gltf</strong> - For Android devices and web
                browsers
              </li>
              <li>
                <strong>.usdz</strong> - For iOS devices (iPhone/iPad)
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
