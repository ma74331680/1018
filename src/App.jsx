import React, { useState, useRef } from 'react';
import { Upload, Download, Sparkles, Image, RefreshCw, Wand2, X } from 'lucide-react';


export default function StickerGenerator() {
  const [uploadedFace, setUploadedFace] = useState(null);
  const [uploadedPose, setUploadedPose] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [styledImage, setStyledImage] = useState(null);
  const fileFaceRef = useRef(null);
  const filePoseRef = useRef(null);
  const canvasRef = useRef(null);

  // 新增：只允許 jpg / jpeg / png
  const allowedTypes = ['image/png', 'image/jpeg'];
  const validateFile = (file) => {
    if (!file) return false;
    const t = file.type;
    const name = (file.name || '').toLowerCase();
    return allowedTypes.includes(t) || /\.(jpe?g|png)$/.test(name);
  };

  const handleFaceUpload = (e) => {
    const file = e.target.files[0];
    if (!validateFile(file)) {
      alert('只允許上傳 JPG / PNG 格式的 Face 圖片');
      e.target.value = '';
      return;
    }
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedFace(event.target.result);
        setStyledImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePoseUpload = (e) => {
    const file = e.target.files[0];
    if (!validateFile(file)) {
      alert('只允許上傳 JPG / PNG 格式的 Pose 圖片');
      e.target.value = '';
      return;
    }
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedPose(event.target.result);
        setStyledImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // helper to load image as Promise
  const loadImage = (src) =>
    new Promise((res, rej) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => res(img);
      img.onerror = rej;
      img.src = src;
    });

  const applyStyle = async () => {
    if (!uploadedFace) return;
    setProcessing(true);

    try {
      const formData = new FormData();

      // 將 base64 圖片轉為 Blob 並正確命名
      const faceBlob = await fetch(uploadedFace).then(r => r.blob());
      const faceName = `face_${Date.now()}.png`;
      formData.append('face', new File([faceBlob], faceName, { type: 'image/png' }));

      if (uploadedPose) {
        const poseBlob = await fetch(uploadedPose).then(r => r.blob());
        const poseName = `pose_${Date.now()}.png`;
        formData.append('pose', new File([poseBlob], poseName, { type: 'image/png' }));
      }

      // 將檔案上傳到 FastAPI
      const jobsResp = await fetch('http://172.16.17.16:9000/api/jobs', {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: formData
      });

      console.log('jobs response status:', jobsResp.status);
      if (!jobsResp.ok) {
        const text = await jobsResp.text();
        throw new Error(`jobs upload failed: ${jobsResp.status} ${text}`);
      }

      const jobsData = await jobsResp.json();
      console.log('jobs response json:', jobsData);
      const promptId = jobsData.prompt_id || jobsData.promptId || jobsData.prompt_id;
      const clientId = jobsData.client_id || jobsData.clientId || jobsData.client_id;

      if (!promptId || !clientId) {
        throw new Error('no prompt_id or client_id returned from API');
      }

      // 等待 ComfyUI 完成並透過 /wait 直接取得圖片（會 long-poll）
      const waitUrl = `http://172.16.17.16:9000/api/result/${encodeURIComponent(promptId)}/wait?client_id=${encodeURIComponent(clientId)}`;
      const resultResp = await fetch(waitUrl, { method: 'GET' });

      console.log('result wait status:', resultResp.status);
      if (!resultResp.ok) {
        const txt = await resultResp.text();
        throw new Error(`get result failed: ${resultResp.status} ${txt}`);
      }

      const imageBlob = await resultResp.blob();
      const imageUrl = URL.createObjectURL(imageBlob);
      setStyledImage(imageUrl);

    } catch (err) {
      console.error('Error details:', err);
      alert('上傳或取得結果失敗：' + (err.message || err));
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!styledImage) return;
    const link = document.createElement('a');
    link.href = styledImage;
    link.download = `styled-sticker-${Date.now()}.png`;
    link.click();
  };

  const resetAll = () => {
    setUploadedFace(null);
    setUploadedPose(null);
    setStyledImage(null);
    if (fileFaceRef.current) fileFaceRef.current.value = '';
    if (filePoseRef.current) filePoseRef.current.value = '';
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Face upload */}
                <div
                  onClick={() => fileFaceRef.current?.click()}
                  className="relative border-4 border-dashed border-purple-300 rounded-2xl p-6 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50/50 transition-all duration-300 group"
                >
                  {uploadedFace ? (
                    <div className="space-y-4">
                      <div className="relative inline-block">
                        <img
                          src={uploadedFace}
                          alt="Face"
                          className="max-h-36 mx-auto rounded-2xl shadow-lg ring-4 ring-purple-200"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setUploadedFace(null);
                            if (fileFaceRef.current) fileFaceRef.current.value = '';
                            setStyledImage(null);
                          }}
                          className="absolute -top-3 -right-3 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 font-medium">Face 圖片（必填）</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Image className="w-16 h-16 mx-auto text-purple-400 group-hover:scale-110 transition-transform duration-300" />
                      <div>
                        <p className="text-lg font-bold text-gray-700">上傳 Face</p>
                        <p className="text-sm text-gray-500 mt-1">可將人物臉部裁切上傳</p>
                      </div>
                    </div>
                  )}
                  {/* input refs（修改 accept 屬性） */}
                  <input ref={fileFaceRef} type="file" accept="image/png,image/jpeg" onChange={handleFaceUpload} className="hidden" />
                </div>

                {/* Pose upload */}
                <div
                  onClick={() => filePoseRef.current?.click()}
                  className="relative border-4 border-dashed border-purple-300 rounded-2xl p-6 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50/50 transition-all duration-300 group"
                >
                  {uploadedPose ? (
                    <div className="space-y-4">
                      <div className="relative inline-block">
                        <img
                          src={uploadedPose}
                          alt="Pose"
                          className="max-h-36 mx-auto rounded-2xl shadow-lg ring-4 ring-purple-200"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setUploadedPose(null);
                            if (filePoseRef.current) filePoseRef.current.value = '';
                            setStyledImage(null);
                          }}
                          className="absolute -top-3 -right-3 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 font-medium">Pose 圖片（選填）</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Image className="w-16 h-16 mx-auto text-purple-400 group-hover:scale-110 transition-transform duration-300" />
                      <div>
                        <p className="text-lg font-bold text-gray-700">上傳 Pose</p>
                        <p className="text-sm text-gray-500 mt-1">可上傳動作或背景圖作為底圖</p>
                      </div>
                    </div>
                  )}
                  <input ref={filePoseRef} type="file" accept="image/png,image/jpeg" onChange={handlePoseUpload} className="hidden" />
                </div>
              </div>

              {/* 操作按鈕 */}
              <div className="flex gap-5 mt-6">
                <button
                  onClick={applyStyle}
                  disabled={!uploadedFace || processing}
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
                    <p className="text-xl font-semibold text-gray-500">上傳 Face（必要）並生成貼圖後</p>
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
              <p className="text-gray-600">選擇你喜歡的照片上傳（Face 必填）</p>
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
