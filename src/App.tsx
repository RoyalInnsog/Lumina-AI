import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UploadCloud, Wand2, Download, RotateCcw, AlertTriangle, Sparkles, Activity } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const getDynamicPrompt = () => {
  return `Please comprehensively process this uploaded blurry image in one seamless operation: first, act as an advanced AI upscaler to restore and enhance the image into a crystal-clear, ultra-sharp 4K HDR high-definition masterpiece, recovering all lost micro-details like facial features, skin texture, and clothing without altering the subject's core identity. Simultaneously, act as an intelligent inpainting tool to automatically detect and completely remove all distracting background objects, useless photobombers, and visual clutter, replacing those areas with a natural, aesthetically pleasing background that perfectly matches the original depth of field. Finally, apply a professional cinematic color grade and studio-quality lighting setup, balancing the exposure, enriching the tones with a vibrant yet natural color palette, and applying finishing touches like subtle vignetting and sharpening to make the final image highly engaging, visually striking, and completely ready to go viral on social media.

CRITICAL INSTRUCTION FOR MALE SUBJECTS: If the subject is male, apply an extremely subtle physical enhancement. Very slightly reduce body fat and provide a minimal, natural-looking muscle pump (like right after a gym session). This change must be so subtle that it perfectly preserves the person's true personality and identity without looking "aged by AI".

CRITICAL INSTRUCTION FOR SKIN RETOUCHING: If the subject has excessive pimples, acne marks, or blemishes, carefully heal and clear these specific patches. DO NOT over-smooth or airbrush the skin. You MUST preserve the natural skin texture, pores, and realism so the result looks completely authentic and not fake or plastic.`;
};

const PROCESSING_STEPS = [
  "Initializing neural pathways...",
  "Analyzing facial structure & micro-details...",
  "Healing skin textures & preserving realism...",
  "Applying intelligent background inpainting...",
  "Calibrating natural lighting & exposure...",
  "Enhancing physical attributes (subtle)...",
  "Finalizing 4K HDR masterpiece..."
];

const CompareSlider = ({ before, after }: { before: string; after: string }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (event: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const x = 'touches' in event ? event.touches[0].clientX : (event as React.MouseEvent).clientX;
    const position = ((x - containerRect.left) / containerRect.width) * 100;
    setSliderPosition(Math.min(Math.max(position, 0), 100));
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-[4/3] md:aspect-[16/9] rounded-2xl overflow-hidden cursor-ew-resize select-none shadow-[0_0_50px_rgba(0,0,0,0.5)] ring-1 ring-white/10 bg-[#0a0a0a]"
      onMouseMove={(e) => e.buttons === 1 && handleMove(e)}
      onTouchMove={handleMove}
      onMouseDown={handleMove}
    >
      <img src={after} alt="After" className="absolute inset-0 w-full h-full object-contain" draggable={false} />
      <div 
        className="absolute inset-0 w-full h-full overflow-hidden border-r-2 border-cyan-400 shadow-[2px_0_20px_rgba(34,211,238,0.5)]"
        style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
      >
        <img src={before} alt="Before" className="absolute inset-0 w-full h-full object-contain" draggable={false} />
      </div>
      <div 
        className="absolute top-0 bottom-0 w-1 bg-cyan-400 z-10 shadow-[0_0_15px_rgba(34,211,238,0.8)]"
        style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-gray-900/80 backdrop-blur-md border-2 border-cyan-400 rounded-full shadow-[0_0_20px_rgba(34,211,238,0.4)] flex items-center justify-center">
          <div className="flex gap-1.5">
            <div className="w-0.5 h-5 bg-cyan-400 rounded-full" />
            <div className="w-0.5 h-5 bg-cyan-400 rounded-full" />
          </div>
        </div>
      </div>
      <div className="absolute top-6 left-6 px-4 py-1.5 bg-black/60 backdrop-blur-md rounded-full text-xs font-bold tracking-widest uppercase text-white/90 border border-white/10 shadow-lg">Original</div>
      <div className="absolute top-6 right-6 px-4 py-1.5 bg-cyan-500/20 backdrop-blur-md rounded-full text-xs font-bold tracking-widest uppercase text-cyan-300 border border-cyan-500/30 shadow-lg">Enhanced</div>
    </div>
  );
};

export default function App() {
  const [selectedImage, setSelectedImage] = useState<{ url: string; file: File } | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isProcessing) {
      interval = setInterval(() => {
        setStepIndex((prev) => Math.min(prev + 1, PROCESSING_STEPS.length - 1));
      }, 2500);
    } else {
      setStepIndex(0);
    }
    return () => clearInterval(interval);
  }, [isProcessing]);

  // Cleanup object URL to prevent memory leaks
  useEffect(() => {
    return () => {
      if (selectedImage?.url) {
        URL.revokeObjectURL(selectedImage.url);
      }
    };
  }, [selectedImage]);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (JPEG, PNG, etc).');
      return;
    }
    try {
      const url = URL.createObjectURL(file);
      setSelectedImage({ url, file });
      setProcessedImage(null);
      setError(null);
    } catch (err) {
      setError('Failed to load the image. Please try another file.');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset input so the same file can be selected again if needed
    if (e.target) e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const processImage = async () => {
    if (!selectedImage) return;
    setIsProcessing(true);
    setError(null);
    setStepIndex(0);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(selectedImage.file);
      
      const base64Data = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
      });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: selectedImage.file.type,
              },
            },
            {
              text: getDynamicPrompt(),
            },
          ],
        },
      });

      let foundImage = false;
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          const imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
          setProcessedImage(imageUrl);
          foundImage = true;
          break;
        }
      }

      if (!foundImage) {
        throw new Error("The AI model did not return an image. Please try again.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during processing.");
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setSelectedImage(null);
    setProcessedImage(null);
    setError(null);
  };

  const downloadImage = () => {
    if (!processedImage) return;
    const a = document.createElement('a');
    a.href = processedImage;
    a.download = `lumina-masterpiece-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen bg-[#030305] text-white font-sans selection:bg-cyan-500/30 relative overflow-x-hidden flex flex-col">
      
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Deep Atmospheric Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15], rotate: [0, 90, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-indigo-900/30 blur-[120px]"
        />
        <motion.div 
          animate={{ scale: [1, 1.5, 1], opacity: [0.1, 0.25, 0.1], rotate: [0, -90, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-[20%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-cyan-900/20 blur-[120px]"
        />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] opacity-20 mix-blend-overlay" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12 min-h-screen flex flex-col items-center justify-center">
        
        {/* Header */}
        <motion.div 
          layout
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", bounce: 0, duration: 1 }}
          className="text-center mb-12 w-full max-w-3xl"
        >
          <motion.div layout className="inline-flex items-center justify-center px-4 py-1.5 mb-8 rounded-full border border-white/10 bg-white/5 backdrop-blur-md shadow-[0_0_20px_rgba(255,255,255,0.05)]">
            <Sparkles className="w-4 h-4 mr-2 text-cyan-400" />
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-white/80">Lumina Engine v3.0</span>
          </motion.div>
          <motion.h1 layout className="text-5xl md:text-7xl font-light tracking-tighter mb-6 leading-tight">
            Neural Image <br/>
            <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400">
              Synthesis
            </span>
          </motion.h1>
          <motion.p layout className="text-lg text-white/50 font-light max-w-2xl mx-auto leading-relaxed">
            Harness the power of advanced AI to reconstruct, inpaint, and color-grade your images into breathtaking cinematic masterpieces.
          </motion.p>
        </motion.div>

        {/* Main Interface */}
        <motion.div layout className="w-full max-w-5xl flex flex-col items-center">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                layout
                initial={{ opacity: 0, height: 0, scale: 0.9 }}
                animate={{ opacity: 1, height: 'auto', scale: 1 }}
                exit={{ opacity: 0, height: 0, scale: 0.9 }}
                transition={{ type: "spring", bounce: 0, duration: 0.6 }}
                className="mb-8 overflow-hidden w-full max-w-2xl"
              >
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-start backdrop-blur-md shadow-[0_0_30px_rgba(239,68,68,0.15)]">
                  <AlertTriangle className="w-5 h-5 text-red-400 mr-3 flex-shrink-0 mt-0.5" />
                  <p className="text-red-200 text-sm leading-relaxed">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {!selectedImage ? (
              <motion.div
                layout
                key="upload-zone"
                initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                transition={{ type: "spring", bounce: 0, duration: 0.8 }}
                className="w-full max-w-3xl"
              >
                <motion.div 
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`relative group cursor-pointer rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden transition-all duration-500
                    ${isDragging ? 'border-cyan-500/50 shadow-[0_0_50px_rgba(34,211,238,0.2)]' : 'hover:border-white/20 hover:bg-white/10 hover:shadow-[0_0_40px_rgba(255,255,255,0.05)]'}
                  `}
                >
                  {/* Animated border gradient on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
                    <div className="absolute inset-[-1px] rounded-[2rem] bg-gradient-to-r from-cyan-500/30 via-purple-500/30 to-pink-500/30 blur-sm z-0" />
                  </div>

                  <div className="relative z-10 px-8 py-32 flex flex-col items-center justify-center text-center">
                    <motion.div 
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="w-24 h-24 mb-8 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border border-white/10 flex items-center justify-center shadow-2xl relative"
                    >
                      <div className="absolute inset-0 rounded-full bg-cyan-400/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <UploadCloud className="w-10 h-10 text-white/80 relative z-10" strokeWidth={1.5} />
                    </motion.div>
                    <h3 className="text-3xl font-light mb-3 tracking-tight">Initialize Sequence</h3>
                    <p className="text-white/40 text-lg font-light max-w-md">
                      Drag and drop your media here, or click to browse your encrypted local storage.
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                layout
                key="preview-zone"
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -40, scale: 0.95 }}
                transition={{ type: "spring", bounce: 0, duration: 0.8 }}
                className="w-full flex flex-col items-center"
              >
                {processedImage ? (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, filter: "blur(10px)" }}
                    animate={{ opacity: 1, filter: "blur(0px)" }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="w-full flex flex-col items-center space-y-10"
                  >
                    <CompareSlider before={selectedImage.url} after={processedImage} />
                    
                    <motion.div layout className="flex flex-wrap items-center justify-center gap-6">
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={downloadImage}
                        className="group relative flex items-center px-8 py-4 rounded-full bg-white text-black font-semibold tracking-wide transition-all duration-300 shadow-[0_0_30px_rgba(255,255,255,0.3)]"
                      >
                        <Download className="w-5 h-5 mr-3 group-hover:-translate-y-1 transition-transform" />
                        Extract Masterpiece
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={reset}
                        className="group flex items-center px-8 py-4 rounded-full bg-white/5 text-white/80 font-medium tracking-wide hover:bg-white/10 hover:text-white transition-all duration-300 border border-white/10 backdrop-blur-md"
                      >
                        <RotateCcw className="w-5 h-5 mr-3 group-hover:-rotate-180 transition-transform duration-500" />
                        Process New
                      </motion.button>
                    </motion.div>
                  </motion.div>
                ) : (
                  <motion.div layout className="w-full flex flex-col items-center">
                    <motion.div layout className="relative w-full max-w-4xl aspect-[4/3] md:aspect-[16/9] rounded-2xl overflow-hidden mb-10 shadow-[0_0_50px_rgba(0,0,0,0.5)] ring-1 ring-white/10 bg-[#0a0a0a]">
                      <motion.img 
                        layout
                        src={selectedImage.url} 
                        alt="Selected" 
                        className={`w-full h-full object-contain transition-all duration-1000 ${isProcessing ? 'opacity-40 scale-105 blur-sm' : 'opacity-100 scale-100'}`} 
                        onError={() => setError('Failed to render image preview.')}
                      />
                      
                      <AnimatePresence>
                        {isProcessing && (
                          <motion.div 
                            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                            animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
                            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                            transition={{ duration: 0.8, ease: "easeInOut" }}
                            className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/40"
                          >
                          {/* Complex Loader */}
                          <div className="relative w-32 h-32 mb-8 flex items-center justify-center">
                            <motion.div 
                              animate={{ rotate: 360 }} 
                              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                              className="absolute inset-0 rounded-full border-t-2 border-cyan-400/80 border-r-2 border-transparent opacity-70"
                            />
                            <motion.div 
                              animate={{ rotate: -360 }} 
                              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                              className="absolute inset-2 rounded-full border-b-2 border-purple-400/80 border-l-2 border-transparent opacity-70"
                            />
                            <motion.div 
                              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} 
                              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                              className="absolute inset-0 flex items-center justify-center"
                            >
                              <Activity className="w-10 h-10 text-cyan-300 drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]" />
                            </motion.div>
                          </div>

                          {/* Cycling Text */}
                          <div className="h-8 relative w-full max-w-md overflow-hidden flex justify-center">
                            <AnimatePresence mode="wait">
                              <motion.div
                                key={stepIndex}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.5 }}
                                className="absolute text-cyan-300 font-mono text-sm tracking-wider uppercase text-center drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                              >
                                {PROCESSING_STEPS[stepIndex]}
                              </motion.div>
                            </AnimatePresence>
                          </div>
                          
                          {/* Scanning Laser */}
                          <motion.div 
                            className="absolute left-0 right-0 h-0.5 bg-cyan-400 shadow-[0_0_20px_4px_rgba(34,211,238,0.6)] z-30"
                            animate={{ top: ['0%', '100%', '0%'] }}
                            transition={{ duration: 4, ease: "linear", repeat: Infinity }}
                          />
                        </motion.div>
                      )}
                      </AnimatePresence>
                    </motion.div>

                    <AnimatePresence>
                      {!isProcessing && (
                        <motion.div 
                          layout
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 20, scale: 0.9 }}
                          transition={{ type: "spring", bounce: 0, duration: 0.6 }}
                          className="flex flex-wrap items-center justify-center gap-6"
                        >
                          <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={processImage}
                            className="group relative flex items-center px-10 py-5 rounded-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500 text-white font-semibold tracking-wide hover:shadow-[0_0_40px_rgba(99,102,241,0.5)] transition-all duration-300 overflow-hidden"
                          >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                            <Wand2 className="w-5 h-5 mr-3 relative z-10 group-hover:rotate-12 transition-transform" />
                            <span className="relative z-10">Commence Synthesis</span>
                          </motion.button>
                          <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={reset}
                            className="flex items-center px-8 py-5 rounded-full bg-white/5 text-white/60 font-medium tracking-wide hover:bg-white/10 hover:text-white transition-colors border border-white/5 backdrop-blur-sm"
                          >
                            Abort
                          </motion.button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
