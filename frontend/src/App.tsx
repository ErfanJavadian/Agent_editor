import { useCallback, useEffect, useState } from "react";

type HealthPayload = {
  status: "ok";
  app: string;
  version: string;
};

type ConnectionState = "checking" | "online" | "offline";

type NangoStatus = {
  configured: boolean;
  provider: string;
};

type ConnectPayload = {
  connect_url: string;
  expires_at: string | null;
  provider: string;
};

type ToolSearchPayload = {
  results: unknown;
};

async function readError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { detail?: string };
    return payload.detail ?? `درخواست ناموفق بود (HTTP ${response.status})`;
  } catch {
    return `درخواست ناموفق بود (HTTP ${response.status})`;
  }
}

export default function App() {
  const [connection, setConnection] = useState<ConnectionState>("checking");
  const [health, setHealth] = useState<HealthPayload | null>(null);
  const [nangoStatus, setNangoStatus] = useState<NangoStatus | null>(null);
  const [nangoBusy, setNangoBusy] = useState(false);
  const [nangoMessage, setNangoMessage] = useState("");
  const [connectUrl, setConnectUrl] = useState("");
  const [toolResult, setToolResult] = useState("");

  const checkBackend = useCallback(async () => {
    setConnection("checking");
    try {
      const response = await fetch("/api/v1/health", {
        headers: { Accept: "application/json" }
      });
      if (!response.ok) throw new Error("Backend health check failed");

      const payload = (await response.json()) as HealthPayload;
      setHealth(payload);
      setConnection("online");
    } catch {
      setHealth(null);
      setConnection("offline");
    }
  }, []);

  const checkNango = useCallback(async () => {
    try {
      const response = await fetch("/api/v1/integrations/nango/status", {
        headers: { Accept: "application/json" }
      });
      if (!response.ok) throw new Error("Nango status check failed");
      setNangoStatus((await response.json()) as NangoStatus);
    } catch {
      setNangoStatus(null);
    }
  }, []);

  useEffect(() => {
    void checkBackend();
    void checkNango();
  }, [checkBackend, checkNango]);

  const connectGithub = async () => {
    setNangoBusy(true);
    setNangoMessage("");
    setConnectUrl("");
    try {
      const response = await fetch("/api/v1/integrations/nango/github/connect", {
        method: "POST",
        headers: { Accept: "application/json" }
      });
      if (!response.ok) throw new Error(await readError(response));
      const payload = (await response.json()) as ConnectPayload;
      setConnectUrl(payload.connect_url);
      setNangoMessage("لینک اتصال ساخته شد. آن را باز کن و دسترسی GitHub را تأیید کن.");
    } catch (error) {
      setNangoMessage(error instanceof Error ? error.message : "ساخت لینک اتصال ناموفق بود.");
    } finally {
      setNangoBusy(false);
    }
  };

  const discoverGithubTools = async () => {
    setNangoBusy(true);
    setNangoMessage("");
    setToolResult("");
    try {
      const response = await fetch("/api/v1/integrations/nango/tools/search", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          queries: ["read repository details", "list repository branches"],
          goal: "Discover read-only GitHub tools for the Agent Editor integration test."
        })
      });
      if (!response.ok) throw new Error(await readError(response));
      const payload = (await response.json()) as ToolSearchPayload;
      setToolResult(JSON.stringify(payload.results, null, 2));
      setNangoMessage("جست‌وجوی ابزارها از طریق MCP انجام شد.");
    } catch (error) {
      setNangoMessage(error instanceof Error ? error.message : "جست‌وجوی ابزارها ناموفق بود.");
    } finally {
      setNangoBusy(false);
    }
  };

  const statusText = {
    checking: "در حال بررسی اتصال",
    online: "Backend متصل است",
    offline: "Backend در دسترس نیست"
  }[connection];

  return (
    <main className="shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Agent Editor home">
          <span className="brand-mark">AE</span>
          <span className="brand-copy">
            <strong>AGENT EDITOR</strong>
            <small>PRIVATE WORKBENCH</small>
          </span>
        </a>
        <span className="version-tag">نسخه ۰.۱.۰ · فاز ۱</span>
      </header>

      <section className="hero">
        <div className="eyebrow"><span className="eyebrow-dot" /> محیط مهندسی اختصاصی</div>
        <h1>از تعریف Agent<br /><span>تا اجرای کنترل‌شده.</span></h1>
        <p className="hero-copy">
          فضای کاری خصوصی برای طراحی، ساخت، آزمایش و ارتقای Agentهای هوش مصنوعی.
          زیرساخت اولیه آماده شده و اکنون در حال اتصال اجزای اصلی است.
        </p>
      </section>

      <section className="status-panel" aria-live="polite">
        <div className="status-main">
          <div className="status-icon" data-state={connection}>
            {connection === "online" ? "✓" : connection === "offline" ? "!" : "…"}
          </div>
          <div>
            <span className="panel-label">وضعیت زیرساخت محلی</span>
            <h2>{statusText}</h2>
            <p>
              {health
                ? health.app + " · API " + health.version
                : connection === "offline"
                  ? "سرور Backend را اجرا کن و دوباره بررسی را بزن."
                  : "در حال دریافت پاسخ از API محلی…"}
            </p>
          </div>
        </div>
        <button className="refresh-button" onClick={() => void checkBackend()} disabled={connection === "checking"}>
          {connection === "checking" ? "بررسی…" : "بررسی دوباره"}
        </button>
      </section>

      <section className="integration-panel">
        <div className="integration-heading">
          <div>
            <span className="panel-label">اتصال سرویس‌های خارجی · MCP</span>
            <h2>Nango Integration</h2>
          </div>
          <span className={nangoStatus?.configured ? "integration-badge ready" : "integration-badge"}>
            {nangoStatus?.configured ? "API Key configured" : "نیازمند تنظیم"}
          </span>
        </div>

        <p className="integration-description">
          اتصال امن GitHub از طریق Nango. کلید اصلی فقط روی Backend نگهداری می‌شود؛
          Agent یک نشست کوتاه‌مدت MCP دریافت می‌کند و مستقیماً به رمزهای OAuth دسترسی ندارد.
        </p>

        {!nangoStatus?.configured && (
          <p className="integration-note">
            ابتدا مدیر بزرگسال حساب Nango باید کلید محیط را در فایل محلی <code>.env</code>
            با نام <code>NANGO_API_KEY</code> قرار دهد. کلید را داخل این صفحه یا GitHub وارد نکن.
          </p>
        )}

        <div className="integration-actions">
          <button
            className="refresh-button"
            onClick={() => void connectGithub()}
            disabled={!nangoStatus?.configured || nangoBusy}
          >
            {nangoBusy ? "در حال اتصال…" : "ساخت لینک اتصال GitHub"}
          </button>
          <button
            className="refresh-button secondary-button"
            onClick={() => void discoverGithubTools()}
            disabled={!nangoStatus?.configured || nangoBusy}
          >
            کشف ابزارهای GitHub
          </button>
        </div>

        {connectUrl && (
          <a className="connect-link" href={connectUrl} target="_blank" rel="noreferrer">
            باز کردن صفحه تأیید دسترسی GitHub
          </a>
        )}
        {nangoMessage && <p className="integration-message" role="status">{nangoMessage}</p>}
        {toolResult && <pre className="integration-result" dir="ltr">{toolResult}</pre>}
      </section>

      <section className="section-heading">
        <div>
          <span className="panel-label">معماری محصول</span>
          <h2>ماژول‌های اصلی</h2>
        </div>
        <span className="section-note">نقشه قابلیت‌های V1</span>
      </section>

      <section className="module-grid">
        <article className="module-card active-card">
          <span className="module-index">01 / CORE</span>
          <div className="module-symbol">◈</div>
          <h3>هسته Agent</h3>
          <p>چرخه اجرا، مدیریت وظایف و کنترل وضعیت هر Agent.</p>
          <span className="module-state">در حال ساخت</span>
        </article>
        <article className="module-card">
          <span className="module-index">02 / MODELS</span>
          <div className="module-symbol">◎</div>
          <h3>درگاه مدل‌ها</h3>
          <p>اتصال یکپارچه به ارائه‌دهندگان مختلف مدل‌های هوش مصنوعی.</p>
          <span className="module-state planned">در نقشه راه</span>
        </article>
        <article className="module-card active-card">
          <span className="module-index">03 / TOOLS</span>
          <div className="module-symbol">⌘</div>
          <h3>ابزارها و مهارت‌ها</h3>
          <p>اتصال Nango، کشف ابزارهای API و مدیریت نشست‌های MCP.</p>
          <span className="module-state">پل اتصال Nango پیاده‌سازی شد</span>
        </article>
        <article className="module-card">
          <span className="module-index">04 / MEMORY</span>
          <div className="module-symbol">▤</div>
          <h3>حافظه و فضای کار</h3>
          <p>مدیریت دانش پروژه و اطلاعات ماندگار با کنترل کاربر.</p>
          <span className="module-state planned">در نقشه راه</span>
        </article>
        <article className="module-card">
          <span className="module-index">05 / CONTROL</span>
          <div className="module-symbol">◫</div>
          <h3>مرکز کنترل</h3>
          <p>مشاهده اجراها، بررسی رویدادها و تأیید عملیات حساس.</p>
          <span className="module-state">پوسته اولیه آماده</span>
        </article>
        <article className="module-card">
          <span className="module-index">06 / EVALUATION</span>
          <div className="module-symbol">⌁</div>
          <h3>آزمایش و ارزیابی</h3>
          <p>سنجش کیفیت، ثبت خطا و مقایسه نسخه‌های Agent.</p>
          <span className="module-state planned">در نقشه راه</span>
        </article>
      </section>

      <footer className="footer">
        <span>AGENT EDITOR</span>
        <span>محیط خصوصی · Local-first · Single-user</span>
      </footer>
    </main>
  );
}
