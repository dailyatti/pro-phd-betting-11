/**
 * Custom hook to manage image uploads, grouping, and drag-and-drop interactions.
 * Handles the logic for organizing uploaded screenshots into "Message Groups" (Matches).
 * 
 * @module hooks/useImageUpload
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { runQuickMatchScan } from '../agents';

const MAX_IMAGES_PER_GROUP = 15;

/**
 * Manages image uploads, grouping, and quick scanning.
 * 
 * @param {Object} apiKeys - Current API keys (needed for Quick Scan)
 * @param {Object} modelSettings - Current model settings
 * @param {Function} genId - ID generator function
 * @param {boolean} isMountedRef - Ref to check if component is mounted
 * @param {Function} resetBlackboard - Callback to reset results on new upload
 * @returns {Object} Image upload state and handlers
 */
export const useImageUpload = ({ apiKeys = {}, modelSettings = {}, genId, isMountedRef, resetBlackboard }) => {
    // Multi-image with match grouping
    // Format: [{ id, matchId, matchLabel, sport, images: [{ id, url, raw }], autoDetected }]
    const [imageGroups, setImageGroups] = useState([]);

    const [isScanning, setIsScanning] = useState(false); // quick scan phase
    const [error, setError] = useState(null);
    const [dragActiveState, setDragActiveState] = useState(null); // 'MAIN' | groupId | `plus-${groupId}` | null
    const [activeUploadTarget, setActiveUploadTarget] = useState('MAIN'); // 'MAIN' | groupId
    const [previewImage, setPreviewImage] = useState(null); // Lightbox state

    // Track objectURL for proper cleanup
    const activeUrlsRef = useRef(new Set());

    // Cleanup objectURLs on unmount
    useEffect(() => {
        return () => {
            activeUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
            activeUrlsRef.current.clear();
        };
    }, []);

    // Handle single file processing
    const handleFile = useCallback(
        async (file) => {
            if (!file) return;

            const imageId = genId();
            const objectUrl = URL.createObjectURL(file);
            activeUrlsRef.current.add(objectUrl);

            const reader = new FileReader();

            // FIX: Set handlers BEFORE reading to avoid race condition
            reader.onerror = () => {
                if (isMountedRef.current) setIsScanning(false);
                setError('Failed to read image file.');
            };

            reader.onloadend = async () => {
                if (!isMountedRef.current) return;

                const rawBase64 = reader.result;
                if (!rawBase64) {
                    setError('Failed to read image file (empty result).');
                    return;
                }

                console.log(`[Upload Debug] FileReader finished for ${file.name}. Raw length: ${rawBase64?.length}, Prefix: ${String(rawBase64).slice(0, 30)}...`);

                const newImage = { id: imageId, url: objectUrl, raw: rawBase64 };

                // Determine if we have any valid vision provider
                // FIX: Optional chaining to prevent crash if apiKeys is undefined
                const hasOpenAI = !!(apiKeys?.openai && apiKeys.openai.trim().length >= 10);
                const hasGemini = !!(apiKeys?.gemini && apiKeys.gemini.trim().length >= 10);

                if (hasOpenAI || hasGemini) {
                    setIsScanning(true);
                    try {
                        let scanConfig;

                        // Prefer OpenAI if available (as per user preference for GPT), else Gemini
                        if (hasOpenAI) {
                            // FIX: Explicitly set provider: 'openai'
                            let openaiModel = modelSettings?.openai || 'gpt-4o';
                            // Auto-correct legacy/invalid model names
                            if (openaiModel === 'gpt-5.2' || openaiModel === 'gpt-5.2-pro') openaiModel = 'gpt-4o';
                            scanConfig = { provider: 'openai', key: apiKeys.openai.trim(), model: openaiModel };
                        } else {
                            scanConfig = { provider: 'gemini', key: apiKeys.gemini.trim(), model: modelSettings?.gemini };
                        }

                        const scanResults = await runQuickMatchScan(
                            scanConfig,
                            rawBase64,
                            null // no abort signal for quick scan
                        );

                        if (!scanResults || scanResults.length === 0) {
                            throw new Error('Quick scan returned no matches.');
                        }

                        // FORCE SCANNING OFF (Safety)
                        if (isMountedRef.current) setIsScanning(false);

                        setImageGroups((prev) => {
                            const nextGroups = [...prev];

                            scanResults.forEach((match) => {
                                const existingGroupIndex = nextGroups.findIndex((g) => g.matchId === match.matchId);

                                if (existingGroupIndex !== -1) {
                                    const group = nextGroups[existingGroupIndex];

                                    if (!group.images.some((img) => img.id === imageId)) {
                                        if (group.images.length >= MAX_IMAGES_PER_GROUP) {
                                            console.warn(`Group ${group.matchLabel} limit reached (${MAX_IMAGES_PER_GROUP})`);
                                        } else {
                                            nextGroups[existingGroupIndex] = {
                                                ...group,
                                                images: [...group.images, newImage],
                                            };
                                        }
                                    }
                                } else {
                                    nextGroups.push({
                                        id: genId(),
                                        matchId: match.matchId,
                                        matchLabel: match.matchLabel,
                                        sport: match.sport,
                                        tournament: match.tournament,
                                        preview_odds: match.preview_odds, // CRITICAL: Save MPC odds to state
                                        images: [newImage],
                                        autoDetected: !match.error,
                                    });
                                }
                            });

                            console.log(`[ImageUpload] setImageGroups update running. Matches found: ${scanResults.length}`);
                            return nextGroups;
                        });
                    } catch (e) {
                        console.error('[Quick Scan] Error details:', e);

                        // Extract error details for user feedback
                        const status = e?.response?.status;
                        let specificError = e.message || "Unknown error";
                        if (e.response?.data?.error?.message) specificError = e.response.data.error.message;
                        else if (e.response?.data?.message) specificError = e.response.data.message;
                        else if (typeof e.response?.data === 'string') specificError = e.response.data.slice(0, 300);

                        if (status === 401) {
                            alert(`⚠️ API ERROR: Key Rejected (401).\n\nServer Message: "${specificError}"\n\nTroubleshooting:\n1. If using a 'Service Account Key' (sk-svc...), verify it has 'Model Capabilities' enabled.\n2. Try generating a standard 'Project Key' (sk-proj...).\n3. Ensure you are not restricted by Organization policies.`);
                        } else if (status === 404 || specificError.includes('model')) {
                            alert(`⚠️ MODEL ERROR (${status || 'N/A'}): The selected model may not exist or is not accessible.\n\nServer Message: "${specificError}"\n\nFix: Go to Configuration and select a valid model (e.g., gpt-4o).`);
                        } else if (status) {
                            alert(`⚠️ API ERROR (${status}): Quick Scan failed.\n\nServer Message: "${specificError}"\n\nCheck your API key and model settings in Configuration.`);
                        } else {
                            // Network error / no response (proxy down, CORS, etc.)
                            alert(`⚠️ NETWORK ERROR: Could not reach the API.\n\nDetails: "${specificError}"\n\nPossible causes:\n1. The Netlify proxy may not be deployed correctly.\n2. Check your internet connection.\n3. Try reloading the page.`);
                        }

                        // Fallback: create unknown group
                        setImageGroups((prev) => [
                            ...prev,
                            {
                                id: genId(),
                                matchId: `unknown-${imageId}`,
                                matchLabel: 'Unknown Match',
                                sport: 'UNKNOWN',
                                images: [newImage],
                                autoDetected: false,
                            },
                        ]);
                    } finally {
                        if (isMountedRef.current) setIsScanning(false);
                    }
                } else {
                    // No API key - create unidentified group
                    setImageGroups((prev) => [
                        ...prev,
                        {
                            id: genId(),
                            matchId: `manual-${imageId}`,
                            matchLabel: 'Unidentified Match',
                            sport: 'UNKNOWN',
                            images: [newImage],
                            autoDetected: false,
                        },
                    ]);
                }

                setError(null);
                if (resetBlackboard) resetBlackboard();
            };

            // FIX: Start reading AFTER setting handlers
            reader.readAsDataURL(file);
        },
        // FIX: Add ALL dependencies to avoid stale closures including apiKeys/modelSettings
        [apiKeys, modelSettings, genId, isMountedRef, resetBlackboard]
    );

    // Add image directly to an existing group (no API scan)
    const handleAddImageToGroup = useCallback(
        (groupId, file) => {
            if (!file) return;

            const imageId = genId();
            const objectUrl = URL.createObjectURL(file);
            activeUrlsRef.current.add(objectUrl);

            const reader = new FileReader();

            // FIX: Set handlers BEFORE reading
            reader.onloadend = () => {
                if (!isMountedRef.current) return;

                const rawBase64 = reader.result;
                if (!rawBase64) return;

                const newImage = { id: imageId, url: objectUrl, raw: rawBase64 };

                setImageGroups((prev) =>
                    prev.map((g) => {
                        if (g.id !== groupId) return g;
                        if (g.images.length >= MAX_IMAGES_PER_GROUP) return g;
                        return { ...g, images: [...g.images, newImage] };
                    })
                );
            };

            // FIX: Start reading AFTER setting handlers
            reader.readAsDataURL(file);
        },
        [genId, isMountedRef]
    );

    // Remove image from a group
    const handleRemoveImage = useCallback((groupId, imageId) => {
        setImageGroups((prev) => {
            const groupIndex = prev.findIndex((g) => g.id === groupId);
            if (groupIndex === -1) return prev;

            const group = prev[groupIndex];
            const imageToRemove = group.images.find((img) => img.id === imageId);

            const nextGroups = [...prev];
            const updatedImages = group.images.filter((img) => img.id !== imageId);

            if (updatedImages.length === 0) {
                nextGroups.splice(groupIndex, 1);
            } else {
                nextGroups[groupIndex] = { ...group, images: updatedImages };
            }

            // Safe cleanup: Only revoke if URL is NOT used in nextGroups
            if (imageToRemove?.url) {
                const isStillUsed = nextGroups.some(g => g.images.some(img => img.url === imageToRemove.url));
                if (!isStillUsed) {
                    URL.revokeObjectURL(imageToRemove.url);
                    activeUrlsRef.current.delete(imageToRemove.url);
                }
            }

            return nextGroups;
        });
    }, []);

    // Update match label manually
    const handleUpdateMatchLabel = useCallback((groupId, newLabel) => {
        setImageGroups((prev) =>
            prev.map((g) => (g.id === groupId ? { ...g, matchLabel: newLabel, autoDetected: false } : g))
        );
    }, []);

    // Update sport manually
    const handleUpdateSport = useCallback((groupId, newSport) => {
        setImageGroups((prev) => prev.map((g) => (g.id === groupId ? { ...g, sport: newSport } : g)));
    }, []);

    // Delete entire group
    const handleDeleteGroup = useCallback(
        (groupId) => {
            setImageGroups((prev) => {
                const groupIndex = prev.findIndex((g) => g.id === groupId);
                if (groupIndex === -1) return prev;

                const group = prev[groupIndex];
                const nextGroups = [...prev];
                nextGroups.splice(groupIndex, 1);

                // Safe cleanup
                group.images.forEach((img) => {
                    if (img.url) {
                        const isStillUsed = nextGroups.some(g => g.images.some(existing => existing.url === img.url));
                        if (!isStillUsed) {
                            URL.revokeObjectURL(img.url);
                            activeUrlsRef.current.delete(img.url);
                        }
                    }
                });

                return nextGroups;
            });

            if (activeUploadTarget === groupId) setActiveUploadTarget('MAIN');
        },
        [activeUploadTarget]
    );

    // Global drag handler setup
    useEffect(() => {
        const dragCounter = { current: 0 };

        const handleDragEnter = (e) => {
            e.preventDefault();
            dragCounter.current++;
        };

        const handleDragLeave = (e) => {
            e.preventDefault();
            dragCounter.current--;
            if (dragCounter.current === 0) setDragActiveState(null);
        };

        const handleDragOver = (e) => e.preventDefault();

        const handleDrop = (e) => {
            e.preventDefault();
            dragCounter.current = 0;
        };

        window.addEventListener('dragenter', handleDragEnter);
        window.addEventListener('dragleave', handleDragLeave);
        window.addEventListener('dragover', handleDragOver);
        window.addEventListener('drop', handleDrop);

        return () => {
            window.removeEventListener('dragenter', handleDragEnter);
            window.removeEventListener('dragleave', handleDragLeave);
            window.removeEventListener('dragover', handleDragOver);
            window.removeEventListener('drop', handleDrop);
        };
    }, []);

    // Paste handler
    useEffect(() => {
        const handlePaste = (e) => {
            const tag = document.activeElement?.tagName;
            // Don't intercept paste in inputs (unless file input) or textareas
            if (tag === 'TEXTAREA' || (tag === 'INPUT' && document.activeElement.type !== 'file')) {
                return;
            }

            const items = e.clipboardData?.items;
            if (!items) return;

            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const file = items[i].getAsFile();
                    if (!file) break;

                    if (activeUploadTarget === 'MAIN') {
                        handleFile(file);
                    } else {
                        const targetGroup = imageGroups.find((g) => g.id === activeUploadTarget);
                        if (targetGroup) {
                            handleAddImageToGroup(activeUploadTarget, file);
                        } else {
                            handleFile(file);
                        }
                    }
                    break;
                }
            }
        };

        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [handleFile, imageGroups, activeUploadTarget, handleAddImageToGroup]);

    // File input handler wrapper
    const handleFileUpload = useCallback(
        (event) => {
            const files = Array.from(event.target.files || []).filter((f) => f.type.startsWith('image/'));
            console.log(`[Upload Debug] handleFileUpload received ${files.length} images:`, files.map(f => ({ name: f.name, size: f.size, type: f.type })));
            if (files.length) files.forEach((f) => handleFile(f));
            event.target.value = '';
        },
        [handleFile]
    );

    return {
        imageGroups,
        setImageGroups,
        isScanning,
        error,
        setError,
        handleFile,
        handleFileUpload,
        handleRemoveImage,
        handleUpdateMatchLabel,
        handleUpdateSport,
        handleDeleteGroup,
        handleAddImageToGroup,
        dragActiveState,
        setDragActiveState,
        activeUploadTarget,
        setActiveUploadTarget,
        previewImage,
        setPreviewImage
    };
};
