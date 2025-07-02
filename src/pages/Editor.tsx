import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Save, Plus, Minus, Type, Blocks, Play, Copy, Share, GitBranch, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { BlockSuggestions } from '@/components/BlockSuggestions';
import { CodeEditor } from '@/components/CodeEditor';

const Editor = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [code, setCode] = useState('');
  const [isBlockMode, setIsBlockMode] = useState(true); // 블록 모드를 기본값으로 변경
  const [currentLine, setCurrentLine] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [history, setHistory] = useState<string[]>(['']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentInput, setCurrentInput] = useState('');
  const [showGitCommands, setShowGitCommands] = useState(false);
  const [gitCommand, setGitCommand] = useState('');
  
  const fileName = searchParams.get('file') || 'untitled.py';
  const language = searchParams.get('lang') || 'python';
  const mode = searchParams.get('mode') || 'new';
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 언어 표시명 함수
  const getLanguageDisplayName = (lang: string) => {
    if (lang === 'python') return 'Python';
    return `${lang.charAt(0).toUpperCase() + lang.slice(1)} (준비중)`;
  };

  useEffect(() => {
    if (mode === 'edit') {
      // 기존 파일 로드 (목업)
      const mockCode = `# ${fileName}
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

# 테스트
for i in range(10):
    print(f"F({i}) = {fibonacci(i)}")`;
      setCode(mockCode);
      setHistory([mockCode]);
    }
  }, [fileName, mode]);

  const addToHistory = (newCode: string) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newCode);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setCode(history[newIndex]);
      toast({ title: "되돌리기 완료" });
    }
  };

  const handleSave = () => {
    // 저장 로직 (목업)
    toast({ 
      title: "파일 저장 완료", 
      description: `${fileName}이(가) 저장되었습니다.` 
    });
  };

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    
    if (isBlockMode) {
      const lines = newCode.split('\n');
      const currentLineText = lines[currentLine] || '';
      const words = currentLineText.trim().split(' ');
      const lastWord = words[words.length - 1];
      
      setCurrentInput(lastWord);
      setShowSuggestions(lastWord.length > 0);
    }
  };

  const handleBlockSelect = (block: string, completion: string) => {
    const lines = code.split('\n');
    let targetLine = currentLine;
    // textareaRef에서 실제 커서 위치로 줄 번호 계산
    if (textareaRef.current) {
      const cursorPos = textareaRef.current.selectionStart;
      const textBeforeCursor = code.substring(0, cursorPos);
      targetLine = textBeforeCursor.split('\n').length - 1;
    }
    const currentLineText = lines[targetLine] || '';
    const words = currentLineText.trim().split(' ');
    words[words.length - 1] = block;
    lines[targetLine] = '  '.repeat(getIndentLevel(targetLine)) + words.join(' ') + completion;
    const newCode = lines.join('\n');
    setCode(newCode);
    addToHistory(newCode);
    setShowSuggestions(false);
    setCurrentInput('');
    toast({ title: `"${block}" 블록 적용됨` });
  };

  const getIndentLevel = (lineIndex: number) => {
    const lines = code.split('\n');
    let indentLevel = 0;
    
    for (let i = 0; i <= lineIndex; i++) {
      const line = lines[i]?.trim() || '';
      if (line.endsWith(':')) {
        indentLevel++;
      }
    }
    return Math.max(0, indentLevel);
  };

  const handleIndent = (increase: boolean) => {
    if (!textareaRef.current) return;
    
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const lines = code.split('\n');
    const startLine = code.substring(0, start).split('\n').length - 1;
    const endLine = code.substring(0, end).split('\n').length - 1;
    
    for (let i = startLine; i <= endLine; i++) {
      if (increase) {
        lines[i] = '  ' + lines[i];
      } else {
        if (lines[i].startsWith('  ')) {
          lines[i] = lines[i].substring(2);
        }
      }
    }
    
    const newCode = lines.join('\n');
    setCode(newCode);
    addToHistory(newCode);
  };

  const handleGitCommand = () => {
    if (!gitCommand.trim()) return;
    
    // 목업 깃 명령어 실행
    toast({ 
      title: "Git 명령어 실행됨", 
      description: `$ ${gitCommand}` 
    });
    setGitCommand('');
    setShowGitCommands(false);
  };

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center">
      {/* 모바일 비율 컨테이너 */}
      <div className="w-[375px] h-screen bg-background flex flex-col border-l border-r border-border">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-card">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-semibold text-sm">{fileName}</h1>
              <p className="text-xs text-muted-foreground">{getLanguageDisplayName(language)}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" onClick={handleSave}>
              <Save className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowGitCommands(!showGitCommands)}
            >
              <GitBranch className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Git 명령어 입력창 */}
        {showGitCommands && (
          <div className="p-3 border-b border-border bg-card/50">
            <div className="flex items-center space-x-2">
              <Terminal className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="git add . && git commit -m 'message'"
                value={gitCommand}
                onChange={(e) => setGitCommand(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleGitCommand()}
                className="flex-1 h-8 text-xs font-mono"
              />
              <Button size="sm" onClick={handleGitCommand} disabled={!gitCommand.trim()}>
                실행
              </Button>
            </div>
          </div>
        )}

        {/* 모드 전환 */}
        <div className="p-4 border-b border-border bg-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Type className="h-4 w-4" />
                <Label htmlFor="mode-switch">수기</Label>
                <Switch
                  id="mode-switch"
                  checked={isBlockMode}
                  onCheckedChange={setIsBlockMode}
                />
                <Label htmlFor="mode-switch">블록</Label>
                <Blocks className="h-4 w-4" />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon" onClick={handleUndo} disabled={historyIndex === 0}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" disabled={historyIndex >= history.length - 1}>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* 코드 에디터 - 상단 35% */}
        <div className="flex flex-col h-[35vh]">
          <CodeEditor
            ref={textareaRef}
            code={code}
            onChange={handleCodeChange}
            onCursorChange={(line, pos) => {
              setCurrentLine(line);
              setCursorPosition(pos);
            }}
            language={language}
            className="flex-1"
          />
        </div>

        {/* 하단바 - 화면의 65% 차지 */}
        <div className="h-[55vh] bg-card border-t border-border flex flex-col">
          {/* 블록 추천 영역 */}
          {isBlockMode && (showSuggestions || currentInput === '') && (
            <div className="border-b border-border bg-card p-3">
              <div className="flex items-center space-x-3">
                <Button variant="ghost" size="icon" onClick={() => handleIndent(false)}>
                  <Minus className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleIndent(true)}>
                  <Plus className="h-4 w-4" />
                </Button>
                <div className="flex-1 overflow-x-auto">
                  <div className="flex space-x-2 min-w-max">
                    <BlockSuggestions
                      input={currentInput}
                      language={language}
                      code={code}
                      onBlockSelect={handleBlockSelect}
                      cursorLine={currentLine}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* 빈 공간 (블록 추천이 없을 때) */}
          {(!isBlockMode || !showSuggestions) && (
            <div className="flex-1 p-8 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Blocks className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">
                  {isBlockMode ? "코드를 입력하면 블록 추천이 나타납니다. 또는 아무것도 입력하지 않아도 추천이 표시됩니다." : "블록 모드를 켜서 자동 완성을 사용하세요"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 최하단 고정 툴바 */}
        <div className="p-4 border-t border-border bg-card/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              줄 {currentLine + 1}, 열 {cursorPosition}
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="opacity-60">
                <Play className="h-4 w-4 mr-1" />
                실행
              </Button>
              <Button variant="ghost" size="sm" className="opacity-60">
                <Copy className="h-4 w-4 mr-1" />
                복사
              </Button>
              <Button variant="ghost" size="sm" className="opacity-60">
                <Share className="h-4 w-4 mr-1" />
                공유
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Editor;
