import { buildPrompt, extractSources } from '../src/services/llm';
import { PineconeMatch } from '../src/types';

describe('buildPrompt', () => {
  const createMatch = (
    id: string,
    score: number,
    docId: string,
    title: string,
    chunkText: string
  ): PineconeMatch => ({
    id,
    score,
    metadata: { docId, title, chunkText },
  });

  describe('with matches', () => {
    it('should include all context chunks in prompt', () => {
      const matches: PineconeMatch[] = [
        createMatch('1', 0.9, 'd1', 'Doc 1', 'Text from document 1'),
        createMatch('2', 0.8, 'd2', 'Doc 2', 'Text from document 2'),
      ];
      
      const prompt = buildPrompt('What is X?', matches);
      
      expect(prompt).toContain('Text from document 1');
      expect(prompt).toContain('Text from document 2');
      expect(prompt).toContain('What is X?');
    });

    it('should include document titles in context', () => {
      const matches: PineconeMatch[] = [
        createMatch('1', 0.9, 'd1', 'Policy Document', 'Content here'),
        createMatch('2', 0.85, 'd2', 'User Guide', 'More content'),
      ];
      
      const prompt = buildPrompt('Question?', matches);
      
      expect(prompt).toContain('Policy Document');
      expect(prompt).toContain('User Guide');
    });

    it('should include relevance scores', () => {
      const matches: PineconeMatch[] = [
        createMatch('1', 0.95, 'd1', 'Doc', 'Text'),
      ];
      
      const prompt = buildPrompt('Question?', matches);
      
      expect(prompt).toContain('95.0%');
    });

    it('should number context chunks', () => {
      const matches: PineconeMatch[] = [
        createMatch('1', 0.9, 'd1', 'Doc 1', 'First'),
        createMatch('2', 0.8, 'd2', 'Doc 2', 'Second'),
        createMatch('3', 0.7, 'd3', 'Doc 3', 'Third'),
      ];
      
      const prompt = buildPrompt('Question?', matches);
      
      expect(prompt).toContain('[1]');
      expect(prompt).toContain('[2]');
      expect(prompt).toContain('[3]');
    });

    it('should include instructions for answering', () => {
      const matches: PineconeMatch[] = [
        createMatch('1', 0.9, 'd1', 'Doc', 'Text'),
      ];
      
      const prompt = buildPrompt('Question?', matches);
      
      expect(prompt).toContain('context');
      expect(prompt).toContain("don't have enough information");
    });
  });

  describe('with no matches', () => {
    it('should indicate no context was found', () => {
      const prompt = buildPrompt('What is X?', []);
      
      expect(prompt).toContain('No context documents were found');
      expect(prompt).toContain('What is X?');
    });
  });

  describe('prompt structure', () => {
    it('should have question at the end', () => {
      const matches: PineconeMatch[] = [
        createMatch('1', 0.9, 'd1', 'Doc', 'Text'),
      ];
      
      const prompt = buildPrompt('My question here?', matches);
      
      // Question should be at the end of the prompt (after context)
      expect(prompt).toContain('Question: My question here?');
      // The prompt should end with the question line
      expect(prompt.trim().endsWith('Question: My question here?')).toBe(true);
    });

    it('should separate context and question clearly', () => {
      const matches: PineconeMatch[] = [
        createMatch('1', 0.9, 'd1', 'Doc', 'Context text'),
      ];
      
      const prompt = buildPrompt('Question text?', matches);
      
      expect(prompt).toContain('Context:');
      expect(prompt).toContain('Question:');
    });
  });
});

describe('extractSources', () => {
  const createMatch = (
    id: string,
    score: number,
    docId: string,
    title: string
  ): PineconeMatch => ({
    id,
    score,
    metadata: { docId, title, chunkText: 'text' },
  });

  it('should extract unique sources from matches', () => {
    const matches: PineconeMatch[] = [
      createMatch('1', 0.9, 'doc-1', 'First Document'),
      createMatch('2', 0.8, 'doc-2', 'Second Document'),
    ];
    
    const sources = extractSources(matches);
    
    expect(sources).toHaveLength(2);
    expect(sources).toContainEqual({ docId: 'doc-1', title: 'First Document' });
    expect(sources).toContainEqual({ docId: 'doc-2', title: 'Second Document' });
  });

  it('should deduplicate sources by docId', () => {
    const matches: PineconeMatch[] = [
      createMatch('chunk-1', 0.9, 'doc-1', 'Document'),
      createMatch('chunk-2', 0.85, 'doc-1', 'Document'),
      createMatch('chunk-3', 0.8, 'doc-1', 'Document'),
    ];
    
    const sources = extractSources(matches);
    
    expect(sources).toHaveLength(1);
    expect(sources[0]).toEqual({ docId: 'doc-1', title: 'Document' });
  });

  it('should handle empty matches', () => {
    const sources = extractSources([]);
    expect(sources).toHaveLength(0);
  });

  it('should preserve order of first occurrence', () => {
    const matches: PineconeMatch[] = [
      createMatch('1', 0.95, 'doc-a', 'Doc A'),
      createMatch('2', 0.9, 'doc-b', 'Doc B'),
      createMatch('3', 0.85, 'doc-a', 'Doc A'),
      createMatch('4', 0.8, 'doc-c', 'Doc C'),
    ];
    
    const sources = extractSources(matches);
    
    expect(sources).toHaveLength(3);
    expect(sources[0].docId).toBe('doc-a');
    expect(sources[1].docId).toBe('doc-b');
    expect(sources[2].docId).toBe('doc-c');
  });
});

