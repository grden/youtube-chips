import React, { useState, useEffect, useCallback } from 'react'
import { YouTubeChip } from '../../utils/interface'
import type { GetChipsMessage, ClickChipMessage, GetChipsResponse, ClickChipResponse } from '../../utils/messages'
import { sendTabMessage } from '../../utils/messages'
import { Footer, ActiveTimePreference } from '../components/footer'
import { Header } from '../components/header'
import { Layout, ContentArea } from './layout'
import { ChipsSection } from '../components/chips-container'

// Types
interface StorageData {
    globalPref: string | null;
}

// Constants
const STORAGE_KEYS = {
    GLOBAL_PREF: 'globalPref',
} as const;

export default function App() {
    const [chips, setChips] = useState<YouTubeChip[]>([]);
    const [selectedChip, setSelectedChip] = useState<string>('');
    const [tempPref, setTempPref] = useState<string | null>(null);
    const [tempPrefSource, setTempPrefSource] = useState<'global' | 'time' | null>(null);
    const [activeTimePreference, setActiveTimePreference] = useState<ActiveTimePreference | null>(null);

    // Load saved preference
    useEffect(() => {
        const loadPreference = async () => {
            try {
                const result = await chrome.storage.sync.get([STORAGE_KEYS.GLOBAL_PREF]) as StorageData;
                if (result.globalPref) {
                    setSelectedChip(result.globalPref);
                }

                // Check for active time preference
                const { activeTimePreference } = await chrome.storage.local.get('activeTimePreference');
                if (activeTimePreference) {
                    setActiveTimePreference(activeTimePreference);
                    setSelectedChip(activeTimePreference.preference);
                }
            } catch (error) {
                console.error('Error loading preference:', error);
            }
        };

        loadPreference();
    }, []);

    // Load chips from content script
    useEffect(() => {
        const loadChips = async () => {
            try {
                const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
                if (!activeTab?.id) return;

                const message: GetChipsMessage = { type: 'GET_CHIPS' };
                const response = await sendTabMessage<GetChipsMessage, GetChipsResponse>(activeTab.id, message);

                if (response) {
                    setChips(response.chips);
                    setTempPref(response.tempPref);
                    setTempPrefSource(response.tempPrefSource);
                }
            } catch (error) {
                console.error('Error loading chips:', error);
            }
        };

        loadChips();
    }, []);

    const handleChipClick = useCallback(async (chip: YouTubeChip) => {
        try {
            // If a time preference is active, don't allow manual selection
            if (activeTimePreference) {
                return;
            }

            // Save preference
            await chrome.storage.sync.set({ [STORAGE_KEYS.GLOBAL_PREF]: chip.text });
            setSelectedChip(chip.text);
            setTempPref(null);
            setTempPrefSource(null);

            // Send click message to content script
            const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!activeTab?.id) return;

            const message: ClickChipMessage = {
                type: 'CLICK_CHIP',
                text: chip.text,
                clearTempPref: true
            };
            await sendTabMessage<ClickChipMessage, ClickChipResponse>(activeTab.id, message);
        } catch (error) {
            console.error('Error handling chip click:', error);
        }
    }, [activeTimePreference]);

    return (
        <Layout>
            <ContentArea>
                <Header />
                <ChipsSection
                    chips={chips}
                    selectedChip={selectedChip}
                    tempPref={tempPref}
                    isTimePreferenceActive={!!activeTimePreference}
                    onChipClick={handleChipClick}
                />
            </ContentArea>
            <Footer
                selectedChip={selectedChip}
                tempPref={tempPref}
                tempPrefSource={tempPrefSource}
                activeTimePreference={activeTimePreference}
            />
        </Layout>
    )
}