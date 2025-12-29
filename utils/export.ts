
import { ExamDossier, ConfigState } from "../types";

export const cleanQuestionText = (text: string) => {
  if (!text) return "";
  const regex = /^(Câu\s*\d+[\s.:\-\/]*|Bài\s*\d+[\s.:\-\/]*|Question\s*\d+[\s.:\-\/]*|\d+[\s.:\-\/]+)/i;
  let cleaned = text.replace(regex, '').trim();
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }
  return cleaned;
};

export const getSectionPoints = (scale: number) => {
  return scale === 5 
    ? { p1: 1.5, p2: 1.0, p3: 1.0, p4: 1.5 } 
    : { p1: 3.0, p2: 2.0, p3: 2.0, p4: 3.0 };
};

export const calculateTotals = (data: ExamDossier, scoreScale: number) => {
  const totals = { 
    tnkqB: 0, tnkqH: 0, 
    dsB: 0, dsH: 0, 
    tlH: 0, tlV: 0, 
    tuanV: 0, tuanVDC: 0 
  };
  
  if (data?.matrix && Array.isArray(data.matrix)) {
    data.matrix.forEach(row => {
      totals.tnkqB += row.tnkq?.biet || 0;
      totals.tnkqH += row.tnkq?.hieu || 0;
      totals.dsB += row.dungSai?.biet || 0;
      totals.dsH += row.dungSai?.hieu || 0;
      totals.tlH += row.traLoiNgan?.hieu || 0;
      totals.tlV += row.traLoiNgan?.vanDung || 0;
      totals.tuanV += row.tuLuan?.vanDung || 0;
      totals.tuanVDC += row.tuLuan?.vanDungCao || 0;
    });
  }

  const sectionPoints = getSectionPoints(scoreScale);
  
  const p1_total = totals.tnkqB + totals.tnkqH;
  const p2_total = totals.dsB + totals.dsH;
  const p3_total = totals.tlH + totals.tlV;
  const p4_total = totals.tuanV + totals.tuanVDC;

  const unitP1 = p1_total > 0 ? sectionPoints.p1 / p1_total : 0;
  const unitP2 = p2_total > 0 ? sectionPoints.p2 / p2_total : 0;
  const unitP3 = p3_total > 0 ? sectionPoints.p3 / p3_total : 0;
  const unitP4 = p4_total > 0 ? sectionPoints.p4 / p4_total : 0;

  const scoreB = (totals.tnkqB * unitP1) + (totals.dsB * unitP2);
  const scoreH = (totals.tnkqH * unitP1) + (totals.dsH * unitP2) + (totals.tlH * unitP3);
  const scoreV = (totals.tlV * unitP3) + (totals.tuanV * unitP4);
  const scoreVDC = (totals.tuanVDC * unitP4);

  const pct = {
    b: Math.round((scoreB / scoreScale) * 100),
    h: Math.round((scoreH / scoreScale) * 100),
    v: Math.round((scoreV / scoreScale) * 100),
    vdc: Math.round((scoreVDC / scoreScale) * 100)
  };

  return { totals, sectionPoints, pct, scoreB, scoreH, scoreV, scoreVDC };
};

export const downloadAsWord = (html: string, filename: string) => {
  try {
    const blob = new Blob(['\ufeff', html], { type: 'application/vnd.ms-word' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const cleanFilename = filename.replace(/[/\\?%*:|"<>]/g, '-') + '.doc';
    link.download = cleanFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Export Error:", error);
  }
};

export const generateWordHtml = (data: ExamDossier, config: ConfigState) => {
  const { totals, sectionPoints, pct } = calculateTotals(data, config.scoreScale);

  const safeMap = (arr: any[] | undefined, callback: (item: any, index: number) => string) => {
    return (arr || []).map(callback).join('');
  };

  return `
    <html>
    <head>
      <meta charset='utf-8'>
      <style>
        body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.3; color: black; }
        table { border-collapse: collapse; width: 100%; margin-bottom: 20px; table-layout: fixed; }
        th, td { border: 1px solid black; padding: 6px; vertical-align: top; text-align: center; word-wrap: break-word; }
        .left { text-align: left; }
        .bold { font-weight: bold; }
        .uppercase { text-transform: uppercase; }
        .page-break { page-break-before: always; }
        h2, h3 { text-align: center; margin-top: 20px; }
        .section-title { font-weight: bold; text-transform: uppercase; margin-top: 15px; display: block; }
      </style>
    </head>
    <body>
      <h2 class="uppercase bold">MA TRẬN ĐỀ KIỂM TRA ${config.examType}</h2>
      <p style="text-align:center" class="bold">${config.schoolName} - Môn: ${config.subject} ${config.grade}</p>
      <table>
        <thead>
          <tr class="bold">
            <th style="width:5%" rowspan="2">TT</th>
            <th style="width:25%" rowspan="2">Kiến thức</th>
            <th colspan="2">Trắc nghiệm</th>
            <th colspan="2">Đúng-Sai</th>
            <th colspan="2">TL Ngắn</th>
            <th colspan="2">Tự luận</th>
            <th style="width:8%" rowspan="2">Tổng</th>
          </tr>
          <tr class="bold">
            <th>NB</th><th>TH</th><th>NB</th><th>TH</th><th>TH</th><th>VD</th><th>VD</th><th>VDC</th>
          </tr>
        </thead>
        <tbody>
          ${safeMap(data.matrix, (r, i) => `
            <tr>
              <td>${i+1}</td>
              <td class="left">${r.topic}</td>
              <td>${r.tnkq?.biet||0}</td>
              <td>${r.tnkq?.hieu||0}</td>
              <td>${r.dungSai?.biet||0}</td>
              <td>${r.dungSai?.hieu||0}</td>
              <td>${r.traLoiNgan?.hieu||0}</td>
              <td>${r.traLoiNgan?.vanDung||0}</td>
              <td>${r.tuLuan?.vanDung||0}</td>
              <td>${r.tuLuan?.vanDungCao||0}</td>
              <td class="bold">${(r.tnkq?.biet||0)+(r.tnkq?.hieu||0)+(r.dungSai?.biet||0)+(r.dungSai?.hieu||0)+(r.traLoiNgan?.hieu||0)+(r.traLoiNgan?.vanDung||0)+(r.tuLuan?.vanDung||0)+(r.tuLuan?.vanDungCao||0)}</td>
            </tr>
          `)}
          <tr class="bold">
            <td colspan="2">Tổng số câu</td>
            <td>${totals.tnkqB}</td><td>${totals.tnkqH}</td>
            <td>${totals.dsB}</td><td>${totals.dsH}</td>
            <td>${totals.tlH}</td><td>${totals.tlV}</td>
            <td>${totals.tuanV}</td><td>${totals.tuanVDC}</td>
            <td>${totals.tnkqB+totals.tnkqH+totals.dsB+totals.dsH+totals.tlH+totals.tlV+totals.tuanV+totals.tuanVDC}</td>
          </tr>
          <tr class="bold">
            <td colspan="2">Tổng điểm</td>
            <td colspan="2">${sectionPoints.p1}đ</td>
            <td colspan="2">${sectionPoints.p2}đ</td>
            <td colspan="2">${sectionPoints.p3}đ</td>
            <td colspan="2">${sectionPoints.p4}đ</td>
            <td>${config.scoreScale}đ</td>
          </tr>
          <tr class="bold">
            <td colspan="2">Tỉ lệ %</td>
            <td colspan="2">${pct.b + pct.h}% (TN)</td>
            <td colspan="2"></td>
            <td colspan="2"></td>
            <td colspan="2">${pct.v + pct.vdc}% (TL)</td>
            <td>100%</td>
          </tr>
        </tbody>
      </table>
      
      <div class="page-break"></div>
      
      <h2 class="uppercase bold">BẢNG ĐẶC TẢ KỸ THUẬT ĐỀ KIỂM TRA ${config.examType}</h2>
      <p style="text-align:center" class="bold">Môn: ${config.subject} ${config.grade}</p>
      <table>
        <thead>
          <tr class="bold">
            <th style="width:5%">TT</th>
            <th style="width:20%">Nội dung / Đơn vị kiến thức</th>
            <th style="width:25%">Yêu cầu cần đạt</th>
            <th>Mức độ đánh giá</th>
          </tr>
        </thead>
        <tbody>
          ${safeMap(data.specs, (s, i) => `
            <tr>
              <td>${i+1}</td>
              <td class="left bold">${s.topic}</td>
              <td class="left">${s.requirement || 'Theo chương trình giáo dục phổ thông.'}</td>
              <td class="left">
                <p><b>- Nhận biết:</b> ${s.levels?.biet || '...'}</p>
                <p><b>- Thông hiểu:</b> ${s.levels?.hieu || '...'}</p>
                <p><b>- Vận dụng:</b> ${s.levels?.vanDung || '...'}</p>
                ${s.levels?.vanDungCao ? `<p><b>- VDC:</b> ${s.levels?.vanDungCao}</p>` : ''}
              </td>
            </tr>
          `)}
        </tbody>
      </table>

      <div class="page-break"></div>
      
      <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
        <div style="float: left; width: 45%;">
          <p class="bold uppercase">${config.schoolName}</p>
          <p>Họ tên: ...........................................</p>
          <p>Lớp: ...............................................</p>
        </div>
        <div style="float: right; width: 45%; text-align: center;">
          <p class="bold uppercase">ĐỀ KIỂM TRA ${config.examType}</p>
          <p class="bold">Môn: ${config.subject} - Lớp ${config.grade}</p>
          <p>Thời gian: ${config.duration}</p>
        </div>
        <div style="clear: both;"></div>
      </div>
      <hr/>

      <span class="section-title">PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn (${sectionPoints.p1} điểm)</span>
      <p style="font-style: italic; font-size: 10pt; margin-bottom: 10px;">Mỗi câu hỏi thí sinh chỉ chọn một phương án trả lời duy nhất.</p>
      ${safeMap(data.exam.multipleChoice, (q, i) => `
        <p><b>Câu ${i+1}.</b> ${cleanQuestionText(q.q)}</p>
        <p>A. ${q.options?.[0]||''} &nbsp;&nbsp;&nbsp; B. ${q.options?.[1]||''} &nbsp;&nbsp;&nbsp; C. ${q.options?.[2]||''} &nbsp;&nbsp;&nbsp; D. ${q.options?.[3]||''}</p>
      `)}

      <span class="section-title">PHẦN II. Câu trắc nghiệm đúng/sai (${sectionPoints.p2} điểm)</span>
      <p style="font-style: italic; font-size: 10pt; margin-bottom: 10px;">Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn đúng hoặc sai.</p>
      ${safeMap(data.exam.trueFalse, (q, i) => `
        <p><b>Câu ${i+1}.</b> ${cleanQuestionText(q.q)}</p>
        <table style="width: 100%; border: 1px solid black; margin-bottom: 10px;">
          ${safeMap(q.subQuestions, (s, si) => `
            <tr>
              <td style="text-align: left; width: 80%; border: 1px solid black;">${String.fromCharCode(97+si)}) ${s.text}</td>
              <td style="width: 10%; border: 1px solid black;">Đ</td>
              <td style="width: 10%; border: 1px solid black;">S</td>
            </tr>
          `)}
        </table>
      `)}

      <span class="section-title">PHẦN III. Câu trắc nghiệm trả lời ngắn (${sectionPoints.p3} điểm)</span>
      ${safeMap(data.exam.shortAnswer, (q, i) => `
        <p><b>Câu ${i+1}.</b> ${cleanQuestionText(q.q)}</p>
        <p>Đáp án: ...................................................................................................</p>
      `)}

      <span class="section-title">PHẦN IV. Câu hỏi tự luận (${sectionPoints.p4} điểm)</span>
      ${safeMap(data.exam.essay, (q, i) => `
        <p><b>Câu ${i+1}.</b> ${cleanQuestionText(q.q)}</p>
        <p>...................................................................................................</p>
        <p>...................................................................................................</p>
      `)}

      <div class="page-break"></div>
      <h2 class="bold uppercase">HƯỚNG DẪN CHẤM & ĐÁP ÁN</h2>
      
      <p class="bold">1. Phần I: Trắc nghiệm</p>
      <table>
        <tr>
          ${safeMap(data.exam.multipleChoice, (q, i) => `<td><b>Câu ${i+1}</b></td>`)}
        </tr>
        <tr>
          ${safeMap(data.exam.multipleChoice, (q, i) => `<td>${q.correct}</td>`)}
        </tr>
      </table>

      <p class="bold" style="margin-top:15px;">2. Phần II: Đúng/Sai</p>
      <p><i>(Quy tắc chấm: Đúng 1 ý được 0.1đ; 2 ý được 0.25đ; 3 ý được 0.5đ; 4 ý được 1.0đ)</i></p>
      ${safeMap(data.exam.trueFalse, (q, i) => `
        <p><b>Câu ${i+1}:</b> ${safeMap(q.subQuestions, (s, si) => `${String.fromCharCode(97+si)}-${s.correct?'Đ':'S'}; `)}</p>
      `)}

      <p class="bold" style="margin-top:15px;">3. Phần III: Trả lời ngắn</p>
      ${safeMap(data.exam.shortAnswer, (q, i) => `<p><b>Câu ${i+1}:</b> ${q.answer}</p>`)}

      <p class="bold" style="margin-top:15px;">4. Phần IV: Tự luận (Hướng dẫn chấm)</p>
      ${safeMap(data.exam.essay, (q, i) => `
        <div style="border: 1px solid #ccc; padding: 10px; margin-bottom: 10px;">
          <p><b>Câu ${i+1}:</b></p>
          <p style="white-space: pre-wrap;">${q.guide}</p>
        </div>
      `)}
    </body>
    </html>
  `;
};
