export interface InputQuestion {
  text: string;
}

export interface InputSubtopic {
  title: string;
  questions: InputQuestion[];
}

export interface InputTopic {
  title: string;
  subtopics: InputSubtopic[];
}

export interface InputStructure {
  topics: InputTopic[];
}

export interface CompiledQuestion {
  id: string;
  text: string;
  number: string;
}

export interface CompiledSubtopic {
  id: string;
  title: string;
  number: string;
  questions: CompiledQuestion[];
}

export interface CompiledTopic {
  id: string;
  title: string;
  number: string;
  subtopics: CompiledSubtopic[];
}

export interface CompileResult {
  outline: Record<string, string>;
  tree: CompiledTopic[];
  warnings: string[];
}

function generateId(prefix: string, index: number): string {
  return `${prefix}-${index + 1}`;
}

function trimText(text: string): string {
  return text?.trim() || '';
}

export function compileStructureTree(input: InputStructure | InputTopic[] | any): CompileResult {
  const warnings: string[] = [];
  const outline: Record<string, string> = {};
  const tree: CompiledTopic[] = [];

  // Handle different input formats
  let topics: any[];
  
  if (Array.isArray(input)) {
    topics = input;
  } else if (input.topics) {
    topics = input.topics;
  } else if (input.children) {
    // Handle tree structure from editor: { children: [...] }
    topics = input.children;
  } else {
    topics = [];
  }

  topics.forEach((topic, topicIndex) => {
    const topicNumber = `${topicIndex + 1}`;
    const topicTitle = trimText(topic.title);
    
    if (!topicTitle) {
      warnings.push(`Topic ${topicNumber}: Empty title`);
    }

    const compiledTopic: CompiledTopic = {
      id: generateId('topic', topicIndex),
      title: topicTitle,
      number: topicNumber,
      subtopics: []
    };

    outline[topicNumber] = topicTitle;

    // Handle both subtopics and children arrays
    const subtopics = topic.subtopics || topic.children || [];
    subtopics.forEach((subtopic: any, subtopicIndex: number) => {
      const subtopicNumber = `${topicNumber}.${subtopicIndex + 1}`;
      const subtopicTitle = trimText(subtopic.title);

      if (!subtopicTitle) {
        warnings.push(`Subtopic ${subtopicNumber}: Empty title`);
      }

      const compiledSubtopic: CompiledSubtopic = {
        id: generateId(`topic-${topicIndex + 1}-subtopic`, subtopicIndex),
        title: subtopicTitle,
        number: subtopicNumber,
        questions: []
      };

      outline[subtopicNumber] = subtopicTitle;

      // Handle both questions and children arrays
      const questions = subtopic.questions || subtopic.children || [];
      questions.forEach((question: any, questionIndex: number) => {
        const questionNumber = `${subtopicNumber}.${questionIndex + 1}`;
        const questionText = trimText(question.text || question.title);

        if (!questionText) {
          warnings.push(`Question ${questionNumber}: Empty text`);
        }

        const compiledQuestion: CompiledQuestion = {
          id: generateId(`topic-${topicIndex + 1}-subtopic-${subtopicIndex + 1}-question`, questionIndex),
          text: questionText,
          number: questionNumber
        };

        outline[questionNumber] = questionText;
        compiledSubtopic.questions.push(compiledQuestion);
      });

      compiledTopic.subtopics.push(compiledSubtopic);
    });

    tree.push(compiledTopic);
  });

  return {
    outline,
    tree,
    warnings
  };
}
