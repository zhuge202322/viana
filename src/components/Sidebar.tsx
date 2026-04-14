// @ts-nocheck
"use client";

import React, { useState, useMemo } from 'react';

const corsProxy = "https://images.weserv.nl/?url=";

export default function Sidebar({ products, onAddBead, onClear, onCompleteDesign }) {
  const [parentCat, setParentCat] = useState("Beads");
  const [subCat, setSubCat] = useState("All");

  // 提取分类
  const parents = useMemo(() => {
    return [...new Set(products.map(p => p.parentCategoryName).filter(Boolean))];
  }, [products]);

  const subs = useMemo(() => {
    const filtered = products.filter(p => p.parentCategoryName === parentCat);
    return ["All", ...new Set(filtered.map(p => p.categoryName).filter(Boolean))];
  }, [products, parentCat]);

  // 切换父分类时重置子分类
  const handleParentClick = (p) => {
    setParentCat(p);
    setSubCat("All");
  };

  // 过滤当前要显示的商品
  const displayedProducts = useMemo(() => {
    let filtered = products.filter(p => p.parentCategoryName === parentCat);
    if (subCat !== "All") {
      filtered = filtered.filter(p => p.categoryName === subCat);
    }
    return filtered;
  }, [products, parentCat, subCat]);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 父分类 */}
      <div className="flex overflow-x-auto border-b border-gray-100 bg-gray-50 custom-scrollbar shrink-0">
        {parents.map(p => (
          <button
            key={p}
            onClick={() => handleParentClick(p)}
            className={`px-5 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              parentCat === p ? 'border-red-500 text-red-500' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* 子分类 */}
      <div className="flex overflow-x-auto gap-2 p-3 border-b border-gray-100 custom-scrollbar shrink-0">
        {subs.map(s => (
          <button
            key={s}
            onClick={() => setSubCat(s)}
            className={`px-3 py-1.5 text-xs rounded-full border transition-colors whitespace-nowrap shrink-0 ${
              subCat === s ? 'bg-red-500 border-red-500 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* 商品网格 */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-4">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-3 2xl:grid-cols-4 gap-2 sm:gap-3">
          {displayedProducts.map(p => {
            const filename = p.image ? p.image.split('/').pop() : '';
            const localImageUrl = filename ? `/images/beads/${filename}` : '';
            return (
            <div
              key={p.id}
              onClick={() => onAddBead(p)}
              className="flex flex-col items-center p-2 bg-white border border-gray-100 rounded-lg cursor-pointer hover:-translate-y-1 hover:shadow-md transition-all group"
            >
              <div className="w-full aspect-square relative mb-2 flex items-center justify-center bg-gray-50 rounded-md overflow-hidden">
                {localImageUrl ? (
                  <img src={localImageUrl} alt={p.name} className="w-4/5 h-4/5 object-contain group-hover:scale-110 transition-transform" loading="lazy" />
                ) : (
                  <div className="text-xs text-gray-400">No Image</div>
                )}
              </div>
              <h4 className="text-xs text-gray-800 font-medium truncate w-full text-center" title={p.name}>{p.name}</h4>
              <p className="text-sm text-red-500 font-bold mt-1">${p.price}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{p.size || 'Unknown'}</p>
            </div>
            );
          })}
        </div>
        {displayedProducts.length === 0 && (
          <div className="w-full h-40 flex items-center justify-center text-gray-400 text-sm">
            No products available
          </div>
        )}
      </div>

      {/* 底部操作区 */}
      <div className="p-4 border-t border-gray-100 flex gap-3 bg-white">
        <button onClick={onClear} className="flex-1 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors">
          Clear All
        </button>
        <button 
          onClick={onCompleteDesign}
          className="flex-1 py-3 bg-[#751113] hover:bg-[#5a0c0e] text-white font-bold rounded-lg transition-colors shadow-sm shadow-red-900/20"
        >
          Complete Design
        </button>
      </div>
    </div>
  );
}
