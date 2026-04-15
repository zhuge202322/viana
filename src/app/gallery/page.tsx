"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function GalleryPage() {
  const [gallery, setGallery] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    fetch('/api/share')
      .then(res => res.json())
      .then(data => {
        setGallery(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">DIY Gallery</h1>
          <Link href="/" className="px-5 py-2.5 bg-[#751113] text-white font-bold rounded-xl hover:bg-[#5a0c0e] transition-colors shadow-md">
            Create Yours
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-500">Loading gallery...</div>
        ) : gallery.length === 0 ? (
          <div className="text-center py-20 text-gray-500 bg-white rounded-2xl shadow-sm border border-gray-100">
            <p className="text-lg">No bracelets shared yet.</p>
            <p className="text-sm mt-2">Be the first to share your creation!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {gallery.map(item => (
              <div 
                key={item.id} 
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all group"
                onClick={() => setSelectedItem(item)}
              >
                <div className="aspect-square bg-gray-50 rounded-xl overflow-hidden mb-3 relative flex items-center justify-center">
                  <img src={item.imageUrl} alt="Bracelet" className="w-[90%] h-[90%] object-contain group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                </div>
                <div className="flex justify-between items-center px-1">
                  <span className="text-xs font-medium text-gray-400">{new Date(item.createdAt).toLocaleDateString()}</span>
                  <span className="text-sm font-bold text-[#751113]">${item.price.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setSelectedItem(null)}>
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[90vh] animate-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
            {/* Image Side */}
            <div 
              className="md:w-1/2 bg-gray-50 p-8 flex items-center justify-center relative border-b md:border-b-0 md:border-r border-gray-100 min-h-[300px] cursor-zoom-in group"
              onClick={() => setIsFullScreen(true)}
            >
              <img 
                src={selectedItem.imageUrl} 
                alt="Bracelet" 
                className="w-full h-auto max-h-full object-contain drop-shadow-xl transition-transform duration-300 group-hover:scale-110" 
              />
              <div className="absolute top-4 left-4 bg-white/80 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-gray-700 shadow-sm border border-gray-200">
                Shared Design
              </div>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="bg-white/90 backdrop-blur-sm text-gray-800 px-4 py-2 rounded-full font-medium text-sm flex items-center gap-2 shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
                  Click to Enlarge
                </div>
              </div>
            </div>
            
            {/* Details Side */}
            <div className="md:w-1/2 p-6 md:p-8 flex flex-col overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Bracelet Details</h2>
                <button onClick={() => setSelectedItem(null)} className="p-2 hover:bg-gray-100 text-gray-500 rounded-full transition-colors">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
              
              <div className="flex justify-between items-center mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Target Size</p>
                  <p className="font-bold text-gray-900 text-lg">{selectedItem.targetLength} cm</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 mb-1">Estimated Total</p>
                  <p className="font-bold text-xl text-[#751113]">${selectedItem.price.toFixed(2)}</p>
                </div>
              </div>

              <h3 className="font-bold text-gray-800 mb-3">Materials Used ({selectedItem.items.reduce((acc: number, item: any) => acc + item.count, 0)} items)</h3>
              
              <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar min-h-[200px]">
                {selectedItem.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-white border border-gray-100 rounded-lg hover:border-red-200 transition-colors">
                    <span className="text-sm font-medium text-gray-700 truncate mr-2" title={item.name}>{item.name}</span>
                    <span className="text-sm font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded-md shrink-0">x {item.count}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-100">
                <Link href="/" className="w-full py-3 bg-gray-900 hover:bg-black text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
                  Try DIY Now
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"></path><path d="M12 5l7 7-7 7"></path></svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full-screen Image Viewer */}
      {isFullScreen && selectedItem && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center bg-white/95 backdrop-blur-md cursor-zoom-out animate-in fade-in duration-200"
          onClick={() => setIsFullScreen(false)}
        >
          <button 
            className="absolute top-6 right-6 p-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-full transition-colors z-10 shadow-sm"
            onClick={(e) => {
              e.stopPropagation();
              setIsFullScreen(false);
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
          
          <div className="w-full h-full p-4 md:p-12 flex items-center justify-center animate-in zoom-in-95 duration-300">
            <img 
              src={selectedItem.imageUrl} 
              alt="Bracelet Fullscreen" 
              className="max-w-full max-h-full object-contain drop-shadow-2xl select-none"
              onClick={(e) => e.stopPropagation()} // 阻止点击图片本身关闭
            />
          </div>
          
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-white/80 backdrop-blur-md rounded-full shadow-lg border border-gray-100 text-sm font-bold text-gray-800 pointer-events-none">
            Click anywhere to close
          </div>
        </div>
      )}
    </div>
  );
}