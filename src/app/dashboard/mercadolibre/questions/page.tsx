import { Suspense } from 'react';
import { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HelpCircle, Clock, User, AlertCircle } from 'lucide-react';
import { 
  getQuestions, 
  getUnansweredCount,
  getQuestionStatusColor,
  getQuestionStatusText
} from '@/features/mercadolibre/utils/questions';
import { MessageReplyForm } from '@/features/mercadolibre/components/message-reply-form';

export const metadata: Metadata = {
  title: 'Preguntas MercadoLibre | Dashboard',
  description: 'Responde las preguntas de tus compradores en MercadoLibre',
};

async function QuestionsList() {
  const questions = await getQuestions();
  const unansweredCount = getUnansweredCount(questions);

  if (questions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <HelpCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No hay preguntas</h3>
          <p className="text-muted-foreground text-center">
            Cuando recibas preguntas de compradores, aparecerán aquí.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {unansweredCount > 0 && (
        <Card className="border-l-4 border-l-red-500 bg-red-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="font-semibold text-red-800">
                Tienes {unansweredCount} pregunta{unansweredCount !== 1 ? 's' : ''} sin responder
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {questions.map((question) => (
        <Card key={question.id} className={`${question.isAnswered ? '' : 'border-l-4 border-l-yellow-500'}`}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {question.from.nickname}
                </CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <Clock className="h-4 w-4" />
                  {question.timeAgo}
                </CardDescription>
              </div>
              <Badge className={getQuestionStatusColor(question)}>
                {getQuestionStatusText(question)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Pregunta:</h4>
              <p className="text-sm">{question.text}</p>
            </div>

            {question.answer && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2 text-blue-800">Tu respuesta:</h4>
                <p className="text-sm text-blue-700">{question.answer.text}</p>
                <span className="text-xs text-blue-600 mt-2 block">
                  Respondido el {new Date(question.answer.date_created).toLocaleDateString('es-ES')}
                </span>
              </div>
            )}

            {!question.isAnswered && (
              <MessageReplyForm
                questionId={question.id}
                recipientName={question.from.nickname}
                placeholder="Escribe tu respuesta aquí..."
                title="Responder Pregunta"
              />
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {[...Array(3)].map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-muted rounded w-1/3"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="h-16 bg-muted rounded"></div>
              <div className="h-32 bg-muted rounded"></div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function QuestionsPage() {
  return (
    <div className="flex-1 space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Preguntas MercadoLibre</h1>
        <p className="text-muted-foreground">
          Responde las preguntas de tus compradores
        </p>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <QuestionsList />
      </Suspense>
    </div>
  );
} 