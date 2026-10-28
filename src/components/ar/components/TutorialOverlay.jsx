import React from "react";
import { BsArrowLeftRight } from "react-icons/bs";
import { TbHandFinger } from "react-icons/tb";

const TutorialOverlay = ({
  tutorialStep,
  hasPlacedModel,
  showActions,
  showCustomize,
  onSkip,
}) => {
  // FE-21: only step 0 exists. The former step 1 ("Move Position")
  // could never complete — the installed capacitor-arcore
  // ARView.enableCustomization never forwards an onDrag callback to
  // the app — so the step was dropped rather than rewired to a signal
  // that does not exist. Any step other than 0 means "done".
  if (!hasPlacedModel || showActions || showCustomize || tutorialStep !== 0) {
    return null;
  }

  if (tutorialStep === 0) {
    return (
      <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-end pb-56">
        <div className="relative mb-6">
          <div className="flex items-center gap-8">
            <div className="flex flex-col items-center animate-pulse">
              <TbHandFinger
                size={32}
                className="text-teal-400 transform -rotate-12"
              />
              <div className="w-3 h-3 bg-teal-400 rounded-full mt-1" />
            </div>
            <div className="flex items-center gap-2">
              <BsArrowLeftRight size={24} className="text-white/80" />
            </div>
            <div
              className="flex flex-col items-center animate-pulse"
              style={{ animationDelay: "0.15s" }}
            >
              <TbHandFinger
                size={32}
                className="text-teal-400 transform rotate-12"
              />
              <div className="w-3 h-3 bg-teal-400 rounded-full mt-1" />
            </div>
          </div>
        </div>

        <div className="bg-black/80 backdrop-blur-xl rounded-2xl px-5 py-4 shadow-xl max-w-xs text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
              1
            </div>
            <p className="text-teal-400 text-sm font-semibold">
              Rotate & Scale
            </p>
          </div>
          <p className="text-white text-sm leading-relaxed">
            Place <span className="text-teal-400 font-medium">two fingers</span>{" "}
            on screen
          </p>
          <p className="text-white/70 text-xs mt-1">
            Twist to rotate • Pinch to resize
          </p>
          <button
            onClick={onSkip}
            className="mt-3 text-white/50 text-xs underline pointer-events-auto"
          >
            Skip tutorial
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default TutorialOverlay;
