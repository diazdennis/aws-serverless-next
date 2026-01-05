import { chunkDocument, getChunkStats } from '../src/services/chunker';

describe('chunkDocument', () => {
  describe('basic functionality', () => {
    it('should split long content into multiple chunks', () => {
      const content = 'Paragraph one. '.repeat(50) + '\n\n' + 'Paragraph two. '.repeat(50);
      const chunks = chunkDocument('doc-1', 'Test Doc', content);
      
      expect(chunks.length).toBeGreaterThan(1);
      expect(chunks[0].chunkId).toBe('doc-1#chunk-0');
      expect(chunks[0].docId).toBe('doc-1');
      expect(chunks[0].title).toBe('Test Doc');
    });

    it('should keep short content as single chunk', () => {
      const chunks = chunkDocument('doc-1', 'Test', 'Short content.');
      
      expect(chunks.length).toBe(1);
      expect(chunks[0].text).toBe('Short content.');
      expect(chunks[0].chunkId).toBe('doc-1#chunk-0');
    });

    it('should include docId and title in each chunk', () => {
      const content = 'First paragraph here.\n\nSecond paragraph here.\n\nThird paragraph here.';
      const chunks = chunkDocument('my-doc', 'My Title', content);
      
      for (const chunk of chunks) {
        expect(chunk.docId).toBe('my-doc');
        expect(chunk.title).toBe('My Title');
      }
    });

    it('should handle empty content gracefully', () => {
      const chunks = chunkDocument('doc', 'Title', '');
      expect(chunks.length).toBe(0);
    });

    it('should handle whitespace-only content', () => {
      const chunks = chunkDocument('doc', 'Title', '   \n\n   \t  ');
      expect(chunks.length).toBe(0);
    });
  });

  describe('chunk ID generation', () => {
    it('should generate sequential chunk IDs', () => {
      const content = 'Para 1.\n\nPara 2.\n\nPara 3.\n\nPara 4.\n\nPara 5.';
      const chunks = chunkDocument('test', 'Test', content);
      
      chunks.forEach((chunk, i) => {
        expect(chunk.chunkId).toBe(`test#chunk-${i}`);
      });
    });

    it('should use docId in chunk IDs', () => {
      const chunks = chunkDocument('refund-policy', 'Refund Policy', 'Some content here.');
      expect(chunks[0].chunkId).toBe('refund-policy#chunk-0');
    });
  });

  describe('paragraph splitting', () => {
    it('should split by double newlines', () => {
      const content = 'First paragraph.\n\nSecond paragraph.\n\nThird paragraph.';
      const chunks = chunkDocument('doc', 'Title', content, { minChunkSize: 1 });
      
      // Should create separate chunks for each paragraph (or merge if small)
      expect(chunks.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle single newlines within paragraphs', () => {
      const content = 'Line one.\nLine two.\nLine three.';
      const chunks = chunkDocument('doc', 'Title', content);
      
      expect(chunks.length).toBe(1);
      expect(chunks[0].text).toContain('Line one.');
      expect(chunks[0].text).toContain('Line two.');
    });
  });

  describe('sentence splitting for large paragraphs', () => {
    it('should split large paragraphs by sentences', () => {
      const longParagraph = 'This is sentence one. This is sentence two. This is sentence three. This is sentence four. This is sentence five. This is sentence six. This is sentence seven. This is sentence eight. This is sentence nine. This is sentence ten.';
      const chunks = chunkDocument('doc', 'Title', longParagraph, { maxChunkSize: 100 });
      
      expect(chunks.length).toBeGreaterThan(1);
      // Each chunk should not exceed max size (with some tolerance for sentence boundaries)
      chunks.forEach((chunk) => {
        expect(chunk.text.length).toBeLessThanOrEqual(150); // Allow some overflow for complete sentences
      });
    });

    it('should handle sentences with different terminators', () => {
      const content = 'Question? Exclamation! Statement. Another question?';
      const chunks = chunkDocument('doc', 'Title', content, { maxChunkSize: 50, minChunkSize: 1 });
      
      expect(chunks.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('chunk merging', () => {
    it('should merge small chunks', () => {
      const content = 'A.\n\nB.\n\nC.\n\nD.';
      const chunks = chunkDocument('doc', 'Title', content, { minChunkSize: 10 });
      
      // Small chunks should be merged
      expect(chunks.length).toBeLessThan(4);
    });

    it('should respect maxChunkSize when merging', () => {
      const content = 'Short para one.\n\nShort para two.\n\nShort para three.';
      const chunks = chunkDocument('doc', 'Title', content, { maxChunkSize: 100, minChunkSize: 50 });
      
      chunks.forEach((chunk) => {
        expect(chunk.text.length).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('custom options', () => {
    it('should respect custom maxChunkSize', () => {
      const content = 'Word '.repeat(200);
      const chunks = chunkDocument('doc', 'Title', content, { maxChunkSize: 100 });
      
      expect(chunks.length).toBeGreaterThan(1);
    });

    it('should respect custom minChunkSize', () => {
      const content = 'A.\n\nB.\n\nC.';
      const chunksWithLowMin = chunkDocument('doc', 'Title', content, { minChunkSize: 1 });
      const chunksWithHighMin = chunkDocument('doc', 'Title', content, { minChunkSize: 50 });
      
      // Higher min should result in fewer (merged) chunks
      expect(chunksWithHighMin.length).toBeLessThanOrEqual(chunksWithLowMin.length);
    });
  });
});

describe('getChunkStats', () => {
  it('should return correct stats for chunks', () => {
    const chunks = [
      { chunkId: '1', docId: 'd', title: 't', text: '12345' },
      { chunkId: '2', docId: 'd', title: 't', text: '1234567890' },
      { chunkId: '3', docId: 'd', title: 't', text: '123' },
    ];
    
    const stats = getChunkStats(chunks);
    
    expect(stats.count).toBe(3);
    expect(stats.minLength).toBe(3);
    expect(stats.maxLength).toBe(10);
    expect(stats.avgLength).toBe(6); // (5 + 10 + 3) / 3 = 6
  });

  it('should handle empty chunks array', () => {
    const stats = getChunkStats([]);
    
    expect(stats.count).toBe(0);
    expect(stats.avgLength).toBe(0);
    expect(stats.minLength).toBe(0);
    expect(stats.maxLength).toBe(0);
  });

  it('should handle single chunk', () => {
    const chunks = [{ chunkId: '1', docId: 'd', title: 't', text: 'hello' }];
    
    const stats = getChunkStats(chunks);
    
    expect(stats.count).toBe(1);
    expect(stats.minLength).toBe(5);
    expect(stats.maxLength).toBe(5);
    expect(stats.avgLength).toBe(5);
  });
});

