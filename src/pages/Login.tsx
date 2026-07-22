import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Login — 登录 / 注册页面
 */
export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("请填写用户名和密码");
      return;
    }

    setLoading(true);
    setError("");

    const result = isRegister
      ? await register(username, password)
      : await login(username, password);

    setLoading(false);

    if (result.ok) {
      navigate("/");
    } else {
      setError(result.error || "操作失败");
    }
  };

  return (
    <div className="mx-auto max-w-sm px-6 py-24">
      <Card className="border-primary/[0.1] bg-card">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">
            {isRegister ? "注册" : "登录"}
          </CardTitle>
          <CardDescription>
            {isRegister ? "创建一个新账号" : "登录你的账号"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">用户名</Label>
              <Input
                id="username"
                placeholder="请输入用户名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "处理中..." : isRegister ? "注册" : "登录"}
            </Button>
          </form>
        </CardContent>
        <Separator className="bg-primary/[0.08]" />
        <CardFooter className="justify-center pt-4">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError("");
            }}
            className="text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer"
          >
            {isRegister ? "已有账号？去登录" : "没有账号？去注册"}
          </button>
        </CardFooter>
      </Card>
    </div>
  );
}
