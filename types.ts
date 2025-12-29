
export interface MatrixItem {
  topic: string;
  tnkq: { biet: number; hieu: number };
  dungSai: { biet: number; hieu: number };
  traLoiNgan: { hieu: number; vanDung: number };
  tuLuan: { vanDung: number; vanDungCao: number };
}

export interface SpecItem {
  topic: string;
  requirement: string;
  levels: {
    biet: string;
    hieu: string;
    vanDung: string;
    vanDungCao: string;
  };
}

export interface MultipleChoiceQuestion {
  q: string;
  options: string[];
  correct: string;
}

export interface TrueFalseQuestion {
  q: string;
  subQuestions: { text: string; correct: boolean }[];
}

export interface ShortAnswerQuestion {
  q: string;
  answer: string;
}

export interface EssayQuestion {
  q: string;
  guide: string;
}

export interface ExamDossier {
  matrix: MatrixItem[];
  specs: SpecItem[];
  exam: {
    multipleChoice: MultipleChoiceQuestion[];
    trueFalse: TrueFalseQuestion[];
    shortAnswer: ShortAnswerQuestion[];
    essay: EssayQuestion[];
  };
}

export interface ConfigState {
  schoolName: string;
  subject: string;
  grade: string;
  examType: string;
  scoreScale: number;
  duration: string;
  topics: string;
}
