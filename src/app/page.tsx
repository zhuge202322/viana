// @ts-nocheck
"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import html2canvas from 'html2canvas';

// 动态引入 3D 画布组件，避免 SSR 报错
const BraceletCanvas = dynamic(() => import('@/components/BraceletCanvas'), { ssr: false });
const Sidebar = dynamic(() => import('@/components/Sidebar'), { ssr: false });

export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [selectedBeads, setSelectedBeads] = useState<any[]>([]);
  const [targetLengthCm, setTargetLengthCm] = useState(16); // 默认手串长度为 16cm
  const [genderTab, setGenderTab] = useState('female'); // 手围推荐性别分类
  const [selectedString, setSelectedString] = useState({ id: 'string_black', name: 'Black String', color: '#333333', price: 1.00 }); // 手绳选择
  
  const [resetCamTrigger, setResetCamTrigger] = useState(0); // 用于触发相机重置
  const [showPreviewModal, setShowPreviewModal] = useState(false); // 控制预览弹窗
  const [previewImageUrl, setPreviewImageUrl] = useState(""); // 保存的 3D 截图
  const [mobileTab, setMobileTab] = useState('settings'); // 移动端选项卡默认：'settings'

  useEffect(() => {
    // 从 public 目录加载我们爬取到的 JSON 数据
    fetch('/temp_data.json')
      .then(res => res.json())
      .then(json => {
        setProducts(json.data || []);
      })
      .catch(err => console.error("Failed to load data", err));
  }, []);

  // 计算统计数据
  const stats = selectedBeads.reduce((acc, bead) => {
    acc.count += 1;
    acc.weight += parseFloat(bead.weight || 0);
    acc.price += parseFloat(bead.price || 0);
    // 假设每个珠子的 size 字段表示其直径毫米数 (mm)
    acc.currentLengthMm += parseFloat(bead.size || 10);
    return acc;
  }, { count: 0, weight: 0, price: selectedString.price, currentLengthMm: 0 }); // 初始价格加上手绳的 1 元

  const currentLengthCm = stats.currentLengthMm / 10;

  const addBead = (bead) => {
    // 获取即将添加的这颗珠子的长度 (mm)
    const beadSizeMm = parseFloat(bead.size || 10);
    
    // 计算如果添加这颗珠子后，总长度会是多少 (mm)
    const newTotalLengthMm = stats.currentLengthMm + beadSizeMm;
    
    // 目标长度 (mm) = cm * 10
    const targetLengthMm = targetLengthCm * 10;
    
    // 允许的最大冗余长度 (5mm = 0.5cm)
    const maxAllowedLengthMm = targetLengthMm + 5;

    // 只有当添加后的长度超过了 (目标长度 + 0.5cm 冗余) 时，才阻止添加
    if (newTotalLengthMm > maxAllowedLengthMm) {
      alert(`The target wrist size is ${targetLengthCm}cm, with a maximum allowance of ${(maxAllowedLengthMm / 10).toFixed(1)}cm.\nAdding this bead will exceed the maximum length!`);
      return;
    }

    setSelectedBeads(prev => [...prev, { ...bead, uniqueId: Math.random().toString(36).substring(7) }]);
  };

  const removeBead = (index) => {
    setSelectedBeads(prev => prev.filter((_, i) => i !== index));
  };

  const reorderBeads = (newBeads) => {
    setSelectedBeads(newBeads);
  };

  const clearBeads = () => {
    setSelectedBeads([]);
  };

  // 生成预览清单数据 (按珠子 ID 分组统计数量)
  const getBOMList = () => {
    // 强制加入手绳作为第一个配件
    const baseList = [{
      name: selectedString.name,
      count: 1,
      price: selectedString.price
    }];

    const grouped = selectedBeads.reduce((acc, bead) => {
      if (!acc[bead.id]) {
        acc[bead.id] = { name: bead.name || 'Unknown Bead', count: 0, price: parseFloat(bead.price || 0) };
      }
      acc[bead.id].count += 1;
      return acc;
    }, {});
    
    return [...baseList, ...Object.values(grouped)];
  };

  // 点击“完成设计”：重置相机 -> 截图 -> 弹窗
  const handleCompleteDesign = () => {
    if (selectedBeads.length === 0) {
      alert("Please add some beads first!");
      return;
    }
    
    // 1. 触发相机复位
    setResetCamTrigger(prev => prev + 1);
    
    // 2. 等待动画和渲染完成，截取 3D 画布内容
    setTimeout(() => {
      const canvas = document.querySelector('canvas');
      if (canvas) {
        setPreviewImageUrl(canvas.toDataURL('image/png'));
        setShowPreviewModal(true);
      }
    }, 500); // 给物理动画留一点复位的时间
  };

  // 下载合成的分享卡片
  const handleSaveCard = () => {
    const node = document.getElementById('preview-card');
    if (!node) return;
    
    // 稍微延迟确保 DOM 渲染完毕
    setTimeout(async () => {
      try {
        const canvas = await html2canvas(node, { 
          scale: 2, 
          backgroundColor: '#ffffff',
          useCORS: true,
          logging: false
        });
        const link = document.createElement('a');
        link.download = `DIY_Bracelet_Design_${new Date().getTime()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } catch (err) {
        console.error("Failed to generate image:", err);
        alert("Failed to save image. Please try again.");
      }
    }, 100);
  };

  const femaleSizes = [
    { cm: 14, desc: 'Petite' },
    { cm: 15, desc: 'Petite' },
    { cm: 16, desc: 'Slim Female' },
    { cm: 17, desc: 'Standard Female' },
    { cm: 18, desc: 'Loose Fit' },
    { cm: 19, desc: 'Large Female' },
  ];

  const maleSizes = [
    { cm: 16, desc: 'Slim Male' },
    { cm: 17, desc: 'Slim Male' },
    { cm: 18, desc: 'Standard Male' },
    { cm: 19, desc: 'Standard Fit' },
    { cm: 20, desc: 'Loose Fit' },
    { cm: 21, desc: 'Large Male' },
  ];

  const activeSizes = genderTab === 'female' ? femaleSizes : maleSizes;

  // 手绳选项配置
  const stringOptions = [
    { id: 'string_transparent', name: 'Transparent String', color: '#e5e7eb', price: 1.00 },
    { id: 'string_black', name: 'Black String', color: '#333333', price: 1.00 },
    { id: 'string_red', name: 'Red String', color: '#dc2626', price: 1.00 },
    { id: 'string_green', name: 'Green String', color: '#16a34a', price: 1.00 },
    { id: 'string_blue', name: 'Blue String', color: '#2563eb', price: 1.00 },
  ];

  // 提取控制面板组件以避免代码重复
  const ControlPanel = () => (
    <>
      <h2 className="font-bold text-lg xl:text-xl mb-3 xl:mb-4 text-gray-800 flex items-center gap-2">
        <span className="w-1.5 h-4 xl:h-5 bg-red-500 rounded-full inline-block"></span>
        My DIY Bracelet
      </h2>
      
      {/* 统计数据 */}
      <div className="space-y-2 xl:space-y-2.5 mb-4 xl:mb-5 bg-gray-50/50 p-3 xl:p-3.5 rounded-xl border border-gray-100">
        <div className="flex justify-between text-xs xl:text-sm">
          <span className="text-gray-500">Current Length:</span> 
          <span className={`font-bold ${currentLengthCm > targetLengthCm ? 'text-orange-500' : 'text-gray-800'}`}>
            {currentLengthCm.toFixed(1)} <span className="text-gray-400 font-normal">/ {targetLengthCm} cm</span>
          </span>
        </div>
        <div className="flex justify-between text-xs xl:text-sm">
          <span className="text-gray-500">Bead Count:</span> 
          <span className="font-bold text-gray-800">{stats.count} <span className="text-gray-400 font-normal text-[10px] xl:text-xs">pcs</span></span>
        </div>
        <div className="flex justify-between text-xs xl:text-sm">
          <span className="text-gray-500">Est. Weight:</span> 
          <span className="font-bold text-gray-800">{stats.weight.toFixed(2)} <span className="text-gray-400 font-normal text-[10px] xl:text-xs">g</span></span>
        </div>
        <div className="flex justify-between items-end mt-1.5 xl:mt-2 pt-2 xl:pt-3 border-t border-gray-200/60">
          <span className="text-xs xl:text-sm text-gray-500 mb-0.5">Est. Total:</span> 
          <span className="font-bold text-red-500 text-xl xl:text-2xl leading-none"><span className="text-sm xl:text-base mr-0.5">$</span>{stats.price.toFixed(2)}</span>
        </div>
      </div>

      {/* 手围设置区域 */}
      <div className="mt-4 xl:mt-6">
        <h3 className="font-semibold text-gray-800 mb-2 xl:mb-3 text-xs xl:text-sm">Target Wrist Size</h3>
        
        {/* 性别切换 Tab */}
        <div className="flex p-1 bg-gray-100/80 rounded-lg mb-3 xl:mb-4">
          <button 
            onClick={() => setGenderTab('female')}
            className={`flex-1 py-1 xl:py-1.5 text-xs xl:text-sm font-medium rounded-md transition-all duration-200 ${genderTab === 'female' ? 'bg-white text-red-500 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            For Her
          </button>
          <button 
            onClick={() => setGenderTab('male')}
            className={`flex-1 py-1 xl:py-1.5 text-xs xl:text-sm font-medium rounded-md transition-all duration-200 ${genderTab === 'male' ? 'bg-white text-blue-500 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            For Him
          </button>
        </div>

        {/* 尺寸网格 */}
        <div className="grid grid-cols-3 xl:grid-cols-2 gap-2 xl:gap-2.5">
          {activeSizes.map((size) => {
            const isSelected = targetLengthCm === size.cm;
            return (
              <button
                key={size.cm}
                onClick={() => setTargetLengthCm(size.cm)}
                className={`flex flex-col items-center justify-center py-1.5 xl:py-2.5 px-1 rounded-lg xl:rounded-xl border-2 transition-all duration-200 ${
                  isSelected 
                    ? 'border-red-400 bg-red-50/50 shadow-[0_2px_10px_rgba(239,68,68,0.1)]' 
                    : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
                }`}
              >
                <span className={`text-base xl:text-lg font-bold leading-tight ${isSelected ? 'text-red-500' : 'text-gray-800'}`}>
                  {size.cm} <span className="text-[10px] xl:text-xs font-normal opacity-70">cm</span>
                </span>
                <span className={`text-[9px] xl:text-[11px] mt-0.5 ${isSelected ? 'text-red-400 font-medium' : 'text-gray-400'}`}>
                  {size.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 手绳选择区域 */}
      <div className="mt-4 xl:mt-6">
        <h3 className="font-semibold text-gray-800 mb-2 xl:mb-3 text-xs xl:text-sm">Select String Color</h3>
        <div className="flex gap-2 xl:gap-3">
          {stringOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setSelectedString(opt)}
              className={`w-6 h-6 xl:w-8 xl:h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                selectedString.id === opt.id ? 'border-red-500 scale-110 shadow-sm' : 'border-transparent hover:scale-105'
              }`}
              title={`${opt.name} ($${opt.price})`}
            >
              <div 
                className="w-4 h-4 xl:w-6 xl:h-6 rounded-full shadow-inner border border-black/5" 
                style={{ backgroundColor: opt.color }}
              ></div>
            </button>
          ))}
        </div>
      </div>
      
      <div className="mt-4 xl:mt-6 pt-3 xl:pt-4 border-t border-gray-100 text-center">
        <p className="text-[10px] xl:text-[11px] text-gray-400 flex items-center justify-center gap-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path><path d="M12 8v4l3 3"></path></svg>
          Hint: Drag to rotate 360°, scroll to zoom
        </p>
        
        {/* 联系客服按钮 */}
        <button 
          onClick={() => window.open('https://wa.me/', '_blank')}
          className="w-full mt-3 xl:mt-4 py-2.5 xl:py-3 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-xl shadow-[0_4px_15px_rgba(239,68,68,0.3)] transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          Contact Support
        </button>
      </div>
    </>
  );

  return (
    <main className="flex flex-col xl:flex-row h-[100dvh] w-full overflow-hidden bg-gray-50 text-gray-800">
      
      {/* 左侧/上方 3D 画布区域 */}
      <div className="relative w-full h-[40vh] md:h-[45vh] xl:h-full xl:flex-1 shrink-0">
        {/* 桌面端 左侧浮动控制面板 */}
        <div className="hidden xl:block absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-md p-5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-[320px] max-h-[calc(100vh-32px)] overflow-y-auto custom-scrollbar border border-gray-100">
          <ControlPanel />
        </div>

        {/* 3D 渲染组件 */}
        <BraceletCanvas 
          beads={selectedBeads} 
          onRemoveBead={removeBead} 
          onReorderBeads={reorderBeads} 
          resetCamTrigger={resetCamTrigger}
          stringColor={selectedString.color}
        />
      </div>

      {/* 右侧/下方 区域 (控制面板移动端 + 商品选择) */}
      <div className="flex-1 xl:flex-none flex flex-col xl:w-[420px] w-full bg-white xl:shadow-[-4px_0_15px_rgba(0,0,0,0.03)] z-10 overflow-hidden">
        
        {/* 移动端/平板 选项卡切换 */}
        <div className="xl:hidden flex w-full border-b border-gray-100 bg-gray-50/80 shrink-0">
          <button 
            onClick={() => setMobileTab('settings')}
            className={`flex-1 py-3 text-sm font-bold transition-colors relative ${mobileTab === 'settings' ? 'text-red-500' : 'text-gray-500'}`}
          >
            Size & String
            {mobileTab === 'settings' && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-red-500 rounded-t-md"></span>}
          </button>
          <button 
            onClick={() => setMobileTab('products')}
            className={`flex-1 py-3 text-sm font-bold transition-colors relative ${mobileTab === 'products' ? 'text-red-500' : 'text-gray-500'}`}
          >
            Add Beads
            {mobileTab === 'products' && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-red-500 rounded-t-md"></span>}
          </button>
        </div>

        {/* 移动端 控制面板 (通过 Tab 切换) */}
        <div className={`xl:hidden w-full p-4 overflow-y-auto custom-scrollbar bg-white flex-1 ${mobileTab === 'settings' ? 'block' : 'hidden'}`}>
          <ControlPanel />
        </div>

        {/* 商品选择区域 */}
        <div className={`flex-1 flex flex-col overflow-hidden xl:block ${mobileTab === 'products' ? 'block' : 'hidden'}`}>
          <Sidebar products={products} onAddBead={addBead} onClear={clearBeads} onCompleteDesign={handleCompleteDesign} />
        </div>
      </div>

      {/* 预览卡片弹窗 */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-gray-100 w-full max-w-[380px] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
            
            {/* 滚动容器 */}
            <div className="flex flex-col overflow-y-auto custom-scrollbar relative" style={{ backgroundColor: '#fcfbf9' }}>
              {/* 需要被截图的 DOM 区域，让它的高度自然撑开，而不是被限制在滚动区域内 */}
              {/* 修复 html2canvas 不支持 lab() 颜色的问题，强制使用 hex/rgb 颜色，并移除所有包含颜色的 Tailwind 类（如 shadow, border, divide-y 等） */}
              <div id="preview-card" className="flex flex-col relative w-full" style={{ backgroundColor: '#fcfbf9', color: '#333333' }}>
                
                {/* 顶部图片区域 - 放大尺寸，去除边距 */}
                <div className="w-full relative flex items-center justify-center pb-4 pt-2" style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #f3f4f6' }}>
                  {previewImageUrl ? (
                    <img src={previewImageUrl} alt="DIY Bracelet" className="w-full h-auto object-cover" />
                  ) : (
                    <div className="h-64 flex items-center justify-center" style={{ color: '#9ca3af' }}>Generating...</div>
                  )}
                  <div className="absolute top-4 right-4 text-xs px-3 py-1.5 rounded-full z-10" style={{ backgroundColor: 'rgba(255,255,255,0.9)', color: '#333', fontWeight: 'bold', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
                    Exclusive DIY Design
                  </div>
                </div>

                <div className="p-5 pt-6">
                  <h2 className="text-xl font-bold mb-5" style={{ color: '#1f2937' }}>My Custom Bracelet</h2>
                  
                  {/* 规格摘要 */}
                  <div className="rounded-xl p-4 mb-5 space-y-2" style={{ backgroundColor: '#ffffff', border: '1px solid #f3f4f6', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
                    <div className="flex justify-between items-center text-sm">
                      <span style={{ color: '#6b7280' }}>Target Size</span>
                      <span className="font-bold" style={{ color: '#1f2937' }}>{targetLengthCm} cm</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span style={{ color: '#6b7280' }}>Est. Total</span>
                      <span className="font-bold text-lg" style={{ color: '#751113' }}>${stats.price.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* 引导分享 */}
                  <div className="px-4 py-3 rounded-lg text-sm font-medium flex items-center justify-between mb-5" style={{ backgroundColor: '#fef2f2', color: '#751113', border: '1px solid #fee2e2' }}>
                    <span>Save your configuration and send it to our support to place an order.</span>
                  </div>

                  {/* 配件清单 (BOM) */}
                  <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#ffffff', border: '1px solid #f3f4f6', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
                    <div className="px-4 py-2.5 flex justify-between text-xs font-medium" style={{ backgroundColor: '#f9fafb', color: '#6b7280', borderBottom: '1px solid #f3f4f6' }}>
                      <span>Name</span>
                      <span>Quantity</span>
                    </div>
                    <div>
                      {getBOMList().map((item, index) => (
                        <div key={index} className="flex justify-between items-center px-4 py-3 text-sm" style={{ borderTop: index > 0 ? '1px solid #f3f4f6' : 'none' }}>
                          <span style={{ color: '#374151' }}>{item.name}</span>
                          <span className="font-medium flex items-center gap-1" style={{ color: '#1f2937' }}>
                            <span className="text-xs" style={{ color: '#9ca3af' }}>x</span>{item.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* 底部水印留白 */}
                  <div className="mt-8 text-center text-xs font-medium pb-2" style={{ color: '#d1d5db' }}>
                    Generated by Gem Oratopia DIY
                  </div>
                </div>
              </div>
            </div>

            {/* 弹窗操作按钮（不被截图） */}
            <div className="p-4 bg-white border-t border-gray-200 flex gap-3 shrink-0">
              <button 
                onClick={() => setShowPreviewModal(false)} 
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
              >
                Back to Edit
              </button>
              <button 
                onClick={handleSaveCard} 
                className="flex-1 py-2.5 rounded-xl bg-[#751113] text-white font-bold shadow-md hover:bg-[#5a0c0e] transition-colors flex items-center justify-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                Save Image
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
