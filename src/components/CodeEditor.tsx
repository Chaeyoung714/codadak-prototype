import { forwardRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface CodeEditorProps {
  code: string;
  onChange: (code: string) => void;
  onCursorChange: (line: number, position: number) => void;
  language: string;
  className?: string;
}

export const CodeEditor = forwardRef<HTMLTextAreaElement, CodeEditorProps>(
  ({ code, onChange, onCursorChange, language, className }, ref) => {
    const [lineNumbers, setLineNumbers] = useState<number[]>([]);

    useEffect(() => {
      const lines = code.split('\n');
      setLineNumbers(Array.from({ length: lines.length }, (_, i) => i + 1));
    }, [code]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newCode = e.target.value;
      onChange(newCode);
      
      // 커서 위치 계산
      const cursorPos = e.target.selectionStart;
      const textBeforeCursor = newCode.substring(0, cursorPos);
      const lines = textBeforeCursor.split('\n');
      const currentLine = lines.length - 1;
      const currentPosition = lines[lines.length - 1].length;
      
      onCursorChange(currentLine, currentPosition);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const textarea = e.target as HTMLTextAreaElement;
      
      // Tab 키 처리
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newCode = code.substring(0, start) + '  ' + code.substring(end);
        onChange(newCode);
        
        // 커서 위치 조정
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 2;
        }, 0);
      }
      
      // Enter 키 처리 (자동 들여쓰기)
      if (e.key === 'Enter') {
        const start = textarea.selectionStart;
        const lines = code.substring(0, start).split('\n');
        const currentLine = lines[lines.length - 1];
        const indent = currentLine.match(/^(\s*)/)?.[1] || '';
        
        // 이전 줄이 :로 끝나면 추가 들여쓰기
        const additionalIndent = currentLine.trim().endsWith(':') ? '  ' : '';
        
        e.preventDefault();
        const newCode = code.substring(0, start) + '\n' + indent + additionalIndent + code.substring(start);
        onChange(newCode);
        
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 1 + indent.length + additionalIndent.length;
        }, 0);
      }
    };

    // 간단한 문법 하이라이팅을 위한 함수
    const highlightCode = (code: string) => {
      if (language === 'python') {
        return code.replace(
          /(def|class|if|else|elif|for|while|try|except|import|from|return|pass|break|continue|and|or|not|in|is|True|False|None)\b/g,
          '<span class="code-keyword">$1</span>'
        ).replace(
          /(["'])((?:\\.|(?!\1)[^\\])*?)\1/g,
          '<span class="code-string">$&</span>'
        ).replace(
          /#.*/g,
          '<span class="code-comment">$&</span>'
        ).replace(
          /\b(\d+\.?\d*)\b/g,
          '<span class="code-number">$1</span>'
        );
      }
      return code;
    };

    return (
      <div className={cn("flex-1 flex bg-background h-full", className)}>
        {/* 줄 번호 */}
        <div className="bg-muted/30 p-4 pr-3 border-r border-border min-w-[3rem] text-right">
          {lineNumbers.map((num) => (
            <div
              key={num}
              className="text-xs text-muted-foreground leading-6 font-mono select-none"
            >
              {num}
            </div>
          ))}
        </div>
        
        {/* 코드 에디터 */}
        <div className="flex-1 relative">
          <textarea
            ref={ref}
            value={code}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            className={cn(
              "w-full h-full p-4 bg-transparent text-foreground font-mono text-sm leading-6",
              "resize-none outline-none border-none",
              "placeholder:text-muted-foreground",
              className
            )}
            placeholder={`${language} 코드를 작성하세요...`}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            style={{
              tabSize: 2
            }}
          />
          
          {/* 문법 하이라이팅 오버레이 (미래 개선사항) */}
          {/* <div 
            className="absolute inset-0 p-4 pointer-events-none font-mono text-sm leading-6 whitespace-pre-wrap overflow-hidden"
            dangerouslySetInnerHTML={{ __html: highlightCode(code) }}
          /> */}
        </div>
      </div>
    );
  }
);
