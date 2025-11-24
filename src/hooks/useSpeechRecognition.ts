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

export const useSpeechRecognition = ({ onResult, onError }: UseSpeechRecognitionProps) => {
    const [isListening, setIsListening] = useState(false);
    const [isSupported, setIsSupported] = useState(false);
    const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('unknown');
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
            setIsSupported(true);
        } else {
            setIsSupported(false);
        }
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

            recognition.continuous = false;
            recognition.interimResults = true; // Changed to true for better feedback if needed, but we'll take final
            recognition.lang = 'en-US';

            recognition.onstart = () => {
                setIsListening(true);
                setPermissionStatus('granted');
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
                    // Ignore no-speech error or handle gently
                } else {
                    onError?.(`Speech recognition error: ${event.error}`);
                }
                setIsListening(false);
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognition.start();
        } catch (error) {
            console.error('Failed to start recognition:', error);
            onError?.('Failed to start speech recognition.');
            setIsListening(false);
        }
    }, [isSupported, onResult, onError]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    }, []);

    return { isListening, isSupported, startListening, stopListening, permissionStatus };
};
