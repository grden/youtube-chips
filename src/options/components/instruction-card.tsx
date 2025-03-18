import React from "react";

export function InstructionCard() {
    return (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h3 className="font-medium text-sm text-blue-700 mb-2">How Time Preferences Work</h3>
            <ul className="list-disc pl-5 text-sm text-blue-700 space-y-1">
                <li>Time preferences automatically select YouTube categories during specified hours and days</li>
                <li>They override your global preference when active</li>
                <li>If a specific category isn't available, a similar one will be selected</li>
                <li>Time ranges are in 24-hour format (e.g., 13:00 is 1:00 PM)</li>
                <li>Multiple time preferences cannot overlap for the same days and hours</li>
            </ul>
        </div>
    )
}