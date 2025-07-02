import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Code, Zap, Hash, Type } from 'lucide-react';

interface BlockSuggestionsProps {
  input: string;
  language: string;
  code: string; // 전체 코드를 받아서 변수명 추출
  onBlockSelect: (block: string, completion: string) => void;
  cursorLine: number; // 커서가 위치한 줄 번호 (0-indexed)
}

export const BlockSuggestions = ({ input, language, code, onBlockSelect, cursorLine }: BlockSuggestionsProps) => {
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

    // 커서가 위치한 줄의 맥락 분석
    const lines = code.split('\n');
    const currentLineText = lines[cursorLine]?.trim() || '';
    const prevLineText = lines[cursorLine - 1]?.trim() || '';

    // 맥락 기반 추천 우선순위 (Python 기준)
    if (language === 'python') {
      // 1. 함수/클래스/반복문/조건문 블록 직후
      if (/^def .+:$/.test(currentLineText) || /^class .+:$/.test(currentLineText)) {
        suggestions.push(
          { block: 'return', completion: ' ', type: 'keyword' },
          { block: 'pass', completion: '', type: 'keyword' },
          { block: 'for', completion: ' i in range():\n    ', type: 'keyword' },
          { block: 'if', completion: ' condition:\n    ', type: 'keyword' }
        );
      } else if (/^(for|while) .+:$/.test(currentLineText)) {
        suggestions.push(
          { block: 'break', completion: '', type: 'keyword' },
          { block: 'continue', completion: '', type: 'keyword' },
          { block: 'if', completion: ' condition:\n    ', type: 'keyword' },
          { block: 'pass', completion: '', type: 'keyword' }
        );
      } else if (/^(if|elif) .+:$/.test(currentLineText)) {
        suggestions.push(
          { block: 'else', completion: ':\n    ', type: 'keyword' },
          { block: 'elif', completion: ' condition:\n    ', type: 'keyword' },
          { block: 'pass', completion: '', type: 'keyword' },
          { block: 'return', completion: ' ', type: 'keyword' }
        );
      } else if (currentLineText === '' && (cursorLine === 0 || lines.slice(0, cursorLine).every(l => l.trim() === ''))) {
        // 2. 완전 빈 줄(파일 처음 등)
        suggestions.push(
          { block: 'def', completion: ' function():\n    ', type: 'keyword' },
          { block: 'for', completion: ' i in range():\n    ', type: 'keyword' },
          { block: 'if', completion: ' condition:\n    ', type: 'keyword' },
          { block: 'class', completion: ' MyClass:\n    ', type: 'keyword' },
          { block: 'import', completion: ' module', type: 'keyword' }
        );
      }
      // 입력 기반 추천(기존 로직 유지, 단 중복 제거)
      const inputLower = input.toLowerCase();
      const already = new Set(suggestions.map(s => s.block));
      if (inputLower === '' || inputLower === undefined) {
        // 대표 블록 항상 추가
        [
          { block: 'for', completion: ' i in range():\n    ', type: 'keyword' },
          { block: 'if', completion: ' condition:\n    ', type: 'keyword' },
          { block: 'def', completion: ' function():\n    ', type: 'keyword' },
          { block: 'class', completion: ' MyClass:\n    ', type: 'keyword' },
          { block: 'import', completion: ' module', type: 'keyword' }
        ].forEach(s => { if (!already.has(s.block)) suggestions.push(s); });
      }
      // 기존 입력 기반 추천(중복 제거)
      if (inputLower) {
        if (inputLower.startsWith('f')) {
          if (!already.has('for')) suggestions.push({ block: 'for', completion: ' i in range():\n    ', type: 'keyword' });
          if (!already.has('function')) suggestions.push({ block: 'function', completion: ' name():\n    return ', type: 'keyword' });
          if (!already.has('from')) suggestions.push({ block: 'from', completion: ' module import ', type: 'keyword' });
        }
        if (inputLower.startsWith('i')) {
          if (!already.has('if')) suggestions.push({ block: 'if', completion: ' condition:\n    ', type: 'keyword' });
          if (!already.has('import')) suggestions.push({ block: 'import', completion: ' module', type: 'keyword' });
          if (!already.has('in')) suggestions.push({ block: 'in', completion: ' range():', type: 'keyword' });
        }
        if (inputLower.startsWith('w')) {
          if (!already.has('while')) suggestions.push({ block: 'while', completion: ' condition:\n    ', type: 'keyword' });
          if (!already.has('with')) suggestions.push({ block: 'with', completion: ' open() as file:\n    ', type: 'keyword' });
        }
        if (inputLower.startsWith('r')) {
          if (!already.has('return')) suggestions.push({ block: 'return', completion: ' value', type: 'keyword' });
          if (!already.has('range')) suggestions.push({ block: 'range', completion: '(10)', type: 'function' });
        }
        if (inputLower.startsWith('p')) {
          if (!already.has('print')) suggestions.push({ block: 'print', completion: '("")', type: 'function' });
          if (!already.has('pass')) suggestions.push({ block: 'pass', completion: '', type: 'keyword' });
        }
        if (inputLower.startsWith('e')) {
          if (!already.has('else')) suggestions.push({ block: 'else', completion: ':\n    ', type: 'keyword' });
          if (!already.has('elif')) suggestions.push({ block: 'elif', completion: ' condition:\n    ', type: 'keyword' });
          if (!already.has('except')) suggestions.push({ block: 'except', completion: ' Exception:\n    ', type: 'keyword' });
        }
        if (inputLower.startsWith('t')) {
          if (!already.has('try')) suggestions.push({ block: 'try', completion: ':\n    \nexcept Exception:\n    ', type: 'keyword' });
          if (!already.has('True')) suggestions.push({ block: 'True', completion: '', type: 'keyword' });
        }
      }
      // 변수명 추천(중복 제거)
      declaredVariables.forEach(varName => {
        if ((inputLower === '' || varName.toLowerCase().includes(inputLower)) && !already.has(varName)) {
          suggestions.push({ block: varName, completion: '', type: 'variable' });
        }
      });
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

    return suggestions.slice(0, 8);
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
