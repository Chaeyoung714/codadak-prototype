
import { useState } from 'react';
import { Plus, FileText, GitBranch, Download, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const Index = () => {
  const navigate = useNavigate();
  const [newFileName, setNewFileName] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('python');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // 저장된 파일 목업 데이터
  const savedFiles = [
    { id: 1, name: 'algorithm_practice.py', language: 'python', lastModified: '2시간 전', lines: 45 },
    { id: 2, name: 'web_scraper.js', language: 'javascript', lastModified: '1일 전', lines: 123 },
    { id: 3, name: 'data_analysis.py', language: 'python', lastModified: '3일 전', lines: 89 },
  ];

  const handleCreateFile = () => {
    if (newFileName.trim()) {
      navigate(`/editor?file=${encodeURIComponent(newFileName)}&lang=${selectedLanguage}&mode=new`);
      setIsCreateDialogOpen(false);
      setNewFileName('');
    }
  };

  const handleOpenFile = (file: any) => {
    navigate(`/editor?file=${encodeURIComponent(file.name)}&lang=${file.language}&mode=edit&id=${file.id}`);
  };

  const getLanguageColor = (lang: string) => {
    switch (lang) {
      case 'python': return 'text-blue-400';
      case 'javascript': return 'text-yellow-400';
      case 'java': return 'text-red-400';
      case 'cpp': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center">
      {/* 모바일 비율 컨테이너 */}
      <div className="w-[375px] h-screen bg-background p-4 overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              코다닥
            </h1>
            <p className="text-muted-foreground mt-1">모바일 블록 코딩 플랫폼</p>
          </div>
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
        </div>

        {/* 메인 액션 버튼들 */}
        <div className="grid grid-cols-1 gap-4 mb-8">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Card className="cursor-pointer hover:bg-card/80 transition-colors border-dashed border-2 border-primary/50">
                <CardContent className="flex items-center justify-center p-8">
                  <div className="text-center">
                    <Plus className="h-12 w-12 text-primary mx-auto mb-3" />
                    <h3 className="text-lg font-semibold">새로운 파일 생성하기</h3>
                    <p className="text-sm text-muted-foreground mt-1">빈 파일에서 코딩을 시작하세요</p>
                  </div>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>새 파일 생성</DialogTitle>
                <DialogDescription>
                  새로운 코딩 파일을 생성합니다.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="filename">파일명</Label>
                  <Input
                    id="filename"
                    placeholder="예: my_algorithm.py"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="language">언어</Label>
                  <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="python">Python</SelectItem>
                      <SelectItem value="javascript">JavaScript (준비중)</SelectItem>
                      <SelectItem value="java">Java (준비중)</SelectItem>
                      <SelectItem value="cpp">C++ (준비중)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreateFile} className="w-full">
                  생성하기
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <div className="grid grid-cols-2 gap-4">
            <Card className="cursor-pointer hover:bg-card/80 transition-colors opacity-60">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <GitBranch className="h-8 w-8 text-muted-foreground mb-2" />
                <h3 className="text-sm font-semibold text-center">Git에서 가져오기</h3>
                <p className="text-xs text-muted-foreground mt-1 text-center">준비중</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:bg-card/80 transition-colors opacity-60">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <Download className="h-8 w-8 text-muted-foreground mb-2" />
                <h3 className="text-sm font-semibold text-center">파일 불러오기</h3>
                <p className="text-xs text-muted-foreground mt-1 text-center">준비중</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 저장된 파일 목록 */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            저장된 파일
          </h2>
          
          {savedFiles.length > 0 ? (
            <div className="space-y-3">
              {savedFiles.map((file) => (
                <Card 
                  key={file.id} 
                  className="cursor-pointer hover:bg-card/80 transition-colors"
                  onClick={() => handleOpenFile(file)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{file.name}</CardTitle>
                      <span className={`text-xs px-2 py-1 rounded ${getLanguageColor(file.language)} bg-muted`}>
                        {file.language}
                      </span>
                    </div>
                    <CardDescription className="flex items-center justify-between text-xs">
                      <span>{file.lines}줄</span>
                      <span>{file.lastModified}</span>
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center p-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">저장된 파일이 없습니다.</p>
                <p className="text-sm text-muted-foreground mt-1">새 파일을 생성해보세요!</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
