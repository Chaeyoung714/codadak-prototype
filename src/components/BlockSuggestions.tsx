import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Code, Zap, Hash, Type } from 'lucide-react';

interface BlockSuggestionsProps {
  input: string;
  language: string;
  code: string; // 전체 코드를 받아서 변수명 추출
  onBlockSelect: (block: string, completion: string) => void;
}

export const BlockSuggestions = ({ input, language, code, onBlockSelect }: BlockSuggestionsProps) => {
  // 코드에서 변수명 추출하는 함수 - 파이썬 성능 최적화
  const extractVariables = (code: string, language: string): string[] => {
    const variables = new Set<string>();
    
    if (language === 'python') {
      // 파이썬 예약어 목록 (성능을 위해 Set 사용)
      const pythonKeywords = new Set([
        'if', 'else', 'elif', 'for', 'while', 'def', 'class', 'import', 'from',
        'return', 'try', 'except', 'finally', 'with', 'as', 'pass', 'break',
        'continue', 'and', 'or', 'not', 'in', 'is', 'True', 'False', 'None'
      ]);
      
      // 한 번에 모든 패턴을 처리하는 통합 정규식 (성능 개선)
      const combinedPattern = /(?:^[ \t]*([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:\+|-)=)|(?:^[ \t]*([a-zA-Z_][a-zA-Z0-9_]*)\s*[*/]=)|(?:^[ \t]*([a-zA-Z_][a-zA-Z0-9_]*)\s*=(?!=))|(?:for\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+in)|(?:def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\()|(?:class\s+([a-zA-Z_][a-zA-Z0-9_]*))/gm;
      
      let match;
      while ((match = combinedPattern.exec(code)) !== null) {
        // match[1] ~ match[6] 중 하나가 매치됨
        const varName = match[1] || match[2] || match[3] || match[4] || match[5] || match[6];
        
        if (varName && 
            varName.length > 1 && 
            !pythonKeywords.has(varName) &&
            !varName.startsWith('_') && // private 변수 제외
            !/^\d/.test(varName)) { // 숫자로 시작하는 것 제외
          variables.add(varName);
        }
      }
      
      // 함수 매개변수도 추출 (성능 최적화된 방식)
      const funcParamPattern = /def\s+[a-zA-Z_][a-zA-Z0-9_]*\s*\(([^)]*)\)/g;
      let funcMatch;
      while ((funcMatch = funcParamPattern.exec(code)) !== null) {
        const params = funcMatch[1];
        if (params) {
          // 매개변수를 ,로 분리하고 각각 처리
          params.split(',').forEach(param => {
            const cleanParam = param.trim().split('=')[0].trim(); // 기본값 제거
            if (cleanParam && 
                /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(cleanParam) && 
                !pythonKeywords.has(cleanParam)) {
              variables.add(cleanParam);
            }
          });
        }
      }
      
    } else if (language === 'javascript') {
      // JavaScript 변수 선언 패턴들
      const patterns = [
        /(?:var|let|const)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g, // var, let, const 선언
        /^\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/gm, // 기본 할당
        /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g, // 함수 선언
        /class\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g, // 클래스 선언
      ];
      
      patterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(code)) !== null) {
          const varName = match[1];
          if (varName && varName.length > 1) {
            variables.add(varName);
          }
        }
      });
    }
    
    return Array.from(variables);
  };

  const getSuggestions = () => {
    const suggestions: Array<{
      block: string;
      completion: string;
      type: 'keyword' | 'function' | 'variable' | 'method';
    }> = [];

    // 기존 변수명들을 추출
    const declaredVariables = extractVariables(code, language);

    if (language === 'python') {
      if (input.toLowerCase().startsWith('f') || input === '') {
        suggestions.push(
          { block: 'for', completion: ' i in range():\n    ', type: 'keyword' },
          { block: 'function', completion: ' name():\n    return ', type: 'keyword' },
          { block: 'from', completion: ' module import ', type: 'keyword' }
        );
      }

      if (input.toLowerCase().startsWith('i') || input === '') {
        suggestions.push(
          { block: 'if', completion: ' condition:\n    ', type: 'keyword' },
          { block: 'import', completion: ' module', type: 'keyword' },
          { block: 'in', completion: ' range():', type: 'keyword' }
        );
      }

      if (input.toLowerCase().startsWith('w') || input === '') {
        suggestions.push(
          { block: 'while', completion: ' condition:\n    ', type: 'keyword' },
          { block: 'with', completion: ' open() as file:\n    ', type: 'keyword' }
        );
      }

      if (input.toLowerCase().startsWith('r') || input === '') {
        suggestions.push(
          { block: 'return', completion: ' value', type: 'keyword' },
          { block: 'range', completion: '(10)', type: 'function' }
        );
      }

      if (input.toLowerCase().startsWith('p') || input === '') {
        suggestions.push(
          { block: 'print', completion: '("")', type: 'function' },
          { block: 'pass', completion: '', type: 'keyword' }
        );
      }

      if (input.toLowerCase().startsWith('e') || input === '') {
        suggestions.push(
          { block: 'else', completion: ':\n    ', type: 'keyword' },
          { block: 'elif', completion: ' condition:\n    ', type: 'keyword' },
          { block: 'except', completion: ' Exception:\n    ', type: 'keyword' }
        );
      }

      if (input.toLowerCase().startsWith('t') || input === '') {
        suggestions.push(
          { block: 'try', completion: ':\n    \nexcept Exception:\n    ', type: 'keyword' },
          { block: 'True', completion: '', type: 'keyword' }
        );
      }
    }

    // JavaScript 추천
    if (language === 'javascript') {
      if (input.toLowerCase().startsWith('f') || input === '') {
        suggestions.push(
          { block: 'function', completion: ' name() {\n    \n}', type: 'keyword' },
          { block: 'for', completion: ' (let i = 0; i < length; i++) {\n    \n}', type: 'keyword' }
        );
      }
      
      if (input.toLowerCase().startsWith('c') || input === '') {
        suggestions.push(
          { block: 'console.log', completion: '("")', type: 'function' },
          { block: 'const', completion: ' variable = ', type: 'keyword' }
        );
      }
    }

    // 선언된 변수들을 추천에 추가 (성능 최적화: 입력이 있을 때만 필터링)
    const inputLower = input.toLowerCase();
    declaredVariables.forEach(varName => {
      if (inputLower === '' || varName.toLowerCase().includes(inputLower)) {
        suggestions.push({
          block: varName,
          completion: '',
          type: 'variable'
        });
      }
    });

    return suggestions.filter(s => 
      inputLower === '' || s.block.toLowerCase().includes(inputLower)
    ).slice(0, 8); // 더 많은 추천을 보여주기 위해 8개로 증가
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'keyword': return 'bg-purple-500/20 text-purple-300';
      case 'function': return 'bg-blue-500/20 text-blue-300';
      case 'variable': return 'bg-green-500/20 text-green-300';
      case 'method': return 'bg-yellow-500/20 text-yellow-300';
      default: return 'bg-gray-500/20 text-gray-300';
    }
  };

  const suggestions = getSuggestions();

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <>
      {suggestions.map((suggestion, index) => (
        <Button
          key={index}
          variant="ghost"
          size="sm"
          className="h-8 px-3 hover:bg-primary/10 shrink-0"
          onClick={() => onBlockSelect(suggestion.block, suggestion.completion)}
        >
          <Badge variant="secondary" className={`text-xs ${getTypeColor(suggestion.type)}`}>
            {suggestion.block}
          </Badge>
        </Button>
      ))}
    </>
  );
};
