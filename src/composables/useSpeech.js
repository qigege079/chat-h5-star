import { ref, onMounted } from "vue";

export function useSpeech() {
  const isListening = ref(false);
  const isSpeaking = ref(false);
  const currentPlayingMessage = ref(null);
  const availableVoices = ref([]);
  const recognition = ref(null);

  const voiceSettings = ref({
    selectedVoiceName: "",
    pitch: 1.2,
    rate: 0.9,
    volume: 1.0,
  });

  const synth = window.speechSynthesis;

  const loadVoices = () => {
    let voices = synth.getVoices();

    if (voices.length === 0) {
      setTimeout(() => {
        voices = synth.getVoices();
        updateVoiceList(voices);
      }, 100);
      return;
    }

    updateVoiceList(voices);
  };

  const updateVoiceList = (voices) => {
    availableVoices.value = voices.filter(
      (v) => (v.lang.includes("zh") || v.lang.includes("CN")) && 
             v.name.includes("Online")
    );

    if (availableVoices.value.length === 0) {
      availableVoices.value = voices.filter(
        (v) => v.lang.includes("zh") || v.lang.includes("CN")
      );
    }

    if (
      !voiceSettings.value.selectedVoiceName &&
      availableVoices.value.length > 0
    ) {
      const preferred =
        availableVoices.value.find((v) => v.name.includes("Xiaoxiao")) ||
        availableVoices.value.find((v) => v.name.includes("Meijia")) ||
        availableVoices.value.find((v) => v.name.includes("甜美")) ||
        availableVoices.value.find((v) => v.name.includes("温柔")) ||
        availableVoices.value.find((v) => v.name.includes("Online")) ||
        availableVoices.value[0];
      voiceSettings.value.selectedVoiceName = preferred.name;
    }
  };

  if (typeof synth !== "undefined" && synth.onvoiceschanged !== undefined) {
    synth.onvoiceschanged = loadVoices;
  }

  const voiceRetryInterval = setInterval(() => {
    if (availableVoices.value.length > 0) {
      clearInterval(voiceRetryInterval);
    } else {
      loadVoices();
    }
  }, 1000);

  setTimeout(() => clearInterval(voiceRetryInterval), 5000);

  const speak = (text, messageId = null) => {
    if (isSpeaking.value && currentPlayingMessage.value === messageId) {
      synth.cancel();
      isSpeaking.value = false;
      currentPlayingMessage.value = null;
      return;
    }
    
    if (isSpeaking.value) {
      synth.cancel();
    }
    
    currentPlayingMessage.value = messageId;

    const textWithoutEmojis = text.replace(
      /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E6}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu,
      ""
    );

    const sentences = textWithoutEmojis.split(/[。！？]/).filter(s => s.trim());
    
    let currentIndex = 0;
    
    const speakNextSentence = () => {
      if (currentIndex >= sentences.length) {
        isSpeaking.value = false;
        currentPlayingMessage.value = null;
        return;
      }
      
      const sentence = sentences[currentIndex].trim();
      if (!sentence) {
        currentIndex++;
        speakNextSentence();
        return;
      }
      
      const utterance = new SpeechSynthesisUtterance(sentence);
      utterance.lang = "zh-CN";

      const selectedVoice = availableVoices.value.find(
        (v) => v.name === voiceSettings.value.selectedVoiceName
      );
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.rate = voiceSettings.value.rate || 0.9;
      utterance.pitch = voiceSettings.value.pitch || 1.2;
      utterance.volume = voiceSettings.value.volume || 1.0;
      utterance.pitch = Math.max(0.8, Math.min(1.5, utterance.pitch));
      utterance.rate = Math.max(0.7, Math.min(1.3, utterance.rate));

      utterance.onend = () => {
        currentIndex++;
        setTimeout(speakNextSentence, 200);
      };
      
      utterance.onerror = () => {
        isSpeaking.value = false;
        currentPlayingMessage.value = null;
      };
      
      synth.speak(utterance);
    };
    
    isSpeaking.value = true;
    speakNextSentence();
  };

  const testVoice = () => {
    speak("你好呀宝贝，我是小星大姐姐，很高兴认识你！");
  };

  const initSpeech = () => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition.value = new SpeechRecognition();
      recognition.value.lang = "zh-CN";
      recognition.value.continuous = false;
      recognition.value.interimResults = false;

      recognition.value.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        return transcript;
      };

      recognition.value.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        isListening.value = false;
      };

      recognition.value.onend = () => {
        isListening.value = false;
      };
    }
  };

  const toggleListening = (onResult) => {
    if (!recognition.value) {
      alert("您的浏览器不支持语音识别功能");
      return;
    }

    if (isListening.value) {
      recognition.value.stop();
      isListening.value = false;
    } else {
      isListening.value = true;
      recognition.value.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (onResult) {
          onResult(transcript);
        }
      };
      recognition.value.start();
    }
  };

  onMounted(() => {
    initSpeech();
    loadVoices();
  });

  return {
    isListening,
    isSpeaking,
    currentPlayingMessage,
    availableVoices,
    voiceSettings,
    speak,
    testVoice,
    toggleListening,
  };
}
