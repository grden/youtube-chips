import React from "react";
import { YouTubeChip } from "../../utils/interface";

interface ChipButtonProps {
    chip: YouTubeChip;
    isSelected: boolean;
    isTempSelected: boolean;
    isTimePreferenceActive: boolean;
    onClick: (chip: YouTubeChip) => void;
}

export function ChipButton({
    chip,
    isSelected,
    isTempSelected,
    isTimePreferenceActive,
    onClick
}: ChipButtonProps) {
    const baseClasses = "px-3 py-1.5 rounded-lg text-sm transition-colors";
    let stateClasses = '';

    if (isSelected) {
        if (isTimePreferenceActive) {
            stateClasses = "bg-blue-500 text-white cursor-default";
        }
        else {
            stateClasses = "bg-red-600 text-white cursor-default";
        }
    } else if (isTempSelected) {
        stateClasses = "bg-yellow-500 text-white cursor-default";
    } else if (isTimePreferenceActive) {
        stateClasses = "bg-gray-100 text-gray-400 cursor-default opacity-50";
    } else {
        stateClasses = "bg-gray-100 text-gray-900 hover:bg-gray-300 cursor-pointer";
    }

    return (
        <div
            className={`${baseClasses} ${stateClasses}`}
            onClick={() => !isTimePreferenceActive && onClick(chip)}
        >
            {chip.text}
        </div>
    );
};