import { persistAnswer, syncOfflineAnswers } from '../src/features/survey-engine/persistence/syncer';
import { db } from '../src/services/db';
import { api } from '../src/services/api';

jest.mock('../src/services/db', () => {
  const mockAnswers: any[] = [];
  const mockAnswersTable = {
    put: jest.fn(async (payload) => {
      mockAnswers.push(payload);
    }),
    update: jest.fn(async (id, update) => {
      const match = mockAnswers.find(a => a.id === id);
      if (match) {
        Object.assign(match, update);
      }
    }),
    where: jest.fn(() => ({
      equals: jest.fn(() => ({
        sortBy: jest.fn(() => {
          // Sort mock answers where synced == 0 by created_at
          return Promise.resolve(
            mockAnswers
              .filter(a => a.synced === 0)
              .sort((a, b) => a.created_at - b.created_at)
          );
        }),
      })),
    })),
    _mockAnswers: mockAnswers, // Helper to inspect the mock array
    _clearMockAnswers: () => {
      mockAnswers.length = 0;
    }
  };
  return {
    db: {
      answers: mockAnswersTable,
    },
  };
});

jest.mock('../src/services/api', () => {
  return {
    api: {
      post: jest.fn(),
    },
  };
});

describe('Automatic Offline Re-Synchronization Tests', () => {
  const mockPayload = {
    session_id: 'session-123',
    question_id: 'q-5',
    answer_value: 'Yes, it works',
    is_confirmed: true,
    confidence_score: 0.95,
  };

  beforeEach(() => {
    (db.answers as any)._clearMockAnswers();
    jest.clearAllMocks();
  });

  test('persistAnswer saves locally with synced: 0 and created_at', async () => {
    (api.post as jest.Mock).mockResolvedValue({ status: 200 });

    await persistAnswer(mockPayload);

    const answers = (db.answers as any)._mockAnswers;
    expect(answers.length).toBe(1);
    expect(answers[0].synced).toBe(1); // Set to 1 because API succeeded
    expect(answers[0].created_at).toBeGreaterThan(0);
    expect(api.post).toHaveBeenCalledTimes(1);
    expect(db.answers.update).toHaveBeenCalledTimes(1);
  });

  test('persistAnswer preserves synced: 0 on network sync failure', async () => {
    (api.post as jest.Mock).mockRejectedValue(new Error('Network offline'));

    await persistAnswer(mockPayload);

    const answers = (db.answers as any)._mockAnswers;
    expect(answers.length).toBe(1);
    expect(answers[0].synced).toBe(0); // Set to 0 because API failed
    expect(db.answers.update).not.toHaveBeenCalled();
  });

  test('syncOfflineAnswers processes unsynced items chronologically and sets synced: 1', async () => {
    const answers = (db.answers as any)._mockAnswers;
    
    // Add two fake unsynced answers, one earlier than the other
    answers.push({
      id: 'ans-old',
      session_id: 'session-123',
      question_id: 'q-1',
      answer_value: JSON.stringify('First response'),
      is_confirmed: 1,
      confidence_score: 1.0,
      synced: 0,
      created_at: 1000, // Older timestamp
    });

    answers.push({
      id: 'ans-new',
      session_id: 'session-123',
      question_id: 'q-2',
      answer_value: JSON.stringify('Second response'),
      is_confirmed: 1,
      confidence_score: 1.0,
      synced: 0,
      created_at: 5000, // Newer timestamp
    });

    (api.post as jest.Mock).mockResolvedValue({ status: 200 });

    // Run sync
    await syncOfflineAnswers();

    // Verify chronological order of API calls
    expect(api.post).toHaveBeenCalledTimes(2);
    expect((api.post as jest.Mock).mock.calls[0][1].question).toBe('q-1'); // Old first
    expect((api.post as jest.Mock).mock.calls[1][1].question).toBe('q-2'); // New second

    // Both should now be marked synced
    expect(answers[0].synced).toBe(1);
    expect(answers[1].synced).toBe(1);
  });

  test('syncOfflineAnswers handles lock to prevent duplicate concurrent uploads', async () => {
    const answers = (db.answers as any)._mockAnswers;
    
    answers.push({
      id: 'ans-lock',
      session_id: 'session-123',
      question_id: 'q-1',
      answer_value: JSON.stringify('Duplicate test'),
      is_confirmed: 1,
      confidence_score: 1.0,
      synced: 0,
      created_at: 1000,
    });

    // Make API request take some time to resolve
    let apiCallCount = 0;
    (api.post as jest.Mock).mockImplementation(() => {
      apiCallCount++;
      return new Promise(resolve => setTimeout(resolve, 50));
    });

    // Fire off two sync operations concurrently
    const sync1 = syncOfflineAnswers();
    const sync2 = syncOfflineAnswers();

    await Promise.all([sync1, sync2]);

    // Ensure api was called only ONCE for that answer because of lock
    expect(apiCallCount).toBe(1);
    expect(answers[0].synced).toBe(1);
  });
});
