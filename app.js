// LCSI AI Chatbot - Core Application Logic (Ultra-Lightweight Hybrid RAG Engine)

// Elements
const welcomeScreen = document.getElementById('welcomeScreen');
const chatScreen = document.getElementById('chatScreen');
const welcomeForm = document.getElementById('welcomeForm');
const lcsiCodeInput = document.getElementById('lcsiCodeInput');

const profileBadge = document.getElementById('profileBadge');
const characterGraphic = document.getElementById('characterGraphic');
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

// Action: Local Intelligent RAG Matcher (CPU-based, 0ms latency, 100% stable)
function processLocalRAGInquiry(query, profile) {
  const normQuery = query.toLowerCase();
  const interpretation = profile.interpretation;
  
  // High fidelity sub-dimension trigger keywords
  const relationKeywords = ['관계', '사람', '친구', '대인', '소통', '타인', '동료', '직장', '소외', '갈등', '싸움'];
  const stressKeywords = ['스트레스', '힘들', '우울', '지치', '고민', '피로', '슬프', '불안', '답답', '압박'];
  const successKeywords = ['일', '성공', '목표', '성과', '성과', '성취', '집념', '실행', '공정', '역량', '강점'];
  
  let targetParagraph = "";
  let themeText = "";
  
  // 1. Analyze user intention against the manual segments
  const hasRelation = relationKeywords.some(w => normQuery.includes(w));
  const hasStress = stressKeywords.some(w => normQuery.includes(w));
  const hasSuccess = successKeywords.some(w => normQuery.includes(w));
  
  if (hasRelation && interpretation[1]) {
    targetParagraph = interpretation[1];
    themeText = "대인관계 대처 방식";
  } else if (hasStress && interpretation[2]) {
    targetParagraph = interpretation[2];
    themeText = "스트레스 상황과 대처 팁";
  } else if (hasSuccess && interpretation[3]) {
    targetParagraph = interpretation[3];
    themeText = "핵심 잠재력 및 역량 관리";
  } else {
    // Default to core personality orientation (Paragraph 0)
    targetParagraph = interpretation[0];
    themeText = "본질적 성격 패턴 가이드";
  }
  
  // 2. Synthesize highly personalized empathetic feedback
  const intros = [
    `수검자님의 진솔한 고민과 질문을 깊이 경청하며 공감합니다. ${profile.code} (${profile.title}) 유형의 본질적 결에 비추어 말씀해주신 맥락을 차분히 해석해 드립니다.`,
    `귀하께서 질문 주신 내용은 ${profile.code} 유형을 가진 분들이 삶에서 마주하는 매우 전형적이고 중요한 마음의 지점입니다. 임상 매뉴얼 분석을 토대로 안내해 드립니다.`,
    `전달해주신 말씀을 통해 현재 느끼시는 생각의 온도를 차분하게 가늠해 봅니다. 귀하의 성격 프로필 분석 자료 중 [${themeText}] 문헌을 바탕으로 조언을 재구성했습니다.`
  ];
  
  const outtros = [
    `\n\n이 해석이 수검자님의 마음의 여정에 따뜻하고 안전한 나침반이 되기를 소망합니다. 또 다른 구체적인 갈등이나 성향에 대해 더 질문 주셔도 좋습니다.`,
    `\n\n${profile.code} 유형으로서 지닌 훌륭한 자질을 믿고, 스트레스 속에서도 스스로를 보듬어주는 오늘이 되시기를 진심으로 응원합니다.`,
    `\n\n매뉴얼 해석이 귀하의 일상 속 실천에 작은 위안과 구체적인 대안이 되었기를 바라며, 성격 분석에 관해 언제든 질문을 계속 이어나가 주시기 바랍니다.`
  ];
  
  // Dynamic synthesis from array indexes
  const intro = intros[Math.floor(Math.random() * intros.length)];
  const outro = outtros[Math.floor(Math.random() * outtros.length)];
  
  // Construct RAG response
  let answer = `${intro}\n\n📌 **${themeText} 해설 매뉴얼:**\n"${targetParagraph}"\n\n💡 **전문 상담사 조언:**\n귀하는 ${profile.summary} 질문 주신 맥락에 비추어 볼 때, 이 임상 가이드라인을 토대로 현재 처하신 갈등에 천천히 대입해 보시길 권장합니다.`;
  answer += outro;
  
  return answer;
}

// Action: Handle Welcome Entry
welcomeForm.addEventListener('submit', (e) => {
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
  
  // Load Sidebar UI Profile
  profileBadge.innerText = profile.code;
  updateCharacterGraphic(profile.code);
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
  appendMessage('assistant', `안녕하세요! 수검자님의 '${profile.code} (${profile.title})' 맞춤형 전용 RAG 심리상담방에 오신 것을 환영합니다.\n\n해설 매뉴얼 데이터베이스를 바탕으로 안전한 해석 가이드를 제공합니다. 궁금한 질문을 남겨주세요.`);
  
  // Screen Transition
  welcomeScreen.classList.add('hidden');
  chatScreen.classList.remove('hidden');
});

// Interactive Sample Chips Selection Handler
document.querySelectorAll('.sample-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    lcsiCodeInput.value = chip.dataset.code;
    welcomeForm.dispatchEvent(new Event('submit'));
  });
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
  
  // Check local relevance (Intelligent semantic match using database or psychological vocabs)
  const psychVocabs = ['성격', '마음', '고민', '스트레스', '관계', '사람', '일', '행동', '생각', '나', '너', '특징', '장점', '단점', '특성', '조언', '위로', '해석', '이해', '태도', '유형', '갈등', '힘들', '우울', '슬프', '기쁨', '감정', '추천', '안내', '해설', '도움'];
  
  const keywords = query.toLowerCase().split(' ');
  let relevanceMatches = 0;
  
  keywords.forEach(word => {
    if (word.length > 1) {
      const isManualMatch = contextText.toLowerCase().includes(word);
      const isPsychMatch = psychVocabs.some(v => word.includes(v) || v.includes(word));
      if (isManualMatch || isPsychMatch) {
        relevanceMatches++;
      }
    }
  });
  
  // Specific fallbacks for completely unrelated non-psychological commands
  const unrelatedKeywords = ['날씨', '주가', '주식', '환율', '뉴스', '코로나', '코인', '비트코인', '맛집', '음악', '맛집', '코딩', '프로그래밍'];
  const hasUnrelated = unrelatedKeywords.some(w => query.toLowerCase().includes(w));
  
  // Rigid Fallback logic if query is entirely off-topic (no matching manual concepts nor psychological intentions)
  const isOutOfScope = hasUnrelated || (relevanceMatches === 0 && keywords.filter(w => w.length > 1).length > 0);
  
  toggleTyping(true);
  
  // Wait short delay to simulate AI thinking
  await new Promise(resolve => setTimeout(resolve, 500));
  
  if (isOutOfScope) {
    toggleTyping(false);
    appendMessage('assistant', "등록된 데이터베이스 내에는 해당 내용이 없습니다.");
    return;
  }
  
  const activeEngineMode = engineSelector.value;
  
  if (activeEngineMode === 'ondevice') {
    // 💻 A. On-Device Pure Local NLP RAG Engine (Zero CPU footprint, 0ms, infinite stability)
    toggleTyping(false);
    const localResponse = processLocalRAGInquiry(query, profile);
    appendMessage('assistant', localResponse);
    
  } else {
    // ☁️ B. Google Gemini API Mode
    const apiKey = currentSession.apiKey;
    if (!apiKey) {
      toggleTyping(false);
      appendMessage('assistant', "안내: 실시간 구글 클라우드 AI 해석 답변을 받으려면 우측 상단 톱니바퀴 설정 아이콘을 클릭하여 개인 구글 'Gemini API Key'를 등록해 주셔야 합니다.\n\n(또는 엔진을 '💻 온디바이스 초경량 엔진'으로 전환하시면 별도 키 없이 무제한으로 실시간 즉시 상담이 가능합니다.)");
      return;
    }
    
    try {
      const systemPrompt = `당신은 LCSI 심리검사 전문 공감 상담가입니다. 다음 제공된 [Context] 지침서 내용에만 절대적으로 기반하여 따뜻한 공감의 존댓말 톤으로 질문에 대답하십시오. 절대 가상의 사실을 꾸며내지 마십시오. 만약 주어진 컨텍스트에서 적절한 상담 답변 근거를 찾기 어려운 뜬금없는 질문의 경우 무조건 "등록된 데이터베이스 내에는 해당 내용이 없습니다."라고 정확하게 대답하십시오. 절대 타협해선 안 됩니다.\n\n[Context]\n${contextText}\n\n사용자 유형: ${profile.code} (${profile.title})\n사용자 질문: ${query}`;
      
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


// Dynamic MBTI/LCSI Character Generator with Motion Graphics (SVG)
function updateCharacterGraphic(code) {
  const graphicContainer = document.getElementById('characterGraphic');
  if (!graphicContainer) return;
  
  const type = code.toUpperCase();
  
  // 1. Determine Temperament Group
  let group = "SJ"; // Default Guardian
  if (type.includes('N') && type.includes('F')) {
    group = "NF"; // Idealist
  } else if (type.includes('N') && type.includes('T')) {
    group = "NT"; // Rational
  } else if (type.includes('S') && type.includes('P')) {
    group = "SP"; // Artisan
  } else if (type.includes('S') && type.includes('J')) {
    group = "SJ"; // Guardian
  } else {
    group = type.includes('N') ? "NT" : "SJ";
  }

  let svgContent = "";

  // 2. Generate detailed, stunning vector characters for each group
  if (group === "NF") {
    // 🌸 Idealist NF (Dreamer, Companion, Counselor - Wings, Sparks, Heart sprout)
    svgContent = `
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="nfGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#f43f5e" />
            <stop offset="100%" stop-color="#8b5cf6" />
          </linearGradient>
          <linearGradient id="wingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ec4899" stop-opacity="0.7" />
            <stop offset="100%" stop-color="#4f46e5" stop-opacity="0.3" />
          </linearGradient>
        </defs>
        <!-- Wing Left -->
        <path d="M 28 45 C 5 25, 10 10, 35 38 C 30 25, 12 18, 30 45" fill="url(#wingGrad)" class="nf-wing-left" />
        <!-- Wing Right -->
        <path d="M 72 45 C 95 25, 90 10, 65 38 C 70 25, 88 18, 70 45" fill="url(#wingGrad)" class="nf-wing-right" />
        <!-- Glowing Core Body -->
        <circle cx="50" cy="48" r="16" fill="url(#nfGrad)" />
        <circle cx="50" cy="48" r="13" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="1.5" />
        <!-- Face Features -->
        <path d="M 46 46 A 1 1 0 0 0 46 48" stroke="#ffffff" stroke-width="2" stroke-linecap="round" fill="none" />
        <path d="M 54 46 A 1 1 0 0 0 54 48" stroke="#ffffff" stroke-width="2" stroke-linecap="round" fill="none" />
        <path d="M 48 51 Q 50 53 52 51" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" fill="none" />
        <!-- Sprout on Head -->
        <path d="M 50 32 Q 50 25 54 22 Q 51 25 50 30" fill="#10b981" />
        <path d="M 50 32 Q 50 25 46 22 Q 49 25 50 30" fill="#10b981" />
        <!-- Sparkling stars -->
        <polygon points="50,12 51,15 54,16 51,17 50,20 49,17 46,16 49,15" fill="#fbcfe8" class="sp-spark-glow" style="transform: scale(0.6); transform-origin: 50px 12px;" />
        <polygon points="25,65 26,67 28,68 26,69 25,71 24,69 22,68 24,67" fill="#fbcfe8" class="sp-spark-glow" style="transform: scale(0.5); transform-origin: 25px 65px; animation-delay: 1s;" />
      </svg>
    `;
  } else if (group === "SJ") {
    // 🛡️ Guardian SJ (Sentinel, Protector, Executor - Shield, Dual Interlocking Gears)
    svgContent = `
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="sjGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#06b6d4" />
            <stop offset="100%" stop-color="#10b981" />
          </linearGradient>
        </defs>
        <!-- Background Gear Secondary -->
        <g class="sj-cog-secondary">
          <circle cx="50" cy="50" r="28" fill="none" stroke="rgba(6, 182, 212, 0.15)" stroke-width="4" stroke-dasharray="6, 3" />
        </g>
        <!-- Background Gear Primary -->
        <g class="sj-cog-primary">
          <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(16, 185, 129, 0.2)" stroke-width="2" stroke-dasharray="10, 8" />
        </g>
        <!-- Solid Shield Body -->
        <path d="M 34 32 L 66 32 C 66 32, 66 54, 50 68 C 34 54, 34 32, 34 32 Z" fill="url(#sjGrad)" />
        <path d="M 37 35 L 63 35 C 63 35, 63 52, 50 64 C 37 52, 37 35, 37 35 Z" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="1.5" />
        <!-- Face Features -->
        <path d="M 45 42 A 1 1 0 0 0 45 44" stroke="#ffffff" stroke-width="2" stroke-linecap="round" fill="none" />
        <path d="M 55 42 A 1 1 0 0 0 55 44" stroke="#ffffff" stroke-width="2" stroke-linecap="round" fill="none" />
        <path d="M 47 48 L 53 48" stroke="#ffffff" stroke-width="2" stroke-linecap="round" fill="none" />
        <!-- Golden Star on Shield -->
        <polygon points="50,52 52,55 55,55 53,57 54,60 50,58 46,60 47,57 45,55 48,55" fill="#fbcfe8" class="sp-spark-glow" style="transform: scale(0.85); transform-origin: 50px 55px;" />
      </svg>
    `;
  } else if (group === "NT") {
    // 🧠 Rational NT (Strategist, Thinker, Tech - Floating Gyroscopic Prism, Hologram Grid)
    svgContent = `
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="ntGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#8b5cf6" />
            <stop offset="100%" stop-color="#3b82f6" />
          </linearGradient>
        </defs>
        <!-- Grid Ring -->
        <circle cx="50" cy="50" r="36" fill="none" stroke="rgba(139, 92, 246, 0.15)" stroke-width="1" />
        <circle cx="50" cy="50" r="36" fill="none" stroke="rgba(59, 130, 246, 0.25)" stroke-width="1.5" stroke-dasharray="15, 10" class="sj-cog-primary" />
        <!-- Orb Outer nodes -->
        <circle cx="14" cy="50" r="3" fill="#3b82f6" class="nt-node-glow" />
        <circle cx="86" cy="50" r="3" fill="#8b5cf6" class="nt-node-glow" style="animation-delay: 1.5s;" />
        <!-- Gyroscopic Prism Body -->
        <g class="nt-prism-core">
          <!-- Octahedron Structure -->
          <polygon points="50,20 72,50 50,80 28,50" fill="url(#ntGrad)" opacity="0.85" />
          <polygon points="50,20 50,80 72,50" fill="rgba(255,255,255,0.15)" />
          <polygon points="50,20 28,50 50,50" fill="rgba(255,255,255,0.08)" />
          <!-- Inner Thinking Core -->
          <circle cx="50" cy="50" r="7" fill="#ffffff" class="nt-node-glow" />
          <!-- Cute Glasses / Eyes overlay -->
          <rect x="42" y="47" width="6" height="4" rx="1" fill="none" stroke="#2e1065" stroke-width="1.5" />
          <rect x="52" y="47" width="6" height="4" rx="1" fill="none" stroke="#2e1065" stroke-width="1.5" />
          <line x1="48" y1="49" x2="52" y2="49" stroke="#2e1065" stroke-width="1.5" />
        </g>
      </svg>
    `;
  } else {
    // ⚡ Artisan SP (Explorer, Maker, Creator - Wind wave, Spark, Lightning)
    svgContent = `
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="spGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#f59e0b" />
            <stop offset="100%" stop-color="#ec4899" />
          </linearGradient>
        </defs>
        <!-- Wind/Movement Lines -->
        <path d="M 15 28 L 45 28" stroke="rgba(245, 158, 11, 0.3)" stroke-width="2" stroke-linecap="round" class="sp-wind-streak" />
        <path d="M 22 72 L 52 72" stroke="rgba(236, 72, 153, 0.3)" stroke-width="2" stroke-linecap="round" class="sp-wind-streak" style="animation-delay: 2s;" />
        <!-- Floating Lightning / Spark Core -->
        <g class="sp-spark-glow">
          <polygon points="50,18 64,36 82,36 68,54 75,78 50,66 25,78 32,54 18,36 36,36" fill="url(#spGrad)" />
          <polygon points="50,23 60,38 75,38 64,52 69,72 50,62 31,72 36,52 25,38 40,38" fill="rgba(255,255,255,0.2)" />
        </g>
        <!-- Small goggles at the center -->
        <circle cx="45" cy="46" r="4" fill="none" stroke="#ffffff" stroke-width="2" />
        <circle cx="55" cy="46" r="4" fill="none" stroke="#ffffff" stroke-width="2" />
        <line x1="49" y1="46" x2="51" y2="46" stroke="#ffffff" stroke-width="2" />
        <!-- Cute Smile -->
        <path d="M 48 52 Q 50 54 52 52" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" fill="none" />
      </svg>
    `;
  }

  graphicContainer.innerHTML = svgContent;
}
