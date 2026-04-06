const fs = require('fs');
const path = require('path');

const filePath = 'e:/DOWNLOADS/اشياء شخصية/موقع الادارة المالية والاهتمام بالنفس/src/frontend/components/DashboardClient.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Fix Transactions Table Row
const txOld = '<td className="py-6 text-left font-black text-2xl text-rose-400 eng-num truncate">- {fmt(t.amount)}</td>';
const txNew = '<td className="py-6 text-left font-black text-2xl text-rose-400 eng-num truncate flex items-center justify-end gap-3">- {fmt(t.amount)} <button onClick={() => remove(\'transactions\', t.id)} className="p-2 text-gray-700 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100" title="حذف المعاملة"><Trash2 size={18}/></button></td>';

if (content.includes(txOld)) {
    content = content.replace(txOld, txNew);
    console.log('Fixed Transactions row');
} else {
    console.log('Target for Transactions not found');
}

// 2. Fix Wishlist Card
const wlOld = '                        <div key={i} className={`grand-card p-10 flex flex-col justify-between group ${w.isPurchased ? \'opacity-40 grayscale pointer-events-none\' : \'\'}`}>';
const wlOldInner = '<div className="flex justify-between items-start mb-8">\n                            <h3 className="text-4xl font-black group-hover:text-amber-400 transition-colors uppercase leading-tight">{w.name}</h3>\n                            <span className={`px-5 py-2.5 font-black text-sm rounded-2xl border uppercase tracking-widest ${w.priority === 1 ? \'bg-rose-500/20 text-rose-400 border-rose-500/30\' : w.priority === 2 ? \'bg-amber-500/20 text-amber-400 border-amber-500/30\' : \'bg-gray-500/20 text-gray-300 border-gray-500/30\'}`}>\n                              {w.priority === 1 ? \'أولوية قصوى\' : w.priority === 2 ? \'رغبة عامة\' : \'ترفيه غير ملزِم\'}\n                            </span>\n                          </div>';

const wlNewReplacement = '                        <div key={i} className={`grand-card p-10 flex flex-col justify-between group relative overflow-hidden ${w.isPurchased ? \'opacity-40 grayscale pointer-events-none\' : \'\'}`}>\n                          <div className="flex justify-between items-start mb-8">\n                            <h3 className="text-4xl font-black group-hover:text-amber-400 transition-colors uppercase leading-tight">{w.name}</h3>\n                            <div className="flex flex-col items-end gap-3 translate-x-2">\n                               <span className={`px-5 py-2.5 font-black text-sm rounded-2xl border uppercase tracking-widest ${w.priority === 1 ? \'bg-rose-500/20 text-rose-400 border-rose-500/30\' : w.priority === 2 ? \'bg-amber-500/20 text-amber-400 border-amber-500/30\' : \'bg-gray-500/20 text-gray-300 border-gray-500/30\'}`}>\n                                 {w.priority === 1 ? \'أولوية قصوى\' : w.priority === 2 ? \'رغبة عامة\' : \'ترفيه غير ملزِم\'}\n                               </span>\n                               <button onClick={() => remove(\'wishlist\', w.id)} className="p-2 text-gray-600 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100" title="حذف الأمنية"><Trash2 size={24}/></button>\n                            </div>\n                          </div>';

// Using a simpler approach for Wishlist due to multiline matching
const searchBlock = '<h3 className="text-4xl font-black group-hover:text-amber-400 transition-colors uppercase leading-tight">{w.name}</h3>\n                            <span className={`px-5 py-2.5 font-black text-sm rounded-2xl border uppercase tracking-widest ${w.priority === 1 ? \'bg-rose-500/20 text-rose-400 border-rose-500/30\' : w.priority === 2 ? \'bg-amber-500/20 text-amber-400 border-amber-500/30\' : \'bg-gray-500/20 text-gray-300 border-gray-500/30\'}`}>\n                              {w.priority === 1 ? \'أولوية قصوى\' : w.priority === 2 ? \'رغبة عامة\' : \'ترفيه غير ملزِم\'}\n                            </span>';

const replaceBlock = '<h3 className="text-4xl font-black group-hover:text-amber-400 transition-colors uppercase leading-tight">{w.name}</h3>\n                            <div className="flex flex-col items-end gap-3 translate-x-2">\n                               <span className={`px-5 py-2.5 font-black text-sm rounded-2xl border uppercase tracking-widest ${w.priority === 1 ? \'bg-rose-500/20 text-rose-400 border-rose-500/30\' : w.priority === 2 ? \'bg-amber-500/20 text-amber-400 border-amber-500/30\' : \'bg-gray-500/20 text-gray-300 border-gray-500/30\'}`}>\n                                 {w.priority === 1 ? \'أولوية قصوى\' : w.priority === 2 ? \'رغبة عامة\' : \'ترفيه غير ملزِم\'}\n                               </span>\n                               <button onClick={() => remove(\'wishlist\', w.id)} className="p-2 text-gray-600 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100" title="حذف الأمنية"><Trash2 size={24}/></button>\n                            </div>';

if (content.includes(searchBlock)) {
    content = content.replace(searchBlock, replaceBlock);
    console.log('Fixed Wishlist block');
} else {
    // Try without \n for robustness
    const searchBlockMin = searchBlock.replace(/\s+/g, ' ');
    // ... complicated. Let's just try to be specific with the code tools if this fails.
    console.log('Target for Wishlist not found');
}

fs.writeFileSync(filePath, content);
console.log('Done');
