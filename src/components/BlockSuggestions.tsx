
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Code, Zap, Hash, Type } from 'lucide-react';

interface BlockSuggestionsProps {
  input: string;
  language: string;
  code: string; // 전체 코드를 받아서 변수명 추출
  onBlockSelect: (block: string, completion: string) => void;
}

export const BlockSuggestions = ({ input, language, code, onBlockSelect }: BlockSuggestionsProps) => {
  // 코드에서 변수명 추출하는 함수
  const extractVariables = (code: string, language: string): string[] => {
    const variables = new Set<string>();
    
    if (language === 'python') {
      // Python 변수 선언 패턴들
      const patterns = [
        /^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*=/gm, // 기본 할당: variable = value
        /^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\+=/gm, // 복합 할당: variable += value
        /^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*-=/gm, // variable -= value
        /^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\*=/gm, // variable *= value
        /^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\/=/gm, // variable /= value
        /for\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+in/g, // for 루프: for var in
        /def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g, // 함수 정의: def function_name(
        /class\s+([a-zA-Z_][a-zA-Z0-9_]*)/g, // 클래스 정의: class ClassName
      ];
      
      patterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(code)) !== null) {
          const varName = match[1];
          if (varName && varName.length > 1 && !['if', 'for', 'while', 'def', 'class'].includes(varName)) {
            variables.add(varName);
          }
        }
      });
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
      description: string;
    }> = [];

    // 기존 변수명들을 추출
    const declaredVariables = extractVariables(code, language);

    if (language === 'python') {
      if (input.toLowerCase().startsWith('f') || input === '') {
        suggestions.push(
          { block: 'for', completion: ' i in range():\n    ', type: 'keyword', description: '반복문' },
          { block: 'function', completion: ' name():\n    return ', type: 'keyword', description: '함수 정의' },
          { block: 'from', completion: ' module import ', type: 'keyword', description: '모듈 가져오기' }
        );
      }

      if (input.toLowerCase().startsWith('i') || input === '') {
        suggestions.push(
          { block: 'if', completion: ' condition:\n    ', type: 'keyword', description: '조건문' },
          { block: 'import', completion: ' module', type: 'keyword', description: '모듈 불러오기' },
          { block: 'in', completion: ' range():', type: 'keyword', description: '범위 지정' }
        );
      }

      if (input.toLowerCase().startsWith('w') || input === '') {
        suggestions.push(
          { block: 'while', completion: ' condition:\n    ', type: 'keyword', description: '반복문' },
          { block: 'with', completion: ' open() as file:\n    ', type: 'keyword', description: '파일 처리' }
        );
      }

      if (input.toLowerCase().startsWith('r') || input === '') {
        suggestions.push(
          { block: 'return', completion: ' value', type: 'keyword', description: '값 반환' },
          { block: 'range', completion: '(10)', type: 'function', description: '숫자 범위' }
        );
      }

      if (input.toLowerCase().startsWith('p') || input === '') {
        suggestions.push(
          { block: 'print', completion: '("")', type: 'function', description: '출력' },
          { block: 'pass', completion: '', type: 'keyword', description: '빈 구문' }
        );
      }

      if (input.toLowerCase().startsWith('e') || input === '') {
        suggestions.push(
          { block: 'else', completion: ':\n    ', type: 'keyword', description: '조건문 else' },
          { block: 'elif', completion: ' condition:\n    ', type: 'keyword', description: '조건문 elif' },
          { block: 'except', completion: ' Exception:\n    ', type: 'keyword', description: '예외 처리' }
        );
      }

      if (input.toLowerCase().startsWith('t') || input === '') {
        suggestions.push(
          { block: 'try', completion: ':\n    \nexcept Exception:\n    ', type: 'keyword', description: '예외 처리' },
          { block: 'True', completion: '', type: 'keyword', description: '참 값' }
        );
      }
    }

    // JavaScript 추천
    if (language === 'javascript') {
      if (input.toLowerCase().startsWith('f') || input === '') {
        suggestions.push(
          { block: 'function', completion: ' name() {\n    \n}', type: 'keyword', description: '함수 정의' },
          { block: 'for', completion: ' (let i = 0; i < length; i++) {\n    \n}', type: 'keyword', description: '반복문' }
        );
      }
      
      if (input.toLowerCase().startsWith('c') || input === '') {
        suggestions.push(
          { block: 'console.log', completion: '("")', type: 'function', description: '콘솔 출력' },
          { block: 'const', completion: ' variable = ', type: 'keyword', description: '상수 선언' }
        );
      }
    }

    // 선언된 변수들을 추천에 추가
    declaredVariables.forEach(varName => {
      if (varName.toLowerCase().includes(input.toLowerCase()) || input === '') {
        suggestions.push({
          block: varName,
          completion: '',
          type: 'variable',
          description: '선언된 변수'
        });
      }
    });

    return suggestions.filter(s => 
      s.block.toLowerCase().includes(input.toLowerCase()) || input === ''
    ).slice(0, 8); // 더 많은 추천을 보여주기 위해 8개로 증가
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'keyword': return <Zap className="h-3 w-3" />;
      case 'function': return <Code className="h-3 w-3" />;
      case 'variable': return <Hash className="h-3 w-3" />;
      case 'method': return <Type className="h-3 w-3" />;
      default: return <Code className="h-3 w-3" />;
    }
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
    <Card className="p-3 m-2">
      <div className="mb-2">
        <p className="text-xs text-muted-foreground font-medium">추천 블록</p>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {suggestions.map((suggestion, index) => (
          <Button
            key={index}
            variant="ghost"
            className="h-auto p-3 flex flex-col items-start space-y-1 hover:bg-primary/10 border border-border/50"
            onClick={() => onBlockSelect(suggestion.block, suggestion.completion)}
          >
            <div className="flex items-center space-x-2 w-full">
              <Badge variant="secondary" className={`text-xs ${getTypeColor(suggestion.type)}`}>
                {getTypeIcon(suggestion.type)}
                <span className="ml-1">{suggestion.block}</span>
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground text-left">
              {suggestion.description}
            </p>
          </Button>
        ))}
      </div>
      
      <div className="mt-3 pt-2 border-t border-border">
        <p className="text-xs text-muted-foreground">
          💡 "{input}" 입력 중... 탭하여 선택하세요
        </p>
      </div>
    </Card>
  );
};
