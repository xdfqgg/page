import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Login — 管理员登录
 *
 * 输入 GitHub Personal Access Token 来验证身份。
 * Token 仅存在浏览器中，不会上传到任何服务器。
 */
export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [inputToken, setInputToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputToken.trim()) return;

    setLoading(true);
    setError("");

    const ok = await login(inputToken.trim());
    setLoading(false);

    if (ok) {
      navigate("/");
    } else {
      setError("Token 无效，请检查后重试");
    }
  };

  return (
    <div className="mx-auto max-w-sm px-6 py-24">
      <Card className="border-primary/[0.1] bg-card">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">管理员登录</CardTitle>
          <CardDescription>
            输入 GitHub Personal Access Token 验证身份
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="password"
              placeholder="ghp_xxxxxxxxxxxx"
              value={inputToken}
              onChange={(e) => setInputToken(e.target.value)}
              autoFocus
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Token 仅存储在浏览器本地，不会上传到任何服务器。
            </p>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "验证中..." : "登录"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
