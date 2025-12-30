import { validateIngestRequest, validateAskRequest } from '../src/utils/validation';

describe('validateIngestRequest', () => {
  describe('valid inputs', () => {
    it('should accept valid single document', () => {
      const input = {
        documents: [
          { id: 'doc-1', title: 'Title', content: 'Content' },
        ],
      };
      
      expect(() => validateIngestRequest(input)).not.toThrow();
      const result = validateIngestRequest(input);
      expect(result.documents).toHaveLength(1);
    });

    it('should accept multiple documents', () => {
      const input = {
        documents: [
          { id: 'doc-1', title: 'Title 1', content: 'Content 1' },
          { id: 'doc-2', title: 'Title 2', content: 'Content 2' },
        ],
      };
      
      const result = validateIngestRequest(input);
      expect(result.documents).toHaveLength(2);
    });

    it('should accept document IDs with dashes and underscores', () => {
      const input = {
        documents: [
          { id: 'my-doc_id-123', title: 'Title', content: 'Content' },
        ],
      };
      
      expect(() => validateIngestRequest(input)).not.toThrow();
    });

    it('should accept alphanumeric document IDs', () => {
      const input = {
        documents: [
          { id: 'Doc123ABC', title: 'Title', content: 'Content' },
        ],
      };
      
      expect(() => validateIngestRequest(input)).not.toThrow();
    });
  });

  describe('invalid inputs', () => {
    it('should reject empty documents array', () => {
      expect(() => validateIngestRequest({ documents: [] })).toThrow();
    });

    it('should reject missing documents field', () => {
      expect(() => validateIngestRequest({})).toThrow();
    });

    it('should reject document ID with spaces', () => {
      const input = {
        documents: [
          { id: 'has spaces', title: 'Title', content: 'Content' },
        ],
      };
      
      expect(() => validateIngestRequest(input)).toThrow();
    });

    it('should reject document ID with special characters', () => {
      const input = {
        documents: [
          { id: 'doc@#$', title: 'Title', content: 'Content' },
        ],
      };
      
      expect(() => validateIngestRequest(input)).toThrow();
    });

    it('should reject empty document ID', () => {
      const input = {
        documents: [
          { id: '', title: 'Title', content: 'Content' },
        ],
      };
      
      expect(() => validateIngestRequest(input)).toThrow();
    });

    it('should reject empty title', () => {
      const input = {
        documents: [
          { id: 'doc-1', title: '', content: 'Content' },
        ],
      };
      
      expect(() => validateIngestRequest(input)).toThrow();
    });

    it('should reject empty content', () => {
      const input = {
        documents: [
          { id: 'doc-1', title: 'Title', content: '' },
        ],
      };
      
      expect(() => validateIngestRequest(input)).toThrow();
    });

    it('should reject too many documents (>10)', () => {
      const documents = Array.from({ length: 11 }, (_, i) => ({
        id: `doc-${i}`,
        title: `Title ${i}`,
        content: `Content ${i}`,
      }));
      
      expect(() => validateIngestRequest({ documents })).toThrow();
    });

    it('should reject document ID exceeding max length', () => {
      const input = {
        documents: [
          { id: 'a'.repeat(101), title: 'Title', content: 'Content' },
        ],
      };
      
      expect(() => validateIngestRequest(input)).toThrow();
    });

    it('should reject title exceeding max length', () => {
      const input = {
        documents: [
          { id: 'doc-1', title: 'a'.repeat(201), content: 'Content' },
        ],
      };
      
      expect(() => validateIngestRequest(input)).toThrow();
    });

    it('should reject content exceeding max length', () => {
      const input = {
        documents: [
          { id: 'doc-1', title: 'Title', content: 'a'.repeat(50001) },
        ],
      };
      
      expect(() => validateIngestRequest(input)).toThrow();
    });
  });
});

describe('validateAskRequest', () => {
  describe('valid inputs', () => {
    it('should accept valid question', () => {
      const result = validateAskRequest({ question: 'What is the refund policy?' });
      
      expect(result.question).toBe('What is the refund policy?');
    });

    it('should use default topK of 3', () => {
      const result = validateAskRequest({ question: 'Question?' });
      
      expect(result.topK).toBe(3);
    });

    it('should accept custom topK', () => {
      const result = validateAskRequest({ question: 'Question?', topK: 5 });
      
      expect(result.topK).toBe(5);
    });

    it('should accept topK of 1', () => {
      const result = validateAskRequest({ question: 'Question?', topK: 1 });
      
      expect(result.topK).toBe(1);
    });

    it('should accept topK of 10', () => {
      const result = validateAskRequest({ question: 'Question?', topK: 10 });
      
      expect(result.topK).toBe(10);
    });
  });

  describe('invalid inputs', () => {
    it('should reject empty question', () => {
      expect(() => validateAskRequest({ question: '' })).toThrow();
    });

    it('should reject missing question', () => {
      expect(() => validateAskRequest({})).toThrow();
    });

    it('should reject topK less than 1', () => {
      expect(() => validateAskRequest({ question: 'Q?', topK: 0 })).toThrow();
    });

    it('should reject topK greater than 10', () => {
      expect(() => validateAskRequest({ question: 'Q?', topK: 15 })).toThrow();
    });

    it('should reject non-integer topK', () => {
      expect(() => validateAskRequest({ question: 'Q?', topK: 3.5 })).toThrow();
    });

    it('should reject negative topK', () => {
      expect(() => validateAskRequest({ question: 'Q?', topK: -1 })).toThrow();
    });

    it('should reject question exceeding max length', () => {
      expect(() => validateAskRequest({ question: 'a'.repeat(1001) })).toThrow();
    });
  });

  describe('edge cases', () => {
    it('should accept single character question', () => {
      const result = validateAskRequest({ question: '?' });
      expect(result.question).toBe('?');
    });

    it('should accept question at max length', () => {
      const question = 'a'.repeat(1000);
      const result = validateAskRequest({ question });
      expect(result.question).toBe(question);
    });
  });
});

