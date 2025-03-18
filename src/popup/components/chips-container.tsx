import React from 'react'
import { YouTubeChip } from '../../utils/interface'
import { ChipButton } from './chip-button'

interface ChipsSectionProps {
    chips: YouTubeChip[]
    selectedChip: string
    tempPref: string | null
    isTimePreferenceActive: boolean
    onChipClick: (chip: YouTubeChip) => void
}

export function ChipsSection({
    chips,
    selectedChip,
    tempPref,
    isTimePreferenceActive,
    onChipClick
}: ChipsSectionProps) {
    return (
        <div className="flex-1 overflow-y-auto px-3 pb-3">
            <div className="flex flex-wrap gap-2 justify-center">
                {chips.length > 0 ? (
                    chips.map((chip) => (
                        <ChipButton
                            key={chip.index}
                            chip={chip}
                            isSelected={selectedChip === chip.text}
                            isTempSelected={tempPref === chip.text && tempPref !== selectedChip}
                            isTimePreferenceActive={isTimePreferenceActive}
                            onClick={onChipClick}
                        />
                    ))
                ) : (
                    <EmptyState />
                )}
            </div>
        </div>
    )
}

function EmptyState() {
    return (
        <p className="text-gray-900 text-sm text-center">
            No categories found. Make sure you're on YouTube's main page, and refresh it.
        </p>
    )
} 