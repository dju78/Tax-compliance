import { useState } from 'react';
import type { QuestionnaireFlow } from '../engine/questionnaire';

interface Props {
    flow: QuestionnaireFlow;
    onComplete: (answers: Record<string, unknown>) => void;
    onCancel: () => void;
}

export function Questionnaire({ flow, onComplete, onCancel }: Props) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, unknown>>({});

    // Filter questions based on conditions
    const activeQuestions = flow.questions.filter(q => !q.condition || q.condition(answers));
    const currentQuestion = activeQuestions[currentIndex];

    const handleAnswer = (value: unknown) => {
        const newAnswers = { ...answers, [currentQuestion.id]: value };
        setAnswers(newAnswers);
    };

    const handleNext = () => {
        if (currentIndex < activeQuestions.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            onComplete(answers);
        }
    };

    const handleBack = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        } else {
            onCancel();
        }
    };

    const isLast = currentIndex === activeQuestions.length - 1;

    if (!currentQuestion) return null;

    return (
        <div className="glass-panel" style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ color: 'var(--color-primary)', marginBottom: '0.5rem' }}>{flow.title}</h3>
                <div style={{ height: '4px', background: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
                    <div
                        style={{
                            height: '100%',
                            background: 'var(--color-accent)',
                            width: `${((currentIndex + 1) / activeQuestions.length) * 100}%`,
                            transition: 'width 0.3s ease'
                        }}
                    />
                </div>
                <small style={{ color: 'var(--color-text-muted)' }}>Question {currentIndex + 1} of {activeQuestions.length}</small>
            </div>

            <h2 style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>{currentQuestion.text}</h2>

            <div style={{ minHeight: '150px' }}>
                {currentQuestion.type === 'currency' && (
                    <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 'bold' }}>₦</span>
                        <input
                            type="number"
                            autoFocus
                            style={{
                                width: '100%',
                                padding: '1rem 1rem 1rem 2.5rem',
                                fontSize: '1.25rem',
                                borderRadius: 'var(--radius-md)',
                                border: '2px solid var(--color-primary-light)',
                                background: 'rgba(255,255,255,0.8)'
                            }}
                            value={(answers[currentQuestion.id] as string | number) || ''}
                            onChange={(e) => handleAnswer(Number(e.target.value))}
                            onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                        />
                    </div>
                )}

                {currentQuestion.type === 'choice' && currentQuestion.options && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {currentQuestion.options.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => {
                                    handleAnswer(opt.value);
                                    setTimeout(() => { // Small delay for UX
                                        if (currentIndex < activeQuestions.length - 1) setCurrentIndex(currentIndex + 1);
                                        else onComplete({ ...answers, [currentQuestion.id]: opt.value });
                                    }, 150);
                                }}
                                style={{
                                    padding: '1rem',
                                    textAlign: 'left',
                                    border: answers[currentQuestion.id] === opt.value ? '2px solid var(--color-accent)' : '1px solid #cbd5e1',
                                    borderRadius: 'var(--radius-md)',
                                    background: answers[currentQuestion.id] === opt.value ? 'rgba(212, 175, 55, 0.1)' : 'white',
                                    cursor: 'pointer',
                                    fontSize: '1rem'
                                }}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
                <button
                    onClick={handleBack}
                    style={{ padding: '0.75rem 1.5rem', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                >
                    Back
                </button>
                <button
                    onClick={handleNext}
                    disabled={answers[currentQuestion.id] === undefined && currentQuestion.type !== 'choice'} // Simplistic validation
                    style={{
                        padding: '0.75rem 2rem',
                        background: 'var(--color-primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        opacity: (answers[currentQuestion.id] === undefined && currentQuestion.type !== 'choice') ? 0.5 : 1
                    }}
                >
                    {isLast ? 'Complete' : 'Next'}
                </button>
            </div>
        </div>
    );
}
