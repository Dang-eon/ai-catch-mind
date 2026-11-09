import React, { useState, useEffect, useRef } from 'react';
import { Palette, Eraser, RotateCcw, Clock, CheckCircle2, XCircle, Play, Image as ImageIcon, Sparkles, Home, Dog, Apple, Carrot, Package, Bus, Dices, Download } from 'lucide-react';


// --- Data ---
const CATEGORIES = {
  '동물': ['호랑이', '코끼리', '토끼', '강아지', '고양이', '사자', '기린', '원숭이', '돼지', '소'],
  '과일': ['사과', '바나나', '수박', '포도', '딸기', '귤', '복숭아', '파인애플', '레몬', '메론'],
  '채소': ['당근', '배추', '양파', '오이', '호박', '감자', '고구마', '무', '마늘', '가지'],
  '사물': ['시계', '우산', '안경', '가방', '모자', '신발', '책상', '의자', '연필', '컴퓨터'],
  '교통수단': ['버스', '비행기', '기차', '자동차', '자전거', '배', '헬리콥터', '오토바이', '택시', '트럭']
};

const CATEGORY_COLORS = {
  '동물': 'bg-amber-400 hover:bg-amber-500 shadow-amber-400/50',
  '과일': 'bg-red-400 hover:bg-red-500 shadow-red-400/50',
  '채소': 'bg-green-400 hover:bg-green-500 shadow-green-400/50',
  '사물': 'bg-blue-400 hover:bg-blue-500 shadow-blue-400/50',
  '교통수단': 'bg-purple-400 hover:bg-purple-500 shadow-purple-400/50',
  '랜덤 주제': 'bg-indigo-500 hover:bg-indigo-600 shadow-indigo-500/50'
};

const CATEGORY_ICONS = {
  '동물': Dog, 
  '과일': Apple, 
  '채소': Carrot, 
  '사물': Package, 
  '교통수단': Bus, 
  '랜덤 주제': Dices
};

const COLORS = ['#000000', '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#FFFFFF'];
const BRUSH_SIZES = [5, 10, 20];

// --- Main Component ---
export default function App() {
  const [gameState, setGameState] = useState('start'); // 'start', 'playing', 'analyzing', 'result'
  const [selectedMenu, setSelectedMenu] = useState(''); // 사용자가 처음 선택한 메뉴 (랜덤 주제 포함)
  const [category, setCategory] = useState(''); // 실제 게임에 적용된 카테고리
  const [targetWord, setTargetWord] = useState('');
  const [timeLeft, setTimeLeft] = useState(60);
  const [drawnImage, setDrawnImage] = useState(null);
  const [aiGuess, setAiGuess] = useState('');
  const [isMatch, setIsMatch] = useState(false);

  // Canvas Refs & State
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState(COLORS[0]);
  const [brushSize, setBrushSize] = useState(BRUSH_SIZES[0]);

  // Timer logic
  useEffect(() => {
    let timer;
    if (gameState === 'playing' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0 && gameState === 'playing') {
      // 시간 초과 시 잠금 처리됨 (제출은 수동 또는 자동 진행)
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  const startGame = (menu) => {
    setSelectedMenu(menu);
    
    // 랜덤 주제인 경우 전체 카테고리 중 하나를 랜덤으로 선택
    let actualCategory = menu;
    if (menu === '랜덤 주제') {
      const categoryKeys = Object.keys(CATEGORIES);
      actualCategory = categoryKeys[Math.floor(Math.random() * categoryKeys.length)];
    }

    const words = CATEGORIES[actualCategory];
    const randomWord = words[Math.floor(Math.random() * words.length)];
    
    setCategory(actualCategory);
    setTargetWord(randomWord);
    setTimeLeft(60);
    setGameState('playing');
    setDrawnImage(null);
    setAiGuess('');
    setIsMatch(false);
    
    setTimeout(() => clearCanvas(), 50); 
  };

  // --- Canvas Coordinate Logic ---
  // 정확한 마우스 및 터치 좌표 계산 (scaleX, scaleY 적용)
  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;    // 실제 캔버스 크기와 화면 표시 크기 비율
    const scaleY = canvas.height / rect.height;  // 실제 캔버스 크기와 화면 표시 크기 비율
    
    const clientX = e.touches && e.touches.length > 0 ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches && e.touches.length > 0 ? e.touches[0].clientY : e.clientY;
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e) => {
    if (gameState !== 'playing' || timeLeft === 0) return;
    setIsDrawing(true);
    
    const ctx = canvasRef.current.getContext('2d');
    const pos = getCoordinates(e);
    
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    
    if (e.type.includes('touch')) e.preventDefault();
  };

  const draw = (e) => {
    if (!isDrawing || gameState !== 'playing' || timeLeft === 0) return;
    
    const ctx = canvasRef.current.getContext('2d');
    const pos = getCoordinates(e);
    
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    
    if (e.type.includes('touch')) e.preventDefault();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  };

  // Initialize canvas background to white on load
  useEffect(() => {
    if (gameState === 'playing' && canvasRef.current) {
      clearCanvas();
    }
  }, [gameState]);

  // --- Snapshot Download Feature ---
  const handleDownloadImage = () => {
    if (!drawnImage) return;
    const link = document.createElement('a');
    link.href = drawnImage;
    link.download = `AI_캐치마인드_${targetWord}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- API Interaction ---
  const handleSubmit = async () => {
    if (!canvasRef.current) return;
    
    setGameState('analyzing');
    const dataUrl = canvasRef.current.toDataURL('image/png');
    setDrawnImage(dataUrl);
    
    const base64ImageData = dataUrl.split(',')[1];
    
    const prompt = `이 그림은 [${category}] 카테고리에 속하는 항목입니다. 사용자가 그린 그림이 무엇인지 추측해서 반드시 '한국어 명사 단 한 단어'로만 대답하세요. 마침표나 부가 설명 없이 딱 단어 하나만 출력하세요.`;

    try {
      const apiKey = ""; // Left empty for Canvas to provide
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;
      
      const payload = {
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: "image/png",
                  data: base64ImageData
                }
              }
            ]
          }
        ],
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      
      if (result.candidates && result.candidates[0]?.content?.parts?.[0]?.text) {
        let guess = result.candidates[0].content.parts[0].text.trim();
        guess = guess.replace(/[.,!?]/g, '').trim(); 
        
        setAiGuess(guess);
        setIsMatch(guess === targetWord);
      } else {
        setAiGuess('모르겠어요');
        setIsMatch(false);
      }
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      setAiGuess('오류 발생');
      setIsMatch(false);
    } finally {
      setGameState('result');
    }
  };

  // --- Screens ---

  const renderStartScreen = () => {
    const menus = [...Object.keys(CATEGORIES), '랜덤 주제'];
    
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-sky-50 p-6 font-sans">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-2xl w-full text-center border-4 border-sky-100">
          <div className="flex justify-center mb-4">
            <Sparkles className="w-16 h-16 text-yellow-400 animate-pulse" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-sky-600 mb-2 drop-shadow-sm">AI 캐치마인드</h1>
          <p className="text-gray-500 text-lg mb-8 font-medium">내가 그린 그림을 AI가 맞출 수 있을까?</p>
          
          <h2 className="text-xl font-bold text-gray-700 mb-6">카테고리를 선택하세요!</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {menus.map(cat => {
              const Icon = CATEGORY_ICONS[cat];
              return (
                <button
                  key={cat}
                  onClick={() => startGame(cat)}
                  className={`${CATEGORY_COLORS[cat]} transform transition-all active:scale-95 hover:-translate-y-1 p-4 rounded-2xl shadow-lg flex flex-col items-center justify-center gap-2 group`}
                >
                  <Icon className="w-12 h-12 text-white group-hover:scale-110 transition-transform" strokeWidth={1.5} />
                  <span className="text-xl font-bold text-white tracking-wide">{cat}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderGameScreen = () => {
    const CategoryIcon = category ? CATEGORY_ICONS[category] : null;

    return (
      <div className="flex flex-col min-h-screen bg-slate-50 p-4 md:p-6 font-sans select-none">
        <div className="max-w-4xl w-full mx-auto bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col h-[90vh] border-2 border-slate-100">
          
          {/* Header */}
          <div className="bg-sky-100 p-4 md:p-6 flex justify-between items-center shrink-0 border-b-4 border-sky-200">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-sky-600 mb-1 flex items-center gap-1">
                {CategoryIcon && <CategoryIcon className="w-4 h-4" />}
                {category} 카테고리
              </span>
              <div className="text-2xl md:text-3xl font-black text-gray-800 flex items-center gap-2">
                <span>제시어:</span>
                <span className="text-blue-600 underline underline-offset-4 decoration-wavy decoration-sky-400">{targetWord}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl shadow-sm border border-sky-200">
              <Clock className={`w-6 h-6 ${timeLeft <= 10 ? 'text-red-500 animate-bounce' : 'text-sky-500'}`} />
              <span className={`text-2xl font-black ${timeLeft <= 10 ? 'text-red-500' : 'text-gray-700'}`}>
                {timeLeft}초
              </span>
            </div>
          </div>

          {/* Canvas Area */}
          <div className="relative flex-grow bg-gray-200 overflow-hidden" style={{ touchAction: 'none' }}>
            <canvas
              ref={canvasRef}
              width={800} // 내부 해상도 유지
              height={600}
              className="w-full h-full object-contain cursor-crosshair bg-white"
              style={{ touchAction: 'none' }} // 모바일 스크롤 방지
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseOut={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              onTouchCancel={stopDrawing}
            />
            
            {/* Overlay */}
            {(timeLeft === 0 || gameState === 'analyzing') && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                {gameState === 'analyzing' ? (
                  <div className="text-center animate-pulse">
                    <div className="text-6xl mb-4">🤔</div>
                    <h3 className="text-3xl font-black text-sky-600 drop-shadow-md">AI가 생각 중입니다...</h3>
                    <p className="text-gray-600 mt-2 font-bold text-lg">어떤 그림인지 고민하고 있어요!</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="text-6xl mb-4">⏰</div>
                    <h3 className="text-4xl font-black text-red-500 mb-6 drop-shadow-md">시간 종료!</h3>
                    <button 
                      onClick={handleSubmit}
                      className="bg-green-500 hover:bg-green-600 text-white font-bold text-2xl px-8 py-4 rounded-full shadow-lg transform transition active:scale-95 flex items-center justify-center mx-auto gap-2"
                    >
                      결과 확인하기
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Toolbar */}
          <div className="bg-slate-100 p-4 shrink-0 flex flex-wrap justify-between items-center gap-4 border-t-2 border-slate-200">
            <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
              <Palette className="text-gray-400 w-6 h-6 ml-2" />
              <div className="flex gap-2">
                {COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-10 h-10 rounded-full border-4 shadow-sm transform transition-transform hover:scale-110 active:scale-95 ${color === c ? 'border-gray-400 scale-110' : 'border-white'}`}
                    style={{ backgroundColor: c }}
                    aria-label={`Select color ${c}`}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
              <span className="text-gray-500 font-bold ml-2 text-sm">굵기</span>
              {BRUSH_SIZES.map(size => (
                <button
                  key={size}
                  onClick={() => setBrushSize(size)}
                  className={`w-12 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors ${brushSize === size ? 'bg-gray-200 shadow-inner' : ''}`}
                >
                  <div className="bg-gray-800 rounded-full" style={{ width: size, height: size }} />
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={clearCanvas}
                disabled={timeLeft === 0}
                className="flex items-center gap-2 px-4 py-3 bg-white hover:bg-red-50 text-red-500 font-bold rounded-xl border border-red-200 shadow-sm transition-colors disabled:opacity-50"
              >
                <RotateCcw className="w-5 h-5" /> 지우기
              </button>
              <button
                onClick={handleSubmit}
                disabled={timeLeft === 0 && gameState !== 'playing'} 
                className={`flex items-center gap-2 px-6 py-3 font-black rounded-xl shadow-md transition-all text-white ${timeLeft > 0 ? 'bg-blue-500 hover:bg-blue-600 active:scale-95' : 'bg-gray-400 cursor-not-allowed'}`}
              >
                <CheckCircle2 className="w-6 h-6" /> 제출하기
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderResultScreen = () => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4 md:p-6 font-sans">
      <div className="max-w-5xl w-full bg-white rounded-3xl shadow-xl overflow-hidden border-4 border-slate-200">
        
        {/* Result Header */}
        <div className={`p-8 text-center border-b-4 ${isMatch ? 'bg-green-100 border-green-200' : 'bg-red-100 border-red-200'}`}>
          {isMatch ? (
            <div className="animate-bounce">
              <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-4" />
              <h2 className="text-4xl md:text-5xl font-black text-green-600 drop-shadow-sm">정답입니다! 대단해요! 🎉</h2>
            </div>
          ) : (
            <div>
              <XCircle className="w-20 h-20 text-red-400 mx-auto mb-4" />
              <h2 className="text-4xl md:text-5xl font-black text-red-500 drop-shadow-sm">아쉽네요! 😅</h2>
              <p className="text-xl text-red-700 font-bold mt-2">AI가 그림을 헷갈려했어요.</p>
            </div>
          )}
        </div>

        {/* Comparison Area */}
        <div className="p-6 md:p-10 bg-slate-50 flex flex-col md:flex-row gap-8 items-center justify-center">
          
          {/* User Drawing */}
          <div className="flex flex-col items-center w-full md:w-5/12">
            <div className="bg-white p-3 rounded-2xl shadow-md border border-slate-200 w-full aspect-[4/3] flex items-center justify-center relative overflow-hidden group">
               {drawnImage ? (
                  <img src={drawnImage} alt="내가 그린 그림" className="max-w-full max-h-full object-contain" />
               ) : (
                  <ImageIcon className="w-16 h-16 text-gray-300" />
               )}
            </div>
            <div className="mt-4 text-center flex flex-col items-center gap-2">
              <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">실제 정답</span>
              <p className="text-3xl font-black text-blue-600 bg-blue-50 px-6 py-2 rounded-full border border-blue-100">{targetWord}</p>
              
              {/* 스냅샷 이미지 저장 버튼 */}
              <button
                onClick={handleDownloadImage}
                className="mt-2 flex items-center gap-2 text-sm font-bold bg-white hover:bg-slate-100 text-slate-700 px-4 py-2 rounded-xl border border-slate-200 shadow-sm transition-all active:scale-95"
              >
                <Download className="w-4 h-4 text-sky-500" /> 그림 저장하기
              </button>
            </div>
          </div>

          <div className="hidden md:flex text-6xl text-slate-300 font-black px-4">
            VS
          </div>

          {/* AI Guess */}
          <div className="flex flex-col items-center w-full md:w-5/12">
             <div className="bg-white p-8 rounded-3xl shadow-lg border-2 border-indigo-100 flex flex-col items-center justify-center w-full aspect-[4/3] text-center">
                <span className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-2">AI의 추측</span>
                <span className="text-7xl mb-4">🤖</span>
                <p className={`text-4xl font-black break-keep ${isMatch ? 'text-green-500' : 'text-slate-700'}`}>
                  "{aiGuess}"
                </p>
             </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-6 bg-white flex flex-col sm:flex-row justify-center items-center gap-4 border-t-2 border-slate-100">
          <button
            onClick={() => startGame(selectedMenu)}
            className="flex items-center gap-3 bg-sky-500 hover:bg-sky-600 text-white font-black text-2xl px-10 py-5 rounded-full shadow-lg shadow-sky-500/30 transform transition hover:-translate-y-1 active:scale-95 w-full sm:w-auto justify-center"
          >
            <Play className="w-8 h-8 fill-current" /> 다음 문제 내기
          </button>
          
          <button
            onClick={() => setGameState('start')}
            className="flex items-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-lg px-6 py-5 rounded-full shadow-sm transform transition active:scale-95 w-full sm:w-auto justify-center"
          >
            <Home className="w-6 h-6" /> 처음으로
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full h-full min-h-screen font-sans antialiased text-gray-900 bg-slate-100">
      {gameState === 'start' && renderStartScreen()}
      {(gameState === 'playing' || gameState === 'analyzing') && renderGameScreen()}
      {gameState === 'result' && renderResultScreen()}
    </div>
  );
}