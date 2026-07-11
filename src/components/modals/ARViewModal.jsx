import { useEffect, useState, useMemo } from "react";
import { X, ExternalLink, Camera } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { MdViewInAr } from "react-icons/md";

export default function ARViewModal({ isOpen, onClose, product }) {
  const [isMobile, setIsMobile] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState({ isIOS: false, isAndroid: false });
  const [localIp, setLocalIp] = useState(null);

  useEffect(() => {
    const fetchIp = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"}/api/v1/system/info`);
        const result = await response.json();
        if (result.status === "success") {
          setLocalIp(result.data.localIp);
        }
      } catch (err) {
        console.error("Failed to fetch local IP:", err);
      }
    };
    if (import.meta.env.DEV) {
      fetchIp();
    }
  }, []);

  useEffect(() => {
    const checkDevice = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
      const isAndroid = /android/i.test(userAgent);
      setIsMobile(isIOS || isAndroid);
      setDeviceInfo({ isIOS, isAndroid });
    };
    checkDevice();
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Check if product has AR models for different platforms
  const modelAvailability = useMemo(() => {
    if (!product) return { hasGlb: false, hasUsdz: false, hasAny: false };

    const hasGlb = product.modelFiles?.some(m => m.format === "glb" || m.format === "gltf") ||
      product.modelUrl?.includes(".glb") || product.modelUrl?.includes(".gltf");
    const hasUsdz = product.modelFiles?.some(m => m.format === "usdz") ||
      product.modelUrl?.includes(".usdz");

    return {
      hasGlb,
      hasUsdz,
      hasAny: hasGlb || hasUsdz
    };
  }, [product]);

  // Check if current device has a compatible model
  const hasCompatibleModel = useMemo(() => {
    if (deviceInfo.isIOS) return modelAvailability.hasUsdz;
    if (deviceInfo.isAndroid) return modelAvailability.hasGlb;
    return modelAvailability.hasAny;
  }, [deviceInfo, modelAvailability]);

  if (!isOpen || !product) return null;

  const getBaseUrl = () => {
    if (import.meta.env.VITE_APP_URL) {
      return import.meta.env.VITE_APP_URL;
    }
    if (import.meta.env.DEV && window.location.hostname !== "localhost") {
      return window.location.origin;
    }
    return window.location.origin;
  };

  const baseUrl = getBaseUrl();

  // Use local IP for QR code if available during development
  const displayBaseUrl = (import.meta.env.DEV && localIp)
    ? baseUrl.replace("localhost", localIp).replace("127.0.0.1", localIp)
    : baseUrl;

  const arViewUrl = `${displayBaseUrl}/ar/${product.slug || product._id}`;

  const handleOpenLink = () => {
    window.location.href = arViewUrl;
  };

  const handleEnableCamera = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      window.location.href = arViewUrl;
    } catch (err) {
      console.error("Camera access denied:", err);
    }
  };

  // Unified Responsive View
  return (
    <div className="fixed inset-0 z-100 overflow-y-auto font-sans">
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="min-h-full flex items-center justify-center p-4 sm:p-6">
        <div
          className="relative w-full max-w-[440px] bg-white shadow-2xl flex flex-col items-center justify-center p-8 md:p-12 rounded-xl"
          style={{
            animation: "fadeInScale 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards",
          }}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-600 hover:bg-black hover:text-white transition-colors"
          >
            <X size={18} strokeWidth={2} />
          </button>

          <h3 className="text-2xl font-bold text-gray-900 mb-2 text-center">
            View in Your Space
          </h3>

          {modelAvailability.hasAny ? (
            <>
              {!isMobile ? (
                <>
                  <p className="text-[14px] text-gray-500 text-center mb-8 max-w-[280px]">
                    Scan this QR code with your mobile device camera to launch the AR view.
                  </p>
                  <div className="p-4 border border-gray-200 mb-6 bg-white shadow-sm">
                    <QRCodeSVG
                      value={arViewUrl}
                      size={200}
                      level="H"
                      includeMargin={false}
                      bgColor="#ffffff"
                      fgColor="#000000"
                    />
                  </div>
                  <p className="text-[14px] font-medium text-gray-400 text-center">
                    Supported: {modelAvailability.hasUsdz && "iOS"}
                    {modelAvailability.hasUsdz && modelAvailability.hasGlb && " • "}
                    {modelAvailability.hasGlb && "Android"}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-[14px] text-gray-500 text-center mb-8 max-w-[280px]">
                    {hasCompatibleModel
                      ? "Tap below to launch the AR experience directly on your device."
                      : "Your device is not supported for this AR model."}
                  </p>
                  <div className="w-full flex flex-col gap-3">
                    <button
                      onClick={handleOpenLink}
                      className="w-full border border-gray-300 text-gray-700 font-bold text-[14px] px-4 py-3 hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors"
                    >
                      <ExternalLink size={16} /> Open Link
                    </button>
                    <button
                      onClick={handleEnableCamera}
                      disabled={!hasCompatibleModel}
                      className="w-full bg-black text-white font-bold text-[14px] px-4 py-3 hover:bg-[#F27318] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                    >
                      <Camera size={16} /> Enable Camera
                    </button>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-center mt-6">
              <div className="w-16 h-16 bg-gray-100 flex items-center justify-center rounded-none border border-gray-200 mb-4">
                <MdViewInAr size={24} className="text-gray-400" />
              </div>
              <p className="text-[14px] text-gray-500 max-w-60">
                AR model is currently unavailable for this product.
              </p>
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.98) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
