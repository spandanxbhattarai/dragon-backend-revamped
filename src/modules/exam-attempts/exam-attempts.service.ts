import { startAttemptService } from './services/start-attempt.service';
import { saveAnswerService } from './services/save-answer.service';
import { submitAttemptService } from './services/submit-attempt.service';
import { attemptsHistoryService } from './services/attempts-history.service';

// Aggregator — controller depends on a single service object.
// Business logic lives in the dedicated files under ./services/.
export const examAttemptsService = {
  startAttempt: startAttemptService.start,
  saveAnswer: saveAnswerService.save,
  flagQuestion: saveAnswerService.flag,
  submitAttempt: submitAttemptService.submit,
  getHistory: attemptsHistoryService.getHistory,
  getAttemptDetail: attemptsHistoryService.getAttemptDetail,
  getExamAttempts: attemptsHistoryService.getExamAttempts,
  listAllAttempts: attemptsHistoryService.listAllAttempts,
};
