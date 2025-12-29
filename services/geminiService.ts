
import { GoogleGenAI, Type } from "@google/genai";
import { ExamDossier } from "../types";

export const generateExamDossier = async (
  subject: string,
  grade: string,
  topics: string,
  duration: string,
  scoreScale: number,
  points: { p1: number; p2: number; p3: number; p4: number }
): Promise<ExamDossier> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

  const systemPrompt = `Bạn là Chuyên gia Khảo thí. Nhiệm vụ: Soạn hồ sơ đề thi ${subject} lớp ${grade} theo CV 7991.
Nội dung: ${topics}. Thời gian: ${duration}. Thang điểm: ${scoreScale}.

QUY ĐỊNH VỀ ĐỘ DÀI (BẮT BUỘC ĐỂ TRÁNH LỖI HỆ THỐNG):
1. SỐ CÂU HỎI: Phần I (8-12 câu), Phần II (2-3 câu), Phần III (2-3 câu), Phần IV (1-2 câu). Tổng cộng dưới 20 câu.
2. BẢNG ĐẶC TẢ (Specs): Mỗi mục "requirement" và "levels" KHÔNG QUÁ 30 từ. Chỉ viết ý chính.
3. HƯỚNG DẪN CHẤM: Viết cực kỳ ngắn gọn, dạng gạch đầu dòng, không diễn giải dài dòng.
4. NỘI DUNG CÂU HỎI: Tập trung vào trọng tâm, tránh các đoạn văn bản dẫn quá dài (dưới 100 từ mỗi câu).

QUY TẮC DỮ LIỆU:
- Trả về JSON hợp lệ. KHÔNG có số thứ tự trong thuộc tính "q".
- Phần II (Đúng/Sai) PHẢI có đủ 4 ý a, b, c, d.

LƯU Ý: Nếu nội dung quá dài, hệ thống sẽ bị lỗi. Hãy ưu tiên sự súc tích tuyệt đối.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Soạn hồ sơ đề thi ${subject} ${grade}. Yêu cầu súc tích, ngắn gọn nhất có thể để đảm bảo JSON không bị cắt cụt. Trọng tâm: ${topics}.`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        // Ngân sách tư duy giúp AI lập kế hoạch cấu trúc JSON tốt hơn
        thinkingConfig: { thinkingBudget: 1024 },
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matrix: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  topic: { type: Type.STRING },
                  tnkq: { type: Type.OBJECT, properties: { biet: { type: Type.NUMBER }, hieu: { type: Type.NUMBER } } },
                  dungSai: { type: Type.OBJECT, properties: { biet: { type: Type.NUMBER }, hieu: { type: Type.NUMBER } } },
                  traLoiNgan: { type: Type.OBJECT, properties: { hieu: { type: Type.NUMBER }, vanDung: { type: Type.NUMBER } } },
                  tuLuan: { type: Type.OBJECT, properties: { vanDung: { type: Type.NUMBER }, vanDungCao: { type: Type.NUMBER } } }
                },
                required: ["topic", "tnkq", "dungSai", "traLoiNgan", "tuLuan"]
              }
            },
            specs: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  topic: { type: Type.STRING },
                  requirement: { type: Type.STRING },
                  levels: {
                    type: Type.OBJECT,
                    properties: {
                      biet: { type: Type.STRING },
                      hieu: { type: Type.STRING },
                      vanDung: { type: Type.STRING },
                      vanDungCao: { type: Type.STRING }
                    }
                  }
                },
                required: ["topic", "requirement", "levels"]
              }
            },
            exam: {
              type: Type.OBJECT,
              properties: {
                multipleChoice: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      q: { type: Type.STRING },
                      options: { type: Type.ARRAY, items: { type: Type.STRING } },
                      correct: { type: Type.STRING }
                    },
                    required: ["q", "options", "correct"]
                  }
                },
                trueFalse: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      q: { type: Type.STRING },
                      subQuestions: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            text: { type: Type.STRING },
                            correct: { type: Type.BOOLEAN }
                          },
                          required: ["text", "correct"]
                        }
                      }
                    },
                    required: ["q", "subQuestions"]
                  }
                },
                shortAnswer: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      q: { type: Type.STRING },
                      answer: { type: Type.STRING }
                    },
                    required: ["q", "answer"]
                  }
                },
                essay: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      q: { type: Type.STRING },
                      guide: { type: Type.STRING }
                    },
                    required: ["q", "guide"]
                  }
                }
              },
              required: ["multipleChoice", "trueFalse", "shortAnswer", "essay"]
            }
          },
          required: ["matrix", "specs", "exam"]
        }
      }
    });

    let text = response.text;
    if (!text) throw new Error("AI không phản hồi dữ liệu.");
    
    text = text.trim();

    // Cố gắng sửa lỗi thiếu dấu ngoặc đóng nếu có thể (chỉ dành cho các lỗi nhẹ)
    if (!text.endsWith('}')) {
      console.warn("Dữ liệu JSON có thể bị thiếu dấu ngoặc đóng. Đang kiểm tra...");
      // Nếu nó kết thúc ở giữa một mảng hoặc đối tượng, chúng ta không thể sửa dễ dàng.
      // Nhưng ta vẫn kiểm tra xem liệu việc thêm dấu ngoặc có giúp ích không.
      if (text.endsWith(']')) text += '}';
      else throw new Error("Dữ liệu từ AI bị cắt ngang do quá dài. Hãy thử nhập nội dung ngắn gọn hơn hoặc chọn ít chủ đề hơn.");
    }

    return JSON.parse(text);
  } catch (e: any) {
    console.error("Gemini Service Error:", e);
    if (e instanceof SyntaxError) {
      throw new Error("Lỗi cấu trúc dữ liệu AI (JSON malformed). Hãy thử 'Biên soạn' lại với nội dung súc tích hơn.");
    }
    throw new Error(e.message || "Lỗi xử lý AI. Vui lòng thử lại.");
  }
};
