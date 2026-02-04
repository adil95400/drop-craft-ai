import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Clock, Trophy } from 'lucide-react';
import type { Quiz } from '@/services/academy.service';

interface QuizComponentProps {
  quiz: Quiz;
  onComplete: (score: number, passed: boolean, timeTaken: number) => void;
}

export function QuizComponent({ quiz, onComplete }: QuizComponentProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [startTime] = useState(Date.now());
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  const handleAnswerSelect = (optionIndex: number) => {
    setSelectedAnswer(optionIndex);
  };

  const handleNext = () => {
    if (selectedAnswer !== null) {
      setAnswers({ ...answers, [currentQuestionIndex]: selectedAnswer });
      
      if (isLastQuestion) {
        calculateResults();
      } else {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedAnswer(null);
      }
    }
  };

  const calculateResults = () => {
    const finalAnswers = { ...answers, [currentQuestionIndex]: selectedAnswer };
    let correct = 0;

    quiz.questions.forEach((q, index) => {
      if (finalAnswers[index] === q.correct_answer) {
        correct++;
      }
    });

    const score = Math.round((correct / quiz.questions.length) * 100);
    const passed = score >= quiz.passing_score;
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);

    setShowResults(true);
    onComplete(score, passed, timeTaken);
  };

  const getResultsData = () => {
    let correct = 0;
    quiz.questions.forEach((q, index) => {
      if (answers[index] === q.correct_answer) {
        correct++;
      }
    });
    const score = Math.round((correct / quiz.questions.length) * 100);
    const passed = score >= quiz.passing_score;
    return { correct, total: quiz.questions.length, score, passed };
  };

  if (showResults) {
    const results = getResultsData();

    return (
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {results.passed ? (
              <div className="h-20 w-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                <Trophy className="h-10 w-10 text-green-500" />
              </div>
            ) : (
              <div className="h-20 w-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
                <XCircle className="h-10 w-10 text-red-500" />
              </div>
            )}
          </div>
          <CardTitle className="text-2xl">
            {results.passed ? '🎉 Félicitations !' : '😔 Pas encore...'}
          </CardTitle>
          <CardDescription>
            {results.passed 
              ? 'Vous avez réussi le quiz !' 
              : `Il vous faut ${quiz.passing_score}% pour valider (vous avez ${results.score}%)`
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold">{results.score}%</div>
              <div className="text-sm text-muted-foreground">Score</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{results.correct}/{results.total}</div>
              <div className="text-sm text-muted-foreground">Correctes</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{Math.floor((Date.now() - startTime) / 1000)}s</div>
              <div className="text-sm text-muted-foreground">Temps</div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold">Détails des réponses</h3>
            {quiz.questions.map((q, index) => {
              const userAnswer = answers[index];
              const isCorrect = userAnswer === q.correct_answer;

              return (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                  {isCorrect ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 space-y-1">
                    <p className="font-medium text-sm">{q.question}</p>
                    {!isCorrect && (
                      <p className="text-xs text-muted-foreground">
                        Bonne réponse: {q.options[q.correct_answer]}
                      </p>
                    )}
                    {q.explanation && (
                      <p className="text-xs text-muted-foreground italic">{q.explanation}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {!results.passed && (
            <Button className="w-full" onClick={() => window.location.reload()}>
              Réessayer
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <Badge variant="outline">{currentQuestionIndex + 1}/{quiz.questions.length}</Badge>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            {Math.floor((Date.now() - startTime) / 1000)}s
          </div>
        </div>
        <Progress value={progress} className="mb-4" />
        <CardTitle>{currentQuestion.question}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup value={selectedAnswer?.toString()} onValueChange={(v) => handleAnswerSelect(parseInt(v))}>
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <div key={index} className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-accent cursor-pointer transition-colors">
                <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </div>
        </RadioGroup>

        <Button 
          className="w-full" 
          onClick={handleNext}
          disabled={selectedAnswer === null}
        >
          {isLastQuestion ? 'Terminer le quiz' : 'Question suivante'}
        </Button>
      </CardContent>
    </Card>
  );
}
