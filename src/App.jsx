import React, { useState, useRef } from 'react';
import { Upload, Download, Sparkles, Image, RefreshCw, Wand2, X } from 'lucide-react';


export default function StickerGenerator() {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [styledImage, setStyledImage] = useState(null);
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target.result);
        setStyledImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const applyStyle = () => {
    if (!uploadedImage) return;
    setProcessing(true);

    setTimeout(() => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = document.createElement('img');

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;

        ctx.filter = 'contrast(1.2) saturate(1.4) brightness(1.05)';
        ctx.drawImage(img, 0, 0);

        const roundedCanvas = document.createElement('canvas');
        const roundedCtx = roundedCanvas.getContext('2d');
        roundedCanvas.width = canvas.width;
        roundedCanvas.height = canvas.height;

        const radius = Math.min(canvas.width, canvas.height) * 0.1;
        roundedCtx.beginPath();
        roundedCtx.moveTo(radius, 0);
        roundedCtx.lineTo(canvas.width - radius, 0);
        roundedCtx.quadraticCurveTo(canvas.width, 0, canvas.width, radius);
        roundedCtx.lineTo(canvas.width, canvas.height - radius);
        roundedCtx.quadraticCurveTo(canvas.width, canvas.height, canvas.width - radius, canvas.height);
        roundedCtx.lineTo(radius, canvas.height);
        roundedCtx.quadraticCurveTo(0, canvas.height, 0, canvas.height - radius);
        roundedCtx.lineTo(0, radius);
        roundedCtx.quadraticCurveTo(0, 0, radius, 0);
        roundedCtx.closePath();
        roundedCtx.clip();
        roundedCtx.drawImage(canvas, 0, 0);

        setStyledImage(roundedCanvas.toDataURL());
        setProcessing(false);
      };

      img.src = uploadedImage;
    }, 1000);
  };

  const handleDownload = () => {
    if (!styledImage) return;
    const link = document.createElement('a');
    link.href = styledImage;
    link.download = `styled-sticker-${Date.now()}.png`;
    link.click();
  };

  const resetAll = () => {
    setUploadedImage(null);
    setStyledImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-start bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 relative overflow-hidden">
      {/* 裝飾性背景元素 */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
      <div className="absolute top-40 right-20 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
      <div className="absolute -bottom-20 left-1/2 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>

      <canvas ref={canvasRef} className="hidden" />

      {/* 主要內容容器（水平置中） */}
      <div className="w-full max-w-6xl py-8 px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-12 mx-auto">
          <div className="inline-block animate-bounce mb-4">
            <Wand2 className="w-16 h-16 text-purple-600 mx-auto" />
          </div>
          <h1 className="text-6xl font-extrabold mb-4 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
            風格貼圖生成器
          </h1>
          <p className="text-gray-700 text-xl font-medium">✨ 讓你的照片變得與眾不同 ✨</p>
        </div>

        {/* 上傳 + 預覽區 */}
        <div className="grid lg:grid-cols-2 gap-10 mb-12 mx-auto">
          {/* 左側：上傳 */}
          <div className="space-y-8">
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-purple-100 hover:shadow-purple-200 transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                  <Upload className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">上傳照片</h2>
              </div>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative border-4 border-dashed border-purple-300 rounded-2xl p-16 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50/50 transition-all duration-300 group"
              >
                {uploadedImage ? (
                  <div className="space-y-4">
                    <div className="relative inline-block">
                      <img
                        src={uploadedImage}
                        alt="Uploaded"
                        className="max-h-56 mx-auto rounded-2xl shadow-lg ring-4 ring-purple-200"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          resetAll();
                        }}
                        className="absolute -top-3 -right-3 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 font-medium">點擊重新上傳</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="relative">
                      <Image className="w-20 h-20 mx-auto text-purple-400 group-hover:scale-110 transition-transform duration-300" />
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-pink-500 rounded-full animate-ping"></div>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-gray-700">點擊或拖拽上傳圖片</p>
                      <p className="text-base text-gray-500 mt-3">支持 JPG、PNG 格式</p>
                    </div>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            {/* 操作按鈕 */}
            <div className="flex gap-5">
              <button
                onClick={applyStyle}
                disabled={!uploadedImage || processing}
                className="flex-1 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white py-5 rounded-2xl font-bold text-xl shadow-2xl hover:shadow-purple-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-3 transform hover:scale-105 disabled:hover:scale-100"
              >
                {processing ? (
                  <>
                    <RefreshCw className="w-6 h-6 animate-spin" />
                    魔法處理中...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-6 h-6" />
                    生成貼圖
                  </>
                )}
              </button>

              <button
                onClick={resetAll}
                className="px-8 py-5 bg-gradient-to-r from-gray-200 to-gray-300 text-gray-800 rounded-2xl font-bold hover:from-gray-300 hover:to-gray-400 transition-all duration-300 shadow-lg transform hover:scale-105"
              >
                重置
              </button>
            </div>
          </div>

          {/* 右側：預覽 */}
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-blue-100 hover:shadow-blue-200 transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl">
                <Image className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">預覽結果</h2>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-10 min-h-[500px] flex items-center justify-center border-2 border-gray-200">
              {styledImage ? (
                <div className="space-y-8 w-full">
                  <div className="relative group">
                    <img
                      src={styledImage}
                      alt="Styled"
                      className="max-w-full max-h-96 mx-auto rounded-2xl shadow-2xl ring-4 ring-purple-200 transform group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>

                  <button
                    onClick={handleDownload}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-5 rounded-2xl font-bold text-xl shadow-2xl hover:shadow-blue-300 transition-all duration-300 flex items-center justify-center gap-3 transform hover:scale-105"
                  >
                    <Download className="w-6 h-6" />
                    下載貼圖
                  </button>
                </div>
              ) : (
                <div className="text-center text-gray-400 space-y-6">
                  <div className="relative inline-block">
                    <Image className="w-32 h-32 mx-auto opacity-30" />
                    <Sparkles className="w-12 h-12 absolute -top-4 -right-4 text-purple-400 animate-pulse" />
                  </div>
                  <div>
                    <p className="text-xl font-semibold text-gray-500">上傳照片並生成貼圖後</p>
                    <p className="text-xl font-semibold text-gray-500">精彩預覽將顯示在這裡</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 使用說明 */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-10 border border-purple-100 mx-auto">
          <h3 className="text-3xl font-bold mb-10 text-center bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            🎯 使用說明
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-4 group">
              <div className="relative inline-block">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                  <span className="text-4xl font-bold text-white">1</span>
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-pink-500 rounded-full animate-bounce"></div>
              </div>
              <h4 className="font-bold text-xl text-gray-800">上傳照片</h4>
              <p className="text-gray-600">選擇你喜歡的照片上傳</p>
            </div>
            <div className="text-center space-y-4 group">
              <div className="relative inline-block">
                <div className="w-20 h-20 bg-gradient-to-br from-pink-400 to-pink-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                  <span className="text-4xl font-bold text-white">2</span>
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-purple-500 rounded-full animate-bounce"></div>
              </div>
              <h4 className="font-bold text-xl text-gray-800">生成貼圖</h4>
              <p className="text-gray-600">點擊按鈕生成風格貼圖</p>
            </div>
            <div className="text-center space-y-4 group">
              <div className="relative inline-block">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                  <span className="text-4xl font-bold text-white">3</span>
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full animate-bounce"></div>
              </div>
              <h4 className="font-bold text-xl text-gray-800">下載作品</h4>
              <p className="text-gray-600">下載你的專屬貼圖</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
