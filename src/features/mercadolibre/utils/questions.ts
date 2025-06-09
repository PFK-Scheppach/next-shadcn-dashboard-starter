import {
  fetchQuestions,
  fetchQuestionsByDateRange,
  answerQuestion,
  type MercadoLibreQuestion
} from '@/lib/mercadolibre';

export interface QuestionWithStatus extends MercadoLibreQuestion {
  isAnswered: boolean;
  timeAgo: string;
}

export async function getQuestions(): Promise<QuestionWithStatus[]> {
  try {
    const questions = await fetchQuestions();

    return questions
      .map((question) => ({
        ...question,
        isAnswered: !!question.answer,
        timeAgo: formatQuestionDate(question.date_created)
      }))
      .sort((a, b) => {
        // Sort by status (unanswered first) then by date (newest first)
        if (a.isAnswered !== b.isAnswered) {
          return a.isAnswered ? 1 : -1;
        }
        return (
          new Date(b.date_created).getTime() -
          new Date(a.date_created).getTime()
        );
      });
  } catch (error) {
    console.error('Error getting questions:', error);
    return [];
  }
}

export async function getQuestionsByDateRange(
  fromDate?: Date,
  toDate?: Date
): Promise<QuestionWithStatus[]> {
  try {
    const questions = await fetchQuestionsByDateRange(fromDate, toDate);

    return questions
      .map((question) => ({
        ...question,
        isAnswered: !!question.answer,
        timeAgo: formatQuestionDate(question.date_created)
      }))
      .sort((a, b) => {
        // Sort by status (unanswered first) then by date (newest first)
        if (a.isAnswered !== b.isAnswered) {
          return a.isAnswered ? 1 : -1;
        }
        return (
          new Date(b.date_created).getTime() -
          new Date(a.date_created).getTime()
        );
      });
  } catch (error) {
    console.error('Error getting questions by date range:', error);
    return [];
  }
}

export async function replyToQuestion(
  questionId: number,
  answer: string
): Promise<boolean> {
  try {
    return await answerQuestion(questionId, answer);
  } catch (error) {
    console.error('Error replying to question:', error);
    return false;
  }
}

export function getUnansweredCount(questions: QuestionWithStatus[]): number {
  return questions.filter((q) => !q.isAnswered).length;
}

export function formatQuestionDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = (now.getTime() - date.getTime()) / (1000 * 60);

  if (diffInMinutes < 1) {
    return 'Ahora mismo';
  } else if (diffInMinutes < 60) {
    return `Hace ${Math.floor(diffInMinutes)} minutos`;
  } else if (diffInMinutes < 1440) {
    // 24 hours
    return `Hace ${Math.floor(diffInMinutes / 60)} horas`;
  } else {
    const days = Math.floor(diffInMinutes / 1440);
    return `Hace ${days} día${days > 1 ? 's' : ''}`;
  }
}

export function getQuestionStatusColor(question: QuestionWithStatus): string {
  if (question.isAnswered) {
    return 'text-green-600 bg-green-50';
  }

  // Check if question is urgent (older than 24 hours without answer)
  const hoursSinceAsked =
    (new Date().getTime() - new Date(question.date_created).getTime()) /
    (1000 * 60 * 60);

  if (hoursSinceAsked > 24) {
    return 'text-red-600 bg-red-50';
  }

  return 'text-yellow-600 bg-yellow-50';
}

export function getQuestionStatusText(question: QuestionWithStatus): string {
  if (question.isAnswered) {
    return 'Respondida';
  }

  const hoursSinceAsked =
    (new Date().getTime() - new Date(question.date_created).getTime()) /
    (1000 * 60 * 60);

  if (hoursSinceAsked > 24) {
    return 'Urgente';
  }

  return 'Pendiente';
}
