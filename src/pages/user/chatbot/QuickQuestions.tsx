import { useId, useState } from 'react';
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
    const [expanded, setExpanded] = useState(true);
    const listId = useId();
    return (
        <div className="quick-question-area">
            <button
                type="button"
                className="quick-question-toggle"
                aria-expanded={expanded}
                aria-controls={listId}
                onClick={() => setExpanded((previous) => !previous)}
            >
                {expanded ? '빠른 질문 숨기기 ▴' : '빠른 질문 보기 ▾'}
            </button>
            <div id={listId} className="quick-question-list" hidden={!expanded}>
            {questions.map((question) => (
                <button
                    key={question.id}
                    type="button"
                    className="quick-question-button"
                    onClick={() =>
                        onQuestionClick(question.question)
                    }
                >
                    {question.text}
                </button>
            ))}
            </div>
        </div>
    );
}
