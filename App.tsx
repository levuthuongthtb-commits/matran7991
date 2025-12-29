
import React, { useState, useCallback } from 'react';
import { 
  FileText, RefreshCcw, CheckCircle2, 
  Printer, Layout, Layers, BrainCircuit, 
  FileDown, Sparkles, AlertTriangle, Clock
} from 'lucide-react';
import { generateExamDossier } from './services/geminiService';
import { ExamDossier, ConfigState } from './types';
import { calculateTotals, downloadAsWord, generateWordHtml, getSectionPoints, cleanQuestionText } from './utils/export';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'input' | 'matrix' | 'specs' | 'exam' | 'answer'>('input');
  const [isGenerating, setIsGenerating] = useState(false);
  const [dossier, setDossier] = useState<ExamDossier | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [config, setConfig] = useState<ConfigState>({
    schoolName: 'Trường THCS Đông Trà',
    subject: 'Lịch sử & Địa lí',
    grade: '6',
    examType: 'Cuối học kì I',
    scoreScale: 10,
    duration: '45 phút',
    topics: 'Chủ đề: Xã hội cổ đại (Ai Cập, Lưỡng Hà, Ấn Độ, Trung Quốc)'
  });

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const points = getSectionPoints(config.scoreScale);
      const data = await generateExamDossier(
        config.subject,
        config.grade,
        config.topics,
        config.duration,
        config.scoreScale,
        points
      );
      setDossier(data);
      setActiveTab('matrix');
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi. Vui lòng thử lại.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = useCallback(() => {
    if (!dossier) return;
    const html = generateWordHtml(dossier, config);
    const filename = `HoSo_${config.subject}_Lop${config.grade}_${config.examType}`;
    downloadAsWord(html, filename);
  }, [dossier, config]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <nav className="no-print sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <BrainCircuit size={20} />
            </div>
            <span className="font-bold text-slate-900 tracking-tight text-lg uppercase">Architect 7991</span>
          </div>
          {dossier && (
            <div className="flex gap-2">
              <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-semibold shadow-sm">
                <FileDown size={18} /> <span className="hidden sm:inline">Xuất Word</span>
              </button>
              <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors text-sm font-semibold">
                <Printer size={18} /> <span className="hidden sm:inline">In</span>
              </button>
              <button onClick={() => { setDossier(null); setActiveTab('input'); }} className="p-2 bg-white border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-50 shadow-sm">
                <RefreshCcw size={18} />
              </button>
            </div>
          )}
        </div>
      </nav>

      <main className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3 animate-pulse">
            <AlertTriangle size={20} /> {error}
          </div>
        )}

        {!dossier ? (
          <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-xl border border-slate-200 transition-all hover:shadow-2xl">
            <h2 className="text-2xl font-bold mb-8 text-slate-800 flex items-center gap-3">
              <Sparkles className="text-indigo-600" /> Thiết lập Đề thi Thông minh
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tên trường</label>
                <input type="text" value={config.schoolName} onChange={e => setConfig({...config, schoolName: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Môn học</label>
                <select 
                  value={config.subject} 
                  onChange={e => setConfig({...config, subject: e.target.value})} 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                >
                  <option value="Lịch sử & Địa lí">Lịch sử & Địa lí (Kết hợp)</option>
                  <option value="Lịch sử">Lịch sử</option>
                  <option value="Địa lí">Địa lí</option>
                  <option value="Toán học">Toán học</option>
                  <option value="Ngữ văn">Ngữ văn</option>
                  <option value="Tiếng Anh">Tiếng Anh</option>
                  <option value="Khoa học tự nhiên">Khoa học tự nhiên</option>
                  <option value="Giáo dục Kinh tế và Pháp luật">Giáo dục Kinh tế và Pháp luật</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Khối lớp</label>
                <select value={config.grade} onChange={e => setConfig({...config, grade: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                  {['6','7','8','9','10','11','12'].map(g => <option key={g} value={g}>Lớp {g}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Thang điểm</label>
                <select value={config.scoreScale} onChange={e => setConfig({...config, scoreScale: parseInt(e.target.value)})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                  <option value={10}>Thang điểm 10</option>
                  <option value={5}>Thang điểm 5</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Thời gian làm bài</label>
                <select 
                  value={config.duration} 
                  onChange={e => setConfig({...config, duration: e.target.value})} 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                >
                  <option value="45 phút">45 phút</option>
                  <option value="60 phút">60 phút</option>
                  <option value="90 phút">90 phút</option>
                </select>
              </div>
            </div>
            <div className="space-y-2 mb-8">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nội dung / Chủ đề kiểm tra</label>
              <textarea 
                value={config.topics} 
                onChange={e => setConfig({...config, topics: e.target.value})} 
                rows={4} 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl resize-none focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="Ví dụ: Chương 1: Bản đồ, Chương 2: Trái Đất..."
              />
            </div>
            <button 
              disabled={isGenerating} 
              onClick={handleGenerate} 
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 shadow-lg disabled:opacity-50 flex justify-center items-center gap-3 transition-all transform active:scale-[0.98]"
            >
              {isGenerating ? (
                <><RefreshCcw className="animate-spin" /> Đang thiết kế hồ sơ chuyên sâu...</>
              ) : (
                <><Sparkles /> Biên soạn Hồ sơ Đề thi</>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="no-print flex bg-white p-1 rounded-xl shadow-sm border border-slate-200 overflow-x-auto gap-1">
              {[
                {id:'matrix', label:'Ma trận', icon:Layout},
                {id:'specs', label:'Đặc tả', icon:Layers},
                {id:'exam', label:'Đề thi', icon:FileText},
                {id:'answer', label:'Đáp án', icon:CheckCircle2},
              ].map(t => (
                <button 
                  key={t.id} 
                  onClick={() => setActiveTab(t.id as any)} 
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${
                    activeTab === t.id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <t.icon size={16} /> {t.label}
                </button>
              ))}
            </div>

            <div className="bg-white rounded-3xl shadow-sm border p-6 sm:p-10 min-h-[70vh] exam-page relative">
              {activeTab === 'matrix' && <MatrixView dossier={dossier} config={config} />}
              {activeTab === 'specs' && <SpecView dossier={dossier} />}
              {activeTab === 'exam' && <ExamView dossier={dossier} config={config} />}
              {activeTab === 'answer' && <AnswerView dossier={dossier} />}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

// Internal components for clean code

const MatrixView = ({ dossier, config }: { dossier: ExamDossier, config: ConfigState }) => {
  const { totals, sectionPoints, pct } = calculateTotals(dossier, config.scoreScale);
  const totalQuestionsAll = totals.tnkqB + totals.tnkqH + totals.dsB + totals.dsH + totals.tlH + totals.tlV + totals.tuanV + totals.tuanVDC;

  return (
    <div className="animate-in fade-in duration-500">
      <h3 className="text-xl font-bold text-center uppercase mb-6 underline decoration-indigo-200 underline-offset-8">Ma trận Đề kiểm tra {config.examType}</h3>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-slate-100 font-bold text-center">
              <th className="border p-2" rowSpan={2}>TT</th>
              <th className="border p-2" rowSpan={2}>Nội dung kiến thức</th>
              <th className="border p-2" colSpan={2}>Trắc nghiệm</th>
              <th className="border p-2" colSpan={2}>Đúng-Sai</th>
              <th className="border p-2" colSpan={2}>TL Ngắn</th>
              <th className="border p-2" colSpan={2}>Tự luận</th>
              <th className="border p-2" rowSpan={2}>Tổng</th>
            </tr>
            <tr className="bg-slate-50 text-[10px] text-center">
              <th className="border p-1">NB</th><th className="border p-1">TH</th>
              <th className="border p-1">NB</th><th className="border p-1">TH</th>
              <th className="border p-1">TH</th><th className="border p-1">VD</th>
              <th className="border p-1">VD</th><th className="border p-1">VDC</th>
            </tr>
          </thead>
          <tbody className="text-center">
            {dossier.matrix?.map((r, i) => (
              <tr key={i} className="hover:bg-slate-50 transition-colors">
                <td className="border p-2">{i+1}</td>
                <td className="border p-2 text-left font-medium">{r.topic}</td>
                <td className="border p-2">{r.tnkq?.biet||'-'}</td><td className="border p-2">{r.tnkq?.hieu||'-'}</td>
                <td className="border p-2">{r.dungSai?.biet||'-'}</td><td className="border p-2">{r.dungSai?.hieu||'-'}</td>
                <td className="border p-2">{r.traLoiNgan?.hieu||'-'}</td><td className="border p-2">{r.traLoiNgan?.vanDung||'-'}</td>
                <td className="border p-2">{r.tuLuan?.vanDung||'-'}</td><td className="border p-2">{r.tuLuan?.vanDungCao||'-'}</td>
                <td className="border p-2 font-bold bg-slate-50">
                  {(r.tnkq?.biet||0)+(r.tnkq?.hieu||0)+(r.dungSai?.biet||0)+(r.dungSai?.hieu||0)+(r.traLoiNgan?.hieu||0)+(r.traLoiNgan?.vanDung||0)+(r.tuLuan?.vanDung||0)+(r.tuLuan?.vanDungCao||0)}
                </td>
              </tr>
            ))}
            
            {/* Hàng 1: Tổng số câu */}
            <tr className="bg-slate-50 font-bold">
              <td colSpan={2} className="border p-2 text-right uppercase text-[10px]">Tổng số câu</td>
              <td className="border p-2">{totals.tnkqB}</td><td className="border p-2">{totals.tnkqH}</td>
              <td className="border p-2">{totals.dsB}</td><td className="border p-2">{totals.dsH}</td>
              <td className="border p-2">{totals.tlH}</td><td className="border p-2">{totals.tlV}</td>
              <td className="border p-2">{totals.tuanV}</td><td className="border p-2">{totals.tuanVDC}</td>
              <td className="border p-2 bg-indigo-50 text-indigo-700">{totalQuestionsAll}</td>
            </tr>

            {/* Hàng 2: Tổng điểm */}
            <tr className="bg-indigo-600 font-bold uppercase text-white">
              <td colSpan={2} className="border p-2 text-right">Tổng điểm</td>
              <td colSpan={2} className="border p-2">{sectionPoints.p1}đ</td>
              <td colSpan={2} className="border p-2">{sectionPoints.p2}đ</td>
              <td colSpan={2} className="border p-2">{sectionPoints.p3}đ</td>
              <td colSpan={2} className="border p-2">{sectionPoints.p4}đ</td>
              <td className="border p-2 bg-indigo-800">{config.scoreScale}đ</td>
            </tr>

            {/* Hàng 3: Tỉ lệ % */}
            <tr className="bg-amber-50 font-bold">
              <td colSpan={2} className="border p-2 text-right uppercase text-[10px]">Tỉ lệ %</td>
              <td colSpan={2} className="border p-2">{pct.b + pct.h}% (TN)</td>
              <td colSpan={2} className="border p-2"></td>
              <td colSpan={2} className="border p-2"></td>
              <td colSpan={2} className="border p-2">{pct.v + pct.vdc}% (TL)</td>
              <td className="border p-2">100%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

const SpecView = ({ dossier }: { dossier: ExamDossier }) => (
  <div className="animate-in fade-in duration-500">
    <h3 className="text-xl font-bold text-center uppercase mb-6 underline decoration-indigo-200 underline-offset-8">Bảng Đặc Tả Kỹ Thuật</h3>
    <table className="w-full border-collapse text-xs sm:text-sm">
      <thead><tr className="bg-slate-100 font-bold">
        <th className="border p-3 w-12 text-center">TT</th><th className="border p-3">Nội dung/Đơn vị kiến thức</th><th className="border p-3">Yêu cầu cần đạt (Mức độ đánh giá)</th>
      </tr></thead>
      <tbody>
        {dossier.specs?.map((s, i) => (
          <tr key={i} className="hover:bg-slate-50"><td className="border p-3 text-center font-bold">{i+1}</td><td className="border p-3 font-bold text-indigo-700">{s.topic}</td>
          <td className="border p-3 space-y-2">
            <p className="bg-blue-50/50 p-2 rounded"><b>Nhận biết:</b> {s.levels?.biet}</p>
            <p className="bg-green-50/50 p-2 rounded"><b>Thông hiểu:</b> {s.levels?.hieu}</p>
            <p className="bg-amber-50/50 p-2 rounded"><b>Vận dụng:</b> {s.levels?.vanDung}</p>
            {s.levels?.vanDungCao && <p className="bg-red-50/50 p-2 rounded"><b>Vận dụng cao:</b> {s.levels?.vanDungCao}</p>}
          </td></tr>
        ))}
      </tbody>
    </table>
  </div>
);

const ExamView = ({ dossier, config }: { dossier: ExamDossier, config: ConfigState }) => {
  const { sectionPoints } = calculateTotals(dossier, config.scoreScale);
  return (
    <div className="font-serif text-slate-900 leading-relaxed max-w-4xl mx-auto">
      <div className="flex justify-between mb-8 pb-4 border-b-2 border-slate-900">
        <div className="text-sm">
          <p className="font-bold uppercase tracking-tight">{config.schoolName}</p>
          <p className="mt-4 italic text-slate-600">Họ và tên: ...........................................................</p>
          <p className="italic text-slate-600">Lớp: .................................................................</p>
        </div>
        <div className="text-center">
          <p className="font-bold uppercase text-lg">Đề kiểm tra {config.examType}</p>
          <p className="font-bold">Môn học: {config.subject} {config.grade}</p>
          <p className="mt-2 font-medium">Thời gian: {config.duration}</p>
        </div>
      </div>
      
      <div className="space-y-10">
        <section>
          <h4 className="font-bold uppercase border-l-4 border-indigo-600 pl-3 mb-4 py-1">Phần I. Câu trắc nghiệm nhiều phương án lựa chọn ({sectionPoints.p1} điểm)</h4>
          <p className="mb-4 text-sm italic text-slate-500">Mỗi câu hỏi thí sinh chỉ chọn một phương án trả lời duy nhất.</p>
          {dossier.exam.multipleChoice?.map((q, i) => (
            <div key={i} className="mb-6 pl-4">
              <p className="font-medium leading-snug"><b>Câu {i+1}.</b> {cleanQuestionText(q.q)}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 mt-2 ml-4 text-sm">
                {q.options?.map((o, idx) => <p key={idx}><b className="mr-1">{String.fromCharCode(65+idx)}.</b> {o}</p>)}
              </div>
            </div>
          ))}
        </section>

        <section>
          <h4 className="font-bold uppercase border-l-4 border-indigo-600 pl-3 mb-4 py-1">Phần II. Câu trắc nghiệm đúng/sai ({sectionPoints.p2} điểm)</h4>
          <p className="mb-4 text-sm italic text-slate-500">Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn đúng hoặc sai.</p>
          {dossier.exam.trueFalse?.map((q, i) => (
            <div key={i} className="mb-8 pl-4">
              <p className="font-medium mb-3"><b>Câu {i+1}.</b> {cleanQuestionText(q.q)}</p>
              <div className="ml-4 border border-slate-300 rounded-lg overflow-hidden shadow-sm">
                <div className="flex bg-slate-100 font-bold border-b border-slate-300 text-xs">
                  <div className="flex-1 p-2">Lệnh hỏi</div>
                  <div className="w-12 border-l border-slate-300 p-2 text-center">Đ</div>
                  <div className="w-12 border-l border-slate-300 p-2 text-center">S</div>
                </div>
                {q.subQuestions?.map((sq, si) => (
                  <div key={si} className="flex border-b border-slate-200 last:border-0 hover:bg-slate-50">
                    <p className="flex-1 p-2 text-sm">{String.fromCharCode(97+si)}) {sq.text}</p>
                    <div className="w-12 border-l border-slate-200 p-2 text-center"></div>
                    <div className="w-12 border-l border-slate-200 p-2 text-center"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        <section>
          <h4 className="font-bold uppercase border-l-4 border-indigo-600 pl-3 mb-4 py-1">Phần III. Câu trắc nghiệm trả lời ngắn ({sectionPoints.p3} điểm)</h4>
          {dossier.exam.shortAnswer?.map((q, i) => (
            <div key={i} className="mb-6 pl-4">
              <p className="font-medium"><b>Câu {i+1}.</b> {cleanQuestionText(q.q)}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-sm font-bold text-slate-400 italic">Đáp án:</span>
                <div className="flex-1 border-b border-dotted border-slate-400 h-6"></div>
              </div>
            </div>
          ))}
        </section>

        <section>
          <h4 className="font-bold uppercase border-l-4 border-indigo-600 pl-3 mb-4 py-1">Phần IV. Câu hỏi tự luận ({sectionPoints.p4} điểm)</h4>
          {dossier.exam.essay?.map((q, i) => (
            <div key={i} className="mb-8 pl-4">
              <p className="font-medium leading-relaxed"><b>Câu {i+1}.</b> {cleanQuestionText(q.q)}</p>
              <div className="space-y-4 mt-4 ml-4">
                <div className="border-b border-dotted border-slate-300 h-6"></div>
                <div className="border-b border-dotted border-slate-300 h-6"></div>
                <div className="border-b border-dotted border-slate-300 h-6"></div>
              </div>
            </div>
          ))}
        </section>
      </div>
      <div className="mt-20 text-center font-bold italic border-t pt-8">--- HẾT ---</div>
    </div>
  );
};

const AnswerView = ({ dossier }: { dossier: ExamDossier }) => (
  <div className="space-y-10 animate-in fade-in duration-500">
    <h3 className="text-xl font-bold text-center uppercase mb-6 underline decoration-indigo-200 underline-offset-8">Hướng dẫn chấm & Đáp án</h3>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="p-6 bg-slate-50 rounded-2xl border border-indigo-100 shadow-sm">
        <h4 className="font-bold text-indigo-800 mb-4 flex items-center gap-2">
          <div className="w-2 h-2 bg-indigo-600 rounded-full"></div> Phần I: Trắc nghiệm
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {dossier.exam.multipleChoice?.map((q, i) => (
            <div key={i} className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-200">
              <span className="font-bold text-slate-500">Câu {i+1}:</span>
              <span className="font-black text-indigo-600 text-lg">{q.correct}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="p-6 bg-slate-50 rounded-2xl border border-emerald-100 shadow-sm">
        <h4 className="font-bold text-emerald-800 mb-4 flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-600 rounded-full"></div> Phần II: Đúng/Sai
        </h4>
        <div className="space-y-4">
          {dossier.exam.trueFalse?.map((q, i) => (
            <div key={i} className="bg-white p-3 rounded-lg border border-slate-200">
              <p className="font-bold text-xs text-slate-400 mb-2 uppercase">Câu {i+1}</p>
              <div className="grid grid-cols-2 gap-2">
                {q.subQuestions?.map((sq, si) => (
                  <div key={si} className="flex justify-between items-center bg-slate-50 px-2 py-1 rounded">
                    <span className="text-xs">{String.fromCharCode(97+si)})</span>
                    <span className={`font-bold ${sq.correct ? 'text-green-600' : 'text-red-600'}`}>{sq.correct ? 'Đ' : 'S'}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="p-6 bg-slate-50 rounded-2xl border border-amber-100 shadow-sm col-span-full">
        <h4 className="font-bold text-amber-800 mb-6 flex items-center gap-2">
          <div className="w-2 h-2 bg-amber-600 rounded-full"></div> Giải đáp chi tiết & Hướng dẫn tự luận
        </h4>
        <div className="space-y-6">
          {dossier.exam.shortAnswer?.length > 0 && (
            <div className="space-y-3">
              <p className="font-bold text-slate-700 text-sm uppercase tracking-wide">Phần III: Trả lời ngắn</p>
              {dossier.exam.shortAnswer?.map((q, i) => (
                <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 flex gap-4">
                  <span className="font-bold text-indigo-500 min-w-[60px]">Câu {i+1}:</span>
                  <span className="font-medium">{q.answer}</span>
                </div>
              ))}
            </div>
          )}
          {dossier.exam.essay?.length > 0 && (
            <div className="space-y-3 pt-4">
              <p className="font-bold text-slate-700 text-sm uppercase tracking-wide">Phần IV: Tự luận</p>
              {dossier.exam.essay?.map((q, i) => (
                <div key={i} className="bg-white p-5 rounded-xl border border-slate-200">
                  <p className="font-bold text-indigo-500 mb-2 underline underline-offset-4">Câu {i+1}: Hướng dẫn chấm</p>
                  <div className="text-slate-700 whitespace-pre-wrap italic leading-relaxed">{q.guide}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);

export default App;
