// LCSI AI Chatbot - Core Application Logic (On-Device Hybrid RAG & Security)

// Elements
const welcomeScreen = document.getElementById('welcomeScreen');
const chatScreen = document.getElementById('chatScreen');
const welcomeForm = document.getElementById('welcomeForm');
const lcsiCodeInput = document.getElementById('lcsiCodeInput');

const profileBadge = document.getElementById('profileBadge');
const profileTitle = document.getElementById('profileTitle');
const profileDesc = document.getElementById('profileDesc');
const dimensionBox = document.getElementById('dimensionBox');
const chatMessages = document.getElementById('chatMessages');
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');

const emergencyModal = document.getElementById('emergencyModal');
const settingsModal = document.getElementById('settingsModal');
const apiKeyForm = document.getElementById('apiKeyForm');
const apiKeyInput = document.getElementById('apiKeyInput');

const engineSelector = document.getElementById('engineSelector');

// Local State
let currentSession = {
  lcsiCode: null,
  profile: null,
  apiKey: localStorage.getItem('gemini_api_key') || '',
  chatHistory: []
};

// WebLLM State
let webllmEngine = null;
const ON_DEVICE_MODEL = "Qwen2.5-0.5B-Instruct-q4f16_1-MLC"; // Efficient ~350MB SLM for WebGPU

// WebGPU Capability Diagnosis
const hasWebGPU = !!navigator.gpu;
if (!hasWebGPU) {
  console.warn("WebGPU is not supported on this browser/device. Falling back to Gemini Cloud.");
  // Change default option to Gemini
  engineSelector.value = "gemini";
  // Add a helper warning annotation inside the dropdown
  const opt = engineSelector.querySelector('option[value="ondevice"]');
  if (opt) {
    opt.disabled = true;
    opt.innerText = "💻 온디바이스 AI (WebGPU 지원 안 됨)";
  }
}

// Crisis Detection Patterns (CSO Guardrail)
const CRISIS_PATTERNS = [
  /(자살|자해|살고 싶지|죽고 싶|죽어버|손목|옥상|투신)/i,
  /(우울증 한계|끝내고 싶|다 포기|인생 종치|뛰어내)/i,
  /(우울해서 죽|사라지고 싶|살 가치가)/i
];

// Helper: Check for crisis keywords
function checkCrisisState(text) {
  for (const pattern of CRISIS_PATTERNS) {
    if (pattern.test(text)) {
      return true;
    }
  }
  return false;
}

// UI: Add Message Bubble
function appendMessage(sender, text) {
  const msgDiv = document.createElement('div');
  msgDiv.className = `message ${sender}`;
  
  const avatarDiv = document.createElement('div');
  avatarDiv.className = 'message-avatar';
  avatarDiv.innerText = sender === 'user' ? '나' : 'AI';
  
  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';
  contentDiv.innerText = text;
  
  msgDiv.appendChild(avatarDiv);
  msgDiv.appendChild(contentDiv);
  chatMessages.appendChild(msgDiv);
  
  // Auto scroll
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// UI: Loading Indicator Toggler
let typingIndicator = null;
function toggleTyping(show) {
  if (show) {
    if (typingIndicator) return;
    typingIndicator = document.createElement('div');
    typingIndicator.className = 'message assistant';
    typingIndicator.id = 'typingIndicator';
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerText = 'AI';
    
    const content = document.createElement('div');
    content.className = 'message-content';
    
    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    indicator.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
    
    content.appendChild(indicator);
    typingIndicator.appendChild(avatar);
    typingIndicator.appendChild(content);
    chatMessages.appendChild(typingIndicator);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  } else {
    if (typingIndicator) {
      typingIndicator.remove();
      typingIndicator = null;
    }
  }
}

// Action: Trigger Emergency Lockdown
function triggerEmergencyLock() {
  // Lock UI Inputs
  chatInput.disabled = true;
  chatInput.placeholder = "상담이 일시 제한되었습니다.";
  const sendBtn = chatForm.querySelector('button');
  if (sendBtn) sendBtn.disabled = true;
  
  // Show Emergency Overlay Modal
  emergencyModal.classList.remove('hidden');
}

// Action: Initialize On-Device WebLLM Engine (Bypasses Cloud)
async function initOnDeviceEngine() {
  if (webllmEngine) return true; // Already initialized
  
  const loaderContainer = document.getElementById('modelLoaderContainer');
  const progressBar = document.getElementById('modelProgressBar');
  const progressText = document.getElementById('modelProgressText');
  const loadStatus = document.getElementById('modelLoadStatus');
  
  loaderContainer.classList.remove('hidden');
  
  try {
    // Dynamic import of WebLLM to save startup bandwidth
    const webllm = await import("https://esm.run/@mlc-ai/web-llm");
    
    webllmEngine = await webllm.CreateMLCEngine(ON_DEVICE_MODEL, {
      initProgressCallback: (report) => {
        const pct = Math.round(report.progress * 100);
        progressBar.style.width = `${pct}%`;
        progressText.innerText = `${pct}%`;
        loadStatus.innerText = report.text;
      }
    });
    
    loaderContainer.classList.add('hidden');
    return true;
  } catch (error) {
    loaderContainer.classList.add('hidden');
    console.error("Failed to initialize WebGPU Engine:", error);
    alert("On-Device AI 로드 중 오류가 발생했습니다. 브라우저가 WebGPU 가속을 차단했거나 메모리가 부족할 수 있습니다. 클라우드 Gemini 모드로 강제 자동 전환됩니다.");
    engineSelector.value = "gemini";
    return false;
  }
}

// Action: Handle Welcome Entry
welcomeForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const rawCode = lcsiCodeInput.value.trim().toUpperCase();
  
  if (!rawCode || rawCode.length < 3 || rawCode.length > 8) {
    alert("올바른 LCSI 심리 코드 패턴(예: ESTJ, INFP 등)을 입력해 주세요.");
    return;
  }
  
  const profile = getLCSIInterpretation(rawCode);
  if (!profile) {
    alert("검증되지 않은 유형의 패턴입니다. 정확한 영문 대문자 코드를 확인해 주세요.");
    return;
  }
  
  // Save State
  currentSession.lcsiCode = rawCode;
  currentSession.profile = profile;
  
  // Pre-load On-device model immediately if selected
  if (engineSelector.value === 'ondevice') {
    const ok = await initOnDeviceEngine();
    if (!ok) return; // Terminate if loading crashed
  }
  
  // Load Sidebar UI Profile
  profileBadge.innerText = profile.code;
  profileTitle.innerText = profile.title;
  profileDesc.innerText = profile.summary;
  
  // Load Dimension Cards
  dimensionBox.innerHTML = '';
  Object.entries(profile.dimension).forEach(([key, value]) => {
    const dimDiv = document.createElement('div');
    dimDiv.className = 'dimension-item';
    
    const nameDiv = document.createElement('div');
    nameDiv.className = 'dimension-name';
    nameDiv.innerText = key.toUpperCase();
    
    const descDiv = document.createElement('div');
    descDiv.className = 'dimension-desc';
    descDiv.innerText = value;
    
    dimDiv.appendChild(nameDiv);
    dimDiv.appendChild(descDiv);
    dimensionBox.appendChild(dimDiv);
  });
  
  // Start Welcome Message
  chatMessages.innerHTML = '';
  const currentEngineModeText = engineSelector.value === 'ondevice' ? "💻 초고속 온디바이스 AI (로컬 GPU 가속)" : "☁️ 구글 클라우드 Gemini API";
  appendMessage('assistant', `안녕하세요! 수검자님의 '${profile.code} (${profile.title})' 맞춤형 전용 RAG 심리상담방에 오신 것을 환영합니다.\n\n[현재 활성화된 엔진: ${currentEngineModeText}]\n해설 매뉴얼 데이터베이스를 바탕으로 안전한 해석 가이드를 제공합니다. 궁금한 질문을 남겨주세요.`);
  
  // Screen Transition
  welcomeScreen.classList.add('hidden');
  chatScreen.classList.remove('hidden');
});

// Settings & API Key Configuration
document.getElementById('btnSettings').addEventListener('click', () => {
  apiKeyInput.value = currentSession.apiKey;
  settingsModal.classList.remove('hidden');
});

document.getElementById('btnCloseSettings').addEventListener('click', () => {
  settingsModal.classList.add('hidden');
});

apiKeyForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const newKey = apiKeyInput.value.trim();
  localStorage.setItem('gemini_api_key', newKey);
  currentSession.apiKey = newKey;
  settingsModal.classList.add('hidden');
  alert("Gemini API Key가 성공적으로 업데이트되었습니다.");
});

// Action: Reset Chat & Session
document.getElementById('btnReset').addEventListener('click', () => {
  if (confirm("대화 세션을 초기화하고 시작 페이지로 이동하시겠습니까?")) {
    currentSession.lcsiCode = null;
    currentSession.profile = null;
    currentSession.chatHistory = [];
    
    // Unlock Inputs
    chatInput.disabled = false;
    chatInput.placeholder = "결과에 대해 궁금한 점을 질문해 보세요...";
    const sendBtn = chatForm.querySelector('button');
    if (sendBtn) sendBtn.disabled = false;
    
    chatScreen.classList.add('hidden');
    welcomeScreen.classList.remove('hidden');
  }
});

// Action: Handle Chat Inquiry (Hybrid RAG Pipeline & Guardrail)
chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const query = chatInput.value.trim();
  if (!query) return;
  
  // 1. User Message Append
  appendMessage('user', query);
  chatInput.value = '';
  
  // 2. CSO Guardrail: Check Crisis Immediately (Pre-LLM)
  if (checkCrisisState(query)) {
    triggerEmergencyLock();
    return;
  }
  
  // 3. Client-Side RAG Context Construction & Hallucination Defense
  const profile = currentSession.profile;
  const contextText = profile.interpretation.join('\n');
  
  // Check local relevance (basic keyword relevance score)
  const keywords = query.toLowerCase().split(' ');
  let relevanceMatches = 0;
  keywords.forEach(word => {
    if (word.length > 1 && contextText.toLowerCase().includes(word)) {
      relevanceMatches++;
    }
  });
  
  // Rigid Fallback logic if query is entirely off-topic
  const isOutOfScope = relevanceMatches === 0 && keywords.filter(w => w.length > 1).length > 2;
  
  toggleTyping(true);
  
  // Wait short delay to simulate AI thinking
  await new Promise(resolve => setTimeout(resolve, 500));
  
  if (isOutOfScope) {
    toggleTyping(false);
    appendMessage('assistant', "등록된 데이터베이스 내에는 해당 내용이 없습니다.");
    return;
  }
  
  const systemPrompt = `당신은 LCSI 심리검사 전문 공감 상담가입니다. 다음 제공된 [Context] 지침서 내용에만 절대적으로 기반하여 따뜻한 공감의 존댓말 톤으로 질문에 대답하십시오. 절대 가상의 사실을 꾸며내지 마십시오. 만약 주어진 컨텍스트에서 적절한 상담 답변 근거를 찾기 어려운 뜬금없는 질문의 경우 무조건 "등록된 데이터베이스 내에는 해당 내용이 없습니다."라고 정확하게 대답하십시오. 절대 타협해선 안 됩니다.\n\n[Context]\n${contextText}\n\n사용자 유형: ${profile.code} (${profile.title})\n사용자 질문: ${query}`;
  
  // --- ENGINE ROUTING ---
  const activeEngineMode = engineSelector.value;
  
  if (activeEngineMode === 'ondevice') {
    // 💻 A. On-Device Local GPU AI Mode (WebLLM Qwen2.5)
    try {
      if (!webllmEngine) {
        const ok = await initOnDeviceEngine();
        if (!ok) {
          toggleTyping(false);
          return;
        }
      }
      
      const response = await webllmEngine.chat.completions.create({
        messages: [
          { role: "system", content: "You are a professional Korean empathetic psychologist counselor. Always respond in Korean." },
          { role: "user", content: systemPrompt }
        ],
        temperature: 0.2, // Low temperature for high fidelity to context
        max_tokens: 600
      });
      
      toggleTyping(false);
      const aiText = response.choices[0].message.content;
      if (aiText) {
        appendMessage('assistant', aiText.trim());
      } else {
        appendMessage('assistant', "로컬 연산 중 예기치 못한 에러가 발생했습니다.");
      }
      
    } catch (error) {
      toggleTyping(false);
      console.error(error);
      appendMessage('assistant', `온디바이스 가속 연산 중 에러가 발생했습니다. 브라우저 WebGPU 자원이 부족할 수 있습니다. (${error.message || 'Unknown'})`);
    }
    
  } else {
    // ☁️ B. Google Gemini API Mode
    const apiKey = currentSession.apiKey;
    if (!apiKey) {
      toggleTyping(false);
      appendMessage('assistant', "안내: 실시간 구글 클라우드 AI 해석 답변을 받으려면 우측 상단 톱니바퀴 설정 아이콘을 클릭하여 개인 구글 'Gemini API Key'를 등록해 주셔야 합니다.\n\n(또는 엔진을 '💻 온디바이스 AI'로 전환하시면 키 입력 없이 기기 내부 가속을 통해 즉시 무료로 대화가 가능합니다.)");
      return;
    }
    
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: systemPrompt }]
          }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 800
          }
        })
      });
      
      toggleTyping(false);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        appendMessage('assistant', `API 연동 오류가 발생했습니다. 키가 올바른지 확인해 주세요. (HTTP ${response.status}: ${errorData.error?.message || 'Unknown'})`);
        return;
      }
      
      const data = await response.json();
      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (aiText) {
        appendMessage('assistant', aiText.trim());
      } else {
        appendMessage('assistant', "죄송합니다, 답변을 가져오는 과정에서 오류가 발생했습니다.");
      }
      
    } catch (error) {
      toggleTyping(false);
      console.error(error);
      appendMessage('assistant', "네트워크 에러가 발생했습니다. 인터넷 연결 상태를 확인해 주세요.");
    }
  }
});

// Action: Close Emergency Modal (Reset to Welcome)
document.getElementById('btnCloseEmergency').addEventListener('click', () => {
  emergencyModal.classList.add('hidden');
  
  // Full reset
  currentSession.lcsiCode = null;
  currentSession.profile = null;
  currentSession.chatHistory = [];
  
  chatInput.disabled = false;
  chatInput.placeholder = "결과에 대해 궁금한 점을 질문해 보세요...";
  const sendBtn = chatForm.querySelector('button');
  if (sendBtn) sendBtn.disabled = false;
  
  chatScreen.classList.add('hidden');
  welcomeScreen.classList.remove('hidden');
});
