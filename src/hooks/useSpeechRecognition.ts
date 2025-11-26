import { useState, useEffect, useCallback, useRef } from 'react';

declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

interface UseSpeechRecognitionProps {
    onResult: (transcript: string) => void;
    onError?: (error: string) => void;
}

export const useSpeechRecognition = ({ onResult, onError, onTimeout }: UseSpeechRecognitionProps & { onTimeout?: () => void }) => {
    const [isListening, setIsListening] = useState(false);
    const [isSupported, setIsSupported] = useState(false);
    const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('unknown');
    const recognitionRef = useRef<any>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const SESSION_TIMEOUT = 150000; // 2.5 minutes

    useEffect(() => {
        if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
            setIsSupported(true);
        } else {
            setIsSupported(false);
        }

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (recognitionRef.current) recognitionRef.current.stop();
        };
    }, []);

    const startListening = useCallback(() => {
        if (!isSupported) {
            onError?.('Speech recognition is not supported in this browser.');
            return;
        }

        try {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            recognitionRef.current = recognition;

            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onstart = () => {
                setIsListening(true);
                setPermissionStatus('granted');

                // Set session timeout
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
                timeoutRef.current = setTimeout(() => {
                    stopListening();
                    onTimeout?.();
                }, SESSION_TIMEOUT);
            };

            recognition.onresult = (event: any) => {
                let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    }
                }
                if (finalTranscript) {
                    onResult(finalTranscript);
                }
            };

            recognition.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);
                if (event.error === 'not-allowed') {
                    setPermissionStatus('denied');
                    onError?.('Microphone access denied. Please allow microphone access.');
                } else if (event.error === 'no-speech') {
                    // Ignore no-speech error
                } else {
                    onError?.(`Speech recognition error: ${event.error}`);
                }
                // Don't stop listening on minor errors if continuous
                if (event.error === 'not-allowed' || event.error === 'aborted') {
                    setIsListening(false);
                    if (timeoutRef.current) clearTimeout(timeoutRef.current);
                }
            };

            recognition.onend = () => {
                // If we didn't manually stop (and it wasn't a timeout stop), maybe restart?
                // For now, just update state. The user can restart.
                // If we want truly continuous, we'd restart here if isListening was intended to be true.
                // But for this app, stopping on end is fine, user can click again.
                setIsListening(false);
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
            };

            recognition.start();
        } catch (error) {
            console.error('Failed to start recognition:', error);
            onError?.('Failed to start speech recognition.');
            setIsListening(false);
        }
    }, [isSupported, onResult, onError, onTimeout]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setIsListening(false);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        }
    }, []);

    return { isListening, isSupported, startListening, stopListening, permissionStatus };
};
