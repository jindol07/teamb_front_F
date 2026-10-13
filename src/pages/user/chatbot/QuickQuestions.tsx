import type { QuickQuestion } from './chatbotTypes';
/*
  빠른 질문 Props
*/
interface QuickQuestionsProps {
    questions: QuickQuestion[];
    onQuestionClick: (question: string) => void;
}
export default function QuickQuestions({
    questions,
    onQuestionClick
}: QuickQuestionsProps) {
    return (
        <div className="quick-question-area">
            {questions.map((question) => (
                <button
                    key={question.id}
                    type="button"
                    className="quick-question-button"
                    onClick={() =>
                        onQuestionClick(question.text)
                    }
                >
                    {question.text}
                </button>
            ))}
        </div>
    );
}